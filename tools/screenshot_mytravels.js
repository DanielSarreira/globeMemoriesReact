// Screenshot /my-travels after login
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

const port = 9333;

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  const login = await postJson('http://127.0.0.1:8080/login', { username: 'admin', password: 'admin123' });
  const loginJson = JSON.parse(login.body);
  const token = loginJson.token;
  console.log('LOGIN_OK');

  const tabsJson = await get(`http://127.0.0.1:${port}/json`);
  const tabs = JSON.parse(tabsJson);
  const page = tabs.find((t) => t.type === 'page');
  if (!page) { console.error('NO_PAGE'); process.exit(1); }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.on('open', r));

  let id = 0;
  const pending = new Map();
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  });

  function send(method, params) {
    const i = ++id;
    return new Promise((resolve) => {
      pending.set(i, resolve);
      ws.send(JSON.stringify({ id: i, method, params: params || {} }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  // First go to /, set localStorage
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise((r) => setTimeout(r, 3000));
  const userObj = { id: loginJson.id, username: loginJson.username, email: 'admin@globememories.com', firstName: 'Admin', lastName: 'Globe Memories', role: 'ADMIN', token };
  await send('Runtime.evaluate', { expression: `localStorage.setItem('auth_token', ${JSON.stringify(token)}); localStorage.setItem('user', ${JSON.stringify(JSON.stringify(userObj))});` });

  // Then to /my-travels
  await send('Page.navigate', { url: 'http://localhost:3000/my-travels' });
  await new Promise((r) => setTimeout(r, 9000));

  // Full-page screenshot
  const layoutRes = await send('Page.getLayoutMetrics');
  const w = Math.ceil(layoutRes.result.contentSize.width);
  const h = Math.ceil(layoutRes.result.contentSize.height);
  console.log(`PAGE_SIZE ${w}x${h}`);

  const shotRes = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: Math.min(h, 2200), scale: 1 } });
  const data = shotRes.result.data;
  const path = 'C:\\Users\\Tiago\\Desktop\\Globe Memories -  Github\\globeMemoriesReact\\tools\\my-travels-screenshot.png';
  fs.writeFileSync(path, Buffer.from(data, 'base64'));
  console.log('SCREENSHOT_SAVED', path, 'bytes=' + Buffer.from(data, 'base64').length);

  ws.close();
  process.exit(0);
})();
