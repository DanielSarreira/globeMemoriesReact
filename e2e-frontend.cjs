// e2e-frontend.cjs — verify frontend pages render correctly with the new design
const http = require('http');
const WebSocket = require('ws');

const PAGES_TO_TEST = [
  { route: '/login', name: 'Login', expect: ['.gm-auth5', '.gm-auth5__title', '.gm-auth5__card', '.gm-auth5__submit'] },
  { route: '/register', name: 'Register', expect: ['.gm-auth5', '.gm-auth5__title', '.gm-auth5__terms', '.gm-auth5__submit'] },
  { route: '/travels', name: 'Travels', expect: ['.gm-travels', '.gm-travels__filters', '.gm-travels__grid', '.gm-travel-card'] },
];

async function main() {
  // Start Chrome headless
  const { spawn } = require('child_process');
  const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const proc = spawn(chrome, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=9222', '--remote-allow-origins=*', 'about:blank',
  ], { windowsHide: true });
  await new Promise((r) => setTimeout(r, 3500));

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

  // For protected pages, we need to authenticate first.
  // Use the e2e user we created in e2e-full.cjs (e2e_<timestamp>).
  // Find the latest one in the DB via a small bash query.
  const { execSync } = require('child_process');
  let latestUsername = null;
  try {
    const out = execSync(
      'powershell -NoProfile -Command ' +
      '"$env:PGPASSWORD=\\"password\\"; ' +
      '& \\"C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe\\" ' +
      '-h localhost -p 5432 -U postgres -d globalmemories ' +
      '-tA -c \\"SELECT username FROM app_user WHERE username LIKE \'\'e2e_%\'\' ORDER BY id DESC LIMIT 1\\""',
      { encoding: 'utf8' }
    );
    latestUsername = out.trim();
  } catch (e) {
    console.log('DB query failed (will try e2e_1784635422135):', e.message);
    latestUsername = 'e2e_1784635422135';
  }
  if (!latestUsername) latestUsername = 'e2e_1784635422135';
  console.log(`\nAuthenticating as ${latestUsername} before protected routes...`);
  await send('Page.navigate', { url: 'http://localhost:3000/login' });
  await new Promise((r) => setTimeout(r, 5000));
  // Fill in the login form
  await send('Runtime.evaluate', {
    expression: `(() => {
      const userInp = document.getElementById('login-username');
      const passInp = document.getElementById('login-password');
      if (!userInp || !passInp) return 'no-form';
      const setVal = (el, v) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      setVal(userInp, ${JSON.stringify(latestUsername)});
      setVal(passInp, 'Password123!');
      return 'filled';
    })()`,
    returnByValue: true,
  });
  // Submit
  await send('Runtime.evaluate', {
    expression: `document.querySelector('form.gm-auth5__form').requestSubmit();`,
  });
  await new Promise((r) => setTimeout(r, 5000));
  console.log(`  current URL after login: ${await send('Runtime.evaluate', { expression: 'location.pathname', returnByValue: true }).then(r => r.result.value)}`);

  for (const t of PAGES_TO_TEST) {
    console.log(`\n${'='.repeat(50)}\n${t.name}: ${t.route}\n${'='.repeat(50)}`);
    events.length = 0;
    await send('Page.navigate', { url: `http://localhost:3000${t.route}` });
    await new Promise((r) => setTimeout(r, 8000));

    const r = await send('Runtime.evaluate', {
      expression: `({
        title: document.title,
        selectors: ${JSON.stringify(t.expect)}.reduce((acc, sel) => {
          acc[sel] = !!document.querySelector(sel);
          return acc;
        }, {}),
        bodyText: document.body.textContent.trim().substring(0, 600),
      })`,
      returnByValue: true,
    });
    const v = r.result.value;
    console.log(`  title: ${v.title}`);
    console.log(`  expected selectors:`);
    for (const [sel, ok] of Object.entries(v.selectors)) {
      console.log(`    ${ok ? '✓' : '✗'} ${sel}`);
    }
    console.log(`  bodyText: ${v.bodyText.substring(0, 300)}`);

    const errors = events.filter((e) =>
      (e.method === 'Runtime.exceptionThrown') ||
      (e.method === 'Log.entryAdded' && e.params.entry.level === 'error' && !e.params.entry.text.includes('ERR_CONNECTION_REFUSED')) ||
      (e.method === 'Console.messageAdded' && e.params.message.level === 'error' && !e.params.message.text.includes('500')) ||
      (e.method === 'Network.loadingFailed' && !e.params.errorText.includes('ERR_CONNECTION_REFUSED') && !e.params.errorText.includes('127.0.0.1:8080'))
    );
    console.log(`  errors: ${errors.length}`);
    errors.slice(0, 5).forEach((e) => {
      const t = e.params.exceptionDetails
        ? (e.params.exceptionDetails.text || '') + ' ' + (e.params.exceptionDetails.exception ? e.params.exceptionDetails.exception.description : '')
        : e.params.entry ? `[${e.params.entry.level}] ${e.params.entry.text}` : '';
      console.log(`    ${(t || '').substring(0, 200)}`);
    });

    // Screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const path = `C:\\Users\\Tiago\\AppData\\Local\\Temp\\e2e-${t.name.toLowerCase()}.png`;
    require('fs').writeFileSync(path, Buffer.from(shot.data, 'base64'));
    console.log(`  screenshot: ${path}`);
  }

  ws.close();
  proc.kill();
  console.log('\n=== ALL DONE ===');
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
