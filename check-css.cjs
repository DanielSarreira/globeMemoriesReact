const http = require('http');
const WebSocket = require('ws');
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
function get(url) { return new Promise((resolve, reject) => { http.get(url, (res) => { let b=''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b })); }).on('error', reject); }); }
class Cdp { constructor(ws) { this.ws = ws; this.nextId = 1; this.pending = new Map(); ws.on('message', (data) => { const m = JSON.parse(data.toString()); if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id); if (m.error) reject(new Error(JSON.stringify(m.error))); else resolve(m.result); } }); } send(method, params = {}, sid) { const id = this.nextId++; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); const p = { id, method, params }; if (sid) p.sessionId = sid; this.ws.send(JSON.stringify(p)); }); } }
async function main() {
  const v = await get('http://127.0.0.1:9222/json/version');
  const ws = new WebSocket(JSON.parse(v.body).webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  const cdp = new Cdp(ws);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'http://localhost:3000/travels' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  await delay(9000);
  const expr = `(() => {
    const sheets = Array.from(document.styleSheets);
    const matches = [];
    for (const s of sheets) {
      try {
        const rules = s.cssRules || s.rules;
        for (const r of rules) {
          if (r.cssText && r.cssText.includes('gm-travels__filters-toggle')) {
            matches.push(r.cssText);
          }
        }
      } catch (e) { /* CORS */ }
    }
    return matches;
  })()`;
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId);
  console.log(JSON.stringify(r.result.value, null, 2));
  await cdp.send('Target.closeTarget', { targetId });
  ws.close();
}
main().catch(e => { console.error(e); process.exit(1); });
