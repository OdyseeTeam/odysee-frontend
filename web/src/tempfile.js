const fs = require('fs');

const path = require('path');

async function getTempFile(ctx) {
  const filename = ctx.params.filename;
  let decodedFilename;

  if (typeof filename !== 'string') {
    ctx.throw(400, 'Invalid filename');
  }

  try {
    decodedFilename = decodeURIComponent(filename);
  } catch (error) {
    ctx.throw(400, 'Invalid filename');
  }

  const distPath = path.resolve(__dirname, '../dist');
  const filePath = path.resolve(distPath, decodedFilename);

  if (
    decodedFilename.includes('..') ||
    decodedFilename.includes('/') ||
    decodedFilename.includes('\\') ||
    !filePath.startsWith(`${distPath}${path.sep}`)
  ) {
    ctx.throw(400, 'Invalid filename');
  }

  return fs.readFileSync(filePath, 'utf8');
}

module.exports = {
  getTempFile,
};
