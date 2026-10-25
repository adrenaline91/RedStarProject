(function () {
  'use strict';
  const KEYS = {
    q: 'ㅂ', w: 'ㅈ', e: 'ㄷ', r: 'ㄱ', t: 'ㅅ', y: 'ㅛ', u: 'ㅕ', i: 'ㅑ', o: 'ㅐ', p: 'ㅔ',
    a: 'ㅁ', s: 'ㄴ', d: 'ㅇ', f: 'ㄹ', g: 'ㅎ', h: 'ㅗ', j: 'ㅓ', k: 'ㅏ', l: 'ㅣ',
    z: 'ㅋ', x: 'ㅌ', c: 'ㅊ', v: 'ㅍ', b: 'ㅠ', n: 'ㅜ', m: 'ㅡ',
    Q: 'ㅃ', W: 'ㅉ', E: 'ㄸ', R: 'ㄲ', T: 'ㅆ', O: 'ㅒ', P: 'ㅖ'
  };
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const VV = { 'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ', 'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ', 'ㅡㅣ': 'ㅢ' };
  const CC = { 'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ' };
  const SPLIT = Object.fromEntries(Object.entries(CC).map(([k, v]) => [v, [k[0], k[1]]]));
  const isVowel = j => JUNG.includes(j);

  let state = null;
  let stack = [];
  let target = null, start = 0;

  const render = s => {
    if (s.cho && s.jung) {
      return String.fromCharCode(0xAC00 + (CHO.indexOf(s.cho) * 21 + JUNG.indexOf(s.jung)) * 28 + JONG.indexOf(s.jong || ''));
    }
    return s.cho || s.jung || '';
  };

  function reset() { state = null; stack = []; target = null; }

  function replace(el, text, len) {
    const v = el.value;
    el.value = v.slice(0, start) + text + v.slice(start + len);
    el.setSelectionRange(start + text.length, start + text.length);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function feed(el, j) {
    if (target !== el || el.selectionStart !== start + (state ? 1 : 0) || el.selectionStart !== el.selectionEnd) {
      if (el.selectionStart !== el.selectionEnd) {
        el.setRangeText('', el.selectionStart, el.selectionEnd, 'start');
      }
      state = null; stack = []; target = el; start = el.selectionStart;
    }
    const prev = state ? Object.assign({}, state) : null;
    let next = null, carry = null;
    const s = state;
    if (!isVowel(j)) {
      if (!s) next = { cho: j };
      else if (s.cho && !s.jung) carry = { cho: j };
      else if (s.jung && !s.cho) carry = { cho: j };
      else if (!s.jong) {
        if (JONG.includes(j)) next = Object.assign({}, s, { jong: j });
        else carry = { cho: j };
      } else if (CC[s.jong + j]) next = Object.assign({}, s, { jong: CC[s.jong + j] });
      else carry = { cho: j };
    } else {
      if (!s) next = { jung: j };
      else if (s.cho && !s.jung) next = Object.assign({}, s, { jung: j });
      else if (!s.jong) {
        if (VV[s.jung + j]) next = Object.assign({}, s, { jung: VV[s.jung + j] });
        else carry = { jung: j };
      } else {
        const sp = SPLIT[s.jong];
        const kept = Object.assign({}, s, { jong: sp ? sp[0] : '' });
        replace(el, render(kept), 1);
        start += 1;
        state = { cho: sp ? sp[1] : s.jong, jung: j };
        stack = [];
        replace(el, render(state), 0);
        return;
      }
    }
    if (carry) {
      start += state ? 1 : 0;
      state = carry;
      stack = [];
      replace(el, render(state), 0);
    } else {
      if (prev) stack.push(prev);
      const had = !!state;
      state = next;
      replace(el, render(state), had ? 1 : 0);
    }
  }

  function backspace(el) {
    if (!state || target !== el || el.selectionStart !== start + 1) return false;
    if (stack.length) {
      state = stack.pop();
      replace(el, render(state), 1);
    } else {
      replace(el, '', 1);
      reset();
    }
    return true;
  }

  const editable = el => el && ((el.tagName === 'INPUT' && /^(text|search|)$/.test(el.type)) || el.tagName === 'TEXTAREA') && !el.readOnly;

  document.addEventListener('keydown', e => {
    if (e.key === ' ' && e.shiftKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      reset();
      OS.set('ime', OS.settings.ime === 'ko' ? 'en' : 'ko');
      return;
    }
    const el = document.activeElement;
    if (OS.settings.ime !== 'ko' || !editable(el) || e.ctrlKey || e.altKey || e.metaKey || e.isComposing) { if (state && e.key.length > 1 && e.key !== 'Shift') reset(); return; }
    if (e.key === 'Backspace') {
      if (backspace(el)) e.preventDefault();
      return;
    }
    let ch = e.key;
    if (ch.length === 1 && /[a-zA-Z]/.test(ch)) {
      const j = KEYS[ch] || KEYS[ch.toLowerCase()];
      if (j) { e.preventDefault(); feed(el, j); return; }
    }
    if (e.key !== 'Shift') reset();
  }, true);
  document.addEventListener('pointerdown', reset, true);
  OS.on('settings', k => k === 'ime' && reset());
})();
