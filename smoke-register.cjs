// Final smoke: load /register, type admin email, verify the email
// live-check runs and surfaces "já está registado".
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

async function main() {
  const v = await get('http://127.0.0.1:9222/json/version');
  if (v.status !== 200) { console.log('no chrome'); return; }
  const ws = new WebSocket(JSON.parse(v.body).webSocketDebuggerUrl);
  await new Promise((r) => ws.on('open', r));
  const cdp = new Cdp(ws);

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);

  // Capture network requests for /check-email
  await cdp.send('Network.enable', {}, sessionId);
  const seenRequests = [];
  ws.on('message', (data) => {
    const m = JSON.parse(data.toString());
    if (m.method === 'Network.requestWillBeSent' && m.params?.request?.url?.includes('/users/check-email')) {
      seenRequests.push(m.params.request.url);
    }
  });

  await cdp.send('Page.navigate', { url: 'http://localhost:3000/register' }, sessionId);
  await delay(9000);

  // Type into email field via React
  const eval1 = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const input = document.querySelector('input[name="email"]');
      if (!input) return { error: 'no email input' };
      setter.call(input, 'admin@globememories.com');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return { ok: true, value: input.value };
    })()`,
    returnByValue: true,
  }, sessionId);
  console.log('after type:', eval1.result.value);

  // Wait for the debounce (350ms) + network
  await delay(1500);

  const eval2 = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const errEl = document.querySelector('#reg-email-error');
      return {
        emailErrorText: errEl ? errEl.textContent : null,
        wrapClass: document.querySelector('input[name="email"]')?.parentElement?.className,
      };
    })()`,
    returnByValue: true,
  }, sessionId);
  console.log('after debounce:', eval2.result.value);
  console.log('check-email requests seen:', seenRequests);

  // Cleanup
  await cdp.send('Target.closeTarget', { targetId });
  ws.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
