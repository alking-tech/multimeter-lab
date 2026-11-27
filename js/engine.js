/*
 * engine.js — محرّك حل الدوائر الكهربائية
 * ------------------------------------------------------------
 * يحل الدائرة بطريقة "تحليل العُقد" (Nodal Analysis):
 *   G · v = J
 * حيث G مصفوفة الموصلية، v جهود العُقد، J التيارات المحقونة.
 *
 * العناصر المدعومة (كل عنصر له طرفان a و b):
 *   R : مقاومة                 {t:'R', a, b, R}
 *   V : مصدر جهد بمقاومة داخلية {t:'V', a:(+), b:(−), V, r}
 *       (يُحوَّل إلى مكافئ نورتن: مصدر تيار V/r مع موصلية 1/r)
 *   I : مصدر تيار يدفع I داخل العقدة a ويسحبه من b   {t:'I', a, b, I}
 *   D : دايود (معادلة شوكلي) a = الأنود، b = الكاثود  {t:'D', a, b, Is, n}
 *
 * الدايود عنصر غير خطي، لذلك نستخدم طريقة نيوتن-رافسون مع
 * تحديد خطوة الجهد (pnjlim) كما في برامج SPICE.
 */
(function () {
  'use strict';

  const VT = 0.025852;      // الجهد الحراري عند 27°C
  const GLEAK = 1e-9;       // تسريب صغير جداً لكل عقدة (1GΩ) حتى لا تكون المصفوفة شاذة
  const GMIN = 1e-12;

  function gaussSolve(A, b) {
    const n = b.length;
    for (let c = 0; c < n; c++) {
      let p = c, best = Math.abs(A[c][c]);
      for (let r = c + 1; r < n; r++) {
        const v = Math.abs(A[r][c]);
        if (v > best) { best = v; p = r; }
      }
      if (best === 0) continue;
      if (p !== c) { [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]]; }
      const piv = A[c][c];
      for (let r = c + 1; r < n; r++) {
        const f = A[r][c] / piv;
        if (f === 0) continue;
        const rowR = A[r], rowC = A[c];
        for (let k = c; k < n; k++) rowR[k] -= f * rowC[k];
        b[r] -= f * b[c];
      }
    }
    const x = new Float64Array(n);
    for (let r = n - 1; r >= 0; r--) {
      let s = b[r];
      for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k];
      x[r] = A[r][r] !== 0 ? s / A[r][r] : 0;
    }
    return x;
  }

  function diodeIV(vd, d) {
    const nvt = d.n * VT;
    const x = vd / nvt;
    const XMAX = 60;
    let id, gd;
    if (x > XMAX) {            // امتداد خطي لتفادي الفيض العددي
      const e = Math.exp(XMAX);
      id = d.Is * (e * (1 + (x - XMAX)) - 1);
      gd = d.Is * e / nvt;
    } else {
      const e = Math.exp(x);
      id = d.Is * (e - 1);
      gd = d.Is * e / nvt;
    }
    return { id: id + GMIN * vd, gd: gd + GMIN };
  }

  function pnjlim(vnew, vold, d) {
    const nvt = d.n * VT;
    const vcrit = nvt * Math.log(nvt / (Math.SQRT2 * d.Is));
    if (vnew > vcrit && Math.abs(vnew - vold) > 2 * nvt) {
      if (vold > 0) {
        const arg = 1 + (vnew - vold) / nvt;
        vnew = arg > 0 ? vold + nvt * Math.log(arg) : vcrit;
      } else {
        vnew = nvt * Math.log(Math.max(vnew / nvt, 1e-12));
      }
    }
    return vnew;
  }

  /**
   * يحل الدائرة ويعيد:
   *   v(node)  → جهد العقدة بالفولت (بالنسبة للأرضي المرجعي)
   *   i(id)    → التيار في العنصر من a إلى b (للمقاومة والدايود) أو التيار المُخرَج (للمصدر)
   */
  function solve(elements) {
    const idx = new Map();
    const add = k => { if (k != null && !idx.has(k)) idx.set(k, idx.size); };
    for (const e of elements) { add(e.a); add(e.b); }
    const N = idx.size;
    const diodes = elements.filter(e => e.t === 'D');
    let vd = diodes.map(() => 0.6);
    let x = new Float64Array(N);

    const maxIt = diodes.length ? 300 : 1;
    for (let it = 0; it < maxIt; it++) {
      const G = Array.from({ length: N }, () => new Float64Array(N));
      const J = new Float64Array(N);
      const stamp = (a, b, g) => {
        const i = idx.get(a), j = idx.get(b);
        G[i][i] += g; G[j][j] += g; G[i][j] -= g; G[j][i] -= g;
      };
      const inj = (a, cur) => { J[idx.get(a)] += cur; };
      for (let i = 0; i < N; i++) G[i][i] += GLEAK;

      for (const e of elements) {
        if (e.a === e.b) continue;
        if (e.t === 'R') stamp(e.a, e.b, 1 / Math.max(e.R, 1e-6));
        else if (e.t === 'V') {
          const g = 1 / Math.max(e.r, 1e-4);
          stamp(e.a, e.b, g); inj(e.a, e.V * g); inj(e.b, -e.V * g);
        } else if (e.t === 'I') { inj(e.a, e.I); inj(e.b, -e.I); }
      }
      diodes.forEach((d, k) => {
        if (d.a === d.b) return;
        const { id, gd } = diodeIV(vd[k], d);
        const ieq = id - gd * vd[k];
        stamp(d.a, d.b, gd); inj(d.a, -ieq); inj(d.b, ieq);
      });

      x = gaussSolve(G, J);
      if (!diodes.length) break;

      let conv = true;
      diodes.forEach((d, k) => {
        const raw = x[idx.get(d.a)] - x[idx.get(d.b)];
        const lim = pnjlim(raw, vd[k], d);
        if (Math.abs(lim - vd[k]) > 1e-7) conv = false;
        vd[k] = lim;
      });
      if (conv) break;
    }

    const v = node => (idx.has(node) ? x[idx.get(node)] : 0);
    const byId = new Map(elements.filter(e => e.id).map(e => [e.id, e]));
    const i = id => {
      const e = byId.get(id);
      if (!e) return 0;
      const vab = v(e.a) - v(e.b);
      if (e.t === 'R') return vab / Math.max(e.R, 1e-6);
      if (e.t === 'V') return (e.V - vab) / Math.max(e.r, 1e-4);
      if (e.t === 'I') return e.I;
      if (e.t === 'D') return diodeIV(vab, e).id;
      return 0;
    };
    return { v, i };
  }

  window.Engine = { solve, VT };
})();
