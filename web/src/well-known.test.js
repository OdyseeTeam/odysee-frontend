const assert = require('node:assert/strict');
const path = require('node:path');
const { after, before, test } = require('node:test');

const Koa = require('koa');

const registerContentMiddleware = require('./content-middleware');

const expectedAppleAppSiteAssociation = {
  applinks: {
    details: [
      {
        appIDs: ['7G9P9AM955.com.odysee.Odysee'],
        components: [
          {
            '/': '/$/*',
            exclude: true,
            comment: 'exclude verification URL',
          },
          {
            '/': '/*',
            comment: 'Matches all URLs that are not just / (All files/channels)',
          },
        ],
      },
    ],
  },
};

const modes = [
  { name: 'static-first', dynamicRoutesFirst: false },
  { name: 'dynamic-first', dynamicRoutesFirst: true },
];
const servers = new Map();

before(async () => {
  for (const mode of modes) {
    const app = new Koa();
    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = err.message;
      }
    });
    registerContentMiddleware(app, {
      distRoot: path.resolve(__dirname, '../../static'),
      dynamicRoutesFirst: mode.dynamicRoutesFirst,
      staticMaxAge: 0,
    });

    await new Promise((resolve) => {
      const server = app.listen(0, '127.0.0.1', resolve);
      servers.set(mode.name, server);
    });
  }
});

after(async () => {
  await Promise.all(
    [...servers.values()].map(
      (server) =>
        new Promise((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
        })
    )
  );
});

function request(mode, requestPath, options) {
  const server = servers.get(mode.name);
  return fetch(`http://127.0.0.1:${server.address().port}${requestPath}`, options);
}

for (const mode of modes) {
  test(`${mode.name} serves the Apple app site association as JSON`, async () => {
    const response = await request(mode, '/.well-known/apple-app-site-association', { redirect: 'manual' });

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /^application\/json\b/);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=3600');
    assert.equal(response.headers.get('location'), null);
    assert.deepEqual(await response.json(), expectedAppleAppSiteAssociation);
  });

  test(`${mode.name} supports HEAD requests for the Apple app site association`, async () => {
    const response = await request(mode, '/.well-known/apple-app-site-association', { method: 'HEAD' });

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /^application\/json\b/);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=3600');
    assert.equal(await response.text(), '');
  });

  test(`${mode.name} preserves the Farcaster manifest`, async () => {
    const response = await request(mode, '/.well-known/farcaster.json');

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /^application\/json\b/);
  });

  test(`${mode.name} rejects unknown and normalized well-known paths`, async () => {
    const paths = [
      '/.well-known/missing-extensionless',
      '/.WELL-KNOWN/missing-extensionless',
      '/%2ewell-known/missing-extensionless',
      '/.well-known/%2e%2e%2findex-web.html',
      '/.well-known/..%2Fpackage.json',
    ];

    for (const requestPath of paths) {
      const response = await request(mode, requestPath);
      const body = await response.text();

      assert.equal(response.status, 404, requestPath);
      assert.equal(response.headers.get('cache-control'), 'no-store', requestPath);
      assert.doesNotMatch(response.headers.get('content-type') || '', /^text\/html\b/, requestPath);
      assert.doesNotMatch(body, /odysee\.com-server/, requestPath);
    }
  });
}
