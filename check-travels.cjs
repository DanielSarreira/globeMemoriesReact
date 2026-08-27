const http = require('http');
const WebSocket = require('ws');
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
function get(url) { return new Promise((resolve, reject) => { http.get(url, (res) => { let b=''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b })); }).on('error', reject); }); }
function post(url, json) { const data = Buffer.from(JSON.stringify(json)); return new Promise((resolve, reject) => { const u = new URL(url); const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (res) => { let b=''; res.on('data', c => b += c); res.on('end', () => resolve(b)); }); req.on('error', reject); req.write(data); req.end(); }); }
class Cdp { constructor(ws) { this.ws = ws; this.nextId = 1; this.pending = new Map(); ws.on('message', (data) => { const m = JSON.parse(data.toString()); if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id); if (m.error) reject(new Error(JSON.stringify(m.error))); else resolve(m.result); } }); } send(method, params = {}, sid) { const id = this.nextId++; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); const p = { id, method, params }; if (sid) p.sessionId = sid; this.ws.send(JSON.stringify(p)); }); } }
async function main() {
  const v = await get('http://127.0.0.1:9222/json/version');
  const ws = new WebSocket(JSON.parse(v.body).webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  const cdp = new Cdp(ws);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 800, deviceScaleFactor: 2, mobile: true }, sessionId);
  const lr = await post('http://localhost:8080/login', { username: 'admin', password: 'admin123' });
  const token = JSON.parse(lr).token;
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/' }, sessionId);
  await delay(7500);
  const initScript = `localStorage.setItem('auth_token', ${JSON.stringify(token)}); localStorage.setItem('user', JSON.stringify({ id:1, username:'admin', email:'admin@globememories.com' }));`;
  await cdp.send('Runtime.evaluate', { expression: initScript }, sessionId);
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/travels' }, sessionId);
  await delay(7500);
  const expr = `(() => {
    const t = document.querySelector('.gm-travels__filters-toggle');
    const f = document.querySelector('.gm-travels__filters');
    const i = document.querySelector('.gm-travels__filters-inner');
    const c = document.querySelector('.gm-travels__chips-row');
    return {
      toggle: t ? { display: getComputedStyle(t).display, visible: t.offsetParent !== null } : 'absent',
      filters: f ? { dataOpen: f.getAttribute('data-open') } : 'absent',
      inner: i ? { display: getComputedStyle(i).display } : 'absent',
      chips: c ? { display: getComputedStyle(c).display } : 'absent',
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
  })()`;
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId);
  console.log(JSON.stringify(r.result.value, null, 2));
  await cdp.send('Target.closeTarget', { targetId });
  ws.close();
}
main().catch(e => { console.error(e); process.exit(1); });
