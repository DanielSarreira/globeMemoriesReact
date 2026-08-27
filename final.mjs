// Final E2E: Home feed + Travels page screenshots
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
  return tabs.find((t) => t.type === 'page' && t.url && t.url.includes('localhost:3000') && (t.url.includes('/login') || t.url.includes('/home')));
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

console.log('=== Login first ===');
await send('Page.navigate', { url: 'http://localhost:3000/login' });
await new Promise((r) => setTimeout(r, 3000));
const hasLogin = await evalJs('!!document.querySelector("input[name=\\"username\\"], input[autocomplete=\\"username\\"]") || !!document.querySelector("input[type=\\"text\\"]")');
console.log('  login form:', hasLogin);
await evalJs(`
(() => {
  const u = document.querySelector('input[type="text"]');
  if (u) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(u, 'admin');
    u.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const p = document.querySelector('input[type="password"]');
  if (p) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(p, 'admin123');
    p.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.toLowerCase().includes('entrar'));
  if (btn) btn.click();
})()
`);
await new Promise((r) => setTimeout(r, 4000));

console.log('\n=== / (Home) ===');
await send('Page.navigate', { url: 'http://localhost:3000/' });
await new Promise((r) => setTimeout(r, 4000));
const homeInfo = await evalJs(`
(() => {
  const posts = document.querySelectorAll('.gm-post');
  const firstPost = posts[0];
  if (!firstPost) return 'no posts';
  const img = firstPost.querySelector('img');
  const stars = firstPost.querySelectorAll('[fill="currentColor"]');
  const price = Array.from(firstPost.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('€'));
  return JSON.stringify({
    posts: posts.length,
    firstImg: img ? img.src.slice(0, 100) : 'no img',
    stars: stars.length,
    price: price ? price.innerText.slice(0, 30) : 'no price'
  });
})()
`);
console.log('  home:', homeInfo);
await screenshot('C:/Users/Tiago/AppData/Local/Temp/screen-final-home.png');

console.log('\n=== /travels ===');
await send('Page.navigate', { url: 'http://localhost:3000/travels' });
await new Promise((r) => setTimeout(r, 4000));
const travelsInfo = await evalJs(`
(() => {
  const selects = Array.from(document.querySelectorAll('select'));
  const countrySel = selects.find(s => s.closest('label, div')?.innerText?.toLowerCase().includes('país'));
  const citySel = selects.find(s => s.closest('label, div')?.innerText?.toLowerCase().includes('cidade'));
  return JSON.stringify({
    selects: selects.length,
    countryLabel: countrySel ? 'YES (first option: ' + (countrySel.options[0]?.text || '') + ')' : 'NO',
    cityLabel: citySel ? 'YES (disabled: ' + citySel.disabled + ')' : 'NO',
  });
})()
`);
console.log('  travels filters:', travelsInfo);
await screenshot('C:/Users/Tiago/AppData/Local/Temp/screen-final-travels.png');

console.log('\n=== /travels/2 (TravelDetails) ===');
await send('Page.navigate', { url: 'http://localhost:3000/travel/2' });
await new Promise((r) => setTimeout(r, 4000));
const detailInfo = await evalJs(`
(() => {
  const imgs = Array.from(document.querySelectorAll('img')).filter(i => i.src && !i.src.includes('avatar'));
  return JSON.stringify({
    images: imgs.length,
    firstImg: imgs[0]?.src || 'no img',
  });
})()
`);
console.log('  detail:', detailInfo);
await screenshot('C:/Users/Tiago/AppData/Local/Temp/screen-final-detail.png');

ws.close();
process.exit(0);


console.log('=== inspect DOM images ==='); await send('Page.navigate', { url: 'http://localhost:3000/' }); await new Promise((r) => setTimeout(r, 5000)); const allImgs = await evalJs((() => { const imgs = Array.from(document.querySelectorAll('img')); return imgs.map(i => i.src.slice(0, 100)).join(' | '); })()); console.log(allImgs);
