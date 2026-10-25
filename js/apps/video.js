(function () {
  'use strict';

  function createWindow(opts) {
    const body = OS.h(`<div class="vp">
      <div class="vp-stage">
        <video class="vp-video" playsinline></video>
        <div class="vp-empty"><img src="icons/video.png"><p>동영상화일을 여기에 끌어다 놓거나</p><button class="btn default vp-open">화일 열기...</button></div>
      </div>
      <div class="vp-controls">
        <button class="vp-btn vp-play" title="재생">▶</button>
        <span class="vp-time">0:00</span>
        <input class="vp-seek" type="range" min="0" max="1000" value="0">
        <span class="vp-dur">0:00</span>
        <button class="vp-btn vp-mute" title="소리">🔊</button>
        <input class="vp-vol" type="range" min="0" max="100">
        <button class="vp-btn vp-full" title="전체화면">⛶</button>
      </div>
      <input class="vp-file" type="file" accept="video/*,audio/*" hidden>
    </div>`);
    const q = s => body.querySelector(s);
    const v = q('.vp-video');
    const st = { url: null };
    const win = OS.wm.open({
      app: 'video', title: '동영상재생기', body, w: 560, h: 380, minW: 340, minH: 240,
      menus: () => menus(st, win),
      onClose: () => { v.pause(); if (st.url && st.url.startsWith('blob:')) URL.revokeObjectURL(st.url); return true; }
    });
    win.vp = st;

    const t = s => isFinite(s) ? `${Math.floor(s / 60)}:${OS.pad(Math.floor(s % 60))}` : '0:00';
    function applyVolume() {
      v.volume = OS.settings.volume / 100;
      v.muted = OS.settings.muted;
      q('.vp-vol').value = OS.settings.muted ? 0 : OS.settings.volume;
      q('.vp-mute').textContent = OS.settings.muted || OS.settings.volume === 0 ? '🔇' : '🔊';
    }
    function load(url, name) {
      if (st.url && st.url.startsWith('blob:')) URL.revokeObjectURL(st.url);
      st.url = url;
      v.src = url;
      body.classList.add('loaded');
      win.setTitle(name || '동영상재생기');
      v.play().catch(() => {});
    }
    st.openFile = () => q('.vp-file').click();
    st.toggle = () => { if (!st.url) return st.openFile(); v.paused ? v.play() : v.pause(); };
    st.seek = d => { if (st.url) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + d)); };
    st.full = () => { if (v.requestFullscreen) v.requestFullscreen().catch(() => {}); };
    st.stop = () => { v.pause(); v.currentTime = 0; };
    st.speed = r => { v.playbackRate = r; };
    st.video = v;

    q('.vp-open').onclick = st.openFile;
    q('.vp-file').onchange = e => { const f = e.target.files[0]; if (f) load(URL.createObjectURL(f), f.name); e.target.value = ''; };
    q('.vp-play').onclick = st.toggle;
    v.addEventListener('click', st.toggle);
    v.addEventListener('dblclick', st.full);
    q('.vp-full').onclick = st.full;
    q('.vp-mute').onclick = () => OS.set('muted', !OS.settings.muted);
    q('.vp-vol').oninput = e => { OS.set('muted', false); OS.set('volume', +e.target.value); };
    q('.vp-seek').oninput = e => { if (v.duration) v.currentTime = v.duration * e.target.value / 1000; };
    v.addEventListener('timeupdate', () => {
      q('.vp-time').textContent = t(v.currentTime);
      if (v.duration) q('.vp-seek').value = Math.round(v.currentTime / v.duration * 1000);
    });
    v.addEventListener('loadedmetadata', () => q('.vp-dur').textContent = t(v.duration));
    v.addEventListener('play', () => q('.vp-play').textContent = '❚❚');
    v.addEventListener('pause', () => q('.vp-play').textContent = '▶');
    v.addEventListener('error', () => { if (st.url) OS.alert('이 화일을 재생할수 없습니다.', '동영상재생기'); });
    const stage = q('.vp-stage');
    stage.addEventListener('dragover', e => { e.preventDefault(); stage.classList.add('drop'); });
    stage.addEventListener('dragleave', () => stage.classList.remove('drop'));
    stage.addEventListener('drop', e => {
      e.preventDefault();
      stage.classList.remove('drop');
      const f = e.dataTransfer.files[0];
      if (f && /^(video|audio)\//.test(f.type)) load(URL.createObjectURL(f), f.name);
      else if (f) OS.alert('동영상 또는 음악화일이 아닙니다.');
    });
    win.el.tabIndex = 0;
    win.el.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
      if (e.key === ' ') { e.preventDefault(); st.toggle(); }
      if (e.key === 'ArrowRight') st.seek(10);
      if (e.key === 'ArrowLeft') st.seek(-10);
    });
    OS.on('settings', k => (k === 'volume' || k === 'muted') && OS.windows.includes(win) && applyVolume());
    applyVolume();
    if (opts.path) {
      const n = OS.fs.get(opts.path);
      if (n && (n.url || n.content)) load(n.url || n.content, OS.fs.base(opts.path));
    }
    return win;
  }

  function menus(st, win) {
    const v = st.video;
    return [
      { title: '파일', items: [
        { label: '화일 열기...', key: 'Ctrl+O', action: st.openFile },
        { sep: 1 },
        { label: '닫기', key: 'Alt+W', action: () => win.close() }
      ] },
      { title: '재생', items: [
        { label: v.paused ? '재생' : '일시정지', hint: 'Space', disabled: !st.url, action: st.toggle },
        { label: '정지', disabled: !st.url, action: st.stop },
        { sep: 1 },
        { label: '10초 앞으로', hint: '→', disabled: !st.url, action: () => st.seek(10) },
        { label: '10초 뒤로', hint: '←', disabled: !st.url, action: () => st.seek(-10) },
        { sep: 1 },
        ...[0.5, 1, 1.5, 2].map(r => ({ label: `속도 ×${r}`, checked: v.playbackRate === r, action: () => st.speed(r) })),
        { sep: 1 },
        { label: '반복재생', checked: v.loop, action: () => { v.loop = !v.loop; } }
      ] },
      { title: '보기', items: [
        { label: '전체화면', disabled: !st.url, action: st.full },
        { label: '창문 확대', action: () => win.toggleMax() }
      ] },
      { title: '창문', items: OS.windowItems() },
      { title: '도움말', items: [{ label: '동영상재생기에 대하여', action: () => OS.appAbout(OS.apps.video) }] }
    ];
  }

  OS.register({
    id: 'video', name: '동영상재생기', icon: 'icons/video.png',
    launch(opts) {
      const w = OS.wm.byApp('video')[0];
      if (w && !opts.newWindow && !opts.path) { OS.wm.restore(w); return w; }
      return createWindow(opts);
    }
  });
})();
