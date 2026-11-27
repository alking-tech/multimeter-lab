/*
 * app.js — واجهة التطبيق: الصفحة الرئيسية، المختبر، ورشة الدوائر، القوانين،
 * المجسات، المهام، الرسم البياني، وضع الاختبار، الشهادة، اللغة، وحفظ التقدّم.
 */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const store = {
    get(k, d) { try { const v = localStorage.getItem('ml.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('ml.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };

  const S = {
    view: 'home', mission: null, scene: null, terms: {}, question: null,
    analog: false, analogPref: store.get('analogPref', false),
    meter: { pos: 0, jack: 'V', fuseMA: true, fuse10: true, hold: false, heldText: '', light: false },
    probes: { red: { term: null }, black: { term: null } },
    sel: null, done: [], mistakes: 0, hints: 0, hinted: new Set(), finished: false, started: 0, last: null, snap: null,
    evKeys: new Set(),
    progress: store.get('progress', {}),
    student: store.get('student', null),
    server: false, exam: null, examClockSkew: 0,
  };
  let DIG, ANA;
  const MUI = () => (S.analog ? ANA : DIG);
  const POS = () => (S.analog ? Meter.ANALOG_POSITIONS : Meter.POSITIONS);
  const curPos = () => POS()[S.meter.pos];
  const isBuilder = () => !!(S.mission && S.mission.builder);

  // ════════════════════════════════ وضع الاختبار
  const examDoneKey = () => 'examDone.' + (S.exam ? S.exam.id : 0);
  const examDone = () => new Set(store.get(examDoneKey(), []));
  const examLeft = () => (S.exam ? Math.max(0, S.exam.ends_at - (Date.now() / 1000 + S.examClockSkew)) : 0);
  const examActive = () => !!S.exam && examLeft() > 0;
  const inExam = () => !!S.exam;

  // ════════════════════════════════ الصفحة الرئيسية
  function stars(n, max) {
    return Array.from({ length: max || 3 }, (_, i) => `<span class="star ${i < n ? 'on' : ''}">★</span>`).join('');
  }

  const LV = (ar, en) => ({ ar, en });
  const LEVELS = [
    { n: 1, t: LV('أساسيات القياس', 'Measuring basics'), ids: ['battery', 'outlet', 'resistors', 'cables', 'led', 'usb'] },
    { n: 2, t: LV('الدوائر والقوانين', 'Circuits & laws'), ids: ['current', 'series', 'parallel', 'divider', 'ohmlaw', 'kettle'] },
    { n: 3, t: LV('القطع الإلكترونية', 'Electronic components'), ids: ['capacitor', 'transistor', 'sensors', 'ntc', 'relay'] },
    { n: 4, t: LV('تطبيقات وتشخيص', 'Real world & troubleshooting'), ids: ['car', 'analog', 'flashlight'] },
  ];
  const levelOf = id => (LEVELS.find(l => l.ids.includes(id)) || { n: 1 }).n;

  function card(m, extraChips, opts) {
    const p = S.progress[m.id], o = opts || {};
    const numbered = m.num > 0;
    const tag = o.locked ? 'div' : 'a';
    const mins = Math.max(2, Math.round((m.tasks.length || 3) * 1.6));
    return `<${tag} class="mcard ${p && numbered ? 'done' : ''} ${numbered ? '' : 'free'} ${o.locked ? 'locked' : ''}" ${tag === 'a' ? `href="#lab-${m.id}"` : ''}>
      <div class="mc-head"><span class="mc-lcd">${esc(m.icon)}</span>
        ${p && numbered ? `<span class="mc-done" title="${tr('مكتملة', 'Done')}">${icon('check')}</span>` : `<span class="mc-num">${numbered ? String(m.num).padStart(2, '0') : ''}</span>`}</div>
      <h3>${esc(T(m.title))}</h3><p>${esc(T(m.brief))}</p>
      ${extraChips ? `<div class="chips">${extraChips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>` : ''}
      ${numbered ? `<div class="mc-foot"><span class="diff" data-d="${Math.min(3, levelOf(m.id))}" title="${tr('الصعوبة', 'Difficulty')}"><i></i><i></i><i></i></span>
        <span>${icon('clock')} ~${mins} ${tr('د', 'min')}</span>
        <span class="mstars">${o.status || stars(p?.stars || 0)}</span></div>` : ''}
    </${tag}>`;
  }

  const HERO = [
    { m: 'DC', v: '9.41', u: 'V', c: LV('بطارية 9V', '9V battery'), r: '20V', pos: 'v20' },
    { m: 'AC', v: '221', u: 'V', c: LV('مقبس المنزل', 'Wall socket'), r: '600V~', pos: 'vac600' },
    { m: '', v: '4.70', u: 'kΩ', c: LV('مقاومة 4.7k', '4.7k resistor'), r: '20kΩ', pos: 'r20k' },
    { m: 'DC', v: '57.6', u: 'mA', c: LV('تيار المصباح', 'Lamp current'), r: '200mA', pos: 'a200m' },
    { m: '', v: '1.786', u: 'V', c: LV('LED أحمر', 'Red LED'), r: '▶|', pos: 'diode' },
    { m: '', v: 'OL', u: 'Ω', c: LV('سلك مقطوع', 'Broken wire'), r: '•)))', pos: 'cont' },
  ];
  let heroI = 0, heroTimer = 0, HM = null;
  function heroTick() {
    const h = HERO[heroI % HERO.length];
    if (!$('#heroMeter')) return;
    if (!HM) {
      HM = MeterUI.create('digital');
      HM.mount($('#heroMeter'), { onPos() {}, onJack() {}, onButton() {} });
      // معرّفات تدرّج فريدة حتى لا تتعارض مع جهاز المختبر
      const hs = $('#heroMeter svg');
      if (hs) hs.innerHTML = hs.innerHTML.replace(/(mHol|mKnob)-digital/g, '$1-hero');
      $$('#heroMeter [tabindex]').forEach(e => e.removeAttribute('tabindex'));
    }
    const pi = Meter.POSITIONS.findIndex(p => p.id === h.pos);
    HM.setPos(pi < 0 ? 0 : pi);
    HM.setDisplay({ text: h.v, unit: h.u, modeTag: h.m, light: true });
    $('#hvCap').textContent = T(h.c); $('#hvRange').textContent = h.r;
  }
  function startHero() {
    clearInterval(heroTimer); heroTick();
    FX.hero($('.hero-vis'));
    if (!UI.reduce()) heroTimer = setInterval(() => { if (S.view === 'home') { heroI++; heroTick(); } }, 2600);
  }

  function renderHome() {
    const list = Missions.list;
    const doneCount = list.filter(m => S.progress[m.id]).length;
    const totalStars = list.reduce((a, m) => a + (S.progress[m.id]?.stars || 0), 0);
    const next = list.find(m => !S.progress[m.id]) || list[0];
    const fresh = doneCount === 0;
    $('#homeStats').innerHTML = fresh ? '' : `
      <div class="stat-ring">${UI.ring(doneCount / list.length, 76, tr('نسبة الإنجاز', 'Completion'))}
        <div class="stat"><b id="hsDone">0</b><span>${tr(`من ${list.length} مهمة`, `of ${list.length} missions`)}</span></div></div>
      <div class="stat"><b><span id="hsStars">0</span><small>/${list.length * 3}</small></b><span>${tr('نجوم', 'stars')}</span></div>
      <div class="stat"><b><span id="hsBuild">0</span><small>/${Builder.CHALLENGES.length}</small></b><span>${tr('تحديات الورشة', 'workshop challenges')}</span></div>`;
    UI.countUp($('#hsDone'), doneCount); UI.countUp($('#hsStars'), totalStars); UI.countUp($('#hsBuild'), Builder.doneCount());
    $('#startBtn').innerHTML = `${icon('play')} ${doneCount ? tr(`تابع: ${esc(T(next.title))}`, `Continue: ${esc(T(next.title))}`) : tr('دخول المختبر', 'Enter the lab')}`;
    $('#startBtn').onclick = () => go(doneCount ? 'lab-' + next.id : 'lab-free');
    $('#pathsBtn').innerHTML = `${icon('book')} ${tr('استكشف الدروس', 'Explore the lessons')}`;
    $('#certBtn').innerHTML = `${icon('cap')} ${tr('شهادتك', 'Your certificate')}`;
    $('#certBtn').hidden = doneCount < list.length;
    $('#startPath').hidden = true;

    const exam = inExam();
    $('#examHome').hidden = !exam;
    ['.hero', '.features', '#homePaths', '#homeNext'].forEach(q => { $(q).hidden = exam; });
    if (exam) {
      $('#startPath').hidden = true;
      const done = examDone(), over = !examActive();
      $('#examHome').innerHTML = `<h2>${icon('clock')} ${esc(S.exam.title)}</h2>
        <p>${over ? tr('انتهى وقت الاختبار. نتائجك وصلت للمعلم.', 'Time is up. Your results reached the teacher.')
          : tr(`أنجز المهام التالية قبل انتهاء الوقت. لكل مهمة محاولة واحدة${S.exam.hints ? '' : '، والتلميحات مغلقة'}.`, `Finish these missions before time runs out. One attempt each${S.exam.hints ? '' : ', hints are off'}.`)}</p>
        <div class="grid">${S.exam.missions.map(id => Missions.byId(id)).filter(Boolean).map(m => {
          const d = done.has(m.id);
          const status = d ? tr('✓ تم التسليم', '✓ Submitted') : over ? tr('انتهى الوقت', 'Time up') : tr('محاولة واحدة', 'One attempt');
          return card(m, null, { locked: d || over, status: `<span class="chip">${status}</span>` });
        }).join('')}</div>`;
    } else {
      $('#homePaths').innerHTML = `<div class="sec-head"><div><p class="eyebrow">${fresh ? tr('ابدأ من هنا', 'Start here') : tr('تابع رحلتك', 'Continue your journey')}</p><h2>${tr('مسارات التعلم', 'Learning paths')}</h2><p>${tr('اختر المسار المناسب لمستواك وابدأ التعلّم خطوة بخطوة.', 'Pick the path that fits your level and learn step by step.')}</p></div>
        <a class="btn ghost small" href="#paths">${tr('كل المسارات', 'All paths')} ${icon('arrow', 'flip-rtl')}</a></div>
        <div class="path-grid compact">${Pages.PATHS.map((P, k) => Pages.pathCard(P, true, fresh && k === 0)).join('')}</div>`;
      const todo = list.filter(m => !S.progress[m.id]);
      const pick = (todo.length ? todo : list).slice(0, 3);
      $('#homeNext').innerHTML = `<div class="sec-head"><div><p class="eyebrow">${tr('جاهزة لك', 'Ready for you')}</p><h2>${doneCount ? tr('تجاربك التالية', 'Your next experiments') : tr('أول التجارب', 'First experiments')}</h2><p>${tr(`${list.length} تجربة في أربعة مستويات، كل تجربة تتحقق من قراءتك الحية.`, `${list.length} experiments in four levels; each checks your live reading.`)}</p></div>
        <a class="btn ghost small" href="#experiments">${tr('كل التجارب', 'All experiments')} ${icon('arrow', 'flip-rtl')}</a></div>
        <div class="grid">${pick.map(m => card(m)).join('')}</div>`;
    }
    renderStudentChip();
    startHero();
  }

  // ── صفحة التجارب العملية ──
  function renderExperiments() {
    const list = Missions.list, f = S.expFilter || 0;
    $('#missionsTitle').textContent = tr(`${list.length} تجربة من أول قياس حتى تشخيص الأعطال`, `${list.length} experiments, from your first reading to fault-finding`);
    $('#missionsSub').textContent = tr('أربعة مستويات. ابدأ من أي تجربة، وكل تجربة تتحقق من قراءتك الحية وتمنحك نجوماً حسب دقتك.', 'Four levels. Start anywhere: every experiment checks your live reading and gives stars for accuracy.');
    $('#expFilters').innerHTML = [{ n: 0, t: LV('الكل', 'All') }, ...LEVELS].map(lv => `<button class="fchip" data-f="${lv.n}" aria-pressed="${lv.n === f}">${lv.n ? `<b>${lv.n}</b> ` : ''}${esc(T(lv.t))}</button>`).join('');
    $$('#expFilters [data-f]').forEach(b => b.onclick = () => { S.expFilter = +b.dataset.f; renderExperiments(); });
    $('#missionGrid').innerHTML = LEVELS.filter(lv => !f || lv.n === f).map(lv => {
      const ms = lv.ids.map(id => Missions.byId(id)), d = ms.filter(m => S.progress[m.id]).length;
      return `<section class="level"><header class="level-head"><span class="level-badge">${tr('المستوى', 'LEVEL')} ${lv.n}</span><h3>${esc(T(lv.t))}</h3>
        <div class="level-prog"><div class="bar"><span style="--w:${Math.round(d / ms.length * 100)}%"></span></div><small>${d}/${ms.length}</small></div>
        <span class="swipe-hint">${tr('اسحب للمزيد', 'Swipe for more')} ${icon('arrow', 'swipe-ic')}</span></header>
        <div class="grid">${ms.map(m => card(m)).join('')}</div></section>`;
    }).join('');
    $('#extras').hidden = !!f;
    $('#extraGrid').innerHTML =
      card(Builder.MISSION, [tr('ابنِ بنفسك', 'Build it yourself'), tr('5 تحديات', '5 challenges')]) +
      card(Missions.free, [tr('جهاز رقمي أو تناظري', 'Digital or analog'), tr('بدون نجوم', 'No stars')]);
  }

  // «ابدأ من هنا»: ثلاث خطوات للمبتدئ، تختفي بعد إكمالها
  function renderStartPath() {
    const st = Progress.Stats.get();
    const steps = [
      { href: '#tour', ic: 'eye', t: tr('تعرّف على الجهاز', 'Meet the meter'), d: tr('جولة قصيرة على كل جزء وماذا يفعل', 'A short tour of every part and what it does'), done: Tour.seen() },
      { href: '#laws', ic: 'sigma', t: tr('افهم الأساسيات', 'Learn the basics'), d: tr('الفرق بين الجهد والتيار والمقاومة', 'Voltage vs current vs resistance'), done: (st.laws || 0) > 0 },
      { href: '#lab-battery', ic: 'play', t: tr('أول قياس لك', 'Your first reading'), d: tr('مهمة «البطارية الضعيفة»', 'The "Weak Battery" mission'), done: !!S.progress.battery },
    ];
    const box = $('#startPath');
    const allDone = steps.every(x => x.done);
    box.hidden = allDone || inExam();
    if (box.hidden) return;
    const nextI = steps.findIndex(x => !x.done);
    box.innerHTML = `<div class="sec-head"><div><h2>${tr('ابدأ من هنا', 'Start here')}</h2><p>${tr('ثلاث خطوات قصيرة قبل المهام، بالترتيب.', 'Three short steps before the missions, in order.')}</p></div></div>
      <ol class="sp-steps">${steps.map((x, i) => `<li><a class="sp-step ${x.done ? 'done' : ''} ${i === nextI ? 'next' : ''}" href="${x.href}">
        <span class="sp-n">${x.done ? icon('check') : i + 1}</span>
        <span class="sp-body"><b>${x.t}</b><small>${x.d}</small></span>${icon(x.ic, 'sp-ic')}</a></li>`).join('')}</ol>`;
  }

  function renderStudentChip() {
    const el = $('#studentChip');
    // الاسم يُطلب فقط أثناء اختبار يديره المعلم؛ غير ذلك المنصة مفتوحة بدون تسجيل
    if (!S.server || !S.exam) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `${icon('user')} ${S.student ? esc(S.student.name) : tr('سجّل اسمك', 'Sign in')}`;
  }

  // ════════════════════════════════ المختبر
  function setMeterKind(analog) {
    S.analog = analog;
    $('#meterDig').hidden = analog; $('#meterAna').hidden = !analog;
    $$('#meterSwitch button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.kind === 'analog') === analog)));
    S.meter.pos = 0; S.meter.jack = 'V'; S.meter.hold = false;
    MUI().setPos(0); MUI().setJack('V');
    if (analog) ANA.setNeedle(0);
  }

  function openMission(id) {
    const m = Missions.byId(id);
    if (!m) return go('home');
    if (inExam() && (!S.exam.missions.includes(m.id) || examDone().has(m.id) || !examActive())) {
      toast(tr('هذه الصفحة غير متاحة أثناء الاختبار.', 'Not available during the exam.'), 'warn');
      return go('home');
    }
    S.mission = m;
    S.scene = m.setup();
    S.scene.w = S.scene.w || 640; S.scene.h = S.scene.h || 420;
    if (m.builder) Builder.attach(S.scene);
    S.done = m.tasks.map(() => false);
    S.mistakes = 0; S.hints = 0; S.hinted.clear(); S.finished = false; S.started = Date.now(); S.evKeys.clear(); S.question = null;
    S.probes.red = { term: null }; S.probes.black = { term: null };
    S.sel = null;
    S.meter.fuseMA = true; S.meter.fuse10 = true;
    const free = m.id === 'free' || m.builder;
    setMeterKind(m.meter === 'analog' ? true : free ? S.analogPref : false);
    $('#meterSwitch').hidden = !free;
    renderBench(); renderPanel(); renderFuses(); renderLibrary(); paintLabHead();
    requestAnimationFrame(() => { layout(); update(); });
    const wantTour = S.pendingTour || (!Tour.seen() && !inExam() && !m.builder);
    S.pendingTour = false;
    if (wantTour) setTimeout(() => { if (S.view === 'lab') Tour.start(S.analog ? 'analog' : 'digital'); }, 700);
  }

  // ── مكتبة المكونات (عمود المختبر) ──
  const LIB_COMP = { battery9: 'battery', batteryBox: 'battery', aaPack: 'battery', carBattery: 'battery', resistor: 'resistor', diode: 'diode', led: 'led', lamp: 'lamp', switch: 'switch', capacitor: 'capacitor', transistor: 'transistor', pot: 'pot', ldr: 'ldr', fuse: 'fuse', ntc: 'ntc', relay: 'relay' };
  const LIB_OTHER = { outlet: [LV('مقبس كهرباء', 'Wall socket'), 'bolt'], cable: [LV('سلك', 'Cable'), 'wire'], supply: [LV('مصدر متغير', 'Power supply'), 'battery'], dutBoard: [LV('لوحة دائرة', 'Circuit board'), 'wrench'], heater: [LV('سخان', 'Heater'), 'flame'], jumper: [LV('وصلة', 'Jumper'), 'wire'], usbCharger: [LV('شاحن USB', 'USB charger'), 'battery'] };
  function renderLibrary() {
    const box = $('#libList');
    if (!S.scene) { box.innerHTML = ''; return; }
    if (isBuilder()) {
      $('#libTitle').textContent = tr('أدوات البناء', 'Build tools');
      const cur = Builder.tool();
      box.innerHTML = Builder.TOOLS.map(t => `<button class="lib-item ${cur === t.id ? 'on' : ''}" data-tool="${t.id}" aria-pressed="${cur === t.id}">
        <span class="lib-vis">${icon(t.icon)}</span><span class="lib-n">${esc(T(t))}</span></button>`).join('');
      $$('[data-tool]', box).forEach(b => b.onclick = () => Builder.setTool(b.dataset.tool));
      return;
    }
    $('#libTitle').textContent = tr('المكونات', 'Components');
    const seen = new Map();
    for (const p of S.scene.parts) {
      const key = LIB_COMP[p.type] || p.type;
      if (!LIB_COMP[p.type] && !LIB_OTHER[p.type]) continue;
      seen.set(key, (seen.get(key) || 0) + 1);
    }
    box.innerHTML = [...seen].map(([k, n]) => {
      const comp = Components.PARTS.find(c => c.id === k);
      const name = comp ? T(comp.name) : T(LIB_OTHER[k][0]);
      const vis = comp ? `<svg viewBox="0 0 120 80" aria-hidden="true">${Components.LOOK[k]}</svg>` : icon(LIB_OTHER[k][1]);
      return `<button class="lib-item" ${comp ? `data-comp="${k}"` : 'disabled'} title="${esc(name)}">
        <span class="lib-vis">${vis}</span><span class="lib-n">${esc(name)}</span>${n > 1 ? `<i class="lib-x">×${n}</i>` : ''}${comp ? icon('info', 'lib-i') : ''}</button>`;
    }).join('') || `<p class="lib-empty">${tr('لا قطع في هذا المشهد', 'No parts here')}</p>`;
    $$('[data-comp]', box).forEach(b => b.onclick = () => modal(`${Components.info(b.dataset.comp)}
      <div class="modal-actions"><a class="btn small" href="#components">${icon('book')} ${tr('مكتبة القطع كاملة', 'Full parts library')}</a><button class="btn primary small" data-close>${tr('رجوع للتجربة', 'Back to the experiment')}</button></div>`));
  }

  function paintLabHead() {
    const m = S.mission; if (!m) return;
    const P = Pages.pathOf(m.id);
    $('#labCrumb').textContent = m.num > 0 ? `${tr('التجربة', 'Experiment')} ${String(m.num).padStart(2, '0')} · ${T(m.title)}` : T(m.title);
    $('#labBack').setAttribute('href', P && P.id !== 'free' ? `#path-${P.id}:${m.id}` : '#experiments');
  }

  function renderBench() {
    $('#bench').innerHTML = Parts.renderScene(S.scene);
    S.terms = {};
    for (const t of Parts.allTerms(S.scene)) S.terms[t.id] = t;
    markAttached();
  }

  function markAttached() {
    $$('#bench .term').forEach(g => {
      g.classList.toggle('has-red', S.probes.red.term === g.dataset.term);
      g.classList.toggle('has-black', S.probes.black.term === g.dataset.term);
    });
  }

  // ── لوحة المهمة ──
  function renderPanel() {
    const m = S.mission, isFree = m.id === 'free', build = !!m.builder, plain = isFree || build;
    $('#pTitle').innerHTML = plain ? esc(T(m.title)) : `<span class="pnum">${m.num}</span>${esc(T(m.title))}`;
    $('#pBrief').textContent = T(m.brief);
    $('#pWarn').hidden = !m.warn;
    $('#pWarn').innerHTML = m.warn ? `${icon('alert')}<span>${esc(T(m.warn))}</span>` : '';
    $('#pColors').hidden = !m.colorGuide;
    if (m.colorGuide) $('#pColors').innerHTML = colorTable(true);
    $('#pFree').hidden = !isFree;
    $('#pBuild').hidden = !build;
    $('#pTasks').hidden = plain;
    $('#pHintBtn').hidden = plain || (inExam() && !S.exam.hints);
    $('#pRestart').hidden = inExam() || build;
    $('#pProgress').hidden = plain;
    $('#pChartBox').hidden = !m.chart;
    if (build) Builder.renderPanel($('#pBuild'));
    renderTasks();
    if (m.chart) renderChart();
  }

  function currentTask() { return S.done.findIndex(d => !d); }

  function renderTasks() {
    const m = S.mission, cur = currentTask();
    $('#pTasks').innerHTML = m.tasks.map((t, i) => `
      <li class="${S.done[i] ? 'done' : ''} ${i === cur ? 'cur' : ''}">
        <span class="tick-box">${S.done[i] ? icon('check') : i + 1}</span><span>${esc(T(t.text))}</span></li>`).join('');
    const n = S.done.filter(Boolean).length;
    $('#pProgress').innerHTML = `<span style="width:${m.tasks.length ? (n / m.tasks.length) * 100 : 0}%"></span>`;
    $('#pCurrent').textContent = m.builder ? tr('ورشة: اختر عنصراً واضغط على نقطتين', 'Workshop: pick a part, tap two posts')
      : m.id === 'free' ? tr('تجربة حرة: اسحب المجسات إلى أي عنصر', 'Free play: drag the probes to any part')
      : cur >= 0 ? tr(`الخطوة ${cur + 1} من ${m.tasks.length}: `, `Step ${cur + 1} of ${m.tasks.length}: `) + T(m.tasks[cur].text)
      : tr('أحسنت! أجب على السؤال الأخير', 'Well done! Answer the final question');
    $('#pHint').hidden = true;
    $('#pHintBtn').disabled = cur < 0;
    $('#pHintBtn').innerHTML = icon('bulb') + ' ' + (S.hinted.has(cur) || cur < 0 ? tr('تلميح', 'Hint') : tr('تلميح (−½ نجمة)', 'Hint (−½ star)'));
    renderQuestion();
  }

  function renderQuestion() {
    const box = $('#pQuestion');
    if (!S.mission.question || currentTask() >= 0) { box.hidden = true; return; }
    if (!S.question) S.question = S.mission.question(S.scene);
    const q = S.question;
    box.hidden = false;
    box.innerHTML = `<h4>${icon('target')} ${tr('سؤال الختام', 'Final question')}</h4><p>${esc(q.text)}</p>
      <div class="answers">${q.choices.map((c, i) => `<button class="ans" data-i="${i}" ${S.finished ? 'disabled' : ''}>${esc(c.label)}</button>`).join('')}</div>`;
    $$('.ans', box).forEach(b => b.onclick = () => answer(+b.dataset.i, b));
  }

  function answer(i, btn) {
    if (S.finished) return;
    const c = S.question.choices[i];
    if (c.ok) { btn.classList.add('right'); Sound.ok(); finish(); }
    else {
      mistake('wrong', c.label);
      btn.classList.add('wrong'); btn.disabled = true;
      Sound.wrong();
      toast(inExam() ? tr('إجابة خاطئة. في الاختبار تُحسب عليك، جرّب مرة أخرى.', 'Wrong answer. In the exam it counts against you; try again.')
        : tr('ليست الإجابة الصحيحة. راجع قراءاتك وحاول مرة أخرى.', 'Not quite. Check your readings and try again.'), 'warn');
    }
  }

  function scoreStars() { const s = S.mistakes + S.hints * 0.5; return s === 0 ? 3 : s <= 2 ? 2 : 1; }

  function finish() {
    S.finished = true;
    const m = S.mission, q = S.question, st = scoreStars();
    const secs = Math.round((Date.now() - S.started) / 1000);
    const prev = S.progress[m.id];
    if (!prev || st > prev.stars) S.progress[m.id] = { stars: st, mistakes: S.mistakes, hints: S.hints, secs };
    store.set('progress', S.progress);
    sendProgress(m.id, st, S.mistakes, secs, S.hints);
    if (inExam()) { const d = examDone(); d.add(m.id); store.set(examDoneKey(), [...d]); }

    const list = inExam() ? S.exam.missions.map(Missions.byId).filter(Boolean) : Missions.list;
    const nextM = list.slice(list.indexOf(m) + 1).find(x => !inExam() || !examDone().has(x.id));
    const all = !inExam() && Missions.list.every(x => S.progress[x.id]);
    const fresh = Progress.newBadges();
    modal(`
      <div class="finish">
        <div class="big-stars">${stars(st)}</div>
        <h2>${tr(`أنجزت مهمة «${esc(T(m.title))}»`, `Mission complete: “${esc(T(m.title))}”`)}</h2>
        <p class="meta"><span>${icon('clock')} ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}</span><span>${icon('alert')} ${tr('الأخطاء', 'Mistakes')}: ${S.mistakes}</span><span>${icon('bulb')} ${tr('التلميحات', 'Hints')}: ${S.hints}</span></p>
        ${fresh.length ? `<div class="new-badges">${fresh.map(b => `<span class="new-badge">${icon(b.ic)} ${tr('وسام جديد', 'New badge')}: ${esc(T(b.t))}</span>`).join('')}</div>` : ''}
        <div class="why"><b>${tr('لماذا؟', 'Why?')}</b> ${esc(q.why)}</div>
        <h3>${tr('ماذا تعلّمت', 'What you learned')}</h3>
        <ul class="learned">${m.learned.map(l => `<li>${icon('check')}<span>${esc(T(l))}</span></li>`).join('')}</ul>
        <div class="modal-actions">
          ${all ? `<button class="btn primary" data-cert="1">${icon('cap')} ${tr('احصل على شهادتك', 'Get your certificate')}</button>` : ''}
          ${nextM ? `<button class="btn ${all ? '' : 'primary'}" data-go="lab-${nextM.id}">${tr('المهمة التالية', 'Next mission')}: ${esc(T(nextM.title))}</button>` : ''}
          ${inExam() ? '' : `<button class="btn" data-again="1">${icon('refresh')} ${tr('أعد المحاولة', 'Retry')}</button>`}
          <button class="btn ghost" data-go="home">${inExam() ? tr('قائمة الاختبار', 'Exam list') : tr('قائمة المهام', 'All missions')}</button>
        </div>
      </div>`);
    renderQuestion();
    setTimeout(() => UI.confetti($('#modalBody .big-stars'), { count: st === 3 ? 140 : 70 }), 250);
  }

  function mistake(type, detail) { S.mistakes++; logEvent(type, detail); }
  function logEvent(type, detail) {
    if (!S.server || !S.student || !S.mission) return;
    fetch('api/event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student: S.student.name, klass: S.student.klass || '', mission: S.mission.id, type, detail: String(detail || '').slice(0, 80), exam: S.exam ? S.exam.id : null }),
    }).catch(() => { /* ignore */ });
  }

  // ════════════════════════════════ القياس والتحديث
  function snapshot(m) {
    const t = k => { const id = S.probes[k].term; return id ? S.terms[id] : null; };
    const pos = curPos(), r = t('red'), b = t('black');
    return {
      posId: pos.id, mode: pos.mode, jack: S.meter.jack, analog: S.analog,
      red: r && { term: r.id, part: r.part, node: r.node }, black: b && { term: b.id, part: b.part, node: b.node },
      value: m.value, ol: m.ol, garbage: m.garbage,
    };
  }

  function measureNow() {
    const r = S.probes.red.term && S.terms[S.probes.red.term];
    const b = S.probes.black.term && S.terms[S.probes.black.term];
    const st = { pos: curPos(), jack: S.meter.jack, red: r ? r.node : '__red', black: b ? b.node : '__black', fuseMA: S.meter.fuseMA, fuse10: S.meter.fuse10 };
    return (S.analog ? Meter.measureAnalog : Meter.measure)(Parts.circuit(S.scene), st);
  }

  function update() {
    if (!S.scene) return;
    let m = measureNow();
    const cfg = `${S.analog}|${S.meter.pos}|${S.meter.jack}|${S.probes.red.term}|${S.probes.black.term}`;
    let changed = false;
    for (const ev of m.events) {
      const key = ev.type + '|' + cfg;
      if (ev.type === 'fuseMA') { blowFuse('mA', ev.I); changed = true; }
      else if (ev.type === 'fuse10') { blowFuse('10A', ev.I); changed = true; }
      else if (!S.evKeys.has(key)) {
        S.evKeys.add(key);
        if (ev.type === 'short') {
          mistake('short', `${ev.I.toFixed(1)}A`);
          toast(tr(`دائرة قِصَر! مرّ تيار ${ev.I.toFixed(1)}A خلال الجهاز. في وضع التيار يصبح الجهاز كأنه سلك، فلا تضعه على طرفي مصدر.`, `Short circuit! ${ev.I.toFixed(1)}A flowed through the meter. On current mode the meter is like a wire; never put it across a source.`), 'danger');
          spark(false);
        } else if (ev.type === 'powered') {
          logEvent('powered', `${ev.v.toFixed(1)}V`);
          toast(tr(`انتبه: يوجد جهد ${ev.v.toFixed(1)}V بين المجسين. لا تقس المقاومة أو الاستمرارية والعنصر موصول بالكهرباء — القراءة لن تكون صحيحة.`, `Careful: there is ${ev.v.toFixed(1)}V between the probes. Don't measure resistance or continuity on a powered part; the reading will be wrong.`), 'warn');
        } else if (ev.type === 'peg') {
          mistake('peg', ev.def > 0 ? 'over' : 'reverse');
          toast(ev.def > 0
            ? tr('ضربت الإبرة نهاية التدريج بقوة! النطاق أصغر من القيمة. في الجهاز الحقيقي قد تنثني الإبرة. اختر نطاقاً أكبر.', 'The needle slammed into the end stop! The range is too small; a real needle can bend. Pick a higher range.')
            : tr('ارتدت الإبرة بقوة إلى اليسار: المجسان معكوسان. اعكسهما فوراً.', 'The needle kicked hard to the left: the probes are reversed. Swap them now.'), 'danger');
        }
      }
    }
    if (changed) m = measureNow();
    if (isBuilder() && Builder.after(m)) { renderBench(); layout(); m = measureNow(); }
    S.last = m;
    S.snap = snapshot(m);

    for (const p of S.scene.parts) {
      const Ty = Parts.TYPES[p.type];
      if (p.type === 'supply') {
        const v = document.getElementById('sup-v-' + p.id), i = document.getElementById('sup-i-' + p.id);
        if (v) v.textContent = p.V.toFixed(1) + 'V';
        if (i) i.textContent = m.current(p.id).toFixed(3) + 'A';
      }
      if (!Ty.glow) continue;
      const g = Ty.glow(p, m.current(p.id));
      const el = document.getElementById('glow-' + p.id); if (el) el.setAttribute('opacity', g.toFixed(3));
      const core = document.getElementById('core-' + p.id); if (core) core.setAttribute('opacity', g.toFixed(3));
      const fil = document.getElementById('fil-' + p.id); if (fil) fil.setAttribute('stroke', g > 0.15 ? '#fff6c8' : '#6b5a40');
    }
    if (isBuilder()) {
      Builder.paint(m);
      const newly = Builder.checkChallenges(S.snap, m, () => Parts.circuit(S.scene));
      if (newly.length) {
        Sound.ok();
        newly.forEach(c => toast(tr('تحدٍّ مكتمل: ', 'Challenge complete: ') + T(c), 'ok'));
        UI.confetti($('#pBuild .b-ch'), { count: 60 });
        Progress.newBadges().forEach(b => toast(tr('وسام جديد: ', 'New badge: ') + T(b.t), 'ok'));
        Builder.renderPanel($('#pBuild'));
      }
    }

    if (!S.finished && S.mission.tasks.length) {
      let progressed = false;
      S.mission.tasks.forEach((t, i) => { if (!S.done[i] && t.check(S.snap, S.scene)) { S.done[i] = true; progressed = true; } });
      if (progressed) {
        Sound.ok();
        renderTasks();
        if (currentTask() < 0) {
          $('#panel').classList.add('open');
          setTimeout(() => $('#pQuestion').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
        }
      }
    }

    const pos = curPos();
    const both = S.probes.red.term && S.probes.black.term;
    const beeping = pos.mode === 'CONT' && S.meter.jack === 'V' && !m.ol && !m.garbage && m.value < (S.analog ? 20 : 50) && both;
    Sound.beep(!!beeping);
    $('#meter').classList.toggle('beeping', !!beeping);
    $('#liveText').innerHTML = `<span class="mode-chip ${pos.mode === 'OFF' ? 'off' : ''}">${modeSym(pos)}</span><span>${explain(S.snap, m)}</span>`;
    if (S.mission.chart) updateRecordBtn();
    if (S.analog) ANA.setNeedle(pos.mode === 'OFF' ? 0 : m.garbage ? 0.3 + Math.random() * 0.4 : m.def);
    else renderDisplay();
  }

  function modeSym(pos) {
    return { OFF: 'OFF', VDC: 'V⎓', VAC: 'V~', ADC: 'A⎓', OHM: 'Ω', CONT: '•)))', DIODE: '▶|' }[pos.mode] || '';
  }

  function renderDisplay() {
    if (S.analog) return;
    const pos = curPos(), m = S.last, off = pos.mode === 'OFF';
    let text = '';
    if (!off && m) {
      if (S.meter.hold) text = S.meter.heldText;
      else if (m.garbage) text = Meter.garbageText(pos);
      else text = Meter.format(pos, m.value, m.ol, !m.ol && (S.probes.red.term || S.probes.black.term));
    }
    S.meter.shownText = text;
    DIG.setDisplay({ off, text, unit: pos.unit, hold: S.meter.hold, light: S.meter.light, modeTag: { VDC: 'DC', VAC: 'AC', ADC: 'DC' }[pos.mode] || '', beepIcon: pos.mode === 'CONT' });
  }

  function blowFuse(which, I) {
    if (which === 'mA') S.meter.fuseMA = false; else S.meter.fuse10 = false;
    mistake(which === 'mA' ? 'fuseMA' : 'fuse10', `${I.toFixed(2)}A`);
    Sound.pop(); spark(which === '10A'); renderFuses();
    const limit = S.analog ? '0.5A' : '0.2A';
    const msg = which === 'mA'
      ? tr(`انصهر الفيوز! حاولت أن يمر ${I.toFixed(2)}A في مدخل لا يتحمل أكثر من ${limit}. الجهاز لن يقيس التيار حتى تستبدل الفيوز.`, `Fuse blown! You pushed ${I.toFixed(2)}A through an input rated for ${limit}. The meter won't read current until you replace the fuse.`)
      : tr(`انفجر فيوز الـ 10A! مرّ تيار هائل (${I.toFixed(0)}A). في الواقع هذا قد يسبب شرارة وحروقاً خطيرة. الفيوز هو الذي حماك.`, `The 10A fuse blew! A huge current (${I.toFixed(0)}A) flowed. In real life this can cause sparks and serious burns. The fuse protected you.`);
    toast(msg, 'danger', { label: tr('استبدل الفيوز', 'Replace fuse'), fn: () => replaceFuses() });
  }

  function replaceFuses() {
    S.meter.fuseMA = true; S.meter.fuse10 = true;
    renderFuses(); update();
    toast(tr('تم تركيب فيوز جديد.', 'New fuse fitted.'), 'ok');
  }

  function renderFuses() {
    const f = (ok, name) => `<span class="fuse ${ok ? 'ok' : 'bad'}">${tr('فيوز', 'Fuse')} ${name}: ${ok ? tr('سليم', 'OK') : tr('محروق', 'blown')}</span>`;
    const any = !S.meter.fuseMA || (!S.analog && !S.meter.fuse10);
    $('#fuses').innerHTML = (S.analog ? f(S.meter.fuseMA, '0.5A') : f(S.meter.fuseMA, 'mA') + f(S.meter.fuse10, '10A')) +
      (any ? `<button class="btn small" id="fixFuse">${tr('استبدل', 'Replace')}</button>` : '');
    if (any) $('#fixFuse').onclick = replaceFuses;
  }

  function spark(big) {
    const lab = $('#labArea'), r = lab.getBoundingClientRect();
    const j = MUI().jackPoint(S.meter.jack === 'A10' ? 'A10' : 'V');
    const el = document.createElement('div');
    el.className = 'spark' + (big ? ' big' : '');
    el.style.left = (j.x - r.left) + 'px'; el.style.top = (j.y - r.top) + 'px';
    lab.appendChild(el);
    $('#meter').classList.add('shake');
    setTimeout(() => { el.remove(); $('#meter').classList.remove('shake'); }, 900);
  }

  // ── الشرح اللحظي ──
  function explain(s, m) {
    const pos = curPos(), both = s.red && s.black, mode = pos.mode, lines = [];
    if (mode === 'OFF') return tr('<b>الجهاز مطفأ.</b> لفّ المفتاح الدوّار لاختيار نوع القياس.', '<b>The meter is off.</b> Turn the dial to choose what to measure.');

    if (S.analog) {
      lines.push({
        VDC: tr('<b>DCV (تناظري):</b> مقاومة الجهاز 20kΩ لكل فولت، فيسحب تياراً صغيراً من الدائرة.', '<b>DCV (analog):</b> the meter is 20kΩ per volt, so it draws a little current from the circuit.'),
        VAC: tr('<b>ACV (تناظري):</b> يقيس الجهد المتردد بعد تقويمه داخلياً.', '<b>ACV (analog):</b> measures AC after rectifying it internally.'),
        ADC: tr('<b>DCA (تناظري):</b> يوصل على التوالي مثل الأميتر الرقمي تماماً.', '<b>DCA (analog):</b> goes in series, exactly like a digital ammeter.'),
        OHM: tr('<b>Ω (تناظري):</b> بطارية داخلية تدفع تياراً؛ كلما صغرت المقاومة تحركت الإبرة يميناً. <span class="w">المجس الأسود هنا هو الموجب.</span>', '<b>Ω (analog):</b> an internal battery drives current; the lower the resistance, the further right the needle. <span class="w">Here the black probe is positive.</span>'),
        CONT: tr('<b>BZ:</b> يصفّر الجهاز عندما تكون المقاومة صغيرة جداً.', '<b>BZ:</b> beeps when the resistance is very low.'),
      }[mode]);
      if (pos.read) lines.push(`📏 ${T(pos.read)}.`);
      if (!both) lines.push(tr('اسحب المجسين إلى أطراف العنصر.', 'Drag both probes onto the part.'));
      else if (m.garbage) lines.push(tr('<span class="w">الإبرة تهتز</span> لأن العنصر موصول بمصدر جهد.', '<span class="w">The needle is jumping</span> because the part is powered.'));
      else if ((mode === 'VDC' || mode === 'ADC') && m.def < -0.02) lines.push(tr('<span class="w">الإبرة تحاول التحرك لليسار</span>: المجسان معكوسان.', '<span class="w">The needle is pushing left</span>: the probes are reversed.'));
      else if (m.def > 1.03) lines.push(tr('<span class="w">الإبرة تجاوزت النهاية</span>: اختر نطاقاً أكبر.', '<span class="w">The needle is past full scale</span>: pick a higher range.'));
      else if ((mode === 'VDC' || mode === 'ADC' || mode === 'VAC') && m.def > 0 && m.def < 0.1) lines.push(tr('الإبرة قريبة من الصفر: اختر نطاقاً أصغر لقراءة أوضح.', 'The needle is near zero: pick a lower range for a clearer reading.'));
      return lines.join(' ');
    }

    if (S.meter.jack === 'A10' && pos.id !== 'a10') lines.push(tr('<span class="w">المجس الأحمر في مدخل 10A</span>، وهذا المدخل لقياس التيار الكبير فقط. أرجعه إلى VΩmA.', '<span class="w">The red lead is in the 10A jack</span>, which is only for large currents. Move it back to VΩmA.'));
    if (pos.id === 'a10' && S.meter.jack !== 'A10') lines.push(tr('<span class="w">على نطاق 10A يجب نقل المجس الأحمر إلى مدخل 10A</span> (اضغط على المدخل في الجهاز).', '<span class="w">On 10A the red lead must go in the 10A jack</span> (tap the jack on the meter).'));
    lines.unshift({
      VDC: tr('<b>جهد مستمر V⎓:</b> يقيس فرق الجهد بين المجسين. مقاومة الجهاز الداخلية 10MΩ، فلا يسحب تياراً تقريباً ويوصل على التوازي.', '<b>DC voltage V⎓:</b> measures the voltage between the probes. The meter is 10MΩ inside, draws almost no current, and goes in parallel.'),
      VAC: tr('<b>جهد متردد V~:</b> يعرض القيمة الفعّالة (RMS) للجهد المتغير مثل كهرباء المنزل.', '<b>AC voltage V~:</b> shows the RMS value of alternating voltage like mains.'),
      ADC: tr('<b>تيار A⎓:</b> الجهاز الآن كأنه سلك بمقاومة صغيرة جداً. يجب أن يوصل على التوالي بعد فتح الدائرة، وليس على طرفي مصدر.', '<b>Current A⎓:</b> the meter is now almost a wire. Put it in series after breaking the circuit, never across a source.'),
      OHM: tr('<b>مقاومة Ω:</b> الجهاز يمرّر تياراً صغيراً معروفاً ويقيس الجهد ثم يحسب ⁦R = V ÷ I⁩. افصل الكهرباء أولاً.', '<b>Resistance Ω:</b> the meter sends a small known current, measures the voltage and computes R = V ÷ I. Disconnect power first.'),
      CONT: tr('<b>استمرارية •))):</b> يصفّر الجهاز إذا كانت المقاومة أقل من 50Ω، أي أن المسار متصل.', '<b>Continuity •))):</b> beeps below 50Ω, meaning the path is connected.'),
      DIODE: tr('<b>اختبار دايود ▶|:</b> يمرّر 1mA من المجس الأحمر ويعرض الجهد على الوصلة. أمامي: ~0.6V للسيليكون و~1.8V للـLED. عكسي: OL.', '<b>Diode test ▶|:</b> sends 1mA from the red probe and shows the junction voltage. Forward: ~0.6V silicon, ~1.8V LED. Reverse: OL.'),
    }[mode]);
    if (!both) {
      lines.push(S.sel ? tr(`اخترت المجس ${S.sel === 'red' ? 'الأحمر' : 'الأسود'}. اضغط الآن على أي طرف معدني لتضعه عليه.`, `You picked the ${S.sel} probe. Now tap any metal terminal to place it.`)
        : tr('اسحب المجسين إلى أطراف العنصر، أو اضغط على المجس ثم على الطرف.', 'Drag the probes onto the terminals, or tap a probe then a terminal.'));
    } else if (m.garbage) lines.push(tr('<span class="w">القراءة غير مستقرة</span> لأن العنصر موصول بمصدر جهد.', '<span class="w">The reading is unstable</span> because the part is powered.'));
    else if (m.ol) lines.push(mode === 'CONT' || mode === 'DIODE' ? tr('تظهر <b>OL</b>: لا يوجد مسار يمر فيه التيار في هذا الاتجاه.', '<b>OL</b>: no path for current in this direction.') : tr('تظهر <b>OL</b>: القيمة أكبر من النطاق المختار. لفّ المفتاح إلى نطاق أكبر.', '<b>OL</b>: the value is above this range. Turn to a higher range.'));
    else if ((mode === 'VDC' || mode === 'ADC') && m.value < 0 && Math.abs(m.value) > 1e-4) lines.push(tr('الإشارة <b>السالبة</b> تعني أن المجس الأحمر على الطرف الأقل جهداً (المجسان معكوسان). الجهاز لا يتضرر.', 'A <b>negative</b> sign means red is on the lower-voltage side (probes reversed). No harm done.'));
    else if (mode !== 'CONT' && mode !== 'DIODE') {
      const counts = Math.abs(m.value * pos.scale) * Math.pow(10, pos.dec);
      if (counts > 0 && counts < 150 && Math.abs(m.value) > 1e-6) lines.push(tr('القراءة صغيرة مقارنة بالنطاق. جرّب نطاقاً أصغر لدقة أعلى.', 'The reading is small for this range. Try a lower range for more precision.'));
    }
    return lines.join(' ');
  }

  // ════════════════════════════════ الرسم البياني V–I
  const dutOf = () => S.scene.parts.find(p => p.type === 'dutBoard');
  const supplyOf = () => S.scene.parts.find(p => p.type === 'supply');
  function canRecord() {
    const s = S.snap;
    return !!(s && s.mode === 'VDC' && s.red && s.black && s.red.term !== s.black.term &&
      ['BRD:p', 'BRD:q'].includes(s.red.term) && ['BRD:p', 'BRD:q'].includes(s.black.term) && !s.ol && !s.garbage);
  }
  function updateRecordBtn() {
    const ok = canRecord(), sup = supplyOf(), d = dutOf();
    $('#pRecord').disabled = !ok;
    $('#pRecHint').textContent = ok
      ? tr(`جاهز: V = ${Math.abs(S.snap.value).toFixed(2)}V ، I = ${(S.last.current(sup.id) * 1000).toFixed(1)}mA (من شاشة المصدر) · العنصر: ${d.dut === 'LED' ? 'LED' : 'مقاومة'}`,
        `Ready: V = ${Math.abs(S.snap.value).toFixed(2)}V, I = ${(S.last.current(sup.id) * 1000).toFixed(1)}mA (from the supply) · part: ${d.dut === 'LED' ? 'LED' : 'resistor'}`)
      : tr('ضع الجهاز على V⎓ والمجسين على طرفي العنصر حتى تتمكن من التسجيل.', 'Set the meter to V⎓ with the probes across the part to record.');
  }
  function recordPoint() {
    if (!canRecord()) return;
    const sup = supplyOf(), d = dutOf();
    const list = S.scene.data.points[d.dut === 'LED' ? 'LED' : 'R'];
    const pt = { sv: sup.V, V: Math.abs(S.snap.value), I: S.last.current(sup.id) };
    const i = list.findIndex(p => p.sv === pt.sv);
    if (i >= 0) list[i] = pt; else list.push(pt);
    list.sort((a, b) => a.V - b.V);
    Sound.click();
    renderChart(); update();
  }
  function renderChart() {
    const pts = S.scene.data.points;
    const W = 320, H = 210, L = 44, B = 30, Tp = 12, R = 12;
    const all = [...pts.R, ...pts.LED];
    const maxV = 12, maxI = Math.max(0.01, ...all.map(p => p.I)) * 1.04;
    const niceI = [0.01, 0.02, 0.03, 0.05, 0.06, 0.08, 0.1, 0.12, 0.15, 0.2].find(x => x >= maxI) || maxI;
    const xs = v => L + (v / maxV) * (W - L - R), ys = i => H - B - (i / niceI) * (H - B - Tp);
    let g = '';
    for (let v = 0; v <= 12; v += 2) g += `<line x1="${xs(v)}" y1="${Tp}" x2="${xs(v)}" y2="${H - B}" class="ch-grid"/><text x="${xs(v)}" y="${H - B + 16}" text-anchor="middle" class="ch-t">${v}</text>`;
    for (let k = 0; k <= 4; k++) { const i = niceI * k / 4; g += `<line x1="${L}" y1="${ys(i)}" x2="${W - R}" y2="${ys(i)}" class="ch-grid"/><text x="${L - 6}" y="${ys(i) + 4}" text-anchor="end" class="ch-t">${(i * 1000).toFixed(0)}</text>`; }
    const line = (arr, cls) => arr.length > 1 ? `<polyline points="${arr.map(p => `${xs(p.V).toFixed(1)},${ys(p.I).toFixed(1)}`).join(' ')}" class="ch-line ${cls}"/>` : '';
    const dots = (arr, cls) => arr.map(p => `<circle cx="${xs(p.V).toFixed(1)}" cy="${ys(p.I).toFixed(1)}" r="4.5" class="ch-dot ${cls}"><title>${p.V.toFixed(2)}V · ${(p.I * 1000).toFixed(1)}mA</title></circle>`).join('');
    $('#pChart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${tr('منحنى الجهد والتيار', 'Voltage–current curve')}">
      ${g}<line x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}" class="ch-axis"/><line x1="${L}" y1="${Tp}" x2="${L}" y2="${H - B}" class="ch-axis"/>
      <text x="${W - R}" y="${H - 2}" text-anchor="end" class="ch-ax">V (${tr('فولت', 'volts')})</text><text x="4" y="${Tp + 2}" class="ch-ax">mA</text>
      ${line(pts.R, 'r')}${line(pts.LED, 'led')}${dots(pts.R, 'r')}${dots(pts.LED, 'led')}</svg>
      <div class="ch-legend"><span class="lg r">${tr('مقاومة', 'Resistor')} (${pts.R.length})</span><span class="lg led">LED (${pts.LED.length})</span>
      ${all.length ? `<button class="btn ghost small" id="pClear">${tr('مسح النقاط', 'Clear points')}</button>` : ''}</div>`;
    const c = $('#pClear');
    if (c) c.onclick = () => { pts.R.length = 0; pts.LED.length = 0; renderChart(); };
  }

  // ════════════════════════════════ المجسات والأسلاك
  const PROBE_LEN = 128;
  const PROBE_ANGLE = { red: -12, black: 12 };
  const probeScale = () => (window.innerWidth < 720 ? 0.72 : 1);

  function probeSVG(color) {
    const body = color === 'red' ? '#d7322f' : '#1c1d20', dark = color === 'red' ? '#9c1f1d' : '#000';
    return `<svg viewBox="0 0 28 132" width="28" height="132" aria-hidden="true">
      <path d="M14 132 L12.6 104 H15.4 Z" fill="#d9dde2" stroke="#8d939a" stroke-width=".6"/>
      <rect x="1" y="94" width="26" height="9" rx="4" fill="${dark}"/><rect x="5" y="14" width="18" height="82" rx="7" fill="${body}"/>
      ${[30, 40, 50, 60, 70].map(y => `<rect x="6" y="${y}" width="16" height="3" rx="1.5" fill="${dark}" opacity=".55"/>`).join('')}
      <rect x="8" y="0" width="12" height="16" rx="4" fill="${dark}"/></svg>`;
  }
  function labRect() { return $('#labArea').getBoundingClientRect(); }
  function termCenter(id) {
    const g = $(`#bench .term[data-term="${CSS.escape(id)}"] .term-dot`);
    if (!g) return null;
    const r = g.getBoundingClientRect(), L = labRect();
    return { x: r.left + r.width / 2 - L.left, y: r.top + r.height / 2 - L.top };
  }
  function tipOf(k) {
    const p = S.probes[k], L = labRect();
    if (p.drag) return p.drag;
    if (p.term) { const c = termCenter(p.term); if (c) return c; }
    return { x: p.fx * L.width, y: p.fy * L.height };
  }
  function benchFreeSpot(k) {
    const b = $('#bench').getBoundingClientRect(), L = labRect(), m = $('#meter').getBoundingClientRect();
    const sideLeft = m.left + m.width / 2 < b.left + b.width / 2;
    const x0 = sideLeft ? b.left + 34 : b.right - 34;
    const x = x0 + (k === 'red' ? 0 : (sideLeft ? 34 : -34)) - L.left;
    return { fx: x / L.width, fy: (b.bottom - 8 - L.top) / L.height };
  }
  function layout() {
    if (!S.scene) return;
    const L = labRect(), leads = [];
    for (const k of ['red', 'black']) {
      const p = S.probes[k];
      if (!p.term && p.fx == null) Object.assign(p, benchFreeSpot(k));
      const tip = tipOf(k), el = $(k === 'red' ? '#probeRed' : '#probeBlack'), sc = probeScale();
      el.style.left = (tip.x - 14) + 'px'; el.style.top = (tip.y - 132) + 'px';
      el.style.transform = `rotate(${PROBE_ANGLE[k]}deg) scale(${sc})`;
      el.classList.toggle('sel', S.sel === k);
      el.classList.toggle('attached', !!p.term);
      const a = PROBE_ANGLE[k] * Math.PI / 180;
      const top = { x: tip.x + PROBE_LEN * sc * Math.sin(a), y: tip.y - PROBE_LEN * sc * Math.cos(a) };
      const jp = MUI().jackPoint(k === 'red' ? S.meter.jack : 'COM');
      const J = { x: jp.x - L.left, y: jp.y - L.top };
      const sag = Math.min(160, 60 + Math.abs(J.x - top.x) * 0.25);
      leads.push(`<path d="M${J.x} ${J.y} C${J.x + (top.x - J.x) * 0.35} ${J.y + sag}, ${top.x + Math.sin(a) * 40} ${top.y - 90}, ${top.x} ${top.y}" class="lead-path ${k}"/>`);
    }
    const svg = $('#leads');
    svg.setAttribute('viewBox', `0 0 ${L.width} ${L.height}`);
    svg.setAttribute('width', L.width); svg.setAttribute('height', L.height);
    svg.innerHTML = leads.join('');
  }
  function nearestTerm(x, y, maxD) {
    let best = null, bd = maxD;
    for (const id in S.terms) {
      const c = termCenter(id); if (!c) continue;
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < bd) { bd = d; best = id; }
    }
    return best;
  }
  function attach(k, termId) {
    if (termId && S.probes[k].term !== termId) { const c = termCenter(termId); if (c) FX.burst($('#labArea'), c.x, c.y, 9); }
    S.probes[k].term = termId; S.probes[k].drag = null; markAttached(); layout(); update(); }

  function setupProbe(k) {
    const el = $(k === 'red' ? '#probeRed' : '#probeBlack');
    el.innerHTML = probeSVG(k);
    let start = null;
    el.addEventListener('pointerdown', e => {
      Sound.unlock(); try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      start = { x: e.clientX, y: e.clientY, tip: tipOf(k), moved: false };
      e.preventDefault();
    });
    el.addEventListener('pointermove', e => {
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!start.moved && Math.hypot(dx, dy) < 6) return;
      if (!start.moved) { start.moved = true; S.probes[k].term = null; S.sel = null; el.classList.add('dragging'); markAttached(); }
      const L = labRect();
      const x = Math.max(4, Math.min(L.width - 4, start.tip.x + dx));
      const y = Math.max(136 * probeScale(), Math.min(L.height - 2, start.tip.y + dy));
      S.probes[k].drag = { x, y };
      const n = nearestTerm(x, y, 38);
      $$('#bench .term').forEach(g => g.classList.toggle('near', g.dataset.term === n));
      layout();
    });
    const end = () => {
      if (!start) return;
      el.classList.remove('dragging');
      if (!start.moved) { S.sel = S.sel === k ? null : k; layout(); update(); }
      else {
        const d = S.probes[k].drag, n = nearestTerm(d.x, d.y, 38);
        $$('#bench .term.near').forEach(g => g.classList.remove('near'));
        if (n) attach(k, n);
        else { const L = labRect(); S.probes[k].fx = d.x / L.width; S.probes[k].fy = d.y / L.height; S.probes[k].drag = null; layout(); update(); }
      }
      start = null;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); S.sel = S.sel === k ? null : k; layout(); update(); } });
  }

  // ── المكثف: الشحنة تتغير مع الزمن حسب التيار المار فيه (dV = I·dt / C) ──
  function capTick() {
    if (!S.scene || !S.last) return;
    const caps = S.scene.parts.filter(p => p.type === 'capacitor');
    if (!caps.length) return;
    const dt = 0.1, mode = curPos().mode;
    const ohmLike = !S.analog && ['OHM', 'CONT', 'DIODE'].includes(mode);
    let changed = false, rerender = false;
    for (const p of caps) {
      const old = p.vc || 0;
      let vc = old - S.last.idc(p.id) * dt / (p.uF * 1e-6);
      if (p.discharging) {
        vc *= Math.exp(-dt / 0.35);
        if (Math.abs(vc) < 0.01) { vc = 0; p.discharging = false; rerender = true; }
      }
      if (ohmLike && Math.abs(vc) > 2.8 && Math.abs(vc) > Math.abs(old)) vc = old;   // جهد اختبار الجهاز محدود
      if (Math.abs(vc - old) > 1e-6) { p.vc = vc; changed = true; }
    }
    if (rerender) { renderBench(); layout(); }
    if (changed || rerender) update();
  }

  function refreshLab() { renderBench(); if (isBuilder()) Builder.renderPanel($('#pBuild')); renderLibrary(); layout(); update(); }

  function onBenchClick(e) {
    const term = e.target.closest('.term');
    if (term) {
      if (isBuilder() && Builder.wantsTerm() && !S.sel) { Builder.tapPost(term.dataset.term); return; }
      if (S.sel) { const k = S.sel; S.sel = null; attach(k, term.dataset.term); }
      else {
        const free = !S.probes.red.term ? 'red' : !S.probes.black.term ? 'black' : null;
        if (free) attach(free, term.dataset.term);
        else toast(tr('اضغط أولاً على المجس الذي تريد نقله، ثم على الطرف.', 'First tap the probe you want to move, then the terminal.'), 'info');
      }
      return;
    }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'comp') { Sound.click(); Builder.select(act.dataset.cid); return; }
    const p = S.scene.parts.find(x => x.id === act.dataset.part);
    switch (act.dataset.act) {
      case 'toggle': p.on = !p.on; break;
      case 'jumper': p.present = !p.present; break;
      case 'supUp': p.V = Math.min(12, p.V + 1); break;
      case 'supDown': p.V = Math.max(0, p.V - 1); break;
      case 'dut': p.dut = p.dut === 'LED' ? 'R' : 'LED'; break;
      case 'engine': p.engine = !p.engine; break;
      case 'discharge': p.discharging = true; break;
      case 'potUp': p.pos = Math.min(1, Math.round((p.pos + 0.1) * 10) / 10); break;
      case 'potDown': p.pos = Math.max(0, Math.round((p.pos - 0.1) * 10) / 10); break;
      case 'light': p.light = !p.light; break;
      case 'heat': p.t = Math.min(100, p.t + 15); break;
      case 'cool': p.t = Math.max(25, p.t - 15); break;
      case 'coil': p.on = !p.on; break;
    }
    Sound.click();
    const focusAct = act.dataset.act, focusPart = act.dataset.part;
    refreshLab();
    const again = $(`#bench [data-act="${focusAct}"][data-part="${focusPart}"]`);
    if (again && e.type === 'keydown') again.focus();
  }

  // ════════════════════════════════ أحداث الجهاز
  const meterHandlers = {
    onPos(i) {
      Sound.unlock();
      if (i === S.meter.pos) return;
      S.meter.pos = i; S.meter.hold = false;
      MUI().setPos(i);
      Sound.click();
      try { if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(6); } catch (e) { /* ignore */ }
      update();
    },
    onJack(j) {
      Sound.unlock();
      if (j === 'COM') { toast(tr('المجس الأسود يبقى دائماً في مدخل COM (المشترك).', 'The black lead always stays in COM (common).'), 'info'); return; }
      if (S.meter.jack === j) return;
      S.meter.jack = j; MUI().setJack(j); Sound.click();
      layout(); update();
      if (j === 'A10') toast(tr('نقلت المجس الأحمر إلى مدخل 10A — يستخدم فقط لقياس التيارات الكبيرة مع وضع 10A.', 'Red lead moved to 10A: only for large currents, with the dial on 10A.'), 'info');
    },
    onButton(b) {
      Sound.unlock(); Sound.click();
      if (b === 'hold') { S.meter.hold = !S.meter.hold; S.meter.heldText = S.meter.shownText || ''; }
      if (b === 'light') S.meter.light = !S.meter.light;
      renderDisplay();
    },
  };

  // ════════════════════════════════ نوافذ وتنبيهات
  function toast(msg, kind, action) {
    const box = $('#toasts'), el = document.createElement('div');
    el.className = 'toast ' + (kind || 'info');
    el.setAttribute('role', 'status');
    const ic = { danger: 'alert', warn: 'alert', ok: 'check', info: 'info' }[kind || 'info'];
    el.innerHTML = `<span class="t-ic">${icon(ic)}</span><span>${esc(msg)}</span>${action ? `<button class="btn small">${esc(action.label)}</button>` : ''}<button class="x" aria-label="${tr('إغلاق', 'Close')}">${icon('x')}</button>`;
    if (action) el.querySelector('.btn').onclick = () => { action.fn(); el.remove(); };
    el.querySelector('.x').onclick = () => el.remove();
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => el.classList.add('out'), kind === 'danger' ? 9000 : 6000);
    setTimeout(() => el.remove(), kind === 'danger' ? 9500 : 6500);
  }
  function modal(html) {
    const m = $('#modal');
    $('#modalBody').innerHTML = html;
    m.hidden = false;
    $$('[data-go]', m).forEach(b => b.onclick = () => { closeModal(); go(b.dataset.go); });
    $$('[data-again]', m).forEach(b => b.onclick = () => { closeModal(); Progress.Stats.bump('retry'); openMission(S.mission.id); });
    $$('[data-cert]', m).forEach(b => b.onclick = () => showCertificate());
    $$('[data-close]', m).forEach(b => b.onclick = closeModal);
    $$('a[href^="#"]', m).forEach(a => a.addEventListener('click', closeModal));
    const f = m.querySelector('button, input'); if (f) f.focus();
  }
  function closeModal() { $('#modal').hidden = true; document.body.classList.remove('printing-cert'); }

  // ── الشهادة ──
  function showCertificate() {
    const list = Missions.list;
    const total = list.reduce((a, m) => a + (S.progress[m.id]?.stars || 0), 0);
    const date = new Date().toLocaleDateString(I18N.lang === 'en' ? 'en-GB' : 'ar', { year: 'numeric', month: 'long', day: 'numeric' });
    const name = S.student?.name || store.get('certName', '');
    const placeholder = tr('— اكتب اسمك —', '— your name —');
    modal(`
      <div class="cert" id="cert"><div class="cert-in">
        <p class="cert-eyebrow">${tr('مختبر الملتيميتر', 'Multimeter Lab')}</p>
        <h2>${tr('شهادة إتمام', 'Certificate of Completion')}</h2>
        <p>${tr('تشهد بأن', 'This certifies that')}</p>
        <p class="cert-name" id="certName">${esc(name || placeholder)}</p>
        <p>${tr(`أتمّ جميع مهام القياس الكهربائي (${list.length} مهمة) بنجاح،<br>وحصل على <b>${total}</b> من ${list.length * 3} نجمة.`, `has completed all ${list.length} electrical measurement missions<br>and earned <b>${total}</b> of ${list.length * 3} stars.`)}</p>
        <div class="cert-skills">${[tr('الجهد V', 'Voltage V'), tr('التيار A', 'Current A'), tr('المقاومة Ω', 'Resistance Ω'), tr('الاستمرارية', 'Continuity'), tr('الدايود', 'Diodes'), tr('قانون أوم', "Ohm's law"), tr('التشخيص', 'Troubleshooting')].map(s => `<span>${s}</span>`).join('')}</div>
        <p class="cert-date">${esc(date)}</p><p class="cert-sign">ALKING TECH · @alking.tech</p></div></div>
      ${S.student ? '' : `<label class="cert-label" for="certInput">${tr('اسمك على الشهادة', 'Name on the certificate')}</label><input id="certInput" class="cert-input" maxlength="40" value="${esc(name)}">`}
      <div class="modal-actions">
        ${window.self === window.top ? `<button class="btn primary" id="certPrint">${tr('طباعة / حفظ PDF', 'Print / save PDF')}</button>` : `<p class="cert-note">${tr('التقط صورة للشاشة لحفظ الشهادة.', 'Take a screenshot to keep the certificate.')}</p>`}
        <button class="btn ghost" data-go="home">${tr('إغلاق', 'Close')}</button>
      </div>`);
    const inp = $('#certInput');
    if (inp) inp.oninput = () => { $('#certName').textContent = inp.value || placeholder; store.set('certName', inp.value); };
    const pr = $('#certPrint');
    if (pr) pr.onclick = () => { document.body.classList.add('printing-cert'); window.print(); setTimeout(() => document.body.classList.remove('printing-cert'), 500); };
  }

  // ── الدليل ──
  function colorTable(compact) {
    const names = I18N.lang === 'en' ? Parts.BAND_NAMES_EN : Parts.BAND_NAMES;
    return `<table class="ctable ${compact ? 'compact' : ''}"><thead><tr><th>${tr('اللون', 'Color')}</th><th>${tr('الرقم', 'Digit')}</th><th>${tr('المضاعف', 'Multiplier')}</th></tr></thead><tbody>
      ${Parts.BAND_COLORS.map((c, i) => `<tr><td><span class="sw" style="background:${c}"></span>${names[i]}</td><td>${i}</td><td>×${i < 3 ? ['1', '10', '100'][i] : '10' + ['³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'][i - 3]}</td></tr>`).join('')}
      <tr><td><span class="sw" style="background:${Parts.GOLD}"></span>${tr('ذهبي', 'Gold')}</td><td>—</td><td>×0.1 · ${tr('تفاوت', 'tolerance')} ±5%</td></tr></tbody></table>`;
  }
  function openGuide() { $('#guideColors').innerHTML = colorTable(false); $('#guide').hidden = false; $('#guide .drawer-in').focus(); calcOhm(); }
  function calcOhm() {
    const V = parseFloat($('#ohmV').value), R = parseFloat($('#ohmR').value), out = $('#ohmI');
    if (!(V >= 0) || !(R > 0)) { out.textContent = '—'; return; }
    const I = V / R;
    out.textContent = I >= 1 ? I.toFixed(2) + ' A' : I >= 1e-3 ? (I * 1e3).toFixed(1) + ' mA' : (I * 1e6).toFixed(0) + ' µA';
  }

  // ════════════════════════════════ الخادم (وضع الفصل الدراسي)
  async function detectServer() {
    try {
      const ctl = new AbortController();
      setTimeout(() => ctl.abort(), 1500);
      const r = await fetch('api/ping', { cache: 'no-store', signal: ctl.signal });
      if (r.ok) S.server = !!(await r.json()).ok;
    } catch (e) { S.server = false; }
    renderStudentChip();
    if (!S.server) return;
    await pollConfig();
    setInterval(pollConfig, 8000);
  }

  async function pollConfig() {
    try {
      const j = await (await fetch('api/config', { cache: 'no-store' })).json();
      const prevId = S.exam ? S.exam.id : null;
      S.exam = j.exam || null;
      if (S.exam) S.examClockSkew = j.now - Date.now() / 1000;
      const nowId = S.exam ? S.exam.id : null;
      if (prevId !== nowId) {
        if (S.exam && !S.student) askName();
        if (S.exam) toast(tr(`بدأ الاختبار: ${S.exam.title}. لديك ${Math.round(examLeft() / 60)} دقيقة.`, `Exam started: ${S.exam.title}. You have ${Math.round(examLeft() / 60)} minutes.`), 'warn');
        else if (prevId) toast(tr('أنهى المعلم الاختبار.', 'The teacher ended the exam.'), 'info');
        if (S.view === 'home') renderHome();
        else if (S.exam && (['laws', 'progress', 'components', 'experiments', 'paths', 'path', 'resources', 'about', 'quiz', 'glossary'].includes(S.view) || (S.mission && !S.exam.missions.includes(S.mission.id)))) go('home');
      }
    } catch (e) { /* offline */ }
    renderStudentChip(); tickExam();
  }

  function tickExam() {
    const bar = $('#examBar');
    if (!inExam()) { bar.hidden = true; document.body.classList.remove('exam'); return; }
    document.body.classList.add('exam');
    bar.hidden = false;
    const left = examLeft(), mm = Math.floor(left / 60), ss = Math.floor(left % 60);
    bar.textContent = left > 0 ? tr(`اختبار · باقي ${mm}:${String(ss).padStart(2, '0')}`, `Exam · ${mm}:${String(ss).padStart(2, '0')} left`) : tr('انتهى وقت الاختبار', 'Exam time is up');
    bar.classList.toggle('urgent', left > 0 && left < 60);
    if (left <= 0 && !S.examOverShown) {
      S.examOverShown = true;
      if (S.view === 'lab' && S.mission && !S.finished) {
        logEvent('timeout', '');
        go('home');
        modal(`<div class="finish"><h2>${tr('انتهى وقت الاختبار', 'Exam time is up')}</h2><p class="meta">${tr('المهام التي أنهيتها وصلت للمعلم.', 'The missions you finished reached the teacher.')}</p><div class="modal-actions"><button class="btn primary" data-go="home">${tr('حسناً', 'OK')}</button></div></div>`);
      } else if (S.view === 'home') renderHome();
    }
    if (left > 0) S.examOverShown = false;
  }

  function askName() {
    modal(`
      <form class="name-form" id="nameForm">
        <h2>${tr('أهلاً في مختبر الفصل', 'Welcome to the class lab')}</h2>
        <p>${tr('اكتب اسمك حتى يرى المعلم تقدّمك في المهام.', 'Enter your name so your teacher can see your progress.')}</p>
        <label for="stName">${tr('الاسم', 'Name')}</label>
        <input id="stName" required maxlength="40" autocomplete="name" value="${esc(S.student?.name || '')}">
        <label for="stClass">${tr('الصف أو الشعبة (اختياري)', 'Class or section (optional)')}</label>
        <input id="stClass" maxlength="20" value="${esc(S.student?.klass || '')}">
        <div class="modal-actions"><button class="btn primary" type="submit">${tr('حفظ', 'Save')}</button></div>
      </form>`);
    $('#nameForm').onsubmit = e => {
      e.preventDefault();
      const name = $('#stName').value.trim();
      if (!name) return;
      S.student = { name, klass: $('#stClass').value.trim() };
      store.set('student', S.student);
      closeModal(); renderStudentChip();
      for (const [id, p] of Object.entries(S.progress)) sendProgress(id, p.stars, p.mistakes, p.secs, p.hints || 0, true);
    };
  }

  function sendProgress(mission, stars, mistakes, secs, hints, noExam) {
    if (!S.server || !S.student) return;
    fetch('api/progress', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student: S.student.name, klass: S.student.klass || '', mission, stars, mistakes, seconds: secs, hints: hints || 0, exam: !noExam && S.exam ? S.exam.id : null }),
    }).catch(() => { /* ignore */ });
  }

  // ════════════════════════════════ التوجيه واللغة
  const VIEWS = ['home', 'lab', 'laws', 'progress', 'components', 'experiments', 'paths', 'path', 'resources', 'about', 'quiz', 'glossary'];
  function go(hash) { if (location.hash !== '#' + hash) location.hash = hash; else route(); }
  function showView(v) {
    S.view = v;
    VIEWS.forEach(id => { $('#' + id).hidden = id !== v; });
    if (v !== 'lab' && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (v !== 'lab') { Tour.hide(); if (Tour.explaining) { Tour.explain(false); paintTools(); } }
    const cur = $('#' + v);
    cur.classList.remove('view-in'); void cur.offsetWidth; cur.classList.add('view-in');
    document.body.dataset.view = v;
    const navOf = { path: 'paths', quiz: 'paths', laws: 'resources', components: 'resources', progress: 'resources', glossary: 'resources' }[v] || v;
    $$('.nav [data-nav]').forEach(a => { if (a.dataset.nav === navOf) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('#progBtn').classList.toggle('on', v === 'progress');
  }
  function route() {
    routeNow();
    // كل صفحة داخلية تُحسب كزيارة لصفحة باسمها في عدّاد الزوار
    const h = location.hash.slice(1);
    if (h && window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: '/' + h.split(':')[0], title: document.title });
  }
  function routeNow() {
    const h = location.hash.slice(1);
    Sound.beep(false);
    closeModal();
    if (h.startsWith('lab-') && Missions.byId(h.slice(4))) {
      showView('lab');
      openMission(h.slice(4));
      window.scrollTo(0, 0);
    } else if (h === 'laws' && !inExam()) {
      showView('laws'); S.scene = null; S.mission = null;
      Laws.render($('#laws'));
      Progress.Stats.bump('laws');
      window.scrollTo(0, 0);
    } else if (h === 'components' && !inExam()) {
      showView('components'); S.scene = null; S.mission = null;
      Components.render($('#components'));
      Progress.Stats.bump('comps');
      window.scrollTo(0, 0);
    } else if (h === 'guide') {
      history.replaceState(null, '', '#resources');
      routeNow();
      openGuide();
      return;
    } else if (h === 'experiments' && !inExam()) {
      showView('experiments'); S.scene = null; S.mission = null;
      renderExperiments();
      window.scrollTo(0, 0);
    } else if (h === 'paths' && !inExam()) {
      showView('paths'); S.scene = null; S.mission = null;
      Pages.renderPaths($('#paths'));
      window.scrollTo(0, 0);
    } else if (h.startsWith('path-') && !inExam()) {
      const [pid, les] = h.slice(5).split(':');
      const same = S.view === 'path';
      showView('path'); S.scene = null; S.mission = null;
      Pages.renderPath($('#path'), pid, les ? (les in { tour: 1, laws: 1, components: 1 } ? '@' + les : les) : null);
      if (!same || matchMedia('(max-width: 720px)').matches) window.scrollTo(0, 0);
    } else if (h.startsWith('quiz-') && !inExam()) {
      if (S.view !== 'quiz') Learn.resetQuiz();
      showView('quiz'); S.scene = null; S.mission = null;
      Learn.renderQuiz($('#quiz'), h.slice(5));
      window.scrollTo(0, 0);
    } else if (h === 'glossary' && !inExam()) {
      showView('glossary'); S.scene = null; S.mission = null;
      Learn.renderGlossary($('#glossary'));
      window.scrollTo(0, 0);
    } else if (h === 'resources' && !inExam()) {
      showView('resources'); S.scene = null; S.mission = null;
      Pages.renderResources($('#resources'), { teacher: S.server });
      $$('#resources [data-open-guide]').forEach(a => a.onclick = e => { e.preventDefault(); openGuide(); });
      window.scrollTo(0, 0);
    } else if (h === 'about' && !inExam()) {
      showView('about'); S.scene = null; S.mission = null;
      Pages.renderAbout($('#about'), { counts: { missions: Missions.list.length, parts: Components.PARTS.length, challenges: Builder.CHALLENGES.length } });
      window.scrollTo(0, 0);
    } else if (h === 'tour' && !inExam()) {
      S.pendingTour = true;
      location.replace('#lab-free');
      return;
    } else if (h === 'progress' && !inExam()) {
      showView('progress'); S.scene = null; S.mission = null;
      Progress.render($('#progress'));
      window.scrollTo(0, 0);
    } else {
      const wasHome = S.view === 'home';
      showView('home'); S.scene = null; S.mission = null;
      renderHome();
      if (!wasHome) window.scrollTo(0, 0);
    }
  }

  function applyLang() {
    paintLang();
    if (S.view === 'home') renderHome();
    else if (S.view === 'laws') Laws.render($('#laws'));
    else if (S.view === 'progress') Progress.render($('#progress'));
    else if (S.view === 'components') Components.render($('#components'));
    else if (['experiments', 'paths', 'path', 'resources', 'about', 'glossary'].includes(S.view)) routeNow();
    else if (S.view === 'quiz') Learn.renderQuiz($('#quiz'), location.hash.slice(6));
    else if (S.view === 'lab' && S.scene) {
      if (S.question) S.question = S.mission.question(S.scene);
      renderBench(); renderPanel(); renderFuses(); renderLibrary(); paintLabHead();
      requestAnimationFrame(() => { layout(); update(); });
    }
    if (!$('#guide').hidden) $('#guideColors').innerHTML = colorTable(false);
    renderStudentChip(); tickExam(); paintTools();
  }

  function paintTools() {
    const tb = (ic, t) => `${icon(ic)}<span>${t}</span>`;
    $('#tourBtn').innerHTML = tb('play', tr('جولة الجهاز', 'Meter tour'));
    const on = Tour.explaining;
    $('#explainBtn').setAttribute('aria-pressed', String(on));
    $('#explainBtn').innerHTML = tb('info', on ? tr('إيقاف الشرح', 'Stop explaining') : tr('اشرح لي', 'Explain'));
    $('#probesBtn').innerHTML = tb('target', tr('أعد المجسات', 'Reset probes'));
    $('#pRestart').innerHTML = tb('refresh', tr('إعادة', 'Restart'));
    $('#guideBtn').innerHTML = tb('book', tr('الدليل', 'Guide'));
    const fs = !!document.fullscreenElement;
    $('#fullBtn').innerHTML = tb(fs ? 'x' : 'eye', fs ? tr('خروج', 'Exit') : tr('ملء الشاشة', 'Fullscreen'));
    $('#fullBtn').hidden = !document.fullscreenEnabled;
  }

  function paintLang() {
    const b = $('#langBtn');
    b.innerHTML = `${icon('globe')} <span>${I18N.lang === 'en' ? 'ع' : 'EN'}</span>`;
    b.setAttribute('aria-label', I18N.lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English');
  }

  // بطاقات المهام: ضوء يتبع المؤشر + ميل خفيف (على أجهزة الماوس فقط)
  function setupCardFx() {
    if (UI.reduce() || !matchMedia('(hover: hover)').matches) return;
    document.addEventListener('pointermove', e => {
      const c = e.target.closest && e.target.closest('.mcard');
      if (!c) return;
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', (x * 100) + '%'); c.style.setProperty('--my', (y * 100) + '%');
      c.style.setProperty('--tilt-x', ((0.5 - y) * 4).toFixed(2) + 'deg'); c.style.setProperty('--tilt-y', ((x - 0.5) * 5).toFixed(2) + 'deg');
    });
    document.addEventListener('pointerout', e => {
      const c = e.target.closest && e.target.closest('.mcard');
      if (c && !c.contains(e.relatedTarget)) { c.style.setProperty('--tilt-x', '0deg'); c.style.setProperty('--tilt-y', '0deg'); }
    });
  }

  // ════════════════════════════════ التشغيل
  function init() {
    I18N.applyStatic();
    DIG = MeterUI.create('digital'); ANA = MeterUI.create('analog');
    DIG.mount($('#meterDig'), meterHandlers);
    ANA.mount($('#meterAna'), meterHandlers);
    Builder.init({ refresh: refreshLab, toast, mistake: (t, d) => logEvent(t === 'burn' ? 'burn' : t, d) });
    setupProbe('red'); setupProbe('black');
    $('#bench').addEventListener('click', onBenchClick);
    $('#bench').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-act]')) { e.preventDefault(); onBenchClick(e); } });
    $$('#meterSwitch button').forEach(b => b.onclick = () => {
      const a = b.dataset.kind === 'analog';
      if (a === S.analog) return;
      S.analogPref = a; store.set('analogPref', a);
      setMeterKind(a); renderFuses(); layout(); update();
    });
    $('#pHintBtn').onclick = () => {
      const i = currentTask(); if (i < 0) return;
      const h = $('#pHint');
      if (!S.hinted.has(i)) { S.hinted.add(i); S.hints++; logEvent('hint', String(i + 1)); }
      h.hidden = false; h.innerHTML = `${icon('bulb')}<span>${esc(T(S.mission.tasks[i].hint))}</span>`;
      $('#pHintBtn').innerHTML = icon('bulb') + ' ' + tr('تلميح', 'Hint');
    };
    $('#pRecord').onclick = recordPoint;
    $('#pToggle').onclick = () => $('#panel').classList.toggle('open');
    $('#pRestart').onclick = () => openMission(S.mission.id);
    $('#guideBtn').onclick = openGuide;
    $('#probesBtn').onclick = () => {
      S.probes.red = { term: null }; S.probes.black = { term: null }; S.sel = null;
      markAttached(); layout(); update();
    };
    $('#fullBtn').onclick = () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else $('#lab').requestFullscreen().catch(() => {});
    };
    document.addEventListener('fullscreenchange', () => { paintTools(); requestAnimationFrame(layout); });
    Pages.setContext({ progress: () => S.progress, stats: () => Progress.Stats.get(), tourSeen: () => Tour.seen(), stars });
    $('#certBtn').onclick = showCertificate;
    $('#langBtn').onclick = () => { if (I18N.lang === 'ar') Progress.Stats.bump('lang'); I18N.set(I18N.lang === 'en' ? 'ar' : 'en'); };
    I18N.onChange(applyLang);
    $$('[data-close-guide]').forEach(b => b.onclick = () => { $('#guide').hidden = true; });
    $('#ohmV').oninput = calcOhm; $('#ohmR').oninput = calcOhm;
    $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); $('#guide').hidden = true; } });
    $('#studentChip').onclick = askName;
    const mute = $('#muteBtn');
    const paintMute = () => { mute.innerHTML = icon(Sound.muted ? 'mute' : 'vol'); mute.setAttribute('aria-label', Sound.muted ? tr('تشغيل الصوت', 'Unmute') : tr('كتم الصوت', 'Mute')); };
    paintMute();
    mute.onclick = () => { Sound.toggleMute(); paintMute(); };
    paintLang();
    setupCardFx();
    paintTools();
    $('#tourBtn').onclick = () => Tour.start(S.analog ? 'analog' : 'digital', paintTools);
    $('#explainBtn').onclick = () => {
      const on = Tour.explain(!Tour.explaining);
      paintTools();
      if (on) toast(tr('وضع الشرح: المس أي جزء من الجهاز أو المجسات لترى شرحه.', 'Explain mode: tap any part of the meter or probes to see what it does.'), 'info');
    };

    new ResizeObserver(() => layout()).observe($('#labArea'));
    window.addEventListener('resize', layout);
    setInterval(() => { if (S.scene && S.last) renderDisplay(); }, 420);
    setInterval(tickExam, 1000);
    setInterval(capTick, 100);
    window.addEventListener('hashchange', route);
    route();
    detectServer();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http') && window.ML_PWA) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* غير متاح */ });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
