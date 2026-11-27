/*
 * pages.js — صفحات المنصة: مسارات التعلم، صفحة الدرس، المصادر، عن المنصة.
 * المحتوى يأتي من المهام نفسها (Missions) حتى لا يتكرر، والدروس الخاصة
 * (الجولة، القوانين، القطع) معرّفة هنا.
 * © 2026 ALKING TECH
 */
(function () {
  'use strict';
  const L = (ar, en) => ({ ar, en });
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ── رسومات بطاقات المسارات (SVG خفيفة بدل الصور) ──
  const ART = {
    meter: `<svg viewBox="0 0 320 150" aria-hidden="true">
      <defs><linearGradient id="aM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc93d"/><stop offset="1" stop-color="#e59b12"/></linearGradient></defs>
      <g transform="translate(112 8) rotate(-8 48 70)"><rect width="96" height="150" rx="18" fill="url(#aM)"/><rect x="9" y="9" width="78" height="132" rx="12" fill="#25282c"/>
      <rect x="17" y="18" width="62" height="34" rx="5" fill="#b9f0d6"/><text x="73" y="44" text-anchor="end" font-family="Consolas,monospace" font-style="italic" font-weight="700" font-size="21" fill="#16201a">9.00</text>
      <circle cx="48" cy="92" r="24" fill="#17191c" stroke="#3a3e44" stroke-width="2"/><rect x="45" y="70" width="6" height="22" rx="3" fill="#e6ebef" transform="rotate(30 48 92)"/>
      <circle cx="26" cy="130" r="5" fill="#d7322f"/><circle cx="48" cy="130" r="5" fill="#0c0d0e" stroke="#555"/><circle cx="70" cy="130" r="5" fill="#d7322f"/></g>
      <path d="M150 158 C 120 120, 70 140, 40 110" stroke="#d7322f" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M170 158 C 210 120, 260 140, 286 104" stroke="#111" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`,
    resistor: `<svg viewBox="0 0 320 150" aria-hidden="true">
      <defs><radialGradient id="aR"><stop offset="0" stop-color="#a66beb" stop-opacity=".55"/><stop offset="1" stop-color="#a66beb" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="160" cy="92" rx="140" ry="40" fill="url(#aR)"/>
      <path d="M20 78H96M224 78H300" stroke="#c9ced4" stroke-width="5" stroke-linecap="round"/>
      <rect x="92" y="54" width="136" height="48" rx="22" fill="#dcc28e" stroke="#b49a6a" stroke-width="2"/>
      <rect x="118" y="54" width="12" height="48" fill="#7a4a21"/><rect x="142" y="54" width="12" height="48" fill="#1b1b1b"/><rect x="166" y="54" width="12" height="48" fill="#d1352b"/><rect x="200" y="54" width="10" height="48" fill="#c9a13b"/>
      <rect x="40" y="114" width="240" height="18" rx="9" fill="rgba(255,255,255,.06)" stroke="rgba(196,160,255,.35)"/></svg>`,
    scope: `<svg viewBox="0 0 320 150" aria-hidden="true">
      <rect x="40" y="14" width="240" height="124" rx="14" fill="#1f2226" stroke="#3a3e44" stroke-width="2"/>
      <rect x="54" y="26" width="160" height="100" rx="6" fill="#0d1f1a"/>
      <path d="M54 51h160M54 76h160M54 101h160M94 26v100M134 26v100M174 26v100" stroke="rgba(120,255,200,.12)"/>
      <path d="M56 76 C 70 30, 84 30, 98 76 S 126 122, 140 76 S 168 30, 182 76 S 206 116, 212 90" stroke="#5cf2b0" stroke-width="3" fill="none"/>
      <circle cx="244" cy="50" r="12" fill="#2c3035" stroke="#555"/><circle cx="244" cy="88" r="12" fill="#2c3035" stroke="#555"/><rect x="230" y="110" width="28" height="12" rx="4" fill="#a66beb"/></svg>`,
    board: `<svg viewBox="0 0 320 150" aria-hidden="true">
      <defs><radialGradient id="aB"><stop offset="0" stop-color="#ffd45e" stop-opacity=".9"/><stop offset="1" stop-color="#ffb000" stop-opacity="0"/></radialGradient></defs>
      <rect x="30" y="40" width="260" height="96" rx="10" fill="#ecebe6" stroke="#bdbab0" stroke-width="2"/>
      <g fill="#b4b1a6">${Array.from({ length: 4 }, (_, r) => Array.from({ length: 22 }, (_, c) => `<rect x="${44 + c * 11}" y="${54 + r * 20 + (r > 1 ? 10 : 0)}" width="5" height="5" rx="1"/>`).join('')).join('')}</g>
      <path d="M80 70 V40 H150 V70" stroke="#d7322f" stroke-width="4" fill="none"/><path d="M190 100 V140 H262 V100" stroke="#111" stroke-width="4" fill="none"/>
      <rect x="118" y="60" width="54" height="16" rx="7" fill="#dcc28e"/><rect x="128" y="60" width="5" height="16" fill="#7a4a21"/><rect x="138" y="60" width="5" height="16" fill="#1b1b1b"/><rect x="148" y="60" width="5" height="16" fill="#d1352b"/>
      <circle cx="222" cy="56" r="30" fill="url(#aB)"/><path d="M214 70V48a8 8 0 0 1 16 0v22z" fill="#ffd257"/></svg>`,
  };

  // ── الدروس الخاصة (ليست مهام بنجوم) ──
  const SPECIAL = {
    tour: { href: '#tour', icon: '?', look: 'meter', mins: 3,
      title: L('التعرّف على جهاز الملتيميتر', 'Meet the multimeter'),
      brief: L('جهاز الملتيميتر أداة قياس متعددة الاستخدامات: يقيس الجهد والتيار والمقاومة، ويفحص الاستمرارية والدايود. في هذه الجولة تتعرّف على كل جزء فيه وماذا يفعل.', 'A multimeter is a multi-purpose measuring tool: it measures voltage, current and resistance, and tests continuity and diodes. This tour shows every part and what it does.'),
      goals: [L('التعرّف على أجزاء الجهاز', 'Know the parts of the meter'), L('فهم وظائف مفتاح الاختيار', 'Understand the selector dial'), L('معرفة المداخل والمجسات', 'Know the jacks and probes')] },
    laws: { href: '#laws', icon: 'V=IR', mins: 6,
      title: L('الجهد والتيار والمقاومة', 'Voltage, current & resistance'),
      brief: L('ما الفرق بين الجهد والتيار والمقاومة؟ ومتى نقيس على التوازي ومتى على التوالي؟ مسار من سبع خطوات، ومقارنة واضحة، وكل قانون مع مثال وحاسبة.', 'What is the difference between voltage, current and resistance? When do we measure in parallel or in series? A seven-step path, a clear comparison, and every law with an example and a calculator.'),
      goals: [L('التمييز بين الجهد والتيار والمقاومة', 'Tell voltage, current and resistance apart'), L('قانون أوم وتطبيقاته', "Ohm's law in practice"), L('التوالي والتوازي', 'Series and parallel')] },
    components: { href: '#components', icon: 'NPN', look: 'transistor', mins: 8,
      title: L('مكتبة القطع الإلكترونية', 'The parts library'),
      brief: L('هذا مكثف، وهذا ترانزستور… لكل قطعة شكلها ورمزها في المخططات، وكيف تفحصها بالجهاز، والقراءة السليمة، وأشهر أعطالها.', "This is a capacitor, that's a transistor… each part's look, its schematic symbol, how to test it, the healthy reading and common faults."),
      goals: [L('التعرّف على شكل كل قطعة', 'Recognise each part'), L('قراءة رموز المخططات', 'Read schematic symbols'), L('فحص القطع بالجهاز', 'Test parts with the meter')] },
  };

  const PATHS = [
    { id: 'beginner', art: 'meter', lv: 1,
      level: L('المستوى المبتدئ', 'Beginner'), title: L('التعرّف على الملتيميتر', 'Getting to know the multimeter'),
      brief: L('التعرّف على الجهاز وأجزائه وكيفية استخدامه، ثم أول قياساتك الحقيقية.', 'Meet the meter and its parts, then take your first real readings.'),
      lessons: ['@tour', '@laws', 'battery', 'outlet', 'resistors', 'cables', 'led'] },
    { id: 'intermediate', art: 'resistor', lv: 2,
      level: L('المستوى المتوسط', 'Intermediate'), title: L('الجهد والتيار والمقاومة', 'Voltage, current & resistance'),
      brief: L('قياس التيار على التوالي، ومقسّم الجهد، وقانون أوم برسم بياني، وأجهزة المنزل.', 'Current in series, voltage dividers, Ohm’s law on a chart and household appliances.'),
      lessons: ['current', 'series', 'divider', 'ohmlaw', 'kettle'] },
    { id: 'advanced', art: 'scope', lv: 3,
      level: L('المستوى المتقدم', 'Advanced'), title: L('تحليل الدوائر واكتشاف الأعطال', 'Circuit analysis & fault-finding'),
      brief: L('المكثف والترانزستور والحساسات، ثم تشخيص أعطال حقيقية في السيارة والكشاف والجهاز التناظري.', 'Capacitors, transistors and sensors, then real fault-finding in a car, a flashlight and with an analog meter.'),
      lessons: ['@components', 'capacitor', 'transistor', 'sensors', 'car', 'analog', 'flashlight'] },
    { id: 'free', art: 'board', lv: 0,
      level: L('الممارسة الحرة', 'Free practice'), title: L('جرّب بلا قيود', 'Experiment freely'),
      brief: L('نفّذ تجاربك الخاصة: مختبر حر بجهاز رقمي أو تناظري، وورشة تبني فيها دوائرك بنفسك.', 'Run your own experiments: a free lab with a digital or analog meter, and a workshop where you build your own circuits.'),
      lessons: ['free', 'build'] },
  ];

  // صورة الدرس: شكل القطعة الأساسية في المهمة إن وجدت
  const LOOK_OF = { battery: 'battery', resistors: 'resistor', cables: 'switch', led: 'led', current: 'lamp', series: 'resistor', divider: 'resistor', ohmlaw: 'resistor', capacitor: 'capacitor', transistor: 'transistor', sensors: 'ldr', car: 'battery', flashlight: 'lamp', build: 'led' };

  let ctx = null;   // { progress, stats, tourSeen, levelOf, stars, inExam }
  function setContext(c) { ctx = c; }

  function lesson(key) {
    if (key[0] === '@') {
      const k = key.slice(1), sp = SPECIAL[k];
      const st = ctx.stats();
      const done = k === 'tour' ? ctx.tourSeen() : k === 'laws' ? (st.laws || 0) > 0 : (st.comps || 0) > 0;
      return { key, id: k, special: true, href: sp.href, icon: sp.icon, look: sp.look, mins: sp.mins, title: T(sp.title), brief: T(sp.brief), goals: sp.goals.map(T), done, stars: null };
    }
    const m = Missions.byId(key);
    if (!m) return null;
    const p = ctx.progress()[m.id];
    const numbered = m.num > 0;
    return {
      key, id: m.id, special: false, num: numbered ? m.num : 0, href: '#lab-' + m.id, icon: m.icon, look: LOOK_OF[m.id], mins: Math.max(2, Math.round((m.tasks.length || 3) * 1.6)),
      title: T(m.title), brief: T(m.brief),
      goals: (m.learned && m.learned.length ? m.learned : (m.skills || [])).slice(0, 3).map(T),
      skills: (m.skills || []).map(T), done: numbered ? !!p : false, stars: numbered ? (p ? p.stars : 0) : null,
    };
  }
  function pathStats(P) {
    const ls = P.lessons.map(lesson).filter(Boolean);
    const done = ls.filter(l => l.done).length;
    return { ls, done, total: ls.length, mins: ls.reduce((a, l) => a + l.mins, 0) };
  }

  function pathCard(P, compact, start) {
    const st = pathStats(P), pct = Math.round(st.done / st.total * 100);
    return `<a class="path-card ${compact ? 'compact' : ''} ${start ? 'start' : ''}" href="#path-${P.id}" data-lv="${P.lv}">
      <div class="pc-art">${ART[P.art]}${start ? `<span class="pc-ribbon">${icon('play')} ${tr('ابدأ هنا', 'Start here')}</span>` : ''}</div>
      <div class="pc-body">
        <span class="pc-level">${esc(T(P.level))}</span>
        <h3>${esc(T(P.title))}</h3>
        <p>${esc(T(P.brief))}</p>
        <div class="pc-meta"><span>${icon('book')} ${st.total} ${tr('دروس', 'lessons')}</span><span>${icon('clock')} ~${st.mins} ${tr('د', 'min')}</span></div>
        <div class="pc-foot"><div class="bar"><span style="--w:${pct}%"></span></div><small>${st.done}/${st.total}</small><span class="pc-go">${icon('arrow', 'flip-rtl')}</span></div>
      </div></a>`;
  }

  function renderPaths(el) {
    el.innerHTML = `
      <header class="page-hero">
        <p class="eyebrow">${tr('مسارات التعلم', 'Learning paths')}</p>
        <h1>${tr('اختر مسارك وابدأ خطوة بخطوة', 'Pick your path and learn step by step')}</h1>
        <p class="lead-p">${tr('أربعة مسارات مرتّبة من التعرّف على الجهاز حتى تشخيص الأعطال. كل درس ينقلك مباشرة إلى المحاكاة لتطبّق ما تعلّمته.', 'Four ordered paths, from meeting the meter to fault-finding. Every lesson takes you straight into the simulation to practise what you learned.')}</p>
      </header>
      <div class="path-grid">${PATHS.map(P => pathCard(P)).join('')}</div>
      <section class="how">
        <h2>${tr('كيف تعمل المسارات؟', 'How do paths work?')}</h2>
        <ol class="how-steps">
          <li><span class="how-n">1</span><b>${tr('اقرأ الدرس', 'Read the lesson')}</b><small>${tr('شرح مختصر وأهداف واضحة ومدة متوقعة.', 'A short explanation, clear goals and an expected time.')}</small></li>
          <li><span class="how-n">2</span><b>${tr('طبّق في المختبر', 'Practise in the lab')}</b><small>${tr('خطوات تتحقق تلقائياً من قراءتك الحية.', 'Steps that check your live reading automatically.')}</small></li>
          <li><span class="how-n">3</span><b>${tr('أجب واكسب النجوم', 'Answer and earn stars')}</b><small>${tr('سؤال ختامي، ونجوم حسب دقتك، وشارات.', 'A final question, stars for accuracy, and badges.')}</small></li>
        </ol>
      </section>`;
  }

  function lessonVisual(l) {
    const look = l.look === 'meter' ? ART.meter : l.look && Components.LOOK[l.look] ? `<svg viewBox="0 0 120 80" aria-hidden="true">${Components.LOOK[l.look]}</svg>` : '';
    return `<div class="lv-art">${look || `<span class="lv-lcd" dir="ltr">${esc(l.icon)}</span>`}${look ? `<span class="lv-chip" dir="ltr">${esc(l.icon)}</span>` : ''}</div>`;
  }

  function renderPath(el, pathId, lessonKey) {
    const P = PATHS.find(p => p.id === pathId) || PATHS[0];
    const st = pathStats(P);
    const cur = st.ls.find(l => l.key === lessonKey || l.id === lessonKey) || st.ls.find(l => !l.done) || st.ls[0];
    const i = st.ls.indexOf(cur), next = st.ls[i + 1];
    const goalIc = ['shield', 'target', 'wrench'];
    el.innerHTML = `
      <nav class="crumbs" aria-label="${tr('المسار', 'Breadcrumb')}">
        <a href="#paths" class="crumb-back" aria-label="${tr('رجوع', 'Back')}">${icon('arrow', 'flip-rtl back-ic')}</a>
        <a href="#paths">${tr('المسارات', 'Paths')}</a><span>/</span><b>${esc(T(P.level))}</b>
      </nav>
      <div class="lesson-layout">
        <div class="lesson-main">
          <article class="lesson-hero">
            ${lessonVisual(cur)}
            <div class="lh-text">
              <span class="pc-level">${tr('الدرس', 'Lesson')} ${i + 1} / ${st.total}${cur.done ? ` · <b class="ok">${icon('check')} ${tr('مكتمل', 'Done')}</b>` : ''}</span>
              <h1>${esc(cur.title)}</h1>
              <p>${esc(cur.brief)}</p>
              <div class="lh-actions">
                <a class="btn primary big" href="${cur.href}">${icon('play')} ${cur.special ? tr('ابدأ الدرس', 'Start the lesson') : cur.done ? tr('أعد التجربة', 'Try it again') : tr('ابدأ التجربة', 'Start the experiment')}</a>
                ${next ? `<a class="btn" href="#path-${P.id}:${next.key.replace('@', '')}">${tr('الدرس التالي', 'Next lesson')} ${icon('arrow', 'flip-rtl')}</a>` : ''}
              </div>
            </div>
          </article>
          <div class="lesson-info">
            <section class="goals">
              <h2>${icon('target')} ${tr('أهداف الدرس', 'Lesson goals')}</h2>
              <div class="goal-grid">${cur.goals.map((g, k) => `<div class="goal"><span class="goal-ic">${icon(goalIc[k % 3])}</span><p>${esc(g)}</p></div>`).join('')}</div>
            </section>
            <aside class="facts">
              <div class="fact"><span>${icon('chart')}</span><div><small>${tr('مستوى الدرس', 'Level')}</small><b>${esc(T(P.level))}</b></div></div>
              <div class="fact"><span>${icon('clock')}</span><div><small>${tr('المدة المتوقعة', 'Expected time')}</small><b>~${cur.mins} ${tr('دقائق', 'min')}</b></div></div>
              ${cur.stars != null ? `<div class="fact"><span>${icon('star')}</span><div><small>${tr('أفضل نتيجة', 'Best result')}</small><b class="mstars">${ctx.stars(cur.stars)}</b></div></div>` : ''}
            </aside>
          </div>
          ${cur.skills && cur.skills.length ? `<div class="chips">${cur.skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>` : ''}
        </div>
        <aside class="lesson-side">
          <h2>${tr('محتويات المسار', 'Path contents')}</h2>
          <div class="ls-prog"><div class="bar"><span style="--w:${Math.round(st.done / st.total * 100)}%"></span></div><small>${st.done}/${st.total}</small></div>
          <ol class="ls-list">${st.ls.map((l, k) => `<li><a class="${l === cur ? 'on' : ''} ${l.done ? 'done' : ''}" href="#path-${P.id}:${l.key.replace('@', '')}" ${l === cur ? 'aria-current="true"' : ''}>
            <span class="ls-n">${l.done ? icon('check') : k + 1}</span><span class="ls-t">${esc(l.title)}</span>${l === cur ? icon('play', 'ls-ic') : icon('arrow', 'ls-ic flip-rtl')}</a></li>`).join('')}</ol>
          <a class="btn primary block" href="${cur.href}">${icon('play')} ${tr('ابدأ الدرس', 'Start the lesson')}</a>
          <div class="ls-other">${PATHS.filter(p => p !== P).map(p => `<a href="#path-${p.id}">${esc(T(p.level))}</a>`).join('')}</div>
        </aside>
      </div>`;
  }

  function renderResources(el, opts) {
    const o = opts || {};
    const tile = (href, ic, t, d, extra, attrs) => `<a class="res-card" href="${href}" ${attrs || ''}><span class="res-ic">${icon(ic)}</span><div><h3>${t}</h3><p>${d}</p>${extra || ''}</div>${icon('arrow', 'res-go flip-rtl')}</a>`;
    el.innerHTML = `
      <header class="page-hero">
        <p class="eyebrow">${tr('المصادر والدليل', 'Resources & guide')}</p>
        <h1>${tr('كل ما تحتاجه في مكان واحد', 'Everything you need in one place')}</h1>
        <p class="lead-p">${tr('مراجع سريعة تعود إليها أثناء التجارب: القوانين، القطع الإلكترونية، دليل الجهاز ونصائح السلامة، وتقدّمك.', 'Quick references to come back to while you experiment: the laws, electronic components, the meter guide and safety tips, and your progress.')}</p>
      </header>
      <div class="res-grid">
        ${tile('#tour', 'eye', tr('تعرّف على الجهاز', 'Meet the meter'), tr('جولة تفاعلية تشرح كل جزء في الجهاز خطوة بخطوة.', 'An interactive tour of every part of the meter, step by step.'))}
        ${tile('#guide', 'book', tr('دليل الجهاز', 'Meter guide'), tr('كيف تستخدم المختبر، النطاقات، الجهاز التناظري، وشيفرة ألوان المقاومات.', 'Using the lab, the ranges, the analog meter and the resistor colour code.'), '', 'data-open-guide')}
        ${tile('#laws', 'sigma', tr('القوانين', 'The laws'), tr('الفرق بين الجهد والتيار والمقاومة، وقانون أوم والقدرة، مع حاسبات.', "Voltage vs current vs resistance, Ohm's law and power, with calculators."), '<span class="chip">V = I × R</span>')}
        ${tile('#components', 'resistor', tr('القطع الإلكترونية', 'Electronic components'), tr('11 قطعة: شكلها ورمزها وكيف تفحصها والقراءة السليمة وأعطالها.', '11 parts: looks, symbol, how to test, the healthy reading and faults.'), `<span class="chip">${tr('مكتبة', 'Library')}</span>`)}
        ${tile('#progress', 'trophy', tr('تقدّمي وشاراتي', 'My progress & badges'), tr('المهارات، والشارات، وسجل المهام، والشهادة عند الإكمال.', 'Skills, badges, mission history and your certificate when complete.'))}
      </div>
      <section class="safety">
        <h2>${icon('shield')} ${tr('قواعد السلامة الذهبية', 'Golden safety rules')}</h2>
        <ul class="safety-list">
          <li>${tr('إذا لم تعرف القيمة، ابدأ بأكبر نطاق.', "If you don't know the value, start on the highest range.")}</li>
          <li>${tr('لا تقس التيار على التوازي أبداً.', 'Never measure current in parallel.')}</li>
          <li>${tr('افصل الكهرباء قبل قياس المقاومة أو الاستمرارية.', 'Disconnect power before measuring resistance or continuity.')}</li>
          <li>${tr('أمسك المجسات من المقابض العازلة فقط.', 'Hold the probes only by their insulated grips.')}</li>
        </ul>
      </section>
      ${o.teacher ? `<section class="note">${icon('user')} ${tr('أنت متصل بخادم الصف: لوحة المعلم متاحة على', 'You are connected to a class server: the teacher panel is at')} <a href="teacher" dir="ltr">/teacher</a></section>` : ''}`;
  }

  function renderAbout(el, o) {
    const n = o.counts;
    el.innerHTML = `
      <header class="page-hero about-hero">
        <p class="eyebrow">${tr('عن المنصة', 'About')}</p>
        <h1>${tr('أداة تعليمية تقنية، يستطيع أي شخص التعلّم منها', 'A technical learning tool anyone can learn from')}</h1>
        <p class="lead-p">${tr('مختبر الملتيميتر منصة مجانية من ALKING TECH لتعلّم القياسات الكهربائية. لا نريد موقعاً جميلاً فقط: الجهاز والدائرة هنا يتصرّفان مثل الحقيقيين، فتتعلّم من الخطأ قبل أن تكلّفك القطع.', 'Multimeter Lab is a free platform by ALKING TECH for learning electrical measurement. Not just a pretty site: the meter and circuits here behave like the real thing, so you learn from mistakes before they cost you parts.')}</p>
      </header>
      <div class="about-stats">
        <div><b>${n.missions}</b><span>${tr('مهمة تفاعلية', 'interactive missions')}</span></div>
        <div><b>${n.parts}</b><span>${tr('قطعة إلكترونية', 'electronic parts')}</span></div>
        <div><b>${n.challenges}</b><span>${tr('تحديات بناء', 'build challenges')}</span></div>
        <div><b>2</b><span>${tr('لغتان', 'languages')}</span></div>
      </div>
      <div class="about-grid">
        <section class="about-card"><span class="res-ic">${icon('bolt')}</span><h3>${tr('محاكاة حقيقية', 'Real simulation')}</h3><p>${tr('حلّال دوائر بالتحليل العقدي يحسب كل قراءة: مقاومة الجهاز الداخلية، الفيوزات، الدايود والترانزستور، وشحن المكثف مع الزمن.', 'A nodal-analysis circuit solver computes every reading: the meter’s internal resistance, fuses, diodes and transistors, and capacitor charging over time.')}</p></section>
        <section class="about-card"><span class="res-ic">${icon('cap')}</span><h3>${tr('للطلاب والمعلمين', 'For students and teachers')}</h3><p>${tr('بدون تسجيل. وعند تشغيله على خادم الصف: لوحة معلم، وضع اختبار بوقت، وتحليل الأخطاء الشائعة، وتصدير النتائج.', 'No sign-up. On a class server: a teacher panel, timed exam mode, common-mistake analytics and result export.')}</p></section>
        <section class="about-card"><span class="res-ic">${icon('globe')}</span><h3>${tr('في كل مكان', 'Everywhere')}</h3><p>${tr('عربي وEnglish، يعمل على الجوال والكمبيوتر، ويمكن تثبيته كتطبيق ويعمل دون إنترنت.', 'Arabic and English, on phones and computers, installable as an app and works offline.')}</p></section>
      </div>
      <section class="about-brand">
        <svg class="logo" viewBox="0 0 40 36" width="56" height="50" aria-hidden="true"><path d="M20 3 L37.5 33 H2.5 Z" fill="none" stroke="#D5AD59" stroke-width="3.4" stroke-linejoin="round"/><path d="M20 14.5 L28.5 29 H11.5 Z" fill="#D5AD59"/><path d="M21.6 17.5 L17.6 23.6 H20.6 L18.6 28" fill="none" stroke="#160F23" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div><h2 dir="ltr">ALKING <i>TECH</i></h2><p>${tr('صُمّم وطُوّر بواسطة ALKING TECH. جميع الحقوق محفوظة. الاستخدام للتعلّم مجاني، والنسخ أو إعادة النشر يحتاج إذناً.', 'Designed and built by ALKING TECH. All rights reserved. Free to use for learning; copying or republishing needs permission.')}</p></div>
        <a class="btn primary" href="https://www.instagram.com/alking.tech" target="_blank" rel="noopener"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg><span dir="ltr">@alking.tech</span></a>
      </section>`;
  }

  window.Pages = { PATHS, ART, setContext, pathCard, renderPaths, renderPath, renderResources, renderAbout, pathOf: id => PATHS.find(P => P.lessons.includes(id)) };
})();
