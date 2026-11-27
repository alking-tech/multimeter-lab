/*
 * meter.js — نموذج جهاز الملتيميتر (السلوك الكهربائي الحقيقي)
 * ------------------------------------------------------------
 * الجهاز نفسه يدخل في الدائرة كعنصر كهربائي، وهذا ما يجعل المحاكاة واقعية:
 *   • وضع الجهد   → مقاومة كبيرة 10MΩ بين المجسين (يوصل على التوازي)
 *   • وضع التيار  → مقاومة صغيرة جداً "shunt" (يوصل على التوالي)
 *   • وضع المقاومة/الدايود/الاستمرارية → مصدر تيار صغير معروف
 * لذلك لو وضعت الجهاز على وضع التيار ووصلته على طرفي بطارية،
 * سيمر تيار كبير فعلاً وينصهر الفيوز — تماماً كما في الواقع.
 */
(function () {
  'use strict';

  // مواضع المفتاح الدوّار مرتبة باتجاه عقارب الساعة بدءاً من OFF في الأعلى
  const P = (id, mode, label, o) => Object.assign({ id, mode, label }, o || {});
  const POSITIONS = [
    P('off', 'OFF', 'OFF'),
    P('v600', 'VDC', '600', { unit: 'V', scale: 1, dec: 0 }),
    P('v200', 'VDC', '200', { unit: 'V', scale: 1, dec: 1 }),
    P('v20', 'VDC', '20', { unit: 'V', scale: 1, dec: 2 }),
    P('v2', 'VDC', '2', { unit: 'V', scale: 1, dec: 3 }),
    P('v200m', 'VDC', '200m', { unit: 'mV', scale: 1e3, dec: 1 }),
    P('a10', 'ADC', '10A', { unit: 'A', scale: 1, dec: 2 }),
    P('a200m', 'ADC', '200m', { unit: 'mA', scale: 1e3, dec: 1, shunt: 1 }),
    P('a20m', 'ADC', '20m', { unit: 'mA', scale: 1e3, dec: 2, shunt: 10 }),
    P('a2m', 'ADC', '2m', { unit: 'mA', scale: 1e3, dec: 3, shunt: 100 }),
    P('a200u', 'ADC', '200µ', { unit: 'µA', scale: 1e6, dec: 1, shunt: 1000 }),
    P('cont', 'CONT', '•)))', { unit: 'Ω', scale: 1, dec: 1, itest: 1e-3 }),
    P('diode', 'DIODE', '▶|', { unit: 'V', scale: 1, dec: 3, itest: 1e-3 }),
    P('r2M', 'OHM', '2M', { unit: 'MΩ', scale: 1e-6, dec: 3, itest: 1e-7 }),
    P('r200k', 'OHM', '200k', { unit: 'kΩ', scale: 1e-3, dec: 1, itest: 1e-6 }),
    P('r20k', 'OHM', '20k', { unit: 'kΩ', scale: 1e-3, dec: 2, itest: 1e-5 }),
    P('r2k', 'OHM', '2k', { unit: 'kΩ', scale: 1e-3, dec: 3, itest: 1e-4 }),
    P('r200', 'OHM', '200', { unit: 'Ω', scale: 1, dec: 1, itest: 1e-3 }),
    P('vac200', 'VAC', '200', { unit: 'V', scale: 1, dec: 1 }),
    P('vac600', 'VAC', '600', { unit: 'V', scale: 1, dec: 0 }),
  ];

  const GROUPS = [
    { mode: 'VDC', sym: 'DCV', from: 1, to: 5 },
    { mode: 'ADC', sym: 'DCA', from: 6, to: 10 },
    { mode: 'CONT', sym: '', from: 11, to: 12 },
    { mode: 'OHM', sym: 'Ω', from: 13, to: 17 },
    { mode: 'VAC', sym: 'ACV', from: 18, to: 19 },
  ];

  const MODE_NAMES = {
    OFF: 'مطفأ', VDC: 'جهد مستمر', VAC: 'جهد متردد', ADC: 'تيار مستمر',
    OHM: 'مقاومة', CONT: 'استمرارية', DIODE: 'اختبار دايود',
  };

  const R_VOLT = 10e6;    // ممانعة الدخل في وضع الجهد
  const R_FUSE = 0.1;     // مقاومة فيوز mA
  const R_10A = 0.012;    // shunt مدخل 10A
  const FUSE_MA_LIMIT = 0.25;
  const FUSE_10A_LIMIT = 15;

  /** يبني العنصر الذي يمثّل الجهاز داخل الدائرة */
  function meterElements(st, forAC) {
    const R = st.red, B = st.black, p = st.pos;
    if (st.jack === 'A10') return st.fuse10 ? [{ t: 'R', a: R, b: B, R: R_10A, id: 'METER' }] : [];
    switch (p.mode) {
      case 'OFF': return [];
      case 'VDC': case 'VAC': return [{ t: 'R', a: R, b: B, R: R_VOLT, id: 'METER' }];
      case 'ADC':
        if (p.id === 'a10' || !st.fuseMA) return [];
        return [{ t: 'R', a: R, b: B, R: p.shunt + R_FUSE, id: 'METER' }];
      default:
        return [{ t: 'I', a: R, b: B, I: forAC ? 0 : p.itest, id: 'METER' }];
    }
  }

  /** نسخة من الدائرة: AC (تُصفَّر مصادر DC) أو DC (تُصفَّر مصادر AC) */
  function circuitFor(elems, ac) {
    const out = [];
    for (const e of elems) {
      if (e.t === 'V') out.push(Object.assign({}, e, { V: (!!e.ac === ac) ? e.V : 0 }));
      else if (e.t === 'D' && ac) continue;      // نهمل الدايودات في تحليل AC المبسّط
      else out.push(e);
    }
    return out;
  }

  /**
   * القياس الكامل.
   * st = {pos, jack:'V'|'A10', red:node, black:node, fuseMA, fuse10}
   * يعيد {value, ol, garbage, ac, events[], current(id)}
   */
  function measure(circuit, st) {
    const res = { value: 0, ol: false, garbage: false, events: [], current: () => 0, idc: () => 0, meterCurrent: 0 };
    const p = st.pos;
    const meterDC = meterElements(st, false);
    const meterAC = meterElements(st, true);

    const dc = Engine.solve(circuitFor(circuit, false).concat(meterDC));
    const ac = Engine.solve(circuitFor(circuit, true).concat(meterAC));
    const dV = s => s.v(st.red) - s.v(st.black);
    res.current = id => Math.hypot(dc.i(id), ac.i(id));
    res.idc = id => dc.i(id);

    // التيار المار في الجهاز (لفحص الفيوز وتحذير القِصَر)
    if (meterDC.length && meterDC[0].t === 'R') {
      const Idc = dV(dc) / meterDC[0].R, Iac = dV(ac) / meterDC[0].R;
      const Imag = Math.hypot(Idc, Iac);
      res.meterCurrent = Imag;
      const isA10 = st.jack === 'A10';
      if (!isA10 && p.mode === 'ADC' && Imag > FUSE_MA_LIMIT) res.events.push({ type: 'fuseMA', I: Imag });
      if (isA10 && Imag > FUSE_10A_LIMIT) res.events.push({ type: 'fuse10', I: Imag });
      else if (isA10 && Imag > 2) res.events.push({ type: 'short', I: Imag });
    }

    // هل يوجد جهد بين المجسين؟ (مهم لتحذير قياس المقاومة في دائرة موصولة بالكهرباء)
    const openProbe = () => {
      const probe = [{ t: 'R', a: st.red, b: st.black, R: R_VOLT }];
      const vdc = Engine.solve(circuitFor(circuit, false).concat(probe));
      const vac = Engine.solve(circuitFor(circuit, true).concat(probe));
      return { dc: vdc.v(st.red) - vdc.v(st.black), ac: vac.v(st.red) - vac.v(st.black) };
    };

    if (st.jack === 'A10') {
      res.value = p.id === 'a10' ? dV(dc) / R_10A : 0;
      res.ac = dV(ac) / R_10A;
    } else {
      switch (p.mode) {
        case 'OFF': break;
        case 'VDC': res.value = dV(dc); break;
        case 'VAC': res.value = Math.abs(dV(ac)); break;
        case 'ADC':
          res.value = (meterDC.length && p.id !== 'a10') ? dV(dc) / meterDC[0].R : 0;
          break;
        case 'OHM': case 'CONT': case 'DIODE': {
          const op = openProbe();
          if (Math.abs(op.dc) > 0.3 || Math.abs(op.ac) > 0.3) {
            res.garbage = true;
            res.events.push({ type: 'powered', v: Math.max(Math.abs(op.dc), Math.abs(op.ac)) });
          }
          const v = dV(dc);
          if (p.mode === 'DIODE') res.value = v;
          else {
            res.value = v / p.itest;
            if (res.value < 0) res.garbage = true;
          }
          break;
        }
      }
    }

    // تجاوز النطاق
    if (p.mode !== 'OFF') {
      const counts = Math.abs(res.value * p.scale) * Math.pow(10, p.dec);
      if (counts > 1999.4) res.ol = true;
      if (p.mode === 'DIODE' && res.value > 1.999) res.ol = true;
      if (res.garbage) res.ol = false;
    }
    return res;
  }

  /** تحويل القراءة إلى نص يظهر على الشاشة (3½ خانة) */
  function format(pos, value, ol, noise) {
    if (pos.mode === 'OFF') return '';
    if (ol) return 'OL';
    let v = value;
    const res = 1 / (pos.scale * Math.pow(10, pos.dec));
    if (noise) v += (Math.random() - 0.5) * res * 1.4;
    let n = v * pos.scale;
    let t = n.toFixed(pos.dec);
    if (/^-0\.?0*$/.test(t)) t = t.slice(1);
    return t;
  }

  function garbageText(pos) {
    const n = Math.floor(Math.random() * 1999);
    const s = String(n).padStart(4, '0');
    return pos.dec ? s.slice(0, 4 - pos.dec) + '.' + s.slice(4 - pos.dec) : s;
  }

  /* ════════════════════════════════════════════════════════════
   * الجهاز التناظري (أبو إبرة)
   * ────────────────────────────────────────────────────────────
   *  • حساسية 20kΩ/V في الجهد المستمر: الجهاز يسحب تياراً صغيراً،
   *    فيؤثر على الدوائر ذات المقاومة الكبيرة (تأثير التحميل).
   *  • في وضع Ω يستخدم بطارية داخلية، والمجس الأسود هو الموجب!
   *  • تدريج Ω معكوس وغير خطي: الصفر يمين و ∞ يسار.
   * ════════════════════════════════════════════════════════════ */
  const ANALOG_POSITIONS = [
    P('off', 'OFF', 'OFF'),
    P('v2.5', 'VDC', '2.5', { fs: 2.5, read: { ar: 'اقرأ تدريج 250 واقسم على 100', en: 'Read the 250 scale and divide by 100' } }),
    P('v10', 'VDC', '10', { fs: 10, read: { ar: 'اقرأ تدريج 10 مباشرة', en: 'Read the 10 scale directly' } }),
    P('v50', 'VDC', '50', { fs: 50, read: { ar: 'اقرأ تدريج 50 مباشرة', en: 'Read the 50 scale directly' } }),
    P('v250', 'VDC', '250', { fs: 250, read: { ar: 'اقرأ تدريج 250 مباشرة', en: 'Read the 250 scale directly' } }),
    P('v1000', 'VDC', '1000', { fs: 1000, read: { ar: 'اقرأ تدريج 10 واضرب في 100', en: 'Read the 10 scale and multiply by 100' } }),
    P('a250m', 'ADC', '250m', { fs: 0.25, read: { ar: 'اقرأ تدريج 250 بالملي أمبير', en: 'Read the 250 scale in mA' } }),
    P('a25m', 'ADC', '25m', { fs: 0.025, read: { ar: 'اقرأ تدريج 250 واقسم على 10 (mA)', en: 'Read the 250 scale and divide by 10 (mA)' } }),
    P('a2.5m', 'ADC', '2.5m', { fs: 0.0025, read: { ar: 'اقرأ تدريج 250 واقسم على 100 (mA)', en: 'Read the 250 scale and divide by 100 (mA)' } }),
    P('a50u', 'ADC', '50µ', { fs: 50e-6, read: { ar: 'اقرأ تدريج 50 بالميكرو أمبير', en: 'Read the 50 scale in µA' } }),
    P('buzz', 'CONT', 'BZ', { mult: 1, vb: 1.5 }),
    P('x10k', 'OHM', '×10k', { mult: 1e4, vb: 9, read: { ar: 'اقرأ تدريج Ω العلوي واضرب في 10000', en: 'Read the top Ω scale and multiply by 10,000' } }),
    P('x1k', 'OHM', '×1k', { mult: 1e3, vb: 1.5, read: { ar: 'اقرأ تدريج Ω العلوي واضرب في 1000', en: 'Read the top Ω scale and multiply by 1,000' } }),
    P('x100', 'OHM', '×100', { mult: 100, vb: 1.5, read: { ar: 'اقرأ تدريج Ω العلوي واضرب في 100', en: 'Read the top Ω scale and multiply by 100' } }),
    P('x10', 'OHM', '×10', { mult: 10, vb: 1.5, read: { ar: 'اقرأ تدريج Ω العلوي واضرب في 10', en: 'Read the top Ω scale and multiply by 10' } }),
    P('x1', 'OHM', '×1', { mult: 1, vb: 1.5, read: { ar: 'اقرأ تدريج Ω العلوي مباشرة', en: 'Read the top Ω scale directly' } }),
    P('vac10', 'VAC', '10', { fs: 10, read: { ar: 'اقرأ تدريج 10 مباشرة', en: 'Read the 10 scale directly' } }),
    P('vac50', 'VAC', '50', { fs: 50, read: { ar: 'اقرأ تدريج 50 مباشرة', en: 'Read the 50 scale directly' } }),
    P('vac250', 'VAC', '250', { fs: 250, read: { ar: 'اقرأ تدريج 250 مباشرة', en: 'Read the 250 scale directly' } }),
    P('vac1000', 'VAC', '1000', { fs: 1000, read: { ar: 'اقرأ تدريج 10 واضرب في 100', en: 'Read the 10 scale and multiply by 100' } }),
  ];
  const ANALOG_GROUPS = [
    { mode: 'VDC', sym: 'DCV', from: 1, to: 5 },
    { mode: 'ADC', sym: 'DCA', from: 6, to: 9 },
    { mode: 'CONT', sym: '', from: 10, to: 10 },
    { mode: 'OHM', sym: 'Ω', from: 11, to: 15 },
    { mode: 'VAC', sym: 'ACV', from: 16, to: 19 },
  ];
  const ANALOG_RC = 20;         // مقاومة منتصف التدريج على نطاق ×1

  function measureAnalog(circuit, st) {
    const p = st.pos;
    const res = { value: 0, ol: false, garbage: false, events: [], current: () => 0, idc: () => 0, def: 0, analog: true };
    if (p.mode === 'OFF') return res;
    let meter = [];
    const R = st.red, B = st.black;
    if (p.mode === 'VDC') meter = [{ t: 'R', a: R, b: B, R: p.fs * 20000, id: 'METER' }];
    else if (p.mode === 'VAC') meter = [{ t: 'R', a: R, b: B, R: p.fs * 9000, id: 'METER' }];
    else if (p.mode === 'ADC') meter = st.fuseMA ? [{ t: 'R', a: R, b: B, R: 0.25 / p.fs, id: 'METER' }] : [];
    else {
      const rc = ANALOG_RC * p.mult;
      // البطارية الداخلية: الموجب على المجس الأسود (COM)
      meter = [{ t: 'V', a: B, b: R, V: p.vb, r: rc, id: 'METER' }];
    }
    const dc = Engine.solve(circuitFor(circuit, false).concat(meter));
    const acMeter = meter.map(e => (e.t === 'V' ? Object.assign({}, e, { V: 0 }) : e));
    const ac = Engine.solve(circuitFor(circuit, true).concat(acMeter));
    const dV = s => s.v(R) - s.v(B);
    res.current = id => Math.hypot(dc.i(id), ac.i(id));
    res.idc = id => dc.i(id);

    if (p.mode === 'VDC') { res.def = dV(dc) / p.fs; res.value = dV(dc); }
    else if (p.mode === 'VAC') { res.def = Math.abs(dV(ac)) / p.fs; res.value = Math.abs(dV(ac)); }
    else if (p.mode === 'ADC') {
      if (meter.length) {
        const I = dV(dc) / meter[0].R, Iac = dV(ac) / meter[0].R;
        res.def = I / p.fs; res.value = I;
        if (Math.hypot(I, Iac) > 0.5) res.events.push({ type: 'fuseMA', I: Math.hypot(I, Iac) });
      }
    } else {
      const rc = ANALOG_RC * p.mult;
      const I = dc.i('METER');                     // التيار الخارج من المجس الأسود
      res.def = I * rc / p.vb;
      res.value = res.def > 1e-6 ? rc * (1 / res.def - 1) : Infinity;
      const probe = [{ t: 'R', a: R, b: B, R: 1e7 }];
      const vdc = Engine.solve(circuitFor(circuit, false).concat(probe));
      const vac = Engine.solve(circuitFor(circuit, true).concat(probe));
      const ov = Math.max(Math.abs(vdc.v(R) - vdc.v(B)), Math.abs(vac.v(R) - vac.v(B)));
      if (ov > 0.3) { res.garbage = true; res.events.push({ type: 'powered', v: ov }); }
    }
    res.ol = res.def > 1.03;
    if (p.mode === 'OHM' || p.mode === 'CONT') res.ol = res.def < 0.004;
    if (res.def > 1.4 || res.def < -0.25) res.events.push({ type: 'peg', def: res.def });
    return res;
  }

  window.Meter = {
    POSITIONS, GROUPS, MODE_NAMES, measure, format, garbageText,
    ANALOG_POSITIONS, ANALOG_GROUPS, ANALOG_RC, measureAnalog,
    posById: id => POSITIONS.find(p => p.id === id),
  };
})();
