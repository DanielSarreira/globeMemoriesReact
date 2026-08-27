// Check Travels DOM.
const http = require('http');
const WebSocket = require('ws');
const delay = (ms) => new Promise(r => setTimeout(r, ms));
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
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  const lr = await post('http://localhost:8080/login', { username: 'admin', password: 'admin123' });
  const token = JSON.parse(lr).token;
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/' }, sessionId);
  await delay(8000);
  await cdp.send('Runtime.evaluate', { expression: `localStorage.setItem('auth_token', ${JSON.stringify(token)}); localStorage.setItem('user', JSON.stringify({ id:1, username:'admin', email:'admin@globememories.com' }));` }, sessionId);
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/travels' }, sessionId);
  await delay(8500);
  const r = await cdp.send('Runtime.evaluate', { expression: `(() => {
    const layout = document.querySelector('.gm-travels__layout');
    const sidebar = document.querySelector('.gm-travels__sidebar');
    const results = document.querySelector('.gm-travels__results');
    const grid = document.querySelector('.gm-travels__grid');
    const search = document.querySelector('.gm-travels__search');
    const cards = document.querySelectorAll('.gm-travel-card');
    const cats = document.querySelectorAll('.gm-travels__category-item');
    return {
      hasLayout: !!layout,
      layoutDisplay: layout ? getComputedStyle(layout).display : null,
      layoutGridTemplate: layout ? getComputedStyle(layout).gridTemplateColumns : null,
      hasSidebar: !!sidebar,
      sidebarWidth: sidebar ? sidebar.getBoundingClientRect().width : null,
      hasResults: !!results,
      resultsWidth: results ? results.getBoundingClientRect().width : null,
      hasGrid: !!grid,
      gridDisplay: grid ? getComputedStyle(grid).display : null,
      gridWidth: grid ? grid.getBoundingClientRect().width : null,
      cardCount: cards.length,
      categoryCount: cats.length,
      searchWidth: search ? search.getBoundingClientRect().width : null,
      bodyText: document.body.innerText.slice(0, 200),
    };
  })()`, returnByValue: true }, sessionId);
  console.log(JSON.stringify(r.result.value, null, 2));
  await cdp.send('Target.closeTarget', { targetId });
  ws.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
