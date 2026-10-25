(function () {
  'use strict';
  const { fs } = OS;

  function createWindow(opts) {
    const body = OS.h(`<div class="iv">
      <div class="iv-stage"><img class="iv-img" draggable="false"></div>
      <div class="iv-bar">
        <button class="tb single iv-prev" title="이전">◀</button>
        <button class="tb single iv-next" title="다음">▶</button>
        <button class="tb single iv-fit" title="창문에 맞추기">맞추기</button>
        <button class="tb single iv-real" title="실제 크기">1:1</button>
        <button class="tb single iv-wall" title="바탕화면으로">바탕화면으로</button>
        <span class="iv-info"></span>
      </div>
    </div>`);
    const img = body.querySelector('.iv-img'), stage = body.querySelector('.iv-stage');
    const st = { path: opts.path, fit: true };
    const win = OS.wm.open({ app: 'viewer', title: '', body, w: 560, h: 440, minW: 280, minH: 200, menus: () => menus(st, win) });
    win.iv = st;

    const siblings = () => fs.list(fs.parent(st.path)).filter(it => it.type === 'file' && fs.kind(it.name, it.node) === 'image');
    function show() {
      const node = fs.get(st.path);
      if (!node) return win.close();
      img.src = node.url || node.content;
      win.setTitle(fs.base(st.path));
      img.onload = () => body.querySelector('.iv-info').textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
      layout();
    }
    function layout() {
      stage.classList.toggle('fit', st.fit);
    }
    st.step = d => {
      const list = siblings();
      const i = list.findIndex(it => it.path === st.path);
      if (list.length) { st.path = list[(i + d + list.length) % list.length].path; show(); }
    };
    st.setFit = v => { st.fit = v; layout(); };
    st.wall = () => { const n = fs.get(st.path); OS.set('wallpaper', n.url || n.content); };

    body.querySelector('.iv-prev').onclick = () => st.step(-1);
    body.querySelector('.iv-next').onclick = () => st.step(1);
    body.querySelector('.iv-fit').onclick = () => st.setFit(true);
    body.querySelector('.iv-real').onclick = () => st.setFit(false);
    body.querySelector('.iv-wall').onclick = st.wall;
    img.addEventListener('dblclick', () => st.setFit(!st.fit));
    win.el.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') st.step(1);
      if (e.key === 'ArrowLeft') st.step(-1);
    });
    win.el.tabIndex = 0;
    show();
    return win;
  }

  function menus(st, win) {
    return [
      { title: '파일', items: [
        { label: '화일관리기에서 보기', action: () => OS.launch('files', { path: fs.parent(st.path) }) },
        { label: '바탕화면 그림으로 설정', action: st.wall },
        { sep: 1 },
        { label: '닫기', key: 'Alt+W', action: () => win.close() }
      ] },
      { title: '보기', items: [
        { label: '창문에 맞추기', checked: st.fit, action: () => st.setFit(true) },
        { label: '실제 크기', checked: !st.fit, action: () => st.setFit(false) },
        { sep: 1 },
        { label: '이전 그림', hint: '←', action: () => st.step(-1) },
        { label: '다음 그림', hint: '→', action: () => st.step(1) }
      ] },
      { title: '창문', items: OS.windowItems() }
    ];
  }

  OS.register({
    id: 'viewer', name: '그림보기', icon: 'icons/fs-home-Pictures.png',
    launch(opts) {
      if (!opts.path) return OS.launch('files', { path: fs.HOME + '/그림' });
      const w = OS.wm.byApp('viewer')[0];
      if (w && !opts.newWindow) { w.iv.path = opts.path; w.close(true); }
      return createWindow(opts);
    }
  });
})();
