(function () {
  'use strict';
  const KEYS = [
    ['MC', 'mc'], ['M+', 'm+'], ['M−', 'm-'], ['MR', 'mr'],
    ['C', 'c'], ['±', 'neg'], ['%', '%'], ['÷', '/'],
    ['7', '7'], ['8', '8'], ['9', '9'], ['×', '*'],
    ['4', '4'], ['5', '5'], ['6', '6'], ['−', '-'],
    ['1', '1'], ['2', '2'], ['3', '3'], ['+', '+'],
    ['0', '0'], ['.', '.'], ['=', '=']
  ];

  function createWindow() {
    const body = OS.h(`<div class="calc">
      <div class="calc-lcd"><div class="calc-mem"></div><div class="calc-expr"></div><div class="calc-out">0</div></div>
      <div class="calc-keys">${KEYS.map(([l, k]) => `<button class="ck${/[0-9.]/.test(k) ? ' num' : /^[+\-*/=]$/.test(k) ? ' op' : ''}${k === '0' ? ' zero' : ''}${k === '=' ? ' eq' : ''}" data-k="${k}">${l}</button>`).join('')}</div>
    </div>`);
    const out = body.querySelector('.calc-out'), expr = body.querySelector('.calc-expr'), memEl = body.querySelector('.calc-mem');
    const st = { cur: '0', acc: null, op: null, fresh: true, mem: 0, hist: [] };
    const win = OS.wm.open({ app: 'calculator', title: '계산기', body, w: 230, h: 330, resizable: false, noMax: true, menus: () => menus(st, win) });
    win.calc = st;
    const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };

    const fmt = n => {
      if (!isFinite(n)) return '오유';
      const s = Math.abs(n) >= 1e12 || (Math.abs(n) < 1e-9 && n !== 0) ? n.toExponential(6) : String(+n.toPrecision(12));
      return s.replace('Infinity', '오유');
    };
    const calc = (a, b, op) => ({ '+': a + b, '-': a - b, '*': a * b, '/': b === 0 ? NaN : a / b })[op];
    function show() {
      const [i, d] = st.cur.split('.');
      out.textContent = (i.length > 3 && !i.includes('e') ? (+i).toLocaleString('en-US') : i) + (d != null ? '.' + d : '');
      out.style.fontSize = out.textContent.length > 12 ? '18px' : '26px';
      expr.textContent = st.op ? `${fmt(st.acc)} ${SYM[st.op]}` : '';
      memEl.textContent = st.mem ? 'M' : '';
      body.querySelectorAll('.ck.op').forEach(b => b.classList.toggle('on', b.dataset.k === st.op && st.fresh));
    }
    function press(k) {
      const v = parseFloat(st.cur);
      if (/^[0-9]$/.test(k)) {
        if (st.fresh || st.cur === '0') st.cur = k; else if (st.cur.replace(/[-.]/g, '').length < 15) st.cur += k;
        st.fresh = false;
      } else if (k === '.') {
        if (st.fresh) { st.cur = '0.'; st.fresh = false; } else if (!st.cur.includes('.')) st.cur += '.';
      } else if (k === 'c') {
        if (st.cur !== '0' && !st.fresh) st.cur = '0'; else { st.acc = null; st.op = null; st.cur = '0'; }
        st.fresh = true;
      } else if (k === 'neg') {
        st.cur = st.cur.startsWith('-') ? st.cur.slice(1) : (st.cur === '0' ? '0' : '-' + st.cur);
      } else if (k === '%') {
        st.cur = fmt(st.acc != null ? st.acc * v / 100 : v / 100);
        st.fresh = true;
      } else if ('+-*/'.includes(k)) {
        if (st.op && !st.fresh) { st.acc = calc(st.acc, v, st.op); st.cur = fmt(st.acc); }
        else if (st.acc == null || !st.op) st.acc = v;
        st.op = k;
        st.fresh = true;
      } else if (k === '=') {
        if (st.op) {
          const r = calc(st.acc, v, st.op);
          st.hist.unshift(`${fmt(st.acc)} ${SYM[st.op]} ${fmt(v)} = ${fmt(r)}`);
          st.cur = fmt(r);
          st.acc = null;
          st.op = null;
        }
        st.fresh = true;
      } else if (k === 'back') {
        if (!st.fresh) st.cur = st.cur.length > 1 ? st.cur.slice(0, -1) : '0';
        if (st.cur === '-') st.cur = '0';
      } else if (k === 'mc') st.mem = 0;
      else if (k === 'm+') { st.mem += v; st.fresh = true; }
      else if (k === 'm-') { st.mem -= v; st.fresh = true; }
      else if (k === 'mr') { st.cur = fmt(st.mem); st.fresh = true; }
      if (st.cur === '오유') { st.acc = null; st.op = null; st.fresh = true; }
      show();
    }
    st.press = press;
    body.querySelectorAll('.ck').forEach(b => b.addEventListener('click', () => press(b.dataset.k)));
    win.el.tabIndex = 0;
    win.el.addEventListener('keydown', e => {
      if (e.ctrlKey || e.altKey) return;
      const map = { Enter: '=', '=': '=', Escape: 'c', Backspace: 'back', Delete: 'c', ',': '.' };
      const k = map[e.key] || e.key;
      if (/^[0-9.+\-*/%=]$/.test(k) || ['c', 'back'].includes(k)) {
        e.preventDefault();
        press(k);
        const btn = body.querySelector(`.ck[data-k="${CSS.escape(k)}"]`);
        if (btn) { btn.classList.add('press'); setTimeout(() => btn.classList.remove('press'), 100); }
      }
    });
    setTimeout(() => win.el.focus(), 0);
    show();
    return win;
  }

  function menus(st, win) {
    return [
      { title: '편집', items: [
        { label: '복사', key: 'Ctrl+C', action: () => navigator.clipboard && navigator.clipboard.writeText(win.body.querySelector('.calc-out').textContent.replace(/,/g, '')) },
        { label: '붙이기', key: 'Ctrl+V', action: () => navigator.clipboard && navigator.clipboard.readText().then(t => { const n = parseFloat(t.replace(/,/g, '')); if (!isNaN(n)) { st.press('c'); String(n).split('').forEach(ch => st.press(ch === '-' ? 'neg' : ch)); } }).catch(() => {}) }
      ] },
      { title: '보기', items: [
        { label: '계산기록', action: () => OS.alert(st.hist.slice(0, 12).join('\n') || '기록이 없습니다.', '계산기록') }
      ] },
      { title: '창문', items: OS.windowItems() },
      { title: '도움말', items: [{ label: '계산기에 대하여', action: () => OS.appAbout(OS.apps.calculator) }] }
    ];
  }

  OS.register({
    id: 'calculator', name: '계산기', icon: 'icons/calculator.png',
    launch() {
      const w = OS.wm.byApp('calculator')[0];
      if (w) { OS.wm.restore(w); return w; }
      return createWindow();
    }
  });
})();
