const fs = require('fs');
const path = require('path');

async function appStringsMiddleware(ctx, next) {
  const { path: requestPath } = ctx;

  if (/^\/app-strings\/.+\.json$/.test(requestPath)) {
    try {
      ctx.set('Access-Control-Allow-Origin', '*');
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
