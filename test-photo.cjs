// Test the profile photo flow end-to-end via real Chrome.
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

function get(url) { return new Promise((resolve, reject) => { http.get(url, (res) => { let b=''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b })); }).on('error', reject); }); }
function post(url, json) { const data = Buffer.from(JSON.stringify(json)); return new Promise((resolve, reject) => { const u = new URL(url); const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (res) => { let b=''; res.on('data', c => b += c); res.on('end', () => resolve(b)); }); req.on('error', reject); req.write(data); req.end(); }); }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
class Cdp { constructor(ws) { this.ws = ws; this.nextId = 1; this.pending = new Map(); ws.on('message', (data) => { const m = JSON.parse(data.toString()); if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id); if (m.error) reject(new Error(JSON.stringify(m.error))); else resolve(m.result); } }); } send(method, params = {}, sid) { const id = this.nextId++; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); const p = { id, method, params }; if (sid) p.sessionId = sid; this.ws.send(JSON.stringify(p)); }); } }

async function newSession(cdp) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Network.enable', {}, sessionId);
  return { targetId, sessionId };
}

async function evaluate(cdp, sid, expr) {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, timeout: 15000 }, sid);
  if (r.exceptionDetails) return { error: r.exceptionDetails.exception?.description };
  return r.result.value;
}

async function main() {
  const v = await get('http://127.0.0.1:9222/json/version');
  const ws = new WebSocket(JSON.parse(v.body).webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  const cdp = new Cdp(ws);

  // Login
  const lr = await post('http://localhost:8080/login', { username: 'admin', password: 'admin123' });
  const token = JSON.parse(lr).token;

  const { targetId, sessionId } = await newSession(cdp);

  // Track /detailed requests
  const seenDetailed = [];
  ws.on('message', (data) => {
    const m = JSON.parse(data.toString());
    if (m.method === 'Network.responseReceived' && m.params?.response?.url?.includes('/detailed')) {
      seenDetailed.push({ url: m.params.response.url, status: m.params.response.status });
    }
  });

  // Step 1: Inject auth state and visit /profile/admin
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/' }, sessionId);
  await delay(8000);
  await evaluate(cdp, sessionId, `(() => { localStorage.setItem('auth_token', ${JSON.stringify(token)}); localStorage.setItem('user', JSON.stringify({ id:1, username:'admin', email:'admin@globememories.com' })); })()`);
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/profile/admin' }, sessionId);
  await delay(8000);
  const before = await evaluate(cdp, sessionId, `(() => { const img = document.querySelector('.gm-avatar img'); return { src: img ? img.src : 'no-img', time: Date.now() }; })()`);
  console.log('1. Before upload, profile img src:', before);

  // Step 2: Upload a new photo via backend API directly (so we don't need to fight the file picker)
  // Use a tiny 1x1 PNG
  const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const boundary = '----NodeTest' + Date.now();
  const fileHeader = `Content-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`;
  const bodyStart = Buffer.from(`--${boundary}\r\n${fileHeader}`);
  const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([bodyStart, tinyPng, bodyEnd]);
  const upRes = await new Promise((resolve, reject) => {
    const u = new URL('http://localhost:8080/photos/upload');
    const req = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'Authorization': `Bearer ${token}`,
      },
    }, (res) => { let b=''; res.on('data', c => b += c); res.on('end', () => resolve(b)); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
  const uploaded = JSON.parse(upRes);
  console.log('2. Backend upload response:', uploaded);

  // Step 3: Navigate to /profile/edit/admin, then back to /profile/admin
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/profile/edit/admin' }, sessionId);
  await delay(7000);
  const editForm = await evaluate(cdp, sessionId, `(() => { return { firstName: document.querySelector('input[name="firstName"]')?.value, originalPhoto: window.localStorage.getItem('user') }; })()`);
  console.log('3. Edit page form state:', editForm);

  await cdp.send('Page.navigate', { url: 'http://localhost:3000/profile/admin' }, sessionId);
  await delay(8000);
  const after = await evaluate(cdp, sessionId, `(() => {
    const avatarEl = document.querySelector('.gm-avatar');
    const avatars = Array.from(document.querySelectorAll('.gm-avatar')).map(a => ({ class: a.className, html: a.outerHTML.slice(0, 300) }));
    const allImgs = Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src.slice(0, 200), alt: i.alt, complete: i.complete, naturalWidth: i.naturalWidth }));
    return {
      path: location.pathname,
      avatars,
      allImgCount: allImgs.length,
      imgSample: allImgs,
      // Dump the user in localStorage
      user: window.localStorage.getItem('user'),
      // And the storage key
      photoVer: window.localStorage.getItem('admin_profilePhotoVersion'),
    };
  })()`);
  console.log('4. After navigating back:', JSON.stringify(after, null, 2));

  // Step 5: Direct fetch of /users/1/detailed to see what backend returns
  const fetchRes = await new Promise((resolve, reject) => {
    const u = new URL('http://localhost:8080/users/1/detailed');
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }, (res) => { let b=''; res.on('data', c => b += c); res.on('end', () => resolve(b)); });
    req.on('error', reject);
    req.end();
  });
  const detailed = JSON.parse(fetchRes);
  console.log('5. Direct backend fetch /users/1/detailed:');
  console.log('   profilePhoto:', detailed.profilePhoto);
  console.log('   compare to uploaded.fileUrl:', uploaded.fileUrl);
  console.log('   match:', detailed.profilePhoto === uploaded.fileUrl);

  await cdp.send('Target.closeTarget', { targetId });
  ws.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
