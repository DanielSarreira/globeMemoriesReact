// remove-footer.cjs — removes Footer import + JSX usage from listed files
const fs = require('fs');
const path = require('path');

const FILES = [
  'src/pages/Achievements.js',
  'src/pages/FutureTravelsComingSoon.js',
  'src/pages/HelpSupport.js',
  'src/pages/ResetPassword.js',
  'src/pages/Travels.js',
  'src/pages/QandA.js',
  'src/pages/SettingsAndPrivacy.js',
  'src/pages/NotFound.js',
  'src/pages/UserProfile.js',
  'src/pages/Users.js',
  'src/pages/InteractiveMap.js',
  'src/components/Notifications.js',
];

const root = path.resolve(__dirname);

for (const rel of FILES) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) { console.log(`MISSING ${rel}`); continue; }
  let src = fs.readFileSync(full, 'utf8');
  const before = src;

  // 1. Remove Footer from import lists
  // Patterns: import { ..., Footer, ... } from "...";
  //          import { ..., Footer } from "...";
  //          import Footer from "...";
  //          import { useToast, Footer } from "../components/ui";
  // All of these should keep the import working without Footer.
  src = src.replace(
    /import\s*\{([^}]*?)\bFooter\b\s*,?([^}]*?)\}\s*from\s*([\s\S]*?);/g,
    (m, before1, after1, from) => {
      const merged = (before1 + after1).replace(/\s*,\s*$/, '').replace(/^\s*,\s*/, '').replace(/\s*,\s*/g, ', ').trim();
      if (!merged) return `/* Footer import removed */`;
      return `import { ${merged} } from ${from};`;
    }
  );
  // Standalone `import Footer from '...';`
  src = src.replace(
    /import\s+Footer\s+from\s+([\s\S]*?);/g,
    `/* Footer import removed */`
  );

  // 2. Remove JSX usages of <Footer />
  //    Match <Footer /> with optional surrounding whitespace.
  src = src.replace(/^\s*<Footer\s*\/>\s*\n/gm, '');

  if (src !== before) {
    fs.writeFileSync(full, src, 'utf8');
    console.log(`OK  ${rel}`);
  } else {
    console.log(`NOP ${rel}`);
  }
}
