// Quick layout snapshot: check that every page has the same horizontal margins.
// Connects to the running dev server, takes a screenshot of each page, and
// measures the bounding box of the main content area so we can prove the
// rhythm is identical across all pages.
const { spawn } = require('child_process');
const http = require('http');

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

(async () => {
  // Login first to grab a JWT
  const loginRes = await new Promise((resolve, reject) => {
    const body = JSON.stringify({ username: 'admin', password: 'admin123' });
    const req = http.request({
      hostname: 'localhost', port: 8080, path: '/authenticate',
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
  console.log('Login response status:', loginRes.status);
  if (loginRes.status !== 200) {
    console.log('Login failed. Body:', loginRes.body.substring(0, 200));
    process.exit(1);
  }
  const token = JSON.parse(loginRes.body).token;
  console.log('Got token, length:', token.length);

  // Connect to Chrome via CDP
  const browser = await require('chrome-remote-interface').launch({ headless: true });
  const targets = await browser.listTargets();
  const pageTarget = targets.find(t => t.type === 'page') || (await browser.newPage());
  const client = await browser.connectToPage(pageTarget);
  const { Page, Runtime, Emulation } = client;

  await Page.enable();
  await Runtime.enable();

  // Set 1440x900 desktop viewport
  await Emulation.setDeviceMetricsOverride({
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  });

  for (const p of PAGES) {
    try {
      // Set localStorage token before navigating
      await Page.navigate({ url: 'about:blank' });
      await Page.loadEventFired();
      await Runtime.evaluate({ expression: `localStorage.setItem('auth_token', '${token}'); localStorage.setItem('user', '${JSON.stringify({id:1, username:'admin'}).replace(/'/g, "\\'")}')` });
      await Page.navigate({ url: p.url });
      await Page.loadEventFired();
      // Give the page a beat to render
      await new Promise(r => setTimeout(r, 1500));

      // Measure the main content element
      const measure = await Runtime.evaluate({ expression: `(() => {
        const el = document.querySelector('.gm-app__content > *') || document.querySelector('.gm-auth5') || document.querySelector('main') || document.body.children[0];
        if (!el) return { error: 'no element' };
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          cls: el.className,
          left: Math.round(r.left),
          right: Math.round(window.innerWidth - r.right),
          width: Math.round(r.width),
          padTop: getComputedStyle(el).paddingTop,
          padBot: getComputedStyle(el).paddingBottom,
          maxWidth: getComputedStyle(el).maxWidth,
        };
      })()`, returnByValue: true });

      const m = measure.result.value;
      console.log(`[${p.name.padEnd(15)}] ${m.cls ? m.cls.substring(0, 40) : '?'}`);
      console.log(`                  L=${m.left} R=${m.right} W=${m.width} max=${m.maxWidth} padT=${m.padTop} padB=${m.padBot}`);

      // Screenshot
      const shot = await Page.captureScreenshot({ format: 'png' });
      const fs = require('fs');
      fs.writeFileSync(`C:\\Users\\Tiago\\AppData\\Local\\Temp\\layout-${p.name}.png`, Buffer.from(shot.data, 'base64'));
    } catch (e) {
      console.log(`[${p.name}] ERROR: ${e.message}`);
    }
  }

  await browser.close();
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
