const fs = require('fs');
const path = require('path');

const report = {
  missingFiles: [],
  syntaxErrors: [],
  brokenReferences: [],
  apiEndpointAudit: []
};

['index.html', 'mobile.html', 'admin.html'].forEach(htmlFile => {
  if (!fs.existsSync(htmlFile)) {
    report.missingFiles.push(htmlFile);
    return;
  }
  const content = fs.readFileSync(htmlFile, 'utf8');

  // Match script src
  const scriptMatches = content.matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi);
  for (const m of scriptMatches) {
    const src = m[1].split('?')[0];
    if (!src.startsWith('http') && !src.startsWith('//')) {
      const cleanPath = src.startsWith('/') ? src.slice(1) : src;
      if (!fs.existsSync(cleanPath)) {
        report.brokenReferences.push({ html: htmlFile, ref: src, type: 'script' });
      }
    }
  }

  // Match link href
  const linkMatches = content.matchAll(/<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi);
  for (const m of linkMatches) {
    const href = m[1].split('?')[0];
    if (!href.startsWith('http') && !href.startsWith('//') && (href.endsWith('.css') || href.endsWith('.js'))) {
      const cleanPath = href.startsWith('/') ? href.slice(1) : href;
      if (!fs.existsSync(cleanPath)) {
        report.brokenReferences.push({ html: htmlFile, ref: href, type: 'css/link' });
      }
    }
  }
});

console.log('=== AUDITORIA CIRÚRGICA DE REFERÊNCIAS ESTÁTICAS ===');
console.log(JSON.stringify(report, null, 2));
