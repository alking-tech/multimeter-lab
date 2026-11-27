/*
 * ui.js — أدوات الواجهة المشتركة
 *   icon(name)        أيقونة SVG من المجموعة الموحّدة (بدل الرموز التعبيرية)
 *   UI.confetti(el)   احتفال صغير عند إنهاء مهمة أو تحدٍّ
 *   UI.countUp(el,n)  عدّاد متحرك للأرقام
 *   UI.ring(p)        حلقة تقدّم دائرية
 *   UI.transition(fn) انتقال ناعم بين الصفحات
 */
(function () {
  'use strict';
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // كل أيقونة: مسارات بخط 24×24 (stroke)
  const P = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M8 7h7"/>',
    sigma: '<path d="M18 4H6l6 8-6 8h12"/>',
    chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
    vol: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6"/><path d="M22 9l-5 6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
    star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.2-.9z"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a4 4 0 0 0 4 4"/><path d="M16 6h4v1a4 4 0 0 1-4 4"/><path d="M12 13v4"/><path d="M8 21h8"/><path d="M9 17h6v4H9z"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/><path d="M22 9v6"/>',
    wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19l-3 1 1-3 7.5-7.5"/><path d="M14.5 6.5L18 3l3 3-3.5 3.5"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5"/><path d="M12 18h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5h.01"/>',
    arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    needle: '<path d="M3 18a9 9 0 0 1 18 0"/><path d="M12 18l5-8"/><circle cx="12" cy="18" r="1.5"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    battery: '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 10v4"/><path d="M6 10v4"/><path d="M4 12h4"/><path d="M13 12h3"/>',
    resistor: '<path d="M2 12h4l1.5-4 3 8 3-8 3 8 1.5-4h4"/>',
    led: '<path d="M6 7l9 5-9 5z"/><path d="M15 6v12"/><path d="M3 12h3"/><path d="M15 12h6"/><path d="M17 4l2-2"/><path d="M19 7l2-2"/>',
    lamp: '<circle cx="12" cy="12" r="6"/><path d="M8 8l8 8"/><path d="M16 8l-8 8"/><path d="M2 12h4"/><path d="M18 12h4"/>',
    switch: '<path d="M2 16h5"/><path d="M17 16h5"/><circle cx="7" cy="16" r="1.5"/><circle cx="17" cy="16" r="1.5"/><path d="M8 15l8-7"/>',
    wire: '<path d="M3 17c4 0 4-10 9-10s5 10 9 10"/>',
    cell2: '<rect x="2" y="8" width="8" height="8" rx="1.5"/><rect x="13" y="8" width="8" height="8" rx="1.5"/><path d="M10 12h3"/>',
  };
  const icon = (name, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${P[name] || ''}</svg>`;

  // ── الاحتفال (Canvas خفيف بدون مكتبات) ──
  function confetti(anchor, opts) {
    if (reduce()) return;
    const o = Object.assign({ count: 90, spread: 1 }, opts);
    const c = document.createElement('canvas');
    c.className = 'confetti';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    const r = anchor ? anchor.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 3, width: 0, height: 0 };
    const ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    const colors = ['#f5b41a', '#4cc38a', '#7cc6fe', '#ff8a80', '#c3a6ff', '#ffffff'];
    const parts = Array.from({ length: o.count }, () => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1 * o.spread, v = 6 + Math.random() * 8;
      return { x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[Math.floor(Math.random() * colors.length)], life: 0 };
    });
    let frame = 0;
    (function tick() {
      frame++;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) {
        p.vy += 0.28; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - frame / 110);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      if (frame < 110) requestAnimationFrame(tick); else c.remove();
    })();
  }

  function countUp(el, to, opts) {
    const o = Object.assign({ dur: 700, dec: 0, suffix: '' }, opts);
    if (!el) return;
    if (reduce()) { el.textContent = to.toFixed(o.dec) + o.suffix; return; }
    const t0 = performance.now();
    (function step(t) {
      const k = Math.min(1, (t - t0) / o.dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (to * e).toFixed(o.dec) + o.suffix;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  function ring(frac, size, label) {
    const s = size || 84, r = s / 2 - 7, C = 2 * Math.PI * r;
    const off = C * (1 - Math.max(0, Math.min(1, frac)));
    return `<svg class="ring" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" role="img" aria-label="${label || Math.round(frac * 100) + '%'}">
      <circle cx="${s / 2}" cy="${s / 2}" r="${r}" class="ring-bg"/>
      <circle cx="${s / 2}" cy="${s / 2}" r="${r}" class="ring-fg" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" style="--c:${C.toFixed(1)}"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" class="ring-t">${Math.round(frac * 100)}%</text></svg>`;
  }

  function transition(fn) {
    if (document.startViewTransition && !reduce()) {
      try { document.startViewTransition(fn); return; } catch (e) { /* fall through */ }
    }
    fn();
  }

  window.icon = icon;
  window.UI = { icon, confetti, countUp, ring, transition, reduce };
})();
