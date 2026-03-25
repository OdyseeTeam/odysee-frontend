const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '../custom/homepages/v2');

if (!fs.existsSync(dir)) process.exit(0);

// Rename .js -> .cjs
fs.readdirSync(dir).forEach((file) => {
  if (file.endsWith('.js')) {
    const oldPath = path.join(dir, file);
    const newPath = path.join(dir, file.replace(/\.js$/, '.cjs'));
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed ${file} -> ${file.replace(/\.js$/, '.cjs')}`);
  }
});

// Fix require paths inside .cjs files: './foo.js' -> './foo.cjs'
fs.readdirSync(dir).forEach((file) => {
  if (file.endsWith('.cjs')) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = content.replace(/require\((['"])(.+?)\.js\1\)/g, "require($1$2.cjs$1)");
    if (fixed !== content) {
      fs.writeFileSync(filePath, fixed);
      console.log(`Fixed require paths in ${file}`);
    }
  }
});
