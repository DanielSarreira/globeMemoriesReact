// CDP test wizard
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
  return tabs.find((t) => t.type === 'page' && t.url && t.url.includes('localhost:3000') && t.url.includes('/login'));
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
console.log('  title:', await evalJs('document.title'));
await screenshot('C:/Users/Tiago/AppData/Local/Temp/screen-wizard-1.png');

const countryVal = await evalJs(`
(() => {
  const inps = Array.from(document.querySelectorAll('input'));
  const countryInp = inps.find(i => {
    const p = i.closest('.gm-wiz__field, .form-group, div');
    return p && p.innerText && p.innerText.toLowerCase().includes('país');
  });
  if (countryInp) return 'input value="' + (countryInp.value || '') + '"';
  const sels = Array.from(document.querySelectorAll('select'));
  const c = sels.find(s => s.closest('.gm-wiz__field, .form-group, div')?.innerText?.toLowerCase().includes('país'));
  if (c) return 'select value="' + (c.value || '') + '"';
  return 'NOT FOUND';
})()
`);
console.log('  País:', countryVal);

const cityVal = await evalJs(`
(() => {
  const inps = Array.from(document.querySelectorAll('input'));
  const c = inps.find(i => i.closest('.gm-wiz__field, .form-group, div')?.innerText?.toLowerCase().includes('cidade'));
  if (c) return 'input value="' + (c.value || '') + '"';
  const sels = Array.from(document.querySelectorAll('select'));
  const c2 = sels.find(s => s.closest('.gm-wiz__field, .form-group, div')?.innerText?.toLowerCase().includes('cidade'));
  if (c2) return 'select value="' + (c2.value || '') + '"';
  return 'NOT FOUND';
})()
`);
console.log('  Cidade:', cityVal);

const allFields = await evalJs(`
(() => {
  const ins = Array.from(document.querySelectorAll('input, select, textarea'));
  return ins.slice(0, 25).map(i => (i.tagName + ':' + (i.name || i.placeholder || i.value || '').slice(0, 40))).join(' | ');
})()
`);
console.log('  all fields:', allFields);

ws.close();
process.exit(0);
