const BASE = 'https://nexusearthai.com';
const ADMIN_KEY = process.env.NEXUS_ADMIN_KEY || 'NEXUS-SOVEREIGN-2026';

const publicRoutes = ['/', '/mobile.html', '/ofertas', '/projetos'];
const privateRoutes = [
  '/solucoes',
  '/solucoes/pagamentos',
  '/solucoes/afiliados-ml',
  '/solucoes/monetizacao-aura',
  '/solucoes/micro-saas-b2b',
  '/solucoes/aquisicao-trafego',
  '/resultados/ordem-1',
  '/resultados/ordem-2',
  '/resultados/ordem-3'
];

let errors = 0;

console.log('--- 1. Verificando rotas públicas intactas (esperado 200) ---');
for (const r of publicRoutes) {
  const res = await fetch(`${BASE}${r}`);
  if (res.status !== 200) { console.error(`FAIL ${res.status} ${r}`); errors++; }
  else console.log(`200 OK (Público intacto) ${r}`);
}

console.log('--- 2. Verificando bloqueio público total nas 9 páginas privadas (esperado 403) ---');
for (const r of privateRoutes) {
  const res = await fetch(`${BASE}${r}`);
  if (res.status !== 403) { console.error(`SECURITY FAIL: expected 403 on ${r}, got ${res.status}`); errors++; }
  else console.log(`403 BLOCKED (Público bloqueado) ${r}`);
}

console.log('--- 3. Verificando API Admin sem token (esperado 401) ---');
const unauthApi = await fetch(`${BASE}/api/admin/solutions-page?route=/solucoes`);
if (unauthApi.status !== 401) { console.error(`SECURITY FAIL: expected 401 on unauth API, got ${unauthApi.status}`); errors++; }
else console.log(`401 BLOCKED (API sem token bloqueada) /api/admin/solutions-page`);

console.log('--- 4. Verificando API Admin autenticada nas 9 páginas (esperado 200) ---');
for (const r of privateRoutes) {
  const res = await fetch(`${BASE}/api/admin/solutions-page?route=${encodeURIComponent(r)}`, {
    headers: { 'Authorization': `Bearer ${ADMIN_KEY}`, 'x-nexus-admin-key': ADMIN_KEY }
  });
  const html = await res.text();
  if (res.status !== 200 || !html.includes('EXCLUSIVO ADMIN C2')) {
    console.error(`ADMIN FAIL ${res.status} ${r}`);
    errors++;
  } else {
    console.log(`200 OK (Admin autenticado) ${r} (${html.length} bytes)`);
  }
}

if (errors > 0) process.exit(1);
console.log('ALL SECURITY & ADMIN-ONLY CHECKS PASSED 100% IN PRODUCTION!');
