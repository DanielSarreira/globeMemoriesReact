// Quick: list all image srcs on / page
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

await send('Page.navigate', { url: 'http://localhost:3000/' });
await new Promise((r) => setTimeout(r, 5000));

const imgs = await evalJs(`
(() => {
  const imgs = Array.from(document.querySelectorAll('img'));
  return imgs.map(i => i.src.slice(0, 150)).join(' | ');
})()
`);
console.log('IMGS:', imgs);

const postMedia = await evalJs(`
(() => {
  const post = document.querySelector('.gm-post');
  if (!post) return 'no post';
  const imgsInPost = Array.from(post.querySelectorAll('img'));
  return imgsInPost.map(i => i.src.slice(0, 150)).join(' | ');
})()
`);
console.log('POST IMGS:', postMedia);

ws.close();
process.exit(0);
