/*
 * learn.js — اختبار نهاية كل مسار + قاموس المصطلحات.
 *   Learn.renderQuiz(el, pathId)  → خمسة أسئلة، شرح بعد كل إجابة، والنجاح 4 من 5
 *   Learn.renderGlossary(el)      → قاموس عربي / إنجليزي مع بحث
 *   Learn.passed(pathId)          → هل اجتاز الطالب اختبار المسار؟
 * © 2026 ALKING TECH
 */
(function () {
  'use strict';
  const L = (ar, en) => ({ ar, en });
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const load = (k, d) => { try { const v = localStorage.getItem('ml.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem('ml.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
  const F = s => '⁦' + s + '⁩';
  const PASS = 4;

  // q: السؤال، c: الخيارات (الأول هو الصحيح؛ تُخلط عند العرض)، w: الشرح
  const Q = (q, c, w) => ({ q, c, w });
  const QUIZ = {
    beginner: [
      Q(L('تريد قياس بطارية 9V. أي وضع تختار؟', 'You want to measure a 9V battery. Which setting?'),
        [L('V⎓ على النطاق 20', 'V⎓ on the 20 range'), L('A⎓ على النطاق 200m', 'A⎓ on the 200m range'), L('Ω على النطاق 2k', 'Ω on the 2k range'), L('V~ على النطاق 600', 'V~ on the 600 range')],
        L('البطارية جهد مستمر، والنطاق 20 أكبر من 9V وأقرب إليها، فيعطي أدق قراءة.', 'A battery is DC voltage, and 20 is the closest range above 9V, so it gives the most precise reading.')),
      Q(L('المجس الأسود يوضع دائماً في المدخل:', 'The black probe always goes in:'),
        [L('COM', 'COM'), L('VΩmA', 'VΩmA'), L('10A', '10A'), L('أي مدخل', 'Any jack')],
        L('COM هو المدخل المشترك لكل القياسات. الأحمر فقط يتنقّل بين VΩmA و10A.', 'COM is the common jack for every measurement. Only the red lead moves between VΩmA and 10A.')),
      Q(L('قست سلكاً على Ω فظهرت OL. ماذا يعني ذلك؟', 'You measure a wire on Ω and see OL. What does it mean?'),
        [L('السلك مقطوع (دائرة مفتوحة)', 'The wire is broken (open circuit)'), L('السلك سليم تماماً', 'The wire is perfectly fine'), L('يوجد قِصَر', 'There is a short'), L('البطارية فارغة', 'The battery is flat')],
        L('OL تعني أن المقاومة أكبر من النطاق: لا يوجد مسار للتيار، أي أن السلك مقطوع.', 'OL means the resistance is beyond the range: there is no path for current, so the wire is broken.')),
      Q(L('صفّر الجهاز في وضع الاستمرارية. هذا يعني:', 'The meter beeps on continuity. This means:'),
        [L('المسار متصل ومقاومته صغيرة جداً', 'The path is connected with very low resistance'), L('يوجد جهد عالٍ', 'There is a high voltage'), L('الفيوز احترق', 'The fuse has blown'), L('النطاق خاطئ', 'The range is wrong')],
        L('الصفارة تعمل عندما تكون المقاومة أقل من حوالي 50Ω: المسار موصول.', 'The beeper sounds below about 50Ω: the path is connected.')),
      Q(L('في منفذ USB، أين نجد +5V؟', 'In a USB port, where is +5V?'),
        [L('بين الطرف 1 والطرف 4', 'Between pin 1 and pin 4'), L('بين الطرفين 2 و3', 'Between pins 2 and 3'), L('بين الطرف 1 والطرف 2', 'Between pin 1 and pin 2'), L('على الغلاف المعدني فقط', 'On the metal shell only')],
        L('الطرف 1 هو +5V والطرف 4 هو الأرضي. الطرفان 2 و3 للبيانات.', 'Pin 1 is +5V and pin 4 is ground. Pins 2 and 3 carry data.')),
    ],
    intermediate: [
      Q(L('كيف يوصل الجهاز لقياس التيار؟', 'How is the meter connected to measure current?'),
        [L('على التوالي بعد فتح الدائرة', 'In series, after breaking the circuit'), L('على التوازي مع العنصر', 'In parallel with the part'), L('على طرفي البطارية مباشرة', 'Straight across the battery'), L('في أي مكان', 'Anywhere')],
        L('التيار يجب أن يمر داخل الجهاز، فنفتح الدائرة ونجعل الجهاز جزءاً منها. على التوازي يحدث قِصَر ويحترق الفيوز.', 'The current must pass through the meter, so you break the circuit and make the meter part of it. In parallel it shorts and blows the fuse.')),
      Q(L(`بطارية 9V ومقاومة 450Ω. كم التيار؟ (${F('I = V ÷ R')})`, 'A 9V battery and a 450Ω resistor. What is the current? (I = V ÷ R)'),
        [L('20mA', '20mA'), L('2mA', '2mA'), L('200mA', '200mA'), L('4A', '4A')],
        L(`${F('I = 9 ÷ 450 = 0.02A')}، أي 20mA.`, 'I = 9 ÷ 450 = 0.02A, which is 20mA.')),
      Q(L('مقاومتان 1kΩ على التوازي. المقاومة الكلية:', 'Two 1kΩ resistors in parallel. The total resistance is:'),
        [L('500Ω', '500Ω'), L('2kΩ', '2kΩ'), L('1kΩ', '1kΩ'), L('صفر', 'Zero')],
        L('مقاومتان متساويتان على التوازي = نصف الواحدة. على التوالي تُجمعان فتصبح 2kΩ.', 'Two equal resistors in parallel = half of one. In series they add up to 2kΩ.')),
      Q(L('فرعان على التوازي: 40mA و20mA. كم التيار الكلي؟', 'Two parallel branches carry 40mA and 20mA. What is the total current?'),
        [L('60mA', '60mA'), L('20mA', '20mA'), L('30mA', '30mA'), L('40mA', '40mA')],
        L('قانون كيرشوف للتيار: التيار الكلي = مجموع تيارات الفروع.', "Kirchhoff's current law: total current = sum of the branch currents.")),
      Q(L('بطارية 9V ومقاومتان متساويتان على التوالي. كم الجهد على الواحدة؟', 'A 9V battery and two equal resistors in series. What is the voltage across one?'),
        [L('4.5V', '4.5V'), L('9V', '9V'), L('18V', '18V'), L('صفر', 'Zero')],
        L('الجهد ينقسم بنسبة المقاومات، ومع مقاومتين متساويتين ينقسم نصفين.', 'Voltage splits by the resistance ratio; two equal resistors split it in half.')),
    ],
    advanced: [
      Q(L('قبل قياس مقاومة دائرة فيها مكثف كبير يجب:', 'Before measuring resistance in a circuit with a big capacitor you must:'),
        [L('تفريغ المكثف', 'Discharge the capacitor'), L('شحن المكثف', 'Charge the capacitor'), L('تسخين المكثف', 'Heat the capacitor'), L('لا شيء', 'Nothing')],
        L('الشحنة المخزّنة تعطي قراءة خاطئة وقد تؤذي الجهاز، فنفرّغه أولاً.', 'The stored charge gives a wrong reading and can harm the meter, so discharge it first.')),
      Q(L('ترانزستور NPN على وضع الدايود: الأحمر على القاعدة والأسود على الباعث. القراءة:', 'NPN transistor on diode test: red on base, black on emitter. The reading is:'),
        [L('حوالي 0.6V', 'About 0.6V'), L('OL', 'OL'), L('0V بالضبط', 'Exactly 0V'), L('9V', '9V')],
        L('وصلة القاعدة-الباعث في NPN مثل دايود سيليكون في الاتجاه الأمامي: حوالي 0.6V.', 'In an NPN the base–emitter junction is like a forward silicon diode: about 0.6V.')),
      Q(L('ماذا يحدث لمقاومة الثرمستور NTC عندما يسخن؟', 'What happens to an NTC thermistor resistance when it heats up?'),
        [L('تقل', 'It drops'), L('تزيد', 'It rises'), L('لا تتغير', 'It stays the same'), L('تصبح OL', 'It goes OL')],
        L('NTC = معامل حرارة سالب: كلما ارتفعت الحرارة نقصت المقاومة.', 'NTC = negative temperature coefficient: the hotter it gets, the lower the resistance.')),
      Q(L('في مرحّل السيارة، الطرفان 85 و86 هما:', 'In a car relay, pins 85 and 86 are:'),
        [L('الملف', 'The coil'), L('نقاط التلامس', 'The contacts'), L('الأرضي فقط', 'Ground only'), L('الفيوز', 'The fuse')],
        L('85 و86 للملف، و30 و87 و87a لنقاط التلامس.', '85 and 86 are the coil; 30, 87 and 87a are the contacts.')),
      Q(L('بطارية السيارة تقرأ حوالي 14V والمحرك يعمل. هذا يعني:', 'A car battery reads about 14V with the engine running. This means:'),
        [L('الدينمو يشحن البطارية بشكل سليم', 'The alternator is charging normally'), L('البطارية تالفة', 'The battery is dead'), L('يوجد قِصَر خطير', 'There is a dangerous short'), L('الجهاز معطّل', 'The meter is broken')],
        L('البطارية وحدها حوالي 12.6V، والدينمو يرفع الجهد إلى 13.8–14.4V أثناء الشحن.', 'The battery alone is about 12.6V; the alternator lifts it to 13.8–14.4V while charging.')),
    ],
    free: [
      Q(L('ماذا يحتاج الـLED حتى يعمل بأمان من بطارية 9V؟', 'What does an LED need to run safely from a 9V battery?'),
        [L('مقاومة على التوالي معه', 'A resistor in series with it'), L('مقاومة على التوازي معه', 'A resistor in parallel with it'), L('لا شيء', 'Nothing'), L('مكثف كبير', 'A big capacitor')],
        L('المقاومة على التوالي تحدّ التيار (مثلاً 470Ω)، وبدونها يحترق الـLED.', 'A series resistor limits the current (e.g. 470Ω); without it the LED burns out.')),
      Q(L('ما هو القِصَر (Short circuit)؟', 'What is a short circuit?'),
        [L('مسار مقاومته شبه صفر بين طرفي المصدر', 'A near-zero-resistance path across the source'), L('دائرة مفتوحة', 'An open circuit'), L('سلك طويل', 'A long wire'), L('مقاومة كبيرة', 'A large resistance')],
        L('القِصَر يسمح بتيار كبير جداً يسخّن الأسلاك ويحرق الفيوزات والبطاريات.', 'A short lets a huge current flow, heating wires and blowing fuses and batteries.')),
      Q(L('حتى يضيء المصباح يجب أن تكون الدائرة:', 'For a lamp to light, the circuit must be:'),
        [L('مغلقة من المصدر وإليه', 'Closed, from the source and back'), L('مفتوحة', 'Open'), L('بدون بطارية', 'Without a battery'), L('على وضع OFF', 'Switched OFF')],
        L('التيار يحتاج مساراً كاملاً يخرج من المصدر ويعود إليه.', 'Current needs a complete path out of the source and back.')),
      Q(L('لا تعرف القيمة المتوقعة. أي نطاق تبدأ به؟', "You don't know the expected value. Which range do you start with?"),
        [L('الأكبر، ثم تنزل', 'The highest, then step down'), L('الأصغر', 'The lowest'), L('أي نطاق', 'Any range'), L('10A دائماً', 'Always 10A')],
        L('النطاق الأكبر يحمي الجهاز، ثم تنزل حتى تحصل على أدق قراءة.', 'The highest range protects the meter; then step down for the most precise reading.')),
      Q(L('قبل قياس المقاومة أو الاستمرارية:', 'Before measuring resistance or continuity:'),
        [L('افصل الكهرباء عن الدائرة', 'Disconnect the power'), L('شغّل الدائرة', 'Switch the circuit on'), L('ضع الأحمر في 10A', 'Put red in 10A'), L('اعكس المجسين', 'Swap the probes')],
        L('وضع المقاومة يرسل تياراً صغيراً من الجهاز نفسه؛ أي جهد خارجي يفسد القراءة.', 'Resistance mode sends its own small current; any outside voltage spoils the reading.')),
    ],
  };

  const scores = () => load('quiz', {});
  const passed = id => (scores()[id] || 0) >= PASS;
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

  let st = null;   // { path, order, i, score, picked }

  function renderQuiz(el, pathId) {
    const P = Pages.PATHS.find(p => p.id === pathId) || Pages.PATHS[0];
    const qs = QUIZ[P.id];
    if (!st || st.path !== P.id) st = { path: P.id, order: shuffle(qs.map((q, i) => ({ i, ch: shuffle(q.c.map((c, k) => ({ c, ok: k === 0 }))) }))), i: 0, score: 0, picked: null };
    const crumbs = `<nav class="crumbs"><a href="#path-${P.id}" class="crumb-back" aria-label="${tr('رجوع', 'Back')}">${icon('arrow', 'flip-rtl back-ic')}</a>
      <a href="#paths">${tr('المسارات', 'Paths')}</a><span>/</span><a href="#path-${P.id}">${esc(T(P.level))}</a><span>/</span><b>${tr('اختبار المسار', 'Path quiz')}</b></nav>`;
    const n = st.order.length;
    if (st.i >= n) {
      const best = Math.max(scores()[P.id] || 0, st.score);
      const all = scores(); all[P.id] = best; save('quiz', all);
      const ok = st.score >= PASS;
      const next = Pages.PATHS[Pages.PATHS.indexOf(P) + 1];
      el.innerHTML = `${crumbs}<section class="quiz-card quiz-done ${ok ? 'pass' : ''}">
        <div class="qd-ring">${UI.ring(st.score / n, 120, tr('النتيجة', 'Score'))}</div>
        <h1>${ok ? tr('أحسنت! اجتزت الاختبار', 'Well done! You passed') : tr('قريب! حاول مرة أخرى', 'Close! Try again')}</h1>
        <p>${tr(`أجبت ${st.score} من ${n} إجابات صحيحة. النجاح من ${PASS}.`, `You got ${st.score} of ${n} right. You need ${PASS} to pass.`)}</p>
        ${ok ? `<span class="qd-badge">${icon('trophy')} ${tr('شارة', 'Badge')}: ${esc(T(P.level))}</span>` : ''}
        <div class="lh-actions">
          ${ok && next ? `<a class="btn primary big" href="#path-${next.id}">${tr('المسار التالي', 'Next path')}: ${esc(T(next.level))} ${icon('arrow', 'flip-rtl')}</a>` : ''}
          <button class="btn ${ok ? '' : 'primary big'}" data-q="retry">${icon('refresh')} ${tr('أعد الاختبار', 'Retake the quiz')}</button>
          <a class="btn ghost" href="#path-${P.id}">${tr('رجوع للمسار', 'Back to the path')}</a>
        </div></section>`;
      if (ok && !UI.reduce()) UI.confetti();
      el.querySelector('[data-q="retry"]').onclick = () => { st = null; renderQuiz(el, P.id); };
      return;
    }
    const cur = st.order[st.i], q = qs[cur.i], picked = st.picked;
    el.innerHTML = `${crumbs}<section class="quiz-card">
      <div class="quiz-top"><span class="pc-level">${tr('اختبار', 'Quiz')}: ${esc(T(P.level))}</span>
        <ol class="q-dots">${st.order.map((_, k) => `<li class="${k < st.i ? 'past' : k === st.i ? 'now' : ''}"></li>`).join('')}</ol>
        <small>${st.i + 1} / ${n}</small></div>
      <h1>${esc(T(q.q))}</h1>
      <div class="q-choices">${cur.ch.map((c, k) => `<button class="q-ch ${picked != null ? (c.ok ? 'right' : k === picked ? 'wrong' : 'dim') : ''}" data-k="${k}" ${picked != null ? 'disabled' : ''}>
        <span class="q-l">${'أبجد'[k] && I18N.lang === 'ar' ? 'أبجد'[k] : 'ABCD'[k]}</span><span>${esc(T(c.c))}</span>${picked != null && c.ok ? icon('check', 'q-ic') : picked === k && !c.ok ? icon('x', 'q-ic') : ''}</button>`).join('')}</div>
      ${picked != null ? `<div class="q-why ${cur.ch[picked].ok ? 'ok' : 'no'}">${icon(cur.ch[picked].ok ? 'check' : 'info')}<span><b>${cur.ch[picked].ok ? tr('صحيح!', 'Correct!') : tr('ليست هذه.', 'Not quite.')}</b> ${esc(T(q.w))}</span></div>
        <button class="btn primary big" data-q="next">${st.i + 1 < n ? tr('السؤال التالي', 'Next question') : tr('النتيجة', 'See your score')} ${icon('arrow', 'flip-rtl')}</button>` : ''}
    </section>`;
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      st.picked = +b.dataset.k;
      if (cur.ch[st.picked].ok) st.score++;
      Sound.click();
      renderQuiz(el, P.id);
      const nx = el.querySelector('[data-q="next"]'); if (nx) nx.focus();
    });
    const nx = el.querySelector('[data-q="next"]');
    if (nx) nx.onclick = () => { st.i++; st.picked = null; renderQuiz(el, P.id); window.scrollTo(0, 0); };
  }
  function resetQuiz() { st = null; }

  // ── قاموس المصطلحات ──
  const G = (ar, en, unit, d) => ({ ar, en, unit, d });
  const GLOSSARY = [
    G('الجهد', 'Voltage', 'V', L('فرق «الضغط» الكهربائي بين نقطتين، ويقاس بالفولت على التوازي.', 'The electrical “pressure” difference between two points, in volts, measured in parallel.')),
    G('التيار', 'Current', 'A', L('كمية الشحنات التي تمر في الثانية، ويقاس بالأمبير على التوالي.', 'How much charge flows per second, in amps, measured in series.')),
    G('المقاومة', 'Resistance', 'Ω', L('ممانعة العنصر لمرور التيار، وتقاس بالأوم والدائرة مفصولة.', 'How much a part opposes current, in ohms, measured with power off.')),
    G('القدرة', 'Power', 'W', L(`الطاقة المستهلكة في الثانية: ${F('P = V × I')}.`, 'Energy used per second: P = V × I.')),
    G('قانون أوم', "Ohm's law", 'V = I × R', L('العلاقة بين الجهد والتيار والمقاومة.', 'The relationship between voltage, current and resistance.')),
    G('تيار مستمر', 'Direct current (DC)', 'V⎓', L('تيار في اتجاه واحد ثابت، مثل البطارية.', 'Current in one steady direction, like a battery.')),
    G('تيار متردد', 'Alternating current (AC)', 'V~', L('تيار يعكس اتجاهه باستمرار، مثل كهرباء المنزل 220V.', 'Current that keeps reversing, like 220V household power.')),
    G('الاستمرارية', 'Continuity', '•)))', L('وجود مسار متصل؛ الجهاز يصفّر تحت حوالي 50Ω.', 'A connected path; the meter beeps below about 50Ω.')),
    G('دائرة مفتوحة', 'Open circuit', 'OL', L('مسار مقطوع لا يمر فيه تيار.', 'A broken path where no current flows.')),
    G('قِصَر', 'Short circuit', '', L('مسار مقاومته شبه صفر بين طرفي المصدر؛ تيار كبير وخطر.', 'A near-zero-resistance path across a source; huge, dangerous current.')),
    G('التوالي', 'Series', '', L('عناصر على مسار واحد يمر فيها نفس التيار.', 'Parts on one path carrying the same current.')),
    G('التوازي', 'Parallel', '', L('عناصر على فروع منفصلة عليها نفس الجهد.', 'Parts on separate branches sharing the same voltage.')),
    G('مقسّم الجهد', 'Voltage divider', '', L('مقاومتان على التوالي تقسمان الجهد بنسبتهما.', 'Two series resistors that split the voltage by their ratio.')),
    G('قانون كيرشوف', "Kirchhoff's laws", 'KCL / KVL', L('مجموع التيارات في نقطة = صفر، ومجموع الجهود في حلقة = صفر.', 'Currents at a node sum to zero; voltages around a loop sum to zero.')),
    G('النطاق', 'Range', '', L('أكبر قيمة يقرؤها الجهاز في الوضع المختار.', 'The largest value the meter reads on the chosen setting.')),
    G('خارج النطاق', 'Overload', 'OL', L('القيمة أكبر من النطاق، أو المسار مفتوح.', 'The value is above the range, or the path is open.')),
    G('المدخل المشترك', 'Common', 'COM', L('مدخل المجس الأسود في كل القياسات.', 'The black lead’s jack for every measurement.')),
    G('المجس', 'Probe / Test lead', '', L('القلم الذي تلمس به نقاط القياس؛ أحمر وأسود.', 'The pen you touch the test points with; red and black.')),
    G('الفيوز', 'Fuse', '', L('سلك رفيع ينصهر ليحمي الدائرة من التيار الزائد.', 'A thin link that melts to protect against overcurrent.')),
    G('الدايود', 'Diode', '▶|', L('يمرّر التيار في اتجاه واحد فقط.', 'Lets current flow in one direction only.')),
    G('الثنائي الباعث للضوء', 'LED', '', L('دايود يضيء عندما يمر فيه التيار في الاتجاه الصحيح.', 'A diode that lights up when current flows the right way.')),
    G('الأنود والكاثود', 'Anode & cathode', '+ / −', L('الطرف الموجب والسالب للدايود؛ الكاثود عليه حلقة أو الرجل القصيرة.', 'A diode’s + and − ends; the cathode has the band or the short leg.')),
    G('المكثف', 'Capacitor', 'F', L('يخزّن الشحنة الكهربائية ويفرّغها، ويقاس بالفاراد.', 'Stores and releases charge, measured in farads.')),
    G('الترانزستور', 'Transistor', 'NPN / PNP', L('مفتاح أو مكبّر إلكتروني بثلاثة أطراف: قاعدة ومجمّع وباعث.', 'An electronic switch or amplifier with three legs: base, collector, emitter.')),
    G('المقاومة المتغيّرة', 'Potentiometer', '', L('مقاومة بمقبض تتغير قيمتها بين الطرف الأوسط والطرفين.', 'A knob-controlled resistor whose middle leg varies the value.')),
    G('المقاومة الضوئية', 'LDR', '', L('مقاومة تقل في الضوء وتزيد في الظلام.', 'A resistor that drops in light and rises in the dark.')),
    G('الثرمستور', 'Thermistor (NTC)', '', L('مقاومة تتغير مع الحرارة؛ NTC تقل عند التسخين.', 'A temperature-dependent resistor; an NTC drops when heated.')),
    G('المرحّل', 'Relay', '', L('مفتاح يعمل بملف مغناطيسي: تيار صغير يتحكم في تيار كبير.', 'A coil-operated switch: a small current controls a big one.')),
    G('المصباح', 'Lamp', '', L('فتيل يسخن ويضيء؛ مقاومته تزيد كثيراً عندما يسخن.', 'A filament that heats and glows; its resistance rises a lot when hot.')),
    G('الطور', 'Live (Phase)', 'L', L('سلك المقبس الذي يحمل الجهد ~220V.', 'The socket wire carrying ~220V.')),
    G('المحايد', 'Neutral', 'N', L('سلك العودة في المقبس، جهده قريب من الصفر.', 'The socket’s return wire, near zero volts.')),
    G('الأرضي', 'Earth / Ground', 'E / GND', L('سلك الحماية، ونقطة الصفر المرجعية في الدوائر.', 'The safety wire, and the 0V reference in circuits.')),
    G('الدينمو', 'Alternator', '', L('مولّد السيارة الذي يشحن البطارية والمحرك يعمل.', 'The car’s generator that charges the battery while the engine runs.')),
    G('الجهاز التناظري', 'Analog meter', '', L('جهاز بإبرة تتحرك على تدريج بدل الشاشة الرقمية.', 'A meter with a moving needle on a scale instead of a digital display.')),
    G('المقاومة الداخلية', 'Internal resistance', '', L('مقاومة صغيرة داخل البطارية أو الجهاز تؤثر على القياس.', 'A small resistance inside a battery or meter that affects readings.')),
    G('الدقة', 'Resolution', '', L('أصغر تغيّر يظهر على الشاشة؛ النطاق الأصغر أدق.', 'The smallest change the display shows; a lower range is finer.')),
  ];

  function renderGlossary(el) {
    el.innerHTML = `
      <header class="page-hero">
        <p class="eyebrow">${tr('قاموس المصطلحات', 'Glossary')}</p>
        <h1>${tr('كل مصطلح بالعربي والإنجليزي', 'Every term in Arabic and English')}</h1>
        <p class="lead-p">${tr('الكتب والفيديوهات غالباً بالإنجليزي: هنا تجد المصطلح ومعناه ورمزه بسرعة.', 'Books and videos are often in English: find each term, its meaning and its symbol here.')}</p>
        <label class="g-search">${icon('target')}<input type="search" id="gq" placeholder="${tr('ابحث: جهد، Voltage، OL…', 'Search: voltage, جهد, OL…')}" autocomplete="off"></label>
      </header>
      <div class="g-grid" id="glist"></div>
      <p class="g-empty" id="gempty" hidden>${tr('لا توجد نتيجة. جرّب كلمة أخرى.', 'No match. Try another word.')}</p>`;
    const list = el.querySelector('#glist'), q = el.querySelector('#gq');
    const norm = t => String(t).toLowerCase().replace(/[ًٌٍَُِّْـ]/g, '').replace(/[أإآ]/g, 'ا');
    const draw = () => {
      const f = norm(q.value.trim());
      const hits = GLOSSARY.filter(g => !f || (f.length <= 3 ? [g.ar, g.en, g.unit] : [g.ar, g.en, g.unit, g.d.ar, g.d.en]).some(x => norm(x).includes(f)));
      list.innerHTML = hits.map(g => `<article class="g-item"><div class="g-head"><h3>${esc(I18N.lang === 'en' ? g.en : g.ar)}</h3>${g.unit ? `<span class="mode-chip">${esc(g.unit)}</span>` : ''}</div>
        <p class="g-alt" dir="${I18N.lang === 'en' ? 'rtl' : 'ltr'}">${esc(I18N.lang === 'en' ? g.ar : g.en)}</p><p>${esc(T(g.d))}</p></article>`).join('');
      el.querySelector('#gempty').hidden = hits.length > 0;
    };
    q.oninput = draw;
    draw();
  }

  window.Learn = { QUIZ, PASS, renderQuiz, resetQuiz, passed, scores, renderGlossary, GLOSSARY };
})();
