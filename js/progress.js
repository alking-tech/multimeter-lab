/*
 * progress.js — صفحة «تقدّمي»: ملخص، مهارات، أوسمة، وسجل المهام
 * الإحصاءات الإضافية تُحفظ في المتصفح (ml.stats).
 */
(function () {
  'use strict';
  const L = (ar, en) => ({ ar, en });
  const load = (k, d) => { try { const v = localStorage.getItem('ml.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem('ml.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const Stats = {
    get: () => load('stats', {}),
    bump(key, n) { const s = Stats.get(); s[key] = (s[key] || 0) + (n || 1); save('stats', s); return s[key]; },
  };

  const SKILLS = [
    { t: L('الجهد V', 'Voltage V'), m: ['battery', 'outlet', 'divider', 'car', 'usb'] },
    { t: L('التيار A', 'Current A'), m: ['current', 'ohmlaw', 'parallel'] },
    { t: L('المقاومة Ω', 'Resistance Ω'), m: ['resistors', 'series', 'kettle'] },
    { t: L('الاستمرارية والدايود', 'Continuity & diodes'), m: ['cables', 'led', 'usb', 'relay'] },
    { t: L('القوانين', 'The laws'), m: ['ohmlaw', 'series', 'parallel', 'divider', 'kettle'] },
    { t: L('التشخيص', 'Troubleshooting'), m: ['flashlight', 'car', 'analog', 'usb'] },
    { t: L('القطع الإلكترونية', 'Electronic components'), m: ['capacitor', 'transistor', 'sensors', 'ntc', 'relay'] },
  ];

  const BADGES = [
    { id: 'first', ic: 'play', t: L('الخطوة الأولى', 'First step'), d: L('أنهِ أول مهمة', 'Finish your first mission'), ok: c => c.done >= 1 },
    { id: 'steady', ic: 'target', t: L('يد ثابتة', 'Steady hand'), d: L('3 نجوم في 3 مهام', '3 stars on 3 missions'), ok: c => c.three >= 3 },
    { id: 'fuse', ic: 'shield', t: L('صديق الفيوز', 'Fuse friend'), d: L('أنهِ «قياس التيار» بدون أي خطأ', 'Finish "Measuring Current" with no mistakes'), ok: c => c.p.current && c.p.current.mistakes === 0 },
    { id: 'nohint', ic: 'eye', t: L('بلا تلميحات', 'No hints needed'), d: L('5 مهام بدون أي تلميح', '5 missions without a hint'), ok: c => c.noHint >= 5 },
    { id: 'graph', ic: 'chart', t: L('راسم المنحنيات', 'Curve plotter'), d: L('ارسم منحنى V–I بنفسك', 'Plot a V–I curve yourself'), ok: c => !!c.p.ohmlaw },
    { id: 'needle', ic: 'needle', t: L('قارئ الإبرة', 'Needle reader'), d: L('3 نجوم في «اقرأ الإبرة»', '3 stars on "Read the Needle"'), ok: c => c.p.analog && c.p.analog.stars === 3 },
    { id: 'doctor', ic: 'wrench', t: L('المشخّص', 'The fixer'), d: L('أصلح الكشّاف والسيارة', 'Diagnose the flashlight and the car'), ok: c => !!(c.p.flashlight && c.p.car) },
    { id: 'builder', ic: 'bolt', t: L('مهندس الورشة', 'Workshop engineer'), d: L('أكمل كل تحديات الورشة', 'Complete every workshop challenge'), ok: c => c.build >= 5 },
    { id: 'scholar', ic: 'sigma', t: L('الباحث', 'Scholar'), d: L('افتح صفحة القوانين', 'Open the Laws page'), ok: c => (c.s.laws || 0) >= 1 },
    { id: 'bilingual', ic: 'globe', t: L('ثنائي اللغة', 'Bilingual'), d: L('جرّب الواجهة بالإنجليزية', 'Try the interface in English'), ok: c => (c.s.lang || 0) >= 1 },
    { id: 'persist', ic: 'refresh', t: L('المثابر', 'Persistent'), d: L('أعد مهمة لتحسين نتيجتك', 'Retry a mission to improve'), ok: c => (c.s.retry || 0) >= 1 },
    { id: 'half', ic: 'flame', t: L('منتصف الطريق', 'Halfway there'), d: L('أنهِ نصف المهام', 'Finish half the missions'), ok: c => c.done >= Math.ceil(c.total / 2) },
    { id: 'quiz1', ic: 'target', t: L('اجتاز الاختبار', 'Quiz passer'), d: L('اجتز اختبار أي مسار', 'Pass any path quiz'), ok: c => c.quiz >= 1 },
    { id: 'quizall', ic: 'star', t: L('سيّد المسارات', 'Path master'), d: L('اجتز اختبارات المسارات الأربعة', 'Pass all four path quizzes'), ok: c => c.quiz >= 4 },
    { id: 'all', ic: 'cap', t: L('خبير الملتيميتر', 'Multimeter expert'), d: L('أنهِ كل المهام', 'Finish every mission'), ok: c => c.done >= c.total },
    { id: 'stars', ic: 'trophy', t: L('النجوم كاملة', 'All the stars'), d: L('اجمع كل النجوم', 'Collect every star'), ok: c => c.stars >= c.total * 3 },
  ];

  function context() {
    const p = load('progress', {}), list = Missions.list, s = Stats.get();
    const vals = list.map(m => p[m.id]).filter(Boolean);
    return {
      p, s, total: list.length, done: vals.length,
      stars: vals.reduce((a, v) => a + v.stars, 0),
      three: vals.filter(v => v.stars === 3).length,
      noHint: vals.filter(v => !v.hints).length,
      mistakes: vals.reduce((a, v) => a + (v.mistakes || 0), 0),
      secs: vals.reduce((a, v) => a + (v.secs || 0), 0),
      build: Builder.doneCount(),
      quiz: Object.values(load('quiz', {})).filter(v => v >= 4).length,
    };
  }

  const earned = () => { const c = context(); return BADGES.filter(b => b.ok(c)).map(b => b.id); };

  // يُستدعى بعد أي تقدّم: يعيد الأوسمة الجديدة منذ آخر مرة
  function newBadges() {
    const seen = new Set(load('badgesSeen', [])), now = earned();
    const fresh = now.filter(id => !seen.has(id));
    if (fresh.length) save('badgesSeen', now);
    return fresh.map(id => BADGES.find(b => b.id === id));
  }

  const fmtTime = s => (s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}h` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

  function render(el) {
    const c = context(), list = Missions.list, got = new Set(earned());
    const tile = (val, label, id, extra) => `<div class="tile"><b id="${id}">0</b>${extra || ''}<span>${label}</span></div>`;
    el.innerHTML = `
      <section class="prog-hero">
        <div class="prog-ring">${UI.ring(c.done / c.total, 132, tr('نسبة الإنجاز', 'Completion'))}</div>
        <div class="prog-head">
          <p class="eyebrow">${tr('تقدّمي', 'My progress')}</p>
          <h1>${c.done === 0 ? tr('ابدأ رحلتك في القياس', 'Start your measuring journey') : c.done >= c.total ? tr('أنهيت كل المهام!', 'You finished every mission!') : tr(`باقي لك ${c.total - c.done} مهام`, `${c.total - c.done} missions to go`)}</h1>
          <div class="tiles">
            ${tile(c.done, tr('مهام مكتملة', 'missions done'), 'tDone', `<small>/${c.total}</small>`)}
            ${tile(c.stars, tr('نجوم', 'stars'), 'tStars', `<small>/${c.total * 3}</small>`)}
            ${tile(got.size, tr('أوسمة', 'badges'), 'tBadges', `<small>/${BADGES.length}</small>`)}
            <div class="tile"><b>${fmtTime(c.secs)}</b><span>${tr('وقت التعلّم', 'time learning')}</span></div>
          </div>
        </div>
      </section>

      <section class="prog-block">
        <h2>${icon('target')} ${tr('مهاراتك', 'Your skills')}</h2>
        <div class="skills">${SKILLS.map(sk => {
          const got3 = sk.m.reduce((a, id) => a + ((c.p[id] && c.p[id].stars) || 0), 0), max = sk.m.length * 3, pc = Math.round(got3 / max * 100);
          return `<div class="skill"><div class="skill-top"><span>${esc(T(sk.t))}</span><b>${pc}%</b></div>
            <div class="bar"><span style="--w:${pc}%"></span></div>
            <small>${sk.m.map(id => esc(T(Missions.byId(id).title))).join(' · ')}</small></div>`;
        }).join('')}</div>
      </section>

      <section class="prog-block">
        <h2>${icon('trophy')} ${tr('الأوسمة', 'Badges')}</h2>
        <div class="badges">${BADGES.map(b => `<div class="badge ${got.has(b.id) ? 'on' : ''}" title="${esc(T(b.d))}">
          <span class="badge-ic">${icon(got.has(b.id) ? b.ic : 'lock')}</span><b>${esc(T(b.t))}</b><small>${esc(T(b.d))}</small></div>`).join('')}</div>
      </section>

      <section class="prog-block">
        <h2>${icon('book')} ${tr('سجل المهام', 'Mission record')}</h2>
        <div class="tbl-scroll"><table class="hist">
          <thead><tr><th>#</th><th>${tr('المهمة', 'Mission')}</th><th>${tr('النجوم', 'Stars')}</th><th>${tr('الأخطاء', 'Mistakes')}</th><th>${tr('التلميحات', 'Hints')}</th><th>${tr('أفضل وقت', 'Best time')}</th><th></th></tr></thead>
          <tbody>${list.map(m => {
            const r = c.p[m.id];
            return `<tr class="${r ? '' : 'todo'}"><td>${m.num}</td><td>${esc(T(m.title))}</td>
              <td class="st">${r ? '★'.repeat(r.stars) + '<i>' + '★'.repeat(3 - r.stars) + '</i>' : '<i>★★★</i>'}</td>
              <td>${r ? r.mistakes : '—'}</td><td>${r ? (r.hints || 0) : '—'}</td><td>${r ? fmtTime(r.secs || 0) : '—'}</td>
              <td><a class="btn small ${r ? 'ghost' : ''}" href="#lab-${m.id}">${r ? tr('حسّن', 'Improve') : tr('ابدأ', 'Start')}</a></td></tr>`;
          }).join('')}</tbody></table></div>
      </section>

      <section class="prog-block reset-box">
        <div><b>${tr('البدء من جديد', 'Start over')}</b><p>${tr('يمسح النجوم والأوسمة ولوحة الورشة من هذا الجهاز فقط.', 'Clears stars, badges and the workshop board on this device only.')}</p></div>
        <div class="reset-actions" id="resetActions"><button class="btn danger-ghost" id="resetAsk">${icon('refresh')} ${tr('امسح تقدّمي', 'Reset my progress')}</button></div>
      </section>`;
    UI.countUp(el.querySelector('#tDone'), c.done);
    UI.countUp(el.querySelector('#tStars'), c.stars);
    UI.countUp(el.querySelector('#tBadges'), got.size);
    el.querySelector('#resetAsk').onclick = () => {
      el.querySelector('#resetActions').innerHTML = `<span class="confirm-q">${tr('متأكد؟ لا يمكن التراجع.', 'Sure? This cannot be undone.')}</span>
        <button class="btn danger" id="resetYes">${tr('نعم، امسح', 'Yes, reset')}</button><button class="btn ghost" id="resetNo">${tr('إلغاء', 'Cancel')}</button>`;
      el.querySelector('#resetNo').onclick = () => render(el);
      el.querySelector('#resetYes').onclick = () => {
        ['progress', 'stats', 'badgesSeen', 'buildComps', 'buildDone', 'certName'].forEach(k => { try { localStorage.removeItem('ml.' + k); } catch (e) { /* ignore */ } });
        location.hash = 'home';
        location.reload();
      };
    };
  }

  window.Progress = { render, Stats, newBadges, earned, BADGES };
})();
