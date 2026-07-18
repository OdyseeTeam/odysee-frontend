const { fetchStreamUrl } = require('./fetchStreamUrl');

const config = require('../../config.cjs');

const crypto = require('node:crypto');

const { getHomepage } = require('./homepageApi');

const { getHtml } = require('./html');

const { getMinVersion } = require('./minVersion');

const { getOEmbed } = require('./oEmbed');

const { getRss } = require('./rss');

const { getFarcasterManifest } = require('./farcaster');

const { handleFramePost } = require('./frame');

const { getTempFile } = require('./tempfile');

const { getSpinnerHtml } = require('./spinner');

const { getLlmsTxt } = require('./llms');

const Router = require('@koa/router');

// So any code from 'lbry-redux'/'lbryinc' that uses `fetch` can be run on the server
global.fetch = globalThis.fetch;
const router = new Router();
const RSS_MEDIA_AUTH_DEFAULT_TTL_SECONDS = 600;
const RSS_MEDIA_AUTH_MAX_TTL_SECONDS = 600;

async function getStreamUrl(ctx) {
  const { claimName, claimId } = ctx.params;
  return await fetchStreamUrl(claimName, claimId);
}

function buildRssMediaRedirectUrl(streamUrl, now = Date.now()) {
  let redirectUrl;

  try {
    redirectUrl = new URL(streamUrl);
  } catch {
    return null;
  }

  if (!isAllowedRssMediaRedirectUrl(redirectUrl)) {
    return null;
  }

  redirectUrl.searchParams.set('download', 'true');
  redirectUrl.searchParams.set('magic', String(Math.round(now / 1000)));
  if (!addRssMediaAuthParams(redirectUrl, now)) {
    return null;
  }
  return redirectUrl.toString();
}

function addRssMediaAuthParams(redirectUrl, now) {
  const secret = config.RSS_MEDIA_AUTH_SECRET;
  if (!secret) {
    return true;
  }

  const parts = getRssMediaStreamParts(redirectUrl);
  if (!parts) {
    return false;
  }

  const ttlSeconds = getRssMediaAuthTTLSeconds();
  if (!ttlSeconds) {
    return false;
  }

  const expiration = Math.round(now / 1000) + ttlSeconds;
  const signature = signRssMediaAuth(secret, parts.claimId, parts.sdHash, expiration);
  redirectUrl.searchParams.set('rss_claim', parts.claimId);
  redirectUrl.searchParams.set('rss_sd', parts.sdHash);
  redirectUrl.searchParams.set('rss_exp', String(expiration));
  redirectUrl.searchParams.set('rss_sig', signature);
  return true;
}

function getRssMediaStreamParts(url) {
  const parts = url.pathname.split('/').filter(Boolean);
  const streamsIndex = parts.indexOf('streams');
  const version = parts[streamsIndex - 1];
  const claimId = parts[streamsIndex + 1];
  const sdHash = normalizeRssMediaAuthSD(parts[streamsIndex + 2]);

  if (streamsIndex < 0 || version !== 'v6' || !claimId || !sdHash || !/^[0-9a-f]{40}$/i.test(claimId)) {
    return null;
  }
  return {
    claimId: claimId.toLowerCase(),
    sdHash,
  };
}

function normalizeRssMediaAuthSD(value) {
  if (!value) {
    return null;
  }
  let decoded;
  try {
    decoded = decodeURIComponent(value).toLowerCase();
  } catch {
    return null;
  }
  const withoutExtension = decoded.replace(/\.[^.]*$/, '');
  if (!/^[0-9a-f]{6,96}$/.test(withoutExtension)) {
    return null;
  }
  return withoutExtension;
}

function getRssMediaAuthTTLSeconds() {
  const rawTTL = config.RSS_MEDIA_AUTH_TTL_SECONDS || String(RSS_MEDIA_AUTH_DEFAULT_TTL_SECONDS);
  if (!/^\d+$/.test(rawTTL)) {
    return 0;
  }
  const ttlSeconds = Number.parseInt(rawTTL, 10);
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0 || ttlSeconds > RSS_MEDIA_AUTH_MAX_TTL_SECONDS) {
    return 0;
  }
  return ttlSeconds;
}

