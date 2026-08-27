// verify-cdp.cjs — uses Chrome DevTools Protocol to actually load /login and /register
// and capture console errors + take screenshots.

const http = require('http');

function cdpRequest(port, method, params = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ method, params });
    const req = http.request({
      hostname: '127.0.0.1', port, path: '/json', method: 'GET',
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // 1. Get list of pages
  const pages = await cdpRequest(9222);
  const page = pages.find((p) => p.type === 'page') || pages[0];
  if (!page) { console.error('No page found'); return; }
  console.log(`Using page: ${page.url || page.id}`);

  // Use WebSocket to talk to CDP
  const WebSocket = require('ws');
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let id = 0;
  const callbacks = new Map();
  const events = [];

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.id && callbacks.has(msg.id)) {
      const { resolve, reject } = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method) {
      events.push(msg);
    }
  });

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const i = ++id;
      callbacks.set(i, { resolve, reject });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  }

  await new Promise((r) => ws.once('open', r));

  // Enable domains
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Network.enable');
  await send('Console.enable');

  async function visit(route, screenshotPath) {
    console.log(`\n${'='.repeat(60)}\n${route}\n${'='.repeat(60)}`);
    events.length = 0;
    await send('Page.navigate', { url: `http://localhost:3000${route}` });
    // Wait for load
    await new Promise((r) => setTimeout(r, 8000));

    // Evaluate the page
    const result = await send('Runtime.evaluate', {
      expression: `({
        title: document.title,
        rootHTML: document.getElementById('root') ? document.getElementById('root').innerHTML.substring(0, 3000) : 'NO ROOT',
        rootText: document.getElementById('root') ? document.getElementById('root').textContent.trim().substring(0, 1000) : 'NO ROOT',
        bodyText: document.body.textContent.trim().substring(0, 800),
        scripts: document.querySelectorAll('script').length,
        stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
        styleTags: document.querySelectorAll('style').length,
        styleTagLength: Array.from(document.querySelectorAll('style')).reduce((s, e) => s + e.textContent.length, 0),
        gmAuth5: !!document.querySelector('.gm-auth5'),
        gmAuth5Card: !!document.querySelector('.gm-auth5__card'),
        gmAuth5Title: document.querySelector('.gm-auth5__title') ? document.querySelector('.gm-auth5__title').textContent : null,
        gmAuthLayout: !!document.querySelector('.gm-auth-layout'),
        gmAuthLayoutContent: !!document.querySelector('.gm-auth-layout__content'),
        gmAuthLayoutContentHTML: (document.querySelector('.gm-auth-layout__content') || {}).innerHTML ? document.querySelector('.gm-auth-layout__content').innerHTML.substring(0, 2000) : null,
      })`,
      returnByValue: true,
    });

    const info = result.result.value;
    console.log(`title: ${info.title}`);
    console.log(`scripts: ${info.scripts}, stylesheets: ${info.stylesheets}, styleTags: ${info.styleTags} (${info.styleTagLength} chars)`);
    console.log(`\ngm-auth-layout present: ${info.gmAuthLayout}`);
    console.log(`gm-auth-layout__content present: ${info.gmAuthLayoutContent}`);
    console.log(`gm-auth5 (Login) present: ${info.gmAuth5}`);
    console.log(`gm-auth5__card present: ${info.gmAuth5Card}`);
    console.log(`gm-auth5__title: ${info.gmAuth5Title || '(null)'}`);
    console.log(`\nrootText (first 1000):\n${info.rootText || '(EMPTY)'}`);
    console.log(`\nrootHTML (first 3000):\n${info.rootHTML || '(EMPTY)'}`);
    console.log(`\nauth-layout__content HTML (first 2000):\n${info.gmAuthLayoutContentHTML || '(EMPTY)'}`);

    // Print errors and exceptions
    const errors = events.filter((e) =>
      e.method === 'Runtime.exceptionThrown' ||
      e.method === 'Log.entryAdded' && (e.params.entry.level === 'error' || e.params.entry.level === 'warning') ||
      e.method === 'Console.messageAdded' && (e.params.message.level === 'error' || e.params.message.level === 'warning') ||
      e.method === 'Network.loadingFailed' ||
      e.method === 'Network.responseReceived' && e.params.response.status >= 400
    );
    console.log(`\n--- Errors/Warnings (${errors.length}) ---`);
    errors.slice(0, 15).forEach((e, i) => {
      console.log(`\n[${i + 1}] ${e.method}`);
      if (e.params.exceptionDetails) {
        const ex = e.params.exceptionDetails;
        console.log(`  ${ex.text || ''}`);
        if (ex.exception && ex.exception.description) console.log(`  ${ex.exception.description.substring(0, 1500)}`);
        if (ex.stackTrace && ex.stackTrace.callFrames) {
          ex.stackTrace.callFrames.slice(0, 8).forEach((f) => {
            console.log(`  at ${f.functionName || '<anon>'} (${f.url}:${f.lineNumber}:${f.columnNumber})`);
          });
        }
      } else if (e.params.entry) {
        console.log(`  [${e.params.entry.level}] ${e.params.entry.text || ''}`);
        if (e.params.entry.url) console.log(`  url: ${e.params.entry.url}`);
      } else if (e.params.message) {
        console.log(`  [${e.params.message.level}] ${e.params.message.text || ''}`);
      } else if (e.params.response) {
        console.log(`  ${e.params.response.status} ${e.params.response.url}`);
      } else {
        console.log(`  ${JSON.stringify(e.params).substring(0, 600)}`);
      }
    });

    // Screenshot
    if (screenshotPath) {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      require('fs').writeFileSync(screenshotPath, Buffer.from(shot.data, 'base64'));
      console.log(`\nScreenshot saved: ${screenshotPath}`);
    }
  }

  await visit('/login', 'C:\\Users\\Tiago\\AppData\\Local\\Temp\\login-real.png');
  await visit('/register', 'C:\\Users\\Tiago\\AppData\\Local\\Temp\\register-real.png');

  ws.close();
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
