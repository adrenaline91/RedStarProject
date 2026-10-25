(function () {
  'use strict';
  const { fs } = OS;

  function createWindow(opts) {
    const body = OS.h(`<div class="ed">
      <textarea class="ed-text" spellcheck="false"></textarea>
      <div class="ed-status"><span class="ed-pos">줄 1, 렬 1</span><span class="ed-count"></span></div>
    </div>`);
    const ta = body.querySelector('.ed-text');
    const st = { path: opts.path || null, dirty: false, size: OS.store.get('ed.size', 14), wrap: OS.store.get('ed.wrap', true) };
    const win = OS.wm.open({
      app: 'editor', title: '', body, w: 560, h: 400, minW: 300, minH: 180,
      menus: () => menus(st, win),
      onClose: () => {
        if (!st.dirty) return true;
        OS.dialog({
          icon: 'icons/editor.png', title: `「${name()}」의 변경을 보관하겠습니까?`,
          message: '보관하지 않으면 변경내용을 잃게 됩니다.', buttons: ['보관하지 않음', '취소', '보관'], cancel: 1
        }).then(async r => {
          if (r.button === 0) win.close(true);
          if (r.button === 2 && await save()) win.close(true);
        });
        return false;
      }
    });
    win.ed = st;

    const name = () => st.path ? fs.base(st.path) : '제목없음';
    const title = () => win.setTitle((st.dirty ? '• ' : '') + name());
    function applyStyle() {
      ta.style.fontSize = st.size + 'px';
      ta.style.whiteSpace = st.wrap ? 'pre-wrap' : 'pre';
      ta.style.overflowX = st.wrap ? 'hidden' : 'auto';
    }
    function pos() {
      const before = ta.value.slice(0, ta.selectionStart).split('\n');
      body.querySelector('.ed-pos').textContent = `줄 ${before.length}, 렬 ${before[before.length - 1].length + 1}`;
      body.querySelector('.ed-count').textContent = `${ta.value.length} 글자`;
    }
    async function save(as) {
      let p = st.path;
      if (!p || as) {
        const n = await OS.prompt('보관할 이름 (문서 등록부):', p ? fs.base(p) : '제목없음.txt', '다른 이름으로 보관');
        if (n == null) return false;
        p = fs.join(p ? fs.parent(p) : fs.DOCS, n.trim());
        if (fs.exists(p) && p !== st.path && !(await OS.confirm(`「${n}」이(가) 이미 있습니다. 바꾸겠습니까?`, '바꾸기'))) return false;
      }
      try { fs.write(p, ta.value); } catch (err) { OS.alert(err.message); return false; }
      st.path = p;
      st.dirty = false;
      title();
      return true;
    }
    st.save = save;
    st.find = async () => {
      const t = await OS.prompt('찾을 글:', st.last || '', '찾기');
      if (!t) return;
      st.last = t;
      st.findNext();
    };
    st.findNext = () => {
      if (!st.last) return st.find();
      let i = ta.value.indexOf(st.last, ta.selectionEnd);
      if (i < 0) i = ta.value.indexOf(st.last);
      if (i < 0) return OS.alert(`「${st.last}」을(를) 찾지 못했습니다.`);
      ta.focus();
      ta.setSelectionRange(i, i + st.last.length);
    };
    st.zoom = d => { st.size = Math.max(9, Math.min(32, st.size + d)); OS.store.set('ed.size', st.size); applyStyle(); };
    st.toggleWrap = () => { st.wrap = !st.wrap; OS.store.set('ed.wrap', st.wrap); applyStyle(); };
    st.ta = ta;

    if (st.path) {
      const c = fs.read(st.path);
      if (c == null) { OS.alert('화일을 읽을수 없습니다:\n' + st.path); st.path = null; }
      else ta.value = c.startsWith('data:') ? '(2진 화일입니다)' : c;
    }
    ta.addEventListener('input', () => { if (!st.dirty) { st.dirty = true; title(); } pos(); });
    ['keyup', 'click', 'select'].forEach(ev => ta.addEventListener(ev, pos));
    ta.addEventListener('keydown', e => {
      if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '    '); }
    });
    applyStyle();
    title();
    pos();
    setTimeout(() => ta.focus(), 0);
    return win;
  }

  function menus(st, win) {
    return [
      { title: '파일', items: [
        { label: '새 문서', key: 'Alt+N', action: () => createWindow({}) },
        { label: '열기...', key: 'Ctrl+O', action: () => OS.launch('files', { path: st.path ? fs.parent(st.path) : fs.DOCS }) },
        { sep: 1 },
        { label: '보관', key: 'Ctrl+S', action: () => st.save() },
        { label: '다른 이름으로 보관...', key: 'Ctrl+Shift+S', action: () => st.save(true) },
        { sep: 1 },
        { label: '닫기', key: 'Alt+W', action: () => win.close() }
      ] },
      { title: '편집', items: [
        ...OS.editItems(),
        { sep: 1 },
        { label: '찾기...', key: 'Ctrl+F', action: st.find },
        { label: '다음 찾기', key: 'Ctrl+G', action: st.findNext },
        { label: '날자와 시간 넣기', action: () => { st.ta.focus(); document.execCommand('insertText', false, OS.formatDate(Date.now())); } }
      ] },
      { title: '서식', items: [
        { label: '글자 크게', key: 'Ctrl+=', action: () => st.zoom(2) },
        { label: '글자 작게', key: 'Ctrl+-', action: () => st.zoom(-2) },
        { sep: 1 },
        { label: '자동 줄바꾸기', checked: st.wrap, action: st.toggleWrap }
      ] },
      { title: '창문', items: OS.windowItems() },
      { title: '도움말', items: [{ label: '본문편집기에 대하여', action: () => OS.appAbout(OS.apps.editor) }] }
    ];
  }

  OS.register({
    id: 'editor', name: '본문편집기', icon: 'icons/editor.png',
    launch(opts) {
      if (opts.path) {
        const w = OS.wm.byApp('editor').find(x => x.ed.path === opts.path);
        if (w) { OS.wm.restore(w); return w; }
      }
      return createWindow(opts);
    }
  });
})();
