// Final smoke test: verify every item in the request works.
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

function get(url) { return new Promise((resolve, reject) => { http.get(url, (res) => { let b=''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b })); }).on('error', reject); }); }
function post(url, json) { const data = Buffer.from(JSON.stringify(json)); return new Promise((resolve, reject) => { const u = new URL(url); const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (res) => { let b=''; res.on('data', c => b += c); res.on('end', () => resolve(b)); }); req.on('error', reject); req.write(data); req.end(); }); }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
class Cdp {
  constructor(ws) { this.ws = ws; this.nextId = 1; this.pending = new Map();
    ws.on('message', (data) => { const m = JSON.parse(data.toString()); if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id); if (m.error) reject(new Error(JSON.stringify(m.error))); else resolve(m.result); } }); }
  send(method, params = {}, sid) { const id = this.nextId++; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); const p = { id, method, params }; if (sid) p.sessionId = sid; this.ws.send(JSON.stringify(p)); }); }
}

async function withPage(browserWs, url, viewport, fn) {
  const cdp = new Cdp(browserWs);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Network.enable', {}, sessionId);
  await cdp.send('Emulation.setDeviceMetricsOverride', viewport, sessionId);
  await cdp.send('Page.navigate', { url }, sessionId);
  await delay(9000);
  const out = await fn(cdp, sessionId);
  await cdp.send('Target.closeTarget', { targetId });
  return out;
}

async function evaluate(cdp, sid, expr) {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, timeout: 12000 }, sid);
  if (r.exceptionDetails) return { error: r.exceptionDetails.exception?.description };
  return r.result.value;
}

