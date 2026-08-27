// Headless smoke test for /interactive-map — verifies that trips appear as markers
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const networkCalls = [];
  page.on('response', (r) => {
    const url = r.url();
    if (url.includes('localhost:8080') || url.includes('/trips/') || url.includes('/auth/')) {
      networkCalls.push({ status: r.status(), url: url.replace('http://localhost:8080', '') });
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('  [browser err]', msg.text());
  });

  console.log('Step 1: open /login');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('Step 2: fill credentials');
  // The login form is premium v3 — username first, then password
  await page.locator('input[name="username"], input[autocomplete="username"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.locator('button[type="submit"]').first().click();

  console.log('Step 3: wait for /');
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 15000 }).catch(() => {});

  console.log('Step 4: open /interactive-map');
  await page.goto('http://localhost:3000/interactive-map', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('Step 5: wait for markers to render (3s)');
  await page.waitForTimeout(3500);

  // Count leaflet markers
  const markerCount = await page.locator('.leaflet-marker-icon').count();
  console.log(`Step 6: leaflet markers in DOM = ${markerCount}`);

  // Count visited/following/public count badges in panel
  const counts = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('.gm-map-panel__mode-count, .gm-map-sheet__mode-count').forEach((el) => {
      out[el.previousElementSibling?.textContent || el.parentElement?.textContent?.slice(0, 30)] = el.textContent;
    });
    return out;
  });
  console.log('Step 7: panel counts =', JSON.stringify(counts));

  // Network calls
  console.log('Step 8: network calls:');
  networkCalls.forEach((c) => console.log(`   ${c.status} ${c.url}`));

  // Take a screenshot
  await page.screenshot({ path: 'tools/interactive-map-after-fix.png', fullPage: false });
  console.log('Screenshot saved to tools/interactive-map-after-fix.png');

  await browser.close();
  process.exit(markerCount > 0 ? 0 : 1);
})().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(2);
});
