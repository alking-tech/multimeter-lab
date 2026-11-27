/*
 * tour.js — «تعرّف على الجهاز»
 *   Tour.start(kind)   جولة إرشادية خطوة بخطوة (رقمي أو تناظري)
 *   Tour.explain(on)   وضع «؟»: المس أي جزء من الجهاز فيظهر شرحه
 * © 2026 ALKING TECH
 */
(function () {
  'use strict';
  const L = (ar, en) => ({ ar, en });
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const DIG = [
    { sel: '#meterDig .lcd', t: L('الشاشة', 'Display'), d: L('تعرض القراءة بأربع خانات، والوحدة في الزاوية (V، mA، kΩ...). إذا ظهرت OL فالقيمة أكبر من النطاق المختار، والإشارة (−) تعني أن المجسين معكوسان.', 'Shows the reading in four digits with the unit in the corner (V, mA, kΩ…). OL means the value is above the chosen range; a (−) sign means the probes are reversed.') },
    { sel: '#meterDig [data-btn="hold"]', t: L('زر HOLD', 'HOLD button'), d: L('يثبّت القراءة على الشاشة حتى تبعد المجسات وتسجّلها براحة. اضغطه مرة أخرى للإلغاء.', 'Freezes the reading so you can remove the probes and write it down. Press again to release.') },
    { sel: '#meterDig [data-btn="light"]', t: L('زر الإضاءة', 'Backlight'), d: L('يضيء الشاشة للعمل في الأماكن المظلمة، مثل داخل لوحة كهرباء.', 'Lights the display for dark places, like inside a breaker panel.') },
    { sel: '#meterDig .knob', t: L('المفتاح الدوّار', 'Rotary dial'), d: L('يختار نوع القياس ونطاقه. لفّه بالسحب، أو اضغط على أي رقم حوله. دائماً اختر الوضع قبل وضع المجسات.', 'Selects what to measure and the range. Drag it or tap any number around it. Always choose the mode before touching the probes to anything.') },
    { sel: '#meterDig .dial-pos[data-i="0"]', t: L('OFF: إيقاف', 'OFF'), d: L('أطفئ الجهاز بعد الانتهاء للحفاظ على البطارية.', 'Turn the meter off when you finish to save the battery.') },
    { sel: '#meterDig .garc.g-VDC', t: L('V⎓ الجهد المستمر', 'V⎓ DC voltage'), d: L('للبطاريات والدوائر الإلكترونية. يوصل على التوازي (المجسان على طرفي العنصر) والدائرة تعمل.', 'For batteries and electronics. Connect in parallel (probes across the part) with the circuit on.') },
    { sel: '#meterDig .garc.g-VAC', t: L('V~ الجهد المتردد', 'V~ AC voltage'), d: L('لكهرباء المنزل (220V). استخدم النطاق 600 وأمسك المجسات من المقابض فقط.', 'For mains (220V). Use the 600 range and hold the probes only by the grips.') },
    { sel: '#meterDig .garc.g-ADC', t: L('A⎓ التيار', 'A⎓ Current'), d: L('يوصل على التوالي فقط: افتح الدائرة واجعل التيار يمر داخل الجهاز. لا تضعه على طرفي بطارية أبداً.', 'Series only: break the circuit and let the current flow through the meter. Never put it across a battery.') },
    { sel: '#meterDig .garc.g-OHM', t: L('Ω المقاومة', 'Ω Resistance'), d: L('لقياس المقاومات والأسلاك والسخانات. افصل الكهرباء أولاً، وابدأ بنطاق كبير ثم صغّره.', 'For resistors, wires and heaters. Power off first; start on a high range and go down.') },
    { sel: '#meterDig .garc.g-CONT', t: L('•))) الاستمرارية و ▶| الدايود', '•))) Continuity & ▶| diode'), d: L('الاستمرارية تصفّر إذا كان المسار متصلاً. اختبار الدايود يعرض جهد الوصلة (~0.6V) في اتجاه واحد فقط.', 'Continuity beeps when the path is connected. Diode test shows the junction voltage (~0.6V) one way only.') },
    { sel: '#meterDig .jack[data-jack="COM"]', t: L('مدخل COM', 'COM jack'), d: L('المشترك: المجس الأسود يبقى هنا دائماً في كل القياسات.', 'Common: the black lead always stays here, for every measurement.') },
    { sel: '#meterDig .jack[data-jack="V"]', t: L('مدخل VΩmA', 'VΩmA jack'), d: L('المجس الأحمر هنا لقياس الجهد والمقاومة والدايود والتيارات الصغيرة (حتى 200mA).', 'Red lead goes here for voltage, resistance, diode and small currents (up to 200mA).') },
    { sel: '#meterDig .jack[data-jack="A10"]', t: L('مدخل 10A', '10A jack'), d: L('للتيارات الكبيرة فقط مع وضع 10A. عليه فيوز يحمي الجهاز. أرجع المجس الأحمر إلى VΩmA بعد الانتهاء.', 'Large currents only, with the dial on 10A. It is fused. Move the red lead back to VΩmA afterwards.') },
    { sel: '#probeRed', t: L('المجس الأحمر (+)', 'Red probe (+)'), d: L('الطرف الموجب. اسحبه إلى أي طرف معدني، أو اضغط عليه ثم على الطرف.', 'The positive side. Drag it to any metal terminal, or tap it and then the terminal.') },
    { sel: '#probeBlack', t: L('المجس الأسود (−)', 'Black probe (−)'), d: L('الطرف السالب أو المرجع. في الجهد يوضع عادة على الأرضي أو (−) البطارية.', 'The negative or reference side. For voltage it usually goes on ground or the battery (−).') },
    { sel: '#fuses', t: L('حالة الفيوزات', 'Fuse status'), d: L('إذا مرّ تيار كبير في وضع التيار ينصهر الفيوز ليحمي الجهاز، وتراه هنا «محروق». استبدله لتعود القياسات.', 'If too much current flows on current mode, a fuse blows to protect the meter and shows "blown" here. Replace it to measure again.') },
  ];

  const ANA = [
    { sel: '#meterAna .a-face', t: L('وجه الجهاز التناظري', 'Analog dial face'), d: L('بدل الأرقام، إبرة تتحرك فوق تدريجات. تقرأ القيمة من موضع الإبرة.', 'Instead of digits, a needle moves over printed scales. You read the value from where it points.') },
    { sel: '#meterAna .needle', t: L('الإبرة', 'Needle'), d: L('تتحرك يميناً مع زيادة الجهد أو التيار. إذا ضربت النهاية فالنطاق صغير، وإذا ارتدت يساراً فالمجسان معكوسان.', 'Swings right as voltage or current rises. Slamming the end means the range is too small; kicking left means reversed probes.') },
    { sel: '#meterAna .a-arc.ohm', t: L('تدريج Ω (الأخضر)', 'Ω scale (green)'), d: L('معكوس: الصفر يمين و ∞ يسار، وغير منتظم. اضرب القراءة في مضاعف النطاق (×10، ×1k...).', 'Backwards: 0 on the right, ∞ on the left, and non-linear. Multiply by the range factor (×10, ×1k…).') },
    { sel: '#meterAna .a-arc:not(.ohm)', t: L('تدريجات الجهد والتيار', 'Voltage/current scales'), d: L('ثلاثة صفوف: 0–10 و 0–50 و 0–250. اقرأ الصف الذي يناسب النطاق المختار.', 'Three rows: 0–10, 0–50 and 0–250. Read the row that matches the chosen range.') },
    { sel: '#meterAna .a-mirror', t: L('شريط المرآة', 'Mirror strip'), d: L('انظر للإبرة عمودياً حتى تختفي صورتها في المرآة، فتتجنب خطأ زاوية النظر.', 'Look straight down until the needle hides its own reflection, to avoid parallax error.') },
    { sel: '#meterAna .knob', t: L('مفتاح النطاقات', 'Range selector'), d: L('DCV للجهد المستمر، ACV للمتردد، DCA للتيار، Ω للمقاومة. في وضع Ω المجس الأسود هو الموجب!', 'DCV for DC volts, ACV for AC, DCA for current, Ω for resistance. On Ω the black probe is the positive one!') },
    { sel: '#meterAna .jack[data-jack="COM"]', t: L('مدخل −COM', '−COM jack'), d: L('المجس الأسود.', 'The black lead.') },
    { sel: '#meterAna .jack[data-jack="V"]', t: L('مدخل +VΩA', '+VΩA jack'), d: L('المجس الأحمر لكل القياسات.', 'The red lead for every measurement.') },
    { sel: '#probeRed', t: L('المجس الأحمر', 'Red probe'), d: L('اسحبه إلى طرف معدني.', 'Drag it to a metal terminal.') },
    { sel: '#probeBlack', t: L('المجس الأسود', 'Black probe'), d: L('اسحبه إلى الطرف الآخر.', 'Drag it to the other terminal.') },
  ];

  let steps = [], idx = 0, active = false, explainOn = false, onDone = null;
  let ring, tip;

  function ensure() {
    if (ring) return;
    ring = document.createElement('div'); ring.className = 'tour-ring'; ring.hidden = true;
    tip = document.createElement('div'); tip.className = 'tour-tip'; tip.hidden = true; tip.setAttribute('role', 'dialog');
    document.body.append(ring, tip);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, { passive: true });
  }

  let cur = null;
  function place() {
    if (!cur || tip.hidden) return;
    const el = document.querySelector(cur.sel);
    if (!el) return;
    const r = el.getBoundingClientRect(), pad = 8;
    Object.assign(ring.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
    const tw = Math.min(330, innerWidth - 24);
    tip.style.width = tw + 'px';
    const th = tip.offsetHeight;
    const below = r.bottom + 14 + th < innerHeight - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tabbar')) || 0);
    let top = below ? r.bottom + 14 : r.top - 14 - th;
    top = Math.max(8, Math.min(innerHeight - th - 8, top));
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(12, Math.min(innerWidth - tw - 12, left));
    tip.style.top = top + 'px'; tip.style.left = left + 'px';
  }

  function show(step, footer) {
    ensure();
    cur = step;
    const el = document.querySelector(step.sel);
    if (!el) return false;
    el.scrollIntoView({ block: 'center', behavior: UI.reduce() ? 'auto' : 'smooth' });
    ring.hidden = false; tip.hidden = false;
    tip.innerHTML = `<div class="tt-head"><b>${esc(T(step.t))}</b>${footer.count ? `<small>${footer.count}</small>` : ''}</div>
      <p>${esc(T(step.d))}</p><div class="tt-actions">${footer.html}</div>`;
    footer.bind(tip);
    place(); setTimeout(place, 380);
    return true;
  }

  function hide() { if (ring) { ring.hidden = true; tip.hidden = true; } cur = null; }

  function go(i) {
    idx = i;
    if (idx >= steps.length) return end();
    const ok = show(steps[idx], {
      count: `${idx + 1} / ${steps.length}`,
      html: `${idx > 0 ? `<button class="btn small ghost" data-t="prev">${tr('السابق', 'Back')}</button>` : `<button class="btn small ghost" data-t="skip">${tr('تخطَّ', 'Skip')}</button>`}
        <button class="btn small primary" data-t="next">${idx === steps.length - 1 ? tr('انتهيت', 'Done') : tr('التالي', 'Next')}</button>`,
      bind: t => {
        t.querySelector('[data-t="next"]').onclick = () => go(idx + 1);
        const p = t.querySelector('[data-t="prev"]'); if (p) p.onclick = () => go(idx - 1);
        const s = t.querySelector('[data-t="skip"]'); if (s) s.onclick = end;
        t.querySelector('[data-t="next"]').focus();
      },
    });
    if (!ok) go(idx + 1);
  }

  function start(kind, done) {
    if (explainOn) explain(false);
    steps = kind === 'analog' ? ANA : DIG;
    active = true; onDone = done || null;
    go(0);
  }
  function end() {
    active = false; hide();
    try { localStorage.setItem('ml.tourSeen', '1'); } catch (e) { /* ignore */ }
    if (onDone) onDone();
  }

  // ── وضع «؟»: المس أي جزء ──
  function findStep(target, kind) {
    const list = kind === 'analog' ? ANA : DIG;
    const pos = target.closest && target.closest('.dial-pos');
    if (pos && kind !== 'analog') {
      const i = +pos.dataset.i;
      if (i === 0) return list.find(s => s.sel.includes('data-i="0"'));
      const g = Meter.GROUPS.find(gr => i >= gr.from && i <= gr.to);
      return g && list.find(s => s.sel.includes('g-' + g.mode));
    }
    for (const s of list) {
      if (s.sel.includes('.knob') || s.sel.includes('a-face')) continue;      // العامة في النهاية
      const el = document.querySelector(s.sel);
      if (el && el.contains(target)) return s;
    }
    return list.find(s => { const el = document.querySelector(s.sel); return el && el.contains(target); }) || null;
  }

  function capture(e) {
    if (!explainOn) return;
    const t = e.target;
    if (!(t.closest && (t.closest('#meter') || t.closest('.probe')))) return;
    e.preventDefault(); e.stopPropagation();
    if (e.type !== 'click') return;
    const kind = document.querySelector('#meterAna') && !document.querySelector('#meterAna').hidden ? 'analog' : 'digital';
    const s = findStep(t, kind);
    if (!s) return;
    show(s, { count: '', html: `<button class="btn small primary" data-t="ok">${tr('فهمت', 'Got it')}</button>`, bind: tt => { tt.querySelector('[data-t="ok"]').onclick = hide; } });
  }

  function explain(on) {
    ensure();
    explainOn = on;
    document.body.classList.toggle('explain-mode', on);
    if (!on) hide();
    return on;
  }

  document.addEventListener('click', capture, true);
  document.addEventListener('pointerdown', capture, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (active) end(); else hide(); } });

  window.Tour = { start, explain, hide, get active() { return active; }, get explaining() { return explainOn; }, seen: () => { try { return localStorage.getItem('ml.tourSeen') === '1'; } catch (e) { return true; } } };
})();
