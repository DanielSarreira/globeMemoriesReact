// layout-audit.cjs — list each page's top-level container class
const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, 'src/pages');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js') || f.endsWith('.jsx'));
for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  // Find the outermost <div className=... inside the return statement
  const m = src.match(/return\s*\(\s*<div\s+className="([^"]+)"/);
  const usesPageContainer = /\bPageContainer\b/.test(src);
  const usesGmPageWidth = /\bgm-page-width\b/.test(src);
  const usesGmLayout = /\bgm-layout--/.test(src);
  console.log(`${f.padEnd(30)} | container="${m ? m[1] : '?'}" | PC=${usesPageContainer} gpw=${usesGmPageWidth} gmL=${usesGmLayout}`);
}
