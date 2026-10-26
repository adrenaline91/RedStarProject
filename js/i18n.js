(function () {
  'use strict';
  const I = OS.i18n = { dicts: {}, raw: {} };

  I.BUILTIN = [
    { id: 'kp', name: '조선어', note: '붉은별 원본', locale: 'ko-KP' },
    { id: 'ko', name: '한국어', note: '남조선 표준어', locale: 'ko-KR', noIntl: true, fallback: null },
    { id: 'en', name: 'English', locale: 'en-US', fallback: null },
    { id: 'fr', name: 'Français', locale: 'fr-FR' },
    { id: 'es', name: 'Español', locale: 'es-ES' },
    { id: 'de', name: 'Deutsch', locale: 'de-DE' },
    { id: 'it', name: 'Italiano', locale: 'it-IT' },
    { id: 'pt', name: 'Português', locale: 'pt-BR' },
    { id: 'ru', name: 'Русский', locale: 'ru-RU' },
    { id: 'zh', name: '中文 (简体)', locale: 'zh-CN' },
    { id: 'ja', name: '日本語', locale: 'ja-JP' },
    { id: 'ar', name: 'العربية', locale: 'ar' }
  ];
  I.EXTRA = [
    ['af', 'Afrikaans'], ['sq', 'Shqip'], ['am', 'አማርኛ'], ['hy', 'Հայերեն'], ['az', 'Azərbaycan'], ['eu', 'Euskara'],
    ['be', 'Беларуская'], ['bn', 'বাংলা'], ['bs', 'Bosanski'], ['bg', 'Български'], ['ca', 'Català'], ['zh-Hant', '中文 (繁體)'],
    ['hr', 'Hrvatski'], ['cs', 'Čeština'], ['da', 'Dansk'], ['nl', 'Nederlands'], ['eo', 'Esperanto'], ['et', 'Eesti'],
    ['fil', 'Filipino'], ['fi', 'Suomi'], ['gl', 'Galego'], ['ka', 'ქართული'], ['el', 'Ελληνικά'], ['gu', 'ગુજરાતી'],
    ['ha', 'Hausa'], ['he', 'עברית'], ['hi', 'हिन्दी'], ['hu', 'Magyar'], ['is', 'Íslenska'], ['id', 'Bahasa Indonesia'],
    ['ga', 'Gaeilge'], ['kn', 'ಕನ್ನಡ'], ['kk', 'Қазақ'], ['km', 'ខ្មែរ'], ['ky', 'Кыргызча'], ['lo', 'ລາວ'],
    ['la', 'Latina'], ['lv', 'Latviešu'], ['lt', 'Lietuvių'], ['lb', 'Lëtzebuergesch'], ['mk', 'Македонски'], ['ms', 'Bahasa Melayu'],
    ['ml', 'മലയാളം'], ['mt', 'Malti'], ['mr', 'मराठी'], ['mn', 'Монгол'], ['my', 'မြန်မာ'], ['ne', 'नेपाली'],
    ['no', 'Norsk'], ['fa', 'فارسی'], ['pl', 'Polski'], ['pa', 'ਪੰਜਾਬੀ'], ['ro', 'Română'], ['sr', 'Српски'],
    ['si', 'සිංහල'], ['sk', 'Slovenčina'], ['sl', 'Slovenščina'], ['so', 'Soomaali'], ['sw', 'Kiswahili'], ['sv', 'Svenska'],
    ['tg', 'Тоҷикӣ'], ['ta', 'தமிழ்'], ['te', 'తెలుగు'], ['th', 'ไทย'], ['tr', 'Türkçe'], ['uk', 'Українська'],
    ['ur', 'اردو'], ['uz', 'Oʻzbek'], ['vi', 'Tiếng Việt'], ['cy', 'Cymraeg'], ['xh', 'isiXhosa'], ['yo', 'Yorùbá'], ['zu', 'isiZulu']
  ];

  const HANGUL = /[ㄱ-ㆎ가-힣]/;
  const cur = () => OS.settings.lang || 'kp';
  I.current = cur;
  I.info = id => I.BUILTIN.find(l => l.id === id) || { id, locale: id, extra: true, name: (I.EXTRA.find(e => e[0] === id) || [id, id])[1] };

  function compile(dict) {
    const exact = new Map(), tpl = [];
    for (const [k, v] of Object.entries(dict)) {
      if (/\{\d\}/.test(k)) {
        const order = [...k.matchAll(/\{(\d)\}/g)].map(m => +m[1]);
        const re = new RegExp('^' + k.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\d\}/g, '(.+?)') + '$');
        tpl.push({ re, order, v, weight: k.replace(/\{\d\}/g, '').length });
      } else exact.set(k, v);
    }
    tpl.sort((a, b) => b.weight - a.weight);
    return { exact, tpl };
  }
  I.add = (id, dict) => { I.raw[id] = dict; I.dicts[id] = compile(dict); };

  function chain(id) {
    const l = I.info(id), fb = l.fallback === undefined ? 'en' : l.fallback;
    return fb && fb !== id ? [id, fb] : [id];
  }
  function lookup(s, id) {
    for (const lid of chain(id)) {
      const d = I.dicts[lid];
      if (!d) continue;
      if (d.exact.has(s)) return d.exact.get(s);
      for (const t of d.tpl) {
        const m = s.match(t.re);
        if (m) {
          const args = [];
          t.order.forEach((n, i) => { args[n] = m[i + 1]; });
          return t.v.replace(/\{(\d)\}/g, (_, n) => line(args[n] || '', id));
        }
      }
    }
    return null;
  }

  const WD = '일월화수목금토';
  function fmt(id, date, o) {
    try { return new Intl.DateTimeFormat(I.info(id).locale, o).format(date); }
    catch (e) { return new Intl.DateTimeFormat('en', o).format(date); }
  }
  const juche = (j, id) => (lookup('주체{0}', id) || 'Juche {0}').replace('{0}', j);
  const SPECIAL = [
    [/^주체(\d+)\((\d+)\)년 (\d+)월 (\d+)일 (.)요일$/, (id, j, y, m, d) => `${fmt(id, new Date(y, m - 1, d), { dateStyle: 'full' })} · ${juche(j, id)}`],
    [/^(\d+)월 (\d+)일 \((.)\) (.+)$/, (id, m, d, w, rest) => `${fmt(id, new Date(2000, m - 1, d), { month: 'short', day: 'numeric' })} (${fmt(id, new Date(2023, 0, 1 + WD.indexOf(w)), { weekday: 'short' })}) ${line(rest, id)}`],
    [/^(\d+)년 (\d+)월$/, (id, y, m) => fmt(id, new Date(y, m - 1, 1), { year: 'numeric', month: 'long' })],
    [/^(\d+)월$/, (id, m) => fmt(id, new Date(2000, m - 1, 1), { month: 'long' })],
    [/^주체(\d+)\((\d+)\)년$/, (id, j, y) => `${juche(j, id)} (${y})`],
    [/^([일월화수목금토])요일$/, (id, w) => fmt(id, new Date(2023, 0, 1 + WD.indexOf(w)), { weekday: 'long' })],
    [/^([일월화수목금토])$/, (id, w) => fmt(id, new Date(2023, 0, 1 + WD.indexOf(w)), { weekday: 'short' })]
  ];
  function special(s, id) {
    if (I.info(id).noIntl) return null;
    for (const [re, f] of SPECIAL) {
      const m = s.match(re);
      if (m) return f(id, ...m.slice(1));
    }
    return null;
  }

  const SUFFIX = /(\s*(?:\.\.\.|…|:|：|➜|↗))$/;
  function line(s, id) {
    if (!HANGUL.test(s)) return s;
    const [, pre, core, post] = s.match(/^(\s*(?:[·•\-–]\s+)?)([\s\S]*?)(\s*)$/);
    if (/^\/\S/.test(core)) {
      return pre + core.split('/').map(seg => (seg && lookup(seg, id)) || seg).join('/') + post;
    }
    let r = special(core, id);
    if (r == null) r = lookup(core, id);
    if (r == null) {
      const sm = core.match(SUFFIX);
      if (sm) {
        const base = core.slice(0, -sm[1].length);
        const rb = special(base, id) != null ? special(base, id) : lookup(base, id);
        if (rb != null) r = rb + sm[1];
      }
    }
    return r == null ? s : pre + r + post;
  }
  I.t = (s, id = cur()) => (id === 'kp' || s == null) ? s : String(s).split('\n').map(l => line(l, id)).join('\n');
  OS.t = s => I.t(s);

  const texts = new WeakMap(), attrs = new WeakMap();
  const ATTRS = ['title', 'placeholder'];
  const skip = n => {
    const el = n.nodeType === 1 ? n : n.parentElement;
    return !el || el.closest('textarea, script, style, [data-notr]');
  };
  function doText(n) {
    if (skip(n)) return;
    const r = texts.get(n);
    const orig = r && n.nodeValue === r.shown ? r.orig : n.nodeValue;
    if (!HANGUL.test(orig)) { if (r) texts.delete(n); return; }
    const shown = I.t(orig);
    texts.set(n, { orig, shown });
    if (n.nodeValue !== shown) n.nodeValue = shown;
  }
  function doAttr(el, name) {
    const v = el.getAttribute(name);
    if (v == null) return;
    let rec = attrs.get(el);
    if (!rec) attrs.set(el, rec = {});
    const r = rec[name];
    const orig = r && v === r.shown ? r.orig : v;
    if (!HANGUL.test(orig)) { delete rec[name]; return; }
    const shown = I.t(orig);
    rec[name] = { orig, shown };
    if (v !== shown) el.setAttribute(name, shown);
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) ATTRS.forEach(a => root.hasAttribute(a) && doAttr(root, a));
    const tw = (root.ownerDocument || document).createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) doText(n);
      else ATTRS.forEach(a => n.hasAttribute(a) && doAttr(n, a));
    }
  }
  I.walk = walk;

  const baseH = OS.h;
  OS.h = html => { const el = baseH(html); walk(el); return el; };

  const docTitle = document.title;
  function apply() {
    walk(document.body);
    document.title = I.t(docTitle);
    document.documentElement.lang = I.info(cur()).locale;
    OS.emit('lang');
  }
  I.apply = apply;
  I.translateDoc = doc => {
    try {
      if (!doc.__origTitle) doc.__origTitle = doc.title;
      doc.title = I.t(doc.__origTitle);
      walk(doc.body);
    } catch (e) {}
  };

  new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'childList') m.addedNodes.forEach(walk);
      else if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttr(m.target, m.attributeName);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  OS.on('settings', k => k === 'lang' && apply());

  const CACHE_V = 1;
  I.cached = id => {
    const c = OS.store.get('i18n.' + id, null);
    return c && c.v === CACHE_V ? c.dict : null;
  };
  I.hasMachine = () => 'Translator' in self;
  I.machine = async (id, progress) => {
    const cached = I.cached(id);
    if (cached) { I.add(id, cached); return; }
    if (!I.hasMachine()) throw new Error('nosupport');
    const pair = { sourceLanguage: 'en', targetLanguage: id };
    const av = await Promise.race([
      self.Translator.availability(pair),
      new Promise(res => setTimeout(() => res('timeout'), 10000))
    ]);
    if (av === 'timeout') throw new Error('nosupport');
    if (av === 'unavailable') throw new Error('unavailable');
    const tr = await self.Translator.create(Object.assign({}, pair, {
      monitor(m) { m.addEventListener('downloadprogress', e => progress && progress('download', e.loaded)); }
    }));
    const src = I.raw.en, keys = Object.keys(src), out = {};
    for (let i = 0; i < keys.length; i++) {
      try {
        out[keys[i]] = (await tr.translate(src[keys[i]])).replace(/\{\s*(\d)\s*\}/g, '{$1}');
      } catch (e) { out[keys[i]] = src[keys[i]]; }
      if (progress && i % 8 === 0) progress('translate', i / keys.length);
    }
    try { tr.destroy && tr.destroy(); } catch (e) {}
    OS.store.set('i18n.' + id, { v: CACHE_V, dict: out });
    I.add(id, out);
  };
  I.clearCache = () => I.EXTRA.forEach(([id]) => { try { localStorage.removeItem('redstar.i18n.' + id); } catch (e) {} });

  I.restore = () => {
    const id = cur();
    if (I.info(id).extra) {
      const c = I.cached(id);
      if (c) I.add(id, c);
    }
    if (id !== 'kp') apply();
  };
})();
