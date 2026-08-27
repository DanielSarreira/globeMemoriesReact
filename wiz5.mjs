// Check tripRating loaded and click Continuar bypassing validation
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

// Wait for fetch to complete
console.log('=== Wait + check tripRating ===');
await new Promise((r) => setTimeout(r, 3000));
const info = await evalJs(`
(() => {
  const stars = document.querySelectorAll('.gm-wiz__star');
  const active = Array.from(stars).filter(s => s.querySelector('svg')?.getAttribute('fill') === 'currentColor');
  return 'star buttons: ' + stars.length + ' / active: ' + active.length;
})()
`);
console.log('  stars:', info);

console.log('\n=== Click 5th star to set rating ===');
await evalJs(`
(() => {
  const stars = document.querySelectorAll('.gm-wiz__star');
  if (stars[4]) stars[4].click();
})()
`);
await new Promise((r) => setTimeout(r, 500));

console.log('=== Click Continuar ===');
await evalJs(`
(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const c = btns.find(b => b.innerText && b.innerText.includes('Continuar'));
  if (c) c.click();
})()
`);
await new Promise((r) => setTimeout(r, 2000));
await screenshot('C:/Users/Tiago/AppData/Local/Temp/screen-wizard-step2-v3.png');

const fields = await evalJs(`
(() => {
  const ins = Array.from(document.querySelectorAll('input, select, textarea'));
  return ins.map(i => (i.tagName + ':' + JSON.stringify({ v: (i.value || '').slice(0, 30), p: (i.placeholder || '').slice(0, 30) }))).join(' | ');
})()
`);
console.log('  fields:', fields);

const allText = await evalJs(`document.body.innerText.slice(0, 1500)`);
console.log('  body text snippet:', allText);

ws.close();
process.exit(0);
