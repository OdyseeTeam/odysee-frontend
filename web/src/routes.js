const { fetchStreamUrl } = require('./fetchStreamUrl');
const { getHomepage } = require('./homepageApi');
const { getHtml } = require('./html');
const { getMinVersion } = require('./minVersion');
const { getOEmbed } = require('./oEmbed');
const { getRss } = require('./rss');
const { getFarcasterManifest } = require('./farcaster');
const { handleFramePost } = require('./frame');
const { getTempFile } = require('./tempfile');

const fetch = require('node-fetch');
const Router = require('@koa/router');

// So any code from 'lbry-redux'/'lbryinc' that uses `fetch` can be run on the server
global.fetch = fetch;

const router = new Router();

async function getStreamUrl(ctx) {
  const { claimName, claimId } = ctx.params;
  return await fetchStreamUrl(claimName, claimId);
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

const fcManifestMiddleware = async (ctx) => {
  const manifest = await getFarcasterManifest(ctx);
  ctx.set('Content-Type', 'application/json');
  ctx.body = manifest;
};

router.get(`/$/minVersion/v1/get`, async (ctx) => getMinVersion(ctx));

router.get(`/$/api/content/v1/get`, async (ctx) => getHomepage(ctx, 1));
router.get(`/$/api/content/v2/get`, async (ctx) => getHomepage(ctx, 2));

router.get(`/$/download/:claimName/:claimId`, async (ctx) => {
  const streamUrl = await getStreamUrl(ctx);
  if (streamUrl) {
    const downloadUrl = `${streamUrl}?download=true&magic=${Number(Math.round(Date.now() / 1000))}`;
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

router.get(`/$/rss/:claimName/:claimId`, rssMiddleware);
router.get(`/$/rss/:claimName::claimId`, rssMiddleware);

router.get(`/$/oembed`, oEmbedMiddleware);

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

router.get('*', async (ctx) => {
  const requestedUrl = ctx.url;

  if (requestedUrl.startsWith('/public/') && requestedUrl.endsWith('.js')) {
    // If the file exists, `app.use(serve(DIST_ROOT))` would have handled it.
    // Handle the non-existent file here, otherwise it'll get resolved to a
    // claim with the name 'public'.
    ctx.status = 404;
    ctx.body = 'Resource not found';
    ctx.set('Cache-Control', 'no-store');
    return;
  }

  const html = await getHtml(ctx);
  ctx.body = html;
});

module.exports = router;
