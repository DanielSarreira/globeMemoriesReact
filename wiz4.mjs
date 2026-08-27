// Click Continuar 2x, see if step 2 (Destinos) shows
import http from 'http';
import WebSocket from 'ws';
import fs from 'fs';

const HOST = 'localhost';
const PORT = 9222;

function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: HOST, port: PORT, path }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function pickPage() {
  const tabs = await getJSON('/json');
  return tabs.find((t) => t.type === 'page' && t.url && t.url.includes('localhost:3000') && t.url.includes('/my-travels'));
}

const tab = await pickPage();
if (!tab) { console.log('NO_TAB'); process.exit(1); }
console.log('TAB', tab.id, tab.url);

const ws = new WebSocket(tab.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();

function send(method, params = {}) {
  const myId = ++id;
  return new Promise((resolve, reject) => {
    pending.set(myId, { resolve, reject });
    ws.send(JSON.stringify({ id: myId, method, params }));
  });
}

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.id) {
    const p = pending.get(msg.id);
    if (p) {
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    }
  }
});

await new Promise((r) => ws.on('open', r));
await send('Runtime.enable');
await send('Page.enable');
await send('Network.enable');

async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  return r.result.value;
}

async function screenshot(filename) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filename, Buffer.from(r.data, 'base64'));
  console.log('  saved:', filename);
}

console.log('=== /my-travels/2/edit ===');
await send('Page.navigate', { url: 'http://localhost:3000/my-travels/2/edit' });
await new Promise((r) => setTimeout(r, 6000));

console.log('=== Step 0 (essentials) - check tripRating field ===');
const tripRating = await evalJs(`
(() => {
  const sel = document.querySelector('.gm-wiz__star-rating, [role="radiogroup"], input[type="radio"]');
  if (!sel) return 'no rating';
  return 'rating elements: ' + document.querySelectorAll('input[type="radio"]').length;
})()
`);
console.log('  rating elements:', tripRating);

console.log('\n=== Find Continuar and click it ===');
for (let i = 0; i < 2; i++) {
  await evalJs(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const c = btns.find(b => b.innerText && b.innerText.includes('Continuar'));
      if (c) c.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 2000));
  const step = await evalJs(`
    (() => {
      const tabs = document.querySelectorAll('.gm-wiz__step-pill, button');
      const active = Array.from(document.querySelectorAll('*')).find(e => e.className && e.className.includes && e.className.includes('wiz__step-pill') && e.className.includes('active'));
      return active ? active.innerText.slice(0, 30) : 'no active step';
    })()
  `);
  console.log(`  after click ${i+1}:`, step);
}

await screenshot('C:/Users/Tiago/AppData/Local/Temp/screen-wizard-step2-v2.png');

const fields = await evalJs(`
(() => {
  const ins = Array.from(document.querySelectorAll('input, select, textarea'));
  return ins.map(i => (i.tagName + ':' + JSON.stringify({ v: (i.value || '').slice(0, 30), p: (i.placeholder || '').slice(0, 30) }))).join(' | ');
})()
`);
console.log('  fields:', fields);

ws.close();
process.exit(0);
