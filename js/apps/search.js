(function () {
  'use strict';
  const { fs } = OS;

  function createWindow(opts) {
    const body = OS.h(`<div class="sr">
      <div class="sr-bar">
        <label>이름 <input class="sr-name" placeholder="찾을 화일이름" spellcheck="false"></label>
        <label>찾을곳 <select class="sr-where"><option value="${fs.HOME}">홈 등록부</option><option value="/">붉은별 (전체)</option><option value="${fs.DOCS}">문서</option></select></label>
      </div>
      <div class="sr-bar">
        <label><input type="checkbox" class="sr-content"> 내용에서도 찾기</label>
        <label><input type="checkbox" class="sr-dirs" checked> 등록부 포함</label>
        <button class="btn default sr-go">찾기</button>
      </div>
      <div class="sr-results"><div class="fm-row fm-hdr"><span class="c-name">이름</span><span class="c-where">위치</span><span class="c-kind">종류</span></div><div class="sr-list"></div></div>
      <div class="sr-status">찾을 이름을 입력하십시오.</div>
    </div>`);
    const q = s => body.querySelector(s);
    const win = OS.wm.open({ app: 'search', title: '화일찾기', body, w: 520, h: 380, minW: 380, minH: 240, menus: () => menus(win) });

    let results = [], sel = -1;
    function run() {
      const term = q('.sr-name').value.trim().toLowerCase();
      const inContent = q('.sr-content').checked, dirs = q('.sr-dirs').checked;
      results = [];
      if (term) {
        fs.walk(q('.sr-where').value, it => {
          if (it.type === 'dir' && !dirs) return;
          const nameHit = it.name.toLowerCase().includes(term);
          const node = it.node;
          const contentHit = inContent && node && node.type === 'file' && node.content && !node.content.startsWith('data:') && node.content.toLowerCase().includes(term);
          if (nameHit || contentHit) results.push(Object.assign({ hit: nameHit ? 'name' : 'content' }, it));
        });
        if (q('.sr-where').value === '/') {
          fs.list(fs.APPS).forEach(a => { if (a.name.toLowerCase().includes(term)) results.push(a); });
        }
      }
      sel = -1;
      const list = q('.sr-list');
      list.innerHTML = '';
      results.forEach((it, i) => {
        const row = OS.h(`<div class="fm-row"><span class="c-name"><img src="${fs.icon(it)}">${OS.esc(it.name)}</span><span class="c-where">${OS.esc(fs.parent(it.path))}</span><span class="c-kind">${fs.kindName(it)}${it.hit === 'content' ? ' (내용)' : ''}</span></div>`);
        row.onmousedown = () => { sel = i; list.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); row.classList.add('sel'); };
        row.ondblclick = () => OS.openPath(it.path);
        row.oncontextmenu = e => OS.contextMenu(e, [
          { label: '열기', action: () => OS.openPath(it.path) },
          { label: '들어있는 등록부 열기', action: () => OS.launch('files', { path: fs.parent(it.path), newWindow: true }) }
        ]);
        list.appendChild(row);
      });
      q('.sr-status').textContent = term ? `${results.length}개 항목을 찾았습니다.` : '찾을 이름을 입력하십시오.';
    }
    q('.sr-name').addEventListener('input', run);
    q('.sr-name').addEventListener('keydown', e => { if (e.key === 'Enter') { run(); if (results.length) OS.openPath(results[sel < 0 ? 0 : sel].path); } });
    ['.sr-where', '.sr-content', '.sr-dirs'].forEach(s => q(s).addEventListener('change', run));
    q('.sr-go').onclick = run;
    OS.on('fs', () => OS.windows.includes(win) && run());
    if (opts.query) q('.sr-name').value = opts.query;
    run();
    setTimeout(() => q('.sr-name').focus(), 0);
    win.focusSearch = () => q('.sr-name').focus();
    return win;
  }

  function menus(win) {
    return [
      { title: '파일', items: [
        { label: '새 찾기', key: 'Alt+N', action: () => createWindow({}) },
        { label: '닫기', key: 'Alt+W', action: () => win.close() }
      ] },
      { title: '편집', items: [...OS.editItems(), { sep: 1 }, { label: '찾기', key: 'Ctrl+F', action: win.focusSearch }] },
      { title: '창문', items: OS.windowItems() },
      { title: '도움말', items: [{ label: '화일찾기에 대하여', action: () => OS.appAbout(OS.apps.search) }] }
    ];
  }

  OS.register({
    id: 'search', name: '화일찾기', icon: 'icons/search.png',
    launch(opts) {
      const w = OS.wm.byApp('search')[0];
      if (w && !opts.newWindow) { OS.wm.restore(w); w.focusSearch(); return w; }
      return createWindow(opts);
    }
  });
})();
