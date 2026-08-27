// Final screenshots: home + travels
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
  return tabs.find((t) => t.type === 'page' && t.url && t.url.includes('localhost:3000'));
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

const evalJs = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  return r.result.value;
};

const screenshot = async (filename) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filename, Buffer.from(r.data, 'base64'));
  console.log('  saved:', filename);
};

console.log('=== / (Home) ===');
await send('Page.navigate', { url: 'http://localhost:3000/' });
await new Promise((r) => setTimeout(r, 5000));
// Force the first post's image to eager-load via scroll
await evalJs(`
(() => {
  const post = document.querySelector('.gm-post');
  if (post) post.scrollIntoView({ block: 'center' });
})()
`);
await new Promise((r) => setTimeout(r, 4000));
await screenshot('C:/Users/Tiago/AppData/Local/Temp/final-home.png');

console.log('\n=== /travels ===');
await send('Page.navigate', { url: 'http://localhost:3000/travels' });
await new Promise((r) => setTimeout(r, 4000));
await screenshot('C:/Users/Tiago/AppData/Local/Temp/final-travels.png');

console.log('\n=== /travel/2 ===');
await send('Page.navigate', { url: 'http://localhost:3000/travel/2' });
await new Promise((r) => setTimeout(r, 4000));
await screenshot('C:/Users/Tiago/AppData/Local/Temp/final-detail.png');

console.log('\n=== /my-travels/2/edit (wizard edit) ===');
await send('Page.navigate', { url: 'http://localhost:3000/my-travels/2/edit' });
await new Promise((r) => setTimeout(r, 5000));
await screenshot('C:/Users/Tiago/AppData/Local/Temp/final-edit.png');

ws.close();
process.exit(0);