function signRssMediaAuth(secret, claimId, sdHash, expiration) {
  return crypto
    .createHmac('sha256', secret)
    .update(`rss-v1\n${claimId.toLowerCase()}\n${sdHash.toLowerCase()}\n${expiration}`)
    .digest('base64url');
}

function getHostname(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isAllowedRssMediaRedirectUrl(url) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }

  const hostname = url.hostname.toLowerCase();
  const playerHostname = getHostname(config.PLAYER_SERVER);

  return hostname === playerHostname || hostname === 'odycdn.com' || hostname.endsWith('.odycdn.com');
}

const rssMiddleware = async (ctx) => {
  const rss = await getRss(ctx);

  if (rss.startsWith('<?xml')) {
    ctx.set('Content-Type', 'application/xml');
  }

  ctx.body = rss;
};

const oEmbedMiddleware = async (ctx) => {
  const oEmbed = await getOEmbed(ctx);
  ctx.body = oEmbed;
};

const tempfileMiddleware = async (ctx) => {
  const temp = await getTempFile(ctx);
  ctx.body = temp;
};

const rssMediaMiddleware = async (ctx) => {
  const streamUrl = await getStreamUrl(ctx);

  if (!streamUrl) {
    ctx.status = 404;
    ctx.body = '';
    return;
  }

  const redirectUrl = buildRssMediaRedirectUrl(streamUrl);
  if (!redirectUrl) {
    ctx.status = 502;
    ctx.body = 'Invalid stream URL';
    return;
  }

  ctx.set('Cache-Control', 'no-store');
  ctx.redirect(redirectUrl);
};

const fcManifestMiddleware = async (ctx) => {
  const manifest = await getFarcasterManifest(ctx);
  ctx.set('Content-Type', 'application/json');
  ctx.body = manifest;
};

router.get(`/$/favicon`, async (ctx) => {
  const domain = ctx.query.d;
  if (!domain || typeof domain !== 'string' || !/^[a-z0-9.-]+$/i.test(domain)) {
    ctx.status = 400;
    return;
  }

  const faviconCache = router._faviconCache || (router._faviconCache = new Map());
  const cached = faviconCache.get(domain);
  if (cached) {
    if (cached.status === 404) {
      ctx.status = 404;
      ctx.body = '';
      return;
    }
    ctx.set('Content-Type', cached.contentType);
    ctx.set('Cache-Control', 'public, max-age=604800');
    ctx.body = cached.buffer;
    return;
  }

  async function tryFetch(url) {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.startsWith('image/') || ct.includes('icon')) {
        return { buffer: Buffer.from(await res.arrayBuffer()), contentType: ct };
      }
    }
    return null;
  }

  function serve(result) {
    faviconCache.set(domain, result);
    ctx.set('Content-Type', result.contentType);
    ctx.set('Cache-Control', 'public, max-age=604800');
    ctx.body = result.buffer;
  }

  // Try common paths in parallel
  const paths = ['/favicon.ico', '/favicon-32x32.png', '/favicon-16x16.png', '/apple-touch-icon.png'];
  const results = await Promise.allSettled(paths.map((p) => tryFetch(`https://${domain}${p}`)));
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      serve(r.value);
      return;
    }
  }

  // Fallback: parse HTML for <link rel="icon">
  try {
    const html = await fetch(`https://${domain}`, { redirect: 'follow', signal: AbortSignal.timeout(3000) }).then((r) =>
      r.text()
    );
    const match =
      html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
    if (match && match[1]) {
      let iconUrl = match[1];
      if (iconUrl.startsWith('//')) iconUrl = 'https:' + iconUrl;
      else if (iconUrl.startsWith('/')) iconUrl = `https://${domain}${iconUrl}`;
      else if (!iconUrl.startsWith('http')) iconUrl = `https://${domain}/${iconUrl}`;
      const result = await tryFetch(iconUrl);
      if (result) {
        serve(result);
        return;
      }
    }
  } catch {}

  faviconCache.set(domain, { status: 404 });
  ctx.status = 404;
  ctx.body = '';
});

