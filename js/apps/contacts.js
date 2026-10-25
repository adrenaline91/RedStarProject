(function () {
  'use strict';
  const FIELDS = [['org', '소속'], ['phone', '전화'], ['mobile', '손전화'], ['email', '전자우편'], ['address', '주소'], ['note', '메모']];
  let contacts = OS.store.get('contacts', [
    { id: 1, name: '김철수', org: '콤퓨터연구소', phone: '02-000-0001', mobile: '191-000-0001', email: '', address: '', note: '' },
    { id: 2, name: '리영희', org: '공업대학', phone: '02-000-0002', mobile: '', email: '', address: '', note: '프로그람 개발' },
    { id: 3, name: '박성민', org: '', phone: '', mobile: '192-000-0003', email: '', address: '', note: '' }
  ]);
  const save = () => { OS.store.set('contacts', contacts); OS.emit('contacts'); };

  function createWindow() {
    const body = OS.h(`<div class="ab">
      <div class="ab-list">
        <div class="ab-search"><input placeholder="찾기" spellcheck="false"></div>
        <ul class="ab-names"></ul>
        <div class="ab-bar"><button class="tb single ab-add" title="새 련락처">+</button><button class="tb single ab-del" title="삭제">−</button><span class="ab-count"></span></div>
      </div>
      <div class="ab-card"></div>
    </div>`);
    const q = s => body.querySelector(s);
    const st = { sel: contacts[0] ? contacts[0].id : null, edit: false, filter: '' };
    const win = OS.wm.open({ app: 'contacts', title: '주소록', body, w: 580, h: 400, minW: 440, minH: 280, menus: () => menus(st, win) });
    win.ab = st;

    const current = () => contacts.find(c => c.id === st.sel);
    function renderList() {
      const ul = q('.ab-names');
      ul.innerHTML = '';
      const f = st.filter.toLowerCase();
      const list = contacts.filter(c => !f || [c.name, c.org, c.phone, c.mobile].join(' ').toLowerCase().includes(f))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      list.forEach(c => {
        const li = OS.h(`<li class="${c.id === st.sel ? 'sel' : ''}">${OS.esc(c.name || '이름없음')}</li>`);
        li.onclick = () => { st.sel = c.id; st.edit = false; render(); };
        ul.appendChild(li);
      });
      q('.ab-count').textContent = `${contacts.length}명`;
    }
    function renderCard() {
      const card = q('.ab-card'), c = current();
      if (!c) { card.innerHTML = '<div class="ab-empty">련락처를 선택하십시오</div>'; return; }
      const initial = (c.name || '?').slice(0, 1);
      if (!st.edit) {
        card.innerHTML = `<div class="ab-top"><div class="ab-avatar">${OS.esc(initial)}</div><div><div class="ab-name">${OS.esc(c.name || '이름없음')}</div><div class="ab-org">${OS.esc(c.org || '')}</div></div></div>
          <table class="ab-fields">${FIELDS.filter(([k]) => k !== 'org' && c[k]).map(([k, l]) => `<tr><th>${l}</th><td>${OS.esc(c[k]).replace(/\n/g, '<br>')}</td></tr>`).join('') || '<tr><td class="ab-none">정보가 없습니다</td></tr>'}</table>
          <div class="ab-actions"><button class="btn ab-edit">편집</button></div>`;
        card.querySelector('.ab-edit').onclick = () => { st.edit = true; renderCard(); };
      } else {
        card.innerHTML = `<div class="ab-top"><div class="ab-avatar">${OS.esc(initial)}</div><div class="ab-namefield"><input data-k="name" placeholder="이름" value="${OS.esc(c.name)}"></div></div>
          <table class="ab-fields edit">${FIELDS.map(([k, l]) => `<tr><th>${l}</th><td>${k === 'note' || k === 'address' ? `<textarea data-k="${k}" rows="2">${OS.esc(c[k] || '')}</textarea>` : `<input data-k="${k}" value="${OS.esc(c[k] || '')}">`}</td></tr>`).join('')}</table>
          <div class="ab-actions"><button class="btn ab-cancel">취소</button><button class="btn default ab-done">완료</button></div>`;
        card.querySelector('.ab-done').onclick = () => {
          card.querySelectorAll('[data-k]').forEach(i => c[i.dataset.k] = i.value.trim());
          st.edit = false;
          save();
        };
        card.querySelector('.ab-cancel').onclick = () => { st.edit = false; if (!c.name && !FIELDS.some(([k]) => c[k])) remove(c.id, true); else renderCard(); };
        setTimeout(() => card.querySelector('[data-k="name"]').focus(), 0);
      }
    }
    function render() { renderList(); renderCard(); }
    function remove(id, silent) {
      const i = contacts.findIndex(c => c.id === id);
      if (i < 0) return;
      const go = () => { contacts.splice(i, 1); st.sel = contacts[0] ? contacts[0].id : null; st.edit = false; save(); };
      if (silent) return go();
      OS.confirm(`「${contacts[i].name || '이름없음'}」을(를) 삭제하겠습니까?`, '삭제').then(ok => ok && go());
    }
    st.add = () => {
      const c = { id: Date.now(), name: '', org: '', phone: '', mobile: '', email: '', address: '', note: '' };
      contacts.push(c);
      st.sel = c.id;
      st.edit = true;
      render();
    };
    st.remove = () => st.sel && remove(st.sel);
    st.editCur = () => { if (current()) { st.edit = true; renderCard(); } };
    st.find = () => q('.ab-search input').focus();
    q('.ab-add').onclick = st.add;
    q('.ab-del').onclick = st.remove;
    q('.ab-search input').addEventListener('input', e => { st.filter = e.target.value; renderList(); });
    OS.on('contacts', () => OS.windows.includes(win) && render());
    render();
    return win;
  }

  function menus(st, win) {
    return [
      { title: '파일', items: [
        { label: '새 련락처', key: 'Alt+N', action: st.add },
        { sep: 1 },
        { label: '닫기', key: 'Alt+W', action: () => win.close() }
      ] },
      { title: '편집', items: [
        ...OS.editItems(),
        { sep: 1 },
        { label: '련락처 편집', key: 'Ctrl+E', disabled: !st.sel, action: st.editCur },
        { label: '련락처 삭제', disabled: !st.sel, action: st.remove },
        { label: '찾기', key: 'Ctrl+F', action: st.find }
      ] },
      { title: '창문', items: OS.windowItems() },
      { title: '도움말', items: [{ label: '주소록에 대하여', action: () => OS.appAbout(OS.apps.contacts) }] }
    ];
  }

  OS.register({
    id: 'contacts', name: '주소록', icon: 'icons/contacts.png',
    launch() {
      const w = OS.wm.byApp('contacts')[0];
      if (w) { OS.wm.restore(w); return w; }
      return createWindow();
    }
  });
})();
