/*
 * components.js — صفحة «القطع الإلكترونية»
 * لكل قطعة: شكلها، رمزها في المخططات، وظيفتها، كيف تتعرّف عليها،
 * كيف تفحصها بالجهاز وما القراءة المتوقعة، وأشهر أعطالها.
 * © 2026 ALKING TECH
 */
(function () {
  'use strict';
  const L = (ar, en) => ({ ar, en });
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lead = 'stroke="#b7bec6" stroke-width="3" stroke-linecap="round" fill="none"';

  // رسومات مبسّطة للشكل (120×80) ورموز المخططات (120×44)
  const LOOK = {
    resistor: `<path d="M6 40H34M86 40H114" ${lead}/><rect x="34" y="28" width="52" height="24" rx="11" fill="#dcc28e" stroke="#b49a6a"/><rect x="44" y="28" width="5" height="24" fill="#7a4a21"/><rect x="54" y="28" width="5" height="24" fill="#1b1b1b"/><rect x="64" y="28" width="5" height="24" fill="#d1352b"/><rect x="76" y="28" width="4" height="24" fill="#c9a13b"/>`,
    capacitor: `<path d="M50 62V78M70 62V74" ${lead}/><rect x="40" y="8" width="40" height="56" rx="8" fill="#2f5fb0"/><rect x="66" y="14" width="10" height="46" rx="3" fill="#c9d6e3"/><text x="71" y="42" text-anchor="middle" font-size="13" font-weight="800" fill="#1d3566">−</text>`,
    diode: `<path d="M6 40H38M82 40H114" ${lead}/><rect x="38" y="30" width="44" height="20" rx="4" fill="#202225"/><rect x="72" y="30" width="6" height="20" fill="#c9ced4"/>`,
    led: `<path d="M52 56V78M68 56V72" ${lead}/><path d="M44 56V30a16 16 0 0 1 32 0v26z" fill="#d8323a" opacity=".9"/><rect x="40" y="54" width="40" height="6" rx="2" fill="#c42a32"/>`,
    transistor: `<path d="M44 52V78M60 52V78M76 52V78" ${lead}/><path d="M38 54V22a22 22 0 0 1 44 0v32z" fill="#202225"/><rect x="38" y="22" width="44" height="32" fill="#2a2c30"/>`,
    pot: `<path d="M36 56V78M60 56V78M84 56V78" ${lead}/><rect x="24" y="10" width="72" height="48" rx="8" fill="#2f5aa8"/><circle cx="60" cy="34" r="16" fill="#1c1f22"/><rect x="58" y="20" width="4" height="12" rx="2" fill="#fff"/>`,
    ldr: `<path d="M52 52V78M68 52V78" ${lead}/><circle cx="60" cy="34" r="20" fill="#d9c08a" stroke="#a88d55"/><path d="M46 26h28M46 34h28M46 42h28M74 26v8M46 34v8" stroke="#c0392b" stroke-width="2.5" fill="none"/>`,
    fuse: `<path d="M4 40H28M92 40H116" ${lead}/><rect x="28" y="30" width="12" height="20" rx="3" fill="#c9ced4"/><rect x="80" y="30" width="12" height="20" rx="3" fill="#c9ced4"/><rect x="40" y="32" width="40" height="16" rx="3" fill="rgba(220,235,245,.2)" stroke="rgba(220,235,245,.6)"/><path d="M40 40H80" stroke="#c9ced4" stroke-width="1.5"/>`,
    lamp: `<path d="M52 66V78M68 66V78" ${lead}/><circle cx="60" cy="28" r="20" fill="rgba(255,243,176,.35)" stroke="rgba(235,244,248,.8)" stroke-width="2"/><rect x="50" y="46" width="20" height="20" rx="3" fill="#b7bec6"/><path d="M54 30l3-5 3 5 3-5 3 5" stroke="#e9b949" stroke-width="2" fill="none"/>`,
    switch: `<path d="M6 46H32M88 46H114" ${lead}/><rect x="30" y="34" width="60" height="24" rx="6" fill="#2c3035"/><circle cx="44" cy="46" r="4" fill="#c9ced4"/><circle cx="76" cy="46" r="4" fill="#c9ced4"/><path d="M44 46L74 28" stroke="#e9c46a" stroke-width="4" stroke-linecap="round"/>`,
    ntc: `<path d="M54 50V78M66 50V78" ${lead}/><ellipse cx="60" cy="34" rx="15" ry="18" fill="#2b5fa8" stroke="#163a6e" stroke-width="2"/><text x="60" y="38" text-anchor="middle" font-size="8" font-weight="700" fill="#e6efff">10k</text>`,
    relay: `<path d="M30 62V78M46 62V78M62 62V78M78 62V78M94 62V78" ${lead}/><rect x="22" y="8" width="80" height="56" rx="6" fill="#26292e" stroke="#5b616a"/><rect x="30" y="18" width="24" height="36" rx="4" fill="#b9772f"/><path d="M66 46L88 26" stroke="#e6ebef" stroke-width="3" stroke-linecap="round"/><circle cx="66" cy="46" r="3" fill="#e6ebef"/><circle cx="90" cy="24" r="3" fill="#d9b24a"/>`,
    battery: `<rect x="38" y="16" width="44" height="58" rx="6" fill="#f59a2c"/><rect x="38" y="16" width="44" height="14" rx="5" fill="#1d1f22"/><rect x="46" y="6" width="10" height="10" rx="2" fill="#c7cbd1"/><rect x="64" y="6" width="12" height="10" rx="2" fill="#c7cbd1"/><text x="60" y="58" text-anchor="middle" font-size="14" font-weight="800" fill="#1d1f22">9V</text>`,
  };
  const s = 'stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const SYM = {
    resistor: `<path d="M6 22H30l4-8 8 16 8-16 8 16 8-16 8 16 8-16 4 8h24" ${s}/>`,
    capacitor: `<path d="M6 22H52M68 22H114M52 8V36" ${s}/><path d="M68 8q-6 14 0 28" ${s}/><text x="42" y="12" font-size="11" fill="currentColor">+</text>`,
    diode: `<path d="M6 22H46M74 22H114M46 8V36L74 22Z M74 8V36" ${s}/>`,
    led: `<path d="M6 22H46M74 22H114M46 8V36L74 22Z M74 8V36M62 6l8-6M70 10l8-6" ${s}/>`,
    transistor: `<circle cx="64" cy="22" r="18" ${s}/><path d="M24 22H54M54 10V34M54 16L74 6M54 28L74 38M68 36l6 2-2-6" ${s}/><text x="18" y="18" font-size="10" fill="currentColor">B</text><text x="80" y="8" font-size="10" fill="currentColor">C</text><text x="80" y="42" font-size="10" fill="currentColor">E</text>`,
    pot: `<path d="M6 30H30l4-8 8 16 8-16 8 16 8-16 8 16 8-16 4 8h24M60 4V18M55 13l5 6 5-6" ${s}/>`,
    ldr: `<rect x="36" y="14" width="48" height="16" rx="2" ${s}/><path d="M6 22H36M84 22H114M40 2l8 9M52 2l8 9" ${s}/>`,
    fuse: `<rect x="34" y="14" width="52" height="16" rx="2" ${s}/><path d="M6 22H114" ${s}/>`,
    lamp: `<circle cx="60" cy="22" r="14" ${s}/><path d="M6 22H46M74 22H114M50 12l20 20M70 12L50 32" ${s}/>`,
    switch: `<path d="M6 30H40M80 30H114M40 30L76 12" ${s}/><circle cx="40" cy="30" r="3" fill="currentColor"/><circle cx="80" cy="30" r="3" fill="currentColor"/>`,
    ntc: `<rect x="36" y="14" width="48" height="16" rx="2" ${s}/><path d="M6 22H36M84 22H114M32 38L88 6M88 6h-10" ${s}/><text x="90" y="40" font-size="10" fill="currentColor">−t°</text>`,
    relay: `<rect x="8" y="10" width="26" height="24" ${s}/><path d="M8 22H2M34 22H40M14 16l14 12" ${s}/><path d="M60 34H74L100 18M100 10H118M100 34H118M74 34" ${s}/><path d="M21 10V4H86V14" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" fill="none"/>`,
    battery: `<path d="M6 22H52M68 22H114M52 6V38M60 14V30M68 6V38M76 14V30" ${s}/><text x="44" y="10" font-size="10" fill="currentColor">+</text>`,
  };

  const PARTS = [
    { id: 'resistor', name: L('المقاومة', 'Resistor'), mode: 'Ω', mission: 'resistors',
      what: L('تحدّ من التيار المار في الدائرة وتقسّم الجهد.', 'Limits the current in a circuit and divides voltage.'),
      know: L('أسطوانة صغيرة بحلقات ألوان تدل على قيمتها، وطرفان متماثلان (لا قطبية لها).', 'A small cylinder with color bands giving its value; two identical legs (no polarity).'),
      test: L('افصل الكهرباء، ضع Ω على نطاق أكبر من قيمتها، والمجسان على الطرفين بأي اتجاه.', 'Power off, set Ω to a range above its value, probes on both legs either way.'),
      expect: L('قيمة قريبة من ألوانها (±5% للحلقة الذهبية).', 'Close to its color value (±5% for a gold band).'),
      fault: L('OL = مقطوعة. قيمة بعيدة جداً = تالفة من السخونة.', 'OL = open. Far off = heat-damaged.') },
    { id: 'capacitor', name: L('المكثف', 'Capacitor'), mode: 'Ω / V⎓', mission: 'capacitor',
      what: L('يخزّن الشحنة الكهربائية ويطلقها؛ ينعّم الجهد ويمرّر الإشارات المتغيّرة.', 'Stores and releases charge; smooths voltage and passes changing signals.'),
      know: L('الإلكتروليتي أسطوانة عليها السعة (µF) والجهد، وشريط يدل على الطرف السالب. السيراميكي قرص صغير بلا قطبية.', 'Electrolytic: a can marked with capacitance (µF) and voltage, with a stripe on the negative leg. Ceramic: a small disc, no polarity.'),
      test: L('أولاً قِس جهده وفرّغه. ثم Ω: الأحمر على (+).', 'First measure its voltage and discharge it. Then Ω: red on (+).'),
      expect: L('القراءة تصعد تدريجياً حتى OL (الجهاز يشحنه).', 'The reading climbs steadily to OL (the meter is charging it).'),
      fault: L('صفر ثابت = مقصور. OL فوراً (في المكثف الكبير) = مقطوع. انتفاخ أعلاه = تالف.', 'Stuck at zero = shorted. Instant OL (large cap) = open. Bulging top = failed.') },
    { id: 'diode', name: L('الدايود', 'Diode'), mode: '▶|', mission: 'led',
      what: L('يسمح بمرور التيار في اتجاه واحد فقط؛ يُستخدم لتحويل AC إلى DC وللحماية.', 'Lets current flow one way only; used to turn AC into DC and for protection.'),
      know: L('جسم أسود صغير، والحلقة الفضية تدل على الكاثود (السالب).', 'A small black body; the silver band marks the cathode (negative).'),
      test: L('وضع ▶|: الأحمر على الطرف بدون حلقة، ثم اعكس.', 'Diode mode: red on the end without the band, then swap.'),
      expect: L('~0.6V في اتجاه، وOL في الاتجاه الآخر.', '~0.6V one way, OL the other.'),
      fault: L('قراءة في الاتجاهين = مقصور. OL في الاتجاهين = مقطوع.', 'Reading both ways = shorted. OL both ways = open.') },
    { id: 'led', name: L('الثنائي الباعث للضوء LED', 'LED'), mode: '▶|', mission: 'led',
      what: L('دايود يضيء عند مرور التيار فيه. يحتاج دائماً مقاومة حماية.', 'A diode that lights up when current flows. Always needs a series resistor.'),
      know: L('الرجل الأطول هي الموجب (الأنود)، والجانب المسطّح من الحافة هو السالب.', 'The longer leg is positive (anode); the flat edge of the rim is negative.'),
      test: L('وضع ▶|: الأحمر على الأنود.', 'Diode mode: red on the anode.'),
      expect: L('1.6–2.2V حسب اللون، وقد يضيء قليلاً. بالعكس OL.', '1.6–2.2V depending on color, and it may glow faintly. Reversed: OL.'),
      fault: L('OL في الاتجاهين = محترق.', 'OL both ways = burnt out.') },
    { id: 'transistor', name: L('الترانزستور', 'Transistor'), mode: '▶|', mission: 'transistor',
      what: L('مفتاح أو مكبّر إلكتروني: تيار صغير في القاعدة يتحكم بتيار كبير بين المجمّع والباعث.', 'An electronic switch or amplifier: a small base current controls a large collector–emitter current.'),
      know: L('ثلاث أرجل (B، C، E) وجسم أسود بوجه مسطّح عليه رقم مثل BC547.', 'Three legs (B, C, E) and a black body with a flat face printed with a code like BC547.'),
      test: L('وضع ▶|: ابحث عن الرجل التي تعطي قراءة مع الرجلين الأخريين.', 'Diode mode: find the leg that reads against both others.'),
      expect: L('~0.6V من القاعدة لكل من C و E، وOL بين C و E.', '~0.6V from base to C and to E; OL between C and E.'),
      fault: L('أي قراءة بين C و E = تالف.', 'Any reading between C and E = damaged.') },
    { id: 'pot', name: L('المقاومة المتغيّرة', 'Potentiometer'), mode: 'Ω', mission: 'sensors',
      what: L('مقاومة نغيّر قيمتها بمقبض؛ مثل زر الصوت والإضاءة.', 'A resistor you adjust with a knob, like a volume or dimmer control.'),
      know: L('ثلاث أرجل ومقبض دوّار، ومكتوب عليها القيمة الكلية (مثل 10k).', 'Three legs and a rotating knob, marked with its total value (e.g. 10k).'),
      test: L('Ω بين الطرفين الخارجيين، ثم بين الطرف الأوسط وأحدهما مع لفّ المقبض.', 'Ω across the outer legs, then middle-to-one-end while turning the knob.'),
      expect: L('الطرفان الخارجيان: قيمة ثابتة. الأوسط: يتغير بسلاسة.', 'Outer legs: fixed. Middle: changes smoothly.'),
      fault: L('قفزات أو OL أثناء اللف = المسار تالف (يسبب «خشخشة» في الصوت).', 'Jumps or OL while turning = worn track (crackling in audio).') },
    { id: 'ldr', name: L('المقاومة الضوئية LDR', 'Light-dependent resistor'), mode: 'Ω', mission: 'sensors',
      what: L('حساس ضوء: تقل مقاومته مع الضوء وتزيد في الظلام.', 'A light sensor: resistance drops in light and rises in the dark.'),
      know: L('قرص صغير عليه خط متعرّج أحمر، وطرفان بلا قطبية.', 'A small disc with a red zig-zag track and two legs, no polarity.'),
      test: L('Ω في الضوء ثم غطِّه بيدك وقِس مجدداً.', 'Ω in light, then cover it and measure again.'),
      expect: L('~1kΩ في الضوء، ومئات الكيلو أوم في الظلام.', '~1kΩ in light, hundreds of kΩ in the dark.'),
      fault: L('قيمة لا تتغير مع الضوء = تالف.', 'Value not changing with light = faulty.') },
    { id: 'fuse', name: L('الفيوز', 'Fuse'), mode: '•)))', mission: 'flashlight',
      what: L('سلك رفيع يذوب إذا زاد التيار، فيحمي الجهاز من الاحتراق.', 'A thin wire that melts on overcurrent, protecting the device.'),
      know: L('أنبوب زجاجي بطرفين معدنيين، ومكتوب عليه التيار (مثل 2A).', 'A glass tube with metal caps, marked with its rating (e.g. 2A).'),
      test: L('افصله من الجهاز وضع الاستمرارية •))).', 'Remove it and use continuity •))).'),
      expect: L('صفارة (≈0Ω).', 'A beep (≈0Ω).'),
      fault: L('OL = محروق. استبدله بنفس القيمة، وابحث عن سبب احتراقه.', 'OL = blown. Replace with the same rating and find why it blew.') },
    { id: 'lamp', name: L('المصباح', 'Lamp'), mode: 'Ω', mission: 'current',
      what: L('فتيل يسخن حتى يتوهج عند مرور التيار.', 'A filament that heats up and glows when current flows.'),
      know: L('زجاجة فيها فتيل رفيع، ومكتوب على القاعدة الجهد (مثل 6V).', 'A glass bulb with a thin filament; the base shows its voltage (e.g. 6V).'),
      test: L('الاستمرارية أو Ω على أصغر نطاق.', 'Continuity or Ω on the lowest range.'),
      expect: L('مقاومة صغيرة (بضعة أوم، وتزيد عندما يسخن).', 'Low resistance (a few ohms; it rises when hot).'),
      fault: L('OL = الفتيل مقطوع.', 'OL = broken filament.') },
    { id: 'switch', name: L('المفتاح', 'Switch'), mode: '•)))', mission: 'flashlight',
      what: L('يفتح الدائرة أو يغلقها.', 'Opens or closes a circuit.'),
      know: L('ذراع أو زر بطرفين أو أكثر.', 'A lever or button with two or more terminals.'),
      test: L('الاستمرارية على طرفيه وهو ON ثم OFF.', 'Continuity across it in ON, then OFF.'),
      expect: L('ON: صفارة. OFF: OL.', 'ON: beep. OFF: OL.'),
      fault: L('لا يصفّر على ON = نقاط التلامس تالفة.', 'No beep on ON = worn contacts.') },
    { id: 'ntc', name: L('حساس حرارة NTC', 'NTC thermistor'), mode: 'Ω', mission: 'ntc',
      what: L('مقاومة تتغير مع الحرارة: كلما سخنت قلّت قيمتها. تستخدم لقياس الحرارة وحماية الأجهزة.', 'A resistor that changes with temperature: the hotter it gets, the lower its value. Used to sense heat and protect devices.'),
      know: L('حبة صغيرة غالباً سوداء أو زرقاء على طرفين، مكتوب عليها قيمتها عند 25°C مثل 10k.', 'A small black or blue bead on two legs, marked with its value at 25°C, such as 10k.'),
      test: L('Ω على طرفيه في حرارة الغرفة، ثم سخّنه قليلاً وقِس مرة أخرى.', 'Ω across it at room temperature, then warm it slightly and measure again.'),
      expect: L('قريب من القيمة المكتوبة عند 25°C، وتنخفض القراءة عند التسخين.', 'Close to its rated value at 25°C, and the reading drops when warmed.'),
      fault: L('القراءة لا تتغير مع الحرارة، أو OL = تالف.', 'The reading does not change with heat, or OL = faulty.') },
    { id: 'relay', name: L('المرحّل (ريليه)', 'Relay'), mode: 'Ω •)))', mission: 'relay',
      what: L('مفتاح يعمل بمغناطيس كهربائي: تيار صغير في الملف يحرّك نقاط تلامس تتحكم في تيار كبير.', 'A switch worked by an electromagnet: a small coil current moves contacts that control a large current.'),
      know: L('صندوق صغير بأطراف مرقّمة: 85 و86 للملف، و30 و87 و87a لنقاط التلامس.', 'A small box with numbered pins: 85 and 86 for the coil, 30, 87 and 87a for the contacts.'),
      test: L('Ω على الملف (85–86)، ثم الاستمرارية بين 30 و87a، وبين 30 و87 والملف يعمل.', 'Ω across the coil (85–86), then continuity 30–87a, and 30–87 with the coil energised.'),
      expect: L('الملف عشرات الأوم. مطفأ: 30–87a يصفّر. عامل: 30–87 يصفّر.', 'Coil: tens of ohms. Off: 30–87a beeps. On: 30–87 beeps.'),
      fault: L('OL على الملف = ملف مقطوع. لا صفارة على 87 والملف يعمل = نقاط محترقة.', 'OL on the coil = broken coil. No beep on 87 when on = burnt contacts.') },
    { id: 'battery', name: L('البطارية', 'Battery'), mode: 'V⎓', mission: 'battery',
      what: L('مصدر جهد مستمر يحوّل الطاقة الكيميائية إلى كهربائية.', 'A DC voltage source turning chemical energy into electricity.'),
      know: L('مكتوب عليها الجهد (1.5V، 9V، 12V) والقطب الموجب (+).', 'Marked with its voltage (1.5V, 9V, 12V) and the positive (+) terminal.'),
      test: L('V⎓ على نطاق أكبر من جهدها، الأحمر على (+).', 'V⎓ on a range above its voltage, red on (+).'),
      expect: L('الجهد المكتوب أو أكثر قليلاً إذا كانت جديدة.', 'Its rated voltage, or slightly more when new.'),
      fault: L('أقل بكثير من المكتوب = ضعيفة. لا تقسها أبداً على وضع A.', 'Well below rating = weak. Never measure it on A.') },
  ];

  function render(el) {
    const missionName = id => { const m = Missions.byId(id); return m ? T(m.title) : ''; };
    el.innerHTML = `
      <section class="laws-hero">
        <p class="eyebrow">${tr('مكتبة القطع', 'Parts library')}</p>
        <h1>${tr('القطع الإلكترونية', 'Electronic components')}</h1>
        <p class="lead-p">${tr('هذا مكثف، وهذا ترانزستور… لكل قطعة: شكلها، ورمزها في المخططات، وكيف تفحصها بالجهاز وماذا تتوقع أن تقرأ.', "This is a capacitor, that's a transistor… For each part: how it looks, its circuit symbol, how to test it and what reading to expect.")}</p>
      </section>
      <nav class="cmp-jump" aria-label="${tr('القطع', 'Parts')}">${PARTS.map(p => `<a href="#comp-${p.id}" data-jump="${p.id}">${esc(T(p.name))}</a>`).join('')}</nav>
      <div class="comp-grid">${PARTS.map(p => `
        <article class="comp" id="comp-${p.id}">
          <div class="comp-visual">
            <figure><svg viewBox="0 0 120 80" aria-hidden="true">${LOOK[p.id]}</svg><figcaption>${tr('الشكل', 'Looks like')}</figcaption></figure>
            <figure class="sym"><svg viewBox="0 0 120 44" aria-hidden="true">${SYM[p.id]}</svg><figcaption>${tr('الرمز', 'Symbol')}</figcaption></figure>
          </div>
          <div class="comp-head"><h3>${esc(T(p.name))}</h3><span class="mode-chip">${esc(p.mode)}</span></div>
          <p>${esc(T(p.what))}</p>
          <dl class="comp-dl">
            <dt>${icon('eye')} ${tr('كيف تعرفه', 'How to spot it')}</dt><dd>${esc(T(p.know))}</dd>
            <dt>${icon('target')} ${tr('كيف تفحصه', 'How to test it')}</dt><dd>${esc(T(p.test))}</dd>
            <dt>${icon('check')} ${tr('القراءة السليمة', 'Healthy reading')}</dt><dd>${esc(T(p.expect))}</dd>
            <dt>${icon('alert')} ${tr('الأعطال', 'Faults')}</dt><dd>${esc(T(p.fault))}</dd>
          </dl>
          <a class="btn small" href="#lab-${p.mission}">${icon('play')} ${tr('جرّبه في', 'Try it in')}: ${esc(missionName(p.mission))}</a>
        </article>`).join('')}</div>`;
    el.querySelectorAll('[data-jump]').forEach(a => a.onclick = e => {
      e.preventDefault();
      const t = el.querySelector('#comp-' + a.dataset.jump);
      if (t) { t.scrollIntoView({ behavior: UI.reduce() ? 'auto' : 'smooth', block: 'start' }); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); }
    });
  }

  // بطاقة مختصرة لقطعة (تُستخدم في مكتبة المكونات داخل المختبر)
  function info(id) {
    const p = PARTS.find(x => x.id === id);
    if (!p) return '';
    return `<article class="comp comp-modal">
      <div class="comp-visual">
        <figure><svg viewBox="0 0 120 80" aria-hidden="true">${LOOK[p.id]}</svg><figcaption>${tr('الشكل', 'Looks like')}</figcaption></figure>
        <figure class="sym"><svg viewBox="0 0 120 44" aria-hidden="true">${SYM[p.id]}</svg><figcaption>${tr('الرمز', 'Symbol')}</figcaption></figure>
      </div>
      <div class="comp-head"><h3>${esc(T(p.name))}</h3><span class="mode-chip">${esc(p.mode)}</span></div>
      <p>${esc(T(p.what))}</p>
      <dl class="comp-dl">
        <dt>${icon('target')} ${tr('كيف تفحصه', 'How to test it')}</dt><dd>${esc(T(p.test))}</dd>
        <dt>${icon('check')} ${tr('القراءة السليمة', 'Healthy reading')}</dt><dd>${esc(T(p.expect))}</dd>
        <dt>${icon('alert')} ${tr('الأعطال', 'Faults')}</dt><dd>${esc(T(p.fault))}</dd>
      </dl></article>`;
  }

  window.Components = { render, info, PARTS, LOOK, SYM };
})();
