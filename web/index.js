const fs = require('fs');
const path = require('path');

// Auto-rename .js -> .cjs in custom homepages (external repo builds .js, Node ESM needs .cjs)
const hpDir = path.resolve(__dirname, '../custom/homepages/v2');
if (fs.existsSync(hpDir)) {
  fs.readdirSync(hpDir).forEach((f) => {
    if (f.endsWith('.js')) {
      fs.renameSync(path.join(hpDir, f), path.join(hpDir, f.replace(/\.js$/, '.cjs')));
    }
  });
}

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
const STATIC_ROOT = path.resolve(__dirname, 'dist/public');
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

// Strip /public prefix so koa-static can find files in dist/public/
app.use(async (ctx, next) => {
  const originalPath = ctx.path;
  if (ctx.path.startsWith('/public/')) {
    ctx.path = ctx.path.slice('/public'.length);
  }
  await next();
  ctx.path = originalPath;
});

const staticServe = serve(STATIC_ROOT, { maxage: 3600000 });

if (config.DYNAMIC_ROUTES_FIRST) {
  app.use(router.routes());
  app.use(staticServe);
} else {
  app.use(staticServe);
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
