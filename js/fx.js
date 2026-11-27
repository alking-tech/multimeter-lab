/*
 * fx.js — مؤثرات الكهرباء: أقواس برق وشرارات.
 *   FX.hero(el)            → أقواس برق حيّة بين الجهاز والدائرة في الواجهة
 *   FX.burst(parent, x, y) → دفقة شرارات صغيرة (عند لمس المجس لطرف معدني)
 * تحترم «تقليل الحركة» وتتوقف عندما تكون الصفحة مخفية.
 * © 2026 ALKING TECH
 */
(function () {
  'use strict';
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);

  // خط برق متعرّج بطريقة إزاحة نقطة المنتصف
  function bolt(x1, y1, x2, y2, rough, depth) {
    if (depth <= 0) return [[x1, y1], [x2, y2]];
    const mx = (x1 + x2) / 2 + rnd(-rough, rough), my = (y1 + y2) / 2 + rnd(-rough, rough);
    const a = bolt(x1, y1, mx, my, rough / 2, depth - 1);
    return a.concat(bolt(mx, my, x2, y2, rough / 2, depth - 1).slice(1));
  }

  function hero(host) {
    if (!host || host.querySelector('.fx-canvas')) return;
    const cv = document.createElement('canvas');
    cv.className = 'fx-canvas';
    cv.setAttribute('aria-hidden', 'true');
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, arcs = [], parts = [], nextArc = 600, last = 0, raf = 0;

    function size() {
      const r = host.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function rel(sel) {
      const e = host.querySelector(sel);
      if (!e || !e.offsetParent) return null;
      const a = e.getBoundingClientRect(), h = host.getBoundingClientRect();
      return { x: a.left - h.left, y: a.top - h.top, w: a.width, h: a.height };
    }
    function pointIn(r, edge) {
      if (edge === 'side') return { x: r.x + (Math.random() < .5 ? r.w * .08 : r.w * .92), y: r.y + rnd(.2, .85) * r.h };
      return { x: r.x + rnd(.15, .85) * r.w, y: r.y + rnd(.15, .85) * r.h };
    }

    function spawnArc() {
      const m = rel('.hv-meter'), b = rel('.hv-board');
      let p1, p2;
      if (m && b) {                       // من الجهاز إلى الدائرة
        p1 = pointIn(m, 'side'); p2 = pointIn(b);
      } else if (m) {                     // الجوال: أقواس قصيرة حول الجهاز
        p1 = pointIn(m, 'side');
        const out = p1.x < m.x + m.w / 2 ? -1 : 1;
        p2 = { x: p1.x + out * rnd(30, 70), y: p1.y + rnd(-50, 50) };
      } else return;
      const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const pts = bolt(p1.x, p1.y, p2.x, p2.y, Math.min(60, d * .22), 6);
      const branch = Math.random() < .55 ? (() => {
        const k = pts[Math.floor(rnd(.3, .7) * pts.length)];
        return bolt(k[0], k[1], k[0] + rnd(-60, 60), k[1] + rnd(-60, 60), 18, 4);
      })() : null;
      arcs.push({ pts, branch, life: 0, max: rnd(140, 260), hue: Math.random() < .25 ? 'gold' : 'violet' });
      for (const p of [p1, p2]) for (let i = 0; i < 9; i++) {
        const a = rnd(0, Math.PI * 2), v = rnd(40, 180);
        parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0, max: rnd(350, 750), r: rnd(1, 2.2) });
      }
    }

    function stroke(pts, w, color, blur) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.lineWidth = w; ctx.strokeStyle = color; ctx.shadowBlur = blur; ctx.shadowColor = color;
      ctx.stroke();
    }

    function frame(t) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(50, t - (last || t)); last = t;
      if (document.body.dataset.view !== 'home' || document.hidden) return;
      if (W === 0) size();
      ctx.clearRect(0, 0, W, H);
      nextArc -= dt;
      if (nextArc <= 0) { spawnArc(); if (Math.random() < .3) setTimeout(spawnArc, 70); nextArc = rnd(900, 2400); }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'lighter';
      arcs = arcs.filter(a => (a.life += dt) < a.max);
      for (const a of arcs) {
        const k = 1 - a.life / a.max, flick = Math.random() < .25 ? .35 : 1;
        const glow = a.hue === 'gold' ? `rgba(240,200,110,${.55 * k * flick})` : `rgba(166,107,235,${.7 * k * flick})`;
        stroke(a.pts, 7, glow, 22);
        stroke(a.pts, 2, `rgba(255,255,255,${.95 * k * flick})`, 8);
        if (a.branch) { stroke(a.branch, 4, glow, 14); stroke(a.branch, 1.2, `rgba(255,255,255,${.8 * k})`, 4); }
      }
      parts = parts.filter(p => (p.life += dt) < p.max);
      for (const p of parts) {
        const s = dt / 1000;
        p.vy += 260 * s; p.x += p.vx * s; p.y += p.vy * s;
        const k = 1 - p.life / p.max;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.6 + k), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${Math.round(200 + 55 * k)},${Math.round(120 + 100 * k)},${k})`;
        ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(255,200,90,.9)';
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;
    }

    if (reduce()) return;
    size();
    new ResizeObserver(size).observe(host);
    raf = requestAnimationFrame(frame);
  }

  // دفقة شرارات صغيرة بعناصر DOM (لا تحتاج canvas)
  function burst(parent, x, y, n) {
    if (reduce() || !parent) return;
    for (let i = 0; i < (n || 10); i++) {
      const s = document.createElement('i');
      s.className = 'fx-spark';
      s.style.left = x + 'px'; s.style.top = y + 'px';
      parent.appendChild(s);
      const a = rnd(0, Math.PI * 2), d = rnd(14, 42);
      const anim = s.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 14}px)) scale(.2)`, opacity: 0 },
      ], { duration: rnd(280, 520), easing: 'cubic-bezier(.2,.8,.3,1)' });
      anim.onfinish = () => s.remove();
    }
    const f = document.createElement('i');
    f.className = 'fx-flash';
    f.style.left = x + 'px'; f.style.top = y + 'px';
    parent.appendChild(f);
    f.animate([{ opacity: 1, transform: 'translate(-50%,-50%) scale(.4)' }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.6)' }], { duration: 260 }).onfinish = () => f.remove();
  }

  window.FX = { hero, burst };
})();
