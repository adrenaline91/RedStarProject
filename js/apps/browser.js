(function () {
  'use strict';
  const HOME = 'about:home', INFO = 'about:info';
  const ELECTRON = !!window.rsElectron;
  const CLOUD = !ELECTRON && window.RS_CLOUD && window.RS_CLOUD.endpoint ? window.RS_CLOUD.endpoint.replace(/\/+$/, '') : '';
  const cloudIds = new Set();
  const SEARCH = q => ELECTRON
    ? 'https://www.google.com/search?q=' + encodeURIComponent(q)
    : 'https://ko.wikipedia.org/w/index.php?search=' + encodeURIComponent(q);

  const SPINNER = `<svg class="spinner spin" viewBox="0 0 16 16">${
    Array.from({ length: 8 }, (_, i) =>
      `<rect x="7.2" y="1" width="1.6" height="4.2" rx=".8" fill="#555" opacity="${(0.25 + i * 0.1).toFixed(2)}" transform="rotate(${i * 45} 8 8)"/>`
    ).join('')}</svg>`;
  const FAVICON = `<svg class="fav" viewBox="0 0 16 16"><path d="M3 1.5h7l3 3v10H3z" fill="#fff" stroke="#999"/><path d="M10 1.5v3h3" fill="#eee" stroke="#999"/></svg>`;
  const STARFAV = `<svg class="fav" viewBox="0 0 16 16"><path d="M8 1l2 5h5l-4 3 1.6 5L8 11l-4.6 3L5 9 1 6h5z" fill="#e2231a"/></svg>`;

  let bookmarks = OS.store.get('bookmarks', []);
  const TILES = [{ title: '위키백과', url: 'https://ko.wikipedia.org/' }, { title: '쏘프트웨어 정보', url: INFO }];
  let visits = OS.store.get('history', []);
  const saveBookmarks = () => { OS.store.set('bookmarks', bookmarks); OS.emit('bookmarks'); };

  function normalize(u) {
    u = (u || '').trim();
    if (!u) return '';
    if (/^about:/i.test(u)) return u.toLowerCase();
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) return u;
    if (/^localhost(:\d+)?(\/|$)/i.test(u)) return 'http://' + u;
    if (/\s/.test(u) || !/[.:]/.test(u)) return SEARCH(u);
    return 'https://' + u;
  }

  const pageStyle = `body{margin:0;font-family:"Nanum Gothic","Malgun Gothic",sans-serif;background:linear-gradient(#fff,#eef3f8);color:#222;text-align:center;min-height:100vh}
    body{min-height:0;height:100vh;overflow:auto;box-sizing:border-box;padding-top:60px}
    .logo{font-size:64px;color:#e2231a;text-shadow:0 2px 6px rgba(200,0,0,.3)}
    h1{font-size:30px;margin:4px 0 22px;letter-spacing:4px;color:#1a3f8a}
    form{display:flex;justify-content:center;gap:6px}
    input{width:380px;height:28px;border:1px solid #9ab;border-radius:3px;padding:0 8px;font-size:15px}
    button{height:30px;padding:0 16px;border:1px solid #4a76b8;border-radius:3px;background:linear-gradient(#cfe2fb,#7eaaea);font-size:14px}
    .tiles{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin:34px auto;max-width:560px}
    .tiles a{width:120px;padding:14px 6px;border:1px solid #cdd6e0;border-radius:6px;background:#fff;color:#1a3f8a;text-decoration:none;font-size:13px;box-shadow:0 1px 3px rgba(0,0,0,.1);word-break:break-all}
    .tiles a:hover{border-color:#5c8fdc}
    .foot{color:#999;font-size:12px;margin-top:40px}
    table{margin:20px auto;border-collapse:collapse;font-size:14px;text-align:left}td{padding:5px 12px;border-bottom:1px solid #dde}`;
  const startPage = () => `<!doctype html><meta charset="utf-8"><title>시작페지</title><style>${pageStyle}</style>
    <div class="logo">★</div><h1>내나라</h1>
    <form><input name="q" placeholder="내나라 웹페지검색" autocomplete="off"><button>검색</button></form>
    <div class="tiles">${(bookmarks.length ? bookmarks : TILES).map(b => `<a href="${OS.esc(b.url)}">${OS.esc(b.title)}</a>`).join('')}</div>
    <p class="foot">내나라열람기 3.0 · 책갈피를 추가하면 여기에 나타납니다</p>`;
  const infoPage = () => `<!doctype html><meta charset="utf-8"><title>쏘프트웨어 정보</title><style>${pageStyle}</style>
    <div class="logo">★</div><h1>쏘프트웨어 정보</h1>
    <table><tr><td>프로그람</td><td>내나라열람기</td></tr><tr><td>판본</td><td>3.0</td></tr>
    <tr><td>기반</td><td>Mozilla Firefox</td></tr><tr><td>조작체계</td><td>붉은별 3.0</td></tr>
    <tr><td>망주소</td><td>10.76.1.11</td></tr></table>
    <p class="foot">이 쏘프트웨어는 최신판본입니다.</p>`;

  const BODY = `<div class="browser">
    <div class="br-toolbar">
      <div class="seg">
        <button class="tb seg-l b-back" title="뒤로"><svg viewBox="0 0 10 10"><path d="M7 1L2 5l5 4z" fill="#555"/></svg></button>
        <button class="tb seg-m b-fwd" title="앞으로"><svg viewBox="0 0 10 10"><path d="M3 1l5 4-5 4z" fill="#555"/></svg></button>
        <button class="tb seg-r b-hist" title="방문기록"><svg viewBox="0 0 8 8"><path d="M1 2h6L4 6z" fill="#555"/></svg></button>
      </div>
      <button class="tb single b-reload" title="다시 읽기"><svg viewBox="0 0 16 16"><path d="M13 8a5 5 0 1 1-1.6-3.7" fill="none" stroke="#555" stroke-width="1.8"/><path d="M9.5 1.8l3.6 2.2-3 2.6z" fill="#555"/></svg></button>
      <button class="tb single b-stop" title="중지"><svg viewBox="0 0 16 16"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="#222" stroke-width="2.4"/></svg></button>
      <button class="tb single b-home" title="홈"><svg viewBox="0 0 16 16"><path d="M8 1.5L1 8h2v6h4v-4h2v4h4V8h2z" fill="#222"/></svg></button>
      <div class="br-url">
        <span class="favicon"><svg viewBox="0 0 16 16"><path d="M3 1.5h7l3 3v10H3z" fill="#fff" stroke="#bbb"/><path d="M10 1.5v3h3" fill="#eee" stroke="#bbb"/></svg></span>
        <input class="br-input" type="text" spellcheck="false" autocomplete="off">
        <span class="go" title="가기"><svg viewBox="0 0 14 14"><path d="M2 1l11 6-11 6z" fill="#5c9ae0" stroke="#3a77bf" stroke-width=".8"/></svg></span>
        <span class="drop" title="방문기록"><svg viewBox="0 0 10 8"><path d="M1 1h8L5 7z" fill="#444"/></svg></span>
      </div>
      <span class="grip-dot">·</span>
      <div class="br-search">
        <span class="engine"><svg viewBox="0 0 20 12"><rect width="20" height="12" fill="#024fa2"/><rect y="2" width="20" height="8" fill="#fff"/><rect y="2.6" width="20" height="6.8" fill="#ed1c27"/><circle cx="7" cy="6" r="2.6" fill="#fff"/><path d="M7 3.9l.6 1.6h1.7l-1.4 1 .5 1.7L7 7.2 5.6 8.2l.5-1.7-1.4-1h1.7z" fill="#ed1c27"/></svg><svg class="tri" viewBox="0 0 8 6"><path d="M0 0h8L4 6z" fill="#333"/></svg></span>
        <input class="br-q" type="text" placeholder="내나라 웹페지검색" spellcheck="false">
        <svg class="mag" viewBox="0 0 14 14"><circle cx="5.5" cy="5.5" r="4" fill="none" stroke="#333" stroke-width="1.6"/><path d="M8.5 8.5l4 4" stroke="#333" stroke-width="2"/></svg>
      </div>
    </div>
    <div class="br-bookmarks">
      <span class="bm bm-recent"><svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" fill="#d9eef7" stroke="#6aa"/><path d="M7 3v4l3 2" stroke="#4a8" stroke-width="1.4" fill="none"/></svg>최근방문목록<svg class="tri" viewBox="0 0 8 6"><path d="M0 0h8L4 6z" fill="#333"/></svg></span>
      <span class="bm-list"></span>
    </div>
    <div class="br-tabbar">
      <div class="br-tabs"></div>
      <button class="br-newtab" title="새 탭"><svg viewBox="0 0 12 12"><path d="M6 1v10M1 6h10" stroke="#5f8fd6" stroke-width="2.2"/></svg></button>
      <button class="br-tablist" title="탭 목록"><svg viewBox="0 0 16 12"><path d="M1 2h14M1 5h14" stroke="#333" stroke-width="1.4"/><path d="M4 7.5h8L8 11.5z" fill="#333"/></svg></button>
    </div>
    <div class="br-info">
      <span class="info-ico">i</span>
      <span class="info-text">쏘프트웨어 정보</span>
      <button class="info-btn">읽기(K)</button>
      <button class="info-close" title="닫기">✕</button>
    </div>
    <div class="br-content"></div>
    <div class="br-status">
      <span class="br-status-text">완료</span>
      <span class="sb-progress"><i></i></span>
    </div>
  </div>`;

  function createWindow(opts) {
    const body = OS.h(BODY);
    const q = s => body.querySelector(s);
    const ctx = { tabs: [], active: null };
    const win = OS.wm.open({
      app: 'browser', title: '내나라열람기', body, cls: 'browser-win unified',
      x: opts.x, y: opts.y, w: opts.w || 760, h: opts.h || 560, minW: 460, minH: 260,
      menus: () => menus(ctx)
    });
    ctx.win = win;
    win.ctx = ctx;
    const urlInput = q('.br-input'), status = q('.br-status-text'), tabsEl = q('.br-tabs'), content = q('.br-content');

    function makeTab(url, background) {
      const el = OS.h(`<div class="tab">${FAVICON}<span class="label">새 탭</span><span class="close" title="탭 닫기">✕</span></div>`);
      const frame = document.createElement('iframe');
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
      content.appendChild(frame);
      const tab = { el, frame, web: null, mode: 'frame', url: '', typed: '', title: '', history: [], hi: -1, loading: false, started: false };
      ctx.tabs.push(tab);
      tabsEl.appendChild(el);
      el.addEventListener('mousedown', e => { if (!e.target.classList.contains('close')) select(tab); });
      el.addEventListener('auxclick', e => { if (e.button === 1) closeTab(tab); });
      el.querySelector('.close').addEventListener('click', () => closeTab(tab));
      frame.addEventListener('load', () => { if (tab.started && tab.mode === 'frame') loaded(tab); });
      if (!background) select(tab);
      if (url) navigate(tab, url);
      return tab;
    }
    ctx.makeTab = makeTab;

    function setIcon(tab, html) { tab.el.firstElementChild.outerHTML = html; }
    function setLabel(tab, t) { tab.el.querySelector('.label').textContent = t; tab.el.title = t; }

    function navigate(tab, raw, push = true) {
      const url = normalize(raw);
      if (!url) return;
      if (push) {
        tab.history = tab.history.slice(0, tab.hi + 1);
        tab.history.push(url);
        tab.hi = tab.history.length - 1;
      }
      load(tab, url);
    }
    ctx.navigate = (raw, tab = ctx.active) => tab && navigate(tab, raw);

    function addVisit(url) {
      if (url.startsWith('about:')) return;
      visits = [{ url, at: Date.now() }, ...visits.filter(v => v.url !== url)].slice(0, 40);
      OS.store.set('history', visits);
    }

    function load(tab, url) {
      tab.url = url;
      tab.typed = url === HOME ? '' : url;
      tab.started = true;
      tab.loading = true;
      tab.error = false;
      setIcon(tab, SPINNER);
      setLabel(tab, '읽는중...');
      const internal = url === HOME || url === INFO;
      if (ELECTRON && !internal && url !== 'about:blank') {
        tab.mode = 'web';
        tab.pending = true;
        tab.fav = null;
        const w = ensureWeb(tab);
        w.src = url;
      } else if (CLOUD && !internal && url !== 'about:blank') {
        tab.mode = 'cloud';
        tab.pending = true;
        openCloud(tab, url);
      } else {
        endCloud(tab);
        tab.mode = 'frame';
        const f = tab.frame;
        if (internal) {
          f.removeAttribute('src');
          f.srcdoc = url === HOME ? startPage() : infoPage();
        } else {
          f.removeAttribute('srcdoc');
          f.src = url;
        }
      }
      showMode(tab);
      addVisit(url);
      if (tab === ctx.active) sync();
    }

    function showMode(tab) {
      const on = tab === ctx.active;
      tab.frame.classList.toggle('active', on && tab.mode === 'frame');
      if (tab.web) tab.web.classList.toggle('active', on && tab.mode === 'web');
      if (tab.cloud) tab.cloud.box.classList.toggle('active', on && tab.mode === 'cloud');
    }

    function navigated(tab, url) {
      if (tab.pending) { tab.history[tab.hi] = url; tab.pending = false; }
      else if (url !== tab.history[tab.hi]) {
        tab.history = tab.history.slice(0, tab.hi + 1);
        tab.history.push(url);
        tab.hi = tab.history.length - 1;
      }
      tab.url = tab.typed = url;
      addVisit(url);
      if (tab === ctx.active) sync();
    }

    function cloudMessage(tab, text, retry) {
      const c = tab.cloud;
      c.box.querySelectorAll('.br-cloud-msg').forEach(m => m.remove());
      if (!text) return;
      const m = OS.h(`<div class="br-cloud-msg"><img src="icons/browser.png"><p>${OS.esc(text)}</p>
        <div><button class="btn br-cloud-tab">새 탭에서 열기</button>${retry ? '<button class="btn default br-cloud-retry">다시 시도</button>' : ''}</div></div>`);
      m.querySelector('.br-cloud-tab').onclick = () => window.open(tab.url, '_blank', 'noopener');
      if (retry) m.querySelector('.br-cloud-retry').onclick = () => { endCloud(tab); load(tab, tab.url); };
      c.box.appendChild(m);
    }
    function endCloud(tab) {
      const c = tab.cloud;
      if (!c) return;
      try { if (c.hb) c.hb.destroy(); } catch (e) {}
      if (c.id) { cloudIds.delete(c.id); fetch(CLOUD + '/session/' + c.id, { method: 'DELETE' }).catch(() => {}); }
      c.box.remove();
      tab.cloud = null;
    }
    function openCloud(tab, url) {
      if (tab.cloud && tab.cloud.hb) { tab.cloud.hb.tabs.update({ url }).catch(() => {}); return; }
      if (tab.cloud) { tab.cloud.pendingUrl = url; return; }
      const box = OS.h('<div class="br-cloud"><div class="br-cloud-view"></div></div>');
      content.appendChild(box);
      const c = tab.cloud = { box, hb: null, id: null, pendingUrl: null };
      showMode(tab);
      fetch(CLOUD + '/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
        .then(r => r.json().catch(() => ({})).then(d => {
          if (!r.ok) throw new Error(d.error === 'busy' ? 'busy' : 'error');
          return d;
        }))
        .then(async d => {
          if (tab.cloud !== c) return fetch(CLOUD + '/session/' + d.id, { method: 'DELETE' });
          c.id = d.id;
          cloudIds.add(d.id);
          const { default: Hyperbeam } = await import('https://unpkg.com/@hyperbeam/web@0.0.38/dist/index.js');
          const hb = await Hyperbeam(box.querySelector('.br-cloud-view'), d.embed_url, {
            adminToken: d.admin_token,
            timeout: 20000,
            delegateKeyboard: false,
            volume: OS.settings.muted ? 0 : OS.settings.volume / 100,
            onDisconnect: () => {
              if (tab.cloud !== c) return;
              tab.loading = false;
              cloudMessage(tab, '구름열람기 사용시간이 끝났습니다.', true);
              if (tab === ctx.active) sync();
            }
          });
          if (tab.cloud !== c) { hb.destroy(); return; }
          c.hb = hb;
          hb.tabs.onUpdated.addListener((id, info) => {
            if (tab.cloud !== c || tab.mode !== 'cloud') return;
            if (info.url) navigated(tab, info.url);
            if (info.title) { tab.title = info.title; setLabel(tab, info.title); }
            if (info.status === 'loading') { tab.loading = true; setIcon(tab, SPINNER); }
            if (info.status === 'complete') { tab.loading = false; setIcon(tab, FAVICON); setLabel(tab, tab.title || tab.url); }
            if (tab === ctx.active) sync();
          });
          tab.loading = false;
          setIcon(tab, FAVICON);
          setLabel(tab, tab.url.replace(/^https?:\/\/(www\.)?/, ''));
          if (c.pendingUrl) hb.tabs.update({ url: c.pendingUrl }).catch(() => {});
          if (tab === ctx.active) sync();
        })
        .catch(e => {
          if (tab.cloud !== c) return;
          tab.loading = false;
          tab.error = true;
          setIcon(tab, FAVICON);
          cloudMessage(tab, e.message === 'busy' ? '지금 사용자가 너무 많습니다. 잠시후 다시 시도하십시오.' : '구름열람기에 련결할수 없습니다.', true);
          if (tab === ctx.active) sync();
        });
    }

    function ensureWeb(tab) {
      if (tab.web) return tab.web;
      const w = document.createElement('webview');
      w.className = 'br-web';
      w.setAttribute('allowpopups', '');
      content.appendChild(w);
      tab.web = w;
      const mine = () => tab.mode === 'web';
      const refresh = () => { if (tab === ctx.active) sync(); };
      const favHtml = () => tab.fav ? `<img class="fav" src="${OS.esc(tab.fav)}">` : FAVICON;
      function nav(url) {
        if (mine()) navigated(tab, url);
      }
      w.addEventListener('did-start-loading', () => {
        if (!mine()) return;
        tab.loading = true;
        tab.error = false;
        setIcon(tab, SPINNER);
        refresh();
      });
      w.addEventListener('did-stop-loading', () => {
        if (!mine()) return;
        tab.loading = false;
        try { tab.title = w.getTitle() || tab.title; } catch (e) {}
        setIcon(tab, favHtml());
        setLabel(tab, tab.error ? '페지를 열수 없습니다' : (tab.title || tab.url.replace(/^https?:\/\/(www\.)?/, '')));
        refresh();
      });
      w.addEventListener('did-navigate', e => nav(e.url));
      w.addEventListener('did-navigate-in-page', e => { if (e.isMainFrame) nav(e.url); });
      w.addEventListener('page-title-updated', e => {
        if (!mine()) return;
        tab.title = e.title;
        setLabel(tab, e.title);
        refresh();
      });
      w.addEventListener('page-favicon-updated', e => {
        if (!mine() || !e.favicons || !e.favicons.length) return;
        tab.fav = e.favicons[0];
        if (!tab.loading) setIcon(tab, favHtml());
      });
      w.addEventListener('did-fail-load', e => {
        if (!mine() || !e.isMainFrame || e.errorCode === -3) return;
        tab.error = true;
        refresh();
      });
      return w;
    }

    function loaded(tab) {
      tab.loading = false;
      let title = '', internal = false;
      try {
        const d = tab.frame.contentDocument;
        if (d) {
          internal = tab.url.startsWith('about:');
          if (internal) { hookInternal(tab, d); OS.i18n.translateDoc(d); }
          title = d.__origTitle || d.title;
        }
      } catch (e) {}
      tab.title = title || tab.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') || '새 탭';
      setIcon(tab, tab.url === HOME ? STARFAV : FAVICON);
      setLabel(tab, tab.title);
      if (tab === ctx.active) sync();
    }

    function hookInternal(tab, d) {
      d.addEventListener('click', e => {
        const a = e.target.closest('a');
        if (a) { e.preventDefault(); navigate(tab, a.getAttribute('href')); }
      });
      const form = d.querySelector('form');
      if (form) {
        form.addEventListener('submit', e => { e.preventDefault(); if (form.q.value.trim()) navigate(tab, SEARCH(form.q.value.trim())); });
        if (tab === ctx.active && document.activeElement !== urlInput) setTimeout(() => form.q.focus(), 0);
      }
    }

    function select(tab) {
      ctx.active = tab;
      ctx.tabs.forEach(t => {
        t.el.classList.toggle('active', t === tab);
        showMode(t);
      });
      sync();
    }

    function closeTab(tab) {
      const i = ctx.tabs.indexOf(tab);
      if (i < 0) return;
      ctx.tabs.splice(i, 1);
      tab.el.remove();
      tab.frame.remove();
      if (tab.web) tab.web.remove();
      endCloud(tab);
      if (!ctx.tabs.length) return win.close();
      if (ctx.active === tab) select(ctx.tabs[Math.max(0, i - 1)]);
    }
    ctx.closeTab = () => ctx.active && closeTab(ctx.active);

    function sync() {
      const t = ctx.active;
      if (!t) return;
      if (document.activeElement !== urlInput) urlInput.value = t.typed;
      status.textContent = t.error ? '페지를 열수 없습니다' : t.loading ? '10.76.1.11 접속중...' : '완료';
      q('.sb-progress').classList.toggle('busy', t.loading && t.started);
      q('.b-back').disabled = t.hi <= 0;
      q('.b-fwd').disabled = t.hi >= t.history.length - 1;
      win.setTitle(t.title && !t.loading ? `${t.title} - 내나라열람기` : '내나라열람기');
    }

    ctx.back = () => { const t = ctx.active; if (t && t.hi > 0) { t.hi--; load(t, t.history[t.hi]); } };
    ctx.forward = () => { const t = ctx.active; if (t && t.hi < t.history.length - 1) { t.hi++; load(t, t.history[t.hi]); } };
    ctx.reload = () => {
      const t = ctx.active;
      if (!t || !t.url) return;
      if (t.mode === 'web' && t.web) { try { t.web.reload(); return; } catch (e) {} }
      if (t.mode === 'cloud' && t.cloud && t.cloud.hb) { t.cloud.hb.tabs.reload().catch(() => {}); return; }
      load(t, t.url);
    };
    ctx.stop = () => {
      const t = ctx.active;
      if (!t || !t.loading) return;
      try { t.mode === 'web' ? t.web.stop() : t.frame.contentWindow.stop(); } catch (e) {}
      t.loading = false;
      setIcon(t, FAVICON);
      setLabel(t, t.title || t.typed || '새 탭');
      sync();
      status.textContent = '중지되였습니다';
    };
    ctx.home = () => ctx.navigate(HOME);
    ctx.focusUrl = () => { urlInput.focus(); urlInput.select(); };
    ctx.newTab = url => { makeTab(url || HOME); if (!url) ctx.focusUrl(); };
    ctx.bookmark = async () => {
      const t = ctx.active;
      if (!t || !t.url) return;
      const name = await OS.prompt('책갈피 이름:', t.title || t.url, '책갈피 추가');
      if (name == null) return;
      bookmarks.push({ title: name.trim() || t.url, url: t.url });
      saveBookmarks();
    };

    q('.b-back').onclick = ctx.back;
    q('.b-fwd').onclick = ctx.forward;
    q('.b-reload').onclick = ctx.reload;
    q('.b-stop').onclick = ctx.stop;
    q('.b-home').onclick = ctx.home;
    const histMenu = (e, list) => {
      const r = e.currentTarget.getBoundingClientRect(), s = OS.screen.getBoundingClientRect();
      OS.menu((r.left - s.left) / OS.scale, (r.bottom - s.top) / OS.scale, list.length ? list : [{ label: '비여있음', disabled: true }]);
    };
    q('.b-hist').onclick = e => {
      const t = ctx.active;
      if (!t) return;
      histMenu(e, t.history.map((u, i) => ({ label: u, checked: i === t.hi, action: () => { t.hi = i; load(t, u); } })).reverse());
    };
    q('.br-url .drop').onclick = e => histMenu(e, visits.slice(0, 15).map(v => ({ label: v.url, action: () => ctx.navigate(v.url) })));
    q('.bm-recent').onclick = e => histMenu(e, [
      ...visits.slice(0, 15).map(v => ({ label: v.url.replace(/^https?:\/\//, ''), key: OS.formatDate(v.at).slice(5), action: () => ctx.navigate(v.url) })),
      { sep: 1 }, { label: '방문기록 지우기', action: clearHistory }
    ]);
    urlInput.addEventListener('focus', () => { if (!ctx.keepCaret) setTimeout(() => urlInput.select(), 0); ctx.keepCaret = false; });
    urlInput.addEventListener('input', () => { if (ctx.active) ctx.active.typed = urlInput.value; });
    urlInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { ctx.navigate(urlInput.value); urlInput.blur(); }
      if (e.key === 'Escape') { urlInput.value = ctx.active ? ctx.active.url : ''; urlInput.select(); }
    });
    q('.br-url .go').onclick = () => ctx.navigate(urlInput.value);
    const sq = q('.br-q');
    sq.addEventListener('keydown', e => { if (e.key === 'Enter' && sq.value.trim()) ctx.navigate(SEARCH(sq.value.trim())); });
    q('.br-search .mag').onclick = () => sq.value.trim() && ctx.navigate(SEARCH(sq.value.trim()));
    q('.br-search .engine').onclick = e => histMenu(e, [{ label: '위키백과 (조선어)', checked: true }]);
    q('.br-newtab').onclick = () => ctx.newTab();
    q('.br-tablist').onclick = e => histMenu(e, ctx.tabs.map(t => ({ label: t.el.querySelector('.label').textContent, checked: t === ctx.active, action: () => select(t) })));
    q('.br-tabs').addEventListener('dblclick', e => { if (e.target === e.currentTarget) ctx.newTab(); });

    const info = q('.br-info');
    q('.info-close').onclick = () => info.classList.add('hidden');
    q('.info-btn').onclick = () => { info.classList.add('hidden'); ctx.newTab(INFO); };
    ctx.toggleInfo = () => info.classList.toggle('hidden');
    ctx.infoVisible = () => !info.classList.contains('hidden');

    function renderBookmarks() {
      const list = q('.bm-list');
      list.innerHTML = '';
      bookmarks.forEach((b, i) => {
        const el = OS.h(`<span class="bm">${b.url === HOME ? STARFAV : FAVICON}${OS.esc(b.title)}</span>`);
        el.onclick = () => ctx.navigate(b.url);
        el.oncontextmenu = e => OS.contextMenu(e, [
          { label: '새 탭에서 열기', action: () => makeTab(b.url) },
          { label: '이름 바꾸기...', action: async () => { const n = await OS.prompt('책갈피 이름:', b.title); if (n) { b.title = n; saveBookmarks(); } } },
          { sep: 1 },
          { label: '삭제', action: () => { bookmarks.splice(i, 1); saveBookmarks(); } }
        ]);
        list.appendChild(el);
      });
    }
    renderBookmarks();
    OS.on('bookmarks', renderBookmarks);
    OS.on('lang', () => {
      if (!OS.windows.includes(win)) return;
      ctx.tabs.forEach(t => {
        if (!t.started || t.loading || !t.url.startsWith('about:')) return;
        try { OS.i18n.translateDoc(t.frame.contentDocument); } catch (e) {}
      });
    });

    function clearHistory() { visits = []; OS.store.set('history', visits); }
    ctx.clearHistory = clearHistory;

    if (opts.initial) {
      [makeTab(null, true), makeTab(null, true)].forEach(t => { setIcon(t, SPINNER); setLabel(t, '읽는중...'); t.loading = true; t.typed = 'goog'; });
      select(ctx.tabs[0]);
      status.textContent = '10.76.1.11 접속중...';
      setTimeout(() => { ctx.keepCaret = true; urlInput.value = 'goog'; urlInput.focus(); urlInput.setSelectionRange(4, 4); }, 50);
    } else {
      makeTab(opts.url || HOME);
      info.classList.add('hidden');
    }
    return win;
  }

  function menus(ctx) {
    const t = ctx.active;
    return [
      { title: '파일', items: [
        { label: '새 창문', key: 'Alt+N', action: () => createWindow({}) },
        { label: '새 탭', key: 'Alt+T', action: () => ctx.newTab() },
        { label: '위치 열기...', key: 'Ctrl+L', action: ctx.focusUrl },
        { sep: 1 },
        { label: '탭 닫기', key: 'Alt+W', action: ctx.closeTab },
        { label: '창문 닫기', key: 'Alt+Shift+W', action: () => ctx.win.close() },
        { sep: 1 },
        { label: '인쇄...', key: 'Ctrl+P', action: () => { try { t.mode === 'web' ? t.web.print() : t.frame.contentWindow.print(); } catch (e) { OS.alert('이 페지는 인쇄할수 없습니다.'); } } }
      ] },
      { title: '편집', items: OS.editItems() },
      { title: '보기', items: [
        { label: '다시 읽기', key: 'Ctrl+R', action: ctx.reload },
        { label: '중지', disabled: !t || !t.loading, action: ctx.stop },
        { sep: 1 },
        { label: '정보띠', checked: ctx.infoVisible(), action: ctx.toggleInfo },
        { label: '전체화면', action: () => ctx.win.toggleMax() }
      ] },
      { title: '방문기록', items: [
        { label: '뒤로', key: 'Alt+ArrowLeft', disabled: !t || t.hi <= 0, action: ctx.back },
        { label: '앞으로', key: 'Alt+ArrowRight', disabled: !t || t.hi >= t.history.length - 1, action: ctx.forward },
        { label: '홈', key: 'Alt+Home', action: ctx.home },
        { sep: 1 },
        ...visits.slice(0, 10).map(v => ({ label: v.url.replace(/^https?:\/\//, ''), action: () => ctx.navigate(v.url) })),
        ...(visits.length ? [{ sep: 1 }] : []),
        { label: '방문기록 지우기', disabled: !visits.length, action: ctx.clearHistory }
      ] },
      { title: '책갈피', items: [
        { label: '이 페지를 책갈피에 추가', key: 'Ctrl+D', disabled: !t || !t.url, action: ctx.bookmark },
        { sep: 1 },
        ...bookmarks.map(b => ({ label: b.title, action: () => ctx.navigate(b.url) }))
      ] },
      { title: '도구', items: [
        { label: '내리적재', action: () => OS.launch('files', { path: OS.fs.HOME + '/내리적재' }) },
        { label: '쏘프트웨어 정보', action: () => ctx.newTab(INFO) },
        { sep: 1 },
        { label: '개인자료 지우기...', action: async () => { if (await OS.confirm('방문기록을 모두 지우겠습니까?', '지우기')) ctx.clearHistory(); } }
      ] },
      { title: '도움말', items: [
        { label: '내나라열람기 도움말', action: () => OS.alert('· 주소띠에 주소를 입력하고 Enter 를 누르십시오.\n· Alt+T: 새 탭, Alt+W: 탭 닫기, Ctrl+D: 책갈피 추가\n· 일부 웹싸이트는 다른 페지안에 표시되는것을 허용하지 않습니다.', '내나라열람기') },
        { label: '내나라열람기에 대하여', action: () => OS.appAbout(OS.apps.browser) }
      ] }
    ];
  }

  if (CLOUD) {
    addEventListener('pagehide', () => {
      cloudIds.forEach(id => { try { navigator.sendBeacon(CLOUD + '/session/' + id + '/end'); } catch (e) {} });
    });
  }

  if (ELECTRON) {
    window.rsElectron.onOpenTab(url => {
      const list = OS.wm.byApp('browser');
      const w = OS.wm.topmost(list) || list[list.length - 1];
      if (w) { OS.wm.restore(w); w.ctx.newTab(url); }
      else OS.launch('browser', { url, newWindow: true });
    });
  }

  OS.register({
    id: 'browser', name: '내나라열람기', icon: 'icons/browser.png',
    launch(opts) {
      const existing = OS.wm.byApp('browser');
      if (opts.url && existing.length && !opts.newWindow) {
        const w = OS.wm.topmost(existing) || existing[0];
        OS.wm.restore(w);
        w.ctx.newTab(opts.url);
        return w;
      }
      if (existing.length && !opts.newWindow && !opts.initial) {
        const w = OS.wm.topmost(existing) || existing[existing.length - 1];
        OS.wm.restore(w);
        return w;
      }
      return createWindow(opts);
    }
  });
})();
