const path = require('path');

const serve = require('koa-static');

const router = require('./routes');

const wellKnownMiddleware = require('./well-known');

function registerContentMiddleware(app, { distRoot, dynamicRoutesFirst, staticMaxAge }) {
  const staticServe = serve(distRoot, { maxage: staticMaxAge, index: false });
  const rootStaticServe = serve(path.resolve(distRoot, 'public'), { maxage: staticMaxAge, index: false });

  app.use(wellKnownMiddleware);

  if (dynamicRoutesFirst) {
    app.use(router.routes());
    app.use(staticServe);
    app.use(rootStaticServe);
  } else {
    app.use(staticServe);
    app.use(rootStaticServe);
    app.use(router.routes());
  }
}

module.exports = registerContentMiddleware;