router.get(`/$/minVersion/v1/get`, async (ctx) => getMinVersion(ctx));
router.get(`/$/api/content/v1/get`, async (ctx) => getHomepage(ctx, 1));
router.get(`/$/api/content/v2/get`, async (ctx) => getHomepage(ctx, 2));
router.get(`/$/download/:claimName/:claimId`, async (ctx) => {
  const streamUrl = await getStreamUrl(ctx);

  if (streamUrl) {
    const downloadUrl = buildRssMediaRedirectUrl(streamUrl);
    if (!downloadUrl) {
      ctx.status = 502;
      ctx.body = 'Invalid stream URL';
      return;
    }
    ctx.append('odysee-download', 'true');
    ctx.redirect(downloadUrl);
  }
});
router.get(`/$/stream/:claimName/:claimId`, async (ctx) => {
  const streamUrl = await getStreamUrl(ctx);

  if (streamUrl) {
    ctx.redirect(streamUrl);
  }
});
router.get(`/$/activate`, async (ctx) => {
  ctx.redirect(`https://sso.odysee.com/auth/realms/Users/device`);
});
// to add a path for a temp file on the server, customize this path
router.get('/.well-known/farcaster.json', fcManifestMiddleware);
router.get('/.well-known/:filename', tempfileMiddleware);
router.get(`/$/rss/media/:claimName/:claimId/:filename`, rssMediaMiddleware);
router.get(`/rss/:claimName/:claimId`, rssMiddleware);
router.get(`/rss/:claimName::claimId`, rssMiddleware);
router.get(`/rss/:channelRef`, rssMiddleware);
router.get(`/$/rss/:claimName/:claimId`, rssMiddleware);
router.get(`/$/rss/:claimName::claimId`, rssMiddleware);
router.get(`/$/rss/:channelRef`, rssMiddleware);
router.get(`/$/oembed`, oEmbedMiddleware);
router.get(`/$/spinner`, async (ctx) => {
  ctx.set('Content-Type', 'text/html');
  ctx.body = getSpinnerHtml(ctx);
});
router.get(`/$/llms.txt`, async (ctx) => {
  const llmsTxt = await getLlmsTxt();

  if (!llmsTxt) {
    ctx.status = 404;
    ctx.body = 'llms.txt not found';
    return;
  }

  ctx.set('Content-Type', 'text/plain; charset=utf-8');
  ctx.body = llmsTxt;
});
router.post(`/$/frame`, async (ctx) => {
  // Minimal JSON parser to avoid external dependencies
  try {
    const chunks = [];
    await new Promise((resolve) => {
      ctx.req.on('data', (c) => chunks.push(c));
      ctx.req.on('end', resolve);
    });
    const raw = Buffer.concat(chunks).toString('utf8');

    try {
      ctx.request.body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      ctx.request.body = {};
    }
  } catch (e) {
    ctx.request.body = {};
  }

  await handleFramePost(ctx);
});
router.get('*', async (ctx, next) => {
  const requestedUrl = ctx.url;

  // Dev SSE livereload (web/index.js) must not be served as SPA HTML — router runs before that middleware.
  if (ctx.path === '/__livereload') {
    await next();
    return;
  }

  if (config.DYNAMIC_ROUTES_FIRST) {
    // Dynamic-first: let static middleware handle assets
    if (requestedUrl.startsWith('/public/') || requestedUrl === '/sw.js') {
      await next();
      return;
    }
  } else {
    // Static-first (prod): if a /public/ asset wasn't found by static, avoid claim collision
    if (
      requestedUrl.startsWith('/public/') &&
      (requestedUrl.endsWith('.js') || requestedUrl.endsWith('.css') || requestedUrl.startsWith('/public/assets/'))
    ) {
      ctx.status = 404;
      ctx.body = 'Resource not found';
      ctx.set('Cache-Control', 'no-store');
      return;
    }
    // Don't serve HTML for missing static files — return 404 so the browser
    // doesn't register HTML as a service worker or parse it as JSON.
    if (requestedUrl === '/sw.js' || requestedUrl.endsWith('.json') || requestedUrl.endsWith('.map')) {
      ctx.status = 404;
      ctx.body = 'Resource not found';
      ctx.set('Cache-Control', 'no-store');
      return;
    }
  }

  const html = await getHtml(ctx);

  // Only set body if not already redirecting (3xx status)
  if (ctx.status < 300 || ctx.status >= 400) {
    ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    ctx.set('Content-Type', 'text/html; charset=utf-8');
    ctx.body = html;
  }
});
module.exports = router;
