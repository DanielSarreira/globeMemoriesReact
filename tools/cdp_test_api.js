// Probe what URL the browser is using
const http = require('http');
const WebSocket = require('ws');

function fetchTargets() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json/list', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function main() {
  const targets = await fetchTargets();
  const wsUrl = targets.find(t => t.type === 'page')?.webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  let sessionId = null;
  ws.on('message', (raw) => {
    const m = JSON.parse(raw);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      if (m.error) p.rej(new Error(m.error.message));
      else p.res(m.result);
    }
  });
  await new Promise((r) => ws.once('open', r));
  const { targetId } = await new Promise((res, rej) => {
    const msgId = ++id;
    ws.send(JSON.stringify({ id: msgId, method: 'Target.createTarget', params: { url: 'about:blank' } }));
    pending.set(msgId, { res: res, rej: rej });
  });
  const attach = await new Promise((res, rej) => {
    const msgId = ++id;
    ws.send(JSON.stringify({ id: msgId, method: 'Target.attachToTarget', params: { targetId, flatten: true } }));
    pending.set(msgId, { res, rej });
  });
  sessionId = attach.sessionId;

  function send(method, params) {
    return new Promise((res, rej) => {
      const msgId = ++id;
      ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
      pending.set(msgId, { res, rej });
    });
  }

  await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:3000/login' });
  await new Promise((r) => setTimeout(r, 5000));

  // Test 1: try fetch from /trips/public-feed
  const r = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        const tryFetch = async (url) => {
          try {
            const r = await fetch(url, { method: 'GET' });
            return { url, status: r.status, ok: r.ok };
          } catch (e) {
            return { url, error: e.message };
          }
        };
        return {
          loginCheck: await tryFetch('http://localhost:8080/categories'),
          trips: await tryFetch('http://localhost:8080/trips/public-feed'),
          port3000: await tryFetch('http://localhost:3000/'),
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true,
  });
  console.log('Network tests:', JSON.stringify(r.result.value, null, 2));

  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(2); });
