// Smoke test for /my-travels via CDP — logs in first.
const http = require('http');
const WebSocket = require('ws');

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

function postJson(url, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
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
  // 1) Login
  const login = await postJson('http://127.0.0.1:8080/login', {
    username: 'admin',
    password: 'admin123',
  });
  const loginJson = JSON.parse(login.body);
  const token = loginJson.token;
  if (!token) {
    console.error('LOGIN_FAIL', login.status, login.body);
    process.exit(1);
  }
  console.log('LOGIN_OK token_len=' + token.length + ' user=' + loginJson.username);

  // 2) Get tabs
  const tabsJson = await get(`http://127.0.0.1:${port}/json`);
  const tabs = JSON.parse(tabsJson);
  const page = tabs.find((t) => t.type === 'page');
  if (!page) { console.error('NO_PAGE'); process.exit(1); }
  console.log('PAGE:', page.url);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.on('open', r));

  let id = 0;
  const pending = new Map();
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const t = msg.params.type;
      if (t === 'error' || t === 'warning') {
        console.log('CONSOLE_' + t.toUpperCase(), msg.params.args.map((a) => a.value).join(' '));
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.log('EXCEPTION', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      console.log('LOG_ERR', msg.params.entry.text);
    }
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
  await send('Log.enable');

  // 3) Navigate to / first so localStorage is on the same origin
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise((r) => setTimeout(r, 4000));

  // 4) Inject token + user into localStorage
  const userObj = {
    id: loginJson.id,
    username: loginJson.username,
    email: loginJson.email || 'admin@globememories.com',
    firstName: loginJson.firstName || 'Admin',
    lastName: loginJson.lastName || 'Globe Memories',
    role: loginJson.role || 'ADMIN',
    token: token,
  };
  const setLs = `localStorage.setItem('auth_token', ${JSON.stringify(token)}); localStorage.setItem('user', ${JSON.stringify(JSON.stringify(userObj))}); 'set: ' + localStorage.getItem('auth_token').slice(0,20);`;
  const setRes = await send('Runtime.evaluate', { expression: setLs, returnByValue: true });
  console.log('SET_LS_RESULT', JSON.stringify(setRes.result?.result?.value));

  // 5) Reload to /my-travels (full reload triggers AuthContext mount + load)
  await send('Page.navigate', { url: 'http://localhost:3000/my-travels' });
  await new Promise((r) => setTimeout(r, 12000));

  const expr = `JSON.stringify({
    title: document.title,
    url: window.location.href,
    hasShell: !!document.querySelector('.gm-app__shell, .gm-app__content, #root > div'),
    head: !!document.querySelector('.gm-mt__head'),
    chips: document.querySelectorAll('.gm-mt-chip').length,
    stats: document.querySelectorAll('.gm-mt-stat').length,
    cards: document.querySelectorAll('.gm-mt-card').length,
    empty: !!document.querySelector('.gm-mt-empty'),
    titleText: (document.querySelector('.gm-mt__head-title') || {}).innerText,
    subText: (document.querySelector('.gm-mt__head-sub') || {}).innerText,
    bodySample: (document.body.innerText || '').substring(0, 600)
  })`;

  const evalRes = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  console.log('===PAGE===');
  console.log(evalRes.result?.result?.value || JSON.stringify(evalRes));

  // Click the "Nova viagem" button to test that the type-picker opens
  const clickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /Nova viagem/.test(b.innerText));
      if (!btn) return 'NO_BTN';
      btn.click();
      return 'CLICKED';
    })()`,
    returnByValue: true,
  });
  console.log('CLICK_NEW', clickRes.result?.result?.value);
  await new Promise((r) => setTimeout(r, 1500));

  const pickerExpr = `JSON.stringify({
    pickerOpen: !!document.querySelector('.my-travels-type-modal'),
    pickerTitle: (document.querySelector('.my-travels-type-modal__title') || {}).innerText,
  })`;
  const pickerRes = await send('Runtime.evaluate', { expression: pickerExpr, returnByValue: true });
  console.log('===PICKER===');
  console.log(pickerRes.result?.result?.value);

  // Click the first type-card (Destino único) to advance into the editor
  const pickTypeRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = document.querySelectorAll('.my-travels-type-modal__body button, .my-travels-type-modal__body [role="button"]');
      let btn = [...cards].find((b) => /Destino/.test(b.innerText));
      if (!btn) btn = [...document.querySelectorAll('button')].find((b) => /Destino/.test(b.innerText) && /nico/.test(b.innerText));
      if (!btn) return 'NO_CARD';
      btn.click();
      // give React a tick
      return 'PICKED_CARD';
    })()`,
    returnByValue: true,
  });
  console.log('PICK_TYPE', pickTypeRes.result?.result?.value);
  await new Promise((r) => setTimeout(r, 800));

  const contRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const cont = [...document.querySelectorAll('button')].find((b) => /Continuar/.test(b.innerText));
      if (!cont) return 'NO_CONTINUAR';
      cont.click();
      return 'CLICKED_CONTINUAR';
    })()`,
    returnByValue: true,
  });
  console.log('CONTINUAR', contRes.result?.result?.value);
  await new Promise((r) => setTimeout(r, 3000));

  // Confirm the modal editor opens
  const modalExpr = `JSON.stringify({
    modalOpen: !!document.querySelector('.gm-modal-v3'),
    panel: !!document.querySelector('.gm-modal-v3__panel'),
    head: !!document.querySelector('.gm-modal-v3__head'),
    sidebar: !!document.querySelector('.gm-modal-v3__sidebar'),
    tabs: document.querySelectorAll('.gm-modal-v3__tab').length,
    foot: !!document.querySelector('.gm-modal-v3__foot'),
    titleText: (document.querySelector('#gm-modal-v3__title') || {}).innerText,
    tabLabels: [...document.querySelectorAll('.gm-modal-v3__tab .gm-modal-v3__tab-label')].map((l) => l.innerText),
    inputCount: document.querySelectorAll('.gm-modal-v3__content input, .gm-modal-v3__content select, .gm-modal-v3__content textarea').length,
    publishBtn: !!document.querySelector('.gm-modal-v3__btn--primary'),
    closeBtn: !!document.querySelector('.gm-modal-v3__btn--danger'),
    bodySample: (document.querySelector('.gm-modal-v3__content') || {}).innerText?.substring(0, 300),
  })`;
  const modalRes = await send('Runtime.evaluate', { expression: modalExpr, returnByValue: true });
  console.log('===MODAL===');
  console.log(modalRes.result?.result?.value);

  // Try to switch tabs (click "Preços" in sidebar) and confirm
  const switchRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const tab = [...document.querySelectorAll('.gm-modal-v3__tab')].find((b) => /Preços/.test(b.innerText));
      if (!tab) return 'NO_TAB';
      tab.click();
      return 'CLICKED_PREÇOS';
    })()`,
    returnByValue: true,
  });
  console.log('SWITCH_TAB', switchRes.result?.result?.value);
  await new Promise((r) => setTimeout(r, 600));

  const activeTabRes = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      active: (document.querySelector('.gm-modal-v3__tab.is-active .gm-modal-v3__tab-label') || {}).innerText,
      bodyHasCost: /Custo|Total|Preço/i.test((document.querySelector('.gm-modal-v3__content') || {}).innerText || ''),
    })`,
    returnByValue: true,
  });
  console.log('===ACTIVE_TAB===', activeTabRes.result?.result?.value);

  ws.close();
  process.exit(0);
})();
