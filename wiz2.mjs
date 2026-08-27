// Navigate to step 'where' and check País/Cidade
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
await new Promise((r) => setTimeout(r, 5000));
console.log('  URL:', await evalJs('location.pathname'));
await screenshot('C:/Users/Tiago/AppData/Local/Temp/screen-wizard-2.png');

console.log('\n=== Click "where" step ===');
const clicked = await evalJs(`
(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const where = btns.find(b => b.innerText && b.innerText.toLowerCase().includes('onde') || b.innerText && b.innerText.toLowerCase().includes('where') || b.innerText && b.innerText.toLowerCase().includes('destino'));
  if (where) { where.click(); return 'clicked: ' + where.innerText.slice(0, 40); }
  return 'no where button, btns: ' + btns.map(b => b.innerText?.slice(0, 20)).join(' | ');
})()
`);
console.log('  ', clicked);
await new Promise((r) => setTimeout(r, 2000));
await screenshot('C:/Users/Tiago/AppData/Local/Temp/screen-wizard-where.png');

const fields = await evalJs(`
(() => {
  const ins = Array.from(document.querySelectorAll('input, select, textarea'));
  return ins.map(i => (i.tagName + ':' + (i.value || i.placeholder || i.name || '').slice(0, 50))).join(' | ');
})()
`);
console.log('  fields:', fields);

ws.close();
process.exit(0);
