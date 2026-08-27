// Layout validation: prove every page has identical horizontal rhythm.
const http = require('http');
const fs = require('fs');
const { spawnSync } = require('child_process');

const PAGES = [
  { name: 'login',          url: 'http://localhost:3000/login',          auth: false },
  { name: 'register',       url: 'http://localhost:3000/register',       auth: false },
  { name: 'home',           url: 'http://localhost:3000/',               auth: true },
  { name: 'travels',        url: 'http://localhost:3000/travels',        auth: true },
  { name: 'profile',        url: 'http://localhost:3000/profile/admin',  auth: true },
  { name: 'edit-profile',   url: 'http://localhost:3000/profile/edit/admin', auth: true },
  { name: 'users',          url: 'http://localhost:3000/users',          auth: true },
  { name: 'qanda',          url: 'http://localhost:3000/qanda',          auth: true },
  { name: 'notifications',  url: 'http://localhost:3000/notifications',  auth: true },
  { name: 'settings',       url: 'http://localhost:3000/settings-and-privacy', auth: true },
  { name: 'my-travels',     url: 'http://localhost:3000/my-travels',     auth: true },
  { name: 'future-travels', url: 'http://localhost:3000/future-travels', auth: true },
  { name: 'weather',        url: 'http://localhost:3000/weather',        auth: true },
  { name: 'achievements',   url: 'http://localhost:3000/achievements',   auth: true },
];

function login() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ username: 'admin', password: 'admin123' });
    const req = http.request({
      hostname: 'localhost', port: 8080, path: '/login',
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data).token);
        } else {
          reject(new Error(`Login ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('Logging in...');
  const token = await login();
  console.log('Token:', token.substring(0, 30) + '...');

  const port = 9222;
  console.log('Launching headless Chrome on', port);
  const chrome = require('child_process').spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + require('os').tmpdir() + '\\gm-chrome-' + Date.now(),
    '--remote-debugging-port=' + port,
    '--remote-allow-origins=*',
    'about:blank',
  ], { detached: true, stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 4000));

  let browser;
  try {
    const CDP = require('chrome-remote-interface');
    browser = await CDP({ port });
    const { Page, Runtime, Emulation } = browser;
    await Page.enable();
    await Runtime.enable();

    const results = [];
    for (const p of PAGES) {
      try {
        await Page.navigate({ url: 'about:blank' });
        await new Promise(r => setTimeout(r, 300));
        // Set token + viewport
        await Runtime.evaluate({ expression: `
          localStorage.setItem('auth_token', '${token}');
          localStorage.setItem('user', JSON.stringify({id:1, username:'admin', profilePhoto:'profile-photos/eb5215e5-cb65-44de-a746-b619a56ccf33.jpeg'}));
          localStorage.setItem('admin_profilePhotoVersion', '${Date.now()}');
        ` });
        await Emulation.setDeviceMetricsOverride({
          width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
        });
        await Page.navigate({ url: p.url });
        await Page.loadEventFired();
        await new Promise(r => setTimeout(r, 4000));

        // Measure the main content element. For auth pages use .gm-auth5,
        // otherwise use the first child of .gm-app__content (which is the
        // page wrapper, holding the global rhythm).
        const measure = await Runtime.evaluate({ expression: `(() => {
          let el = document.querySelector('.gm-app__content > *');
          if (!el) el = document.querySelector('.gm-auth5');
          if (!el) {
            el = document.querySelector('main') || document.querySelector('.gm-app') || document.body;
          }
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return JSON.stringify({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').substring(0, 80),
            left: Math.round(r.left),
            right: Math.round(window.innerWidth - r.right),
            width: Math.round(r.width),
            padLeft: cs.paddingLeft,
            padRight: cs.paddingRight,
            padTop: cs.paddingTop,
            padBot: cs.paddingBottom,
            maxWidth: cs.maxWidth,
          });
        })()`, returnByValue: true });

        let m;
        try { m = JSON.parse(measure.result.value); }
        catch (e) { m = { error: measure.result.value }; }
        results.push({ name: p.name, ...m });
        console.log(`[${p.name.padEnd(15)}] L=${String(m.left).padStart(4)} R=${String(m.right).padStart(4)} W=${String(m.width).padStart(5)} maxW=${(m.maxWidth || '').padStart(8)} padL=${m.padLeft} padR=${m.padRight}`);

        // Screenshot
        const shot = await Page.captureScreenshot({ format: 'png' });
        fs.writeFileSync(`C:\\Users\\Tiago\\AppData\\Local\\Temp\\layout-${p.name}.png`, Buffer.from(shot.data, 'base64'));
      } catch (e) {
        console.log(`[${p.name}] ERROR: ${e.message}`);
      }
    }

    // Save summary
    fs.writeFileSync('C:\\Users\\Tiago\\AppData\\Local\\Temp\\layout-summary.json', JSON.stringify(results, null, 2));
    console.log('\nSummary written.');
  } finally {
    if (browser) await browser.close();
    // Kill the headless chrome
    spawnSync('taskkill', ['/F', '/IM', 'chrome.exe', '/T'], { stdio: 'ignore' });
  }
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
