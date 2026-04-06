const path = require('path');

const config = require('../config.cjs');

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

// /public/* files are served from dist/ (maps to dist/public/*)
const staticMaxAge = (process.env.NODE_ENV || 'development') === 'development' ? 0 : 3600000;
const staticServe = serve(DIST_ROOT, { maxage: staticMaxAge });
// Root-level files like /robots.txt, /sw.js are in dist/public/, serve with prefix strip
const rootStaticServe = serve(path.resolve(__dirname, 'dist/public'), { maxage: staticMaxAge });

if (config.DYNAMIC_ROUTES_FIRST) {
  app.use(router.routes());
  app.use(staticServe);
  app.use(rootStaticServe);
} else {
  app.use(staticServe);
  app.use(rootStaticServe);
  app.use(router.routes());
}

const PORT = config.WEB_SERVER_PORT || 1337;

function killPort(port) {
  try {
    const { execSync } = require('child_process');
    const isWin = process.platform === 'win32';
    const cmd = isWin ? `netstat -ano | findstr :${port} | findstr LISTENING` : `lsof -ti tcp:${port} 2>/dev/null`;
    const result = execSync(cmd).toString().trim();
    if (!result) return;

    if (isWin) {
      // Parse PIDs from netstat output (last column)
      const pids = [
        ...new Set(
          result
            .split('\n')
            .map((l) => l.trim().split(/\s+/).pop())
            .filter(Boolean)
        ),
      ];
      for (const pid of pids) {
        if (Number(pid) !== process.pid) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          } catch {}
        }
      }
      if (pids.length) console.log(`Killed stale process(es) on port ${port}: ${pids.join(', ')}`);
    } else {
      const pids = result.split('\n').filter(Boolean);
      for (const pid of pids) {
        if (Number(pid) !== process.pid) {
          try {
            process.kill(Number(pid), 'SIGKILL');
          } catch {}
        }
      }
      if (pids.length) console.log(`Killed stale process(es) on port ${port}: ${pids.join(', ')}`);
    }
  } catch {
    // No process on port, or command not available — that's fine
  }
}

killPort(PORT);

// --- Dev livereload via SSE ---
const IS_DEV = (process.env.NODE_ENV || 'development') === 'development';
if (IS_DEV) {
  const sseClients = new Set();
  let buildHash = Date.now().toString();

  const watchFile = path.resolve(DIST_ROOT, 'public/index-web.html');
  let debounceTimer;
  fs.watchFile(watchFile, { interval: 500 }, () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      buildHash = Date.now().toString();
      for (const res of sseClients) {
        res.write(`data: ${buildHash}\n\n`);
      }
    }, 1500);
  });

  app.use(async (ctx, next) => {
    if (ctx.path === '/__livereload') {
      ctx.set('Content-Type', 'text/event-stream');
      ctx.set('Cache-Control', 'no-cache');
      ctx.set('Connection', 'keep-alive');
      ctx.status = 200;
      ctx.respond = false;
      // Do not send a `data:` event here — the page script reloads on every onmessage(),
      // so an initial payload would cause an infinite refresh loop.
      ctx.res.write(': livereload\n\n');
      sseClients.add(ctx.res);
      ctx.req.on('close', () => sseClients.delete(ctx.res));
      return;
    }
    await next();
  });
}

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
// Windows: Ctrl+C in some terminals sends SIGBREAK instead of SIGINT
if (process.platform === 'win32') {
  process.on('SIGBREAK', () => shutdown('SIGBREAK'));
}
