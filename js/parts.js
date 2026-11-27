/*
 * parts.js — العناصر الإلكترونية على طاولة العمل
 * ------------------------------------------------------------
 * كل عنصر يعرّف ثلاثة أشياء:
 *   draw(p)   → رسمه بصيغة SVG
 *   terms(p)  → نقاط التوصيل (الأطراف) التي تضع عليها المجسات
 *   elems(p,n)→ نموذجه الكهربائي الذي يدخل في محرّك الحل
 */
(function () {
  'use strict';

  const BAND_COLORS = ['#1b1b1b', '#7a4a21', '#d1352b', '#ee7d1a', '#f4d03a', '#2f9e4f', '#2c6fd6', '#8a4fd1', '#8d8f93', '#f5f5f2'];
  const BAND_NAMES = ['أسود', 'بني', 'أحمر', 'برتقالي', 'أصفر', 'أخضر', 'أزرق', 'بنفسجي', 'رمادي', 'أبيض'];
  const BAND_NAMES_EN = ['Black', 'Brown', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Violet', 'Grey', 'White'];
  const GOLD = '#c9a13b';

  function colorBands(ohms) {
    let m = Math.floor(Math.log10(ohms)) - 1;
    let two = Math.round(ohms / Math.pow(10, m));
    if (two >= 100) { two = Math.round(two / 10); m += 1; }
    const d1 = Math.floor(two / 10), d2 = two % 10;
    return { digits: [d1, d2], mult: m };
  }

  function fmtOhms(r) {
    if (r >= 1e6) return +(r / 1e6).toFixed(2) + 'MΩ';
    if (r >= 1e3) return +(r / 1e3).toFixed(2) + 'kΩ';
    return +r.toFixed(1) + 'Ω';
  }

  const label = (x, y, text, cls) => `<text class="plabel ${cls || ''}" x="${x}" y="${y}" text-anchor="middle">${text}</text>`;

  const TYPES = {
    // ── بطارية 9 فولت (الأطراف في الأعلى) ──
    battery9: {
      terms: p => [{ name: '+', x: p.x + 24, y: p.y - 12 }, { name: '-', x: p.x + 62, y: p.y - 12 }],
      draw: p => `
        <g class="part battery9">
          <rect x="${p.x + 15}" y="${p.y - 12}" width="18" height="16" rx="3" fill="#c7cbd1" stroke="#7b818a"/>
          <polygon points="${hex(p.x + 24, p.y - 12, 8)}" fill="#dfe3e8" stroke="#6d737c"/>
          <rect x="${p.x + 52}" y="${p.y - 12}" width="20" height="16" rx="3" fill="#c7cbd1" stroke="#7b818a"/>
          <circle cx="${p.x + 62}" cy="${p.y - 12}" r="9.5" fill="#dfe3e8" stroke="#6d737c"/>
          <circle cx="${p.x + 62}" cy="${p.y - 12}" r="5" fill="#a9afb7"/>
          <rect x="${p.x}" y="${p.y}" width="86" height="28" rx="6" fill="#1d1f22"/>
          <rect x="${p.x}" y="${p.y + 20}" width="86" height="116" rx="8" fill="url(#gBattery)"/>
          <rect x="${p.x}" y="${p.y + 20}" width="86" height="10" fill="#1d1f22"/>
          <text x="${p.x + 43}" y="${p.y + 84}" text-anchor="middle" class="bat-big">9V</text>
          <text x="${p.x + 43}" y="${p.y + 104}" text-anchor="middle" class="bat-small">ALKALINE</text>
          <text x="${p.x + 22}" y="${p.y + 16}" text-anchor="middle" class="bat-pol">+</text>
          <text x="${p.x + 64}" y="${p.y + 17}" text-anchor="middle" class="bat-pol">−</text>
          ${p.label ? `<circle cx="${p.x + 43}" cy="${p.y + 166}" r="17" class="tag"/>${label(p.x + 43, p.y + 172, p.label, 'tag-t')}` : ''}
        </g>`,
      elems: (p, n) => [{ t: 'V', a: n('+'), b: n('-'), V: p.emf, r: p.r, id: p.id }],
    },

    // ── حامل بطارية رأسي (للدائرة) ──
    batteryBox: {
      terms: p => [{ name: '+', x: p.x + 40, y: p.y - 12 }, { name: '-', x: p.x + 40, y: p.y + 162 }],
      draw: p => `
        <g class="part">
          <rect x="${p.x + 32}" y="${p.y - 14}" width="16" height="16" rx="3" fill="#dfe3e8" stroke="#6d737c"/>
          <rect x="${p.x + 32}" y="${p.y + 146}" width="16" height="16" rx="3" fill="#dfe3e8" stroke="#6d737c"/>
          <rect x="${p.x}" y="${p.y}" width="80" height="150" rx="10" fill="url(#gBattery)"/>
          <rect x="${p.x}" y="${p.y}" width="80" height="26" rx="10" fill="#1d1f22"/>
          <text x="${p.x + 40}" y="${p.y + 19}" text-anchor="middle" class="bat-pol">+</text>
          <text x="${p.x + 40}" y="${p.y + 90}" text-anchor="middle" class="bat-big">9V</text>
          <text x="${p.x + 40}" y="${p.y + 138}" text-anchor="middle" class="bat-pol dark">−</text>
        </g>`,
      elems: (p, n) => [{ t: 'V', a: n('+'), b: n('-'), V: p.emf, r: p.r, id: p.id }],
    },

    // ── حامل بطاريتين AA (3 فولت) ──
    aaPack: {
      terms: p => [{ name: '+', x: p.x - 22, y: p.y + 34 }, { name: '-', x: p.x + 222, y: p.y + 34 }],
      draw: p => `
        <g class="part">
          <path d="M${p.x - 22} ${p.y + 34} h24" class="lead red"/>
          <path d="M${p.x + 198} ${p.y + 34} h24" class="lead black"/>
          <rect x="${p.x}" y="${p.y}" width="200" height="68" rx="8" fill="#26292d" stroke="#3a3f45"/>
          ${[0, 1].map(k => {
            const yy = p.y + 8 + k * 0;
            const xx = p.x + 10 + k * 92;
            return `<rect x="${xx}" y="${yy}" width="88" height="52" rx="10" fill="url(#gAA)"/>
                    <rect x="${xx + 84}" y="${yy + 18}" width="6" height="16" rx="2" fill="#c9ced4"/>
                    <text x="${xx + 42}" y="${yy + 33}" text-anchor="middle" class="aa-t">AA 1.5V</text>`;
          }).join('')}
          ${p.label ? label(p.x + 100, p.y + 92, p.label) : ''}
        </g>`,
      elems: (p, n) => [{ t: 'V', a: n('+'), b: n('-'), V: p.emf, r: p.r, id: p.id }],
    },

    // ── مقبس كهرباء المنزل ──
    outlet: {
      terms: p => [
        { name: '1', x: p.cx - 42, y: p.cy + 26 },
        { name: '2', x: p.cx + 42, y: p.cy + 26 },
        { name: '3', x: p.cx, y: p.cy - 40 },
      ],
      draw: p => `
        <g class="part">
          <rect x="${p.cx - 100}" y="${p.cy - 100}" width="200" height="200" rx="22" fill="#eef0ea" stroke="#b9bdb4" stroke-width="2"/>
          <rect x="${p.cx - 78}" y="${p.cy - 78}" width="156" height="156" rx="16" fill="#e2e5dd" stroke="#c8ccc2"/>
          ${[[p.cx - 42, p.cy + 26, '1'], [p.cx + 42, p.cy + 26, '2'], [p.cx, p.cy - 40, '3']].map(([x, y, t]) =>
            `<circle cx="${x}" cy="${y}" r="11" fill="#2b2d2a"/><circle cx="${x}" cy="${y}" r="6" fill="#111"/>
             <text x="${x}" y="${y + (t === '3' ? -18 : 30)}" text-anchor="middle" class="hole-n">${t}</text>`).join('')}
          <text x="${p.cx}" y="${p.cy + 130}" text-anchor="middle" class="plabel">${tr('مقبس 220V~', 'Socket 220V~')}</text>
          <g class="danger"><path d="M${p.cx + 76} ${p.cy - 96} l12 -22 l12 22 z" fill="#f4c430" stroke="#1d1f22" stroke-width="2"/>
          <text x="${p.cx + 88}" y="${p.cy - 100}" text-anchor="middle" class="danger-t">!</text></g>
        </g>`,
      elems: (p, n) => [
        { t: 'V', a: n(p.map.L), b: n(p.map.N), V: 220 + (p.drift || 0), r: 0.4, ac: true, id: p.id + '.LN' },
        { t: 'V', a: n(p.map.N), b: n(p.map.E), V: 1.4, r: 0.3, ac: true, id: p.id + '.NE' },
      ],
    },

    // ── مقاومة بحلقات ألوان ──
    resistor: {
      terms: p => [{ name: 'a', x: p.x, y: p.y }, { name: 'b', x: p.x + 220, y: p.y }],
      draw: p => {
        const b = colorBands(p.nominal);
        const cols = [BAND_COLORS[b.digits[0]], BAND_COLORS[b.digits[1]], b.mult < 0 ? GOLD : BAND_COLORS[b.mult], GOLD];
        const bx = [p.x + 78, p.x + 96, p.x + 114, p.x + 140];
        return `
        <g class="part">
          <path d="M${p.x} ${p.y} H${p.x + 220}" class="lead metal"/>
          <rect x="${p.x + 62}" y="${p.y - 17}" width="96" height="34" rx="15" fill="url(#gRes)" stroke="#b49a6a"/>
          ${cols.map((c, i) => `<rect x="${bx[i]}" y="${p.y - 16.5}" width="${i === 3 ? 8 : 9}" height="33" fill="${c}"/>`).join('')}
          ${p.label ? label(p.x + 110, p.y + 42, p.label) : ''}
        </g>`;
      },
      elems: (p, n) => [{ t: 'R', a: n('a'), b: n('b'), R: p.actual ?? p.nominal, id: p.id }],
    },

    // ── دايود سيليكون 1N4007 ──
    diode: {
      terms: p => [{ name: 'a', x: p.x, y: p.y }, { name: 'k', x: p.x + 200, y: p.y }],
      draw: p => `
        <g class="part">
          <path d="M${p.x} ${p.y} H${p.x + 200}" class="lead metal"/>
          <rect x="${p.x + 66}" y="${p.y - 14}" width="68" height="28" rx="5" fill="#202225"/>
          <rect x="${p.x + 118}" y="${p.y - 14}" width="9" height="28" fill="#c9ced4"/>
          <text x="${p.x + 96}" y="${p.y + 4}" text-anchor="middle" class="chip-t">4007</text>
          ${p.label ? label(p.x + 100, p.y + 40, p.label) : ''}
        </g>`,
      elems: (p, n) => [{ t: 'D', a: n('a'), b: n('k'), Is: 2.5e-13, n: 1.05, id: p.id }],
    },

    // ── LED بأرجل متساوية (القطبية مخفية) ──
    led: {
      terms: p => [{ name: 'L', x: p.cx - 56, y: p.cy + 168 }, { name: 'R', x: p.cx + 56, y: p.cy + 168 }],
      draw: p => `
        <g class="part">
          <circle id="glow-${p.id}" cx="${p.cx}" cy="${p.cy + 4}" r="70" fill="url(#gGlowRed)" opacity="0"/>
          <path d="M${p.cx - 12} ${p.cy + 40} V${p.cy + 86} L${p.cx - 56} ${p.cy + 130} V${p.cy + 168}" class="lead metal"/>
          <path d="M${p.cx + 12} ${p.cy + 40} V${p.cy + 86} L${p.cx + 56} ${p.cy + 130} V${p.cy + 168}" class="lead metal"/>
          <path d="M${p.cx - 26} ${p.cy + 34} V${p.cy} A26 26 0 0 1 ${p.cx + 26} ${p.cy} V${p.cy + 34} Z" fill="#d8323a" opacity=".82" stroke="#9e1c24"/>
          <rect x="${p.cx - 31}" y="${p.cy + 32}" width="62" height="9" rx="3" fill="#c42a32"/>
          <path d="M${p.cx - 14} ${p.cy - 6} q-4 14 0 30" stroke="#ffd2d4" stroke-width="3" fill="none" opacity=".6"/>
          <circle id="core-${p.id}" cx="${p.cx}" cy="${p.cy + 6}" r="9" fill="#ffe1e1" opacity="0"/>
          <circle cx="${p.cx - 56}" cy="${p.cy + 108}" r="15" class="tag"/>${label(p.cx - 56, p.cy + 114, tr('أ', 'A'), 'tag-t')}
          <circle cx="${p.cx + 56}" cy="${p.cy + 108}" r="15" class="tag"/>${label(p.cx + 56, p.cy + 114, tr('ب', 'B'), 'tag-t')}
        </g>`,
      elems: (p, n) => {
        const an = p.anode === 'L' ? n('L') : n('R'), ca = p.anode === 'L' ? n('R') : n('L');
        return [{ t: 'D', a: an, b: ca, Is: 1e-18, n: 2, id: p.id }];
      },
      glow: (p, I) => Math.min(1, Math.abs(I) / 0.004),
    },

    // ── مصباح صغير ──
    lamp: {
      terms: p => [{ name: 'a', x: p.cx - 34, y: p.cy + 84 }, { name: 'b', x: p.cx + 34, y: p.cy + 84 }],
      draw: p => `
        <g class="part">
          <circle id="glow-${p.id}" cx="${p.cx}" cy="${p.cy}" r="78" fill="url(#gGlowWarm)" opacity="0"/>
          <path d="M${p.cx - 10} ${p.cy + 60} V${p.cy + 70} H${p.cx - 34} V${p.cy + 84}" class="lead metal"/>
          <path d="M${p.cx + 10} ${p.cy + 60} V${p.cy + 70} H${p.cx + 34} V${p.cy + 84}" class="lead metal"/>
          <rect x="${p.cx - 18}" y="${p.cy + 28}" width="36" height="32" rx="4" fill="url(#gMetal)"/>
          ${[0, 1, 2].map(k => `<path d="M${p.cx - 18} ${p.cy + 35 + k * 8} h36" stroke="#8e949b" stroke-width="2"/>`).join('')}
          <circle cx="${p.cx}" cy="${p.cy}" r="32" fill="rgba(235,244,248,.22)" stroke="rgba(235,244,248,.7)" stroke-width="2"/>
          <path d="M${p.cx - 7} ${p.cy + 28} L${p.cx - 7} ${p.cy + 4} M${p.cx + 7} ${p.cy + 28} L${p.cx + 7} ${p.cy + 4}" stroke="#9aa0a6" stroke-width="1.6"/>
          ${p.broken
            ? `<path d="M${p.cx - 7} ${p.cy + 4} l5 -6 l3 4 M${p.cx + 7} ${p.cy + 4} l-4 -5" id="fil-${p.id}" stroke="#6b5a40" stroke-width="2" fill="none"/>`
            : `<path id="fil-${p.id}" d="M${p.cx - 7} ${p.cy + 4} l3 -6 l3 6 l3 -6 l3 6 l2 -4" stroke="#6b5a40" stroke-width="2" fill="none"/>`}
          ${p.label ? label(p.cx, p.cy - 44, p.label) : ''}
        </g>`,
      elems: (p, n) => (p.broken ? [] : [{ t: 'R', a: n('a'), b: n('b'), R: p.R, id: p.id }]),
      glow: (p, I) => Math.min(1, Math.abs(I) / p.Irated),
    },

    // ── مفتاح تشغيل (يُضغط عليه) ──
    switch: {
      terms: p => [{ name: 'a', x: p.x, y: p.y }, { name: 'b', x: p.x + 140, y: p.y }],
      draw: p => `
        <g class="part tappable" data-act="toggle" data-part="${p.id}" tabindex="0" role="button" aria-label="${p.on ? tr('مفتاح مغلق', 'Switch closed') : tr('مفتاح مفتوح', 'Switch open')}">
          <rect x="${p.x - 6}" y="${p.y - 40}" width="152" height="78" fill="transparent"/>
          <path d="M${p.x} ${p.y} H${p.x + 34} M${p.x + 106} ${p.y} H${p.x + 140}" class="lead metal"/>
          <rect x="${p.x + 30}" y="${p.y - 12}" width="80" height="24" rx="6" fill="#2c3035" stroke="#454b52"/>
          <circle cx="${p.x + 46}" cy="${p.y}" r="5" fill="#c9ced4"/><circle cx="${p.x + 94}" cy="${p.y}" r="5" fill="#c9ced4"/>
          <line x1="${p.x + 46}" y1="${p.y}" x2="${p.on ? p.x + 94 : p.x + 86}" y2="${p.on ? p.y : p.y - 26}" stroke="#e9c46a" stroke-width="5" stroke-linecap="round"/>
          <text x="${p.x + 70}" y="${p.y + 34}" text-anchor="middle" class="plabel ${p.on ? 'on' : ''}">${p.on ? tr('ON (مغلق)', 'ON (closed)') : tr('OFF (مفتوح)', 'OFF (open)')}</text>
          ${p.label ? label(p.x + 70, p.y - 32, p.label) : ''}
        </g>`,
      elems: (p, n) => (p.on && !p.broken ? [{ t: 'R', a: n('a'), b: n('b'), R: 0.03, id: p.id }] : []),
    },

    // ── وصلة قابلة للإزالة (لفتح الدائرة) ──
    jumper: {
      terms: p => [{ name: 'a', x: p.x, y: p.y }, { name: 'b', x: p.x + 100, y: p.y }],
      draw: p => `
        <g class="part tappable" data-act="jumper" data-part="${p.id}" tabindex="0" role="button" aria-label="${p.present ? tr('وصلة موجودة', 'Jumper in place') : tr('وصلة مزالة', 'Jumper removed')}">
          <rect x="${p.x - 4}" y="${p.y - 58}" width="108" height="70" fill="transparent"/>
          <rect x="${p.x - 9}" y="${p.y - 4}" width="18" height="16" rx="3" fill="#b88a3d"/>
          <rect x="${p.x + 91}" y="${p.y - 4}" width="18" height="16" rx="3" fill="#b88a3d"/>
          ${p.present
            ? `<path d="M${p.x} ${p.y} C${p.x + 10} ${p.y - 54}, ${p.x + 90} ${p.y - 54}, ${p.x + 100} ${p.y}" stroke="#2d9a63" stroke-width="7" fill="none" stroke-linecap="round"/>`
            : `<path d="M${p.x} ${p.y} C${p.x + 10} ${p.y - 54}, ${p.x + 90} ${p.y - 54}, ${p.x + 100} ${p.y}" stroke="#9fb5ae" stroke-width="3" stroke-dasharray="6 6" fill="none"/>`}
          <text x="${p.x + 50}" y="${p.y - 46}" text-anchor="middle" class="plabel small">${p.present ? tr('وصلة (اضغط لإزالتها)', 'Jumper (tap to remove)') : tr('مفتوحة (اضغط لإرجاعها)', 'Open (tap to replace)')}</text>
        </g>`,
      elems: (p, n) => (p.present ? [{ t: 'R', a: n('a'), b: n('b'), R: 0.002, id: p.id }] : []),
    },

    // ── سلك بطرفين ──
    cable: {
      terms: p => [{ name: 'a', x: p.x, y: p.y }, { name: 'b', x: p.x + p.w, y: p.y }],
      draw: p => {
        const w = p.w, m = p.x + w / 2;
        return `
        <g class="part">
          <path d="M${p.x + 14} ${p.y} C${p.x + w * 0.3} ${p.y - 34}, ${p.x + w * 0.45} ${p.y + 30}, ${m} ${p.y} S${p.x + w * 0.85} ${p.y - 26}, ${p.x + w - 14} ${p.y}"
                stroke="${p.color}" stroke-width="9" fill="none" stroke-linecap="round"/>
          <path d="M${p.x} ${p.y} h16 M${p.x + w - 16} ${p.y} h16" class="lead metal thick"/>
          ${p.label ? label(m, p.y - 24, p.label) : ''}
        </g>`;
      },
      elems: (p, n) => (p.broken ? [] : [{ t: 'R', a: n('a'), b: n('b'), R: 0.06, id: p.id }]),
    },

    // ── مصدر جهد متغيّر (Bench Power Supply) 0–12V ──
    supply: {
      terms: p => [{ name: '+', x: p.x + 196, y: p.y + 40 }, { name: '-', x: p.x + 196, y: p.y + 180 }],
      draw: p => `
        <g class="part">
          <path d="M${p.x + 170} ${p.y + 40} h26 M${p.x + 170} ${p.y + 180} h26" class="lead metal thick"/>
          <rect x="${p.x}" y="${p.y}" width="172" height="220" rx="12" fill="#d9dcd6" stroke="#9aa096" stroke-width="2"/>
          <rect x="${p.x + 10}" y="${p.y + 10}" width="152" height="200" rx="8" fill="#2c3035"/>
          <text x="${p.x + 86}" y="${p.y + 30}" text-anchor="middle" class="sup-title">DC POWER SUPPLY</text>
          <rect x="${p.x + 20}" y="${p.y + 40}" width="132" height="70" rx="5" fill="#0d1a12"/>
          <text id="sup-v-${p.id}" x="${p.x + 142}" y="${p.y + 72}" text-anchor="end" class="sup-v">${p.V.toFixed(1)}V</text>
          <text id="sup-i-${p.id}" x="${p.x + 142}" y="${p.y + 100}" text-anchor="end" class="sup-i">0.000A</text>
          <g class="tappable sup-btn" data-act="supDown" data-part="${p.id}" role="button" tabindex="0" aria-label="${tr('خفض الجهد', 'Lower voltage')}">
            <rect x="${p.x + 20}" y="${p.y + 124}" width="60" height="44" rx="8" fill="#41474f"/>
            <text x="${p.x + 50}" y="${p.y + 154}" text-anchor="middle" class="sup-b">− 1V</text></g>
          <g class="tappable sup-btn" data-act="supUp" data-part="${p.id}" role="button" tabindex="0" aria-label="${tr('رفع الجهد', 'Raise voltage')}">
            <rect x="${p.x + 92}" y="${p.y + 124}" width="60" height="44" rx="8" fill="#f5b41a"/>
            <text x="${p.x + 122}" y="${p.y + 154}" text-anchor="middle" class="sup-b dark">+ 1V</text></g>
          <text x="${p.x + 152}" y="${p.y + 46}" class="bat-pol" text-anchor="end"></text>
          <text x="${p.x + 160}" y="${p.y + 196}" text-anchor="end" class="sup-sm">OUTPUT  + / −</text>
          <circle cx="${p.x + 170}" cy="${p.y + 40}" r="9" fill="#d7322f"/><circle cx="${p.x + 170}" cy="${p.y + 180}" r="9" fill="#111"/>
        </g>`,
      elems: (p, n) => [{ t: 'V', a: n('+'), b: n('-'), V: p.V, r: 0.05, id: p.id }],
    },

    // ── لوحة اختبار: مقاومة أو LED (مع مقاومة حماية) ──
    dutBoard: {
      terms: p => [
        { name: 'in', x: p.x, y: p.y + 40 }, { name: 'out', x: p.x, y: p.y + 220 },
        { name: 'p', x: p.x + 220, y: p.y + 60 }, { name: 'q', x: p.x + 220, y: p.y + 200 },
      ],
      draw: p => {
        const x = p.x, y = p.y, isLed = p.dut === 'LED';
        const dut = isLed
          ? `<circle id="glow-${p.id}" cx="${x + 220}" cy="${y + 130}" r="60" fill="url(#gGlowRed)" opacity="0"/>
             <path d="M${x + 220} ${y + 60} V${y + 112} M${x + 220} ${y + 148} V${y + 200}" class="lead metal"/>
             <polygon points="${x + 202},${y + 112} ${x + 238},${y + 112} ${x + 220},${y + 146}" fill="#d8323a" stroke="#ffb3b6" stroke-width="1.5"/>
             <path d="M${x + 200} ${y + 148} h40" stroke="#ffb3b6" stroke-width="4"/>
             <text x="${x + 250}" y="${y + 136}" class="plabel">LED</text>`
          : `<path d="M${x + 220} ${y + 60} V${y + 200}" class="lead metal"/>
             <rect x="${x + 206}" y="${y + 86}" width="28" height="88" rx="12" fill="url(#gRes)" stroke="#b49a6a"/>
             ${[100, 114, 128].map((d, i) => `<rect x="${x + 206.5}" y="${y + d}" width="27" height="8" fill="${[BAND_COLORS[2], BAND_COLORS[2], BAND_COLORS[1]][i]}"/>`).join('')}
             <rect x="${x + 206.5}" y="${y + 152}" width="27" height="6" fill="${GOLD}"/>
             <text x="${x + 248}" y="${y + 136}" class="plabel">220Ω</text>`;
        const top = isLed
          ? `<path d="M${x} ${y + 40} H${x + 50} M${x + 150} ${y + 40} H${x + 220} V${y + 60}" class="wire"/>
             <rect x="${x + 64}" y="${y + 27}" width="72" height="26" rx="12" fill="url(#gRes)" stroke="#b49a6a"/>
             <path d="M${x + 50} ${y + 40} H${x + 64} M${x + 136} ${y + 40} H${x + 150}" class="wire"/>
             <text x="${x + 100}" y="${y + 74}" text-anchor="middle" class="plabel small">${tr('حماية 100Ω', '100Ω guard')}</text>`
          : `<path d="M${x} ${y + 40} H${x + 220} V${y + 60}" class="wire"/>`;
        return `
        <g class="part">
          <rect x="${x - 14}" y="${y}" width="${p.w || 330}" height="250" rx="14" fill="rgba(10,24,22,.55)" stroke="rgba(220,238,231,.25)" stroke-dasharray="5 5"/>
          ${top}
          <path d="M${x} ${y + 220} H${x + 220} V${y + 200}" class="wire"/>
          ${dut}
          <g class="tappable" data-act="dut" data-part="${p.id}" role="button" tabindex="0" aria-label="${tr('بدّل العنصر', 'Swap part')}">
            <rect x="${x + 30}" y="${y + 98}" width="128" height="64" rx="12" fill="#f5b41a"/>
            <text x="${x + 94}" y="${y + 125}" text-anchor="middle" class="sup-b dark">${tr('بدّل العنصر', 'Swap part')}</text>
            <text x="${x + 94}" y="${y + 147}" text-anchor="middle" class="sup-sm dark">${tr('الآن', 'Now')}: ${isLed ? 'LED' : tr('مقاومة', 'Resistor')}</text>
          </g>
          ${p.label ? label(x + 150, y + 244, p.label) : ''}
        </g>`;
      },
      elems: (p, n) => (p.dut === 'LED'
        ? [{ t: 'R', a: n('in'), b: n('p'), R: 100, id: p.id + '.rs' }, { t: 'D', a: n('p'), b: n('out'), Is: 1e-18, n: 2, id: p.id }]
        : [{ t: 'R', a: n('in'), b: n('p'), R: 0.002 }, { t: 'R', a: n('p'), b: n('out'), R: p.R || 220, id: p.id }]),
      glow: (p, I) => (p.dut === 'LED' ? Math.min(1, Math.abs(I) / 0.02) : 0),
    },

    // ── بطارية سيارة 12V مع زر تشغيل المحرك ──
    carBattery: {
      terms: p => [{ name: '+', x: p.x + 50, y: p.y - 22 }, { name: '-', x: p.x + 210, y: p.y - 22 }],
      draw: p => `
        <g class="part">
          <rect x="${p.x + 36}" y="${p.y - 22}" width="28" height="26" rx="4" fill="#c7cbd1" stroke="#7b818a"/>
          <rect x="${p.x + 196}" y="${p.y - 22}" width="28" height="26" rx="4" fill="#c7cbd1" stroke="#7b818a"/>
          <rect x="${p.x + 30}" y="${p.y - 6}" width="40" height="12" rx="3" fill="#d7322f"/>
          <rect x="${p.x + 190}" y="${p.y - 6}" width="40" height="12" rx="3" fill="#1d1f22"/>
          <rect x="${p.x}" y="${p.y}" width="260" height="160" rx="10" fill="#26292d" stroke="#3d434a" stroke-width="2"/>
          <rect x="${p.x}" y="${p.y}" width="260" height="30" rx="10" fill="#33373c"/>
          <text x="${p.x + 50}" y="${p.y + 22}" text-anchor="middle" class="bat-pol">+</text>
          <text x="${p.x + 210}" y="${p.y + 22}" text-anchor="middle" class="bat-pol">−</text>
          <text x="${p.x + 130}" y="${p.y + 88}" text-anchor="middle" class="car-big">12V</text>
          <text x="${p.x + 130}" y="${p.y + 112}" text-anchor="middle" class="sup-sm">70Ah · 640A CCA</text>
          <g class="tappable" data-act="engine" data-part="${p.id}" role="button" tabindex="0" aria-label="${p.engine ? tr('إيقاف المحرك', 'Stop engine') : tr('تشغيل المحرك', 'Start engine')}">
            <rect x="${p.x + 290}" y="${p.y + 30}" width="150" height="100" rx="50" fill="${p.engine ? '#2d9a63' : '#41474f'}" stroke="${p.engine ? '#7ee2b0' : '#5b626b'}" stroke-width="3"/>
            <text x="${p.x + 365}" y="${p.y + 74}" text-anchor="middle" class="sup-b">${p.engine ? tr('المحرك يعمل', 'Engine running') : tr('شغّل المحرك', 'Start engine')}</text>
            <text x="${p.x + 365}" y="${p.y + 100}" text-anchor="middle" class="sup-sm">${p.engine ? tr('اضغط للإيقاف', 'Tap to stop') : 'ENGINE START'}</text>
          </g>
          ${p.engine ? `<g class="vibe"><path d="M${p.x + 300} ${p.y + 150} q15 -10 30 0 t30 0 t30 0 t30 0" stroke="#7ee2b0" stroke-width="2" fill="none" opacity=".7"/></g>` : ''}
        </g>`,
      elems: (p, n) => {
        const out = [{ t: 'V', a: n('+'), b: n('-'), V: p.engine && !p.altOk ? p.emf - 0.3 : p.emf, r: 0.05, id: p.id }];
        if (p.engine && p.altOk) out.push({ t: 'V', a: n('+'), b: n('-'), V: p.alt, r: 0.004, id: p.id + '.alt' });
        return out;
      },
    },

    // ── سخّان غلاية (مفصول عن الكهرباء) ──
    heater: {
      terms: p => [{ name: 'a', x: p.x, y: p.y }, { name: 'b', x: p.x + 300, y: p.y }],
      draw: p => {
        const coil = Array.from({ length: 9 }, (_, k) => `a14 22 0 0 1 22 0`).join(' ');
        return `
        <g class="part">
          <path d="M${p.x + 60} ${p.y - 120} q90 -50 180 0 l10 110 h-200 z" fill="rgba(220,230,235,.08)" stroke="rgba(220,230,235,.35)" stroke-width="2"/>
          <path d="M${p.x + 240} ${p.y - 100} q40 10 34 50" stroke="rgba(220,230,235,.35)" stroke-width="8" fill="none"/>
          <path d="M${p.x} ${p.y} H${p.x + 52}" class="lead metal thick"/>
          <path d="M${p.x + 52} ${p.y} ${coil}" stroke="#a9762e" stroke-width="7" fill="none" stroke-linecap="round"/>
          <path d="M${p.x + 250} ${p.y} H${p.x + 300}" class="lead metal thick"/>
          <g transform="translate(${p.x + 330} ${p.y - 100})">
            <rect x="0" y="0" width="54" height="40" rx="8" fill="#eef0ea"/><rect x="12" y="40" width="8" height="18" fill="#b7bec6"/><rect x="34" y="40" width="8" height="18" fill="#b7bec6"/>
            <path d="M27 0 C27 -30 -20 -30 -30 -10" stroke="#eef0ea" stroke-width="5" fill="none"/>
            <line x1="-6" y1="-6" x2="60" y2="64" stroke="#ef5d58" stroke-width="5"/>
          </g>
          <text x="${p.x + 357}" y="${p.y - 18}" text-anchor="middle" class="plabel small">${tr('مفصول', 'Unplugged')}</text>
          ${p.label ? label(p.x + 150, p.y + 52, p.label) : ''}
        </g>`;
      },
      elems: (p, n) => [{ t: 'R', a: n('a'), b: n('b'), R: p.R, id: p.id }],
    },

    // ── مكثف إلكتروليتي: يخزّن شحنة حقيقية (p.vc) تتغير مع الزمن ──
    capacitor: {
      terms: p => [{ name: '+', x: p.cx - 30, y: p.cy + 200 }, { name: '-', x: p.cx + 30, y: p.cy + 200 }],
      draw: p => `
        <g class="part">
          <path d="M${p.cx - 14} ${p.cy + 120} V${p.cy + 150} L${p.cx - 30} ${p.cy + 172} V${p.cy + 200}" class="lead metal"/>
          <path d="M${p.cx + 14} ${p.cy + 120} V${p.cy + 150} L${p.cx + 30} ${p.cy + 172} V${p.cy + 186}" class="lead metal"/>
          <rect x="${p.cx - 40}" y="${p.cy}" width="80" height="122" rx="14" fill="url(#gCap)"/>
          <ellipse cx="${p.cx}" cy="${p.cy + 6}" rx="38" ry="8" fill="#9aa3ad"/>
          <path d="M${p.cx - 8} ${p.cy + 2} l16 8 M${p.cx + 8} ${p.cy + 2} l-16 8" stroke="#6b737c" stroke-width="2"/>
          <rect x="${p.cx + 12}" y="${p.cy + 14}" width="22" height="104" rx="4" fill="#c9d6e3" opacity=".85"/>
          ${[0, 1, 2, 3].map(k => `<text x="${p.cx + 23}" y="${p.cy + 40 + k * 22}" text-anchor="middle" class="cap-minus">−</text>`).join('')}
          <text x="${p.cx - 12}" y="${p.cy + 56}" text-anchor="middle" class="cap-t">${p.uF}µF</text>
          <text x="${p.cx - 12}" y="${p.cy + 76}" text-anchor="middle" class="cap-t sm">25V</text>
          <text x="${p.cx - 30}" y="${p.cy + 222}" text-anchor="middle" class="plabel small">+</text>
          <text x="${p.cx + 30}" y="${p.cy + 222}" text-anchor="middle" class="plabel small">−</text>
          ${p.label ? label(p.cx, p.cy - 16, p.label) : ''}
          <g class="tappable" data-act="discharge" data-part="${p.id}" role="button" tabindex="0" aria-label="${tr('فرّغ المكثف', 'Discharge the capacitor')}">
            <rect x="${p.cx + 70}" y="${p.cy + 36}" width="150" height="50" rx="12" fill="${p.discharging ? '#2d9a63' : '#41474f'}" stroke="#5b626b"/>
            <text x="${p.cx + 145}" y="${p.cy + 67}" text-anchor="middle" class="sup-b">${p.discharging ? tr('يتم التفريغ…', 'Discharging…') : tr('فرّغ المكثف', 'Discharge')}</text>
          </g>
        </g>`,
      elems: (p, n) => [
        { t: 'V', a: n('+'), b: n('-'), V: p.vc || 0, r: 2, id: p.id },
        { t: 'R', a: n('+'), b: n('-'), R: 5e7 },
      ],
    },

    // ── ترانزستور TO-92: وصلتان (قاعدة-باعث، قاعدة-مجمّع) والأرجل غير معلّمة ──
    transistor: {
      terms: p => [1, 2, 3].map((k, i) => ({ name: String(k), x: p.cx - 60 + i * 60, y: p.cy + 190 })),
      draw: p => `
        <g class="part">
          ${[0, 1, 2].map(i => `<path d="M${p.cx - 16 + i * 16} ${p.cy + 66} V${p.cy + 110} L${p.cx - 60 + i * 60} ${p.cy + 150} V${p.cy + 190}" class="lead metal"/>`).join('')}
          <path d="M${p.cx - 38} ${p.cy + 70} V${p.cy + 10} A38 38 0 0 1 ${p.cx + 38} ${p.cy + 10} V${p.cy + 70} Z" fill="#202225"/>
          <rect x="${p.cx - 38}" y="${p.cy + 10}" width="76" height="60" fill="#2a2c30"/>
          <text x="${p.cx}" y="${p.cy + 38}" text-anchor="middle" class="chip-t big">${p.code || 'BC547'}</text>
          ${[1, 2, 3].map((k, i) => `<circle cx="${p.cx - 60 + i * 60}" cy="${p.cy + 130}" r="14" class="tag"/>${label(p.cx - 60 + i * 60, p.cy + 136, k, 'tag-t')}`).join('')}
          ${p.label ? label(p.cx, p.cy - 40, p.label) : ''}
        </g>`,
      elems: (p, n) => {
        const pin = role => n(String(p.pins.indexOf(role) + 1));
        const B = pin('B'), C = pin('C'), E = pin('E');
        const be = { Is: 1e-13, n: 1.05 }, bc = { Is: 4e-13, n: 1.05 };   // وصلة BE أعلى قليلاً من BC
        return p.kind === 'NPN'
          ? [{ t: 'D', a: B, b: E, ...be, id: p.id + '.be' }, { t: 'D', a: B, b: C, ...bc, id: p.id + '.bc' }]
          : [{ t: 'D', a: E, b: B, ...be, id: p.id + '.be' }, { t: 'D', a: C, b: B, ...bc, id: p.id + '.bc' }];
      },
    },

    // ── مقاومة متغيّرة 10k بمقبض ──
    pot: {
      terms: p => [1, 2, 3].map((k, i) => ({ name: String(k), x: p.cx - 60 + i * 60, y: p.cy + 150 })),
      draw: p => {
        const ang = -135 + 270 * p.pos;
        return `
        <g class="part">
          ${[0, 1, 2].map(i => `<path d="M${p.cx - 60 + i * 60} ${p.cy + 60} V${p.cy + 150}" class="lead metal"/>`).join('')}
          <rect x="${p.cx - 80}" y="${p.cy - 30}" width="160" height="96" rx="12" fill="#2f5aa8" stroke="#1d3e7a" stroke-width="2"/>
          <circle cx="${p.cx}" cy="${p.cy + 18}" r="34" fill="#1c1f22" stroke="#4a5058" stroke-width="3"/>
          <g transform="rotate(${ang.toFixed(1)} ${p.cx} ${p.cy + 18})"><rect x="${p.cx - 4}" y="${p.cy - 14}" width="8" height="26" rx="3" fill="#f3f4f1"/></g>
          <text x="${p.cx - 62}" y="${p.cy + 58}" class="pot-t">10k</text>
          ${[1, 2, 3].map((k, i) => `<text x="${p.cx - 60 + i * 60}" y="${p.cy + 174}" text-anchor="middle" class="plabel small">${k}</text>`).join('')}
          <g class="tappable" data-act="potDown" data-part="${p.id}" role="button" tabindex="0" aria-label="${tr('لفّ المقبض يساراً', 'Turn knob left')}">
            <rect x="${p.cx - 150}" y="${p.cy - 4}" width="56" height="44" rx="10" fill="#41474f"/><text x="${p.cx - 122}" y="${p.cy + 24}" text-anchor="middle" class="sup-b">↺</text></g>
          <g class="tappable" data-act="potUp" data-part="${p.id}" role="button" tabindex="0" aria-label="${tr('لفّ المقبض يميناً', 'Turn knob right')}">
            <rect x="${p.cx + 94}" y="${p.cy - 4}" width="56" height="44" rx="10" fill="#f5b41a"/><text x="${p.cx + 122}" y="${p.cy + 24}" text-anchor="middle" class="sup-b dark">↻</text></g>
          ${p.label ? label(p.cx, p.cy - 44, p.label) : ''}
        </g>`;
      },
      elems: (p, n) => [
        { t: 'R', a: n('1'), b: n('2'), R: Math.max(20, p.R * p.pos), id: p.id + '.a' },
        { t: 'R', a: n('2'), b: n('3'), R: Math.max(20, p.R * (1 - p.pos)), id: p.id + '.b' },
      ],
    },

    // ── مقاومة ضوئية LDR مع مصباح مكتب ──
    ldr: {
      terms: p => [{ name: 'a', x: p.cx - 30, y: p.cy + 150 }, { name: 'b', x: p.cx + 30, y: p.cy + 150 }],
      draw: p => `
        <g class="part">
          ${p.light ? `<circle cx="${p.cx}" cy="${p.cy}" r="90" fill="url(#gGlowWarm)" opacity=".55"/>` : ''}
          <path d="M${p.cx - 14} ${p.cy + 30} V${p.cy + 100} L${p.cx - 30} ${p.cy + 120} V${p.cy + 150}" class="lead metal"/>
          <path d="M${p.cx + 14} ${p.cy + 30} V${p.cy + 100} L${p.cx + 30} ${p.cy + 120} V${p.cy + 150}" class="lead metal"/>
          <circle cx="${p.cx}" cy="${p.cy}" r="34" fill="#d9c08a" stroke="#a88d55" stroke-width="2"/>
          <path d="M${p.cx - 22} ${p.cy - 14} h44 M${p.cx - 22} ${p.cy - 4} h44 M${p.cx - 22} ${p.cy + 6} h44 M${p.cx - 22} ${p.cy + 16} h44" stroke="#c0392b" stroke-width="3"/>
          <path d="M${p.cx + 22} ${p.cy - 14} v10 M${p.cx - 22} ${p.cy - 4} v10 M${p.cx + 22} ${p.cy + 6} v10" stroke="#c0392b" stroke-width="3"/>
          <g class="tappable" data-act="light" data-part="${p.id}" role="button" tabindex="0" aria-label="${tr('شغّل أو أطفئ الضوء', 'Toggle the light')}">
            <rect x="${p.cx + 70}" y="${p.cy - 40}" width="150" height="56" rx="12" fill="${p.light ? '#f5b41a' : '#41474f'}"/>
            <text x="${p.cx + 145}" y="${p.cy - 6}" text-anchor="middle" class="sup-b ${p.light ? 'dark' : ''}">${p.light ? tr('الضوء: مضاء', 'Light: ON') : tr('الضوء: مطفأ', 'Light: OFF')}</text>
          </g>
          ${p.label ? label(p.cx, p.cy - 50, p.label) : ''}
        </g>`,
      elems: (p, n) => [{ t: 'R', a: n('a'), b: n('b'), R: p.light ? 1200 : 180000, id: p.id }],
    },

    // ── فيوز زجاجي ──
    fuse: {
      terms: p => [{ name: 'a', x: p.x, y: p.y }, { name: 'b', x: p.x + 200, y: p.y }],
      draw: p => `
        <g class="part">
          <path d="M${p.x} ${p.y} H${p.x + 40} M${p.x + 160} ${p.y} H${p.x + 200}" class="lead metal thick"/>
          <rect x="${p.x + 40}" y="${p.y - 16}" width="22" height="32" rx="4" fill="url(#gMetal)"/>
          <rect x="${p.x + 138}" y="${p.y - 16}" width="22" height="32" rx="4" fill="url(#gMetal)"/>
          <rect x="${p.x + 62}" y="${p.y - 13}" width="76" height="26" rx="4" fill="rgba(220,235,245,.18)" stroke="rgba(220,235,245,.6)"/>
          ${p.broken
            ? `<path d="M${p.x + 62} ${p.y} q10 -3 22 -1 M${p.x + 138} ${p.y} q-12 3 -24 1" stroke="#c9ced4" stroke-width="2" fill="none"/><circle cx="${p.x + 100}" cy="${p.y}" r="5" fill="rgba(60,60,60,.5)"/>`
            : `<path d="M${p.x + 62} ${p.y} H${p.x + 138}" stroke="#c9ced4" stroke-width="2"/>`}
          ${p.label ? label(p.x + 100, p.y + 40, p.label) : ''}
        </g>`,
      elems: (p, n) => (p.broken ? [] : [{ t: 'R', a: n('a'), b: n('b'), R: 0.05, id: p.id }]),
    },
  };

  function hex(cx, cy, r) {
    return Array.from({ length: 6 }, (_, i) => {
      const a = Math.PI / 6 + i * Math.PI / 3;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
  }

  const DEFS = `
    <defs>
      <linearGradient id="gBattery" x1="0" x2="1"><stop offset="0" stop-color="#e0771b"/><stop offset=".5" stop-color="#f59a2c"/><stop offset="1" stop-color="#c9620f"/></linearGradient>
      <linearGradient id="gAA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3f45"/><stop offset=".45" stop-color="#b87333"/><stop offset=".55" stop-color="#b87333"/><stop offset="1" stop-color="#2a2d31"/></linearGradient>
      <linearGradient id="gRes" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1dfb6"/><stop offset=".5" stop-color="#dcc28e"/><stop offset="1" stop-color="#bfa16a"/></linearGradient>
      <linearGradient id="gCap" x1="0" x2="1"><stop offset="0" stop-color="#1f3f7a"/><stop offset=".5" stop-color="#3b6cc0"/><stop offset="1" stop-color="#1a3566"/></linearGradient>
      <linearGradient id="gMetal" x1="0" x2="1"><stop offset="0" stop-color="#8e949b"/><stop offset=".5" stop-color="#e3e6ea"/><stop offset="1" stop-color="#8e949b"/></linearGradient>
      <radialGradient id="gGlowRed"><stop offset="0" stop-color="#ff4d55" stop-opacity=".95"/><stop offset=".4" stop-color="#ff3540" stop-opacity=".35"/><stop offset="1" stop-color="#ff3540" stop-opacity="0"/></radialGradient>
      <radialGradient id="gGlowWarm"><stop offset="0" stop-color="#fff3b0" stop-opacity="1"/><stop offset=".35" stop-color="#ffd35a" stop-opacity=".45"/><stop offset="1" stop-color="#ffb020" stop-opacity="0"/></radialGradient>
    </defs>`;

  /** يرسم المشهد كاملاً ويعيد نص SVG */
  function renderScene(scene) {
    const parts = scene.parts.map(p => TYPES[p.type].draw(p)).join('');
    const wires = (scene.wires || []).map(w =>
      `<polyline class="wire" points="${w.map(pt => pt.join(',')).join(' ')}"/>`).join('') +
      (scene.labels || []).map(([x, y, t]) => `<text x="${x}" y="${y}" text-anchor="middle" class="scene-label">${t}</text>`).join('');
    const terms = allTerms(scene).map(t => `
      <g class="term" data-term="${t.id}">
        <circle class="term-ring" cx="${t.x}" cy="${t.y}" r="9"/>
        <circle class="term-dot" cx="${t.x}" cy="${t.y}" r="3.2"/>
        <circle class="term-hit" cx="${t.x}" cy="${t.y}" r="24"/>
      </g>`).join('');
    return `<svg viewBox="0 0 ${scene.w || 640} ${scene.h || 420}" class="bench-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${tr('طاولة العمل', 'Workbench')}">
      ${DEFS}${wires}${parts}${terms}</svg>`;
  }

  function nodeFn(p) {
    return name => (p.nodes && p.nodes[name]) || `${p.id}.${name}`;
  }

  function allTerms(scene) {
    const out = [];
    for (const p of scene.parts) {
      const n = nodeFn(p);
      for (const t of TYPES[p.type].terms(p)) out.push({ id: `${p.id}:${t.name}`, part: p.id, name: t.name, node: n(t.name), x: t.x, y: t.y });
    }
    return out;
  }

  function circuit(scene) {
    const out = [];
    for (const p of scene.parts) out.push(...TYPES[p.type].elems(p, nodeFn(p)));
    return out;
  }

  window.Parts = { TYPES, renderScene, allTerms, circuit, colorBands, fmtOhms, BAND_COLORS, BAND_NAMES, BAND_NAMES_EN, GOLD };
})();
