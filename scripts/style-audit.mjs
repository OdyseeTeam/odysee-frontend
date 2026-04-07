import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SEARCH_DIRS = ['ui', 'web', 'static'];
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.scss', '.css', '.html']);
const STYLE_EXTENSIONS = new Set(['.scss', '.css']);

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, out);
    } else {
      out.push(abs);
    }
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).replaceAll(path.sep, '/');
}

function readSafe(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

const allFiles = SEARCH_DIRS.flatMap((d) => {
  const abs = path.join(ROOT, d);
  return fs.existsSync(abs) ? walk(abs) : [];
});

const codeFiles = allFiles.filter((f) => CODE_EXTENSIONS.has(path.extname(f)));
const scssFiles = allFiles.filter((f) => path.extname(f) === '.scss');
const styleFiles = allFiles.filter((f) => STYLE_EXTENSIONS.has(path.extname(f)));
const entryStyleFiles = styleFiles.filter((f) => {
  const name = path.basename(f);
  return name === 'style.scss' || name === 'style.lazy.scss';
});

const invalidMedia = [];
const hardcodedMediaWidths = [];
const missingBreakpointImports = [];

for (const file of scssFiles) {
  const content = readSafe(file);
  const fileRel = rel(file);

  if (/@media[^{\n]*mix-width\s*:/.test(content)) {
    invalidMedia.push(`${fileRel}: contains invalid 'mix-width' media query`);
  }
  if (/@media[^{\n]*opacity\s*>\s*0/.test(content)) {
    invalidMedia.push(`${fileRel}: contains suspicious '@media (opacity > 0)'`);
  }

  const matches = content.matchAll(/@media[^{\n]*(?:max|min)-width:\s*\d+px/g);
  for (const m of matches) {
    hardcodedMediaWidths.push(`${fileRel}: ${m[0]}`);
  }

  const usesBreakpointVars = /\$breakpoint-[\w-]+/.test(content);
  if (usesBreakpointVars) {
    const definesBreakpointVars = /\$breakpoint-[\w-]+\s*:/.test(content);
    const importsBreakpoints = /@(?:use|import)\s+['"][^'"]*breakpoints[^'"]*['"]/.test(content);
    const importsVars = /@(?:use|import)\s+['"][^'"]*init\/vars[^'"]*['"]/.test(content);

    if (!definesBreakpointVars && !importsBreakpoints && !importsVars) {
      missingBreakpointImports.push(`${fileRel}: uses $breakpoint-* variables without importing breakpoints`);
    }
  }
}

const fileContents = new Map();
for (const f of codeFiles) {
  fileContents.set(f, readSafe(f));
}

const orphanStyles = [];
for (const styleFile of entryStyleFiles) {
  const dir = path.dirname(styleFile);
  const name = path.basename(styleFile);
  const stem = name.replace(/\.scss$|\.css$/, '');
  const localImports = [`'./${stem}'`, `"./${stem}"`, `'./${name}'`, `"./${name}"`];

  let isUsed = false;

  for (const [codeFile, content] of fileContents) {
    if (!codeFile.startsWith(dir + path.sep)) continue;
    if (localImports.some((x) => content.includes(x))) {
      isUsed = true;
      break;
    }
  }

  if (!isUsed) {
    const styleRel = rel(styleFile);
    for (const [, content] of fileContents) {
      if (content.includes(styleRel)) {
        isUsed = true;
        break;
      }
    }
  }

  if (!isUsed) orphanStyles.push(rel(styleFile));
}

let failed = false;

if (invalidMedia.length) {
  failed = true;
  console.error('\n[style-audit] Invalid media queries found:');
  invalidMedia.forEach((x) => console.error(`- ${x}`));
}

if (hardcodedMediaWidths.length) {
  failed = true;
  console.error('\n[style-audit] Hardcoded media widths found (use breakpoint tokens):');
  hardcodedMediaWidths.forEach((x) => console.error(`- ${x}`));
}

if (orphanStyles.length) {
  failed = true;
  console.error('\n[style-audit] Orphan style entry files found:');
  orphanStyles.forEach((x) => console.error(`- ${x}`));
}

if (missingBreakpointImports.length) {
  failed = true;
  console.error('\n[style-audit] Missing breakpoint imports found:');
  missingBreakpointImports.forEach((x) => console.error(`- ${x}`));
}

if (failed) {
  process.exit(1);
}

console.log('[style-audit] OK');
