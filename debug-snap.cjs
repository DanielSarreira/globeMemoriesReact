// Debug: navigate to /travels and check the actual DOM
const http = require('http');
const fs = require('fs');

function login() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ username: 'admin', password: 'admin123' });
    const req = http.request({
      hostname: 'localhost', port: 8080, path: '/login',
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => res.statusCode === 200 ? resolve(JSON.parse(data).token) : reject(new Error(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  const token = await login();
  const port = 9222;
  const chrome = require('child_process').spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    '--user-data-dir=' + require('os').tmpdir() + '\\gm-chrome-' + Date.now(),
    '--remote-debugging-port=' + port, '--remote-allow-origins=*',
    'about:blank',
  ], { detached: true, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 4000));

  const CDP = require('chrome-remote-interface');
  const browser = await CDP({ port });
  const { Page, Runtime, Emulation } = browser;
  await Page.enable();
  await Runtime.enable();
  await Emulation.setDeviceMetricsOverride({ width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  // Set token BEFORE navigating
  await Page.navigate({ url: 'http://localhost:3000/login' });
  await Page.loadEventFired();
  await new Promise(r => setTimeout(r, 2000));
  await Runtime.evaluate({ expression: `localStorage.setItem('auth_token', '${token}'); localStorage.setItem('user', JSON.stringify({id:1, username:'admin', profilePhoto:'profile-photos/eb5215e5-cb65-44de-a746-b619a56ccf33.jpeg'}))` });

  // Navigate to /travels
  await Page.navigate({ url: 'http://localhost:3000/travels' });
  await Page.loadEventFired();
  await new Promise(r => setTimeout(r, 4000));

  // What's in the DOM?
  const dom = await Runtime.evaluate({ expression: `JSON.stringify({
    url: window.location.href,
    title: document.title,
    bodyText: document.body.innerText.substring(0, 500),
    hasGmApp: !!document.querySelector('.gm-app'),
    hasGmAppContent: !!document.querySelector('.gm-app__content'),
    hasGmTravels: !!document.querySelector('.gm-travels'),
    bodyClassName: document.body.className,
  })`, returnByValue: true });
  console.log('DOM dump:', dom.result.value);

  const shot = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync(`C:\\Users\\Tiago\\AppData\\Local\\Temp\\debug-travels.png`, Buffer.from(shot.data, 'base64'));
  console.log('Screenshot saved.');

  await browser.close();
  require('child_process').spawnSync('taskkill', ['/F', '/IM', 'chrome.exe', '/T'], { stdio: 'ignore' });
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
