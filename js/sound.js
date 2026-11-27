/* sound.js — أصوات الجهاز (صفارة الاستمرارية، نقرة المفتاح، انفجار الفيوز) عبر Web Audio */
(function () {
  'use strict';
  let ctx = null, beepOsc = null, beepGain = null, muted = false;
  try { muted = localStorage.getItem('ml.muted') === '1'; } catch (e) { /* ignore */ }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol) {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.05, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  }

  const Sound = {
    unlock: ensure,
    click() { tone(1800, 0.03, 'square', 0.03); },
    ok() { tone(880, 0.12, 'sine', 0.08); setTimeout(() => tone(1320, 0.18, 'sine', 0.08), 110); },
    wrong() { tone(180, 0.25, 'sawtooth', 0.05); },
    pop() {
      if (muted) return;
      const c = ensure(); if (!c) return;
      const len = c.sampleRate * 0.35, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const s = c.createBufferSource(), g = c.createGain();
      g.gain.value = 0.35; s.buffer = buf; s.connect(g).connect(c.destination); s.start();
    },
    beep(on) {
      if (on && !muted) {
        if (beepOsc) return;
        const c = ensure(); if (!c) return;
        beepOsc = c.createOscillator(); beepGain = c.createGain();
        beepOsc.type = 'square'; beepOsc.frequency.value = 2700; beepGain.gain.value = 0.035;
        beepOsc.connect(beepGain).connect(c.destination); beepOsc.start();
      } else if (beepOsc) {
        try { beepOsc.stop(); } catch (e) { /* ignore */ }
        beepOsc = null;
      }
    },
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('ml.muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
      if (muted) Sound.beep(false);
      return muted;
    },
  };
  window.Sound = Sound;
})();
