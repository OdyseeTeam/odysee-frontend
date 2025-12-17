const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function hasFlag(args, flag) {
  return args.includes(flag);
}

function run(command, commandArgs, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(Object.assign(new Error(`${command} exited with code ${code}`), { code }));
    });
  });
}

function resolveWebpackCliEntry(repoRoot, webRoot) {
  const candidates = [
    path.join(webRoot, 'node_modules', 'webpack-cli', 'bin', 'cli.js'),
    path.join(repoRoot, 'node_modules', 'webpack-cli', 'bin', 'cli.js'),
  ];

  for (const candidate of candidates) {
    try {
      // eslint-disable-next-line no-sync
      fs.accessSync(candidate);
      return candidate;
    } catch (err) {
      // ignore
    }
  }

  try {
    // eslint-disable-next-line no-sync
    return require.resolve('webpack-cli/bin/cli.js');
  } catch (err) {
    return null;
  }
}

function copyEnvFiles(repoRoot, webRoot) {
  // Mirrors `copyfiles ./.env* web/` without requiring a subprocess.
  // eslint-disable-next-line no-sync
  const entries = fs.readdirSync(repoRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.startsWith('.env')) continue;
    const src = path.join(repoRoot, entry.name);
    const dest = path.join(webRoot, entry.name);
    // eslint-disable-next-line no-sync
    fs.copyFileSync(src, dest);
  }
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const webRoot = path.join(repoRoot, 'web');
  const args = process.argv.slice(2);
  const isWatch = hasFlag(args, '--watch') || hasFlag(args, '-w');

  const webpackCliEntry = resolveWebpackCliEntry(repoRoot, webRoot);
  if (!webpackCliEntry) {
    // eslint-disable-next-line no-console
    console.error('[compile-web] Could not resolve webpack-cli entrypoint.');
    process.exit(1);
  }

  copyEnvFiles(repoRoot, webRoot);
  await run(process.execPath, [webpackCliEntry, '--config', 'webpack.config.js', ...args], {
    cwd: webRoot,
    env: process.env,
  });

  if (!isWatch) {
    const verifyScript = path.join(repoRoot, 'build', 'verify-web-public-assets.js');
    await run(process.execPath, [verifyScript], { cwd: repoRoot, env: process.env });
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
