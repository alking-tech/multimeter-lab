/*
 * missions.js — المهام التعليمية (عربي + English)
 * ------------------------------------------------------------
 * كل مهمة:
 *   setup()      → تبني المشهد (عناصر عشوائية في كل محاولة)
 *   tasks[]      → خطوات يتحقق منها التطبيق تلقائياً من القراءة الحية
 *   question()   → سؤال الختام بعد إنهاء الخطوات
 *   learned[]    → ملخص ما تعلّمه الطالب
 * النصوص: L('عربي', 'English') وتُعرض بـ T()، أو tr() داخل الدوال.
 */
(function () {
  'use strict';
  const L = (ar, en) => ({ ar, en });
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => arr.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  const F = s => '⁦' + s + '⁩';      // عزل المعادلات عن اتجاه النص

  const on = (s, partId) => !!(s.red && s.black && s.red.part === partId && s.black.part === partId && s.red.term !== s.black.term);
  const onTerms = (s, a, b) => !!(s.red && s.black && ((s.red.term === a && s.black.term === b) || (s.red.term === b && s.black.term === a)));
  const dir = (s, r, b) => !!(s.red && s.black && s.red.term === r && s.black.term === b);
  const valid = s => !s.ol && !s.garbage;
  const ch = (arr) => shuffle(arr).map(([label, ok]) => ({ label, ok }));

  const MISSIONS = [
    // ───────────────────────────── البطارية
    {
      id: 'battery', icon: 'V⎓',
      title: L('البطارية الضعيفة', 'The Weak Battery'),
      brief: L('عندك بطاريتان 9V، واحدة منهما ضعيفة. استخدم الجهد المستمر لتعرف أيهما يجب استبدالها.', 'You have two 9V batteries and one is weak. Use DC voltage to find which one to replace.'),
      skills: [L('الجهد المستمر V⎓', 'DC voltage V⎓'), L('اختيار النطاق', 'Choosing a range'), L('القطبية', 'Polarity')],
      setup() {
        const weak = pick(['A', 'B']);
        const mk = (id, x) => ({ type: 'battery9', id, x, y: 110, label: id, emf: id === weak ? rnd(5.9, 7.1) : rnd(9.25, 9.6), r: id === weak ? 14 : 1.5 });
        return { parts: [mk('A', 150), mk('B', 400)], data: { weak } };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى الجهد المستمر V⎓ (النطاق 20 هو الأنسب)', 'Turn the dial to DC voltage V⎓ (the 20 range fits best)'), hint: L('جهد البطارية حوالي 9V. النطاق 2V أصغر منه فيظهر OL، والنطاق 200 يعطي دقة أقل (خانة عشرية واحدة).', 'The battery is about 9V. The 2V range is too small (shows OL) and 200 gives less precision (one decimal).'), check: s => s.mode === 'VDC' },
        { text: L('قِس البطارية A: الأحمر على (+) والأسود على (−)', 'Measure battery A: red on (+), black on (−)'), hint: L('اسحب المجس الأحمر إلى الطرف الصغير (+) والأسود إلى الطرف الكبير (−) أعلى البطارية A.', 'Drag the red probe to the small (+) snap and the black to the large (−) snap on battery A.'), check: s => s.mode === 'VDC' && on(s, 'A') && valid(s) && Math.abs(s.value) > 0.5 },
        { text: L('قِس البطارية B بنفس الطريقة', 'Measure battery B the same way'), hint: L('انقل المجسين إلى أطراف البطارية B.', 'Move both probes to battery B.'), check: s => s.mode === 'VDC' && on(s, 'B') && valid(s) && Math.abs(s.value) > 0.5 },
      ],
      question: sc => ({
        text: tr('أيّ بطارية ضعيفة ويجب استبدالها؟', 'Which battery is weak and should be replaced?'),
        choices: ['A', 'B'].map(k => ({ label: tr(`البطارية ${k}`, `Battery ${k}`), ok: k === sc.data.weak })),
        why: tr('البطارية الجديدة 9V تعطي 9V أو أكثر قليلاً. إذا نزل جهدها تحت 7.5V تقريباً فهي ضعيفة ولن تشغّل الأجهزة جيداً.', 'A fresh 9V battery reads 9V or slightly more. Below about 7.5V it is weak and won\'t run devices well.'),
      }),
      learned: [
        L('وضع V⎓ يقيس فرق الجهد بين نقطتين، ويوصل الجهاز على التوازي مع العنصر.', 'V⎓ measures the voltage difference between two points; the meter goes in parallel with the part.'),
        L('إذا عكست المجسين تظهر القراءة بإشارة سالبة، والجهاز لا يتضرر.', 'Reversed probes give a negative reading; the meter is not harmed.'),
        L('اختر نطاقاً أكبر من القيمة المتوقعة وأقرب ما يمكن لها للحصول على أعلى دقة.', 'Pick a range just above the expected value for the best precision.'),
      ],
    },

    // ───────────────────────────── المقبس
    {
      id: 'outlet', icon: 'V~',
      title: L('أين الطور؟', 'Find the Live Wire'),
      brief: L('مقبس كهرباء بثلاث فتحات غير معلَّمة. استخدم الجهد المتردد لتعرف أي فتحة هي الطور (Live).', 'A wall socket with three unmarked holes. Use AC voltage to find which one is Live.'),
      skills: [L('الجهد المتردد V~', 'AC voltage V~'), L('النطاق 600', 'The 600 range'), L('السلامة', 'Safety')],
      warn: L('في الواقع: أمسك المجسات من المقابض العازلة فقط، ولا تلمس الأطراف المعدنية أبداً.', 'In real life: hold probes only by their insulated grips and never touch the metal tips.'),
      setup() {
        const order = shuffle(['1', '2', '3']);
        return { parts: [{ type: 'outlet', id: 'S', cx: 320, cy: 200, map: { L: order[0], N: order[1], E: order[2] }, drift: rnd(-4, 9) }], data: { live: order[0] } };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى الجهد المتردد V~ على النطاق 600', 'Turn the dial to AC voltage V~, range 600'), hint: L('جهد المنزل حوالي 220–230V، وهو أكبر من 200، لذلك النطاق 200 سيعطي OL.', 'Mains is about 220–230V, more than 200, so the 200 range would show OL.'), check: s => s.posId === 'vac600' },
        { text: L('قِس بين الفتحتين 1 و 2', 'Measure between holes 1 and 2'), hint: L('ضع مجساً في الفتحة 1 والآخر في الفتحة 2. الترتيب لا يهم في الجهد المتردد.', 'One probe in hole 1, the other in hole 2. Order does not matter for AC.'), check: s => s.mode === 'VAC' && onTerms(s, 'S:1', 'S:2') && valid(s) },
        { text: L('قِس بين الفتحتين 2 و 3', 'Measure between holes 2 and 3'), hint: L('انقل المجسين إلى الفتحتين 2 و 3.', 'Move the probes to holes 2 and 3.'), check: s => s.mode === 'VAC' && onTerms(s, 'S:2', 'S:3') && valid(s) },
        { text: L('قِس بين الفتحتين 1 و 3', 'Measure between holes 1 and 3'), hint: L('آخر زوج: الفتحة 1 والفتحة 3.', 'Last pair: holes 1 and 3.'), check: s => s.mode === 'VAC' && onTerms(s, 'S:1', 'S:3') && valid(s) },
      ],
      question: sc => ({
        text: tr('أيّ فتحة هي الطور (Live)؟', 'Which hole is Live?'),
        choices: ['1', '2', '3'].map(k => ({ label: tr(`الفتحة ${k}`, `Hole ${k}`), ok: k === sc.data.live })),
        why: tr('الطور هو الفتحة التي تعطي ~220V مع كلتا الفتحتين الأخريين. أما بين المحايد (Neutral) والأرضي (Earth) فالجهد قريب من الصفر.', 'Live is the hole that reads ~220V against both others. Between Neutral and Earth the voltage is near zero.'),
      }),
      learned: [
        L('جهد المنزل متردد (AC)، ويقاس على V~ وليس V⎓. الجهاز يعرض القيمة الفعّالة RMS.', 'Mains is AC and is measured on V~, not V⎓. The meter shows the RMS value.'),
        L('على V⎓ يظهر جهد المقبس قريباً من الصفر، لأن متوسط الموجة الجيبية صفر.', 'On V⎓ the socket reads near zero because a sine wave averages to zero.'),
        L('لا تضع الجهاز أبداً على وضع التيار (A) ثم تدخل المجسات في المقبس، فهذا يسبب قِصَراً وانفجار الفيوز.', 'Never put probes in a socket with the meter on current (A): it is a short circuit and blows the fuse.'),
      ],
    },

    // ───────────────────────────── المقاومات
    {
      id: 'resistors', icon: 'Ω', colorGuide: true,
      title: L('شيفرة الألوان', 'The Color Code'),
      brief: L('ثلاث مقاومات، واحدة منها تالفة وقيمتها الحقيقية لا تطابق ألوانها. اقرأ الألوان ثم قِس كل مقاومة.', 'Three resistors; one is damaged and does not match its colors. Read the bands, then measure each.'),
      skills: [L('المقاومة Ω', 'Resistance Ω'), L('حلقات الألوان', 'Color bands'), L('التفاوت ±5%', '±5% tolerance')],
      setup() {
        const vals = shuffle([100, 220, 330, 470, 1000, 2200, 4700, 10000, 22000, 47000, 100000]).slice(0, 3);
        const bad = Math.floor(Math.random() * 3);
        const parts = vals.map((v, i) => ({ type: 'resistor', id: `R${i + 1}`, x: 210, y: 90 + i * 115, label: `R${i + 1}`, nominal: v, actual: i === bad ? v * rnd(1.6, 2.3) : v * (1 + rnd(-0.03, 0.03)) }));
        return { parts, data: { bad: `R${bad + 1}` } };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى وضع المقاومة Ω', 'Turn the dial to resistance Ω'), hint: L('منطقة Ω في الجهة اليسرى من المفتاح. ابدأ بنطاق كبير (2M أو 200k) ثم صغّره.', 'The Ω zone is on the left of the dial. Start high (2M or 200k), then go down.'), check: s => s.mode === 'OHM' },
        { text: L('قِس المقاومة R1 (بدون OL)', 'Measure R1 (no OL)'), hint: L('إذا ظهر OL فالمقاومة أكبر من النطاق: اختر نطاقاً أكبر. وإذا ظهرت 0.00 تقريباً اختر نطاقاً أصغر.', 'OL means the value is above the range: go higher. About 0.00 means go lower.'), check: s => s.mode === 'OHM' && on(s, 'R1') && valid(s) },
        { text: L('قِس المقاومة R2', 'Measure R2'), hint: L('اقرأ ألوانها أولاً لتعرف النطاق المناسب.', 'Read its bands first to pick the right range.'), check: s => s.mode === 'OHM' && on(s, 'R2') && valid(s) },
        { text: L('قِس المقاومة R3', 'Measure R3'), hint: L('قارن كل قراءة بالقيمة المكتوبة بالألوان.', 'Compare each reading with the value in the bands.'), check: s => s.mode === 'OHM' && on(s, 'R3') && valid(s) },
      ],
      question: sc => ({
        text: tr('أيّ مقاومة تالفة (قيمتها المقاسة بعيدة عن ألوانها)؟', 'Which resistor is damaged (measured value far from its bands)?'),
        choices: ['R1', 'R2', 'R3'].map(k => ({ label: k, ok: k === sc.data.bad })),
        why: tr('المقاومة السليمة تكون ضمن ±5% من قيمة الألوان (الحلقة الذهبية). التالفة تبتعد كثيراً، وغالباً تزيد بسبب السخونة الزائدة.', 'A good resistor is within ±5% of its bands (gold band). A damaged one drifts far, usually upward from overheating.'),
      }),
      learned: [
        L('الحلقتان الأوليان رقمان، والثالثة عدد الأصفار، والذهبية تعني تفاوت ±5%.', 'First two bands are digits, the third is the number of zeros, gold means ±5%.'),
        L(`الجهاز يمرّر تياراً صغيراً معروفاً ويقيس الجهد ثم يحسب ${F('R = V ÷ I')}.`, `The meter pushes a small known current, measures the voltage, then computes ${F('R = V ÷ I')}.`),
        L('قِس المقاومة دائماً والدائرة مفصولة عن الكهرباء.', 'Always measure resistance with the power disconnected.'),
      ],
    },

    // ───────────────────────────── الأسلاك
    {
      id: 'cables', icon: '•)))',
      title: L('السلك المقطوع', 'The Broken Wire'),
      brief: L('أربعة أسلاك تبدو سليمة، لكن أحدها مقطوع من الداخل. استخدم اختبار الاستمرارية (الصفارة) لتجده.', 'Four wires look fine, but one is broken inside. Use the continuity (beep) test to find it.'),
      skills: [L('الاستمرارية', 'Continuity'), L('الدائرة المفتوحة والمغلقة', 'Open vs closed circuit')],
      setup() {
        const broken = 1 + Math.floor(Math.random() * 4);
        const colors = ['#d8453b', '#2f6fd6', '#2e9e57', '#e3b51e'];
        return { parts: colors.map((c, i) => ({ type: 'cable', id: `C${i + 1}`, x: 130, y: 72 + i * 92, w: 380, color: c, label: tr(`سلك ${i + 1}`, `Wire ${i + 1}`), broken: i + 1 === broken })), data: { broken: `C${broken}` } };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى وضع الاستمرارية •)))', 'Turn the dial to continuity •)))'), hint: L('رمز الصفارة أسفل المفتاح، بجانب رمز الدايود ▶|.', 'The beep symbol is at the bottom of the dial, next to the diode ▶|.'), check: s => s.mode === 'CONT' },
        ...[1, 2, 3, 4].map(k => ({
          text: L(`افحص السلك ${k}: مجس على كل طرف`, `Test wire ${k}: one probe on each end`), hint: L('إذا صفّر الجهاز فالسلك موصول. إذا ظهر OL بدون صوت فهو مقطوع.', 'A beep means the wire is good. OL with no sound means it is broken.'),
          check: s => s.mode === 'CONT' && on(s, `C${k}`) && !s.garbage,
        })),
      ],
      question: sc => ({
        text: tr('أيّ سلك مقطوع؟', 'Which wire is broken?'),
        choices: [1, 2, 3, 4].map(k => ({ label: tr(`سلك ${k}`, `Wire ${k}`), ok: `C${k}` === sc.data.broken })),
        why: tr('السلك السليم مقاومته قريبة من الصفر فيصفّر الجهاز. المقطوع يقطع المسار فتظهر OL (مقاومة لا نهائية).', 'A good wire is near 0Ω so the meter beeps. A broken one opens the path and shows OL (infinite resistance).'),
      }),
      learned: [
        L('الاستمرارية تعني وجود مسار متصل يمر فيه التيار.', 'Continuity means there is a connected path for current.'),
        L('الجهاز يصفّر عندما تكون المقاومة أقل من حوالي 50Ω.', 'The meter beeps below about 50Ω.'),
        L('هذه أسرع طريقة لفحص الأسلاك والفيوزات والمفاتيح.', 'It is the fastest way to check wires, fuses and switches.'),
      ],
    },

    // ───────────────────────────── LED
    {
      id: 'led', icon: '▶|',
      title: L('قطبية الـLED', 'LED Polarity'),
      brief: L('LED قُصّت أرجله بنفس الطول، فلم تعد تعرف الموجب من السالب. استخدم اختبار الدايود.', 'An LED with its legs cut to the same length: which is positive? Use the diode test.'),
      skills: [L('اختبار الدايود', 'Diode test'), L('الاتجاه الأمامي والعكسي', 'Forward vs reverse')],
      setup() {
        const anode = pick(['L', 'R']);
        return { parts: [{ type: 'led', id: 'LED', cx: 190, cy: 70, anode }, { type: 'diode', id: 'D1', x: 380, y: 220, label: tr('دايود سيليكون 1N4007', 'Silicon diode 1N4007') }], data: { anode } };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى اختبار الدايود ▶|', 'Turn the dial to diode test ▶|'), hint: L('رمز المثلث مع الخط أسفل المفتاح.', 'The triangle-and-bar symbol at the bottom of the dial.'), check: s => s.mode === 'DIODE' },
        { text: L('ضع الأحمر على الرجل (أ) والأسود على الرجل (ب)', 'Red on leg (A), black on leg (B)'), hint: L('لاحظ القراءة، وهل أضاء الـLED قليلاً؟', 'Watch the reading. Did the LED glow a little?'), check: s => s.mode === 'DIODE' && dir(s, 'LED:L', 'LED:R') },
        { text: L('اعكس المجسين: الأحمر على (ب) والأسود على (أ)', 'Swap: red on (B), black on (A)'), hint: L('في اتجاه واحد فقط يمر التيار.', 'Current flows in one direction only.'), check: s => s.mode === 'DIODE' && dir(s, 'LED:R', 'LED:L') },
        { text: L('قارن مع الدايود العادي: الأحمر على الطرف بدون الحلقة الفضية', 'Compare with the plain diode: red on the end without the silver band'), hint: L('الحلقة الفضية تدل على الكاثود (السالب). القراءة المتوقعة حوالي 0.6V.', 'The silver band marks the cathode (−). Expect about 0.6V.'), check: s => s.mode === 'DIODE' && dir(s, 'D1:a', 'D1:k') && valid(s) },
      ],
      question: sc => ({
        text: tr('أيّ رجل في الـLED هي الموجب (الأنود)؟', 'Which LED leg is positive (the anode)?'),
        choices: [{ label: tr('الرجل (أ)', 'Leg (A)'), ok: sc.data.anode === 'L' }, { label: tr('الرجل (ب)', 'Leg (B)'), ok: sc.data.anode === 'R' }],
        why: tr('عندما يكون المجس الأحمر على الأنود يمر تيار صغير (1mA) فيضيء الـLED قليلاً ويعرض الجهاز حوالي 1.8V. بالعكس لا يمر تيار فيظهر OL.', 'With red on the anode a small current (1mA) flows, the LED glows faintly and the meter shows about 1.8V. Reversed, nothing flows and it shows OL.'),
      }),
      learned: [
        L('الدايود يسمح بمرور التيار في اتجاه واحد فقط.', 'A diode lets current flow one way only.'),
        L('القراءة الأمامية: حوالي 0.6V للسيليكون، و1.6–2.2V للـLED حسب لونه.', 'Forward reading: about 0.6V for silicon, 1.6–2.2V for an LED depending on color.'),
        L('المجس الأحمر في وضع الدايود هو الموجب، فإذا ظهرت قراءة فالأحمر على الأنود.', 'In diode mode red is positive, so a reading means red is on the anode.'),
      ],
    },

    // ───────────────────────────── شاحن الجوال
    {
      id: 'usb', icon: '5V',
      title: L('الشاحن لا يشحن', "The Charger Won't Charge"),
      brief: L('الجوال لا يشحن. هل العطل في الشاحن أم في سلك الشحن؟ قِس جهد منفذ USB ثم افحص السلك بالاستمرارية.', "The phone won't charge. Is it the charger or the cable? Measure the USB port voltage, then test the cable for continuity."),
      skills: [L('الجهد المستمر V⎓', 'DC voltage V⎓'), L('أطراف منفذ USB', 'USB port pins'), L('الاستمرارية', 'Continuity')],
      setup() {
        const fault = pick(['cable', 'charger']);
        return {
          h: 420,
          parts: [
            { type: 'usbCharger', id: 'CH', x: 60, y: 70, dead: fault === 'charger', label: tr('شاحن الجوال', 'Phone charger') },
            { type: 'cable', id: 'CB', x: 130, y: 340, w: 380, color: '#e6e8eb', label: tr('سلك الشحن', 'Charging cable'), broken: fault === 'cable' },
          ],
          data: { fault },
        };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى V⎓ على النطاق 20', 'Turn the dial to V⎓, range 20'), hint: L('شاحن الجوال يعطي حوالي 5V، فنطاق 20 هو الأنسب.', 'A phone charger gives about 5V, so the 20 range fits best.'), check: s => s.mode === 'VDC' },
        { text: L('قِس جهد المنفذ: الأحمر على الطرف 1 والأسود على الطرف 4', 'Measure the port: red on pin 1, black on pin 4'), hint: L('في منفذ USB: الطرف 1 هو +5V والطرف 4 هو الأرضي (GND). الطرفان 2 و3 للبيانات.', 'In a USB port pin 1 is +5V and pin 4 is ground (GND). Pins 2 and 3 carry data.'), check: (s, sc) => {
          const ok = s.mode === 'VDC' && onTerms(s, 'CH:1', 'CH:4') && valid(s);
          if (ok) sc.data.v = Math.abs(s.value);
          return ok;
        } },
        { text: L('افحص سلك الشحن بالاستمرارية •))): مجس على كل طرف', 'Test the charging cable on continuity •))): one probe on each end'), hint: L('صفارة = السلك سليم. OL بدون صوت = مقطوع من الداخل.', 'A beep means the cable is good. OL with no sound means it is broken inside.'), check: (s, sc) => {
          const ok = s.mode === 'CONT' && on(s, 'CB') && !s.garbage;
          if (ok) sc.data.cont = !s.ol;
          return ok;
        } },
      ],
      question: sc => ({
        text: tr('أين العطل؟', 'Where is the fault?'),
        choices: ch([[tr('سلك الشحن مقطوع', 'The cable is broken'), sc.data.fault === 'cable'], [tr('الشاحن لا يعطي جهداً', 'The charger gives no voltage'), sc.data.fault === 'charger'], [tr('لا يوجد عطل', 'There is no fault'), false]]),
        why: sc.data.fault === 'cable'
          ? tr('الشاحن أعطى حوالي 5V وهذا سليم، لكن السلك أعطى OL في الاستمرارية: المسار مقطوع داخله، فاستبدل السلك.', 'The charger gave about 5V, which is healthy, but the cable read OL on continuity: the path is broken inside, so replace the cable.')
          : tr('السلك صفّر فهو سليم، لكن الشاحن أعطى أقل بكثير من 5V: الشاحن تالف، فاستبدل الشاحن.', 'The cable beeped so it is fine, but the charger read far below 5V: the charger is dead, so replace it.'),
      }),
      learned: [
        L('منفذ USB يعطي 5V بين الطرف 1 (+) والطرف 4 (الأرضي).', 'A USB port gives 5V between pin 1 (+) and pin 4 (ground).'),
        L('افحص المصدر بالجهد، والسلك بالاستمرارية: هكذا تعرف أي جزء هو العطلان.', 'Check the source with voltage and the cable with continuity: that tells you which part failed.'),
        L('هذه طريقة التشخيص بالتجزئة: افحص كل جزء وحده حتى تجد العطل.', 'This is divide-and-conquer troubleshooting: test each part alone until you find the fault.'),
      ],
    },

    // ───────────────────────────── التيار
    {
      id: 'current', icon: 'A⎓',
      title: L('قياس التيار', 'Measuring Current'),
      brief: L('دائرة فيها بطارية ومقاومة ومصباح. لقياس التيار يجب أن يمر التيار داخل الجهاز، أي توصيله على التوالي.', 'A circuit with a battery, a resistor and a lamp. To measure current it must flow through the meter: connect it in series.'),
      skills: [L('التيار A', 'Current A'), L('التوصيل على التوالي', 'Series connection'), L('قانون أوم', "Ohm's law")],
      warn: L('لا تضع الجهاز وهو على وضع التيار على طرفي البطارية مباشرة، فهذا قِصَر ويحرق الفيوز.', 'Never put the meter on current mode straight across the battery: it is a short and blows the fuse.'),
      setup() {
        return {
          parts: [
            { type: 'batteryBox', id: 'B', x: 60, y: 140, emf: rnd(9.2, 9.6), r: 1.5, nodes: { '+': 'n1', '-': 'n0' } },
            { type: 'jumper', id: 'J', x: 190, y: 70, present: true, nodes: { a: 'n1', b: 'n2' } },
            { type: 'resistor', id: 'R', x: 330, y: 70, nominal: 100, actual: 100, label: 'R = 100Ω', nodes: { a: 'n2', b: 'n3' } },
            { type: 'lamp', id: 'LMP', cx: 480, cy: 230, R: 60, Irated: 0.06, label: tr('مصباح 6V', '6V lamp'), nodes: { a: 'n0', b: 'n3' } },
          ],
          wires: [[[100, 128], [100, 70], [190, 70]], [[290, 70], [330, 70]], [[550, 70], [600, 70], [600, 314], [514, 314]], [[100, 302], [100, 372], [446, 372], [446, 314]]],
          data: {},
        };
      },
      tasks: [
        { text: L('افتح الدائرة: اضغط على الوصلة الخضراء لإزالتها', 'Break the circuit: tap the green jumper to remove it'), hint: L('لاحظ أن المصباح ينطفئ لأن المسار انقطع.', 'Notice the lamp goes out because the path is broken.'), check: (s, sc) => !sc.parts.find(p => p.id === 'J').present },
        { text: L('لفّ المفتاح إلى A⎓ على النطاق 200m، والمجس الأحمر في VΩmA', 'Turn the dial to A⎓ 200m, with the red lead in VΩmA'), hint: L('التيار المتوقع عشرات الملي أمبير، لذلك نطاق 200mA مناسب. مدخل 10A للتيارات الكبيرة فقط.', 'Expect tens of milliamps, so 200mA fits. The 10A jack is for large currents only.'), check: s => s.posId === 'a200m' && s.jack === 'V' },
        { text: L('أغلق الدائرة بالجهاز: الأحمر على طرف البطارية (+) والأسود على الطرف الآخر من الوصلة', 'Close the loop with the meter: red on the battery (+) side, black on the other jumper post'), hint: L('ضع المجسين على مكان الوصلة التي أزلتها. هكذا يمر التيار كله خلال الجهاز.', 'Put the probes where the jumper was. Now all the current flows through the meter.'), check: (s, sc) => {
          const ok = s.mode === 'ADC' && onTerms(s, 'J:a', 'J:b') && valid(s) && Math.abs(s.value) > 0.01;
          if (ok) sc.data.I = Math.abs(s.value);
          return ok;
        } },
      ],
      question: sc => {
        const I = sc.data.I || 0.058, Vb = sc.parts.find(p => p.id === 'B').emf, R = Math.round(Vb / I / 10) * 10;
        const opts = shuffle([R, Math.round(R / 10), R * 10, Math.round(R * 3 / 10) * 10]);
        return {
          text: tr(`الجهد ≈ ${Vb.toFixed(1)}V والتيار ≈ ${(I * 1000).toFixed(1)}mA. حسب قانون أوم (${F('R = V ÷ I')})، كم المقاومة الكلية للدائرة تقريباً؟`, `Voltage ≈ ${Vb.toFixed(1)}V and current ≈ ${(I * 1000).toFixed(1)}mA. Using Ohm's law (R = V ÷ I), what is the total resistance?`),
          choices: opts.map(o => ({ label: Parts.fmtOhms(o), ok: o === R })),
          why: tr(`R = ${Vb.toFixed(1)} ÷ ${I.toFixed(4)} ≈ ${Parts.fmtOhms(R)}. وهي مجموع المقاومة 100Ω ومقاومة المصباح (~60Ω) والمقاومة الداخلية للبطارية والجهاز.`, `R = ${Vb.toFixed(1)} ÷ ${I.toFixed(4)} ≈ ${Parts.fmtOhms(R)}: the 100Ω resistor plus the lamp (~60Ω) plus the battery's and meter's internal resistance.`),
        };
      },
      learned: [
        L('الأميتر يوصل على التوالي: نفتح الدائرة ونجعل التيار يمر خلال الجهاز.', 'An ammeter goes in series: break the circuit and make the current pass through the meter.'),
        L('في وضع التيار يصبح الجهاز كأنه سلك (مقاومة صغيرة جداً)، لذلك توصيله على التوازي مع مصدر يسبب قِصَراً.', 'On current mode the meter is almost a wire, so across a source it is a short circuit.'),
        L(`قانون أوم: ${F('V = I × R')}. إذا عرفت اثنين تحسب الثالث.`, "Ohm's law: V = I × R. Know two, find the third."),
      ],
    },

    // ───────────────────────────── التوالي والتوازي
    {
      id: 'series', icon: 'R+R',
      title: L('التوالي والتوازي', 'Series & Parallel'),
      brief: L('مقاومتان على التوالي ومقاومتان متساويتان على التوازي. قِس واكتشف كيف تتجمع المقاومات.', 'Two resistors in series and two equal ones in parallel. Measure and discover how resistors combine.'),
      skills: [L('المقاومة المكافئة', 'Equivalent resistance'), L('التوالي', 'Series'), L('التوازي', 'Parallel')],
      setup() {
        const [a, b] = shuffle([470, 1000, 2200, 3300, 4700]).slice(0, 2);
        const par = pick([1000, 2200, 4700, 10000]);
        const R = (id, x, y, nominal, nodes) => ({ type: 'resistor', id, x, y, nominal, actual: nominal * (1 + rnd(-0.02, 0.02)), label: `${id} = ${Parts.fmtOhms(nominal)}`, nodes });
        return {
          h: 430,
          parts: [R('R1', 40, 90, a, { a: 's1', b: 's2' }), R('R2', 360, 90, b, { a: 's2', b: 's3' }), R('R3', 210, 260, par, { a: 'p1', b: 'p2' }), R('R4', 210, 360, par, { a: 'p1', b: 'p2' })],
          wires: [[[260, 90], [360, 90]], [[210, 260], [150, 260], [150, 360], [210, 360]], [[430, 260], [490, 260], [490, 360], [430, 360]]],
          labels: [[310, 36, tr('على التوالي', 'In series')], [320, 214, tr('على التوازي', 'In parallel')]],
          data: {},
        };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى وضع المقاومة Ω (النطاق 20k مناسب)', 'Turn the dial to Ω (the 20k range fits)'), hint: L('القيم هنا بالكيلو أوم، فنطاق 20k يعطي دقة جيدة.', 'Values here are in kΩ, so 20k gives good precision.'), check: s => s.mode === 'OHM' },
        { text: L('قِس R1 وحدها', 'Measure R1 alone'), hint: L('مجس على كل طرف من R1.', 'One probe on each end of R1.'), check: s => s.mode === 'OHM' && on(s, 'R1') && valid(s) },
        { text: L('قِس R2 وحدها', 'Measure R2 alone'), hint: L('مجس على كل طرف من R2.', 'One probe on each end of R2.'), check: s => s.mode === 'OHM' && on(s, 'R2') && valid(s) },
        { text: L('قِس الاثنتين معاً: من الطرف الأيسر لـ R1 إلى الطرف الأيمن لـ R2', 'Measure both: from the left end of R1 to the right end of R2'), hint: L('لاحظ أن القراءة تساوي R1 + R2 تقريباً.', 'Notice the reading is about R1 + R2.'), check: s => s.mode === 'OHM' && onTerms(s, 'R1:a', 'R2:b') && valid(s) },
        { text: L('قِس مجموعة التوازي (R3 مع R4)', 'Measure the parallel pair (R3 with R4)'), hint: L('ضع المجسين على طرفي R3. لاحظ أن القراءة ليست قيمة ألوانها!', "Probe across R3. Notice the reading is not its color value!"), check: s => s.mode === 'OHM' && s.red && s.black && s.red.node !== s.black.node && ['p1', 'p2'].includes(s.red.node) && ['p1', 'p2'].includes(s.black.node) && valid(s) },
      ],
      question: () => ({
        text: tr('R3 و R4 متساويتان. عند توصيلهما على التوازي، المقاومة الكلية تساوي:', 'R3 and R4 are equal. In parallel, the total resistance is:'),
        choices: ch([[tr('نصف قيمة الواحدة', 'Half of one'), true], [tr('ضعف قيمة الواحدة', 'Double one'), false], [tr('نفس قيمة الواحدة', 'Same as one'), false], [tr('صفر تقريباً', 'About zero'), false]]),
        why: tr('في التوازي يجد التيار طريقين، فتقل المقاومة: 1/R = 1/R3 + 1/R4. ومع مقاومتين متساويتين تكون النتيجة نصف الواحدة. أما في التوالي فالمقاومات تُجمع: R = R1 + R2.', 'In parallel the current has two paths, so resistance drops: 1/R = 1/R3 + 1/R4. Two equal resistors give half of one. In series they add: R = R1 + R2.'),
      }),
      learned: [
        L('التوالي: المقاومات تُجمع، R = R1 + R2.', 'Series: resistances add, R = R1 + R2.'),
        L('التوازي: المقاومة الكلية أصغر من أصغر مقاومة، 1/R = 1/R1 + 1/R2.', 'Parallel: the total is smaller than the smallest, 1/R = 1/R1 + 1/R2.'),
        L('لا يمكنك قياس مقاومة واحدة بدقة وهي موصولة مع غيرها في الدائرة؛ افصل أحد طرفيها أولاً.', "You can't measure one resistor accurately while it is connected to others; lift one leg first."),
      ],
    },

    // ───────────────────────────── التيار في التوازي
    {
      id: 'parallel', icon: 'I₁+I₂',
      title: L('التيار في التوازي', 'Current in Parallel'),
      brief: L('بطارية تغذّي فرعين على التوازي. قِس تيار كل فرع ثم التيار الكلي، واكتشف كيف يتوزّع التيار (قانون كيرشوف للتيار).', "A battery feeds two parallel branches. Measure each branch current, then the total, and discover how current splits (Kirchhoff's current law)."),
      skills: [L('التيار A', 'Current A'), L('قانون كيرشوف للتيار', "Kirchhoff's current law"), L('التوازي', 'Parallel')],
      warn: L('لقياس التيار أزل الوصلة وضع المجسين مكانها. لا تضع الجهاز على وضع التيار على طرفي البطارية.', 'To measure current, remove a jumper and put the probes in its place. Never put the meter on current across the battery.'),
      setup() {
        const [a, b] = shuffle([220, 330, 470]).slice(0, 2);
        const Rp = (id, y, v, node) => ({ type: 'resistor', id, x: 380, y, nominal: v, actual: v * (1 + rnd(-0.02, 0.02)), label: `${id} = ${Parts.fmtOhms(v)}`, nodes: { a: node, b: 'ret' } });
        const J = (id, x, y, a, b) => ({ type: 'jumper', id, x, y, tag: id, present: true, nodes: { a, b } });
        return {
          h: 450,
          parts: [
            { type: 'batteryBox', id: 'B', x: 40, y: 150, emf: rnd(9.2, 9.5), r: 0.6, nodes: { '+': 'top', '-': 'gnd' } },
            J('J1', 260, 90, 'top', 'b1'), Rp('R1', 90, a, 'b1'),
            J('J2', 260, 250, 'top', 'b2'), Rp('R2', 250, b, 'b2'),
            J('J0', 300, 410, 'gnd', 'ret'),
          ],
          wires: [[[80, 138], [80, 90], [260, 90]], [[230, 90], [230, 250], [260, 250]], [[360, 90], [380, 90]], [[360, 250], [380, 250]],
            [[600, 90], [620, 90], [620, 410], [400, 410]], [[600, 250], [620, 250]], [[300, 410], [80, 410], [80, 312]]],
          data: {},
        };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى A⎓ على النطاق 200m، والمجس الأحمر في VΩmA', 'Turn the dial to A⎓ 200m, red lead in VΩmA'), hint: L('التيارات هنا عشرات الملي أمبير.', 'The currents here are tens of milliamps.'), check: s => s.posId === 'a200m' && s.jack === 'V' },
        { text: L('قِس تيار الفرع الأول: أزل الوصلة J1 وضع المجسين مكانها', 'Measure branch 1: remove jumper J1 and put the probes in its place'), hint: L('اضغط على الوصلة J1 لإزالتها، ثم مجس على كل طرف منها.', 'Tap jumper J1 to remove it, then one probe on each of its posts.'), check: (s, sc) => {
          const ok = s.mode === 'ADC' && !sc.parts.find(p => p.id === 'J1').present && onTerms(s, 'J1:a', 'J1:b') && valid(s) && Math.abs(s.value) > 0.005;
          if (ok) sc.data.I1 = Math.abs(s.value);
          return ok;
        } },
        { text: L('أرجع J1، ثم قِس تيار الفرع الثاني مكان الوصلة J2', 'Put J1 back, then measure branch 2 in place of jumper J2'), hint: L('اضغط J1 لإرجاعها، ثم أزل J2 وقِس مكانها.', 'Tap J1 to replace it, then remove J2 and measure there.'), check: (s, sc) => {
          const P = id => sc.parts.find(p => p.id === id).present;
          const ok = s.mode === 'ADC' && P('J1') && !P('J2') && onTerms(s, 'J2:a', 'J2:b') && valid(s) && Math.abs(s.value) > 0.005;
          if (ok) sc.data.I2 = Math.abs(s.value);
          return ok;
        } },
        { text: L('أرجع J2، ثم قِس التيار الكلي مكان الوصلة J0 في السلك الراجع', 'Put J2 back, then measure the total current in place of J0 on the return wire'), hint: L('هنا يمر تيار الفرعين معاً.', 'The current of both branches passes here.'), check: (s, sc) => {
          const P = id => sc.parts.find(p => p.id === id).present;
          const ok = s.mode === 'ADC' && P('J1') && P('J2') && !P('J0') && onTerms(s, 'J0:a', 'J0:b') && valid(s) && Math.abs(s.value) > 0.01;
          if (ok) sc.data.It = Math.abs(s.value);
          return ok;
        } },
      ],
      question: sc => {
        const m = x => ((x || 0) * 1000).toFixed(1) + 'mA';
        const { I1, I2, It } = sc.data;
        return {
          text: tr(`قست ${m(I1)} في الفرع الأول و${m(I2)} في الثاني و${m(It)} للكل. ما العلاقة؟`, `You measured ${m(I1)} in branch 1, ${m(I2)} in branch 2 and ${m(It)} in total. What is the relationship?`),
          choices: ch([[tr('التيار الكلي = مجموع تيارات الفروع', 'Total = sum of the branch currents'), true], [tr('التيار نفسه في كل مكان', 'The current is the same everywhere'), false], [tr('التيار الكلي = الفرق بين الفرعين', 'Total = the difference between branches'), false], [tr('التيار الكلي = متوسط الفرعين', 'Total = the average of the branches'), false]]),
          why: tr('قانون كيرشوف للتيار: التيار الداخل إلى نقطة تفرّع يساوي مجموع التيارات الخارجة منها. والفرع ذو المقاومة الأصغر يأخذ تياراً أكبر، لأن الجهد على الفرعين واحد.', "Kirchhoff's current law: the current into a junction equals the sum of the currents leaving it. The branch with the smaller resistance takes more current, because both branches have the same voltage."),
        };
      },
      learned: [
        L('في التوازي: الجهد واحد على كل الفروع، والتيار يتوزّع بينها.', 'In parallel: every branch has the same voltage, and the current splits between them.'),
        L('قانون كيرشوف للتيار: التيار الكلي = مجموع تيارات الفروع.', "Kirchhoff's current law: total current = sum of the branch currents."),
        L('الفرع ذو المقاومة الأصغر يمر فيه تيار أكبر (I = V ÷ R).', 'The branch with the smaller resistance carries more current (I = V ÷ R).'),
      ],
    },

    // ───────────────────────────── مقسّم الجهد
    {
      id: 'divider', icon: 'V÷',
      title: L('مقسّم الجهد', 'Voltage Divider'),
      brief: L('بطارية 9V ومقاومتان على التوالي. قِس الجهد على كل واحدة واكتشف كيف ينقسم.', 'A 9V battery and two resistors in series. Measure across each and see how the voltage splits.'),
      skills: [L('قانون كيرشوف للجهد', "Kirchhoff's voltage law"), L('مقسّم الجهد', 'Voltage divider')],
      setup() {
        const [a, b] = pick([[1000, 2200], [4700, 4700], [2200, 1000], [1000, 4700], [3300, 1000]]);
        return {
          h: 440,
          parts: [
            { type: 'batteryBox', id: 'B', x: 60, y: 140, emf: rnd(9.2, 9.5), r: 1.5, nodes: { '+': 'top', '-': 'gnd' } },
            { type: 'resistor', id: 'R1', x: 200, y: 70, nominal: a, actual: a, label: `R1 = ${Parts.fmtOhms(a)}`, nodes: { a: 'top', b: 'mid' } },
            { type: 'resistor', id: 'R2', x: 300, y: 380, nominal: b, actual: b, label: `R2 = ${Parts.fmtOhms(b)}`, nodes: { a: 'gnd', b: 'mid' } },
          ],
          wires: [[[100, 128], [100, 70], [200, 70]], [[420, 70], [540, 70], [540, 380], [520, 380]], [[300, 380], [100, 380], [100, 302]]],
          data: {},
        };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى V⎓ على النطاق 20', 'Turn the dial to V⎓, range 20'), hint: L('جهد البطارية حوالي 9V.', 'The battery is about 9V.'), check: s => s.mode === 'VDC' },
        { text: L('قِس جهد البطارية كاملاً', 'Measure the full battery voltage'), hint: L('المجسان على (+) و(−) البطارية.', 'Probes on the battery (+) and (−).'), check: s => s.mode === 'VDC' && on(s, 'B') && valid(s) && Math.abs(s.value) > 1 },
        { text: L('قِس الجهد على R1', 'Measure the voltage across R1'), hint: L('مجس على كل طرف من R1. الدائرة تعمل، وهذا صحيح لقياس الجهد.', 'One probe on each end of R1. The circuit is on, which is right for voltage.'), check: s => s.mode === 'VDC' && on(s, 'R1') && valid(s) && Math.abs(s.value) > 0.3 },
        { text: L('قِس الجهد على R2', 'Measure the voltage across R2'), hint: L('مجس على كل طرف من R2.', 'One probe on each end of R2.'), check: s => s.mode === 'VDC' && on(s, 'R2') && valid(s) && Math.abs(s.value) > 0.3 },
      ],
      question: sc => {
        const [a, b] = ['R1', 'R2'].map(id => sc.parts.find(p => p.id === id).nominal);
        return {
          text: tr('ماذا تلاحظ على الجهدين V1 (على R1) و V2 (على R2)؟', 'What do you notice about V1 (across R1) and V2 (across R2)?'),
          choices: ch([[tr('V1 + V2 = جهد البطارية، والمقاومة الأكبر يقع عليها جهد أكبر', 'V1 + V2 = battery voltage, and the larger resistor gets more voltage'), true], [tr('V1 = V2 = جهد البطارية دائماً', 'V1 = V2 = battery voltage, always'), false], [tr('V1 + V2 = صفر', 'V1 + V2 = 0'), false], [tr('المقاومة الأصغر يقع عليها جهد أكبر', 'The smaller resistor gets more voltage'), false]]),
          why: tr(`نفس التيار يمر في المقاومتين، فالجهد على كل واحدة = I × R. لذلك ينقسم الجهد بنسبة المقاومات: V2 = V × ${Parts.fmtOhms(b)} ÷ ${Parts.fmtOhms(a + b)}. ومجموع الجهود يساوي جهد المصدر (قانون كيرشوف).`, `The same current flows through both, so each voltage = I × R. The voltage splits by ratio: V2 = V × ${Parts.fmtOhms(b)} ÷ ${Parts.fmtOhms(a + b)}. The voltages add up to the source (Kirchhoff).`),
        };
      },
      learned: [
        L('في التوالي: مجموع الجهود على العناصر = جهد المصدر (قانون كيرشوف للجهد).', "In series: the voltages across the parts add up to the source (Kirchhoff's voltage law)."),
        L('الجهد ينقسم بنسبة المقاومات: V2 = V × R2 ÷ (R1 + R2).', 'Voltage splits by ratio: V2 = V × R2 ÷ (R1 + R2).'),
        L('الجهد يقاس والدائرة تعمل، على التوازي مع العنصر.', 'Voltage is measured with the circuit on, in parallel with the part.'),
      ],
    },

    // ───────────────────────────── قانون أوم
    {
      id: 'ohmlaw', icon: 'V/I', chart: true,
      title: L('اكتشف قانون أوم', "Discover Ohm's Law"),
      brief: L('مصدر جهد متغيّر يعرض التيار. ارفع الجهد خطوة خطوة، وقِس الجهد على العنصر، وسجّل النقاط لترسم منحنى V–I بنفسك.', 'A variable supply that shows current. Step the voltage up, measure across the part, and record points to draw the V–I curve yourself.'),
      skills: [L('قانون أوم', "Ohm's law"), L('منحنى V–I', 'V–I curve'), L('العناصر الخطية وغير الخطية', 'Linear vs non-linear parts')],
      setup() {
        return {
          w: 680, h: 380,
          parts: [
            { type: 'supply', id: 'SUP', x: 20, y: 90, V: 0, nodes: { '+': 'vin', '-': 'gnd' } },
            { type: 'dutBoard', id: 'BRD', x: 330, y: 90, dut: 'R', R: 220, nodes: { in: 'vin', out: 'gnd', p: 'dp', q: 'gnd' } },
          ],
          wires: [[[216, 130], [330, 130]], [[216, 270], [260, 270], [260, 310], [330, 310]]],
          data: { points: { R: [], LED: [] } },
        };
      },
      tasks: [
        { text: L('شغّل المصدر: اضغط (+1V) حتى يصل إلى 2V على الأقل', 'Turn the supply on: press (+1V) until it reaches at least 2V'), hint: L('الشاشة الخضراء في المصدر تعرض الجهد المضبوط والتيار الخارج منه.', 'The green display shows the set voltage and the output current.'), check: (s, sc) => sc.parts[0].V >= 2 },
        { text: L('لفّ المفتاح إلى V⎓ 20 وضع المجسين على طرفي العنصر (النقطتين يمين اللوحة)', 'Set V⎓ 20 and put the probes across the part (the two posts on the right of the board)'), hint: L('الطرفان على يمين اللوحة فوق العنصر وتحته.', 'The posts are on the right side of the board, above and below the part.'), check: s => s.mode === 'VDC' && onTerms(s, 'BRD:p', 'BRD:q') },
        { text: L('سجّل 5 نقاط للمقاومة بجهود مختلفة: غيّر جهد المصدر ثم اضغط «سجّل النقطة»', 'Record 5 resistor points at different voltages: change the supply, then press "Record point"'), hint: L('كل نقطة = الجهد الذي يعرضه جهازك + التيار الذي يعرضه المصدر. جرّب 2، 4، 6، 8، 10 فولت.', 'Each point = your meter voltage + the supply current. Try 2, 4, 6, 8, 10 volts.'), check: (s, sc) => sc.data.points.R.length >= 5 },
        { text: L('اضغط «بدّل العنصر» إلى LED وسجّل 5 نقاط من 0V حتى 12V', 'Press "Swap part" to the LED and record 5 points from 0V to 12V'), hint: L('ابدأ من 0V و1V و2V ثم 6V و12V. لاحظ متى يبدأ الـLED بالإضاءة.', 'Start at 0, 1 and 2V, then 6 and 12V. Notice when the LED starts to light.'), check: (s, sc) => { const p = sc.data.points.LED; return p.length >= 5 && Math.max(...p.map(x => x.sv)) - Math.min(...p.map(x => x.sv)) >= 6; } },
      ],
      question: sc => {
        const pts = sc.data.points.R.filter(p => p.I > 1e-4);
        const R = pts.length ? pts.reduce((a, p) => a + p.V / p.I, 0) / pts.length : 220;
        return {
          text: tr('انظر إلى الرسم البياني: أي عنصر يتبع قانون أوم (خط مستقيم يمر بنقطة الصفر)؟', "Look at the graph: which part follows Ohm's law (a straight line through zero)?"),
          choices: ch([[tr('المقاومة', 'The resistor'), true], [tr('الـLED', 'The LED'), false], [tr('كلاهما', 'Both'), false], [tr('لا أحد منهما', 'Neither'), false]]),
          why: tr(`نقاط المقاومة على خط مستقيم، فنسبة V ÷ I ثابتة ≈ ${Parts.fmtOhms(Math.round(R))} وهذه هي قيمتها. أما الـLED فلا يمر فيه تيار تقريباً حتى ~1.7V، ثم يرتفع التيار بسرعة كبيرة؛ لذلك يحتاج دائماً مقاومة حماية.`, `The resistor points lie on a straight line, so V ÷ I is constant ≈ ${Parts.fmtOhms(Math.round(R))}: its value. The LED passes almost nothing until ~1.7V, then the current shoots up, which is why it always needs a series resistor.`),
        };
      },
      learned: [
        L(`قانون أوم: ${F('V = I × R')}. في المقاومة العادية النسبة V ÷ I ثابتة، فالرسم خط مستقيم.`, "Ohm's law: V = I × R. For a resistor V ÷ I is constant, so the graph is a straight line."),
        L('ميل الخط في منحنى V–I يعطي قيمة المقاومة.', 'The slope of the V–I line gives the resistance.'),
        L('الـLED والدايود عناصر غير خطية: لها جهد عتبة، ولا تطيع قانون أوم.', "LEDs and diodes are non-linear: they have a threshold voltage and don't obey Ohm's law."),
      ],
    },

    // ───────────────────────────── الغلاية
    {
      id: 'kettle', icon: 'P',
      title: L('قدرة الغلاية', 'Kettle Power'),
      brief: L('سخّان غلاية مفصول عن الكهرباء. قِس مقاومته، ثم احسب كم واط تستهلك عند تشغيلها على 220V.', 'An unplugged kettle element. Measure its resistance, then work out how many watts it uses on 220V.'),
      skills: [L('المقاومة الصغيرة', 'Low resistance'), L('القدرة الكهربائية P', 'Electric power P')],
      setup() {
        const P = pick([1500, 1800, 2000, 2200]);
        return { parts: [{ type: 'heater', id: 'H', x: 100, y: 280, R: (220 * 220 / P) * (1 + rnd(-0.015, 0.015)), label: tr('سخّان الغلاية', 'Kettle element') }], data: { P } };
      },
      tasks: [
        { text: L('الغلاية مفصولة. لفّ المفتاح إلى Ω على أصغر نطاق (200)', 'The kettle is unplugged. Set Ω on the lowest range (200)'), hint: L('مقاومة السخانات صغيرة (عشرات الأوم)، فالنطاق 200Ω يعطي أفضل دقة.', 'Heater elements are low (tens of ohms), so 200Ω gives the best precision.'), check: s => s.posId === 'r200' },
        { text: L('قِس مقاومة السخّان', 'Measure the element resistance'), hint: L('مجس على كل طرف من ملف السخّان.', 'One probe on each end of the coil.'), check: (s, sc) => { const ok = s.mode === 'OHM' && on(s, 'H') && valid(s); if (ok) sc.data.R = s.value; return ok; } },
      ],
      question: sc => {
        const R = sc.data.R || 220 * 220 / sc.data.P;
        const opts = shuffle([1000, 1500, 1800, 2000, 2200, 3000].filter(x => x !== sc.data.P).slice(0, 3).concat(sc.data.P));
        return {
          text: tr(`قِست R ≈ ${R.toFixed(1)}Ω. باستخدام ${F('P = V² ÷ R')} عند 220V، كم قدرة الغلاية تقريباً؟`, `You measured R ≈ ${R.toFixed(1)}Ω. Using P = V² ÷ R at 220V, what is the kettle's power?`),
          choices: opts.map(o => ({ label: `${o}W`, ok: o === sc.data.P })),
          why: tr(`P = 220 × 220 ÷ ${R.toFixed(1)} ≈ ${Math.round(48400 / R)}W. كلما صغرت مقاومة السخّان زادت القدرة (وزادت الفاتورة).`, `P = 220 × 220 ÷ ${R.toFixed(1)} ≈ ${Math.round(48400 / R)}W. The lower the element's resistance, the higher the power (and the bill).`),
        };
      },
      learned: [
        L(`القدرة الكهربائية: ${F('P = V × I = V² ÷ R')}، وتقاس بالواط.`, 'Electric power: P = V × I = V² ÷ R, measured in watts.'),
        L('الأجهزة الحرارية مثل الغلاية والمكواة مقاومتها صغيرة، لذلك تسحب تياراً كبيراً.', 'Heating appliances like kettles and irons have low resistance, so they draw a lot of current.'),
        L('قِس مقاومة أي جهاز وهو مفصول تماماً عن المقبس.', 'Measure any appliance only when fully unplugged.'),
      ],
    },

    // ───────────────────────────── المكثف
    {
      id: 'capacitor', icon: '‖',
      title: L('المكثف المشحون', 'The Charged Capacitor'),
      brief: L('مكثف إلكتروليتي أُخرج من جهاز قديم. قد يكون ما زال مشحوناً! افحصه بأمان، ثم شاهد كيف يشحنه الجهاز وهو يقيس.', 'An electrolytic capacitor pulled from an old device. It may still be charged! Check it safely, then watch the meter charge it as it measures.'),
      skills: [L('المكثف', 'Capacitors'), L('الشحن والتفريغ', 'Charge & discharge'), L('السلامة', 'Safety')],
      warn: L('المكثفات الكبيرة قد تحتفظ بشحنة خطيرة حتى بعد فصل الجهاز. افحص الجهد وفرّغ المكثف قبل لمس أطرافه.', 'Large capacitors can hold a dangerous charge long after unplugging. Check the voltage and discharge before touching the leads.'),
      setup() {
        return { parts: [{ type: 'capacitor', id: 'C1', cx: 240, cy: 90, uF: 100, vc: rnd(5.5, 8.5), label: tr('مكثف إلكتروليتي', 'Electrolytic capacitor') }], data: {} };
      },
      tasks: [
        { text: L('قبل أي شيء: قِس جهد المكثف على V⎓ (الأحمر على +)', 'First: measure its voltage on V⎓ (red on +)'), hint: L('الطرف تحت الشريط الفاتح المرسوم عليه (−) هو السالب.', 'The leg under the light stripe marked (−) is negative.'), check: (s, sc) => { const ok = s.mode === 'VDC' && on(s, 'C1') && valid(s) && Math.abs(s.value) > 1; if (ok) sc.data.v0 = Math.abs(s.value); return ok; } },
        { text: L('المكثف مشحون! اضغط «فرّغ المكثف» حتى يصبح جهده قريباً من الصفر', 'It is charged! Press "Discharge" until its voltage is near zero'), hint: L('في الواقع نفرّغه بمقاومة (مثل 1kΩ) بين طرفيه لبضع ثوانٍ، ولا نقصّر طرفيه بمفك.', 'In real life you discharge it through a resistor (e.g. 1kΩ) for a few seconds, never by shorting it with a screwdriver.'), check: (s, sc) => sc.data.v0 && Math.abs(sc.parts[0].vc) < 0.05 },
        { text: L('لفّ إلى Ω على النطاق 200k، وضع الأحمر على (+): راقب القراءة', 'Set Ω on the 200k range, red on (+): watch the reading'), hint: L('القراءة لن تثبت! انتظر عدة ثوانٍ ولاحظ كيف تصعد حتى تظهر OL.', 'The reading will not settle! Wait a few seconds and watch it climb until OL.'), check: (s, sc) => {
          if (!(s.mode === 'OHM' && on(s, 'C1'))) return false;
          if (!s.ol && !s.garbage) { sc.data.rMin = Math.min(sc.data.rMin ?? Infinity, s.value); sc.data.rMax = Math.max(sc.data.rMax ?? 0, s.value); }
          if (s.ol && sc.data.rMin != null) sc.data.rMax = Infinity;
          return sc.data.rMin != null && sc.data.rMax - sc.data.rMin > 40000;
        } },
      ],
      question: () => ({
        text: tr('لماذا ترتفع قراءة المقاومة تدريجياً حتى تصل إلى OL؟', 'Why does the resistance reading climb steadily until OL?'),
        choices: ch([[tr('لأن الجهاز يشحن المكثف، فيرتفع جهده ويقل التيار المار فيه', 'The meter is charging the capacitor, so its voltage rises and the current falls'), true], [tr('لأن المكثف تالف', 'The capacitor is faulty'), false], [tr('لأن بطارية الجهاز تنفد', "The meter's battery is running out"), false], [tr('لأن المكثف مقاومة متغيّرة', 'A capacitor is a variable resistor'), false]]),
        why: tr('المكثف يخزّن الشحنة. الجهاز يدفع تياراً صغيراً فيشحنه، وكلما امتلأ ارتفع جهده، فيحسب الجهاز مقاومة أكبر (R = V ÷ I) حتى OL. هذا هو سلوك المكثف السليم. لو بقيت القراءة صفراً فهو مقصور، ولو ظهرت OL فوراً (في المكثفات الكبيرة) فهو مقطوع.', 'A capacitor stores charge. The meter pushes a small current that charges it; as it fills, its voltage rises, so the meter computes a growing resistance (R = V ÷ I) until OL. That is a healthy capacitor. Stuck at zero means shorted; instant OL (on a large cap) means open.'),
      }),
      learned: [
        L('المكثف يخزّن شحنة كهربائية، وقد يبقى مشحوناً بعد فصل الجهاز.', 'A capacitor stores charge and can stay charged after power is removed.'),
        L('قِس الجهد وفرّغ المكثف قبل لمسه أو فحصه.', 'Measure the voltage and discharge before touching or testing it.'),
        L('في المكثف الإلكتروليتي، الشريط على الجسم يدل على الطرف السالب.', 'On an electrolytic capacitor the stripe marks the negative leg.'),
        L('على Ω: القراءة الصاعدة = سليم، صفر ثابت = مقصور، OL فوراً = مقطوع.', 'On Ω: climbing = good, stuck at zero = shorted, instant OL = open.'),
      ],
    },

    // ───────────────────────────── الترانزستور
    {
      id: 'transistor', icon: 'NPN',
      title: L('اكتشف الترانزستور', 'Identify the Transistor'),
      brief: L('ترانزستور مُحيت الكتابة عن أرجله. باختبار الدايود تكتشف القاعدة (B) وهل هو NPN أو PNP.', 'A transistor whose pin markings rubbed off. Use the diode test to find the base (B) and whether it is NPN or PNP.'),
      skills: [L('الترانزستور', 'Transistors'), L('اختبار الدايود', 'Diode test'), L('التفكير المنطقي', 'Reasoning')],
      setup() {
        const pins = shuffle(['B', 'C', 'E']);
        const kind = pick(['NPN', 'PNP']);
        return { parts: [{ type: 'transistor', id: 'Q', cx: 300, cy: 90, kind, pins, code: kind === 'NPN' ? 'BC547' : 'BC557', label: tr('ترانزستور', 'Transistor') }], data: { kind, base: String(pins.indexOf('B') + 1), pairs: {} } };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى اختبار الدايود ▶|', 'Turn the dial to diode test ▶|'), hint: L('الترانزستور من الداخل يشبه دايودين متصلين عند القاعدة.', 'Inside, a transistor looks like two diodes joined at the base.'), check: s => s.mode === 'DIODE' },
        { text: L('جرّب 4 تركيبات مختلفة على الأقل للمجسين على الأرجل', 'Try at least 4 different probe combinations on the legs'), hint: L('مثلاً: الأحمر على 1 والأسود على 2، ثم اعكسهما، ثم جرّب 1 و3...', 'For example red on 1, black on 2, then swap, then try 1 and 3…'), check: (s, sc) => {
          if (s.mode === 'DIODE' && on(s, 'Q')) sc.data.pairs[`${s.red.term}>${s.black.term}`] = s.ol ? 'OL' : s.value;
          return Object.keys(sc.data.pairs).length >= 4;
        } },
        { text: L('اعثر على تركيبتين تعطيان قراءة (وليس OL)', 'Find the two combinations that give a reading (not OL)'), hint: L('الرجل المشتركة بين القراءتين هي القاعدة. إذا كان المجس الأحمر عليها فهو NPN، وإذا كان الأسود فهو PNP.', 'The leg shared by both readings is the base. If the red probe sits on it, it is NPN; if black, PNP.'), check: (s, sc) => {
          if (s.mode === 'DIODE' && on(s, 'Q')) sc.data.pairs[`${s.red.term}>${s.black.term}`] = s.ol ? 'OL' : s.value;
          return Object.values(sc.data.pairs).filter(v => v !== 'OL').length >= 2;
        } },
      ],
      question: sc => {
        const opts = [];
        for (const b of ['1', '2', '3']) for (const k of ['NPN', 'PNP']) opts.push([tr(`القاعدة: الرجل ${b} · ${k}`, `Base: leg ${b} · ${k}`), b === sc.data.base && k === sc.data.kind]);
        return {
          text: tr('أي رجل هي القاعدة (B)، وما نوع الترانزستور؟', 'Which leg is the base (B), and what type is the transistor?'),
          choices: opts.map(([label, ok]) => ({ label, ok })),
          why: tr(`القراءتان كانتا من الرجل ${sc.data.base} إلى الرجلين الأخريين، فهي القاعدة. ${sc.data.kind === 'NPN' ? 'وكان المجس الأحمر (الموجب) على القاعدة، فهو NPN.' : 'وكان المجس الأسود على القاعدة، فهو PNP.'} القراءة الأعلى قليلاً تكون إلى الباعث (E)، والأقل إلى المجمّع (C). وبين C و E تظهر OL في الاتجاهين.`, `Both readings went from leg ${sc.data.base} to the other two, so it is the base. ${sc.data.kind === 'NPN' ? 'Red (positive) was on the base, so it is NPN.' : 'Black was on the base, so it is PNP.'} The slightly higher reading goes to the emitter (E), the lower to the collector (C). Between C and E you get OL both ways.`),
        };
      },
      learned: [
        L('الترانزستور ثنائي القطبية له ثلاث أرجل: القاعدة B، والمجمّع C، والباعث E.', 'A bipolar transistor has three legs: base B, collector C, emitter E.'),
        L('من الداخل: وصلتان مثل الدايود تلتقيان عند القاعدة، فتعطي كل منهما ~0.6V.', 'Inside: two diode junctions meeting at the base, each reading ~0.6V.'),
        L('NPN: الأحمر على القاعدة يعطي قراءتين. PNP: الأسود على القاعدة.', 'NPN: red on the base gives two readings. PNP: black on the base.'),
        L('قراءة بين C و E (أو صفر) تعني أن الترانزستور تالف.', 'Any reading (or zero) between C and E means the transistor is damaged.'),
      ],
    },

    // ───────────────────────────── الحساسات
    {
      id: 'sensors', icon: '↻☀',
      title: L('المقاومة المتغيّرة والضوئية', 'Pot & Light Sensor'),
      brief: L('مقاومة متغيّرة بمقبض (مثل زر الصوت) ومقاومة ضوئية LDR (مثل حساس إنارة الشارع). قِس كيف تتغير قيمتهما.', 'A potentiometer (like a volume knob) and a light-dependent resistor (like a street-light sensor). Measure how their values change.'),
      skills: [L('المقاومة المتغيّرة', 'Potentiometer'), L('الحساسات', 'Sensors')],
      setup() {
        return {
          h: 440,
          parts: [
            { type: 'pot', id: 'POT', cx: 190, cy: 110, R: 10000, pos: 0.3, label: tr('مقاومة متغيّرة', 'Potentiometer') },
            { type: 'ldr', id: 'LDR', cx: 420, cy: 250, light: true, label: tr('مقاومة ضوئية LDR', 'LDR') },
          ],
          data: {},
        };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى Ω على النطاق 20k', 'Set Ω on the 20k range'), hint: L('المقاومة المتغيّرة قيمتها الكلية 10kΩ.', 'The potentiometer is 10kΩ in total.'), check: s => s.mode === 'OHM' },
        { text: L('قِس بين الطرفين 1 و 3 للمقاومة المتغيّرة', 'Measure between legs 1 and 3 of the pot'), hint: L('هذه القيمة الكلية، ولا تتغير مهما لففت المقبض.', 'This is the total value; it does not change when you turn the knob.'), check: s => s.mode === 'OHM' && onTerms(s, 'POT:1', 'POT:3') && valid(s) },
        { text: L('قِس بين 1 و 2 (الطرف الأوسط) ثم لفّ المقبض بالأزرار ↺ ↻', 'Measure between 1 and 2 (middle leg), then turn the knob with ↺ ↻'), hint: L('الطرف الأوسط متصل بذراع ينزلق على المادة المقاوِمة.', 'The middle leg connects to a wiper sliding along the resistive track.'), check: (s, sc) => {
          if (!(s.mode === 'OHM' && onTerms(s, 'POT:1', 'POT:2') && valid(s))) return false;
          sc.data.pMin = Math.min(sc.data.pMin ?? Infinity, s.value); sc.data.pMax = Math.max(sc.data.pMax ?? 0, s.value);
          return sc.data.pMax - sc.data.pMin > 2500;
        } },
        { text: L('قِس الـLDR والضوء مضاء، ثم أطفئ الضوء وقِس مرة أخرى', 'Measure the LDR with the light on, then turn it off and measure again'), hint: L('في الظلام تكبر القيمة كثيراً؛ قد تحتاج نطاق 200k.', 'In the dark the value jumps a lot; you may need the 200k range.'), check: (s, sc) => {
          const p = sc.parts.find(x => x.id === 'LDR');
          if (s.mode === 'OHM' && on(s, 'LDR') && valid(s)) sc.data[p.light ? 'lit' : 'dark'] = s.value;
          return sc.data.lit != null && sc.data.dark != null;
        } },
      ],
      question: () => ({
        text: tr('ماذا يحدث لمقاومة الـLDR في الظلام؟', 'What happens to the LDR resistance in the dark?'),
        choices: ch([[tr('ترتفع كثيراً', 'It rises a lot'), true], [tr('تنخفض', 'It falls'), false], [tr('لا تتغير', 'It stays the same'), false], [tr('تصبح صفراً', 'It becomes zero'), false]]),
        why: tr('الـLDR مصنوع من مادة يقل فيها عدد الشحنات الحرة في الظلام، فترتفع مقاومته (من ~1kΩ في الضوء إلى مئات الكيلو أوم في الظلام). هكذا تعرف إنارة الشارع متى تضيء.', 'An LDR is made of a material with fewer free charges in the dark, so its resistance rises (from ~1kΩ in light to hundreds of kΩ in the dark). That is how street lights know when to switch on.'),
      }),
      learned: [
        L('المقاومة المتغيّرة: الطرفان الخارجيان قيمة ثابتة، والطرف الأوسط يغيّر القيمة مع المقبض.', 'Potentiometer: the outer legs give a fixed value; the middle leg varies with the knob.'),
        L('LDR: مقاومة صغيرة في الضوء، وكبيرة جداً في الظلام.', 'LDR: low resistance in light, very high in the dark.'),
        L('كثير من الحساسات (حرارة، ضوء) هي مقاومات تتغير قيمتها، ونقيسها على Ω.', 'Many sensors (heat, light) are resistors whose value changes; you measure them on Ω.'),
      ],
    },
    // ───────────────────────────── حساس الحرارة
    {
      id: 'ntc', icon: '°C',
      title: L('حساس الحرارة NTC', 'The NTC Heat Sensor'),
      brief: L('الثرمستور NTC موجود في الشواحن والمكيّفات والسيارات. قِس مقاومته في حرارة الغرفة، ثم سخّنه وقِس مرة أخرى.', 'NTC thermistors are in chargers, air conditioners and cars. Measure it at room temperature, then heat it and measure again.'),
      skills: [L('الحساسات', 'Sensors'), L('المقاومة Ω', 'Resistance Ω'), L('معامل الحرارة', 'Temperature coefficient')],
      setup() {
        return { h: 420, parts: [{ type: 'ntc', id: 'NTC', cx: 300, cy: 150, t: 25, label: tr('ثرمستور NTC 10k', 'NTC thermistor 10k') }], data: {} };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى Ω على النطاق 20k', 'Set Ω on the 20k range'), hint: L('قيمته 10kΩ عند 25°C.', 'It is 10kΩ at 25°C.'), check: s => s.mode === 'OHM' },
        { text: L('قِس الثرمستور وهو في حرارة الغرفة (25°C)', 'Measure the thermistor at room temperature (25°C)'), hint: L('مجس على كل طرف. يجب أن تقرأ حوالي 10kΩ.', 'One probe on each leg. You should read about 10kΩ.'), check: (s, sc) => {
          const p = sc.parts.find(x => x.id === 'NTC');
          const ok = s.mode === 'OHM' && on(s, 'NTC') && valid(s) && p.t <= 25;
          if (ok) sc.data.cold = s.value;
          return ok;
        } },
        { text: L('سخّنه إلى 70°C أو أكثر بزر «سخّن +»، وراقب القراءة', 'Heat it to 70°C or more with “Heat +” and watch the reading'), hint: L('اترك المجسين على طرفيه واضغط «سخّن +» عدة مرات.', 'Keep the probes on and tap “Heat +” a few times.'), check: (s, sc) => {
          const p = sc.parts.find(x => x.id === 'NTC');
          const ok = s.mode === 'OHM' && on(s, 'NTC') && valid(s) && p.t >= 70;
          if (ok) sc.data.hot = s.value;
          return ok;
        } },
      ],
      question: () => ({
        text: tr('ماذا حدث لمقاومة الثرمستور NTC عندما سخن؟', 'What happened to the NTC resistance when it got hot?'),
        choices: ch([[tr('نقصت كثيراً', 'It dropped a lot'), true], [tr('زادت', 'It rose'), false], [tr('لم تتغير', 'It did not change'), false], [tr('صارت OL', 'It went OL'), false]]),
        why: tr('NTC تعني «معامل حرارة سالب»: كلما ارتفعت الحرارة نقصت المقاومة. الدائرة تقرأ هذه المقاومة فتعرف الحرارة، مثل حساس حرارة محرك السيارة أو حماية الشاحن من السخونة.', 'NTC means “negative temperature coefficient”: the hotter it gets, the lower its resistance. A circuit reads that resistance to know the temperature, like a car engine sensor or a charger’s overheat protection.'),
      }),
      learned: [
        L('الثرمستور NTC: مقاومته تقل كلما ارتفعت الحرارة.', 'NTC thermistor: its resistance drops as temperature rises.'),
        L('يوجد نوع PTC بالعكس: مقاومته تزيد مع الحرارة.', 'A PTC is the opposite: its resistance rises with temperature.'),
        L('افحص الحساس بقياس مقاومته في حرارتين مختلفتين: إذا لم تتغير القراءة فهو تالف.', 'Test a sensor by measuring it at two temperatures: if the reading does not change, it is faulty.'),
      ],
    },

    // ───────────────────────────── المرحّل
    {
      id: 'relay', icon: 'RLY',
      title: L('المرحّل (الريليه)', 'The Relay'),
      brief: L('مرحّل سيارة 12V: ملف صغير يحرّك مفتاحاً داخلياً يتحكم في دائرة كبيرة. افحص الملف ونقاط التلامس، ثم شغّل الملف ولاحظ ما يتغير.', 'A 12V car relay: a small coil moves an internal switch that controls a big circuit. Test the coil and the contacts, then energise the coil and see what changes.'),
      skills: [L('المقاومة Ω', 'Resistance Ω'), L('الاستمرارية', 'Continuity'), L('المفاتيح الكهربائية', 'Electrical switches')],
      warn: L('افحص مقاومة الملف والمرحّل مطفأ: القياس والملف يعمل يعطي قراءة خاطئة.', 'Measure the coil resistance with the relay off: measuring while it is energised gives a wrong reading.'),
      setup() {
        return { w: 680, h: 400, parts: [{ type: 'relay', id: 'RL', x: 60, y: 110, on: false, label: tr('مرحّل سيارة', 'Car relay') }], data: {} };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى Ω على النطاق 200', 'Set Ω on the 200 range'), hint: L('مقاومة ملف المرحّل عادة بين 50 و120Ω.', 'A relay coil is usually 50–120Ω.'), check: s => s.mode === 'OHM' },
        { text: L('قِس مقاومة الملف بين الطرفين 85 و86', 'Measure the coil between pins 85 and 86'), hint: L('الملف مطفأ الآن، وهذا صحيح لقياس المقاومة.', 'The coil is off now, which is right for measuring resistance.'), check: (s, sc) => {
          const ok = s.mode === 'OHM' && onTerms(s, 'RL:85', 'RL:86') && valid(s) && !sc.parts[0].on;
          if (ok) sc.data.coil = s.value;
          return ok;
        } },
        { text: L('على الاستمرارية •))): افحص بين 30 و87a والملف مطفأ', 'On continuity •))): test between 30 and 87a with the coil off'), hint: L('87a نقطة «مغلقة عادة» (NC): متصلة بـ30 والمرحّل مطفأ.', '87a is “normally closed” (NC): connected to 30 while the relay is off.'), check: (s, sc) => s.mode === 'CONT' && onTerms(s, 'RL:30', 'RL:87a') && !sc.parts[0].on && !s.ol && !s.garbage },
        { text: L('شغّل الملف بالزر، ثم افحص بين 30 و87', 'Energise the coil with the button, then test between 30 and 87'), hint: L('عند تشغيل الملف يسحب الذراع إلى 87: نقطة «مفتوحة عادة» (NO).', 'Energising the coil pulls the arm to 87: the “normally open” (NO) contact.'), check: (s, sc) => s.mode === 'CONT' && onTerms(s, 'RL:30', 'RL:87') && sc.parts[0].on && !s.ol && !s.garbage },
      ],
      question: () => ({
        text: tr('ما فائدة المرحّل في السيارة؟', 'What is a relay for in a car?'),
        choices: ch([[tr('تيار صغير من مفتاح التحكم يشغّل دائرة كبيرة منفصلة', 'A small current from a control switch turns on a separate big circuit'), true], [tr('يرفع جهد البطارية', 'It raises the battery voltage'), false], [tr('يخزّن الكهرباء مثل المكثف', 'It stores charge like a capacitor'), false], [tr('يقيس التيار', 'It measures current'), false]]),
        why: tr('مفتاح الأضواء في السيارة يمرّر تياراً صغيراً في ملف المرحّل فقط، والمرحّل بدوره يوصل التيار الكبير للأضواء أو المروحة عبر 30 و87. هكذا تبقى أسلاك المفاتيح رفيعة وآمنة.', 'The light switch only drives a small current through the relay coil; the relay then connects the big current to the lights or fan through 30 and 87. That keeps switch wiring thin and safe.'),
      }),
      learned: [
        L('المرحّل = ملف (85، 86) + مفتاح (30 مشترك، 87 مفتوح عادة، 87a مغلق عادة).', 'A relay = a coil (85, 86) + a switch (30 common, 87 normally open, 87a normally closed).'),
        L('ملف سليم: عشرات الأوم. OL على الملف = ملف مقطوع.', 'A healthy coil reads tens of ohms. OL on the coil = broken coil.'),
        L('افحص نقاط التلامس بالاستمرارية في الحالتين: مطفأ وعامل.', 'Test the contacts on continuity in both states: off and energised.'),
      ],
    },

    // ───────────────────────────── السيارة
    {
      id: 'car', icon: '12V',
      title: L('بطارية السيارة', 'Car Battery'),
      brief: L('السيارة تتعب في التشغيل. قِس جهد البطارية والمحرك متوقف ثم وهو يعمل، وحدد أين المشكلة.', 'The car struggles to start. Measure the battery with the engine off, then running, and find the problem.'),
      skills: [L('الجهد المستمر', 'DC voltage'), L('تشخيص نظام الشحن', 'Charging-system diagnosis')],
      setup() {
        const state = pick(['ok', 'weak', 'alt']);
        return { parts: [{ type: 'carBattery', id: 'CAR', x: 60, y: 150, engine: false, emf: state === 'weak' ? rnd(11.9, 12.1) : rnd(12.55, 12.7), alt: rnd(14.1, 14.4), altOk: state !== 'alt' }], data: { state } };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى V⎓ على النطاق 20', 'Turn the dial to V⎓, range 20'), hint: L('جهد السيارة 12–15V، فالنطاق 20 هو الأنسب.', 'A car runs at 12–15V, so 20 is the right range.'), check: s => s.posId === 'v20' },
        { text: L('والمحرك متوقف: قِس جهد البطارية (الأحمر على +)', 'Engine off: measure the battery (red on +)'), hint: L('القطب الموجب عليه الغطاء الأحمر.', 'The positive post has the red cover.'), check: (s, sc) => { const p = sc.parts[0]; const ok = s.mode === 'VDC' && on(s, 'CAR') && valid(s) && !p.engine && Math.abs(s.value) > 5; if (ok) sc.data.off = Math.abs(s.value); return ok; } },
        { text: L('اضغط «شغّل المحرك» وقِس مرة أخرى', 'Press "Start engine" and measure again'), hint: L('الدينامو (المولّد) يجب أن يرفع الجهد وهو يشحن البطارية.', 'The alternator should raise the voltage while charging.'), check: (s, sc) => { const p = sc.parts[0]; const ok = s.mode === 'VDC' && on(s, 'CAR') && valid(s) && p.engine && Math.abs(s.value) > 5; if (ok) sc.data.on = Math.abs(s.value); return ok; } },
      ],
      question: sc => ({
        text: tr(`القراءة والمحرك متوقف ≈ ${(sc.data.off || 0).toFixed(2)}V، وهو يعمل ≈ ${(sc.data.on || 0).toFixed(2)}V. ما التشخيص؟`, `Engine off ≈ ${(sc.data.off || 0).toFixed(2)}V, running ≈ ${(sc.data.on || 0).toFixed(2)}V. What's the diagnosis?`),
        choices: [['ok', tr('البطارية والدينامو سليمان', 'Battery and alternator are fine')], ['weak', tr('البطارية ضعيفة والدينامو سليم', 'Weak battery, alternator fine')], ['alt', tr('الدينامو لا يشحن البطارية', 'The alternator is not charging')]].map(([k, label]) => ({ label, ok: k === sc.data.state })),
        why: {
          ok: tr('البطارية المشحونة تعطي ~12.6V والمحرك متوقف، ومع التشغيل يرتفع الجهد إلى 13.8–14.7V لأن الدينامو يشحنها. كل شيء سليم.', 'A charged battery reads ~12.6V engine off; running it rises to 13.8–14.7V as the alternator charges it. All good.'),
          weak: tr('الجهد والمحرك متوقف أقل من 12.2V، أي أن البطارية ضعيفة. ومع التشغيل ارتفع إلى ~14V، فالدينامو يعمل جيداً.', 'Below 12.2V engine off means a weak battery. Running it rose to ~14V, so the alternator is fine.'),
          alt: tr('البطارية جيدة (~12.6V)، لكن مع تشغيل المحرك لم يرتفع الجهد بل انخفض. أي أن الدينامو لا يشحن، وستفرغ البطارية قريباً.', 'The battery is good (~12.6V) but the voltage dropped instead of rising with the engine on: the alternator is not charging and the battery will go flat.'),
        }[sc.data.state],
      }),
      learned: [
        L('بطارية السيارة المشحونة: ~12.6V. تحت 12.2V تعتبر ضعيفة.', 'A charged car battery: ~12.6V. Below 12.2V it is weak.'),
        L('مع تشغيل المحرك يجب أن يكون الجهد 13.8–14.7V (الدينامو يشحن).', 'With the engine running expect 13.8–14.7V (alternator charging).'),
        L('نفس القياس البسيط يميّز بين عطل البطارية وعطل نظام الشحن.', 'The same simple test tells a battery fault from a charging fault.'),
      ],
    },

    // ───────────────────────────── التناظري
    {
      id: 'analog', icon: '◜', meter: 'analog',
      title: L('اقرأ الإبرة', 'Read the Needle'),
      brief: L('هذه المرة معك جهاز تناظري بإبرة. تعلّم كيف تختار التدريج الصحيح وتقرأ القيمة.', 'This time you have an analog meter with a needle. Learn to pick the right scale and read it.'),
      skills: [L('الجهاز التناظري', 'Analog meter'), L('قراءة التدريج', 'Reading scales')],
      warn: L('إذا عكست المجسين ترتد الإبرة إلى اليسار، وإذا كان النطاق صغيراً تضرب الإبرة النهاية. الاثنان يضرّان الجهاز الحقيقي.', 'Reversed probes kick the needle left; too small a range slams it right. Both harm a real meter.'),
      setup() {
        return { parts: [{ type: 'battery9', id: 'B9', x: 120, y: 110, emf: rnd(8.4, 9.5), r: 1.5, label: '9V' }, { type: 'aaPack', id: 'AA', x: 330, y: 150, emf: rnd(2.8, 3.15), r: 0.3, label: tr('بطاريتان AA', '2×AA') }], data: {} };
      },
      tasks: [
        { text: L('لفّ المفتاح إلى DCV على النطاق 10', 'Turn the dial to DCV, range 10'), hint: L('منطقة DCV أعلى يمين المفتاح. النطاق 10 يعني أن نهاية التدريج = 10V.', 'DCV is at the top right of the dial. Range 10 means full scale = 10V.'), check: s => s.posId === 'v10' },
        { text: L('قِس البطارية 9V: الأحمر على (+) والأسود على (−)', 'Measure the 9V battery: red on (+), black on (−)'), hint: L('انتظر حتى تستقر الإبرة، ثم اقرأ الصف الأول من الأرقام (0–10).', 'Wait for the needle to settle, then read the first row of numbers (0–10).'), check: (s, sc) => { const ok = s.mode === 'VDC' && on(s, 'B9') && s.value > 3 && !s.ol; if (ok) sc.data.v = s.value; return ok; } },
        { text: L('قِس حامل البطاريتين بنفس النطاق', 'Measure the AA pack on the same range'), hint: L('الإبرة ستقف عند حوالي ثلث التدريج.', 'The needle will stop around a third of the scale.'), check: s => s.mode === 'VDC' && on(s, 'AA') && s.value > 1 && !s.ol },
      ],
      question: sc => {
        const v = sc.data.v || 9;
        return {
          text: tr('على النطاق 10V، كم كان جهد البطارية 9V كما تقرؤه من الإبرة؟', 'On the 10V range, what did the needle show for the 9V battery?'),
          choices: ch([[v.toFixed(1) + 'V', true], [(v * 5).toFixed(0) + 'V', false], [(v * 25).toFixed(0) + 'V', false], [(v / 10).toFixed(2) + 'V', false]]),
          why: tr(`على نطاق 10V نقرأ صف الأرقام 0–10 مباشرة، فالإبرة كانت عند ≈ ${v.toFixed(1)}. لو قرأت صف 50 أو 250 بالخطأ لحصلت على قيمة أكبر بـ 5 أو 25 مرة.`, `On the 10V range you read the 0–10 row directly, so the needle was at ≈ ${v.toFixed(1)}. Reading the 50 or 250 row by mistake gives 5× or 25× too much.`),
        };
      },
      learned: [
        L('في الجهاز التناظري: اختر النطاق، ثم اقرأ صف الأرقام المناسب له، واضرب أو اقسم إذا لزم.', 'On an analog meter: pick the range, read the matching row, then multiply or divide if needed.'),
        L('تدريج Ω معكوس: الصفر يمين و ∞ يسار، وغير منتظم.', 'The Ω scale runs backwards: 0 on the right, ∞ on the left, and it is not linear.'),
        L('في وضع Ω التناظري يكون المجس الأسود هو الموجب (من البطارية الداخلية).', 'On analog Ω the black probe is positive (from the internal battery).'),
        L('الجهاز الرقمي أدق وأسهل، والتناظري أفضل لرؤية التغيّر المستمر.', 'Digital is more precise and easier; analog is better for watching a value change.'),
      ],
    },

    // ───────────────────────────── الكشاف
    {
      id: 'flashlight', icon: '🔦',
      title: L('الكشّاف المعطّل', 'The Dead Flashlight'),
      brief: L('كشّاف لا يضيء، وفكّكناه إلى أجزائه. افحص كل جزء بالطريقة الصحيحة واكتشف سبب العطل.', "A flashlight won't light, so we took it apart. Test each part the right way and find the fault."),
      skills: [L('التشخيص', 'Troubleshooting'), L('كل أوضاع القياس', 'All measuring modes')],
      setup() {
        const fault = pick(['battery', 'lamp', 'switch', 'cable']);
        return {
          parts: [
            { type: 'aaPack', id: 'P', x: 80, y: 60, label: tr('بطاريتان AA', '2×AA'), emf: fault === 'battery' ? rnd(1.3, 1.9) : rnd(3.0, 3.2), r: fault === 'battery' ? 30 : 0.3 },
            { type: 'lamp', id: 'LMP', cx: 490, cy: 90, R: 8, Irated: 0.3, label: tr('مصباح الكشّاف', 'Flashlight bulb'), broken: fault === 'lamp' },
            { type: 'switch', id: 'SW', x: 90, y: 300, on: false, broken: fault === 'switch', label: tr('المفتاح', 'Switch') },
            { type: 'cable', id: 'W', x: 330, y: 320, w: 250, color: '#d8453b', label: tr('سلك التوصيل', 'Hookup wire'), broken: fault === 'cable' },
          ],
          data: { fault },
        };
      },
      tasks: [
        { text: L('افحص البطاريات بالجهد المستمر V⎓', 'Check the batteries on V⎓'), hint: L('بطاريتان AA على التوالي = 3V تقريباً.', 'Two AA cells in series ≈ 3V.'), check: s => s.mode === 'VDC' && on(s, 'P') && valid(s) && Math.abs(s.value) > 0.2 },
        { text: L('افحص المصباح بالاستمرارية •))) أو Ω', 'Check the bulb with continuity •))) or Ω'), hint: L('فتيل المصباح السليم مقاومته صغيرة. المحروق يعطي OL.', 'A good filament has low resistance. A burnt one shows OL.'), check: s => (s.mode === 'CONT' || s.mode === 'OHM') && on(s, 'LMP') && !s.garbage },
        { text: L('شغّل المفتاح (اضغط عليه) ثم افحصه بالاستمرارية', 'Turn the switch ON (tap it), then test it for continuity'), hint: L('المفتاح على ON يجب أن يصفّر. إذا لم يصفّر فهو تالف.', 'An ON switch should beep. If not, it is faulty.'), check: (s, sc) => (s.mode === 'CONT' || s.mode === 'OHM') && on(s, 'SW') && sc.parts.find(p => p.id === 'SW').on && !s.garbage },
        { text: L('افحص سلك التوصيل بالاستمرارية', 'Test the hookup wire for continuity'), hint: L('مجس على كل طرف من السلك.', 'One probe on each end of the wire.'), check: s => (s.mode === 'CONT' || s.mode === 'OHM') && on(s, 'W') && !s.garbage },
      ],
      question: sc => ({
        text: tr('ما سبب عطل الكشّاف؟', "What's wrong with the flashlight?"),
        choices: [['battery', tr('البطاريات ضعيفة', 'Weak batteries')], ['lamp', tr('المصباح محروق', 'Burnt bulb')], ['switch', tr('المفتاح تالف', 'Faulty switch')], ['cable', tr('السلك مقطوع', 'Broken wire')]].map(([k, l]) => ({ label: l, ok: k === sc.data.fault })),
        why: {
          battery: tr('البطاريات أعطت جهداً أقل بكثير من 3V، وباقي الأجزاء صفّرت بشكل طبيعي.', 'The batteries read far below 3V, while every other part beeped normally.'),
          lamp: tr('المصباح أعطى OL، أي أن الفتيل مقطوع (محروق). باقي الأجزاء سليمة.', 'The bulb showed OL: the filament is broken (burnt). Everything else is fine.'),
          switch: tr('المفتاح لم يصفّر حتى وهو على ON، أي أن نقاط التلامس داخله تالفة.', "The switch didn't beep even when ON: its contacts are bad."),
          cable: tr('السلك أعطى OL، أي أنه مقطوع من الداخل رغم أن شكله سليم.', 'The wire showed OL: it is broken inside even though it looks fine.'),
        }[sc.data.fault],
      }),
      learned: [
        L('التشخيص يعني فحص كل جزء على حدة بالوضع المناسب له.', 'Troubleshooting means testing each part on its own, in the right mode.'),
        L('المصدر يُفحص بالجهد، والموصلات (أسلاك، مفاتيح، فتائل) تُفحص بالاستمرارية.', 'Check sources with voltage; check conductors (wires, switches, filaments) with continuity.'),
        L('افصل المصدر قبل فحص الاستمرارية أو المقاومة.', 'Disconnect power before testing continuity or resistance.'),
      ],
    },
  ];

  const FREE = {
    id: 'free', icon: '⚙', tasks: [],
    title: L('المختبر الحر', 'Free Lab'),
    brief: L('كل العناصر أمامك بدون مهام. جرّب كل الأوضاع، وأخطئ بحرية، وراقب ماذا يحدث.', 'Every part, no tasks. Try every mode, make mistakes freely and watch what happens.'),
    skills: [L('تجربة حرة', 'Free play')],
    setup() {
      return {
        h: 440,
        parts: [
          { type: 'battery9', id: 'B9', x: 40, y: 50, emf: 9.45, r: 1.5, label: '9V' },
          { type: 'aaPack', id: 'AA', x: 210, y: 40, emf: 3.1, r: 0.3, label: tr('بطاريتان AA', '2×AA') },
          { type: 'resistor', id: 'R1', x: 400, y: 160, nominal: 1000, actual: 1004, label: '1kΩ' },
          { type: 'resistor', id: 'R2', x: 400, y: 260, nominal: 47000, actual: 46600, label: '47kΩ' },
          { type: 'led', id: 'LED', cx: 110, cy: 262, anode: 'L' },
          { type: 'diode', id: 'D1', x: 200, y: 385, label: '1N4007' },
          { type: 'switch', id: 'SW', x: 215, y: 215, on: false, label: tr('مفتاح', 'Switch') },
          { type: 'cable', id: 'W', x: 445, y: 370, w: 170, color: '#2f6fd6', label: tr('سلك', 'Wire') },
        ],
        data: {},
      };
    },
  };

  MISSIONS.forEach((m, i) => { m.num = i + 1; });
  FREE.num = 0;

  window.Missions = {
    list: MISSIONS, free: FREE,
    byId: id => (id === 'free' ? FREE : id === 'build' && window.Builder ? Builder.MISSION : MISSIONS.find(m => m.id === id)),
  };
})();
