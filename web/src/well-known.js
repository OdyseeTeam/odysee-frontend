const appleAppSiteAssociation = require('./apple-app-site-association.json');

const { getFarcasterManifest } = require('./farcaster');

const APPLE_APP_SITE_ASSOCIATION_PATH = '/.well-known/apple-app-site-association';
const FARCASTER_MANIFEST_PATH = '/.well-known/farcaster.json';

function decodePath(requestPath) {
  try {
    return decodeURIComponent(requestPath);
  } catch {
    return requestPath;
  }
}

async function wellKnownMiddleware(ctx, next) {
  const requestPath = decodePath(ctx.path);
  const normalizedPath = requestPath.toLowerCase();
  const isWellKnownPath = normalizedPath === '/.well-known' || normalizedPath.startsWith('/.well-known/');

  if (!isWellKnownPath) {
    await next();
    return;
  }

  if ((ctx.method === 'GET' || ctx.method === 'HEAD') && requestPath === APPLE_APP_SITE_ASSOCIATION_PATH) {
    ctx.set('Content-Type', 'application/json');
    ctx.set('Cache-Control', 'public, max-age=3600');
    ctx.body = appleAppSiteAssociation;
    return;
  }

  if ((ctx.method === 'GET' || ctx.method === 'HEAD') && requestPath === FARCASTER_MANIFEST_PATH) {
    ctx.set('Content-Type', 'application/json');
    ctx.body = getFarcasterManifest(ctx);
    return;
  }

  ctx.status = 404;
  ctx.body = 'Resource not found';
  ctx.set('Cache-Control', 'no-store');
}

module.exports = wellKnownMiddleware;
