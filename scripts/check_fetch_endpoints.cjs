const fs = require('fs');

console.log('=== AUDITORIA CIRÚRGICA DE CHAMADAS FETCH NO FRONTEND ===');
const frontFiles = ['index.html', 'mobile.html', 'admin.html', 'mobile.js', 'floating_nexus.js', 'swarm_100_ui.js', 'security_ui.js', 'world_organism_ui.js', 'supervisor_workspace.js', 'voice_engine.js'];

const endpointsCalled = new Set();

frontFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.matchAll(/fetch\(["'`]([^"'`?]+)(?:\?[^"'`]*)?["'`]/g);
  for (const m of matches) {
    if (m[1].startsWith('/')) {
      endpointsCalled.add(m[1]);
    }
  }
});

console.log('Endpoints chamados pelo Frontend:', Array.from(endpointsCalled));

// Check server.js for these endpoints
const serverCode = fs.readFileSync('server.js', 'utf8');

const missingInServer = [];
endpointsCalled.forEach(ep => {
  // Strip trailing segments for dynamic routes like /api/swarm/agent/123 or /api/locales/pt
  const baseEp = ep.replace(/\/[0-9a-zA-Z_-]+$/, '');
  if (!serverCode.includes(ep) && !serverCode.includes(baseEp) && !serverCode.includes(ep.split('/')[2])) {
    missingInServer.push(ep);
  }
});

console.log('\nEndpoints potencialmente não mapeados no server.js:');
console.log(missingInServer);
