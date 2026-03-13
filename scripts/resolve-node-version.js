#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function readPackageJson() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

function cleanVersionToken(version) {
  return version.replace(/^v/i, '').trim();
}

function resolveNodeVersion(spec) {
  if (!spec) return null;

  const raw = String(spec).trim();
  if (!raw) return null;

  if (/^(node|iojs|stable|unstable|system|lts\/\*|lts\/[-\w]+)$/i.test(raw)) {
    return raw;
  }

  const exactMatch = raw.match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);
  if (exactMatch) {
    return cleanVersionToken(raw);
  }

  const wildcardMatch = raw.match(/^v?(\d+)(?:\.(\d+))?\.(x|\*)$/i);
  if (wildcardMatch) {
    return wildcardMatch[2] ? `${wildcardMatch[1]}.${wildcardMatch[2]}` : wildcardMatch[1];
  }

  const majorWildcardMatch = raw.match(/^v?(\d+)\.(x|\*)$/i);
  if (majorWildcardMatch) {
    return majorWildcardMatch[1];
  }

  const firstVersionToken = raw.match(/v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!firstVersionToken) {
    return null;
  }

  const parts = [firstVersionToken[1]];
  if (firstVersionToken[2]) parts.push(firstVersionToken[2]);
  if (firstVersionToken[3]) parts.push(firstVersionToken[3]);
  return parts.join('.');
}

const packageJson = readPackageJson();
const spec =
  (packageJson.volta && packageJson.volta.node) ||
  (packageJson.engines && packageJson.engines.node);
const version = resolveNodeVersion(spec);

if (!version) {
  console.error('Unable to resolve an nvm-compatible Node version from package.json');
  process.exit(1);
}

process.stdout.write(`${version}\n`);
