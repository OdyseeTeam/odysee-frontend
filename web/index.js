const config = require('../config');
const path = require('path');
const Koa = require('koa');
const serve = require('koa-static');
const logger = require('koa-logger');
const router = require('./src/routes');
const appStringsMiddleWare = require('./middleware/app-strings');
const redirectMiddleware = require('./middleware/redirect');
const cacheControlMiddleware = require('./middleware/cache-control');
const iframeDestroyerMiddleware = require('./middleware/iframe-destroyer');

const app = new Koa();
const DIST_ROOT = path.resolve(__dirname, 'dist');

app.proxy = true;

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.log('error: ', err); // eslint-disable-line no-console
    ctx.status = err.status || 500;
    ctx.body = err.message;
  }
});

app.use(logger());
app.use(cacheControlMiddleware);
app.use(redirectMiddleware);
app.use(iframeDestroyerMiddleware);
app.use(appStringsMiddleWare);

if (config.DYNAMIC_ROUTES_FIRST) {
  // Route dynamic pages first so we can inject proper meta (/, embeds, etc)
  app.use(router.routes());

  // Then fall through to static assets (e.g. /public/*)
  app.use(
    serve(DIST_ROOT, {
      maxage: 3600000,
    })
  );
} else {
  // Default: serve static first (production-safe), then dynamic routes
  app.use(
    serve(DIST_ROOT, {
      maxage: 3600000,
    })
  );
  app.use(router.routes());
}

app.listen(config.WEB_SERVER_PORT, () => `Server up at localhost:${config.WEB_SERVER_PORT}`);
