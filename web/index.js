const config = require('../config');
const path = require('path');
const Koa = require('koa');
const serve = require('koa-static');
const logger = require('koa-logger');
const router = require('./src/routes');
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
    console.log('error: ', err);
    ctx.status = err.status || 500;
    ctx.body = err.message;
  }
});

app.use(logger());
app.use(cacheControlMiddleware);
app.use(redirectMiddleware);
app.use(iframeDestroyerMiddleware);

app.use(
  serve(DIST_ROOT, {
    // Set a cache time of one hour for mobile development.
    // The default (or if undefined) is 0, no cache.
    maxage: process.env.NODE_ENV !== 'production' ? 3600000 : 0,
  })
);

app.use(router.routes());
app.listen(config.WEB_SERVER_PORT, () => `Server up at localhost:${config.WEB_SERVER_PORT}`);
