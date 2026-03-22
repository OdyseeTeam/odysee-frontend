import express from 'express';
import unpackByOutpoint from './unpackByOutpoint';
// Polyfills and `lbry-redux`
global.fetch = globalThis.fetch;
global.window = global;

const Lbry = require('lbry');

delete global.window;
export default async function startSandbox() {
  const port = 5278;
  const sandbox = express();
  sandbox.get('/set/:outpoint', (req, res, next) => {
    const { outpoint } = req.params;
    Promise.resolve(unpackByOutpoint(Lbry, outpoint))
      .then((resolvedPath) => {
        sandbox.use(`/sandbox/${outpoint}/`, express.static(resolvedPath));
        res.send(`/sandbox/${outpoint}/`);
      })
      .catch(next);
  });
  sandbox
    .listen(port, 'localhost', () => console.log(`Sandbox listening on port ${port}.`))
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(
          `Server already listening at localhost:${port}. This is probably another LBRY app running. If not, games in the app will not work.`
        );
      }
    });
}
