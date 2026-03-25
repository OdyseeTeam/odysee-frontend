const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '../custom/homepages/v2');

if (!fs.existsSync(dir)) process.exit(0);

fs.readdirSync(dir).forEach((file) => {
  if (file.endsWith('.js')) {
    const oldPath = path.join(dir, file);
    const newPath = path.join(dir, file.replace(/\.js$/, '.cjs'));
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed ${file} -> ${file.replace(/\.js$/, '.cjs')}`);
  }
});
