/*
 * builder.js — ورشة الدوائر: الطالب يبني دائرته بنفسه
 * ------------------------------------------------------------
 * لوحة توصيل فيها نقاط معدنية (Posts). الطالب يختار عنصراً من الأدوات
 * ثم يضغط على نقطتين فيُركَّب العنصر بينهما. كل نقطة "عقدة" كهربائية،
 * والمجسات تُوضع على النقاط مثل أي دائرة أخرى.
 * الأخطاء لها نتائج: LED بدون مقاومة يحترق، وسلك على البطارية = قِصَر.
 */
(function () {
  'use strict';
  const COLS = 6, ROWS = 4;
  const px = c => 70 + c * 100, py = r => 64 + r * 96;
  const R_VALUES = [100, 220, 470, 1000, 4700, 10000];

  const TOOLS = [
    { id: 'wire', ar: 'سلك', en: 'Wire', icon: 'wire' },
    { id: 'battery', ar: 'بطارية 9V', en: '9V battery', icon: 'battery' },
    { id: 'aa', ar: 'بطاريتان 3V', en: '2×AA 3V', icon: 'cell2' },
    { id: 'resistor', ar: 'مقاومة', en: 'Resistor', icon: 'resistor' },
    { id: 'led', ar: 'LED', en: 'LED', icon: 'led' },
    { id: 'lamp', ar: 'مصباح 6V', en: '6V lamp', icon: 'lamp' },
    { id: 'switch', ar: 'مفتاح', en: 'Switch', icon: 'switch' },
  ];

  const CHALLENGES = [
    { id: 'lamp', ar: 'أضئ المصباح', en: 'Light up the lamp',
      hint: { ar: 'بطارية + مصباح + سلكان يكمّلان الدائرة المغلقة.', en: 'Battery + lamp + wires that close the loop.' } },
    { id: 'led', ar: 'أضئ الـLED بأمان (5–30mA)', en: 'Light the LED safely (5–30mA)',
      hint: { ar: 'ضع مقاومة على التوالي مع الـLED (مثلاً 470Ω)، وانتبه لاتجاهه.', en: 'Put a resistor in series with the LED (e.g. 470Ω) and mind its direction.' } },
    { id: 'switch', ar: 'تحكّم بالمصباح بمفتاح', en: 'Control the lamp with a switch',
      hint: { ar: 'ضع المفتاح على التوالي مع المصباح، ثم شغّله.', en: 'Put the switch in series with the lamp, then turn it on.' } },
    { id: 'amp', ar: 'قِس تيار المصباح بالجهاز', en: 'Measure the lamp current',
      hint: { ar: 'افتح الدائرة في مكان واحد واجعل الجهاز (على A⎓) يكمّلها.', en: 'Break the loop at one point and let the meter (on A⎓) close it.' } },
    { id: 'divider', ar: 'ابنِ مقسّم جهد واقرأ 4–5V', en: 'Build a divider that reads 4–5V',
      hint: { ar: 'مقاومتان متساويتان على التوالي مع بطارية 9V، وقِس على واحدة منهما.', en: 'Two equal resistors in series with the 9V battery; measure across one.' } },
  ];

  let ctx = null;          // { refresh, toast }
  let board = null;        // الجزء الذي يحمل حالة اللوحة
  const doneSet = () => new Set(load('buildDone', []));

  function load(k, d) { try { const v = localStorage.getItem('ml.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem('ml.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  const postName = (r, c) => `r${r}c${c}`;
  const postXY = name => { const m = /r(\d)c(\d)/.exec(name); return [px(+m[2]), py(+m[1])]; };
  const fmtR = r => (r >= 1000 ? (r / 1000) + 'k' : r) + 'Ω';

  // ── الرسم ──
  function compSVG(c, k, total) {
    const [x1, y1] = postXY(c.a), [x2, y2] = postXY(c.b);
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const off = (k - (total - 1) / 2) * 26;
    const mx = (x1 + x2) / 2 + nx * off, my = (y1 + y2) / 2 + ny * off;
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const half = Math.min(30, L / 2 - 14);
    const s1 = [mx - ux * half, my - uy * half], s2 = [mx + ux * half, my + uy * half];
    const sel = board.sel === c.id;
    const lead = `<polyline points="${x1},${y1} ${s1[0]},${s1[1]}" class="b-lead"/><polyline points="${s2[0]},${s2[1]} ${x2},${y2}" class="b-lead"/>`;
    const lx = mx + nx * 30, ly = my + ny * 30 + 4;
    let sym = '', label = '';
    switch (c.type) {
      case 'wire':
        return `<g class="b-comp ${sel ? 'sel' : ''}" data-act="comp" data-part="${board.id}" data-cid="${c.id}">
          <path d="M${x1} ${y1} Q${mx + nx * off * 0.3} ${my + ny * off * 0.3} ${x2} ${y2}" class="b-wire"/>
          <path d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}" class="b-hit-line"/></g>`;
      case 'battery': case 'aa':
        sym = `<rect x="-28" y="-13" width="56" height="26" rx="5" fill="url(#gBattery)"/>
          <rect x="-28" y="-13" width="12" height="26" rx="4" fill="#1d1f22"/>
          <text x="-22" y="5" text-anchor="middle" class="b-pol">+</text><text x="20" y="5" text-anchor="middle" class="b-pol dark">−</text>`;
        label = c.type === 'battery' ? '9V' : '3V';
        break;
      case 'resistor': {
        const b = Parts.colorBands(c.value);
        const cols = [Parts.BAND_COLORS[b.digits[0]], Parts.BAND_COLORS[b.digits[1]], b.mult < 0 ? Parts.GOLD : Parts.BAND_COLORS[b.mult]];
        sym = `<rect x="-24" y="-10" width="48" height="20" rx="9" fill="url(#gRes)" stroke="#b49a6a"/>
          ${cols.map((col, i) => `<rect x="${-14 + i * 9}" y="-9.5" width="5" height="19" fill="${col}"/>`).join('')}
          <rect x="14" y="-9.5" width="4" height="19" fill="${Parts.GOLD}"/>`;
        label = fmtR(c.value);
        break;
      }
      case 'led':
        sym = `<circle id="glow-${board.id}-${c.id}" r="34" fill="url(#gGlowRed)" opacity="0"/>
          <circle r="13" fill="${c.burnt ? '#5b5f63' : '#d8323a'}" stroke="${c.burnt ? '#30343a' : '#ffb3b6'}"/>
          <polygon points="-6,-7 -6,7 6,0" fill="${c.burnt ? '#30343a' : '#ffe1e1'}"/><line x1="7" y1="-7" x2="7" y2="7" stroke="${c.burnt ? '#30343a' : '#ffe1e1'}" stroke-width="2"/>`;
        label = c.burnt ? tr('محترق', 'burnt') : 'LED';
        break;
      case 'lamp':
        sym = `<circle id="glow-${board.id}-${c.id}" r="40" fill="url(#gGlowWarm)" opacity="0"/>
          <circle r="15" fill="rgba(235,244,248,.2)" stroke="rgba(235,244,248,.8)" stroke-width="2"/>
          ${c.burnt ? '<path d="M-6 4 l4 -6 M6 4 l-3 -5" stroke="#6b5a40" stroke-width="2"/>' : '<path d="M-7 4 l3 -6 l3 6 l3 -6 l3 6" stroke="#8a7650" stroke-width="2" fill="none"/>'}`;
        label = c.burnt ? tr('محروق', 'burnt') : '6V';
        break;
      case 'switch':
        sym = `<rect x="-26" y="-12" width="52" height="24" rx="6" fill="#2c3035" stroke="#454b52"/>
          <circle cx="-14" r="4" fill="#c9ced4"/><circle cx="14" r="4" fill="#c9ced4"/>
          <line x1="-14" y1="0" x2="${c.on ? 14 : 9}" y2="${c.on ? 0 : -14}" stroke="#e9c46a" stroke-width="4" stroke-linecap="round"/>`;
        label = c.on ? 'ON' : 'OFF';
        break;
    }
    if (c.burnt) sym += '<path d="M-14 -14 L14 14 M14 -14 L-14 14" stroke="#ef5d58" stroke-width="3"/>';
    return `<g class="b-comp ${sel ? 'sel' : ''}" data-act="comp" data-part="${board.id}" data-cid="${c.id}">
      ${lead}
      <g transform="translate(${mx} ${my}) rotate(${ang})">
        <rect x="-34" y="-20" width="68" height="40" class="b-hit"/>${sym}
        ${sel ? '<rect x="-36" y="-22" width="72" height="44" rx="10" class="b-selbox"/>' : ''}
      </g>
      <text x="${lx}" y="${ly}" text-anchor="middle" class="b-label">${label}</text></g>`;
  }

  function drawBoard(p) {
    board = p;
    let posts = '';
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const name = postName(r, c), x = px(c), y = py(r);
      posts += `<g class="b-post ${p.first === name ? 'first' : ''}"><circle cx="${x}" cy="${y}" r="13" fill="url(#gMetal)" stroke="#5f666e"/>
        <line x1="${x - 6}" y1="${y - 6}" x2="${x + 6}" y2="${y + 6}" stroke="#5f666e" stroke-width="2.4"/></g>`;
    }
    const groups = {};
    p.comps.forEach(c => { const key = [c.a, c.b].sort().join('|'); (groups[key] = groups[key] || []).push(c); });
    const comps = p.comps.map(c => { const g = groups[[c.a, c.b].sort().join('|')]; return compSVG(c, g.indexOf(c), g.length); }).join('');
    return `<g class="part board">
      <rect x="20" y="20" width="600" height="380" rx="18" fill="#efe9d8" opacity=".07"/>
      ${posts}${comps}
      ${!p.comps.length ? `<text x="320" y="410" text-anchor="middle" class="b-empty">${tr('اختر عنصراً من الأدوات، ثم اضغط على نقطتين لتركيبه بينهما', 'Pick a part from the toolbox, then tap two posts to place it')}</text>` : ''}
    </g>`;
  }

  function elemsOf(c, n) {
    if (c.burnt) return [];
    const a = n(c.a), b = n(c.b), id = 'c-' + c.id;
    switch (c.type) {
      case 'wire': return [{ t: 'R', a, b, R: 0.01, id }];
      case 'battery': return [{ t: 'V', a, b, V: 9.4, r: 1.5, id }];
      case 'aa': return [{ t: 'V', a, b, V: 3.1, r: 0.4, id }];
      case 'resistor': return [{ t: 'R', a, b, R: c.value, id }];
      case 'lamp': return [{ t: 'R', a, b, R: 100, id }];
      case 'switch': return c.on ? [{ t: 'R', a, b, R: 0.02, id }] : [];
      case 'led': { const m = `${board.id}.${c.id}.m`; return [{ t: 'D', a, b: m, Is: 1e-18, n: 2, id }, { t: 'R', a: m, b, R: 10 }]; }
    }
    return [];
  }

  Parts.TYPES.board = {
    terms: () => { const t = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) t.push({ name: postName(r, c), x: px(c), y: py(r) }); return t; },
    draw: drawBoard,
    elems: (p, n) => { board = p; return p.comps.flatMap(c => elemsOf(c, n)); },
  };

  // ── التفاعل ──
  function persist() { save('buildComps', board.comps); }

  function wantsTerm() { return !!(board && board.tool); }

  function tapPost(termId) {
    const name = termId.split(':')[1];
    if (!board.first) { board.first = name; ctx.refresh(); return; }
    if (board.first === name) { board.first = null; ctx.refresh(); return; }
    const c = { id: 'k' + Date.now().toString(36) + Math.floor(Math.random() * 99), type: board.tool, a: board.first, b: name };
    if (c.type === 'resistor') c.value = board.lastR || 470;
    if (c.type === 'switch') c.on = false;
    board.comps.push(c);
    board.first = null; board.sel = c.id;
    persist();
    ctx.refresh();
  }

  function select(cid) {
    const c = board.comps.find(x => x.id === cid);
    if (c && c.type === 'switch' && !board.tool) { c.on = !c.on; board.sel = cid; persist(); ctx.refresh(); return; }
    board.sel = board.sel === cid ? null : cid;
    ctx.refresh();
  }

  function act(what) {
    const c = board.comps.find(x => x.id === board.sel);
    switch (what) {
      case 'flip': if (c) { [c.a, c.b] = [c.b, c.a]; } break;
      case 'value': if (c) { c.value = R_VALUES[(R_VALUES.indexOf(c.value) + 1) % R_VALUES.length]; board.lastR = c.value; } break;
      case 'toggle': if (c) c.on = !c.on; break;
      case 'fix': if (c) c.burnt = false; break;
      case 'del': if (c) { board.comps = board.comps.filter(x => x !== c); board.sel = null; } break;
      case 'clear': board.comps = []; board.sel = null; board.first = null; break;
    }
    persist();
    ctx.refresh();
  }

  function setTool(id) {
    board.tool = board.tool === id ? null : id;
    board.first = null;
    ctx.refresh();
  }

  // ── بعد كل قياس: الاحتراق، التوهج، التحديات ──
  const warned = new Set();
  function after(m) {
    let changed = false;
    for (const c of board.comps) {
      if (c.burnt) continue;
      const I = Math.abs(m.current('c-' + c.id));
      if (c.type === 'led' && I > 0.05) {
        c.burnt = true; changed = true;
        ctx.toast(tr(`احترق الـLED! مرّ فيه ${(I * 1000).toFixed(0)}mA وهو يتحمل حوالي 20mA فقط. ضع مقاومة حماية على التوالي معه (مثل 470Ω).`,
          `The LED burned out! ${(I * 1000).toFixed(0)}mA flowed but it only handles about 20mA. Add a series resistor (e.g. 470Ω).`), 'danger');
        ctx.mistake('burn', 'led');
      }
      if (c.type === 'lamp' && I > 0.15) {
        c.burnt = true; changed = true;
        ctx.toast(tr('احترق المصباح! الجهد عليه أكبر بكثير من 6V.', 'The lamp burned out! The voltage across it was far above 6V.'), 'danger');
      }
      if ((c.type === 'battery' || c.type === 'aa') && I > 1.5) {
        const key = 'short' + c.id + board.comps.length;
        if (!warned.has(key)) {
          warned.add(key);
          ctx.toast(tr(`دائرة قِصَر! البطارية تُخرج ${I.toFixed(1)}A لأن طرفيها موصولان بدون حِمل تقريباً. في الواقع تسخن وقد تتلف.`,
            `Short circuit! The battery is delivering ${I.toFixed(1)}A because its terminals are joined with almost no load. In real life it heats up and can be damaged.`), 'danger');
          ctx.mistake('short', 'builder');
        }
      }
    }
    if (changed) persist();
    return changed;
  }

  function paint(m) {
    for (const c of board.comps) {
      const el = document.getElementById(`glow-${board.id}-${c.id}`);
      if (!el) continue;
      const I = Math.abs(m.current('c-' + c.id));
      el.setAttribute('opacity', Math.min(1, c.type === 'led' ? I / 0.02 : I / 0.06).toFixed(3));
    }
  }

  function lampLit(circuitFn) {
    const sol = Engine.solve(circuitFn());
    return board.comps.some(c => c.type === 'lamp' && !c.burnt && Math.abs(sol.i('c-' + c.id)) > 0.03);
  }

  function checkChallenges(snap, m, circuitFn) {
    const done = doneSet(), newly = [];
    const lit = board.comps.some(c => c.type === 'lamp' && !c.burnt && Math.abs(m.current('c-' + c.id)) > 0.03);
    const tests = {
      lamp: () => lit,
      led: () => board.comps.some(c => c.type === 'led' && !c.burnt && Math.abs(m.current('c-' + c.id)) >= 0.005 && Math.abs(m.current('c-' + c.id)) <= 0.03),
      switch: () => lit && board.comps.some(s => {
        if (s.type !== 'switch' || !s.on) return false;
        s.on = false; const off = lampLit(circuitFn); s.on = true;
        return !off;
      }),
      amp: () => snap.mode === 'ADC' && !snap.ol && Math.abs(snap.value) > 0.01 && lit,
      divider: () => snap.mode === 'VDC' && !snap.ol && Math.abs(snap.value) >= 4 && Math.abs(snap.value) <= 5 &&
        !board.comps.some(c => (c.type === 'battery' || c.type === 'aa') && [c.a, c.b].sort().join() === [snap.red?.term.split(':')[1], snap.black?.term.split(':')[1]].sort().join()),
    };
    for (const ch of CHALLENGES) if (!done.has(ch.id) && tests[ch.id]()) { done.add(ch.id); newly.push(ch); }
    if (newly.length) save('buildDone', [...done]);
    return newly;
  }

  // ── لوحة الأدوات ──
  function renderPanel(el) {
    const c = board.comps.find(x => x.id === board.sel);
    const done = doneSet();
    const tools = TOOLS.map(t => `<button class="tool ${board.tool === t.id ? 'on' : ''}" data-tool="${t.id}" aria-pressed="${board.tool === t.id}">
      ${icon(t.icon)}<span>${T(t)}</span></button>`).join('');
    let selBox = '';
    if (c) {
      const name = T(TOOLS.find(t => t.id === c.type));
      const btn = (a, l) => `<button class="btn small" data-bact="${a}">${l}</button>`;
      selBox = `<div class="b-selbar"><b>${name}${c.type === 'resistor' ? ' · ' + fmtR(c.value) : ''}</b>
        ${['battery', 'aa', 'led'].includes(c.type) ? btn('flip', tr('اقلب الاتجاه', 'Flip direction')) : ''}
        ${c.type === 'resistor' ? btn('value', tr('غيّر القيمة', 'Change value')) : ''}
        ${c.type === 'switch' ? btn('toggle', c.on ? tr('أطفئ', 'Turn off') : tr('شغّل', 'Turn on')) : ''}
        ${c.burnt ? btn('fix', tr('استبدل بجديد', 'Replace')) : ''}
        ${btn('del', icon('x') + ' ' + tr('احذف', 'Delete'))}</div>`;
    }
    const hint = board.tool
      ? (board.first ? tr('اضغط على النقطة الثانية', 'Tap the second post') : tr(`اضغط على أول نقطة لتركيب: ${T(TOOLS.find(t => t.id === board.tool))}`, `Tap the first post to place: ${T(TOOLS.find(t => t.id === board.tool))}`))
      : tr('اختر عنصراً لتركيبه، أو اضغط على عنصر في اللوحة لتعديله. المجسات تعمل على أي نقطة.', 'Pick a part to place, or tap a part on the board to edit it. Probes work on any post.');
    el.innerHTML = `
      <div class="toolbox">${tools}</div>
      <p class="b-hint">${icon('info')}<span>${hint}</span></p>
      ${selBox}
      <h4>${icon('trophy')} ${tr('التحديات', 'Challenges')}</h4>
      <ul class="b-ch">${CHALLENGES.map(ch => `<li class="${done.has(ch.id) ? 'done' : ''}"><span class="tick-box">${done.has(ch.id) ? icon('check') : ''}</span>
        <span><b>${T(ch)}</b><small>${T(ch.hint)}</small></span></li>`).join('')}</ul>
      <div class="p-row"><button class="btn ghost small" data-bact="clear">${icon('refresh')} ${tr('امسح اللوحة', 'Clear board')}</button></div>`;
    el.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => setTool(b.dataset.tool));
    el.querySelectorAll('[data-bact]').forEach(b => b.onclick = () => act(b.dataset.bact));
  }

  const MISSION = {
    id: 'build', builder: true, icon: '⚡',
    get title() { return tr('ورشة الدوائر', 'Circuit Workshop'); },
    get brief() { return tr('ابنِ دائرتك بنفسك: بطاريات ومقاومات ومصابيح وLED ومفاتيح على لوحة توصيل، ثم قِسها بالجهاز. خمسة تحديات تنتظرك.', 'Build your own circuit from batteries, resistors, lamps, LEDs and switches, then measure it. Five challenges are waiting.'); },
    get skills() { return [tr('بناء الدوائر', 'Building circuits'), tr('التوالي والتوازي', 'Series & parallel'), tr('السلامة', 'Safety')]; },
    tasks: [],
    setup() {
      const saved = load('buildComps', null);
      const comps = saved || [
        { id: 'd1', type: 'battery', a: 'r1c0', b: 'r2c0' },
        { id: 'd2', type: 'wire', a: 'r1c0', b: 'r1c2' },
        { id: 'd3', type: 'lamp', a: 'r1c2', b: 'r2c2' },
      ];
      return { h: 420, parts: [{ type: 'board', id: 'BB', comps, tool: null, first: null, sel: null, lastR: 470 }], data: {} };
    },
  };

  window.Builder = {
    MISSION, CHALLENGES,
    init(c) { ctx = c; },
    attach(scene) { board = scene.parts[0]; },
    wantsTerm, tapPost, select, after, paint, checkChallenges, renderPanel,
    doneCount: () => doneSet().size,
  };
})();
