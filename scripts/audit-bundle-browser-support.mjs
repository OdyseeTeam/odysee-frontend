// Scans built chunks for JavaScript the oldest supported browsers cannot parse.
//
// This exists because of a class of bug that no test catches. Regex lookbehind
// is valid ES2018, so parsers and type checkers accept it, and no bundler can
// downlevel it -- it is an engine capability, not transformable syntax. Safari
// only gained it in 16.4, and a regex literal that fails to parse takes its
// whole chunk with it. When such a chunk is one the entry statically imports,
// the app never mounts and every page is blank with nothing logged.
//
// Playwright's WebKit will not catch this either: it tracks upstream WebKit and
// supports lookbehind, so a browser test passes while real iPhones stay blank.
// Scanning the build output is exhaustive, deterministic and catches the case
// that actually bit us, which was a transitive dependency rather than our code.

import fs from 'node:fs';
import path from 'node:path';

const ASSET_DIR = path.resolve(process.cwd(), 'web/dist/public/assets');

// Each pattern is something the browsers in package.json "browserslist" cannot
// parse. Keep the reason with the pattern so a failure explains itself.
// Only patterns that can actually be detected by scanning text belong here. A
// check that cannot fire is worse than no check, because it reads as coverage.
const FORBIDDEN = [
  {
    name: 'regex lookbehind',
    // (?<= and (?<! but not named capture groups, which are (?<name>
    pattern: /\(\?<[=!]/,
    reason: 'SyntaxError before Safari 16.4 / iOS 16.4',
  },
];

if (!fs.existsSync(ASSET_DIR)) {
  console.error(`No build output at ${ASSET_DIR}. Run "pnpm build" first.`);
  process.exit(2);
}

const files = fs.readdirSync(ASSET_DIR).filter((f) => f.endsWith('.js'));
const failures = [];

for (const file of files) {
  const contents = fs.readFileSync(path.join(ASSET_DIR, file), 'utf8');
  for (const { name, pattern, reason } of FORBIDDEN) {
    if (pattern.test(contents)) {
      failures.push({ file, name, reason });
    }
  }
}

if (failures.length) {
  console.error(`Found unsupported syntax in ${failures.length} of ${files.length} chunks:\n`);
  for (const { file, name, reason } of failures) {
    console.error(`  ${name} (${reason})`);
    console.error(`    ${file}`);
  }
  console.error('\nA chunk that fails to parse blanks the whole page on affected browsers.');
  process.exit(1);
}

console.log(`No unsupported syntax found across ${files.length} chunks.`);
