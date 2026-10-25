(function () {
  'use strict';
  const FILES = { startup: 'sounds/startup.mp3', logout: 'sounds/logout.mp3' };
  let ctx = null;
  const audio = () => ctx || (ctx = new (window.AudioContext || window.webkitAudioContext)());
  const level = () => (OS.settings.muted ? 0 : OS.settings.volume / 100);

  function tone(ac, v, { freq, type = 'sine', start = 0, dur = 0.15, gain = 0.35, to }) {
    const t = ac.currentTime + start;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain * v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(ac, v, { dur, filter = 'bandpass', from = 1500, to = from, q = 1, gain = 0.5, crackle = false }) {
    const len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.pow(1 - i / len, 2);
      d[i] = (Math.random() * 2 - 1) * env * (crackle ? (Math.random() < 0.15 ? 1 : 0.25) : 1);
    }
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime;
    src.buffer = buf;
    f.type = filter;
    f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.value = gain * v;
    src.connect(f).connect(g).connect(ac.destination);
    src.start();
  }

  const SYNTH = {
    alert: (ac, v) => { tone(ac, v, { freq: 880, type: 'triangle', dur: 0.12 }); tone(ac, v, { freq: 660, type: 'triangle', start: 0.11, dur: 0.18 }); },
    error: (ac, v) => tone(ac, v, { freq: 220, type: 'square', dur: 0.22, gain: 0.18 }),
    pop: (ac, v) => tone(ac, v, { freq: 700, to: 420, dur: 0.07, gain: 0.4 }),
    click: (ac, v) => tone(ac, v, { freq: 1800, to: 1200, dur: 0.03, gain: 0.15 }),
    minimize: (ac, v) => noise(ac, v, { dur: 0.3, filter: 'lowpass', from: 4000, to: 300, gain: 0.35 }),
    trash: (ac, v) => noise(ac, v, { dur: 0.55, from: 2500, to: 900, q: 0.7, gain: 0.9, crackle: true }),
    test: (ac, v) => tone(ac, v, { freq: 880, dur: 0.4, gain: 0.3 })
  };

  OS.sound = {
    play(name) {
      const v = level();
      if (!v) return Promise.resolve();
      if (FILES[name]) {
        if (!OS.settings.sysSounds) return Promise.resolve();
        const a = new Audio(FILES[name]);
        a.volume = v;
        return a.play()
          .then(() => new Promise(done => { a.onended = done; setTimeout(done, 6000); }))
          .catch(() => {
            const t0 = Date.now();
            const retry = () => {
              document.removeEventListener('pointerdown', retry, true);
              document.removeEventListener('keydown', retry, true);
              if (Date.now() - t0 < 10000) { a.currentTime = 0; a.play().catch(() => {}); }
            };
            document.addEventListener('pointerdown', retry, true);
            document.addEventListener('keydown', retry, true);
          });
      }
      if (!OS.settings.uiSounds || !SYNTH[name]) return Promise.resolve();
      try {
        const ac = audio();
        if (ac.state === 'suspended') ac.resume();
        SYNTH[name](ac, v);
      } catch (e) {}
      return Promise.resolve();
    }
  };
})();
