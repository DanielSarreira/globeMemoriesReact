// Real browser test via raw CDP (no playwright/puppeteer dependency).
// Verifies /interactive-map now shows trip markers.
const http = require('http');
const WebSocket = require('ws');

function fetchTargets() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json/list', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function newPage(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    const sessions = new Map();
    let pageSession = null;
    let currentUrl = '';
    const logs = [];

    function send(method, params = {}, sessionId = null) {
      const msgId = ++id;
      const payload = JSON.stringify({ id: msgId, method, params, sessionId });
      ws.send(payload);
      return new Promise((res, rej) => pending.set(msgId, { res, rej }));
    }

    function sendPage(method, params) {
      return send(method, params, pageSession);
    }

    ws.on('message', (raw) => {
      const m = JSON.parse(raw);
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id); pending.delete(m.id);
        if (m.error) p.rej(new Error(m.error.message));
        else p.res(m.result);
      } else if (m.method === 'Target.attachedToTarget' && m.params?.targetInfo?.type === 'page') {
        pageSession = m.params.sessionId;
      } else if (m.method === 'Runtime.consoleAPICalled') {
        const args = (m.params.args || []).map(a => a.value ?? a.description ?? '').join(' ');
        logs.push(`[${m.params.type}] ${args}`);
      } else if (m.method === 'Runtime.exceptionThrown') {
        const ex = m.params.exceptionDetails;
        logs.push(`[exception] ${ex.text} ${ex.exception?.description || ''}`);
      } else if (m.method === 'Network.responseReceived') {
        const u = m.params.response.url;
        const s = m.params.response.status;
        if (u.includes('localhost:8080') && (u.includes('trips') || u.includes('auth'))) {
          logs.push(`[net] ${s} ${u.replace('http://localhost:8080', '')}`);
        }
      } else if (m.method === 'Page.loadEventFired') {
        currentUrl = 'loaded';
      }
    });

    ws.on('open', async () => {
      try {
        // Create a new page target
        const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
        // Attach to it as a page session
        const attach = await send('Target.attachToTarget', { targetId, flatten: true });
        pageSession = attach.sessionId;
        resolve({ send: sendPage, logs, getLogs: () => logs });
      } catch (e) { reject(e); }
    });
    ws.on('error', reject);
  });
}

async function evalInPage(page, expr) {
  const r = await page.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ': ' + (r.exceptionDetails.exception?.description || ''));
  return r.result.value;
}

async function main() {
  console.log('Waiting for a target...');
  // Wait a bit for the browser to settle
  await new Promise((r) => setTimeout(r, 1500));

  const targets = await fetchTargets();
  const wsUrl = targets.find(t => t.type === 'page')?.webSocketDebuggerUrl;
  if (!wsUrl) throw new Error('No page target found');
  console.log('Using:', wsUrl);

  const page = await newPage(wsUrl);

  async function run() {
    console.log('\n=== STEP 1: open /login ===');
    await page.send('Page.enable');
    await page.send('Network.enable');
    await page.send('Page.navigate', { url: 'http://localhost:3000/login' });
    await new Promise((r) => setTimeout(r, 3500));

    console.log('=== STEP 2: login as admin ===');
    const loginResult = await evalInPage(page, `
      (async () => {
        // Find the username field
        const u = document.querySelector('input[name="username"], input[autocomplete="username"], input[placeholder*="ername" i], input[placeholder*="utilizador" i]');
        const p = document.querySelector('input[type="password"]');
        if (!u || !p) return { err: 'no inputs', inputs: Array.from(document.querySelectorAll('input')).map(i => i.name || i.placeholder) };
        const set = (el, v) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, v);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        set(u, 'admin');
        set(p, 'admin123');
        const btn = document.querySelector('button[type="submit"]');
        btn.click();
        return { ok: true };
      })()
    `);
    console.log('  login click result:', JSON.stringify(loginResult));
    await new Promise((r) => setTimeout(r, 4000));

    console.log('=== STEP 3: open /interactive-map ===');
    await page.send('Page.navigate', { url: 'http://localhost:3000/interactive-map' });
    await new Promise((r) => setTimeout(r, 6000));

    console.log('=== STEP 4: check markers + counts ===');
    const result = await evalInPage(page, `
      (() => {
        const markers = document.querySelectorAll('.leaflet-marker-icon').length;
        const allLeafletDivs = document.querySelectorAll('.leaflet-pane *').length;
        // Count badges
        const badges = Array.from(document.querySelectorAll('.gm-map-panel__mode-count, .gm-map-sheet__mode-count'))
          .map(el => el.textContent);
        // Try to find counts in the side panel
        const panelText = document.querySelector('.gm-map-panel')?.innerText?.slice(0, 200);
        const sheetText = document.querySelector('.gm-map-sheet')?.innerText?.slice(0, 200);
        return {
          leafletMarkers: markers,
          leafletPanes: allLeafletDivs,
          badges,
          panelText: panelText || null,
          sheetText: sheetText || null,
        };
      })()
    `);
    console.log('  result:', JSON.stringify(result, null, 2));

    console.log('=== STEP 5: take screenshot ===');
    const ss = await page.send('Page.captureScreenshot', { format: 'png' });
    const fs = require('fs');
    fs.writeFileSync('tools/interactive-map-after-fix.png', Buffer.from(ss.data, 'base64'));
    console.log('  saved to tools/interactive-map-after-fix.png');

    console.log('\n=== Browser logs (last 30) ===');
    page.getLogs().slice(-30).forEach(l => console.log('  ' + l));
  }

  await run();
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e.message); console.error(e.stack); process.exit(2); });
