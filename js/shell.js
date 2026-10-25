(function () {
  'use strict';
  const { fs, wm } = OS;
  const $ = s => document.querySelector(s);

  function applyWallpaper() {
    const v = OS.settings.wallpaper, el = $('#wallpaper');
    if (v.startsWith('color:')) {
      el.style.backgroundColor = v.slice(6);
      el.style.backgroundImage = v === 'color:#3a5a30' ? 'linear-gradient(180deg, #4b6b3e 0%, #3a5a30 50%, #2f4d29 100%)' : '';
    }
    else { el.style.backgroundColor = '#222'; el.style.backgroundImage = `url("${v}")`; }
  }
  OS.on('settings', k => k === 'wallpaper' && applyWallpaper());
  applyWallpaper();

  OS.about = () => {
    const open = wm.byApp('about')[0];
    if (open) return open.focus();
    const mem = navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '2 GB';
    const cpu = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} 핵심 처리기` : '처리기';
    const win = wm.open({
      app: 'about', title: '', w: 300, h: 330, resizable: false, noMax: true, cls: 'about-win',
      body: `<div class="about">
        <img src="icons/redstar.png" class="about-logo">
        <div class="about-name">붉은별</div>
        <div class="about-ver">판본 3.0</div>
        <button class="btn about-upd">쏘프트웨어 갱신...</button>
        <table class="about-tbl">
          <tr><th>처리기</th><td>${OS.esc(cpu)}</td></tr>
          <tr><th>기억기</th><td>${mem}</td></tr>
          <tr><th>시동디스크</th><td>붉은별</td></tr>
        </table>
        <button class="btn about-more">더 많은 정보...</button>
        <div class="about-copy">주체102(2013) 조선콤퓨터쎈터</div>
      </div>`
    });
    win.body.querySelector('.about-upd').onclick = () => OS.alert('쏘프트웨어가 최신판본입니다.', '쏘프트웨어 갱신');
    win.body.querySelector('.about-more').onclick = () => OS.launch('settings', { pane: 'about' });
  };
  OS.register({ id: 'about', name: '이 콤퓨터에 대하여', icon: 'icons/redstar.png', hidden: true, launch: OS.about });
  OS.appAbout = app => OS.dialog({ icon: app.icon, title: app.name, message: '판본 3.0\n\n붉은별 조작체계의 기본 프로그람입니다.' });

  const menusEl = $('#menus');
  let openTitle = null;

  function quitApp(id) {
    wm.byApp(id).forEach(w => w.close());
  }
  OS.quitApp = quitApp;

  function starMenu() {
    return [
      { label: '이 콤퓨터에 대하여', action: OS.about },
      { sep: 1 },
      { label: '쏘프트웨어 갱신...', action: () => OS.alert('쏘프트웨어가 최신판본입니다.', '쏘프트웨어 갱신') },
      { label: '체계설정...', action: () => OS.launch('settings') },
      { label: '언어...', action: () => OS.launch('settings', { pane: 'language' }) },
      { sep: 1 },
      { label: '강제끝내기...', key: 'Alt+Shift+Escape', action: forceQuit },
      { sep: 1 },
      { label: '잠자기', action: () => OS.power('sleep') },
      { label: '재시동...', action: () => OS.power('restart') },
      { label: '끄기...', action: () => OS.power('shutdown') },
      { sep: 1 },
      { label: `${OS.settings.user} 가입탈퇴...`, key: 'Alt+Shift+Q', action: () => OS.power('logout') }
    ];
  }

  function forceQuit() {
    const running = [...new Set(OS.windows.map(w => w.app))].filter(id => OS.apps[id] && !OS.apps[id].hidden);
    if (!running.length) return OS.alert('실행중인 프로그람이 없습니다.', '강제끝내기');
    const win = wm.open({
      app: 'about', title: '프로그람 강제끝내기', w: 300, h: 260, resizable: false, noMax: true,
      body: `<div class="fq"><p>끝내려는 프로그람을 선택하십시오:</p><ul class="fq-list">${running.map(id =>
        `<li data-id="${id}"><img src="${OS.apps[id].icon}">${OS.esc(OS.apps[id].name)}</li>`).join('')}</ul>
        <div class="fq-btns"><button class="btn default">강제끝내기</button></div></div>`
    });
    let sel = running[0];
    const lis = win.body.querySelectorAll('li');
    lis[0].classList.add('sel');
    lis.forEach(li => li.onclick = () => { lis.forEach(l => l.classList.remove('sel')); li.classList.add('sel'); sel = li.dataset.id; });
    win.body.querySelector('.btn').onclick = () => {
      OS.windows.filter(w => w.app === sel).forEach(w => w.close(true));
      win.close();
    };
  }

  function defaultMenus() {
    return [
      { title: '파일', items: [
        { label: '새 창문', key: 'Alt+N', action: () => OS.launch('files', { newWindow: true }) },
        { label: '새 등록부', key: 'Alt+Shift+N', action: () => newFolderIn(fs.DESKTOP) },
        { sep: 1 },
        { label: '창문 닫기', key: 'Alt+W', disabled: !wm.active, action: () => wm.active && wm.active.close() }
      ] },
      { title: '편집', items: editItems() },
      { title: '보기', items: [{ label: '바탕화면 정리', action: () => renderDesktop() }] },
      { title: '이동', items: goItems(p => OS.launch('files', { path: p })) },
      { title: '창문', items: windowItems() },
      { title: '도움말', items: [{ label: '붉은별 도움말', action: help }] }
    ];
  }
  function help() {
    OS.dialog({ title: '붉은별 도움말', message: '· 도크의 그림표를 눌러 프로그람을 실행합니다.\n· 창문의 붉은 단추는 닫기, 노란 단추는 최소화, 푸른 단추는 확대입니다.\n· 제목띠를 두번 누르면 창문이 확대됩니다.\n· 오른쪽 아래 모서리를 끌어서 창문 크기를 바꿉니다.\n· Shift+Space: 조선어/영어 입력 전환\n· Alt+W: 창문 닫기, Alt+Q: 프로그람 끝내기' });
  }
  OS.help = help;

  OS.editItems = editItems;
  function editItems() {
    const ex = c => () => document.execCommand(c);
    return [
      { label: '되돌리기', hint: 'Ctrl+Z', action: ex('undo') },
      { label: '다시하기', hint: 'Ctrl+Y', action: ex('redo') },
      { sep: 1 },
      { label: '오려내기', hint: 'Ctrl+X', action: ex('cut') },
      { label: '복사', hint: 'Ctrl+C', action: ex('copy') },
      { label: '붙이기', hint: 'Ctrl+V', action: () => navigator.clipboard && navigator.clipboard.readText().then(t => document.execCommand('insertText', false, t)).catch(() => {}) },
      { label: '모두 선택', hint: 'Ctrl+A', action: ex('selectAll') }
    ];
  }
  OS.goItems = goItems;
  function goItems(go) {
    return [
      { label: '하드디스크', action: () => go('/') },
      { label: '홈', key: 'Alt+Shift+H', action: () => go(fs.HOME) },
      { label: '바탕화면', key: 'Alt+Shift+D', action: () => go(fs.DESKTOP) },
      { label: '문서', action: () => go(fs.DOCS) },
      { label: '내리적재', key: 'Alt+Shift+L', action: () => go(fs.HOME + '/내리적재') },
      { label: '응용프로그람', key: 'Alt+Shift+A', action: () => go(fs.APPS) },
      { sep: 1 },
      { label: '휴지통', action: () => go(fs.TRASH) }
    ];
  }
  OS.windowItems = windowItems;
  function windowItems() {
    const a = wm.active;
    return [
      { label: '최소화', key: 'Alt+M', disabled: !a, action: () => a && a.minimize() },
      { label: '확대/축소', disabled: !a, action: () => a && a.toggleMax() },
      { sep: 1 },
      { label: '모두 앞으로 가져오기', action: () => OS.windows.filter(w => a && w.app === a.app).forEach(w => wm.restore(w)) },
      ...(OS.windows.length ? [{ sep: 1 }] : []),
      ...OS.windows.filter(w => !OS.apps[w.app] || !OS.apps[w.app].hidden).map(w => ({
        label: w.title || OS.apps[w.app].name, checked: w === a, action: () => wm.restore(w)
      }))
    ];
  }

  function currentMenus() {
    const win = wm.active;
    const app = (win && OS.apps[win.app] && !OS.apps[win.app].hidden) ? OS.apps[win.app] : OS.apps.files;
    const appMenu = {
      title: app.name, bold: true, items: [
        { label: `${app.name}에 대하여`, action: () => OS.appAbout(app) },
        { sep: 1 },
        { label: '체계설정...', action: () => OS.launch('settings') },
        { sep: 1 },
        { label: `${app.name} 감추기`, key: 'Alt+H', action: () => OS.windows.filter(w => w.app === app.id).forEach(w => w.minimize()) },
        { label: '다른것 감추기', action: () => OS.windows.filter(w => w.app !== app.id).forEach(w => w.minimize()) },
        { label: '모두 보기', action: () => OS.windows.forEach(w => w.minimized && wm.restore(w)) },
        { sep: 1 },
        { label: `${app.name} 끝내기`, key: 'Alt+Q', disabled: app.id === 'files' && !OS.windows.some(w => w.app === 'files'), action: () => quitApp(app.id) }
      ]
    };
    let rest;
    try {
      rest = (win && win.menus && OS.apps[win.app] && !OS.apps[win.app].hidden) ? win.menus() : defaultMenus();
    } catch (e) {
      rest = defaultMenus();
    }
    return [{ title: '★', id: 'star', items: starMenu() }, appMenu, ...rest];
  }
  OS.currentMenus = currentMenus;

  function renderMenubar() {
    if (openTitle != null) return;
    const menus = currentMenus();
    menusEl.innerHTML = '';
    menus.slice(1).forEach((m, i) => {
      const t = OS.h(`<span class="mb-item menu${m.bold ? ' bold' : ''}" data-i="${i + 1}">${OS.esc(m.title)}</span>`);
      menusEl.appendChild(t);
    });
  }
  OS.on('focus', renderMenubar);
  OS.on('windows', renderMenubar);

  const idxOf = t => t.dataset.menu === 'star' ? 0 : +t.dataset.i;
  function openMenu(i) {
    OS.closeMenu();
    const titleEl = i === 0 ? $('#menubar .star') : menusEl.querySelector(`[data-i="${i}"]`);
    const m = currentMenus()[i];
    if (!m || !titleEl) return;
    titleEl.classList.add('open');
    openTitle = i;
    const r = titleEl.getBoundingClientRect(), s = OS.screen.getBoundingClientRect();
    OS.menu((r.left - s.left) / OS.scale, OS.MENU_H, m.items, () => {
      titleEl.classList.remove('open');
      openTitle = null;
      renderMenubar();
    }, 'menubar-dd');
  }
  $('#menubar').addEventListener('pointerdown', e => {
    const t = e.target.closest('.mb-item');
    if (!t) return;
    e.preventDefault();
    if (openTitle === idxOf(t)) { OS.closeMenu(); return; }
    openMenu(idxOf(t));
  });
  $('#menubar').addEventListener('pointerover', e => {
    const t = e.target.closest('.mb-item');
    if (t && openTitle != null && openTitle !== idxOf(t)) openMenu(idxOf(t));
  });

  function comboOf(e) {
    let k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    if (e.altKey && e.code && e.code.startsWith('Key')) k = e.code.slice(3);
    return (e.ctrlKey ? 'Ctrl+' : '') + (e.altKey ? 'Alt+' : '') + (e.shiftKey ? 'Shift+' : '') + k;
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.querySelector('.dropdown')) { OS.closeMenu(); return; }
    if (!e.ctrlKey && !e.altKey) return;
    if (document.querySelector('.modal-back')) return;
    const combo = comboOf(e);
    for (const m of currentMenus()) {
      for (const it of m.items) {
        if (it && it.key === combo && it.action && !it.disabled) {
          e.preventDefault();
          OS.closeMenu();
          it.action();
          return;
        }
      }
    }
    if (e.altKey && !e.ctrlKey) e.preventDefault();
  });

  const clock = $('#clock');
  function tick() {
    const d = new Date(), s = OS.settings;
    let h = d.getHours(), suffix = '';
    if (!s.clock24) { suffix = h < 12 ? '오전 ' : '오후 '; h = h % 12 || 12; }
    let t = suffix + OS.pad(h) + ':' + OS.pad(d.getMinutes()) + (s.seconds ? ':' + OS.pad(d.getSeconds()) : '');
    if (s.showDate) t = `${d.getMonth() + 1}월 ${d.getDate()}일 (${OS.DAYS[d.getDay()]}) ` + t;
    clock.textContent = t;
    if (d.getDate() !== tick.day) { tick.day = d.getDate(); OS.emit('day'); }
  }
  tick();
  setInterval(tick, 1000);
  OS.on('settings', tick);

  function updateVolumeIcon() {
    const mute = OS.settings.muted || OS.settings.volume === 0;
    $('.tray-vol .vol-waves').style.display = mute ? 'none' : '';
    $('.tray-vol .vol-mute').style.display = mute ? '' : 'none';
  }
  updateVolumeIcon();
  OS.on('settings', k => (k === 'volume' || k === 'muted') && updateVolumeIcon());

  function trayMenu(btn) {
    const r = btn.getBoundingClientRect(), s = OS.screen.getBoundingClientRect();
    const x = (r.left - s.left) / OS.scale;
    const kind = btn.dataset.tray;
    btn.classList.add('open');
    const done = () => btn.classList.remove('open');
    if (kind === 'clock') {
      const d = new Date();
      OS.menu(x - 120, OS.MENU_H, [
        { header: 1, label: `주체${OS.juche(d.getFullYear())}(${d.getFullYear()})년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${OS.DAYS[d.getDay()]}요일` },
        { sep: 1 },
        { label: '24시간 형식', checked: OS.settings.clock24, action: () => OS.set('clock24', !OS.settings.clock24) },
        { label: '초 표시', checked: OS.settings.seconds, action: () => OS.set('seconds', !OS.settings.seconds) },
        { label: '날자 표시', checked: OS.settings.showDate, action: () => OS.set('showDate', !OS.settings.showDate) },
        { sep: 1 },
        { label: '달력 열기', action: () => OS.launch('calendar') },
        { label: '날자와 시간 설정...', action: () => OS.launch('settings', { pane: 'datetime' }) }
      ], done);
    } else if (kind === 'volume') {
      const el = OS.menu(x - 12, OS.MENU_H, [
        { html: `<div class="vol-pop"><input type="range" min="0" max="100" value="${OS.settings.muted ? 0 : OS.settings.volume}" orient="vertical"></div>` },
        { sep: 1 },
        { label: '소리 끄기', checked: OS.settings.muted, action: () => OS.set('muted', !OS.settings.muted) },
        { label: '소리 설정...', action: () => OS.launch('settings', { pane: 'sound' }) }
      ], done);
      const range = el.querySelector('input');
      range.addEventListener('input', () => { OS.set('muted', false); OS.set('volume', +range.value); });
      range.addEventListener('change', () => OS.sound.play('pop'));
    } else if (kind === 'net') {
      OS.menu(x - 100, OS.MENU_H, [
        { header: 1, label: '광명망: 련결중' },
        { header: 1, label: '주소: 10.76.1.11' },
        { sep: 1 },
        { label: '내나라열람기 열기', action: () => OS.launch('browser', { newWindow: true }) },
        { label: '망 설정...', action: () => OS.launch('settings', { pane: 'network' }) }
      ], done);
    } else if (kind === 'ime') {
      OS.menu(x - 60, OS.MENU_H, [
        { label: '조선어 (2벌식)', checked: OS.settings.ime === 'ko', action: () => OS.set('ime', 'ko') },
        { label: 'English (U.S.)', checked: OS.settings.ime !== 'ko', action: () => OS.set('ime', 'en') },
        { sep: 1 },
        { label: '입력판 보이기', checked: !$('#ime').classList.contains('hidden'), action: () => $('#ime').classList.toggle('hidden') },
        { sep: 1 },
        { header: 1, label: '표시 언어' },
        ...OS.i18n.BUILTIN.map(l => ({ label: l.name, checked: OS.i18n.current() === l.id, action: () => OS.set('lang', l.id) })),
        { label: '다른 언어...', action: () => OS.launch('settings', { pane: 'language' }) }
      ], done);
    }
  }
  document.querySelectorAll('.tray-btn').forEach(b => b.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (b.classList.contains('open')) return OS.closeMenu();
    OS.closeMenu();
    trayMenu(b);
  }));

  const DOCK = ['files', 'browser', 'video', 'calendar', 'contacts', 'search', 'calculator', 'settings', '|', 'stack-docs', 'trash'];
  const dockIcons = $('#dock .icons');
  function iconFor(id) {
    if (id === 'trash') return fs.trash.length ? 'icons/fs-trashcan_full.png' : 'icons/trash.png';
    if (id === 'stack-docs') return OS.ICON_DOCS;
    if (id === 'calendar') return OS.calendarIcon();
    return OS.apps[id].icon;
  }
  function labelFor(id) {
    if (id === 'trash') return '휴지통';
    if (id === 'stack-docs') return '문서';
    return OS.apps[id].name;
  }
  function renderDock() {
    dockIcons.innerHTML = '';
    DOCK.forEach(id => {
      if (id === '|') return dockIcons.appendChild(OS.h('<div class="dock-sep"></div>'));
      const el = OS.h(`<div class="icon" data-app="${id}"><img src="${iconFor(id)}" draggable="false"><span class="dock-label">${OS.esc(labelFor(id))}</span></div>`);
      el.addEventListener('click', () => dockClick(id, el));
      el.addEventListener('contextmenu', e => dockMenu(e, id));
      dockIcons.appendChild(el);
    });
    applyDockSize();
    updateRunning();
  }
  function applyDockSize() {
    const s = OS.settings.dockSize;
    $('#dock').style.setProperty('--size', s + 'px');
    $('#dock').classList.toggle('magnify', OS.settings.magnify);
    const w = dockIcons.scrollWidth + 24;
    $('#dock').style.width = w + 'px';
    $('#dock').style.left = Math.round((OS.W - w) / 2 - 3) + 'px';
  }
  function updateRunning() {
    dockIcons.querySelectorAll('.icon').forEach(el => {
      const id = el.dataset.app;
      el.classList.toggle('running', !!OS.apps[id] && OS.windows.some(w => w.app === id));
    });
  }
  OS.on('windows', updateRunning);
  OS.on('settings', k => (k === 'dockSize' || k === 'magnify') && applyDockSize());
  OS.on('fs', () => { const t = dockIcons.querySelector('[data-app="trash"] img'); if (t) t.src = iconFor('trash'); });
  const refreshCal = () => { const c = dockIcons.querySelector('[data-app="calendar"] img'); if (c) c.src = iconFor('calendar'); };
  OS.on('day', refreshCal);
  OS.on('lang', () => { refreshCal(); applyDockSize(); });

  function bounce(el) {
    el.classList.remove('bounce');
    void el.offsetWidth;
    el.classList.add('bounce');
    setTimeout(() => el.classList.remove('bounce'), 700);
  }
  function dockClick(id, el) {
    if (id === 'trash') return OS.launch('files', { path: fs.TRASH });
    if (id === 'stack-docs') return stack(el);
    const list = wm.byApp(id);
    if (list.length) {
      const visible = list.filter(w => !w.minimized);
      if (!visible.length) return wm.restore(list[list.length - 1]);
      return wm.topmost(visible).focus();
    }
    bounce(el);
    setTimeout(() => OS.launch(id), 350);
  }
  function dockMenu(e, id) {
    const items = [];
    if (id === 'trash') {
      items.push({ label: '열기', action: () => OS.launch('files', { path: fs.TRASH }) });
      items.push({ label: '휴지통 비우기', disabled: !fs.trash.length, action: OS.emptyTrash });
    } else if (id === 'stack-docs') {
      items.push({ label: '화일관리기에서 열기', action: () => OS.launch('files', { path: fs.DOCS }) });
    } else {
      const list = wm.byApp(id);
      list.forEach(w => items.push({ label: w.title || OS.apps[id].name, checked: w === wm.active, action: () => wm.restore(w) }));
      if (list.length) items.push({ sep: 1 });
      items.push({ label: list.length ? '새 창문' : '열기', action: () => OS.launch(id, { newWindow: true }) });
      if (list.length) items.push({ label: '끝내기', action: () => quitApp(id) });
    }
    OS.contextMenu(e, items);
  }
  OS.emptyTrash = async () => {
    if (!fs.trash.length) return;
    if (await OS.confirm(`휴지통에 있는 항목 ${fs.trash.length}개를 영구 삭제하겠습니까?\n이 조작은 되돌릴수 없습니다.`, '휴지통 비우기')) {
      fs.emptyTrash();
      OS.sound.play('trash');
    }
  };

  function stack(iconEl) {
    const items = fs.list(fs.DOCS);
    const r = iconEl.getBoundingClientRect(), s = OS.screen.getBoundingClientRect();
    const cx = (r.left + r.width / 2 - s.left) / OS.scale;
    const pop = OS.h(`<div class="stack-pop"><div class="stack-grid">${items.length ? items.map((it, i) =>
      `<div class="stack-item" data-i="${i}"><img src="${fs.icon(it)}"><span>${OS.esc(it.name)}</span></div>`).join('') : '<div class="stack-empty">비여있음</div>'}</div>
      <div class="stack-open">화일관리기에서 열기 ➜</div></div>`);
    const done = OS.menu(0, 0, [], null, 'stack-holder');
    done.appendChild(pop);
    done.style.left = Math.max(4, Math.min(cx - 150, OS.W - 304)) + 'px';
    done.style.top = (OS.H - 100 - pop.offsetHeight) + 'px';
    pop.querySelectorAll('.stack-item').forEach(el => el.addEventListener('click', () => { OS.closeMenu(); OS.openPath(items[+el.dataset.i].path); }));
    pop.querySelector('.stack-open').addEventListener('click', () => { OS.closeMenu(); OS.launch('files', { path: fs.DOCS }); });
  }

  OS.renderDock = renderDock;

  const desk = $('#desktop');
  let deskSel = null;
  function renderDesktop() {
    desk.innerHTML = '';
    const items = [{ name: '붉은별', path: '/', type: 'dir', virtual: true }, ...fs.list(fs.DESKTOP)];
    items.forEach((it, i) => {
      const col = Math.floor(i / 6), row = i % 6;
      const el = OS.h(`<div class="desk-item" style="right:${14 + col * 92}px;top:${40 + row * 92}px"><img src="${fs.icon(it)}" draggable="false"><span>${OS.esc(it.name)}</span></div>`);
      el.addEventListener('pointerdown', e => { e.stopPropagation(); select(el, it); });
      el.addEventListener('dblclick', () => OS.openPath(it.path));
      el.addEventListener('contextmenu', e => {
        select(el, it);
        OS.contextMenu(e, [
          { label: '열기', action: () => OS.openPath(it.path) },
          ...(it.path === '/' ? [] : [
            { sep: 1 },
            { label: '이름 바꾸기...', action: () => renameItem(it.path) },
            { label: '휴지통으로 옮기기', action: () => trashItem(it.path) }
          ])
        ]);
      });
      desk.appendChild(el);
    });
  }
  function select(el, it) {
    desk.querySelectorAll('.desk-item.sel').forEach(x => x.classList.remove('sel'));
    if (el) el.classList.add('sel');
    deskSel = it;
  }
  desk.addEventListener('pointerdown', () => { select(null, null); wm.blur(); });
  desk.addEventListener('contextmenu', e => {
    if (e.target !== desk) return;
    OS.contextMenu(e, [
      { label: '새 등록부', action: () => newFolderIn(fs.DESKTOP) },
      { label: '새 문서', action: () => newDocIn(fs.DESKTOP) },
      { sep: 1 },
      { label: '바탕화면 바꾸기...', action: () => OS.launch('settings', { pane: 'desktop' }) },
      { label: '체계정보', action: OS.about }
    ]);
  });
  document.addEventListener('keydown', e => {
    if (!deskSel || wm.active || document.querySelector('.modal-back')) return;
    if (e.key === 'Enter') OS.openPath(deskSel.path);
    if (e.key === 'Delete' && deskSel.path !== '/') trashItem(deskSel.path);
  });
  OS.on('fs', renderDesktop);

  async function newFolderIn(d) {
    const name = await OS.prompt('새 등록부의 이름:', fs.unique(d, OS.t('새 등록부')));
    if (name == null) return;
    try { fs.mkdir(fs.join(d, name)); } catch (err) { OS.alert(err.message); }
  }
  async function newDocIn(d) {
    const name = await OS.prompt('새 문서의 이름:', fs.unique(d, OS.t('제목없음.txt')));
    if (name == null) return;
    try { fs.write(fs.join(d, name), ''); OS.openPath(fs.join(d, name.trim())); } catch (err) { OS.alert(err.message); }
  }
  async function renameItem(p) {
    const name = await OS.prompt('새 이름:', fs.base(p));
    if (name == null) return null;
    try { return fs.rename(p, name); } catch (err) { OS.alert(err.message); return null; }
  }
  function trashItem(p) {
    try { fs.remove(p); OS.sound.play('pop'); } catch (err) { OS.alert(err.message); }
  }
  Object.assign(OS, { newFolderIn, newDocIn, renameItem, trashItem, renderDesktop });

  const ime = $('#ime');
  OS.drag(ime.querySelector('.ime-dot'), () => true, () => ({ x: ime.offsetLeft, y: ime.offsetTop }), (p0, d) => {
    ime.style.left = Math.max(0, Math.min(OS.W - ime.offsetWidth, p0.x + d.x)) + 'px';
    ime.style.top = Math.max(0, Math.min(OS.H - 30, p0.y + d.y)) + 'px';
  });
  const imeA = ime.querySelector('.ime-a');
  const imeUpdate = () => { imeA.textContent = OS.settings.ime === 'ko' ? '가' : 'A'; imeA.classList.toggle('ko', OS.settings.ime === 'ko'); };
  imeUpdate();
  OS.on('settings', k => k === 'ime' && imeUpdate());
  ime.addEventListener('pointerdown', e => { if (!e.target.closest('.ime-dot')) e.preventDefault(); });
  imeA.addEventListener('click', () => OS.set('ime', OS.settings.ime === 'ko' ? 'en' : 'ko'));
  ime.querySelector('.ime-width').addEventListener('click', e => e.currentTarget.classList.toggle('on'));
  ime.querySelector('.ime-q').addEventListener('click', () => OS.dialog({
    title: '입력방식 도움말',
    message: '조선어 2벌식 자판으로 글을 입력합니다.\n\n· A / 가 단추 또는 Shift+Space: 조선어/영어 전환\n· 례: r k s → 간, d l f → 일\n· 붉은 점을 끌어서 입력판을 옮길수 있습니다.'
  }));

  const overlay = document.getElementById('overlay-layer');
  OS.boot = (cb) => {
    const el = OS.h(`<div class="power boot"><img src="icons/redstar.png"><div class="boot-name">붉은별</div><div class="boot-bar"><i></i></div></div>`);
    overlay.appendChild(el);
    OS.sound.play('startup');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.classList.add('fade');
      setTimeout(() => el.remove(), 400);
      cb && cb();
    };
    el.addEventListener('click', finish);
    setTimeout(finish, 2200);
  };
  OS.power = async kind => {
    if (kind === 'sleep') {
      const el = OS.h('<div class="power sleep"></div>');
      overlay.appendChild(el);
      setTimeout(() => {
        const wake = () => { el.remove(); removeEventListener('keydown', wake, true); };
        el.addEventListener('click', wake);
        addEventListener('keydown', wake, true);
      }, 400);
      return;
    }
    const msgs = {
      restart: ['지금 콤퓨터를 재시동하겠습니까?', '재시동'],
      shutdown: ['지금 콤퓨터를 끄겠습니까?', '끄기'],
      logout: ['모든 프로그람을 끝내고 가입탈퇴하겠습니까?', '가입탈퇴']
    }[kind];
    const r = await OS.dialog({ icon: 'icons/redstar.png', title: msgs[1], message: msgs[0], buttons: ['취소', msgs[1]] });
    if (r.button !== 1) return;
    OS.windows.slice().forEach(w => w.close(true));
    await OS.sound.play('logout');
    if (kind === 'restart') {
      const black = OS.h('<div class="power off"></div>');
      overlay.appendChild(black);
      setTimeout(() => { black.remove(); OS.boot(); }, 900);
    } else if (kind === 'shutdown') {
      const el = OS.h(`<div class="power off"><div class="off-msg">콤퓨터의 전원을 끄셔도 됩니다.</div><button class="power-btn" title="켜기">⏻</button></div>`);
      overlay.appendChild(el);
      el.querySelector('.power-btn').onclick = () => { el.remove(); OS.boot(); };
    } else {
      const el = OS.h(`<div class="power login"><div class="login-box"><img src="icons/user.png"><div class="login-name">${OS.esc(OS.settings.user)}</div><button class="btn default">가입</button></div>
        <div class="login-foot"><span data-k="restart">재시동</span><span data-k="shutdown">끄기</span></div></div>`);
      overlay.appendChild(el);
      el.querySelector('.btn').onclick = () => { el.classList.add('fade'); setTimeout(() => el.remove(), 400); };
      el.querySelectorAll('.login-foot span').forEach(s => s.onclick = () => {
        el.remove();
        if (s.dataset.k === 'restart') OS.boot();
        else {
          const off = OS.h(`<div class="power off"><div class="off-msg">콤퓨터의 전원을 끄셔도 됩니다.</div><button class="power-btn">⏻</button></div>`);
          overlay.appendChild(off);
          off.querySelector('.power-btn').onclick = () => { off.remove(); OS.boot(); };
        }
      });
    }
  };
})();
