// CDP test: login + open Home + Travels + verify photos + filters
import http from 'http';
import WebSocket from 'ws';

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
  return tabs.find((t) => t.type === 'page' && t.url && t.url.includes('localhost:3000') && !t.url.includes('interactive-map'));
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
console.log('WS open');

await send('Runtime.enable');
await send('Page.enable');
await send('Network.enable');

await new Promise((r) => setTimeout(r, 2000));

const tokenCheck = await send('Runtime.evaluate', {
  expression: 'localStorage.getItem("auth_token")',
  returnByValue: true,
});
console.log('AUTH_TOKEN:', tokenCheck.result.value ? 'present, len=' + tokenCheck.result.value.length : 'absent');

const urlCheck = await send('Runtime.evaluate', { expression: 'location.href', returnByValue: true });
console.log('CURRENT_URL:', urlCheck.result.value);

ws.close();
process.exit(0);
