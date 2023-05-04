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

app.use(
  serve(DIST_ROOT, {
    maxage: 3600000, // set a cache time of one hour, helpful for mobile dev
  })
);

app.use(router.routes());
app.listen(config.WEB_SERVER_PORT, () => `Server up at localhost:${config.WEB_SERVER_PORT}`);
