const fs = require('fs');

['index.html', 'mobile.html', 'admin.html'].forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('floating_nexus.js')) {
      content = content.replace('</body>', '  <script src="floating_nexus.js"></script>\n</body>');
      fs.writeFileSync(file, content, 'utf8');
      console.log('✅ Added floating_nexus.js to ' + file);
    } else {
      console.log('Already present in ' + file);
    }
  }
});
