// e2e-auth.cjs — end-to-end test of auth flow with real backend
const http = require('http');
const WebSocket = require('ws');

function jsonRpc(method, params = {}, id = 1) {
  return JSON.stringify({ id, method, params });
}

async function httpJson(method, path, body) {
  const opts = {
    hostname: '127.0.0.1',
    port: 8080,
    path,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(body ? { 'Content-Length': Buffer.byteLength(JSON.stringify(body)) } : {}),
    },
  };
  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(d); } catch (e) { /* leave as null */ }
        resolve({ status: res.statusCode, body: json, raw: d, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // ── 1. Health check ──
  console.log('─── 1. Health check ───');
  try {
    const h = await httpJson('GET', '/actuator/health');
    console.log(`Health: HTTP ${h.status}`);
    if (h.body) console.log('  body:', JSON.stringify(h.body));
  } catch (e) {
    console.log('  (actuator may be disabled, trying /)');
  }

  // ── 2. GET /cities/countries ──
  console.log('\n─── 2. GET /cities/countries ───');
  const c = await httpJson('GET', '/cities/countries');
  console.log(`Status: ${c.status}, countries: ${Array.isArray(c.body) ? c.body.length : 'N/A'}`);
  if (Array.isArray(c.body)) console.log(`  first 3: ${c.body.slice(0, 3).join(', ')}`);

  // ── 3. POST /register ──
  console.log('\n─── 3. POST /register ───');
  const ts = Date.now();
  const newUser = {
    firstName: 'Test',
    lastName: 'User',
    nationality: 'Portugal',
    cityId: 1, // City required
    email: `test_${ts}@example.com`,
    username: `test_${ts}`,
    password: 'Password123!',
    passwordConfirm: 'Password123!',
    privateProfile: false,
  };
  const reg = await httpJson('POST', '/register', newUser);
  console.log(`Status: ${reg.status}`);
  if (reg.body) {
    const keys = Object.keys(reg.body);
    console.log(`  body keys: ${keys.join(', ')}`);
    if (reg.body.token) console.log(`  token (first 30 chars): ${reg.body.token.substring(0, 30)}...`);
    if (reg.body.username) console.log(`  username: ${reg.body.username}`);
    if (reg.body.id) console.log(`  id: ${reg.body.id}`);
  } else {
    console.log('  raw body:', reg.raw.substring(0, 500));
  }

  if (reg.status >= 400) {
    console.log('Registration failed. Aborting.');
    return;
  }

  // ── 4. POST /login ──
  console.log('\n─── 4. POST /login ───');
  const login = await httpJson('POST', '/login', {
    username: newUser.username,
    password: newUser.password,
  });
  console.log(`Status: ${login.status}`);
  if (login.body) {
    if (login.body.token) console.log(`  token (first 30 chars): ${login.body.token.substring(0, 30)}...`);
    if (login.body.username) console.log(`  username: ${login.body.username}`);
  } else {
    console.log('  raw body:', login.raw.substring(0, 500));
  }

  if (login.status >= 400 || !login.body || !login.body.token) {
    console.log('Login failed. Aborting.');
    return;
  }

  // ── 5. Verify with authenticated request ──
  console.log('\n─── 5. Authenticated /users/{id}/detailed ───');
  const userId = login.body.id || 1;
  const me = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1', port: 8080, path: `/users/${userId}/detailed`, method: 'GET',
      headers: { 'Authorization': `Bearer ${login.body.token}` },
    }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(d); } catch (e) { /* */ }
        resolve({ status: res.statusCode, body: json });
      });
    });
    req.on('error', reject);
    req.end();
  });
  console.log(`Status: ${me.status}`);
  if (me.body) {
    console.log(`  username: ${me.body.username}, email: ${me.body.email}, role: ${me.body.role}`);
  }

  // ── 6. Browser render of /login and /register ───
  console.log('\n─── 6. Browser render of /login and /register ───');
  const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const { spawn } = require('child_process');
  const proc = spawn(chrome, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=9222', '--remote-allow-origins=*', 'about:blank',
  ], { windowsHide: true });
  await new Promise((r) => setTimeout(r, 3500));

  // Get page from CDP
  const pages = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
  const page = pages.find((p) => p.type === 'page') || pages[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const cbs = new Map();
  const events = [];
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.id && cbs.has(msg.id)) {
      const { resolve, reject } = cbs.get(msg.id);
      cbs.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method) events.push(msg);
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id;
    cbs.set(i, { resolve: res, reject: rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  await new Promise((r) => ws.once('open', r));
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Console.enable');
  await send('Network.enable');

  async function visit(route) {
    events.length = 0;
    await send('Page.navigate', { url: `http://localhost:3000${route}` });
    await new Promise((r) => setTimeout(r, 6000));
    const r = await send('Runtime.evaluate', {
      expression: `({
        title: document.title,
        gmAuth5: !!document.querySelector('.gm-auth5'),
        gmAuth5Title: document.querySelector('.gm-auth5__title') ? document.querySelector('.gm-auth5__title').textContent : null,
        rootHasContent: (document.getElementById('root') || {}).children.length > 0,
        bodyText: document.body.textContent.trim().substring(0, 400),
      })`,
      returnByValue: true,
    });
    const v = r.result.value;
    const errors = events.filter((e) =>
      e.method === 'Runtime.exceptionThrown' ||
      (e.method === 'Log.entryAdded' && e.params.entry.level === 'error' && !e.params.entry.text.includes('cities/countries')) ||
      (e.method === 'Console.messageAdded' && e.params.message.level === 'error') ||
      (e.method === 'Network.loadingFailed' && !e.params.errorText.includes('cities/countries') && !e.params.errorText.includes('127.0.0.1:8080'))
    );
    console.log(`\n  ${route}:`);
    console.log(`    title: ${v.title}`);
    console.log(`    .gm-auth5 present: ${v.gmAuth5}`);
    console.log(`    title text: ${v.gmAuth5Title}`);
    console.log(`    body text (first 400): ${v.bodyText}`);
    console.log(`    errors (excluding expected backend-down): ${errors.length}`);
    errors.slice(0, 3).forEach((e) => {
      const t = e.params.exceptionDetails
        ? e.params.exceptionDetails.text + ' ' + (e.params.exceptionDetails.exception ? e.params.exceptionDetails.exception.description : '')
        : e.params.entry ? `[${e.params.entry.level}] ${e.params.entry.text}` : e.params.message ? e.params.message.text : JSON.stringify(e.params);
      console.log(`      ${(t || '').substring(0, 250)}`);
    });
  }

  await visit('/login');
  await visit('/register');

  ws.close();
  proc.kill();

  // ── 7. Verify user was actually written to DB ───
  console.log('\n─── 7. Verify user in PostgreSQL ───');
  const { execSync } = require('child_process');
  const r = execSync(`powershell -NoProfile -Command "$env:PGPASSWORD='password'; & 'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe' -h localhost -p 5432 -U postgres -d globalmemories -c 'SELECT id, username, email, role, private_profile, email_verified FROM app_user WHERE username = ${"'${newUser.username}'"}'"`, { encoding: 'utf8' });
  console.log(r);

  console.log('\n✅ ALL DONE');
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
