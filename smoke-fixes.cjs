// Smoke test using Chrome DevTools Protocol via WebSocket. Modern
// Chrome (>=128) requires PUT for /json/new, so we use the browser
// WebSocket endpoint and call Target.createTarget directly.
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

class CdpClient {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      this.ws.send(JSON.stringify(payload));
    });
  }
}

async function withPage(browserWs, url, fn) {
  const cdp = new CdpClient(browserWs);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Page.navigate', { url }, sessionId);
  // Wait for load (12MB bundle, give it time)
  await delay(9000);
  const out = await fn(cdp, sessionId);
  await cdp.send('Target.closeTarget', { targetId });
  return out;
}

async function evaluate(cdp, sessionId, expression) {
  const r = await cdp.send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true, timeout: 10000,
  }, sessionId);
  if (r.exceptionDetails) {
    return { error: r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails) };
  }
  return r.result.value;
}

async function main() {
  console.log('[smoke] verifying dev server');
  const root = await get('http://localhost:3000/');
  console.log('  GET / ->', root.status, '(', root.body.length, 'bytes)');

  // Find browser WS
  const v = await get('http://127.0.0.1:9222/json/version');
  if (v.status !== 200) {
    console.log('[smoke] no Chrome DevTools endpoint on 9222');
    return;
  }
  const browserWsUrl = JSON.parse(v.body).webSocketDebuggerUrl;
  console.log('[smoke] browser WS:', browserWsUrl);
  const browserWs = new WebSocket(browserWsUrl);
  await new Promise((r) => browserWs.on('open', r));

  const checks = [
    { url: 'http://localhost:3000/login', want: ['.gm-auth5', '.gm-auth5__card', '.gm-auth5__title'] },
    { url: 'http://localhost:3000/register', want: ['.gm-auth5', 'input[name="email"]', 'input[name="username"]', '.gm-auth5__terms'] },
    { url: 'http://localhost:3000/travels', want: ['.gm-travels', '.gm-travels__filters', '.gm-travels__filters-toggle'] },
    { url: 'http://localhost:3000/users', want: ['.gm-users__head', '.gm-users__head-icon', '.gm-users__head-title'] },
  ];

  for (const c of checks) {
    const out = await withPage(browserWs, c.url, async (cdp, sid) => {
      return evaluate(cdp, sid, `(() => {
        const want = ${JSON.stringify(c.want)};
        const out = {};
        for (const sel of want) {
          const el = document.querySelector(sel);
          out[sel] = el ? 'OK' : 'MISSING';
        }
        return { title: document.title, path: location.pathname, selectors: out, bodyChars: (document.body.innerText || '').length };
      })()`);
    });
    console.log(`[smoke] ${c.url}: title="${out.title}" path=${out.path} bodyChars=${out.bodyChars}`);
    for (const [k, v] of Object.entries(out.selectors)) console.log('   ', k, '->', v);
  }

  // Also check the Q&A and Notifications pages require auth — skip them, just confirm
  // 404 + redirects to login.
  console.log('[smoke] done');
  browserWs.close();
}

main().catch((e) => { console.error('[smoke] error:', e); process.exit(1); });
