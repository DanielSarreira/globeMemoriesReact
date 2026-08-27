// Test the profile photo refresh path:
//  1) login as admin
//  2) visit /profile/admin
//  3) verify avatar src
//  4) navigate away then back, check that UserProfile refetches
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}
function post(url, json, headers = {}) {
  const data = json ? Buffer.from(JSON.stringify(json)) : null;
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': data.length } : {}), ...headers },
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
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

async function newSession(cdp) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Network.enable', {}, sessionId);
  return { targetId, sessionId };
}

async function evaluate(cdp, sid, expr) {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, timeout: 12000 }, sid);
  if (r.exceptionDetails) return { error: r.exceptionDetails.exception?.description };
  return r.result.value;
}

async function main() {
  const v = await get('http://127.0.0.1:9222/json/version');
  const ws = new WebSocket(JSON.parse(v.body).webSocketDebuggerUrl);
  await new Promise((r) => ws.on('open', r));
  const cdp = new Cdp(ws);
  const { targetId, sessionId } = await newSession(cdp);

  // Track /users/*/detailed requests
  const seenDetailed = [];
  ws.on('message', (data) => {
    const m = JSON.parse(data.toString());
    if (m.method === 'Network.requestWillBeSent' && m.params?.request?.url?.includes('/users/') && m.params.request.url.includes('/detailed')) {
      seenDetailed.push(m.params.request.url);
    }
  });

  // 1) Login as admin via the backend API
  const loginRes = await post('http://localhost:8080/login', { username: 'admin', password: 'admin123' });
  console.log('login:', loginRes.status);
  let token;
  try {
    const body = JSON.parse(loginRes.body);
    token = body.token || body.accessToken || body.access_token;
  } catch (e) { /* */ }
  if (!token) {
    // try alternate schema
    const body = JSON.parse(loginRes.body);
    token = body.token || body.accessToken;
    console.log('login body keys:', Object.keys(body || {}));
  }
  if (!token) { console.error('no token'); process.exit(1); }
  console.log('token len:', token.length);

  // 2) Set token + user in localStorage by navigating to / and injecting
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/' }, sessionId);
  await delay(8000);
  await evaluate(cdp, sessionId, `(() => {
    const u = { id: 1, username: 'admin', email: 'admin@globememories.com', profilePhoto: '', profilePicture: '' };
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('auth_token', ${JSON.stringify(token)});
    return 'set';
  })()`);

  // 3) Visit /profile/admin
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/profile/admin' }, sessionId);
  await delay(8000);
  const phase1 = await evaluate(cdp, sessionId, `(() => ({
    title: document.title,
    path: location.pathname,
    hasProfile: !!document.querySelector('.gm-profile, [class*="profile"]'),
    bodyChars: (document.body.innerText || '').length,
  }))()`);
  console.log('phase 1 (first visit):', phase1);

  // 4) Navigate to edit profile, then back
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/profile/edit/admin' }, sessionId);
  await delay(7000);
  // Dispatch the custom event as if a save just happened
  await evaluate(cdp, sessionId, `(() => {
    window.dispatchEvent(new CustomEvent('gm:profile-updated', { detail: { username: 'admin' } }));
    return 'dispatched';
  })()`);

  // 5) Navigate back to /profile/admin
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/profile/admin' }, sessionId);
  await delay(8000);
  const phase2 = await evaluate(cdp, sessionId, `(() => ({
    title: document.title,
    path: location.pathname,
    hasProfile: !!document.querySelector('.gm-profile, [class*="profile"]'),
    bodyChars: (document.body.innerText || '').length,
  }))()`);
  console.log('phase 2 (after edit-return):', phase2);
  console.log('detailed requests seen (', seenDetailed.length, '):', seenDetailed.slice(0, 5));

  await cdp.send('Target.closeTarget', { targetId });
  ws.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
