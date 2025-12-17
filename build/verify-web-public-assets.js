const fs = require('fs');
const path = require('path');

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function listMissing(distRoot, relPaths) {
  return relPaths.filter((relPath) => !fileExists(path.join(distRoot, relPath)));
}

function findDistRoot(repoRoot) {
  const candidates = [path.join(repoRoot, 'web', 'dist'), path.join(repoRoot, 'web', 'dist_stage')];
  return candidates.find(fileExists);
}

function hasAtLeastOneWasm(transformersDir) {
  if (!fileExists(transformersDir)) return false;
  try {
    return fs.readdirSync(transformersDir).some((fileName) => fileName.endsWith('.wasm'));
  } catch (err) {
    return false;
  }
}

function verify() {
  const repoRoot = path.resolve(__dirname, '..');
  const distRoot = findDistRoot(repoRoot);

  if (!distRoot) {
    // eslint-disable-next-line no-console
    console.error('[verify-web-public-assets] No web dist found. Run `yarn compile:web` first.');
    process.exit(1);
  }

  const required = [
    'index.html',
    'public/whisper-live-captions-worker.js',
    'public/whisper-live-captions-audio-worklet.js',
  ];

  let missing = listMissing(distRoot, required);

  const transformersDir = path.join(distRoot, 'public', 'transformers');
  const hasTransformersRuntime =
    fileExists(path.join(transformersDir, 'transformers.js')) || fileExists(path.join(transformersDir, 'transformers.min.js'));
  if (!hasTransformersRuntime) missing = missing.concat(['public/transformers/transformers(.min).js']);

  if (!hasAtLeastOneWasm(transformersDir)) missing = missing.concat(['public/transformers/*.wasm']);

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[verify-web-public-assets] Missing required web build assets:');
    missing.forEach((relPath) => {
      // eslint-disable-next-line no-console
      console.error(`- ${path.join(distRoot, relPath)}`);
    });
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`[verify-web-public-assets] OK (${distRoot})`);
}

verify();
