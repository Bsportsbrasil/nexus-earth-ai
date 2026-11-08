const fs = require('fs');

const adm = fs.readFileSync('admin.html', 'utf8');
const mob = fs.readFileSync('mobile.html', 'utf8');
const idx = fs.readFileSync('index.html', 'utf8');

const errors = [];

function checkDupIds(file, content) {
  const ids = {};
  const m = content.matchAll(/id=["']([^"']+)["']/gi);
  for (const match of m) {
    const id = match[1];
    if (ids[id]) {
      errors.push({ file, type: 'DUPLICATE_ID', id });
    } else {
      ids[id] = 1;
    }
  }
}

checkDupIds('admin.html', adm);
checkDupIds('mobile.html', mob);
checkDupIds('index.html', idx);

console.log('Duplicate IDs count:', errors.length);
if (errors.length > 0) {
  console.log('Sample duplicates:', errors);
}
