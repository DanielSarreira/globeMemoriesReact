// Login, then load the authed pages where I changed headers and
// verify the new structure renders without errors.
const http = require('http');
const WebSocket = require('ws');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}
function post(url, json, headers = {}) {
  const data = json ? Buffer.from(JSON.stringify(json)) : null;
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': data.length } : {}), ...headers },
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}
function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }
class Cdp {
  constructor(ws) { this.ws = ws; this.nextId = 1; this.pending = new Map();
    ws.on('message', (data) => {
      const m = JSON.parse(data.toString());
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.error) reject(new Error(JSON.stringify(m.error)));
        else resolve(m.result);
      }
    }); }
  send(method, params = {}, sid) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const p = { id, method, params }; if (sid) p.sessionId = sid;
      this.ws.send(JSON.stringify(p));
    });
  }
}
async function evaluate(cdp, sid, expr) {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, timeout: 12000 }, sid);
  if (r.exceptionDetails) return { error: r.exceptionDetails.exception?.description };
  return r.result.value;
}

async function main() {
  const v = await get('http://127.0.0.1:9222/json/version');
  const ws = new WebSocket(JSON.parse(v.body).webSocketDebuggerUrl);
  await new Promise((r) => ws.on('open', r));
  const cdp = new Cdp(ws);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);

  // Login to get token
  const lr = await post('http://localhost:8080/login', { username: 'admin', password: 'admin123' });
  const token = JSON.parse(lr.body).token;
  console.log('login token len:', token.length);

  // Navigate to root, then inject auth state
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/' }, sessionId);
  await delay(8000);
  await evaluate(cdp, sessionId, `(() => {
    const u = { id: 1, username: 'admin', email: 'admin@globememories.com', profilePhoto: '', profilePicture: '', firstName: 'Admin', lastName: 'Globe' };
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('auth_token', ${JSON.stringify(token)});
    return 'ok';
  })()`);

  const pages = [
    {
      path: '/qanda',
      must: ['.gm-qa__head-icon', '.gm-qa__head-titles', '.gm-qa__head-title'],
      mustNot: ['.gm-qa__head-left'],
    },
    {
      path: '/notifications',
      must: ['.gm-notif__head-icon', '.gm-notif__head-info', '.gm-notif__head-title'],
      mustNot: ['.gm-notif__head-left'],
    },
    {
      path: '/users',
      must: ['.gm-users__head-icon', '.gm-users__head-info', '.gm-users__head-title'],
      mustNot: ['.gm-users__head-left'],
    },
    {
      path: '/travels',
      must: ['.gm-travels', '.gm-travels__filters', '.gm-travels__filters-toggle'],
      mustNot: [],
    },
    {
      path: '/weather',
      must: ['.gm-weather', '.gm-pagehead__row'.replace('__row','')], // not exact, just check the page renders
      mustNot: ['.gm-pagehead__row'],
    },
  ];

  for (const p of pages) {
    await cdp.send('Page.navigate', { url: `http://localhost:3000${p.path}` }, sessionId);
    await delay(7000);
    const result = await evaluate(cdp, sessionId, `(() => {
      const out = { path: location.pathname, must: {}, mustNot: {} };
      const want = ${JSON.stringify(p.must)};
      for (const s of want) out.must[s] = !!document.querySelector(s);
      const forbid = ${JSON.stringify(p.mustNot)};
      for (const s of forbid) out.mustNot[s] = !!document.querySelector(s);
      out.bodyChars = (document.body.innerText || '').length;
      out.title = document.title;
      return out;
    })()`);
    console.log('---', p.path, '---');
    console.log('  title:', result.title, 'bodyChars:', result.bodyChars);
    for (const [k, v] of Object.entries(result.must)) console.log('  MUST', k, v ? 'OK' : 'MISSING');
    for (const [k, v] of Object.entries(result.mustNot)) console.log('  FORBID', k, v ? 'STILL_PRESENT' : 'OK (gone)');
  }

  // Verify the AppShell sidebar contains the Weather entry
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/' }, sessionId);
  await delay(7000);
  const sidebar = await evaluate(cdp, sessionId, `(() => {
    const links = Array.from(document.querySelectorAll('.gm-app__nav-item'));
    return links.map((a) => a.textContent.trim().replace(/\\s+/g, ' '));
  })()`);
  console.log('--- sidebar nav items ---');
  for (const item of sidebar) console.log('  ', item);
  const mobileTop = await evaluate(cdp, sessionId, `(() => {
    const btns = Array.from(document.querySelectorAll('.gm-app__topbar .gm-app__iconbtn'));
    return btns.map((b) => b.getAttribute('aria-label'));
  })()`);
  console.log('--- mobile top bar buttons ---');
  for (const b of mobileTop) console.log('  ', b);
  const tabbar = await evaluate(cdp, sessionId, `(() => {
    const items = Array.from(document.querySelectorAll('.gm-app__tab'));
    return items.map((a) => a.textContent.trim().split(/\\s+/).pop());
  })()`);
  console.log('--- mobile tab bar ---');
  for (const item of tabbar) console.log('  ', item);

  await cdp.send('Target.closeTarget', { targetId });
  ws.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
