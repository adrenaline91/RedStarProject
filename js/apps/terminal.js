(function () {
  'use strict';
  const { fs } = OS;

  function createWindow() {
    const body = OS.h(`<div class="term" tabindex="0"><div class="term-out"></div><div class="term-line"><span class="term-ps"></span><input class="term-in" spellcheck="false" autocomplete="off"></div></div>`);
    const out = body.querySelector('.term-out'), input = body.querySelector('.term-in'), ps = body.querySelector('.term-ps');
    const st = { cwd: fs.HOME, hist: OS.store.get('term.hist', []), hi: -1 };
    const win = OS.wm.open({ app: 'terminal', title: '', body, w: 580, h: 360, minW: 320, minH: 180, menus: () => menus(win, st) });

    const short = p => p === fs.HOME ? '~' : p.startsWith(fs.HOME + '/') ? '~' + p.slice(fs.HOME.length) : p;
    const user = () => OS.settings.user;
    const prompt = () => {
      ps.textContent = `${user()}@redstar:${short(st.cwd)}$ `;
      win.setTitle(`${user()}@redstar: ${short(st.cwd)}`);
    };
    const print = (text, cls) => {
      const line = document.createElement('div');
      if (cls) line.className = cls;
      line.textContent = text;
      out.appendChild(line);
    };
    const scroll = () => { body.scrollTop = body.scrollHeight; };

    const CMDS = {
      help: () => '쓸수 있는 지령:\n  ls [-l] [경로]   cd [경로]    pwd       cat 화일\n  echo 글 [> 화일]  mkdir 이름   touch 이름  rm 이름\n  mv 원본 대상     cp 원본 대상  find 이름   open 경로\n  date  cal  whoami  uname [-a]  hostname  history  clear  redstar  exit',
      pwd: () => st.cwd,
      whoami: () => user(),
      hostname: () => 'redstar',
      uname: a => a[0] === '-a' ? 'Linux redstar 2.6.38.8-24.rs3.0.i686 #1 SMP i686 GNU/Linux' : 'Linux',
      date: () => { const d = new Date(); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${OS.DAYS[d.getDay()]}요일 ${OS.pad(d.getHours())}:${OS.pad(d.getMinutes())}:${OS.pad(d.getSeconds())} KST`; },
      cal: () => {
        const d = new Date(), y = d.getFullYear(), m = d.getMonth();
        const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
        let s = `      ${y}년 ${m + 1}월\n일 월 화 수 목 금 토\n` + '   '.repeat(first);
        for (let i = 1; i <= days; i++) s += String(i).padStart(2, ' ') + ((first + i) % 7 ? ' ' : '\n');
        return s;
      },
      echo: a => a.join(' '),
      clear: () => { out.innerHTML = ''; return null; },
      history: () => st.hist.slice().reverse().map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n'),
      exit: () => { win.close(); return null; },
      ls(a) {
        const long = a[0] === '-l';
        const p = fs.resolve(a[long ? 1 : 0] || '.', st.cwd);
        if (!fs.isDir(p)) {
          if (fs.get(p)) return fs.base(p);
          throw new Error(`ls: ${a[long ? 1 : 0]}: 그런 화일이나 등록부가 없습니다`);
        }
        const items = fs.list(p);
        if (!long) return items.map(it => it.type === 'dir' ? it.name + '/' : it.name).join('  ');
        return items.map(it => `${it.type === 'dir' ? 'd' : '-'}rw-r--r--  ${user()}  ${String(fs.size(it.node)).padStart(7)}  ${it.node && it.node.mtime ? OS.formatDate(it.node.mtime) : '                '}  ${it.name}`).join('\n');
      },
      cd(a) {
        const p = fs.resolve(a[0] || '~', st.cwd);
        if (!fs.isDir(p)) throw new Error(`cd: ${a[0]}: 그런 등록부가 없습니다`);
        st.cwd = p;
        return null;
      },
      cat(a) {
        if (!a[0]) throw new Error('cat: 화일이름을 주십시오');
        return a.map(n => {
          const p = fs.resolve(n, st.cwd), c = fs.read(p);
          if (c == null) throw new Error(`cat: ${n}: 그런 화일이 없습니다`);
          return c.startsWith('data:') ? `(2진 화일: ${n})` : c.replace(/\n$/, '');
        }).join('\n');
      },
      mkdir(a) { a.forEach(n => fs.mkdir(fs.resolve(n, st.cwd))); return null; },
      touch(a) { a.forEach(n => { const p = fs.resolve(n, st.cwd); if (!fs.get(p)) fs.write(p, ''); }); return null; },
      rm(a) {
        const names = a.filter(x => !x.startsWith('-'));
        if (!names.length) throw new Error('rm: 화일이름을 주십시오');
        names.forEach(n => { const p = fs.resolve(n, st.cwd); if (!fs.get(p)) throw new Error(`rm: ${n}: 그런 화일이 없습니다`); fs.remove(p); });
        return '(휴지통으로 옮겼습니다)';
      },
      mv(a) {
        const src = fs.resolve(a[0] || '', st.cwd), dst = fs.resolve(a[1] || '', st.cwd);
        if (!a[1] || !fs.get(src)) throw new Error('mv: 원본과 대상을 주십시오');
        if (fs.isDir(dst)) fs.move(src, dst);
        else if (fs.parent(src) === fs.parent(dst)) fs.rename(src, fs.base(dst));
        else { const moved = fs.move(src, fs.parent(dst)); fs.rename(moved, fs.base(dst)); }
        return null;
      },
      cp(a) {
        const src = fs.resolve(a[0] || '', st.cwd), n = fs.get(src);
        if (!a[1] || !n) throw new Error('cp: 원본과 대상을 주십시오');
        let dst = fs.resolve(a[1], st.cwd);
        if (fs.isDir(dst)) dst = fs.join(dst, fs.unique(dst, fs.base(src)));
        fs.put(dst, JSON.parse(JSON.stringify(n)));
        return null;
      },
      find(a) {
        const term = (a[0] || '').toLowerCase(), res = [];
        fs.walk(st.cwd, it => { if (!term || it.name.toLowerCase().includes(term)) res.push(short(it.path)); });
        return res.join('\n') || '(없음)';
      },
      open(a) {
        const p = fs.resolve(a[0] || '.', st.cwd);
        if (!fs.exists(p)) throw new Error(`open: ${a[0]}: 그런 화일이 없습니다`);
        OS.openPath(p);
        return null;
      },
      redstar: () => [
        '        ★           ' + `${user()}@redstar`,
        '       ★★★          ' + '-----------------',
        '  ★★★★★★★★★★★     ' + '조작체계: 붉은별 3.0',
        '    ★★★★★★★       ' + '핵심부: 2.6.38-24.rs3.0',
        '     ★★★★★        ' + `처리기: ${navigator.hardwareConcurrency || 1} 핵심`,
        '    ★★   ★★       ' + `창문관리기: 붉은별 창문관리기`,
        '   ★       ★      ' + `말단기: 말단기 3.0`
      ].join('\n')
    };

    function parse(line) {
      const args = [];
      line.replace(/"([^"]*)"|'([^']*)'|(\S+)/g, (m, a, b, c) => args.push(a != null ? a : b != null ? b : c));
      return args;
    }
    function run(line) {
      print(ps.textContent + line, 'term-echo');
      line = line.trim();
      if (!line) return;
      st.hist = [line, ...st.hist.filter(h => h !== line)].slice(0, 100);
      OS.store.set('term.hist', st.hist);
      let redirect = null;
      const m = line.match(/^(.*?)\s*(>>?)\s*(\S+)$/);
      if (m && /^echo\b|^cat\b|^ls\b|^date\b|^cal\b/.test(m[1])) { line = m[1]; redirect = { append: m[2] === '>>', file: m[3] }; }
      const [cmd, ...args] = parse(line);
      const fn = CMDS[cmd];
      if (!fn) return print(`${cmd}: 지령을 찾을수 없습니다. 'help' 를 입력하십시오.`, 'term-err');
      try {
        const res = fn(args);
        if (res == null) return;
        if (redirect) {
          const p = fs.resolve(redirect.file, st.cwd);
          fs.write(p, (redirect.append ? (fs.read(p) || '') : '') + res + '\n');
        } else print(res);
      } catch (err) {
        print(err.message, 'term-err');
      }
    }
    function complete() {
      const v = input.value, parts = v.split(' '), last = parts.pop();
      const dirPart = last.includes('/') ? last.slice(0, last.lastIndexOf('/') + 1) : '';
      const base = fs.resolve(dirPart || '.', st.cwd), pre = last.slice(dirPart.length);
      const names = parts.length ? fs.list(base).map(it => it.name + (it.type === 'dir' ? '/' : '')) : Object.keys(CMDS);
      const hits = names.filter(n => n.startsWith(pre));
      if (hits.length === 1) input.value = [...parts, dirPart + hits[0] + (hits[0].endsWith('/') ? '' : ' ')].join(' ');
      else if (hits.length > 1) { print(ps.textContent + v, 'term-echo'); print(hits.join('  ')); scroll(); }
    }

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { run(input.value); input.value = ''; st.hi = -1; prompt(); scroll(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (st.hi < st.hist.length - 1) input.value = st.hist[++st.hi]; }
      else if (e.key === 'ArrowDown') { e.preventDefault(); st.hi = Math.max(-1, st.hi - 1); input.value = st.hi < 0 ? '' : st.hist[st.hi]; }
      else if (e.key === 'Tab') { e.preventDefault(); complete(); }
      else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.innerHTML = ''; }
      else if (e.key === 'c' && e.ctrlKey && !window.getSelection().toString()) { e.preventDefault(); print(ps.textContent + input.value + '^C', 'term-echo'); input.value = ''; }
    });
    body.addEventListener('mouseup', () => { if (!window.getSelection().toString()) input.focus(); });
    win.clear = () => { out.innerHTML = ''; input.focus(); };
    print(`붉은별 3.0 말단기 - ${new Date().toLocaleString('ko-KR')}\n'help' 를 입력하면 지령목록을 볼수 있습니다.`, 'term-dim');
    prompt();
    setTimeout(() => input.focus(), 0);
    return win;
  }

  function menus(win) {
    return [
      { title: '파일', items: [
        { label: '새 창문', key: 'Alt+N', action: () => createWindow() },
        { label: '닫기', key: 'Alt+W', action: () => win.close() }
      ] },
      { title: '편집', items: [...OS.editItems(), { sep: 1 }, { label: '화면 지우기', hint: 'Ctrl+L', action: win.clear }] },
      { title: '창문', items: OS.windowItems() },
      { title: '도움말', items: [{ label: '말단기에 대하여', action: () => OS.appAbout(OS.apps.terminal) }] }
    ];
  }

  OS.register({ id: 'terminal', name: '말단기', icon: 'icons/terminal.png', launch: () => createWindow() });
})();
