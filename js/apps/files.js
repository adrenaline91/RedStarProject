(function () {
  'use strict';
  const { fs } = OS;

  const SIDEBAR = [
    { head: '장치' },
    { label: '붉은별', path: '/' },
    { head: '위치' },
    { label: '홈', path: fs.HOME },
    { label: '바탕화면', path: fs.DESKTOP },
    { label: '문서', path: fs.DOCS },
    { label: '내리적재', path: fs.HOME + '/내리적재' },
    { label: '동영상', path: fs.HOME + '/동영상' },
    { label: '음악', path: fs.HOME + '/음악' },
    { label: '그림', path: fs.HOME + '/그림' },
    { label: '응용프로그람', path: fs.APPS },
    { label: '휴지통', path: fs.TRASH }
  ];

  const BODY = `<div class="fm">
    <div class="fm-toolbar">
      <div class="seg">
        <button class="tb seg-l fm-back" title="뒤로"><svg viewBox="0 0 10 10"><path d="M7 1L2 5l5 4z" fill="#555"/></svg></button>
        <button class="tb seg-r fm-fwd" title="앞으로"><svg viewBox="0 0 10 10"><path d="M3 1l5 4-5 4z" fill="#555"/></svg></button>
      </div>
      <div class="seg">
        <button class="tb seg-l fm-v-icons" title="그림표 보기"><svg viewBox="0 0 14 14"><g fill="#555"><rect x="1" y="1" width="5" height="5"/><rect x="8" y="1" width="5" height="5"/><rect x="1" y="8" width="5" height="5"/><rect x="8" y="8" width="5" height="5"/></g></svg></button>
        <button class="tb seg-r fm-v-list" title="목록 보기"><svg viewBox="0 0 14 14"><g fill="#555"><rect x="1" y="2" width="12" height="2"/><rect x="1" y="6" width="12" height="2"/><rect x="1" y="10" width="12" height="2"/></g></svg></button>
      </div>
      <button class="tb single fm-newdir" title="새 등록부"><svg viewBox="0 0 16 14"><path d="M1 3h5l1 1.5h8V13H1z" fill="#86c04f" stroke="#4d7d27"/><path d="M11 6v5M8.5 8.5h5" stroke="#fff" stroke-width="1.8"/></svg></button>
      <button class="tb single fm-del" title="휴지통으로 옮기기"><svg viewBox="0 0 14 14"><path d="M3 4h8l-1 9H4z" fill="#999" stroke="#555"/><path d="M2 3h10M5.5 1.5h3" stroke="#555" stroke-width="1.4"/></svg></button>
      <button class="tb single fm-empty" title="휴지통 비우기">비우기</button>
      <div class="fm-path"></div>
      <div class="fm-searchbox"><svg viewBox="0 0 14 14"><circle cx="5.5" cy="5.5" r="4" fill="none" stroke="#666" stroke-width="1.6"/><path d="M8.5 8.5l4 4" stroke="#666" stroke-width="2"/></svg><input class="fm-filter" placeholder="찾기" spellcheck="false"></div>
    </div>
    <div class="fm-main">
      <div class="fm-side"></div>
      <div class="fm-view" tabindex="0"></div>
    </div>
    <div class="fm-status"></div>
  </div>`;

  function createWindow(opts) {
    const body = OS.h(BODY);
    const q = s => body.querySelector(s);
    const st = { path: null, hist: [], hi: -1, view: OS.store.get('fm.view', 'icons'), sel: null, filter: '' };
    const win = OS.wm.open({
      app: 'files', title: '', body, cls: 'unified', w: opts.w || 640, h: opts.h || 420, minW: 420, minH: 240,
      menus: () => menus(st, win)
    });
    win.fm = st;
    const view = q('.fm-view'), side = q('.fm-side');

    SIDEBAR.forEach(s => {
      if (s.head) return side.appendChild(OS.h(`<div class="fm-head">${s.head}</div>`));
      const el = OS.h(`<div class="fm-place" data-path="${OS.esc(s.path)}"><img src="${s.path === fs.TRASH ? (fs.trash.length ? 'icons/fs-trashcan_full.png' : 'icons/trash.png') : fs.SPECIAL[s.path]}">${s.label}</div>`);
      el.onclick = () => go(s.path);
      el.addEventListener('dragover', e => { if (s.path !== fs.APPS) { e.preventDefault(); el.classList.add('drop'); } });
      el.addEventListener('dragleave', () => el.classList.remove('drop'));
      el.addEventListener('drop', e => { el.classList.remove('drop'); dropOn(e, s.path); });
      side.appendChild(el);
    });

    function go(path, push = true) {
      if (path !== fs.TRASH && !fs.isDir(path)) path = fs.HOME;
      if (push) { st.hist = st.hist.slice(0, st.hi + 1); st.hist.push(path); st.hi = st.hist.length - 1; }
      st.path = path;
      st.sel = null;
      st.filter = '';
      q('.fm-filter').value = '';
      render();
    }
    st.go = go;
    st.back = () => { if (st.hi > 0) { st.hi--; go(st.hist[st.hi], false); } };
    st.fwd = () => { if (st.hi < st.hist.length - 1) { st.hi++; go(st.hist[st.hi], false); } };
    st.up = () => { if (st.path !== '/' && st.path !== fs.TRASH) go(st.path === fs.APPS ? '/' : fs.parent(st.path)); };

    function items() {
      let list;
      if (st.path === fs.TRASH) list = fs.trash.map((t, i) => ({ name: t.name, path: null, type: t.node.type, node: t.node, trashIndex: i, from: t.from, at: t.at }));
      else list = fs.list(st.path);
      if (st.filter) list = list.filter(it => it.name.toLowerCase().includes(st.filter.toLowerCase()));
      return list;
    }

    function render() {
      const isTrash = st.path === fs.TRASH;
      const name = isTrash ? '휴지통' : st.path === '/' ? '붉은별' : fs.base(st.path);
      win.setTitle(name);
      q('.fm-path').textContent = isTrash ? '휴지통' : st.path;
      side.querySelectorAll('.fm-place').forEach(p => p.classList.toggle('sel', p.dataset.path === st.path));
      const trashIcon = side.querySelector(`[data-path="${fs.TRASH}"] img`);
      trashIcon.src = fs.trash.length ? 'icons/fs-trashcan_full.png' : 'icons/trash.png';
      q('.fm-back').disabled = st.hi <= 0;
      q('.fm-fwd').disabled = st.hi >= st.hist.length - 1;
      q('.fm-v-icons').classList.toggle('on', st.view === 'icons');
      q('.fm-v-list').classList.toggle('on', st.view === 'list');
      q('.fm-empty').style.display = isTrash ? '' : 'none';
      q('.fm-newdir').disabled = isTrash || st.path === fs.APPS || st.path === '/';
      const list = items();
      view.className = 'fm-view ' + st.view;
      view.innerHTML = '';
      if (st.view === 'list') {
        view.appendChild(OS.h(`<div class="fm-row fm-hdr"><span class="c-name">이름</span><span class="c-date">${isTrash ? '지운 날자' : '수정한 날자'}</span><span class="c-size">크기</span><span class="c-kind">종류</span></div>`));
      }
      list.forEach(it => {
        const icon = fs.icon(it);
        const node = it.node || (it.path && fs.get(it.path));
        const el = st.view === 'icons'
          ? OS.h(`<div class="fm-item"><img src="${icon}" draggable="false"><span class="fm-name">${OS.esc(it.name)}</span></div>`)
          : OS.h(`<div class="fm-row"><span class="c-name"><img src="${icon}" draggable="false">${OS.esc(it.name)}</span><span class="c-date">${isTrash ? OS.formatDate(it.at) : node && node.mtime ? OS.formatDate(node.mtime) : '--'}</span><span class="c-size">${it.type === 'file' ? OS.formatSize(fs.size(node)) : '--'}</span><span class="c-kind">${fs.kindName(it)}</span></div>`);
        el.dataset.name = it.name;
        if (st.sel === it.name) el.classList.add('sel');
        el.addEventListener('mousedown', e => { e.stopPropagation(); select(it.name); });
        el.addEventListener('dblclick', () => open(it));
        el.addEventListener('contextmenu', e => { select(it.name); OS.contextMenu(e, itemMenu(it)); });
        if (it.path && it.path.startsWith(fs.HOME + '/')) {
          el.draggable = true;
          el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/x-redstar-path', it.path); e.dataTransfer.effectAllowed = 'move'; });
        }
        if (it.type === 'dir' && !isTrash && it.path !== fs.APPS) {
          el.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('text/x-redstar-path') || e.dataTransfer.types.includes('Files')) { e.preventDefault(); el.classList.add('drop'); } });
          el.addEventListener('dragleave', () => el.classList.remove('drop'));
          el.addEventListener('drop', e => { e.stopPropagation(); el.classList.remove('drop'); dropOn(e, it.path); });
        }
        view.appendChild(el);
      });
      if (!list.length) view.appendChild(OS.h(`<div class="fm-empty-msg">${st.filter ? '찾은 항목이 없습니다' : isTrash ? '휴지통이 비여있습니다' : '이 등록부는 비여있습니다'}</div>`));
      q('.fm-status').textContent = `${list.length}개 항목` + (isTrash ? '' : `, 기억공간 ${spaceLeft()} 사용가능`);
    }

    function spaceLeft() {
      let used = 0;
      try { for (const k of Object.keys(localStorage)) used += (localStorage.getItem(k) || '').length * 2; } catch (e) {}
      return OS.formatSize(Math.max(0, 5 * 1048576 - used));
    }

    function select(name) {
      st.sel = name;
      view.querySelectorAll('.sel').forEach(x => x.classList.remove('sel'));
      if (name != null) {
        const el = [...view.querySelectorAll('[data-name]')].find(x => x.dataset.name === name);
        if (el) { el.classList.add('sel'); el.scrollIntoView({ block: 'nearest' }); }
      }
    }
    const selected = () => items().find(it => it.name === st.sel) || null;
    st.selected = selected;

    function open(it) {
      if (st.path === fs.TRASH) return OS.alert(`「${it.name}」은(는) 휴지통에 있습니다.\n먼저 되살리기를 하십시오.`);
      if (it.type === 'dir') return go(it.path);
      OS.openPath(it.path);
    }
    st.openSel = () => { const it = selected(); if (it) open(it); };

    function itemMenu(it) {
      if (st.path === fs.TRASH) {
        return [
          { label: '되살리기', action: () => fs.restore(it.trashIndex) },
          { label: '영구 삭제', action: async () => { if (await OS.confirm(`「${it.name}」을(를) 영구 삭제하겠습니까?`, '삭제')) fs.purge(it.trashIndex); } },
          { sep: 1 },
          { label: '휴지통 비우기', action: OS.emptyTrash }
        ];
      }
      const own = it.path && it.path.startsWith(fs.HOME + '/');
      return [
        { label: '열기', action: () => open(it) },
        ...(it.type === 'dir' ? [{ label: '새 창문에서 열기', action: () => OS.launch('files', { path: it.path, newWindow: true }) }] : []),
        ...(it.type === 'file' && fs.kind(it.name, it.node) === 'text' ? [] : it.type === 'file' ? [{ label: '본문편집기로 열기', action: () => OS.launch('editor', { path: it.path }) }] : []),
        { sep: 1 },
        { label: '정보 보기', action: () => info(it) },
        { label: '이름 바꾸기...', disabled: !own, action: () => rename(it) },
        { label: '복제', disabled: !own || it.type !== 'file', action: () => duplicate(it) },
        ...(fs.kind(it.name, it.node) === 'image' ? [{ label: '바탕화면 그림으로 설정', action: () => OS.set('wallpaper', it.node.url || it.node.content) }] : []),
        { sep: 1 },
        { label: '휴지통으로 옮기기', disabled: !own, action: () => OS.trashItem(it.path) }
      ];
    }
    function bgMenu() {
      const isTrash = st.path === fs.TRASH, writable = !isTrash && st.path !== fs.APPS && st.path !== '/';
      return [
        { label: '새 등록부', disabled: !writable, action: () => OS.newFolderIn(st.path) },
        { label: '새 문서', disabled: !writable, action: () => OS.newDocIn(st.path) },
        { sep: 1 },
        { label: '그림표로 보기', checked: st.view === 'icons', action: () => setView('icons') },
        { label: '목록으로 보기', checked: st.view === 'list', action: () => setView('list') },
        ...(isTrash ? [{ sep: 1 }, { label: '휴지통 비우기', disabled: !fs.trash.length, action: OS.emptyTrash }] : [])
      ];
    }
    async function rename(it) {
      const np = await OS.renameItem(it.path);
      if (np) select(fs.base(np));
    }
    function duplicate(it) {
      const d = fs.parent(it.path), name = fs.unique(d, it.name.replace(/(\.[^.]*)?$/, ' 사본$1'));
      fs.put(fs.join(d, name), JSON.parse(JSON.stringify(it.node)));
    }
    function info(it) {
      const node = it.node || fs.get(it.path);
      OS.dialog({
        icon: fs.icon(it), title: it.name,
        message: `종류: ${fs.kindName(it)}\n위치: ${it.path ? fs.parent(it.path) : it.from}\n크기: ${node ? OS.formatSize(fs.size(node)) : '--'}\n수정: ${node && node.mtime ? OS.formatDate(node.mtime) : '--'}`
      });
    }
    function setView(v) { st.view = v; OS.store.set('fm.view', v); render(); }
    st.setView = setView;
    st.rename = () => { const it = selected(); if (it && it.path) rename(it); };
    st.trashSel = () => {
      const it = selected();
      if (!it) return;
      if (st.path === fs.TRASH) OS.confirm(`「${it.name}」을(를) 영구 삭제하겠습니까?`, '삭제').then(ok => ok && fs.purge(it.trashIndex));
      else if (it.path) OS.trashItem(it.path);
    };
    st.info = () => { const it = selected(); if (it) info(it); };

    function dropOn(e, dest) {
      e.preventDefault();
      if (dest === fs.TRASH) {
        const p = e.dataTransfer.getData('text/x-redstar-path');
        if (p) OS.trashItem(p);
        return;
      }
      const p = e.dataTransfer.getData('text/x-redstar-path');
      if (p) {
        if (fs.parent(p) === dest) return;
        try { fs.move(p, dest); } catch (err) { OS.alert(err.message); }
        return;
      }
      [...e.dataTransfer.files].forEach(f => importFile(f, dest));
    }
    function importFile(f, dest) {
      const kind = fs.kind(f.name);
      if (f.size > 1.5 * 1048576) return OS.alert(`「${f.name}」은(는) 너무 큽니다 (최대 1.5 MB).`);
      if (kind === 'media') return OS.alert(`동영상은 동영상재생기에서 직접 여십시오:\n${f.name}`);
      const r = new FileReader();
      r.onload = () => {
        const name = fs.unique(dest, f.name);
        try { fs.put(fs.join(dest, name), kind === 'image' ? { type: 'file', content: r.result } : { type: 'file', content: r.result }); }
        catch (err) { OS.alert(err.message); }
      };
      kind === 'image' ? r.readAsDataURL(f) : r.readAsText(f);
    }
    view.addEventListener('dragover', e => {
      if (st.path === fs.APPS || st.path === '/') return;
      e.preventDefault();
      view.classList.add('drop');
    });
    view.addEventListener('dragleave', e => { if (e.target === view) view.classList.remove('drop'); });
    view.addEventListener('drop', e => { view.classList.remove('drop'); if (st.path !== fs.APPS && st.path !== '/') dropOn(e, st.path); });

    view.addEventListener('mousedown', () => select(null));
    view.addEventListener('contextmenu', e => OS.contextMenu(e, bgMenu()));
    view.addEventListener('keydown', e => {
      const list = items(), i = list.findIndex(it => it.name === st.sel);
      if (e.key === 'Enter') { e.preventDefault(); st.openSel(); }
      else if (e.key === 'Delete') st.trashSel();
      else if (e.key === 'F2') st.rename();
      else if (e.key === 'Backspace') st.up();
      else if (/^Arrow/.test(e.key) && list.length) {
        e.preventDefault();
        const cols = st.view === 'icons' ? Math.max(1, Math.floor(view.clientWidth / 96)) : 1;
        const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
        select(list[Math.max(0, Math.min(list.length - 1, i < 0 ? 0 : i + d))].name);
      }
    });

    q('.fm-back').onclick = st.back;
    q('.fm-fwd').onclick = st.fwd;
    q('.fm-v-icons').onclick = () => setView('icons');
    q('.fm-v-list').onclick = () => setView('list');
    q('.fm-newdir').onclick = () => OS.newFolderIn(st.path);
    q('.fm-del').onclick = st.trashSel;
    q('.fm-empty').onclick = OS.emptyTrash;
    q('.fm-filter').addEventListener('input', e => { st.filter = e.target.value; render(); });

    const onFs = () => { if (OS.windows.includes(win)) render(); };
    OS.on('fs', onFs);
    go(opts.path || fs.HOME);
    setTimeout(() => view.focus(), 0);
    return win;
  }

  function menus(st, win) {
    const it = st.selected(), isTrash = st.path === fs.TRASH;
    const own = it && it.path && it.path.startsWith(fs.HOME + '/');
    const writable = !isTrash && st.path !== fs.APPS && st.path !== '/';
    return [
      { title: '파일', items: [
        { label: '새 창문', key: 'Alt+N', action: () => OS.launch('files', { path: st.path, newWindow: true }) },
        { label: '새 등록부', key: 'Alt+Shift+N', disabled: !writable, action: () => OS.newFolderIn(st.path) },
        { label: '새 문서', disabled: !writable, action: () => OS.newDocIn(st.path) },
        { label: '열기', key: 'Ctrl+O', disabled: !it, action: st.openSel },
        { label: '창문 닫기', key: 'Alt+W', action: () => win.close() },
        { sep: 1 },
        { label: '정보 보기', key: 'Ctrl+I', disabled: !it, action: st.info },
        { label: '이름 바꾸기', hint: 'F2', disabled: !own, action: st.rename },
        { sep: 1 },
        { label: isTrash ? '영구 삭제' : '휴지통으로 옮기기', hint: 'Delete', disabled: !it || (!own && !isTrash), action: st.trashSel },
        { label: '휴지통 비우기...', disabled: !fs.trash.length, action: OS.emptyTrash }
      ] },
      { title: '편집', items: OS.editItems() },
      { title: '보기', items: [
        { label: '그림표로', key: 'Alt+1', checked: st.view === 'icons', action: () => st.setView('icons') },
        { label: '목록으로', key: 'Alt+2', checked: st.view === 'list', action: () => st.setView('list') }
      ] },
      { title: '이동', items: [
        { label: '뒤로', key: 'Alt+ArrowLeft', disabled: st.hi <= 0, action: st.back },
        { label: '앞으로', key: 'Alt+ArrowRight', disabled: st.hi >= st.hist.length - 1, action: st.fwd },
        { label: '상위 등록부', key: 'Alt+ArrowUp', disabled: st.path === '/' || isTrash, action: st.up },
        { sep: 1 },
        ...OS.goItems(st.go)
      ] },
      { title: '창문', items: OS.windowItems() },
      { title: '도움말', items: [{ label: '붉은별 도움말', action: OS.help }] }
    ];
  }

  OS.register({
    id: 'files', name: '화일관리기', icon: 'icons/finder.png',
    launch(opts) {
      const existing = OS.wm.byApp('files');
      if (!opts.newWindow && !opts.path && existing.length) {
        const w = OS.wm.topmost(existing) || existing[existing.length - 1];
        OS.wm.restore(w);
        return w;
      }
      if (!opts.newWindow && opts.path && existing.length) {
        const w = existing.find(x => x.fm.path === opts.path);
        if (w) { OS.wm.restore(w); return w; }
      }
      return createWindow(opts);
    }
  });
})();
