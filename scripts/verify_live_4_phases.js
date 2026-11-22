const BASE = 'https://nexusearthai.com';
let failures = 0;
function check(ok, label) {
  if (ok) console.log(`✓ LIVE PASS: ${label}`);
  else { console.error(`✗ LIVE FAIL: ${label}`); failures++; }
}

// 1. Public pages intact
for (const p of ['/', '/mobile.html', '/ofertas', '/projetos']) {
  const r = await fetch(`${BASE}${p}`);
  check(r.status === 200, `${p} -> HTTP ${r.status}`);
}

// 2. FASE 1 Security Lockdown (unauthenticated MUST be blocked!)
const payoutUnauth = await fetch(`${BASE}/api/swarm/payout-settings`);
check(payoutUnauth.status === 401, `GET /api/swarm/payout-settings sem token -> HTTP ${payoutUnauth.status} (esperado 401)`);

const blockUnauth = await fetch(`${BASE}/api/agents/block`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: 'aura', blocked: true })
});
check(blockUnauth.status === 401, `POST /api/agents/block sem token -> HTTP ${blockUnauth.status} (esperado 401)`);

const purgeUnauth = await fetch(`${BASE}/api/agents/purge-memory`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: 'aura' })
});
check(purgeUnauth.status === 401, `POST /api/agents/purge-memory sem token -> HTTP ${purgeUnauth.status} (esperado 401)`);

const swarmOrderUnauth = await fetch(`${BASE}/api/swarm/order`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: 'test' })
});
check(swarmOrderUnauth.status === 401, `POST /api/swarm/order sem token -> HTTP ${swarmOrderUnauth.status} (esperado 401)`);

const sol1Html = await (await fetch(`${BASE}/api/swarm/solution/1`)).text();
check(!sol1Html.includes('NEXUS-SOVEREIGN-2026'), `/api/swarm/solution/1 zero vazamento de chave admin`);
check(!sol1Html.includes('nexus-sovereign-pay-proxy-verified'), `/api/swarm/solution/1 zero Pix falso`);

const solPriv = await fetch(`${BASE}/solucoes`);
check(solPriv.status === 403, `/solucoes privado -> HTTP ${solPriv.status} (esperado 403)`);

// 3. FASE 2 & 3 Multilingual AI response test (Italian UI language with short message)
const itRes = await fetch(`${BASE}/api/agents/converse`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-nexus-session-id': 'live_verify_it_1' },
  body: JSON.stringify({ agentId: 'aura', message: 'Como você está hoje?', lang: 'it' })
});
const itJson = await itRes.json();
check(itRes.status === 200 && itJson.lang === 'it' && Boolean(itJson.reply), `/api/agents/converse lang=it -> "${String(itJson.reply || '').slice(0, 80)}..."`);

// 4. FASE 4 Payments & Revenue endpoints
const gwRes = await fetch(`${BASE}/api/payments/gateway-status`);
const gwJson = await gwRes.json();
check(gwRes.status === 200 && gwJson.plans && gwJson.plans.aura_plus.amountBRL === 29.9, `/api/payments/gateway-status -> provider=${gwJson.activeProvider}`);

const ledgerUnauth = await fetch(`${BASE}/api/admin/revenue-ledger`);
check(ledgerUnauth.status === 401, `/api/admin/revenue-ledger sem token -> HTTP ${ledgerUnauth.status} (esperado 401)`);

if (failures > 0) process.exit(1);
console.log('=== TODAS AS VERIFICAÇÕES REAIS EM PRODUÇÃO (4 FASES) PASSARAM 100%! ===');
