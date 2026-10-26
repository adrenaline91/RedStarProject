const HB = 'https://engine.hyperbeam.com/v0/vm';

function json(data, status, cors) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors } });
}

export default {
  async fetch(req, env) {
    const allowed = (env.ALLOWED_ORIGINS || 'https://adrenaline91.github.io').split(',').map(s => s.trim());
    const origin = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin'
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (!allowed.includes(origin)) return json({ error: 'origin' }, 403, cors);
    if (!env.HB_API_KEY) return json({ error: 'config' }, 500, cors);

    const hb = (path, init = {}) => fetch(HB + path, {
      ...init,
      headers: { Authorization: 'Bearer ' + env.HB_API_KEY, 'Content-Type': 'application/json' }
    });
    const url = new URL(req.url);

    if (req.method === 'POST' && url.pathname === '/session') {
      const body = await req.json().catch(() => ({}));
      const start = /^https?:\/\//i.test(body.url || '') ? body.url : 'about:blank';
      const max = Number(env.MAX_SESSIONS || 3);
      const active = await hb('').then(r => r.json()).catch(() => ({ results: [] }));
      if ((active.results || []).length >= max) return json({ error: 'busy' }, 429, cors);
      const r = await hb('', {
        method: 'POST',
        body: JSON.stringify({
          start_url: start,
          kiosk: true,
          adblock: true,
          region: env.REGION || 'EU',
          timeout: {
            absolute: Number(env.MAX_SECONDS || 1800),
            inactive: 600,
            offline: 60
          }
        })
      });
      if (!r.ok) return json({ error: 'hyperbeam', status: r.status }, 502, cors);
      const d = await r.json();
      return json({ id: d.session_id, embed_url: d.embed_url, admin_token: d.admin_token }, 200, cors);
    }

    const m = url.pathname.match(/^\/session\/([\w-]+)(\/end)?$/);
    if (m && (req.method === 'DELETE' || (req.method === 'POST' && m[2]))) {
      await hb('/' + m[1], { method: 'DELETE' }).catch(() => {});
      return json({ ok: true }, 200, cors);
    }

    return json({ error: 'not found' }, 404, cors);
  }
};
