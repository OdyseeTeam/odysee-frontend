const fs = require('fs');
const path = require('path');

async function appStringsMiddleware(ctx, next) {
  const { path: requestPath } = ctx;

  if (/^\/app-strings\/.+\.json$/.test(requestPath)) {
    ctx.set('Access-Control-Allow-Origin', '*');

    if (ctx.method === 'OPTIONS') {
      ctx.set('Access-Control-Allow-Methods', 'GET');
      ctx.set('Access-Control-Allow-Headers', 'Content-Type');
      ctx.status = 204;
      return;
    }
    try {
      ctx.body = fs.readFileSync(path.join(__dirname, `../dist${requestPath}`), 'utf8');
      ctx.set('Content-Type', 'application/json');
    } catch {
      ctx.status = 404;
      ctx.body = 'Resource not found';
    }
  } else {
    return next();
  }
}

module.exports = appStringsMiddleware;
