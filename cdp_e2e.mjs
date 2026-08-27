// CDP e2e
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

async function nav(url) {
  await send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 4000));
}

async function screenshot(filename) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filename, Buffer.from(r.data, 'base64'));
  console.log('  saved:', filename);
}

console.log('\n=== 1. /my-travels ===');
await nav('http://localhost:3000/my-travels');
const url1 = await evalJs('location.pathname');
console.log('  URL:', url1);
const hasTrips = await evalJs(`document.body.innerText.includes('Lisboa ao Porto') || document.body.innerText.includes('Minhas')`);
console.log('  Has trip text:', hasTrips);
await screenshot('C:/Users/Tiago/AppData/Local/Temp/screen-1-mytravels.png');

console.log('\n=== 2. Find edit button ===');
const editClicked = await evalJs(`
(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const editBtn = btns.find(b => b.innerText && (b.innerText.toLowerCase().includes('editar') || b.innerText.toLowerCase().includes('edit')));
  if (editBtn) { editBtn.click(); return 'clicked: ' + editBtn.innerText.slice(0, 30); }
  const ariaBtn = btns.find(b => b.getAttribute && b.getAttribute('aria-label') && b.getAttribute('aria-label').toLowerCase().includes('edit'));
  if (ariaBtn) { ariaBtn.click(); return 'aria-clicked: ' + ariaBtn.getAttribute('aria-label'); }
  return 'no edit button found, total buttons: ' + btns.length;
})()
`);
console.log('  ', editClicked);
await new Promise((r) => setTimeout(r, 3000));
const url2 = await evalJs('location.pathname');
console.log('  URL after click:', url2);
const hasModal = await evalJs(`!!document.querySelector('.modal, [role="dialog"]')`);
console.log('  Modal open:', hasModal);
await screenshot('C:/Users/Tiago/AppData/Local/Temp/screen-2-edit.png');

console.log('\n=== 3. Inspect country/city ===');
const countryVal = await evalJs(`
(() => {
  const labels = Array.from(document.querySelectorAll('label'));
  const cl = labels.find(l => l.innerText && l.innerText.includes('País'));
  if (!cl) return 'no País label';
  const grp = cl.closest('.form-group, .form-row, div');
  if (!grp) return 'no group';
  const sel = grp.querySelector('select, input');
  if (sel) return 'tag=' + sel.tagName + ' value="' + (sel.value || '') + '" placeholder="' + (sel.placeholder || '') + '"';
  return 'no input found';
})()
`);
console.log('  País field:', countryVal);

const cityVal = await evalJs(`
(() => {
  const labels = Array.from(document.querySelectorAll('label'));
  const cl = labels.find(l => l.innerText && l.innerText.includes('Cidade'));
  if (!cl) return 'no Cidade label';
  const grp = cl.closest('.form-group, .form-row, div');
  if (!grp) return 'no group';
  const sel = grp.querySelector('select, input');
  if (sel) return 'tag=' + sel.tagName + ' value="' + (sel.value || '') + '" placeholder="' + (sel.placeholder || '') + '"';
  return 'no input found';
})()
`);
console.log('  Cidade field:', cityVal);

ws.close();
process.exit(0);
