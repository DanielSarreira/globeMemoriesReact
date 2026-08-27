// Take desktop + mobile screenshots of the affected pages.
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b })); }).on('error', reject);
  });
}
function post(url, json) {
  const data = Buffer.from(JSON.stringify(json));
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } },
      (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(b)); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
class Cdp {
  constructor(ws) { this.ws = ws; this.nextId = 1; this.pending = new Map();
    ws.on('message', (data) => { const m = JSON.parse(data.toString()); if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id); if (m.error) reject(new Error(JSON.stringify(m.error))); else resolve(m.result); } }); }
  send(method, params = {}, sid) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const p = { id, method, params }; if (sid) p.sessionId = sid;
      this.ws.send(JSON.stringify(p));
    });
  }
}

async function main() {
  const v = await get('http://127.0.0.1:9222/json/version');
  const ws = new WebSocket(JSON.parse(v.body).webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  const cdp = new Cdp(ws);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);

  const lr = await post('http://localhost:8080/login', { username: 'admin', password: 'admin123' });
  const token = JSON.parse(lr).token;

  await cdp.send('Page.navigate', { url: 'http://localhost:3000/' }, sessionId);
  await delay(8000);
  await cdp.send('Runtime.evaluate', { expression: `localStorage.setItem('auth_token', ${JSON.stringify(token)}); localStorage.setItem('user', JSON.stringify({ id:1, username:'admin', email:'admin@globememories.com', firstName:'Admin', lastName:'Globe' }));` }, sessionId);

  const out = 'C:\\Users\\Tiago\\AppData\\Local\\Temp';
  const sizes = [
    { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, suffix: '' },
    { width: 390, height: 800, deviceScaleFactor: 2, mobile: true, suffix: '-mobile' },
  ];
  const pages = [
    { path: '/qanda', file: 'gm-qanda' },
    { path: '/notifications', file: 'gm-notif' },
    { path: '/users', file: 'gm-users' },
    { path: '/travels', file: 'gm-travels' },
    { path: '/weather', file: 'gm-weather' },
    { path: '/login', file: 'gm-login' },
    { path: '/register', file: 'gm-register' },
  ];

  for (const sz of sizes) {
    await cdp.send('Emulation.setDeviceMetricsOverride', sz, sessionId);
    for (const p of pages) {
      await cdp.send('Page.navigate', { url: `http://localhost:3000${p.path}` }, sessionId);
      await delay(6500);
      const r = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      const fn = `${p.file}${sz.suffix}.png`;
      fs.writeFileSync(path.join(out, fn), Buffer.from(r.data, 'base64'));
      console.log('saved', fn);
    }
  }

  await cdp.send('Target.closeTarget', { targetId });
  ws.close();
}
main().catch(e => { console.error(e); process.exit(1); });
