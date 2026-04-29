import { readFileSync, writeFileSync, rmSync, cpSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , targetArg] = process.argv;
if (!targetArg) {
  console.error('usage: deploy-cordova.mjs <www-dir>');
  process.exit(1);
}

const target = resolve(targetArg);
const source = resolve('web/dist/public');

if (!existsSync(source)) {
  console.error(`source not found: ${source}`);
  process.exit(1);
}
if (!existsSync(target)) {
  mkdirSync(target, { recursive: true });
}

// Frontend-owned paths in www/ — cordova-owned paths (js/, css/, img/, opensearch.xml,
// cordova.js, cordova_plugins.js, plugins/) are deliberately left alone.
const isFloss = process.env.FLOSS_BUILD === 'true';
const FRONTEND_PATHS = [
  'assets',
  'font',
  ...(isFloss ? [] : ['cast']),
  'app-strings.json',
  'favicon.png',
  'favicon_128.png',
  'favicon_notification_128.png',
  'index.html',
  'index-electron.html',
  'index-web.html',
  'index-web-floss.html',
  'public', // legacy webpack chunks left from older builds
];

for (const name of FRONTEND_PATHS) {
  const p = resolve(target, name);
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
}

// Copy new build (only the paths the frontend owns)
for (const name of FRONTEND_PATHS) {
  const src = resolve(source, name);
  if (existsSync(src)) cpSync(src, resolve(target, name), { recursive: true });
}

// Cordova expects to load index.html; frontend builds the real SPA template as
// index-web.html (or index-web-floss.html for FLOSS builds — same shape but no
// proprietary script tags like gtag). Swap the appropriate one to index.html.
const sourceTemplate = resolve(target, isFloss ? 'index-web-floss.html' : 'index-web.html');
const indexHtml = resolve(target, 'index.html');
if (existsSync(sourceTemplate)) {
  if (existsSync(indexHtml)) unlinkSync(indexHtml);
  cpSync(sourceTemplate, indexHtml);
}
// Strip both candidate templates from the deployed www so they don't ship.
for (const name of ['index-web.html', 'index-web-floss.html']) {
  const p = resolve(target, name);
  if (existsSync(p)) unlinkSync(p);
}

// Rewrite absolute paths to relative (for file:// cordova webview).
let html = readFileSync(indexHtml, 'utf8');
html = html
  .replace(/"\/public\//g, '"./')
  .replace(/'\/public\//g, "'./")
  .replace(/'\/assets\//g, "'./assets/")
  .replace(/"\/assets\//g, '"./assets/');
writeFileSync(indexHtml, html);

console.log(`deployed ${source} -> ${target}`);
