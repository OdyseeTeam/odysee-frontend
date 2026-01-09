const PAGES = require('../../ui/constants/pages');

async function iframeDestroyerMiddleware(ctx, next) {
  const {
    request: { path },
  } = ctx;
  const decodedPath = decodeURIComponent(path);

  // Allow iframing for embed pages, playlist pages, API, and homepage (for Farcaster miniapp)
  const allowIframe =
    decodedPath === '/' ||
    decodedPath.startsWith(`/$/${PAGES.EMBED}`) ||
    decodedPath.startsWith(`/$/${PAGES.PLAYLIST}`) ||
    decodedPath.startsWith(`/$/api/content/v1/get`);

  if (!allowIframe) {
    ctx.set('X-Frame-Options', 'DENY');
  }

  return next();
}

module.exports = iframeDestroyerMiddleware;
