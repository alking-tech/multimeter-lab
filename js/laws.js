/*
 * laws.js — صفحة «القوانين»: من أين أبدأ؟ والفرق بين الجهد والتيار والمقاومة،
 * وكل قانون مع شرح مبسّط ومثال محلول وحاسبة صغيرة ورابط لتجربة تطبّقه.
 */
(function () {
  'use strict';
  const L = (ar, en) => ({ ar, en });

  const PATH = [
    { n: 1, t: L('الدائرة المغلقة', 'The closed loop'), d: L('الكهرباء تحتاج طريقاً كاملاً يخرج من المصدر ويعود إليه. أي قطع = لا تيار.', 'Electricity needs a complete path out of the source and back. Any break means no current.') },
    { n: 2, t: L('الجهد V', 'Voltage V'), d: L('الدافع الذي يحرّك الشحنات. بدونه لا يتحرك شيء.', 'The push that moves charges. Without it nothing moves.') },
    { n: 3, t: L('التيار I', 'Current I'), d: L('كمية الشحنات التي تمر فعلاً في الثانية.', 'How much charge actually flows each second.') },
    { n: 4, t: L('المقاومة R', 'Resistance R'), d: L('ما يعيق مرور التيار ويحدد كميته.', 'What opposes the current and sets how much flows.') },
    { n: 5, t: L('قانون أوم', "Ohm's law"), d: L('يربط الثلاثة معاً: ⁦V = I × R.⁩', 'Ties all three together: ⁦V = I × R.⁩') },
    { n: 6, t: L('التوالي والتوازي', 'Series & parallel'), d: L('كيف تتجمع المقاومات، وكيف يتوزع الجهد والتيار.', 'How resistors combine, and how voltage and current split.') },
    { n: 7, t: L('القدرة P', 'Power P'), d: L('كم طاقة يستهلك الجهاز في الثانية (واط).', 'How much energy a device uses per second (watts).') },
  ];

  const COMPARE = {
    head: [L('', ''), L('الجهد', 'Voltage'), L('التيار', 'Current'), L('المقاومة', 'Resistance')],
    rows: [
      [L('الرمز', 'Symbol'), 'V', 'I', 'R'],
      [L('الوحدة', 'Unit'), L('فولت (V)', 'volt (V)'), L('أمبير (A)', 'ampere (A)'), L('أوم (Ω)', 'ohm (Ω)')],
      [L('ما هو؟', 'What is it?'), L('فرق «الضغط» بين نقطتين', 'The "pressure" difference between two points'), L('كمية الشحنات المارّة في الثانية', 'Charge flowing per second'), L('ممانعة العنصر لمرور التيار', 'How much a part opposes current')],
      [L('تشبيه الماء', 'Water analogy'), L('ضغط الماء في الخزان', 'Water pressure in the tank'), L('كمية الماء المتدفقة', 'Amount of water flowing'), L('ضيق الأنبوب', 'Narrowness of the pipe')],
      [L('كيف يوصل الجهاز؟', 'How to connect the meter'), L('على التوازي، والدائرة تعمل', 'In parallel, circuit on'), L('على التوالي، بعد فتح الدائرة', 'In series, after breaking the loop'), L('والعنصر مفصول عن الكهرباء', 'With the part disconnected')],
      [L('وضع المفتاح', 'Dial setting'), 'V⎓ / V~', 'A⎓', 'Ω'],
      [L('خطأ شائع', 'Common mistake'), L('اختيار نطاق أصغر من القيمة ← OL', 'Range too small → OL'), L('وضع الجهاز على طرفي مصدر ← يحترق الفيوز', 'Across a source → blown fuse'), L('القياس والكهرباء موصولة ← قراءة خاطئة', 'Measuring a live circuit → wrong reading')],
    ],
  };

  const LAWS = [
    {
      id: 'ohm', title: L('قانون أوم', "Ohm's law"), formula: 'V = I × R', also: 'I = V ÷ R   ·   R = V ÷ I',
      what: L('الجهد على مقاومة يساوي التيار المار فيها مضروباً في قيمتها. إذا عرفت أي اثنين تحسب الثالث.', 'The voltage across a resistor equals the current through it times its resistance. Know any two and you can find the third.'),
      when: L('في أي دائرة فيها مقاومة: لحساب التيار المتوقع قبل القياس، أو لمعرفة مقاومة مجهولة.', 'Any circuit with a resistor: predict the current before measuring, or find an unknown resistance.'),
      example: L('بطارية 9V ومقاومة 450Ω ← ⁦I = 9 ÷ 450 = 0.02A = 20mA⁩. إذن نختار نطاق 200mA في الجهاز.', '9V battery and 450Ω → ⁦I = 9 ÷ 450 = 0.02A = 20mA⁩, so pick the 200mA range.'),
      calc: { inputs: [['V', L('الجهد', 'Voltage'), 'V', 9], ['R', L('المقاومة', 'Resistance'), 'Ω', 450]], out: L('التيار I', 'Current I'), fn: v => fmtA(v.V / v.R) },
      mission: 'ohmlaw',
    },
    {
      id: 'series', title: L('المقاومات على التوالي', 'Resistors in series'), formula: 'R = R₁ + R₂ + …',
      what: L('المقاومات في طريق واحد: التيار نفسه يمر في الكل، والمقاومات تُجمع.', 'Resistors in one path: the same current flows through all, and resistances add.'),
      when: L('عندما يوجد طريق واحد فقط للتيار (مثل أضواء الزينة القديمة).', 'When there is only one path for the current (like old string lights).'),
      example: L('⁦1kΩ + 2.2kΩ = 3.2kΩ⁩. إذا انقطعت واحدة توقفت الدائرة كلها.', '⁦1kΩ + 2.2kΩ = 3.2kΩ⁩. If one opens, the whole circuit stops.'),
      calc: { inputs: [['a', L('R₁', 'R₁'), 'Ω', 1000], ['b', L('R₂', 'R₂'), 'Ω', 2200]], out: L('المكافئة', 'Equivalent'), fn: v => fmtR(v.a + v.b) },
      mission: 'series',
    },
    {
      id: 'parallel', title: L('المقاومات على التوازي', 'Resistors in parallel'), formula: '1/R = 1/R₁ + 1/R₂', also: L('لمقاومتين: R = (R₁ × R₂) ÷ (R₁ + R₂)', 'For two: R = (R₁ × R₂) ÷ (R₁ + R₂)'),
      what: L('المقاومات على نفس النقطتين: للتيار أكثر من طريق، فتقل المقاومة الكلية عن أصغر واحدة.', 'Resistors across the same two points: current has several paths, so the total is less than the smallest one.'),
      when: L('مثل أجهزة البيت: كلها على التوازي، وكل جهاز يأخذ 220V كاملة.', 'Like home appliances: all in parallel, each getting the full 220V.'),
      example: L('مقاومتان 1kΩ على التوازي = 500Ω (النصف).', 'Two 1kΩ resistors in parallel = 500Ω (half).'),
      calc: { inputs: [['a', L('R₁', 'R₁'), 'Ω', 1000], ['b', L('R₂', 'R₂'), 'Ω', 1000]], out: L('المكافئة', 'Equivalent'), fn: v => fmtR(v.a * v.b / (v.a + v.b)) },
      mission: 'series',
    },
    {
      id: 'divider', title: L('مقسّم الجهد وقانون كيرشوف', "Voltage divider & Kirchhoff's law"), formula: 'V₂ = V × R₂ ÷ (R₁ + R₂)', also: L('كيرشوف: مجموع الجهود في الحلقة = جهد المصدر', 'Kirchhoff: voltages around a loop add up to the source'),
      what: L('في التوالي ينقسم جهد المصدر على المقاومات بنسبة قيمها: الأكبر يأخذ جهداً أكبر.', 'In series the source voltage splits in proportion to the resistances: the bigger one gets more.'),
      when: L('لتصغير جهد إلى قيمة أقل (مثل الحساسات)، أو للتأكد من صحة القراءات: ⁦V₁ + V₂ = V⁩.', 'To get a smaller voltage (e.g. for sensors), or to sanity-check readings: ⁦V₁ + V₂ = V⁩.'),
      example: L('9V مع 1kΩ و2kΩ ← ⁦V₂ = 9 × 2 ÷ 3 = 6V⁩، و ⁦V₁ = 3V⁩، والمجموع 9V.', '9V with 1kΩ and 2kΩ → ⁦V₂ = 9 × 2 ÷ 3 = 6V⁩, ⁦V₁ = 3V⁩, total 9V.'),
      calc: { inputs: [['V', L('الجهد', 'Voltage'), 'V', 9], ['a', 'R₁', 'Ω', 1000], ['b', 'R₂', 'Ω', 2000]], out: L('الجهد على R₂', 'Voltage on R₂'), fn: v => (v.V * v.b / (v.a + v.b)).toFixed(2) + ' V' },
      mission: 'divider',
    },
    {
      id: 'power', title: L('القدرة الكهربائية', 'Electric power'), formula: 'P = V × I', also: 'P = V² ÷ R   ·   P = I² × R',
      what: L('القدرة = الطاقة المستهلكة في الثانية، وتقاس بالواط (W). هي التي تحدد الفاتورة وسخونة العنصر.', 'Power is energy used per second, in watts (W). It sets your bill and how hot a part gets.'),
      when: L('لمعرفة استهلاك جهاز، أو هل تتحمل المقاومة الحرارة (أغلب المقاومات الصغيرة ¼W فقط).', "To find a device's consumption, or whether a resistor can take the heat (most small ones are ¼W)."),
      example: L('غلاية مقاومتها 24Ω على 220V ← ⁦P = 220² ÷ 24 ≈ 2000W⁩.', 'A 24Ω kettle on 220V → ⁦P = 220² ÷ 24 ≈ 2000W⁩.'),
      calc: { inputs: [['V', L('الجهد', 'Voltage'), 'V', 220], ['R', L('المقاومة', 'Resistance'), 'Ω', 24]], out: L('القدرة', 'Power'), fn: v => (v.V * v.V / v.R).toFixed(0) + ' W' },
      mission: 'kettle',
    },
    {
      id: 'led', title: L('مقاومة حماية الـLED', 'LED resistor'), formula: 'R = (V − V_LED) ÷ I',
      what: L('الـLED لا يحدد تياره بنفسه؛ بدون مقاومة يمر تيار كبير فيحترق. نختار المقاومة لتعطي حوالي 20mA.', "An LED doesn't limit its own current; without a resistor it burns out. Pick R for about 20mA."),
      when: L('كلما وصلت LED على بطارية أو مصدر.', 'Every time you connect an LED to a battery or supply.'),
      example: L('9V و LED أحمر (1.8V) و 20mA ← ⁦R = (9 − 1.8) ÷ 0.02 = 360Ω⁩ ← نختار 470Ω للأمان.', '9V, red LED (1.8V), 20mA → ⁦R = (9 − 1.8) ÷ 0.02 = 360Ω⁩ → use 470Ω to be safe.'),
      calc: { inputs: [['V', L('جهد المصدر', 'Supply'), 'V', 9], ['F', L('جهد الـLED', 'LED voltage'), 'V', 1.8], ['I', L('التيار', 'Current'), 'mA', 20]], out: L('المقاومة', 'Resistor'), fn: v => fmtR((v.V - v.F) / (v.I / 1000)) },
      mission: 'build',
    },
  ];

  function fmtA(I) { if (!isFinite(I)) return '—'; return I >= 1 ? I.toFixed(2) + ' A' : I >= 1e-3 ? (I * 1e3).toFixed(1) + ' mA' : (I * 1e6).toFixed(0) + ' µA'; }
  function fmtR(r) { if (!isFinite(r) || r < 0) return '—'; return r >= 1e6 ? (r / 1e6).toFixed(2) + ' MΩ' : r >= 1e3 ? (r / 1e3).toFixed(2) + ' kΩ' : r.toFixed(1) + ' Ω'; }
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ltr = s => `<bdi dir="ltr" class="f">${esc(T(s))}</bdi>`;

  function render(el) {
    const missionName = id => { const m = id === 'build' ? Builder.MISSION : Missions.byId(id); return m ? T(m.title) : ''; };
    el.innerHTML = `
      <section class="laws-hero">
        <p class="eyebrow">${tr('مرجع الطالب', 'Student reference')}</p>
        <h1>${tr('القوانين: من أين أبدأ؟', 'The laws: where do I start?')}</h1>
        <p class="lead-p">${tr('ابدأ من الخطوة 1 بالترتيب. كل خطوة تبني على التي قبلها، وكل قانون معه مثال محلول وحاسبة وتجربة تطبّقه بيدك.', 'Go through the steps in order. Each one builds on the last, and every law has a worked example, a calculator and an experiment to try it yourself.')}</p>
      </section>
      <ol class="path">${PATH.map(p => `<li><span class="pn">${p.n}</span><div><b>${esc(T(p.t))}</b><p>${esc(T(p.d))}</p></div></li>`).join('')}</ol>

      <section class="laws-block">
        <h2>${tr('ما الفرق بين الجهد والتيار والمقاومة؟', "What's the difference between voltage, current and resistance?")}</h2>
        <div class="tbl-scroll"><table class="cmp">
          <thead><tr>${COMPARE.head.map(h => `<th>${esc(T(h))}</th>`).join('')}</tr></thead>
          <tbody>${COMPARE.rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${esc(T(c))}</td>` : `<th>${esc(T(c))}</th>`).join('')}</tr>`).join('')}</tbody>
        </table></div>
        <p class="note">${tr('قاعدة تحفظها: <b>الجهد بين نقطتين، والتيار خلال نقطة.</b> لذلك الفولتميتر على التوازي، والأميتر على التوالي.', 'Rule of thumb: <b>voltage is across two points, current is through a point.</b> So the voltmeter goes in parallel and the ammeter in series.')}</p>
      </section>

      <section class="laws-block">
        <h2>${tr('الفرق بين DC و AC', 'DC vs AC')}</h2>
        <div class="acdc">
          <article><h3><span class="mode-chip">V⎓</span>${tr('تيار مستمر DC', 'Direct current (DC)')}</h3>
            <svg viewBox="0 0 320 120" aria-hidden="true"><path d="M20 60H300" stroke="rgba(220,205,255,.25)"/><path d="M20 10V110" stroke="rgba(220,205,255,.25)"/>
              <path d="M20 34H300" stroke="#ffd166" stroke-width="4"/><text x="300" y="26" text-anchor="end" fill="#ffd166" font-size="13" font-weight="700">+9V</text><text x="26" y="74" fill="#a99bc4" font-size="11">0V</text></svg>
            <p>${tr('اتجاه واحد ثابت، وقيمته لا تتغير مع الزمن. مثل البطاريات وشواحن الجوال ولوحات الإلكترونيات. على الجهاز: <b>V⎓</b> و<b>A⎓</b>.', 'One steady direction, constant over time. Batteries, phone chargers and electronics boards. On the meter: <b>V⎓</b> and <b>A⎓</b>.')}</p></article>
          <article><h3><span class="mode-chip">V~</span>${tr('تيار متردد AC', 'Alternating current (AC)')}</h3>
            <svg viewBox="0 0 320 120" aria-hidden="true"><path d="M20 60H300" stroke="rgba(220,205,255,.25)"/><path d="M20 10V110" stroke="rgba(220,205,255,.25)"/>
              <path d="M20 60 C 40 -6, 62 -6, 82 60 S 124 126, 144 60 S 186 -6, 206 60 S 248 126, 268 60 S 290 10, 300 22" fill="none" stroke="#b8e986" stroke-width="4"/>
              <text x="300" y="26" text-anchor="end" fill="#b8e986" font-size="13" font-weight="700">220V ~ 50Hz</text></svg>
            <p>${tr('يعكس اتجاهه باستمرار (50 مرة في الثانية في معظم دولنا). مثل كهرباء المنزل. على الجهاز: <b>V~</b>، والقراءة هي القيمة الفعّالة RMS.', 'Keeps reversing direction (50 times a second in most of our countries). Household power. On the meter: <b>V~</b>, and the reading is the RMS value.')}</p></article>
        </div>
        <p class="note">${tr('خطأ شائع: قياس مقبس المنزل على V⎓ أو البطارية على V~ يعطي قراءة خاطئة. تأكد من الرمز قبل القياس.', 'Common mistake: measuring a wall socket on V⎓, or a battery on V~, gives a wrong reading. Check the symbol before measuring.')}</p>
      </section>

      <section class="laws-block">
        <h2>${tr('القوانين', 'The laws')}</h2>
        <div class="laws-grid">${LAWS.map((l, k) => `
          <article class="law" id="law-${l.id}">
            <h3>${esc(T(l.title))}</h3>
            <div class="formula">${ltr(l.formula)}${l.also ? `<small>${ltr(l.also)}</small>` : ''}</div>
            <p><b>${tr('ماذا يعني؟', 'What it means')}</b> ${esc(T(l.what))}</p>
            <p><b>${tr('متى أستخدمه؟', 'When to use it')}</b> ${esc(T(l.when))}</p>
            <p class="ex"><b>${tr('مثال', 'Example')}</b> ${esc(T(l.example))}</p>
            <div class="calc" data-k="${k}">
              ${l.calc.inputs.map(([key, lab, unit, val]) => `<label>${esc(T(lab))} <span class="u">(${unit})</span><input type="number" inputmode="decimal" step="any" data-key="${key}" id="calc-${l.id}-${key}" value="${val}"></label>`).join('')}
              <output>${esc(T(l.calc.out))} = <b class="res"></b></output>
            </div>
            <a class="btn small" href="#lab-${l.mission}">${tr('جرّبه في', 'Try it in')}: ${esc(missionName(l.mission))}</a>
          </article>`).join('')}</div>
      </section>`;
    el.querySelectorAll('.calc').forEach(c => {
      const law = LAWS[+c.dataset.k];
      const run = () => {
        const v = {};
        c.querySelectorAll('input').forEach(i => { v[i.dataset.key] = parseFloat(i.value); });
        const ok = Object.values(v).every(Number.isFinite);
        c.querySelector('.res').textContent = ok ? law.calc.fn(v) : '—';
      };
      c.querySelectorAll('input').forEach(i => { i.oninput = run; });
      run();
    });
  }

  window.Laws = { render };
})();
