const config = require('../config.cjs');

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

const PORT = config.WEB_SERVER_PORT || 1337;

function killPort(port) {
  try {
    const { execSync } = require('child_process');
    const result = execSync(`lsof -ti tcp:${port} 2>/dev/null`).toString().trim();
    if (result) {
      const pids = result.split('\n').filter(Boolean);
      for (const pid of pids) {
        if (Number(pid) !== process.pid) {
          try { process.kill(Number(pid), 'SIGKILL'); } catch {}
        }
      }
      console.log(`Killed stale process(es) on port ${port}: ${pids.join(', ')}`);
    }
  } catch {
    // No process on port, or lsof not available — that's fine
  }
}

killPort(PORT);

const server = app.listen(PORT, () => {
  console.log(`Server up at localhost:${PORT}`);
});

function shutdown(signal) {
  console.log(`\n${signal} received, shutting down...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  // Force exit if close takes too long
  setTimeout(() => process.exit(1), 3000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
