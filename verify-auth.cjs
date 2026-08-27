// verify-auth.cjs (v3 — using vm + custom global)
const { JSDOM, VirtualConsole } = require('jsdom');
const vm = require('vm');

async function verifyRoute(route) {
  const url = `http://localhost:3000${route}`;
  const htmlRes = await fetch(url);
  const html = await htmlRes.text();

  const bundleMatch = html.match(/<script[^>]*src="([^"]+)"/);
  if (!bundleMatch) {
    console.log(`[${route}] No bundle script found in HTML`);
    return;
  }
  const bundlePath = bundleMatch[1];
  const bundleUrl = bundlePath.startsWith('http') ? bundlePath : `http://localhost:3000${bundlePath}`;
  const bundleRes = await fetch(bundleUrl);
  const bundleText = await bundleRes.text();

  // Build a JSDOM with the real HTML, but disable script execution
  const errors = [];
  const warnings = [];
  const logs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => {
    const msg = (e && e.message) || String(e);
    if (msg.includes('Could not parse CSS stylesheet')) return;
    errors.push(`[jsdomError] ${msg}\n${e && e.stack ? e.stack.split('\n').slice(0, 8).join('\n') : ''}`);
  });

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>', {
    url,
    runScripts: 'dangerously',
    virtualConsole: vc,
    pretendToBeVisual: true,
  });

  const { window } = dom;

  // Polyfills
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
  }
  if (!window.matchMedia) {
    window.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
    window.cancelAnimationFrame = (id) => clearTimeout(id);
  }
  if (!window.fetch) {
    // Use Node's fetch, but bind to window so bundle can use window.fetch
    window.fetch = (...args) => fetch(...args);
  }

  // Hook window.console + window.onerror + unhandledrejection
  window.console.log = (...a) => logs.push(a.map(String).join(' '));
  window.console.warn = (...a) => warnings.push(a.map(String).join(' '));
  window.console.error = (...a) => errors.push(a.map((x) => x && x.stack || String(x)).join(' '));
  window.console.info = (...a) => logs.push(a.map(String).join(' '));
  window.onerror = (msg, src, lineno, colno, err) => {
    errors.push(`[window.onerror] ${msg} at ${src}:${lineno}:${colno}\n${err && err.stack || ''}`);
    return false;
  };
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    errors.push(`[unhandledrejection] ${(r && r.message) || String(r)}\n${r && r.stack || ''}`);
  });

  // Use vm to execute the bundle in the JSDOM context
  try {
    // Build a sandboxed context that exposes all window props as globals
    const sandbox = {};
    // Copy all enumerable window properties to sandbox
    Object.getOwnPropertyNames(window).forEach((k) => {
      try {
        const v = window[k];
        if (v !== undefined) sandbox[k] = v;
      } catch (e) { /* ignore */ }
    });
    // Polyfill WebSocket (used by webpack-dev-server client)
    if (!sandbox.WebSocket) {
      sandbox.WebSocket = class { constructor() { setTimeout(() => { if (this.onerror) this.onerror(new Error('no ws')); }, 100); } close(){} send(){} };
    }
    // Make document and self accessible as globals
    sandbox.document = window.document;
    sandbox.self = window;
    sandbox.window = window;
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    const script = new vm.Script(bundleText, { filename: bundleUrl, displayErrors: true });
    script.runInContext(sandbox);
  } catch (e) {
    errors.push(`[vm.runInContext] ${e.message}\n${e.stack && e.stack.split('\n').slice(0, 10).join('\n')}`);
  }

  // Wait for React to mount
  await new Promise((r) => setTimeout(r, 12000));

  const root = window.document.getElementById('root');
  const innerHTML = root ? root.innerHTML : '(no #root)';
  const textContent = root ? root.textContent.trim().substring(0, 1500) : '';

  console.log(`\n========== ${route} ==========`);
  console.log(`Bundle: ${bundleUrl} (HTTP ${bundleRes.status}, ${bundleText.length} bytes)`);
  console.log(`#root innerHTML length: ${innerHTML.length} chars`);
  console.log(`#root textContent (first 1500 chars):\n${textContent || '(EMPTY)'}`);
  console.log(`\n--- Errors (${errors.length}) ---`);
  errors.slice(0, 12).forEach((e, i) => {
    console.log(`\n[Error #${i + 1}]`);
    console.log(e.substring(0, 2500));
  });
  console.log(`\n--- Warnings (${warnings.length}) ---`);
  warnings.slice(0, 5).forEach((w) => console.log(w.substring(0, 600)));
  console.log(`\n--- Logs (${logs.length}) ---`);
  logs.slice(0, 5).forEach((l) => console.log(l.substring(0, 400)));

  dom.window.close();
}

(async () => {
  try {
    await verifyRoute('/login');
    await verifyRoute('/register');
  } catch (e) {
    console.error('FATAL:', e);
    process.exit(1);
  }
})();
