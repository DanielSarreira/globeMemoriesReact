// Lightweight syntax/parse check on the files we touched.
// Uses @babel/parser (already in node_modules via react-scripts).
const parser = require('@babel/parser');
const fs = require('fs');
const path = require('path');

const FILES = [
  'src/pages/QandA.js',
  'src/components/Notifications.js',
  'src/pages/Users.js',
  'src/pages/UserProfile.js',
  'src/pages/EditProfile.js',
  'src/components/ui/AppShell.jsx',
  'src/pages/Register.js',
  'src/pages/Travels.js',
];

let failed = 0;
for (const rel of FILES) {
  const abs = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(abs)) {
    console.error('MISSING', rel);
    failed++;
    continue;
  }
  const src = fs.readFileSync(abs, 'utf8');
  try {
    const isJSX = rel.endsWith('.jsx') || rel.endsWith('.js');
    parser.parse(src, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      plugins: isJSX ? ['jsx'] : [],
    });
    console.log('OK', rel, `(${src.length} bytes)`);
  } catch (e) {
    console.error('PARSE ERROR', rel, e.message);
    failed++;
  }
}
process.exit(failed ? 1 : 0);
