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
const ENABLE_COI =
  process.env.ENABLE_CROSS_ORIGIN_ISOLATION === '1' || process.env.ENABLE_CROSS_ORIGIN_ISOLATION === 'true';
const COEP_VALUE = process.env.CROSS_ORIGIN_EMBEDDER_POLICY || 'credentialless';
const PORT = config.WEB_SERVER_PORT;

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
app.use(async (ctx, next) => {
  if (ENABLE_COI) {
    ctx.set('Cross-Origin-Opener-Policy', 'same-origin');
    ctx.set('Cross-Origin-Embedder-Policy', COEP_VALUE);
  }
  await next();
});
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
const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server up at http://localhost:${PORT}`);
});

let shuttingDown = false;
function shutdown(signal, callback) {
  if (shuttingDown) return;
  shuttingDown = true;

  // eslint-disable-next-line no-console
  console.log(`[web] shutting down (${signal})...`);

  try {
    server.close(() => {
      if (callback) callback();
      else process.exit(0);
    });
  } catch {
    if (callback) callback();
    else process.exit(0);
  }

  // Force-exit after a short grace period (prevents nodemon restarts leaving ports bound on Windows).
  setTimeout(() => process.exit(0), 1500).unref();
}

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console
    console.error(`[web] Port ${PORT} already in use (EADDRINUSE). Is another dev server still running?`);
    process.exit(1);
  }
  throw err;
});

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
// Nodemon sends SIGUSR2 on restart; close the server first to avoid leaving ports bound.
process.once('SIGUSR2', () => shutdown('SIGUSR2', () => process.kill(process.pid, 'SIGUSR2')));
