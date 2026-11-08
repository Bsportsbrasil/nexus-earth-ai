const http = require('https');

const endpoints = [
  '/',
  '/index.html',
  '/mobile.html',
  '/admin.html',
  '/style.css',
  '/mobile.css',
  '/mobile.js',
  '/voice_engine.js',
  '/floating_nexus.js',
  '/swarm_100_ui.js',
  '/api/health',
  '/api/metrics',
  '/api/swarm/state',
  '/api/geo/projects',
  '/api/explainability/overview',
  '/api/learning/metrics',
  '/api/locales/pt',
  '/api/auth/me'
];

console.log('=== TESTANDO RESPOSTA HTTP 200 DOS ENDPOINTS EM PRODUÇÃO (nexusearthai.com) ===');

async function checkAll() {
  const issues = [];
  for (const ep of endpoints) {
    try {
      const res = await fetch('https://nexusearthai.com' + ep, { method: 'GET' });
      const status = res.status;
      if (status >= 400 && status !== 401) { // 401 é normal para /api/auth/me se não logado
        issues.push({ endpoint: ep, status });
        console.log(`❌ ${ep} -> Status ${status}`);
      } else {
        console.log(`✓ ${ep} -> Status ${status}`);
      }
    } catch (e) {
      issues.push({ endpoint: ep, error: e.message });
      console.log(`❌ ${ep} -> Erro de rede: ${e.message}`);
    }
  }

  console.log('\nResumo de Falhas em Produção:', JSON.stringify(issues, null, 2));
}

checkAll();