async function main() {
  const v = await get('http://127.0.0.1:9222/json/version');
  const ws = new WebSocket(JSON.parse(v.body).webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const lr = await post('http://localhost:8080/login', { username: 'admin', password: 'admin123' });
  const token = JSON.parse(lr).token;

  // ── 1) Register page — typing should NOT trigger any /users/check-* requests
  console.log('\n=== 1. Register — no live validation while typing ===');
  const reg = await withPage(ws, 'http://localhost:3000/register', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, async (cdp, sid) => {
    const requests = [];
    ws.on('message', (data) => {
      const m = JSON.parse(data.toString());
      if (m.method === 'Network.requestWillBeSent' && m.params?.request?.url?.match(/\/users\/check-(username|email)/)) {
        requests.push(m.params.request.url);
      }
    });
    // Type into username, email
    await evaluate(cdp, sid, `(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const u = document.querySelector('input[name="username"]');
      const e = document.querySelector('input[name="email"]');
      if (u) { setter.call(u, 'johndoe123'); u.dispatchEvent(new Event('input', { bubbles: true })); }
      if (e) { setter.call(e, 'john.doe@example.com'); e.dispatchEvent(new Event('input', { bubbles: true })); }
      return 'ok';
    })()`);
    await delay(1500);
    return { requests };
  });
  console.log('  live check requests after typing:', reg.requests.length, reg.requests);

  // ── 2) Register — submit triggers both checks
  console.log('\n=== 2. Register — submit fires checks ===');
  const regSubmit = await withPage(ws, 'http://localhost:3000/register', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, async (cdp, sid) => {
    const requests = [];
    ws.on('message', (data) => {
      const m = JSON.parse(data.toString());
      if (m.method === 'Network.requestWillBeSent' && m.params?.request?.url?.match(/\/users\/check-(username|email)/)) {
        requests.push(m.params.request.url);
      }
    });
    await evaluate(cdp, sid, `(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const set = (name, val) => { const el = document.querySelector(\`input[name="\${name}"]\`); if (el) { setter.call(el, val); el.dispatchEvent(new Event('input', { bubbles: true })); } };
      set('firstName', 'John');
      set('lastName', 'Smith');
      const sn = document.querySelector('input[name="nationality"]') || document.querySelector('[role="combobox"]');
      // Just click the submit
      const submit = document.querySelector('button[type="submit"]');
      if (submit) submit.click();
      return 'submitted';
    })()`);
    await delay(2500);
    return { requests };
  });
  console.log('  check requests after submit:', regSubmit.requests.length, regSubmit.requests);

  // ── 3) Global layout — every authed page uses gm-page (or per-page shell w/ same rhythm)
  console.log('\n=== 3. Global layout — page rhythm identical ===');
  for (const path of ['/qanda', '/notifications', '/users', '/travels', '/weather', '/edit-profile', '/achievements', '/settings-and-privacy', '/future-travels']) {
    const r = await withPage(ws, `http://localhost:3000${path}`, { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, async (cdp, sid) => {
      // Inject auth state
      await evaluate(cdp, sid, `(() => { localStorage.setItem('auth_token', ${JSON.stringify(token)}); localStorage.setItem('user', JSON.stringify({ id:1, username:'admin', email:'admin@globememories.com' })); })()`);
      await delay(1500);
      return evaluate(cdp, sid, `(() => {
        const root = document.querySelector('.gm-page, .gm-layout, .gm-travels, .gm-profile, .gm-qa, .gm-users, .gm-notif, .gm-settings, .gm-future, .gm-404, .gm-help, .gm-reset, .gm-weather, .gm-edit-profile, .gm-achievements, .gm-future-travels, .gm-app__content > *:first-child');
        if (!root) return { error: 'no page container' };
        const cs = getComputedStyle(root);
        return {
          path: location.pathname,
          container: root.className,
          maxWidth: cs.maxWidth,
          paddingLeft: cs.paddingLeft,
          paddingRight: cs.paddingRight,
          paddingTop: cs.paddingTop,
          paddingBottom: cs.paddingBottom,
        };
      })()`);
    });
    console.log(`  ${r.path}:`, r);
  }

  // ── 4) Old header wrappers — must NOT exist
  console.log('\n=== 4. Old header wrappers removed ===');
  for (const path of ['/qanda', '/notifications', '/users', '/weather']) {
    const r = await withPage(ws, `http://localhost:3000${path}`, { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, async (cdp, sid) => {
      await evaluate(cdp, sid, `(() => { localStorage.setItem('auth_token', ${JSON.stringify(token)}); localStorage.setItem('user', JSON.stringify({ id:1, username:'admin', email:'admin@globememories.com' })); })()`);
      await delay(1500);
      return evaluate(cdp, sid, `(() => ({
        path: location.pathname,
        hasQaHeadLeft: !!document.querySelector('.gm-qa__head-left'),
        hasNotifHeadLeft: !!document.querySelector('.gm-notif__head-left'),
        hasUsersHeadLeft: !!document.querySelector('.gm-users__head-left'),
        hasGmPageheadRow: !!document.querySelector('.gm-pagehead__row'),
      }))()`);
    });
    console.log(`  ${r.path}:`, r);
  }

  // ── 5) Mobile — Weather not in tab bar
  console.log('\n=== 5. Mobile — no Weather in nav ===');
  const mobile = await withPage(ws, 'http://localhost:3000/', { width: 390, height: 800, deviceScaleFactor: 2, mobile: true }, async (cdp, sid) => {
    await evaluate(cdp, sid, `(() => { localStorage.setItem('auth_token', ${JSON.stringify(token)}); localStorage.setItem('user', JSON.stringify({ id:1, username:'admin', email:'admin@globememories.com' })); })()`);
    await delay(8000);
    return evaluate(cdp, sid, `(() => {
      const items = Array.from(document.querySelectorAll('.gm-app__tab')).map(a => a.textContent.trim().split(/\\s+/).pop());
      const topbarBtns = Array.from(document.querySelectorAll('.gm-app__topbar .gm-app__iconbtn')).map(b => b.getAttribute('aria-label'));
      return { tabItems: items, topbarButtons: topbarBtns };
    })()`);
  });
  console.log('  mobile tab items:', mobile.tabItems);
  console.log('  mobile topbar buttons:', mobile.topbarButtons);

  // ── 6) Travels — desktop new layout
  console.log('\n=== 6. Travels — desktop filters layout ===');
  const travels = await withPage(ws, 'http://localhost:3000/travels', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, async (cdp, sid) => {
    await delay(2500);
    return evaluate(cdp, sid, `(() => {
      const sidebar = document.querySelector('.gm-travels__sidebar');
      const layout = document.querySelector('.gm-travels__layout');
      const categories = document.querySelectorAll('.gm-travels__category-item');
      const toggleBtn = document.querySelector('.gm-travels__filters-toggle');
      const search = document.querySelector('.gm-travels__search');
      return {
        hasLayout: !!layout,
        layoutDisplay: layout ? getComputedStyle(layout).display : null,
        hasSidebar: !!sidebar,
        sidebarVisible: sidebar ? getComputedStyle(sidebar).display : null,
        categoryCount: categories.length,
        toggleVisible: toggleBtn ? (toggleBtn.offsetParent !== null) : 'no-btn',
        searchHeight: search ? getComputedStyle(search).height : null,
      };
    })()`);
  });
  console.log('  travels desktop:', travels);

  // Take screenshots
  const out = 'C:\\Users\\Tiago\\AppData\\Local\\Temp';
  for (const sz of [{ width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, s: '' }, { width: 390, height: 800, deviceScaleFactor: 2, mobile: true, s: '-mobile' }]) {
    for (const [p, name] of [['/qanda', 'qa'], ['/notifications', 'notif'], ['/users', 'users'], ['/travels', 'travels'], ['/weather', 'weather'], ['/register', 'register'], ['/login', 'login']]) {
      const r = await withPage(ws, `http://localhost:3000${p}`, sz, async (cdp, sid) => {
        await evaluate(cdp, sid, `(() => { localStorage.setItem('auth_token', ${JSON.stringify(token)}); localStorage.setItem('user', JSON.stringify({ id:1, username:'admin', email:'admin@globememories.com' })); })()`);
        await delay(6500);
        const cap = await cdp.send('Page.captureScreenshot', { format: 'png' }, sid);
        return cap.data;
      });
      fs.writeFileSync(path.join(out, `final-${name}${sz.s}.png`), Buffer.from(r, 'base64'));
    }
  }
  console.log('\n  screenshots saved to C:\\Users\\Tiago\\AppData\\Local\\Temp\\final-*.png');

  ws.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
