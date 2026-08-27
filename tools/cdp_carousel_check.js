// Full debug: login, then check /travel/9
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

function newPage(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    function send(method, params = {}) {
      const msgId = ++id;
      ws.send(JSON.stringify({ id: msgId, method, params }));
      return new Promise((res, rej) => pending.set(msgId, { res, rej }));
    }
    ws.on('message', (raw) => {
      let m;
      try { m = JSON.parse(raw); } catch (e) { return; }
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id); pending.delete(m.id);
        if (m.error) p.rej(new Error(m.error.message)); else p.res(m.result);
      }
    });
    ws.on('open', async () => {
      try { await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); resolve({ send, close: () => ws.close() }); }
      catch (e) { reject(e); }
    });
    ws.on('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const targets = await fetchTargets();
  const page = targets.find((t) => t.type === 'page');
  const client = await newPage(page.webSocketDebuggerUrl);

  // Track network for /trips/9
  const requests = [];
  client.send('Network.enable');
  // No easy way to hook Network.requestWillBeSent without a session.

  // Login
  await client.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await client.send('Page.navigate', { url: 'http://localhost:3000/login' });
  await sleep(3000);

  await client.send('Runtime.evaluate', {
    expression: `
      (function(){
        const u = document.querySelector('input[name="username"]');
        const p = document.querySelector('input[name="password"]');
        const set = (el, v) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, v);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        };
        if (u) set(u, 'admin');
        if (p) set(p, 'admin123');
        document.querySelector('button[type=submit]').click();
        return 'submitted';
      })();
    `,
  });
  await sleep(4000);

  // Navigate
  await client.send('Page.navigate', { url: 'http://localhost:3000/travel/9' });
  await sleep(5000);

  const r = await client.send('Runtime.evaluate', {
    expression: `JSON.stringify({
      url: location.href,
      title: document.title,
      hasHero: !!document.querySelector('.gm-td__hero'),
      hasCarousel: !!document.querySelector('.gm-carousel'),
      authToken: !!localStorage.getItem('auth_token'),
      h1: document.querySelector('h1')?.innerText || null,
      bodyText: (document.body.innerText || '').slice(0, 500),
    }, null, 2)`,
    returnByValue: true,
  });
  console.log('STATE:');
  console.log(r.result?.value);

  client.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
