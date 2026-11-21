import { solutionsPortalEngine } from '../engine/solutions_portal_engine.js';

const routes = [
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

let failed = 0;
for (const r of routes) {
  const html = solutionsPortalEngine.resolveRouteHTML(r);
  if (!html || !html.includes('<!DOCTYPE html>') || !html.includes('<title>') || !html.includes('<meta name="description"')) {
    console.error(`FAIL: Route ${r} did not render valid SEO HTML`);
    failed++;
    continue;
  }
  if (html.includes('NEXUS-SOVEREIGN-2026') || html.includes('48991361529') || html.includes('Ana beatriz')) {
    console.error(`SECURITY FAIL: Route ${r} leaked private data or admin key!`);
    failed++;
    continue;
  }
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  console.log(`OK [${r}] -> ${titleMatch ? titleMatch[1] : 'no title'} (${html.length} bytes)`);
}

if (failed > 0) {
  process.exit(1);
}
console.log(`ALL ${routes.length} SOLUTIONS & RESULTS PAGES VERIFIED 100% CLEAN & SECURE!`);
