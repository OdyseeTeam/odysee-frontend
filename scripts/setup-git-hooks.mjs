import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gitDir = path.join(repoRoot, '.git');
const hooksDir = path.join(repoRoot, '.githooks');

if (!fs.existsSync(gitDir) || !fs.existsSync(hooksDir)) {
  process.exit(0);
}

const hookFiles = ['pre-commit', 'pre-merge-commit', 'run-check'];

for (const hookFile of hookFiles) {
  const hookPath = path.join(hooksDir, hookFile);
  if (fs.existsSync(hookPath)) {
    fs.chmodSync(hookPath, 0o755);
  }
}

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
    cwd: repoRoot,
    stdio: 'ignore',
  });
} catch {
  process.exit(0);
}
