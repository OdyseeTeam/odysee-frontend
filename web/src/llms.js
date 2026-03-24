const fs = require('fs/promises');
const path = require('path');

const LLMS_TXT_PATH = path.resolve(__dirname, '../../llms.txt');

async function getLlmsTxt() {
  try {
    return await fs.readFile(LLMS_TXT_PATH, 'utf8');
  } catch (err) {
    return null;
  }
}

module.exports = { getLlmsTxt };
