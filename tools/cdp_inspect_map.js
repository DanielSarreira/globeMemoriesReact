// Simpler CDP test: just load /interactive-map, login, wait, then dump page state
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
  console.log('Fetching browser targets...');
  const targets = await fetchTargets();
  const wsUrl = targets.find(t => t.type === 'page')?.webSocketDebuggerUrl;
  if (!wsUrl) throw new Error('No page target found');

  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  let sessionId = null;
  const logs = [];

  function send(method, params = {}, useSession = true) {
    return new Promise((res, rej) => {
      const msgId = ++id;
      const payload = { id: msgId, method, params };
      if (useSession && sessionId) payload.sessionId = sessionId;
      ws.send(JSON.stringify(payload));
      pending.set(msgId, { res, rej, method });
    });
  }

  ws.on('message', (raw) => {
    const m = JSON.parse(raw);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      if (m.error) p.rej(new Error(p.method + ': ' + m.error.message));
      else p.res(m.result);
    } else if (m.method === 'Runtime.consoleAPICalled') {
      const args = (m.params.args || []).map(a => a.value ?? a.description ?? '').join(' ');
      logs.push(`[${m.params.type}] ${args}`);
    } else if (m.method === 'Runtime.exceptionThrown') {
      const ex = m.params.exceptionDetails;
      logs.push(`[exception] ${ex.text} ${ex.exception?.description || ''}`);
    } else if (m.method === 'Log.entryAdded') {
      logs.push(`[log/${m.params.entry.level}] ${m.params.entry.text}`);
    }
  });

  await new Promise((r) => ws.once('open', r));
  // Create a new page
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, false);
  const attach = await send('Target.attachToTarget', { targetId, flatten: true }, false);
  sessionId = attach.sessionId;

  await send('Page.enable');
  await send('Network.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  // Step 1: navigate to /login
  console.log('Step 1: navigate to /login');
  await send('Page.navigate', { url: 'http://localhost:3000/login' });
  await new Promise((r) => setTimeout(r, 5000));

  // Step 1b: check if login form rendered
  const rCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const u = document.querySelector('input[name="username"], input[autocomplete="username"]');
        const p = document.querySelector('input[type="password"]');
        const allInputs = Array.from(document.querySelectorAll('input')).map(i => ({ name: i.name, type: i.type, placeholder: i.placeholder }));
        return {
          url: location.href,
          title: document.title,
          hasU: !!u,
          hasP: !!p,
          inputs: allInputs,
        };
      })()
    `,
    returnByValue: true,
  });
  console.log('  Login form check:', JSON.stringify(rCheck.result.value, null, 2));

  // Step 2: fill login form
  console.log('Step 2: login as admin');
  const r1 = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        const u = document.querySelector('input[name="username"], input[autocomplete="username"]');
        const p = document.querySelector('input[type="password"]');
        if (!u || !p) return { err: 'no inputs' };
        const set = (el, v) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, v);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        };
        set(u, 'admin');
        set(p, 'admin123');
        document.querySelector('button[type="submit"]').click();
        return { ok: true };
      })()
    `,
    returnByValue: true,
  });
  console.log('  login result:', JSON.stringify(r1.result.value));
  await new Promise((r) => setTimeout(r, 6000));

  // Step 2b: check after login
  const rAfter = await send('Runtime.evaluate', {
    expression: `JSON.stringify({ url: location.href, title: document.title })`,
    returnByValue: true,
  });
  console.log('  After login:', rAfter.result.value);

  // Step 3: navigate to /interactive-map
  console.log('Step 3: navigate to /interactive-map');
  await send('Page.navigate', { url: 'http://localhost:3000/interactive-map' });
  await new Promise((r) => setTimeout(r, 8000));

  // Step 4: inspect page state
  console.log('Step 4: inspect state');
  const r2 = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const markers = document.querySelectorAll('.leaflet-marker-icon');
        const allPanes = document.querySelectorAll('.leaflet-pane').length;
        const visitedCounts = Array.from(document.querySelectorAll('.gm-map-panel__mode-count, .gm-map-sheet__mode-count'))
          .map(el => ({ text: el.textContent, parent: el.parentElement?.innerText?.slice(0, 50) }));
        // Inspect marker positions
        const markerInfo = Array.from(markers).map(m => {
          const style = m.getAttribute('style') || '';
          const t = m.style.transform || '';
          return t;
        });
        return {
          url: location.href,
          markerCount: markers.length,
          paneCount: allPanes,
          counts: visitedCounts,
          markerTransforms: markerInfo,
        };
      })()
    `,
    returnByValue: true,
  });
  console.log('  STATE:', JSON.stringify(r2.result.value, null, 2));

  // Step 5: take screenshot
  console.log('Step 5: screenshot');
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  require('fs').writeFileSync('tools/interactive-map-state.png', Buffer.from(ss.data, 'base64'));
  console.log('  saved to tools/interactive-map-state.png');

  console.log('\n=== Browser logs ===');
  logs.slice(-60).forEach(l => console.log('  ' + l));

  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e.message); console.error(e.stack); process.exit(2); });
