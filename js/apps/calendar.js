(function () {
  'use strict';
  let events = OS.store.get('events', {});
  const save = () => { OS.store.set('events', events); OS.emit('events'); };
  const key = d => `${d.getFullYear()}-${OS.pad(d.getMonth() + 1)}-${OS.pad(d.getDate())}`;
  const HOLIDAYS = { '01-01': '양력설', '02-16': '광명성절', '03-08': '국제부녀절', '04-15': '태양절', '05-01': '국제로동절', '07-27': '전승절', '08-15': '조국해방의 날', '09-09': '공화국창건일', '10-10': '당창건기념일', '12-27': '헌법절' };

  function createWindow() {
    const body = OS.h(`<div class="cal">
      <div class="cal-head">
        <div class="seg"><button class="tb seg-l cal-prev" title="이전 달">◀</button><button class="tb seg-m cal-today">오늘</button><button class="tb seg-r cal-next" title="다음 달">▶</button></div>
        <div class="cal-title"></div>
      </div>
      <div class="cal-body">
        <div class="cal-grid"></div>
        <div class="cal-side">
          <div class="cal-day"></div>
          <ul class="cal-events"></ul>
          <form class="cal-form"><input class="cal-time" type="time"><input class="cal-input" placeholder="새 일정" spellcheck="false"><button class="btn default">추가</button></form>
        </div>
      </div>
    </div>`);
    const q = s => body.querySelector(s);
    const today = new Date();
    const st = { y: today.getFullYear(), m: today.getMonth(), sel: new Date(today.getFullYear(), today.getMonth(), today.getDate()) };
    const win = OS.wm.open({ app: 'calendar', title: '달력', body, w: 660, h: 440, minW: 520, minH: 340, menus: () => menus(st, win) });
    win.cal = st;

    function render() {
      q('.cal-title').innerHTML = `<b>${st.m + 1}월</b> 주체${OS.juche(st.y)}(${st.y})년`;
      const grid = q('.cal-grid');
      grid.innerHTML = OS.DAYS.map((d, i) => `<div class="cal-dow${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}">${d}</div>`).join('');
      const first = new Date(st.y, st.m, 1);
      const start = new Date(st.y, st.m, 1 - first.getDay());
      const now = key(new Date());
      for (let i = 0; i < 42; i++) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        const k = key(d), ev = events[k] || [], hol = HOLIDAYS[k.slice(5)];
        const cell = OS.h(`<div class="cal-cell${d.getMonth() !== st.m ? ' other' : ''}${k === now ? ' today' : ''}${k === key(st.sel) ? ' sel' : ''}${d.getDay() === 0 || hol ? ' sun' : d.getDay() === 6 ? ' sat' : ''}">
          <span class="cal-num">${d.getDate()}</span>
          ${hol ? `<span class="cal-hol">${hol}</span>` : ''}
          ${ev.slice(0, 2).map(e => `<span class="cal-ev">${OS.esc(e.t)}</span>`).join('')}${ev.length > 2 ? `<span class="cal-more">+${ev.length - 2}</span>` : ''}
        </div>`);
        cell.onclick = () => { st.sel = d; if (d.getMonth() !== st.m) { st.y = d.getFullYear(); st.m = d.getMonth(); } render(); };
        cell.ondblclick = () => q('.cal-input').focus();
        grid.appendChild(cell);
      }
      const s = st.sel, k = key(s);
      q('.cal-day').innerHTML = `<div class="cal-big">${s.getDate()}</div><div>${OS.DAYS[s.getDay()]}요일<br>${s.getFullYear()}년 ${s.getMonth() + 1}월</div>${HOLIDAYS[k.slice(5)] ? `<div class="cal-holname">${HOLIDAYS[k.slice(5)]}</div>` : ''}`;
      const list = q('.cal-events');
      list.innerHTML = '';
      (events[k] || []).forEach((e, i) => {
        const li = OS.h(`<li><span class="cal-evtime">${e.time || '하루종일'}</span><span class="cal-evt">${OS.esc(e.t)}</span><button title="삭제">✕</button></li>`);
        li.querySelector('button').onclick = () => { events[k].splice(i, 1); if (!events[k].length) delete events[k]; save(); };
        list.appendChild(li);
      });
      if (!(events[k] || []).length) list.appendChild(OS.h('<li class="none">일정이 없습니다</li>'));
    }
    st.move = d => { st.m += d; if (st.m < 0) { st.m = 11; st.y--; } if (st.m > 11) { st.m = 0; st.y++; } render(); };
    st.today = () => { const t = new Date(); st.y = t.getFullYear(); st.m = t.getMonth(); st.sel = new Date(t.getFullYear(), t.getMonth(), t.getDate()); render(); };
    st.focusNew = () => q('.cal-input').focus();
    q('.cal-prev').onclick = () => st.move(-1);
    q('.cal-next').onclick = () => st.move(1);
    q('.cal-today').onclick = st.today;
    q('.cal-form').onsubmit = e => {
      e.preventDefault();
      const t = q('.cal-input').value.trim();
      if (!t) return;
      const k = key(st.sel);
      (events[k] = events[k] || []).push({ t, time: q('.cal-time').value });
      events[k].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      q('.cal-input').value = '';
      q('.cal-time').value = '';
      save();
    };
    body.querySelector('.cal-grid').addEventListener('wheel', e => { e.preventDefault(); st.move(e.deltaY > 0 ? 1 : -1); }, { passive: false });
    OS.on('events', () => OS.windows.includes(win) && render());
    OS.on('day', () => OS.windows.includes(win) && render());
    render();
    return win;
  }

  function menus(st, win) {
    return [
      { title: '파일', items: [
        { label: '새 일정', key: 'Alt+N', action: st.focusNew },
        { sep: 1 },
        { label: '닫기', key: 'Alt+W', action: () => win.close() }
      ] },
      { title: '편집', items: OS.editItems() },
      { title: '보기', items: [
        { label: '오늘', key: 'Alt+T', action: st.today },
        { label: '이전 달', key: 'Alt+ArrowLeft', action: () => st.move(-1) },
        { label: '다음 달', key: 'Alt+ArrowRight', action: () => st.move(1) }
      ] },
      { title: '창문', items: OS.windowItems() },
      { title: '도움말', items: [{ label: '달력에 대하여', action: () => OS.appAbout(OS.apps.calendar) }] }
    ];
  }

  OS.register({
    id: 'calendar', name: '달력', get icon() { return OS.calendarIcon(); },
    launch() {
      const w = OS.wm.byApp('calendar')[0];
      if (w) { OS.wm.restore(w); return w; }
      return createWindow();
    }
  });
})();
