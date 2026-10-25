(function () {
  'use strict';
  const W = 964, H = 732, MENU_H = 27;
  const OS = window.OS = { apps: {}, W, H, MENU_H, scale: 1 };

  OS.h = html => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  OS.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  OS.pad = n => String(n).padStart(2, '0');
  OS.juche = y => y - 1911;
  OS.DAYS = ['일', '월', '화', '수', '목', '금', '토'];

  OS.store = {
    get(k, d) {
      try { const v = localStorage.getItem('redstar.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem('redstar.' + k, JSON.stringify(v)); return true; }
      catch (e) { if (e && e.name === 'QuotaExceededError') OS.alert('기억공간이 모자랍니다. 일부 화일을 지우십시오.'); return false; }
    },
    clear() {
      try { Object.keys(localStorage).filter(k => k.startsWith('redstar.')).forEach(k => localStorage.removeItem(k)); } catch (e) {}
    }
  };

  const handlers = {};
  OS.on = (ev, fn) => (handlers[ev] = handlers[ev] || []).push(fn);
  OS.emit = (ev, d) => (handlers[ev] || []).slice().forEach(fn => fn(d));

  OS.settings = Object.assign({
    wallpaper: 'color:#3a5a30', clock24: true, seconds: false, showDate: false,
    volume: 70, muted: false, dockSize: 58, magnify: true, user: '사용자', ime: 'en', lang: 'kp', sysSounds: true, uiSounds: true
  }, OS.store.get('settings', {}));
  OS.set = (k, v) => { OS.settings[k] = v; OS.store.set('settings', OS.settings); OS.emit('settings', k); };

  const screen = OS.screen = document.getElementById('screen');
  function fit() {
    OS.scale = Math.min(innerWidth / W, innerHeight / H);
    screen.style.transform = `scale(${OS.scale}) translate(-50%, -50%)`;
  }
  addEventListener('resize', fit);
  fit();
  OS.local = e => {
    const r = screen.getBoundingClientRect();
    return { x: (e.clientX - r.left) / OS.scale, y: (e.clientY - r.top) / OS.scale };
  };
  const overlay = document.getElementById('overlay-layer');

  OS.svgURI = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const monthLabel = d => {
    const I = OS.i18n, id = I && I.current();
    if (!id || id === 'kp' || I.info(id).noIntl) return `${d.getMonth() + 1}월`;
    try { return new Intl.DateTimeFormat(I.info(id).locale, { month: 'short' }).format(d).replace('.', ''); }
    catch (e) { return `${d.getMonth() + 1}`; }
  };
  OS.calendarIcon = (d = new Date()) => OS.svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect x="8" y="10" width="48" height="48" rx="3" fill="#fff" stroke="#aaa"/>
    <rect x="8" y="10" width="48" height="16" rx="3" fill="#5daa2f"/><rect x="8" y="22" width="48" height="4" fill="#5daa2f"/>
    <g fill="#ccc"><circle cx="16" cy="9" r="2.5"/><circle cx="26" cy="9" r="2.5"/><circle cx="38" cy="9" r="2.5"/><circle cx="48" cy="9" r="2.5"/></g>
    <g stroke="#555" stroke-width="1.5"><path d="M16 5v6M26 5v6M38 5v6M48 5v6"/></g>
    <text x="32" y="22" text-anchor="middle" font-size="11" fill="#fff" font-weight="bold" font-family="sans-serif">${OS.esc(monthLabel(d))}</text>
    <text x="32" y="52" text-anchor="middle" font-size="25" fill="#222" font-family="sans-serif">${d.getDate()}</text></svg>`);
  OS.ICON_DOCS = OS.svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9e08a"/><stop offset="1" stop-color="#6fae3c"/></linearGradient></defs>
    <path d="M4 16h20l4 5h32v35H4z" fill="#86c04f"/><path d="M4 26h56v30H4z" fill="url(#g)"/>
    <rect x="24" y="14" width="16" height="18" fill="#fff" stroke="#999"/><path d="M33 10l3 22h-4z" fill="#3a8f3a"/><path d="M38 12l-6 22h3z" fill="#e2a52a"/></svg>`);
  OS.ICON_DOC = OS.svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <path d="M14 4h26l12 12v44H14z" fill="#fff" stroke="#999" stroke-width="1.5"/><path d="M40 4v12h12" fill="#e8e8e8" stroke="#999" stroke-width="1.5"/>
    <g stroke="#9ab" stroke-width="2"><path d="M20 24h26M20 30h26M20 36h26M20 42h20M20 48h24"/></g></svg>`);
  OS.ICON_FILE = OS.svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <path d="M14 4h26l12 12v44H14z" fill="#f4f4f4" stroke="#999" stroke-width="1.5"/><path d="M40 4v12h12" fill="#ddd" stroke="#999" stroke-width="1.5"/></svg>`);
  OS.ICON_DISK = OS.svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f2f2"/><stop offset="1" stop-color="#a9a9a9"/></linearGradient></defs>
    <rect x="6" y="18" width="52" height="30" rx="4" fill="url(#d)" stroke="#666"/><rect x="10" y="38" width="44" height="5" rx="2" fill="#555"/>
    <circle cx="50" cy="26" r="2" fill="#4c4"/><text x="30" y="32" text-anchor="middle" font-size="9" fill="#c00" font-family="sans-serif">★</text></svg>`);

  const HOME = '/사용자/홈';
  const dir = children => ({ type: 'dir', children: children || {} });
  const file = content => ({ type: 'file', content, mtime: Date.now() });
  const img = url => ({ type: 'file', url, mtime: Date.now() });
  const README = [
    'Red Star OS 3.0 - fan recreation',
    '',
    'Made by https://github.com/adrenaline91',
    '',
    'Work in progress: not all the features of the real Red Star OS are here yet. I\'m still working on it.',
    '',
    'This is just a cool fan project: a recreation of the Red Star OS 3.0 desktop in HTML, CSS and JavaScript.',
    '',
    'It is a tech and curiosity project only. It has no political purpose and is not meant to hurt, offend, provoke or support any country, government or people.',
    '',
    'Not affiliated with the Korea Computer Center or any official organization. Icons and wallpapers belong to their respective owners.',
    ''
  ].join('\n');
  const defaultFS = () => dir({
    '사용자': dir({ '홈': dir({
      '바탕화면': dir({ 'README.txt': file(README) }),
      '문서': dir({
        '환영합니다.txt': file('붉은별 조작체계\n판본 3.0\n\n이 문서는 본문편집기로 편집할수 있습니다.\n'),
        '할일.txt': file('- 달력에 일정 추가하기\n- 주소록 정리하기\n- 바탕화면 바꾸기\n')
      }),
      '내리적재': dir(),
      '동영상': dir(),
      '음악': dir(),
      '그림': dir({
        '더 높이 날아라.jpg': img('wallpapers/wp1.jpg'),
        '민들레.jpg': img('wallpapers/wp2.jpg'),
        '백두산천지.jpg': img('wallpapers/wp3.jpg'),
        '푸른 하늘.jpg': img('wallpapers/wp4.jpg'),
        '풍경화.jpg': img('wallpapers/wp5.jpg')
      })
    }) })
  });

  const SPECIAL = {
    [HOME]: 'icons/fs-folder_home.png', [HOME + '/문서']: 'icons/fs-home-Documents.png',
    [HOME + '/내리적재']: 'icons/fs-home-Download.png', [HOME + '/동영상']: 'icons/fs-home-Movies.png',
    [HOME + '/음악']: 'icons/fs-home-Music.png', [HOME + '/그림']: 'icons/fs-home-Pictures.png',
    [HOME + '/바탕화면']: 'icons/fs-desktop.png', '/응용프로그람': 'icons/fs-applications.png', '/': OS.ICON_DISK
  };

  const fs = OS.fs = {
    HOME, APPS: '/응용프로그람', TRASH: 'trash:', DESKTOP: HOME + '/바탕화면', DOCS: HOME + '/문서',
    root: OS.store.get('fs', null) || defaultFS(),
    trash: OS.store.get('trash', []),
    save() { OS.store.set('fs', this.root); OS.store.set('trash', this.trash); OS.emit('fs'); },
    parts: p => p.split('/').filter(Boolean),
    join: (d, n) => (d === '/' ? '' : d) + '/' + n,
    parent(p) { const a = this.parts(p); a.pop(); return '/' + a.join('/'); },
    base(p) { const a = this.parts(p); return a[a.length - 1] || '/'; },
    resolve(p, cwd) {
      if (p === '~' || p.startsWith('~/')) p = HOME + p.slice(1);
      const out = [];
      for (const x of (p.startsWith('/') ? p : (cwd || HOME) + '/' + p).split('/')) {
        if (!x || x === '.') continue;
        if (x === '..') out.pop(); else out.push(x);
      }
      return '/' + out.join('/');
    },
    get(p) {
      let n = this.root;
      for (const x of this.parts(p)) {
        if (!n || n.type !== 'dir') return null;
        n = n.children[x];
      }
      return n || null;
    },
    exists(p) { return p === this.APPS || !!this.get(p); },
    isDir(p) { if (p === this.APPS) return true; const n = this.get(p); return !!n && n.type === 'dir'; },
    list(p) {
      if (p === this.APPS) {
        return Object.values(OS.apps).map(a => ({ name: a.name, path: this.APPS + '/' + a.name, type: 'app', app: a.id }))
          .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      }
      const n = this.get(p);
      if (!n || n.type !== 'dir') return [];
      const items = Object.keys(n.children).map(k => ({ name: k, path: this.join(p, k), type: n.children[k].type, node: n.children[k] }));
      if (p === '/') items.push({ name: '응용프로그람', path: this.APPS, type: 'dir', virtual: true });
      return items.sort((a, b) => (a.type === 'dir' ? 0 : 1) - (b.type === 'dir' ? 0 : 1) || a.name.localeCompare(b.name, 'ko'));
    },
    checkName(name) {
      name = (name || '').trim();
      if (!name || name.includes('/') || name === '.' || name === '..') throw new Error('리용할수 없는 이름입니다.');
      return name;
    },
    dirOf(p) {
      const d = this.get(this.parent(p));
      if (!d || d.type !== 'dir') throw new Error('등록부가 없습니다: ' + this.parent(p));
      return d;
    },
    read(p) { const n = this.get(p); return n && n.type === 'file' ? (n.content || '') : null; },
    write(p, content) {
      const d = this.dirOf(p), name = this.checkName(this.base(p));
      const old = d.children[name];
      if (old && old.type === 'dir') throw new Error('같은 이름의 등록부가 있습니다.');
      d.children[name] = Object.assign(old || { type: 'file' }, { content, mtime: Date.now() });
      this.save();
    },
    put(p, node) {
      const d = this.dirOf(p);
      d.children[this.checkName(this.base(p))] = Object.assign(node, { mtime: Date.now() });
      this.save();
    },
    mkdir(p) {
      const d = this.dirOf(p), name = this.checkName(this.base(p));
      if (d.children[name]) throw new Error('같은 이름이 이미 있습니다.');
      d.children[name] = dir();
      this.save();
    },
    unique(d, base) {
      const n = this.get(d);
      if (!n || !n.children[base]) return base;
      const m = base.match(/^(.*?)(\.[^.]*)?$/);
      let i = 2;
      while (n.children[`${m[1]} ${i}${m[2] || ''}`]) i++;
      return `${m[1]} ${i}${m[2] || ''}`;
    },
    rename(p, name) {
      name = this.checkName(name);
      const d = this.dirOf(p), old = this.base(p);
      if (name === old) return p;
      if (d.children[name]) throw new Error('같은 이름이 이미 있습니다.');
      d.children[name] = d.children[old];
      delete d.children[old];
      this.save();
      return this.join(this.parent(p), name);
    },
    move(p, destDir) {
      const d = this.dirOf(p), name = this.base(p), dest = this.get(destDir);
      if (!dest || dest.type !== 'dir') throw new Error('등록부가 없습니다.');
      if ((destDir + '/').startsWith(p + '/')) throw new Error('등록부를 자기 안으로 옮길수 없습니다.');
      const n = this.unique(destDir, name);
      dest.children[n] = d.children[name];
      delete d.children[name];
      this.save();
      return this.join(destDir, n);
    },
    remove(p) {
      if (p === HOME || !p.startsWith(HOME + '/')) throw new Error('이 항목은 지울수 없습니다.');
      const d = this.dirOf(p), name = this.base(p), n = d.children[name];
      if (!n) return;
      this.trash.push({ name, from: this.parent(p), node: n, at: Date.now() });
      delete d.children[name];
      this.save();
    },
    restore(i) {
      const t = this.trash[i];
      const to = this.isDir(t.from) ? t.from : HOME;
      this.get(to).children[this.unique(to, t.name)] = t.node;
      this.trash.splice(i, 1);
      this.save();
    },
    purge(i) { this.trash.splice(i, 1); this.save(); },
    emptyTrash() { this.trash = []; this.save(); },
    walk(p, fn) {
      for (const it of this.list(p)) {
        fn(it);
        if (it.type === 'dir' && !it.virtual) this.walk(it.path, fn);
      }
    },
    size(node) {
      if (!node) return 0;
      if (node.type === 'dir') return Object.values(node.children).reduce((s, c) => s + this.size(c), 0);
      return (node.content || '').length;
    },
    kind(name, node) {
      if (node && node.type === 'dir') return 'dir';
      const ext = (name.split('.').pop() || '').toLowerCase();
      if (/^(png|jpe?g|gif|webp|bmp|svg)$/.test(ext)) return 'image';
      if (/^(mp4|webm|ogv|mov|mkv|mp3|ogg|wav|m4a)$/.test(ext)) return 'media';
      return 'text';
    },
    kindName(it) {
      if (it.type === 'app') return '프로그람';
      return { dir: '등록부', image: '그림', media: '동영상', text: '본문문서' }[this.kind(it.name, it.node || this.get(it.path))];
    },
    icon(it) {
      if (it.type === 'app') return OS.apps[it.app].icon;
      if (it.type === 'dir') return SPECIAL[it.path] || 'icons/fs-folder.png';
      const node = it.node || this.get(it.path), k = this.kind(it.name, node);
      if (k === 'image') return node && (node.url || node.content) || OS.ICON_FILE;
      if (k === 'media') return 'icons/video.png';
      return OS.ICON_DOC;
    }
  };
  fs.SPECIAL = SPECIAL;
  (() => {
    const desk = fs.get(fs.DESKTOP);
    if (desk && desk.type === 'dir' && desk.children['읽어보시오.txt']) {
      delete desk.children['읽어보시오.txt'];
      if (!desk.children['README.txt']) desk.children['README.txt'] = file(README);
      fs.save();
    }
  })();
  fs.reset = () => { fs.root = defaultFS(); fs.trash = []; fs.save(); };

  OS.openPath = (path, opts = {}) => {
    if (path.startsWith(fs.APPS + '/')) {
      const app = Object.values(OS.apps).find(a => a.name === fs.base(path));
      return app && OS.launch(app.id);
    }
    if (fs.isDir(path)) return OS.launch('files', { path, newWindow: opts.newWindow });
    const node = fs.get(path);
    if (!node) return OS.alert('화일을 찾을수 없습니다:\n' + path);
    const k = fs.kind(fs.base(path), node);
    if (k === 'image') return OS.launch('viewer', { path });
    if (k === 'media') return OS.launch('video', { path });
    return OS.launch('editor', { path });
  };

  OS.launch = (id, opts) => {
    const app = OS.apps[id];
    if (!app) return null;
    const win = app.launch(opts || {});
    OS.emit('focus', OS.wm.active);
    return win;
  };
  OS.register = app => { OS.apps[app.id] = app; };

  const layer = document.getElementById('windows');
  const wins = OS.windows = [];
  let zTop = 10, cascade = 0, uid = 0;

  const wm = OS.wm = {
    active: null,
    open(o) {
      const el = OS.h(`<div class="win ${o.cls || ''}">
        <div class="win-title"><div class="lights"><span class="light red" title="닫기"></span><span class="light yellow" title="최소화"></span><span class="light green" title="확대"></span></div><div class="win-name"></div></div>
        <div class="win-body"></div>${o.resizable === false ? '' : '<div class="win-grip"></div>'}</div>`);
      const win = {
        id: ++uid, app: o.app, el, body: el.querySelector('.win-body'), title: '',
        menus: o.menus || null, onClose: o.onClose, onResize: o.onResize, minimized: false, maximized: false,
        minW: o.minW || 260, minH: o.minH || 160, data: {}
      };
      const w = o.w || 600, h = o.h || 400;
      const x = o.x != null ? o.x : Math.max(0, Math.round((W - w) / 2) - 90 + (cascade % 7) * 26);
      const y = o.y != null ? o.y : Math.max(MENU_H, Math.min(H - h - 90, 60) + (cascade % 7) * 22);
      cascade++;
      Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
      win.setTitle = t => { win.title = t; el.querySelector('.win-name').textContent = t; if (wm.active === win) OS.emit('focus', win); };
      win.setTitle(o.title || '');
      win.close = force => close(win, force);
      win.focus = () => focus(win);
      win.minimize = () => minimize(win);
      win.toggleMax = () => toggleMax(win);
      if (o.body) typeof o.body === 'string' ? (win.body.innerHTML = o.body) : win.body.appendChild(o.body);
      if (o.noMax) el.querySelector('.light.green').classList.add('off');

      el.querySelector('.light.red').addEventListener('click', () => close(win));
      el.querySelector('.light.yellow').addEventListener('click', () => minimize(win));
      el.querySelector('.light.green').addEventListener('click', () => { if (!o.noMax) toggleMax(win); });
      el.addEventListener('pointerdown', () => { if (wm.active !== win) focus(win); }, true);

      const title = el.querySelector('.win-title');
      drag(title, e => !e.target.closest('.light'), () => ({ x: el.offsetLeft, y: el.offsetTop }), (p0, d) => {
        if (win.maximized) { win.maximized = false; el.classList.remove('maxed'); }
        el.style.left = Math.round(p0.x + d.x) + 'px';
        el.style.top = Math.min(H - 30, Math.max(MENU_H, Math.round(p0.y + d.y))) + 'px';
      });
      title.addEventListener('dblclick', e => { if (!e.target.closest('.light') && !o.noMax) toggleMax(win); });
      const grip = el.querySelector('.win-grip');
      if (grip) {
        drag(grip, () => true, () => ({ x: el.offsetWidth, y: el.offsetHeight }), (p0, d) => {
          el.style.width = Math.max(win.minW, Math.round(p0.x + d.x)) + 'px';
          el.style.height = Math.max(win.minH, Math.round(p0.y + d.y)) + 'px';
          win.onResize && win.onResize();
        });
      }

      layer.appendChild(el);
      wins.push(win);
      el.classList.add('opening');
      setTimeout(() => el.classList.remove('opening'), 180);
      focus(win);
      OS.emit('windows');
      return win;
    },
    byApp: id => wins.filter(w => w.app === id),
    topmost(list = wins) { return list.filter(w => !w.minimized).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0] || null; },
    blur() { wins.forEach(w => w.el.classList.remove('active')); wm.active = null; OS.emit('focus', null); },
    restore(win) { if (win.minimized) { win.minimized = false; win.el.style.display = ''; win.el.classList.add('opening'); setTimeout(() => win.el.classList.remove('opening'), 180); OS.emit('windows'); } focus(win); }
  };

  function drag(handle, ok, start, move) {
    handle.addEventListener('pointerdown', e => {
      if (e.button !== 0 || !ok(e)) return;
      e.preventDefault();
      const s = OS.local(e), p0 = start();
      handle.setPointerCapture(e.pointerId);
      document.body.classList.add('dragging');
      const mv = ev => { const p = OS.local(ev); move(p0, { x: p.x - s.x, y: p.y - s.y }); };
      const up = () => {
        handle.removeEventListener('pointermove', mv);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
        document.body.classList.remove('dragging');
      };
      handle.addEventListener('pointermove', mv);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    });
  }
  OS.drag = drag;

  function focus(win) {
    if (win.minimized) return wm.restore(win);
    win.el.style.zIndex = ++zTop;
    wins.forEach(w => w.el.classList.toggle('active', w === win));
    wm.active = win;
    OS.emit('focus', win);
  }
  function close(win, force) {
    if (!force && win.onClose && win.onClose() === false) return;
    const i = wins.indexOf(win);
    if (i < 0) return;
    if (!force && OS.sound) OS.sound.play('close');
    wins.splice(i, 1);
    win.el.classList.add('closing');
    setTimeout(() => win.el.remove(), 140);
    if (wm.active === win) { const next = wm.topmost(); next ? focus(next) : wm.blur(); }
    OS.emit('windows');
  }
  function minimize(win) {
    if (OS.sound) OS.sound.play('minimize');
    const target = document.querySelector(`#dock .icon[data-app="${win.app}"]`);
    const el = win.el;
    if (target) {
      const r = target.getBoundingClientRect(), s = screen.getBoundingClientRect();
      const tx = (r.left + r.width / 2 - s.left) / OS.scale - (el.offsetLeft + el.offsetWidth / 2);
      const ty = (r.top + r.height / 2 - s.top) / OS.scale - (el.offsetTop + el.offsetHeight / 2);
      el.style.transition = 'transform .28s ease-in, opacity .28s ease-in';
      el.style.transform = `translate(${tx}px, ${ty}px) scale(.05)`;
      el.style.opacity = '0';
    }
    setTimeout(() => {
      el.style.display = 'none';
      el.style.transition = el.style.transform = el.style.opacity = '';
    }, target ? 280 : 0);
    win.minimized = true;
    if (wm.active === win) { const next = wm.topmost(); next ? focus(next) : wm.blur(); }
    OS.emit('windows');
  }
  function toggleMax(win) {
    if (OS.sound) OS.sound.play('maximize');
    const el = win.el;
    if (!win.maximized) {
      win.prev = { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height };
      Object.assign(el.style, { left: '0px', top: MENU_H + 'px', width: W + 'px', height: (H - MENU_H) + 'px' });
    } else {
      Object.assign(el.style, win.prev);
    }
    win.maximized = !win.maximized;
    el.classList.add('animating');
    setTimeout(() => el.classList.remove('animating'), 200);
    win.onResize && setTimeout(win.onResize, 210);
  }

  let openMenuEl = null, openMenuClose = null;
  OS.closeMenu = () => {
    if (openMenuEl) { openMenuEl.remove(); openMenuEl = null; }
    if (openMenuClose) { const f = openMenuClose; openMenuClose = null; f(); }
  };
  OS.menu = (x, y, items, onClose, cls) => {
    OS.closeMenu();
    const el = OS.h(`<div class="dropdown ${cls || ''}"></div>`);
    items.forEach(it => {
      if (!it) return;
      if (it.sep) return el.appendChild(OS.h('<div class="dd-sep"></div>'));
      if (it.html) return el.appendChild(OS.h(`<div class="dd-html">${it.html}</div>`));
      const row = OS.h(`<div class="dd-item${it.disabled ? ' disabled' : ''}${it.header ? ' header' : ''}">
        <span class="dd-check">${it.checked ? '✓' : ''}</span>
        ${it.icon ? `<img class="dd-icon" src="${it.icon}">` : ''}
        <span class="dd-label">${OS.esc(it.label)}</span><span class="dd-key">${OS.esc(it.key || it.hint || '')}</span></div>`);
      if (!it.disabled && !it.header) {
        row.addEventListener('mouseup', e => {
          if (e.button === 2 && !it.allowRight) return;
          OS.closeMenu();
          it.action && it.action();
        });
      }
      el.appendChild(row);
    });
    overlay.appendChild(el);
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = Math.max(0, Math.min(x, W - w - 2)) + 'px';
    el.style.top = Math.max(MENU_H, Math.min(y, H - h - 2)) + 'px';
    openMenuEl = el;
    openMenuClose = onClose || null;
    return el;
  };
  OS.contextMenu = (e, items) => {
    e.preventDefault();
    e.stopPropagation();
    const p = OS.local(e);
    OS.menu(p.x, p.y, items);
  };
  document.addEventListener('pointerdown', e => {
    if (openMenuEl && !openMenuEl.contains(e.target) && !e.target.closest('.mb-item, .tray-btn')) OS.closeMenu();
  }, true);
  addEventListener('blur', () => OS.closeMenu());

  OS.dialog = o => new Promise(resolve => {
    const buttons = o.buttons || ['확인'];
    const def = o.default != null ? o.default : buttons.length - 1;
    const cancel = o.cancel != null ? o.cancel : (buttons.length > 1 ? 0 : def);
    const back = OS.h('<div class="modal-back"></div>');
    const dlg = OS.h(`<div class="dialog">
      <img class="dlg-icon" src="${o.icon || 'icons/redstar.png'}">
      <div class="dlg-main">
        ${o.title ? `<div class="dlg-title">${OS.esc(o.title)}</div>` : ''}
        <div class="dlg-msg">${OS.esc(o.message || '').replace(/\n/g, '<br>')}</div>
        ${o.input != null ? `<input class="dlg-input" type="text" spellcheck="false">` : ''}
        <div class="dlg-btns">${buttons.map((b, i) => `<button class="btn${i === def ? ' default' : ''}" data-i="${i}">${OS.esc(b)}</button>`).join('')}</div>
      </div></div>`);
    back.appendChild(dlg);
    overlay.appendChild(back);
    if (o.input == null && OS.sound) OS.sound.play(o.sound || (buttons.length > 1 ? 'question' : 'message'));
    const input = dlg.querySelector('.dlg-input');
    const done = i => {
      back.remove();
      document.removeEventListener('keydown', key, true);
      resolve({ button: i, value: input ? input.value : null });
    };
    const key = e => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); done(def); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(cancel); }
    };
    document.addEventListener('keydown', key, true);
    dlg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => done(+b.dataset.i)));
    if (input) {
      input.value = o.input;
      setTimeout(() => { input.focus(); const dot = o.input.lastIndexOf('.'); input.setSelectionRange(0, dot > 0 ? dot : o.input.length); });
    } else setTimeout(() => dlg.querySelector('.btn.default').focus());
  });
  OS.alert = (message, title) => OS.dialog({ title, message });
  OS.confirm = (message, ok = '확인', title) => OS.dialog({ title, message, buttons: ['취소', ok] }).then(r => r.button === 1);
  OS.prompt = (message, value = '', title) => OS.dialog({ title, message, input: value, buttons: ['취소', '확인'] }).then(r => r.button === 1 ? r.value : null);

  OS.formatDate = (t, withTime = true) => {
    const d = new Date(t);
    return `${d.getFullYear()}.${OS.pad(d.getMonth() + 1)}.${OS.pad(d.getDate())}` + (withTime ? ` ${OS.pad(d.getHours())}:${OS.pad(d.getMinutes())}` : '');
  };
  OS.formatSize = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
})();
