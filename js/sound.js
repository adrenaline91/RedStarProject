(function () {
  'use strict';
  const KDE = 'sounds/kde/Oxygen-';
  const SOUNDS = {
    startup: { src: 'sounds/startup.mp3', system: true },
    logout: { src: 'sounds/logout.mp3', system: true },
    warning: { src: KDE + 'Sys-Warning.ogg' },
    question: { src: KDE + 'Sys-Question.ogg' },
    error: { src: KDE + 'Sys-App-Error.ogg' },
    message: { src: KDE + 'Sys-App-Message.ogg' },
    positive: { src: KDE + 'Sys-App-Positive.ogg' },
    trash: { src: KDE + 'Sys-Trash-Emptied.ogg' },
    minimize: { src: KDE + 'Window-Minimize.ogg' },
    maximize: { src: KDE + 'Window-Maximize.ogg' },
    close: { src: KDE + 'Window-Close.ogg' }
  };
  const level = () => (OS.settings.muted ? 0 : OS.settings.volume / 100);

  OS.sound = {
    play(name) {
      const s = SOUNDS[name], v = level();
      if (!s || !v || !(s.system ? OS.settings.sysSounds : OS.settings.uiSounds)) return Promise.resolve();
      const a = new Audio(s.src);
      a.volume = v;
      return a.play()
        .then(() => new Promise(done => { a.onended = done; setTimeout(done, 6000); }))
        .catch(() => {
          if (!s.system) return;
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
  };
})();
