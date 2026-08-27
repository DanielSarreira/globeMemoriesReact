// Final visual validation — screenshot every requested page.
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

function get(url) { return new Promise((resolve, reject) => { http.get(url, (res) => { let b=''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b })); }).on('error', reject); }); }
function post(url, json) { const data = Buffer.from(JSON.stringify(json)); return new Promise((resolve, reject) => { const u = new URL(url); const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (res) => { let b=''; res.on('data', c => b += c); res.on('end', () => resolve(b)); }); req.on('error', reject); req.write(data); req.end(); }); }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
class Cdp { constructor(ws) { this.ws = ws; this.nextId = 1; this.pending = new Map(); ws.on('message', (data) => { const m = JSON.parse(data.toString()); if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id); if (m.error) reject(new Error(JSON.stringify(m.error))); else resolve(m.result); } }); } send(method, params = {}, sid) { const id = this.nextId++; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); const p = { id, method, params }; if (sid) p.sessionId = sid; this.ws.send(JSON.stringify(p)); }); } }

async function withPage(ws, url, viewport, fn) {
  const cdp = new Cdp(ws);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Emulation.setDeviceMetricsOverride', viewport, sessionId);
  await cdp.send('Page.navigate', { url }, sessionId);
  await delay(9000);
  const out = await fn(cdp, sessionId);
  await cdp.send('Target.closeTarget', { targetId });
  return out;
}

async function evaluate(cdp, sid, expr) {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, timeout: 12000 }, sid);
  if (r.exceptionDetails) return { error: r.exceptionDetails.exception?.description };
  return r.result.value;
}

async function main() {
  const v = await get('http://127.0.0.1:9222/json/version');
  const ws = new WebSocket(JSON.parse(v.body).webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const lr = await post('http://localhost:8080/login', { username: 'admin', password: 'admin123' });
  const token = JSON.parse(lr).token;

  const pages = [
    { path: '/', name: 'home' },
    { path: '/travels', name: 'travels' },
    { path: '/profile/admin', name: 'profile' },
    { path: '/profile/edit/admin', name: 'edit-profile' },
    { path: '/users', name: 'users' },
    { path: '/my-travels', name: 'my-travels' },
    { path: '/future-travels', name: 'future-travels' },
    { path: '/interactive-map', name: 'interactive-map' },
    { path: '/notifications', name: 'notifications' },
    { path: '/qanda', name: 'qanda' },
    { path: '/weather', name: 'weather' },
    { path: '/login', name: 'login' },
    { path: '/register', name: 'register' },
  ];

  const out = 'C:\\Users\\Tiago\\AppData\\Local\\Temp';
  for (const sz of [{ width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, s: '' }]) {
    for (const p of pages) {
      const r = await withPage(ws, `http://localhost:3000${p.path}`, sz, async (cdp, sid) => {
        // Inject auth for protected pages
        if (!['/login', '/register'].includes(p.path)) {
          await evaluate(cdp, sid, `(() => { localStorage.setItem('auth_token', ${JSON.stringify(token)}); localStorage.setItem('user', JSON.stringify({ id:1, username:'admin', email:'admin@globememories.com' })); })()`);
          await delay(500);
        }
        const cap = await cdp.send('Page.captureScreenshot', { format: 'png' }, sid);
        return { data: cap.data, bodyChars: await evaluate(cdp, sid, `(document.body.innerText || '').length`), title: await evaluate(cdp, sid, `document.title`) };
      });
      fs.writeFileSync(path.join(out, `final-${p.name}.png`), Buffer.from(r.data, 'base64'));
      console.log(`${p.path} (${p.name}): title="${r.title}" bodyChars=${r.bodyChars}`);
    }
  }
  ws.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
