(function () {
  'use strict';
  const WALLS = ['wallpapers/wp0.jpg', 'wallpapers/wp1.jpg', 'wallpapers/wp2.jpg', 'wallpapers/wp3.jpg', 'wallpapers/wp4.jpg', 'wallpapers/wp5.jpg'];
  const COLORS = ['#3a5a30', '#1f3b6b', '#4d4d4d', '#6b1f1f', '#2b5d6b', '#000000'];
  const SPEAKER = OS.svgURI('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#ddd" stroke="#888" stroke-width="2"/><path d="M14 26h8l12-10v32L22 38h-8z" fill="#444"/><path d="M40 24c4 4 4 12 0 16M45 19c7 7 7 19 0 26" stroke="#444" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>');
  const DOCKICON = OS.svgURI('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="6" y="10" width="52" height="38" rx="3" fill="#6aa7e8" stroke="#2c5d9a" stroke-width="2"/><path d="M4 50h56l-4 8H8z" fill="#cfd6dd" stroke="#888"/><rect x="14" y="44" width="8" height="8" fill="#e2231a"/><rect x="28" y="44" width="8" height="8" fill="#6cb23a"/><rect x="42" y="44" width="8" height="8" fill="#f2a530"/></svg>');
  const NETICON = OS.svgURI('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="#4a90d9" stroke="#1d4f8a" stroke-width="2"/><ellipse cx="32" cy="32" rx="12" ry="27" fill="none" stroke="#fff" stroke-width="2"/><path d="M5 32h54M10 18h44M10 46h44" stroke="#fff" stroke-width="2"/></svg>');
  const RESETICON = 'icons/settings.png';
  const LANGICON = OS.svgURI('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="4" y="8" width="34" height="28" rx="5" fill="#e2231a"/><path d="M14 36l-4 10 12-10z" fill="#e2231a"/><text x="21" y="29" text-anchor="middle" font-size="20" font-weight="bold" fill="#fff" font-family="sans-serif">가</text><rect x="26" y="22" width="34" height="28" rx="5" fill="#3e8ed8"/><path d="M50 50l4 10-12-10z" fill="#3e8ed8"/><text x="43" y="43" text-anchor="middle" font-size="20" font-weight="bold" fill="#fff" font-family="sans-serif">A</text></svg>');

  const PANES = [
    { id: 'desktop', name: '바탕화면', icon: 'wallpapers/wp0.jpg', group: '개인' },
    { id: 'dock', name: '도크', icon: DOCKICON, group: '개인' },
    { id: 'language', name: '언어', icon: LANGICON, group: '개인' },
    { id: 'input', name: '입력방식', icon: OS.ICON_DOC, group: '개인' },
    { id: 'datetime', name: '날자와 시간', icon: 'icons/date.png', group: '체계' },
    { id: 'sound', name: '소리', icon: SPEAKER, group: '체계' },
    { id: 'network', name: '망', icon: NETICON, group: '체계' },
    { id: 'user', name: '사용자', icon: 'icons/user.png', group: '체계' },
    { id: 'about', name: '체계정보', icon: 'icons/redstar.png', group: '체계' },
    { id: 'reset', name: '초기화', icon: RESETICON, group: '체계' }
  ];

  function createWindow(opts) {
    const body = OS.h(`<div class="sp">
      <div class="sp-bar">
        <div class="seg"><button class="tb seg-l sp-back" title="뒤로"><svg viewBox="0 0 10 10"><path d="M7 1L2 5l5 4z" fill="#555"/></svg></button><button class="tb seg-r sp-fwd" title="앞으로"><svg viewBox="0 0 10 10"><path d="M3 1l5 4-5 4z" fill="#555"/></svg></button></div>
        <button class="tb single sp-all">모두 보기</button>
      </div>
      <div class="sp-content"></div>
    </div>`);
    const q = s => body.querySelector(s);
    const win = OS.wm.open({ app: 'settings', title: '체계설정', body, w: 600, h: 430, cls: 'unified', minW: 520, minH: 360, menus: () => menus(win) });
    const hist = [], st = { hi: -1 };
    function show(id, push = true) {
      if (push) { hist.splice(st.hi + 1); hist.push(id); st.hi = hist.length - 1; }
      const c = q('.sp-content');
      c.innerHTML = '';
      q('.sp-back').disabled = st.hi <= 0;
      q('.sp-fwd').disabled = st.hi >= hist.length - 1;
      if (!id) {
        win.setTitle('체계설정');
        ['개인', '체계'].forEach(g => {
          const row = OS.h(`<div class="sp-group"><div class="sp-gname">${g}</div><div class="sp-icons"></div></div>`);
          PANES.filter(p => p.group === g).forEach(p => {
            const el = OS.h(`<div class="sp-icon"><img src="${p.icon}"><span>${p.name}</span></div>`);
            el.onclick = () => show(p.id);
            row.querySelector('.sp-icons').appendChild(el);
          });
          c.appendChild(row);
        });
        return;
      }
      const pane = PANES.find(p => p.id === id);
      win.setTitle(pane.name);
      const el = OS.h(`<div class="sp-pane sp-${id}"></div>`);
      c.appendChild(el);
      RENDER[id](el);
    }
    win.show = show;
    q('.sp-all').onclick = () => show(null);
    q('.sp-back').onclick = () => { if (st.hi > 0) { st.hi--; show(hist[st.hi], false); } };
    q('.sp-fwd').onclick = () => { if (st.hi < hist.length - 1) { st.hi++; show(hist[st.hi], false); } };
    show(opts.pane || null);
    return win;
  }

  const check = (k, label) => `<label class="sp-check"><input type="checkbox" data-k="${k}" ${OS.settings[k] ? 'checked' : ''}> ${label}</label>`;
  function bindChecks(el) {
    el.querySelectorAll('input[type=checkbox][data-k]').forEach(i => i.onchange = () => OS.set(i.dataset.k, i.checked));
  }

  const RENDER = {
    desktop(el) {
      const cur = OS.settings.wallpaper;
      el.innerHTML = `<div class="sp-preview" style="${cur.startsWith('color:') ? `background:${cur.slice(6)}` : `background-image:url('${cur}')`}"></div>
        <div class="sp-sub">붉은별 그림</div>
        <div class="sp-walls">${WALLS.map(w => `<div class="sp-wall${cur === w ? ' sel' : ''}" data-v="${w}" style="background-image:url('${w}')"></div>`).join('')}</div>
        <div class="sp-sub">단색</div>
        <div class="sp-walls">${COLORS.map(c => `<div class="sp-wall color${cur === 'color:' + c ? ' sel' : ''}" data-v="color:${c}" style="background:${c}"></div>`).join('')}</div>
        <div class="sp-row"><button class="btn sp-own">그림 화일 선택...</button><input type="file" accept="image/*" hidden></div>`;
      el.querySelectorAll('.sp-wall').forEach(w => w.onclick = () => { OS.set('wallpaper', w.dataset.v); RENDER.desktop(el); });
      const file = el.querySelector('input[type=file]');
      el.querySelector('.sp-own').onclick = () => file.click();
      file.onchange = () => {
        const f = file.files[0];
        if (!f) return;
        if (f.size > 2 * 1048576) return OS.alert('그림이 너무 큽니다 (최대 2 MB).');
        const r = new FileReader();
        r.onload = () => { OS.set('wallpaper', r.result); RENDER.desktop(el); };
        r.readAsDataURL(f);
      };
    },
    dock(el) {
      el.innerHTML = `<div class="sp-row"><span class="sp-label">크기:</span><span>작게</span><input type="range" min="40" max="72" value="${OS.settings.dockSize}" class="sp-range"><span>크게</span></div>
        <div class="sp-row">${check('magnify', '확대 효과 사용')}</div>`;
      el.querySelector('.sp-range').oninput = e => OS.set('dockSize', +e.target.value);
      bindChecks(el);
    },
    language(el) {
      const I = OS.i18n, cur = I.current();
      const extraSel = I.info(cur).extra ? cur : 'nl';
      el.innerHTML = `<div class="sp-sub">기본 언어</div>
        <div class="sp-langs">${I.BUILTIN.map(l => `<label class="sp-lang${l.id === cur ? ' sel' : ''}">
          <input type="radio" name="lang" value="${l.id}" ${l.id === cur ? 'checked' : ''}>
          <span class="sp-lname" data-notr>${OS.esc(l.name)}</span>${l.note ? `<span class="sp-lnote">${OS.esc(l.note)}</span>` : ''}</label>`).join('')}</div>
        <div class="sp-sub">다른 언어</div>
        <div class="sp-row sp-note">콤퓨터 내장 번역기로 번역합니다 (Chrome 138 이상).</div>
        <div class="sp-row">
          <select class="sp-extra" data-notr>${I.EXTRA.map(([id, n]) => `<option value="${id}" ${id === extraSel ? 'selected' : ''}>${OS.esc(n)}${I.cached(id) ? ' ✓' : ''}</option>`).join('')}</select>
          <button class="btn default sp-apply">적용</button>
          <span class="sp-progress"></span>
        </div>
        <div class="sp-row"><button class="btn sp-clear">번역 기억 지우기</button></div>`;
      el.querySelectorAll('input[name=lang]').forEach(r => r.onchange = () => { OS.set('lang', r.value); RENDER.language(el); });
      const btn = el.querySelector('.sp-apply'), prog = el.querySelector('.sp-progress');
      btn.onclick = async () => {
        const id = el.querySelector('.sp-extra').value;
        btn.disabled = true;
        try {
          await I.machine(id, (phase, p) => {
            prog.textContent = `${OS.t(phase === 'download' ? '번역 모형을 내려받는중' : '번역중')}… ${Math.round(p * 100)}%`;
          });
          OS.set('lang', id);
          RENDER.language(el);
          el.querySelector('.sp-progress').textContent = OS.t('번역을 완료하였습니다.');
        } catch (e) {
          prog.textContent = '';
          OS.alert(e.message === 'nosupport' ? '이 열람기에는 내장 번역기가 없습니다.'
            : e.message === 'unavailable' ? '이 언어는 내장 번역기에서 지원하지 않습니다.' : String(e.message || e));
        } finally {
          btn.disabled = false;
        }
      };
      el.querySelector('.sp-clear').onclick = () => { I.clearCache(); RENDER.language(el); };
    },
    input(el) {
      el.innerHTML = `<div class="sp-row"><span class="sp-label">입력방식:</span>
        <label class="sp-check"><input type="radio" name="ime" value="ko" ${OS.settings.ime === 'ko' ? 'checked' : ''}> 조선어 (2벌식)</label>
        <label class="sp-check"><input type="radio" name="ime" value="en" ${OS.settings.ime !== 'ko' ? 'checked' : ''}> English (U.S.)</label></div>
        <div class="sp-row"><span class="sp-label">전환 건:</span> Shift + Space</div>
        <div class="sp-row"><span class="sp-label">시험:</span><input class="sp-text" placeholder="여기에 입력해보십시오"></div>`;
      el.querySelectorAll('input[name=ime]').forEach(r => r.onchange = () => OS.set('ime', r.value));
    },
    datetime(el) {
      const draw = () => {
        const d = new Date();
        el.querySelector('.sp-bigclock').textContent = `${OS.pad(d.getHours())}:${OS.pad(d.getMinutes())}:${OS.pad(d.getSeconds())}`;
        el.querySelector('.sp-bigdate').textContent = `주체${OS.juche(d.getFullYear())}(${d.getFullYear()})년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${OS.DAYS[d.getDay()]}요일`;
      };
      el.innerHTML = `<div class="sp-bigclock"></div><div class="sp-bigdate"></div>
        <div class="sp-row">${check('clock24', '24시간 형식 사용')}</div>
        <div class="sp-row">${check('seconds', '초 표시')}</div>
        <div class="sp-row">${check('showDate', '차림표띠에 날자 표시')}</div>
        <div class="sp-row sp-note">시간대: 평양 (조선 표준시)</div>`;
      bindChecks(el);
      draw();
      const iv = setInterval(() => { if (!el.isConnected) return clearInterval(iv); draw(); }, 1000);
    },
    sound(el) {
      el.innerHTML = `<div class="sp-row"><span class="sp-label">출력 음량:</span><span>🔈</span><input type="range" min="0" max="100" value="${OS.settings.volume}" class="sp-range"><span>🔊</span></div>
        <div class="sp-row">${check('muted', '소리 끄기')}</div>
        <div class="sp-row"><button class="btn sp-test">시험음 듣기</button></div>`;
      el.querySelector('.sp-range').oninput = e => OS.set('volume', +e.target.value);
      bindChecks(el);
      el.querySelector('.sp-test').onclick = () => {
        if (OS.settings.muted) return;
        try {
          const ac = new (window.AudioContext || window.webkitAudioContext)();
          const o = ac.createOscillator(), g = ac.createGain();
          o.frequency.value = 880;
          g.gain.value = OS.settings.volume / 400;
          o.connect(g).connect(ac.destination);
          o.start();
          g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.4);
          o.stop(ac.currentTime + 0.45);
        } catch (e) {}
      };
    },
    network(el) {
      el.innerHTML = `<table class="sp-tbl"><tr><th>상태</th><td><span class="sp-dot"></span> 련결됨</td></tr>
        <tr><th>망</th><td>광명</td></tr><tr><th>IP 주소</th><td>10.76.1.11</td></tr>
        <tr><th>망마스크</th><td>255.255.255.0</td></tr><tr><th>경로기</th><td>10.76.1.1</td></tr>
        <tr><th>DNS</th><td>10.76.1.1</td></tr>
        <tr><th>실제 망</th><td>${navigator.onLine ? '련결됨' : '끊어짐'}</td></tr></table>`;
    },
    user(el) {
      el.innerHTML = `<div class="sp-user"><img src="icons/user.png"><div>
        <div class="sp-row"><span class="sp-label">사용자 이름:</span><input class="sp-text sp-uname" value="${OS.esc(OS.settings.user)}"></div>
        <div class="sp-row sp-note">이 이름은 가입화면과 말단기에 표시됩니다.</div>
        <div class="sp-row"><button class="btn default sp-save">보관</button></div></div></div>`;
      el.querySelector('.sp-save').onclick = () => {
        const v = el.querySelector('.sp-uname').value.trim();
        if (v) { OS.set('user', v); OS.alert('사용자 이름을 보관하였습니다.'); }
      };
    },
    about(el) {
      const used = (() => { let n = 0; try { for (const k of Object.keys(localStorage)) n += (localStorage.getItem(k) || '').length * 2; } catch (e) {} return n; })();
      el.innerHTML = `<div class="sp-aboutbox"><img src="icons/redstar.png"><div>
        <div class="sp-osname">붉은별 3.0</div>
        <table class="sp-tbl"><tr><th>판본</th><td>3.0 (Kernel 2.6.38)</td></tr>
        <tr><th>처리기</th><td>${navigator.hardwareConcurrency || 1} 핵심</td></tr>
        <tr><th>기억기</th><td>${navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '알수 없음'}</td></tr>
        <tr><th>화면</th><td>${screen.width} × ${screen.height}</td></tr>
        <tr><th>사용한 기억공간</th><td>${OS.formatSize(used)} / 5 MB</td></tr>
        <tr><th>열람기</th><td>${OS.esc(navigator.userAgent.split(') ').pop())}</td></tr></table></div></div>`;
    },
    reset(el) {
      el.innerHTML = `<div class="sp-row sp-note">모든 화일, 일정, 련락처, 책갈피와 설정을 지우고 처음상태로 되돌립니다.</div>
        <div class="sp-row"><button class="btn sp-reset">모든 자료 지우기...</button></div>`;
      el.querySelector('.sp-reset').onclick = async () => {
        if (!(await OS.confirm('정말 모든 자료를 지우겠습니까?\n이 조작은 되돌릴수 없습니다.', '지우기'))) return;
        OS.store.clear();
        location.reload();
      };
    }
  };

  function menus(win) {
    return [
      { title: '편집', items: OS.editItems() },
      { title: '보기', items: [
        { label: '모두 보기', key: 'Alt+L', action: () => win.show(null) },
        { sep: 1 },
        ...PANES.map(p => ({ label: p.name, action: () => win.show(p.id) }))
      ] },
      { title: '창문', items: OS.windowItems() },
      { title: '도움말', items: [{ label: '체계설정 도움말', action: OS.help }] }
    ];
  }

  OS.register({
    id: 'settings', name: '체계설정', icon: 'icons/settings.png',
    launch(opts) {
      const w = OS.wm.byApp('settings')[0];
      if (w) { OS.wm.restore(w); if (opts.pane) w.show(opts.pane); return w; }
      return createWindow(opts);
    }
  });
})();
