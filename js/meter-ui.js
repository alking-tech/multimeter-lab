/*
 * meter-ui.js — رسم الجهازين:
 *   • الرقمي: شاشة 7-قطع (3½ خانة) + زر HOLD والإضاءة
 *   • التناظري: إبرة بحركة فيزيائية (نابض + تخميد) + تدريجات Ω و V
 * الاثنان يشتركان في المفتاح الدوّار والمداخل.
 */
(function () {
  'use strict';
  const SEGS = {
    '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc',
    '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', 'O': 'abcdef', 'L': 'def', ' ': '',
  };
  const W = 30, H = 52, T = 5.5, GAP = 1.2;
  const hSeg = (x1, x2, y) => { const h = T / 2; return `${x1},${y} ${x1 + h},${y - h} ${x2 - h},${y - h} ${x2},${y} ${x2 - h},${y + h} ${x1 + h},${y + h}`; };
  const vSeg = (x, y1, y2) => { const h = T / 2; return `${x},${y1} ${x + h},${y1 + h} ${x + h},${y2 - h} ${x},${y2} ${x - h},${y2 - h} ${x - h},${y1 + h}`; };
  const SEG_POLY = {
    a: hSeg(T / 2 + GAP, W - T / 2 - GAP, T / 2), g: hSeg(T / 2 + GAP, W - T / 2 - GAP, H / 2), d: hSeg(T / 2 + GAP, W - T / 2 - GAP, H - T / 2),
    f: vSeg(T / 2, T / 2 + GAP, H / 2 - GAP), e: vSeg(T / 2, H / 2 + GAP, H - T / 2 - GAP),
    b: vSeg(W - T / 2, T / 2 + GAP, H / 2 - GAP), c: vSeg(W - T / 2, H / 2 + GAP, H - T / 2 - GAP),
  };

  // ── الوجه العلوي للجهاز الرقمي ──
  function digitalFace() {
    const cells = [0, 1, 2, 3].map(k => `<g class="cell" data-k="${k}" transform="translate(${72 + k * 44} 64) skewX(-7)">
        ${Object.entries(SEG_POLY).map(([s, pts]) => `<polygon class="seg" data-s="${s}" points="${pts}"/>`).join('')}
        <circle class="seg dp" cx="${W + 6}" cy="${H - 2}" r="3"/></g>`).join('');
    return `
      <text x="150" y="40" text-anchor="middle" class="mbrand">MULTILAB&#160;&#160;ML-830</text>
      <rect x="32" y="48" width="236" height="98" rx="10" fill="#17191c"/>
      <rect x="40" y="54" width="220" height="86" rx="5" class="lcd"/>
      <g class="lcd-digits"><rect class="seg minus" x="48" y="87" width="16" height="5.5" rx="2"/>${cells}</g>
      <text x="48" y="134" class="lcd-ind lcdMode"></text>
      <text x="128" y="134" class="lcd-ind lcdHold"></text>
      <text x="168" y="134" class="lcd-ind lcdBeep"></text>
      <text x="252" y="134" text-anchor="end" class="lcd-unit lcdUnit"></text>
      <g class="mbtn" data-btn="hold" role="button" tabindex="0" aria-label="زر تثبيت القراءة HOLD">
        <rect x="40" y="154" width="70" height="22" rx="11" class="mbtn-r"/><text x="75" y="169" text-anchor="middle" class="mbtn-t">HOLD</text></g>
      <g class="mbtn" data-btn="light" role="button" tabindex="0" aria-label="زر إضاءة الشاشة">
        <rect x="190" y="154" width="70" height="22" rx="11" class="mbtn-r light"/><text x="225" y="169" text-anchor="middle" class="mbtn-t">☀</text></g>`;
  }

  // ── الوجه العلوي للجهاز التناظري ──
  const PX = 150, PY = 214, SPAN = 46;
  const ang = d => (-SPAN + 2 * SPAN * d) * Math.PI / 180;
  const at = (d, r) => [PX + r * Math.sin(ang(d)), PY - r * Math.cos(ang(d))];

  function analogFace() {
    const rc = Meter.ANALOG_RC;
    const ohmDef = R => (R === Infinity ? 0 : rc / (rc + R));
    const ohmMajor = [[0, '0'], [1, '1'], [2, '2'], [5, '5'], [10, '10'], [20, '20'], [30, '30'], [50, '50'], [100, '100'], [200, '200'], [500, '500'], [Infinity, '∞']];
    const ohmMinor = [0.5, 1.5, 3, 4, 6, 7, 8, 9, 15, 25, 40, 70, 150, 300, 1000, 2000];
    const tick = (d, r1, r2, cls) => { const [x1, y1] = at(d, r1), [x2, y2] = at(d, r2); return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${cls}"/>`; };
    const txt = (d, r, t, cls) => { const [x, y] = at(d, r); return `<text x="${x.toFixed(1)}" y="${(y + 3.5).toFixed(1)}" text-anchor="middle" class="${cls}">${t}</text>`; };
    const arc = (r, cls) => { const [x1, y1] = at(0, r), [x2, y2] = at(1, r); return `<path d="M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}" class="${cls}"/>`; };

    let s = '';
    s += arc(152, 'a-arc ohm');
    ohmMajor.forEach(([R, t]) => { s += tick(ohmDef(R), 152, 161, 'a-tk ohm') + txt(ohmDef(R), 168 - (R >= 500 ? 4 : 0), t, 'a-t ohm'); });
    ohmMinor.forEach(R => { s += tick(ohmDef(R), 152, 157, 'a-tk ohm thin'); });
    s += arc(144, 'a-mirror');
    s += arc(136, 'a-arc');
    for (let k = 0; k <= 50; k++) s += tick(k / 50, 136, k % 5 ? 131 : 126, k % 5 ? 'a-tk thin' : 'a-tk');
    [0, 2, 4, 6, 8, 10].forEach((v, i) => { s += txt(i / 5, 116, v, 'a-t'); });
    [0, 10, 20, 30, 40, 50].forEach((v, i) => { s += txt(i / 5, 102, v, 'a-t sm'); });
    [0, 50, 100, 150, 200, 250].forEach((v, i) => { s += txt(i / 5, 88, v, 'a-t sm'); });
    return `
      <rect x="22" y="22" width="256" height="184" rx="14" fill="#17191c"/>
      <rect x="28" y="28" width="244" height="172" rx="10" class="a-face"/>
      ${s}
      <text x="258" y="44" text-anchor="end" class="a-lbl ohm">Ω</text>
      <text x="42" y="44" class="a-lbl">DCV·A</text>
      <text x="150" y="160" text-anchor="middle" class="a-lbl sm">ML-500 · 20kΩ/V DC</text>
      <g class="needle"><line x1="${PX}" y1="${PY}" x2="${PX}" y2="${PY - 166}" class="needle-l"/></g>
      <rect x="28" y="182" width="244" height="22" fill="#2b2f34"/>
      <circle cx="${PX}" cy="${PY}" r="15" fill="#1c1f22" stroke="#4a5058" stroke-width="2"/>
      <circle cx="${PX}" cy="${PY}" r="5" fill="#c62828"/>`;
  }

  function create(kind) {
    const analog = kind === 'analog';
    const POS = analog ? Meter.ANALOG_POSITIONS : Meter.POSITIONS;
    const GROUPS = analog ? Meter.ANALOG_GROUPS : Meter.GROUPS;
    const STEP = 360 / POS.length;
    const CX = 150, CY = analog ? 316 : 300;
    const JACKS = analog
      ? [[100, 'COM', '−COM', '#0c0d0e'], [200, 'V', '+VΩA', '#c8312e']]
      : [[66, 'A10', '10A', '#c8312e'], [150, 'COM', 'COM', '#0c0d0e'], [234, 'V', 'VΩmA', '#c8312e']];
    const polar = (i, r) => { const a = (i * STEP) * Math.PI / 180; return [CX + r * Math.sin(a), CY - r * Math.cos(a)]; };
    let root, handlers, posIndex = 0;
    let needle = { cur: 0, vel: 0, target: 0, raf: 0 };

    function svg() {
      const ticks = POS.map((p, i) => { const [x1, y1] = polar(i, 64), [x2, y2] = polar(i, 72); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="tick"/>`; }).join('');
      const labels = POS.map((p, i) => {
        const [x, y] = polar(i, 88);
        return `<g class="dial-pos ${p.mode === 'OFF' ? 'off' : ''}" data-i="${i}" role="button" tabindex="-1" aria-label="${Meter.MODE_NAMES[p.mode]} ${p.label}">
          <circle cx="${x}" cy="${y}" r="14" class="dial-hit"/>
          <text x="${x}" y="${y + 4}" text-anchor="middle" class="dial-t ${p.label.length > 3 ? 'sm' : ''}">${p.label}</text></g>`;
      }).join('');
      const arcs = GROUPS.map(g => {
        const r = 104, a1 = (g.from - 0.42) * STEP, a2 = (g.to + 0.42) * STEP;
        const p1 = polar(a1 / STEP, r), p2 = polar(a2 / STEP, r), mid = polar((g.from + g.to) / 2, 121);
        return `<path d="M${p1[0]} ${p1[1]} A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${p2[0]} ${p2[1]}" class="garc g-${g.mode}"/>
          ${g.sym ? `<text x="${mid[0]}" y="${mid[1] + 5}" text-anchor="middle" class="gsym g-${g.mode}">${g.sym}</text>` : ''}`;
      }).join('');
      const ridges = Array.from({ length: 24 }, (_, k) => { const a = k * 15 * Math.PI / 180; return `<line x1="${CX + 50 * Math.sin(a)}" y1="${CY - 50 * Math.cos(a)}" x2="${CX + 57 * Math.sin(a)}" y2="${CY - 57 * Math.cos(a)}" class="ridge"/>`; }).join('');
      const jacks = JACKS.map(([x, name, label, ring]) => `
        <g class="jack" data-jack="${name}" role="button" tabindex="0" aria-label="مدخل ${label}">
          <circle cx="${x}" cy="456" r="22" class="jack-hit"/><circle cx="${x}" cy="456" r="15" fill="${ring}"/>
          <circle cx="${x}" cy="456" r="10" fill="#121314"/><circle cx="${x}" cy="456" r="5" fill="#2b2d30"/>
          <circle cx="${x}" cy="456" r="11" class="plug" data-plug="${name}"/>
          <text x="${x}" y="428" text-anchor="middle" class="jack-t">${label}</text></g>`).join('');
      return `<svg viewBox="0 0 300 500" class="meter-svg ${kind}" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="${analog ? 'جهاز ملتيميتر تناظري' : 'جهاز ملتيميتر رقمي'}">
        <defs><linearGradient id="mHol-${kind}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${analog ? '#d64541' : '#ffc93d'}"/><stop offset="1" stop-color="${analog ? '#9e2a27' : '#e59b12'}"/></linearGradient>
        <radialGradient id="mKnob-${kind}" cx=".4" cy=".35"><stop offset="0" stop-color="#4a4f56"/><stop offset="1" stop-color="#17191c"/></radialGradient></defs>
        <rect x="2" y="2" width="296" height="496" rx="36" fill="url(#mHol-${kind})" stroke="${analog ? '#7a1f1c' : '#b8790a'}" stroke-width="2"/>
        <rect x="16" y="16" width="268" height="468" rx="24" fill="#2b2f34"/>
        ${analog ? analogFace() : digitalFace()}
        ${arcs}${ticks}${labels}
        <g class="knob" role="slider" tabindex="0" aria-label="مفتاح اختيار القياس">
          <circle cx="${CX}" cy="${CY}" r="58" fill="url(#mKnob-${kind})" stroke="#0d0e10" stroke-width="2"/>${ridges}
          <g class="knob-ptr" style="transform-origin:${CX}px ${CY}px">
            <rect x="${CX - 13}" y="${CY - 62}" width="26" height="124" rx="12" fill="#1e2125" stroke="#3b4047"/>
            <path d="M${CX} ${CY - 58} L${CX} ${CY - 30}" stroke="#f3f4f1" stroke-width="5" stroke-linecap="round"/>
            <polygon points="${CX - 7},${CY - 52} ${CX + 7},${CY - 52} ${CX},${CY - 64}" fill="#f3f4f1"/></g>
        </g>
        ${jacks}
        <text x="${analog ? 150 : 66}" y="484" text-anchor="middle" class="fine">${analog ? 'FUSED 0.5A' : 'FUSED'}</text>
        ${analog ? '' : '<text x="234" y="484" text-anchor="middle" class="fine">CAT II 600V</text>'}
      </svg>`;
    }

    function mount(el, h) {
      root = el; handlers = h;
      el.innerHTML = svg();
      const s = el.querySelector('svg');
      const key = fn => e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };
      s.querySelectorAll('.dial-pos').forEach(g => g.addEventListener('click', () => handlers.onPos(+g.dataset.i)));
      s.querySelectorAll('.jack').forEach(g => {
        g.addEventListener('click', () => handlers.onJack(g.dataset.jack));
        g.addEventListener('keydown', key(() => handlers.onJack(g.dataset.jack)));
      });
      s.querySelectorAll('.mbtn').forEach(g => {
        g.addEventListener('click', () => handlers.onButton(g.dataset.btn));
        g.addEventListener('keydown', key(() => handlers.onButton(g.dataset.btn)));
      });
      const knob = s.querySelector('.knob');
      let dragging = false;
      const angleAt = e => {
        const r = s.getBoundingClientRect(), k = r.width / 300;
        const x = (e.clientX - r.left) / k - CX, y = (e.clientY - r.top) / k - CY;
        let a = Math.atan2(x, -y) * 180 / Math.PI; if (a < 0) a += 360;
        return Math.round(a / STEP) % POS.length;
      };
      knob.addEventListener('pointerdown', e => { dragging = true; try { knob.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } e.preventDefault(); });
      knob.addEventListener('pointermove', e => { if (dragging) { const i = angleAt(e); if (i !== posIndex) handlers.onPos(i); } });
      knob.addEventListener('pointerup', () => { dragging = false; });
      knob.addEventListener('pointercancel', () => { dragging = false; });
      knob.addEventListener('keydown', e => {
        const n = POS.length;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); handlers.onPos((posIndex + 1) % n); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); handlers.onPos((posIndex + n - 1) % n); }
      });
      s.addEventListener('wheel', e => {
        if (!e.target.closest('.knob')) return;
        e.preventDefault();
        handlers.onPos((posIndex + (e.deltaY > 0 ? 1 : POS.length - 1)) % POS.length);
      }, { passive: false });
      if (analog) drawNeedle();
    }

    function setPos(i) {
      posIndex = i;
      const ptr = root.querySelector('.knob-ptr');
      const cur = parseFloat(ptr.dataset.deg || '0');
      const deg = cur + ((((i * STEP) - cur) % 360 + 540) % 360 - 180);
      ptr.dataset.deg = deg;
      ptr.style.transform = `rotate(${deg}deg)`;
      root.querySelectorAll('.dial-pos').forEach(g => g.classList.toggle('sel', +g.dataset.i === i));
      root.querySelector('.knob').setAttribute('aria-valuetext', `${Meter.MODE_NAMES[POS[i].mode]} ${POS[i].label}`);
    }

    function setJack(redJack) {
      root.querySelectorAll('.plug').forEach(c => {
        c.classList.toggle('in-red', c.dataset.plug === redJack);
        c.classList.toggle('in-black', c.dataset.plug === 'COM');
      });
    }

    function parseDisplay(text) {
      let sign = false, cells = [];
      if (text.startsWith('-')) { sign = true; text = text.slice(1); }
      if (text === 'OL') cells = [{ ch: ' ' }, { ch: 'O' }, { ch: 'L' }, { ch: ' ' }];
      else {
        for (const ch of text) { if (ch === '.') { if (cells.length) cells[cells.length - 1].dp = true; } else cells.push({ ch }); }
        while (cells.length < 4) cells.unshift({ ch: ' ' });
        cells = cells.slice(-4);
      }
      return { sign, cells };
    }

    function setDisplay(d) {
      if (analog) return;
      const lcd = root.querySelector('.lcd');
      lcd.classList.toggle('lit', !!d.light && !d.off);
      lcd.classList.toggle('dead', !!d.off);
      const { sign, cells } = parseDisplay(d.off ? '' : d.text || '');
      root.querySelector('.minus').classList.toggle('on', sign);
      root.querySelectorAll('.cell').forEach((cell, k) => {
        const c = cells[k] || { ch: ' ' }, on = SEGS[c.ch] || '';
        cell.querySelectorAll('polygon.seg').forEach(p => p.classList.toggle('on', on.includes(p.dataset.s)));
        cell.querySelector('.dp').classList.toggle('on', !!c.dp);
      });
      root.querySelector('.lcdMode').textContent = d.off ? '' : (d.modeTag || '');
      root.querySelector('.lcdHold').textContent = d.hold && !d.off ? 'HOLD' : '';
      root.querySelector('.lcdBeep').textContent = d.beepIcon && !d.off ? '•)))' : '';
      root.querySelector('.lcdUnit').textContent = d.off ? '' : (d.unit || '');
      root.querySelector('[data-btn="hold"] .mbtn-r').classList.toggle('active', !!d.hold);
      root.querySelector('[data-btn="light"] .mbtn-r').classList.toggle('active', !!d.light);
    }

    // ── حركة الإبرة: نابض مع تخميد، وتصطدم بالحدّين ──
    function drawNeedle() {
      const g = root && root.querySelector('.needle');
      if (g) g.setAttribute('transform', `rotate(${(-SPAN + 2 * SPAN * needle.cur).toFixed(2)} ${PX} ${PY})`);
    }
    function setNeedle(def) {
      needle.target = Number.isFinite(def) ? def : 0;
      if (needle.raf) return;
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const step = () => {
        const n = needle;
        if (reduce) { n.cur = Math.max(-0.04, Math.min(1.04, n.target)); n.vel = 0; }
        else {
          n.vel += (n.target - n.cur) * 0.09;
          n.vel *= 0.78;
          n.cur += n.vel;
          if (n.cur > 1.04) { n.cur = 1.04; n.vel = -Math.abs(n.vel) * 0.35; }
          if (n.cur < -0.04) { n.cur = -0.04; n.vel = Math.abs(n.vel) * 0.35; }
        }
        drawNeedle();
        const settled = Math.abs(n.vel) < 1e-4 && (Math.abs(n.target - n.cur) < 1e-4 || n.cur === 1.04 || n.cur === -0.04);
        n.raf = settled ? 0 : requestAnimationFrame(step);
      };
      needle.raf = requestAnimationFrame(step);
    }

    function jackPoint(name) {
      const c = root.querySelector(`.plug[data-plug="${name}"]`) || root.querySelector('.plug[data-plug="V"]');
      const r = c.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    return { kind, POS, mount, setPos, setJack, setDisplay, setNeedle, jackPoint };
  }

  window.MeterUI = { create };
})();
