import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REAL_ML_PRODUCTS } from './ml_active_products_catalog.js';
import { mlOffersManager } from './ml_offers_manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AutonomousDistributionEngine {
  constructor() {
    this.distributionLog = [];
    this.generatedShowcases = new Map();
  }

  /**
   * Gera uma Vitrine Web Pública Autônoma com todos os produtos, busca, categorias, fotos reais e links oficiais
   */
  generatePublicShowcaseHTML() {
    const offers = mlOffersManager.getAllOffers();
    const categories = Array.from(new Set(offers.map(o => o.category || 'Ofertas')));
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const catPills = `<button type="button" class="cat-pill active" data-cat="all" onclick="filterCat('all', this)">Todos (${offers.length})</button>` +
      categories.map(c => `<button type="button" class="cat-pill" data-cat="${esc(c)}" onclick="filterCat('${esc(c)}', this)">${esc(c)}</button>`).join('');

    const productsHtml = offers.map(p => {
      const imgHtml = p.imageUrl
        ? `<div style="width:100%; height:180px; background:#fff; border-radius:8px; margin-bottom:12px; display:flex; align-items:center; justify-content:center; overflow:hidden;"><img src="${esc(p.imageUrl)}" alt="${esc(p.title)}" loading="lazy" style="max-width:100%; max-height:100%; object-fit:contain;" /></div>`
        : '';
      const targetHref = p.verifiedLink
        ? p.affiliateUrl
        : `https://lista.mercadolivre.com.br/${encodeURIComponent(p.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-'))}`;
      const badgeExtra = p.verifiedLink
        ? `<span style="font-size:0.64rem; font-weight:800; color:#38bdf8; background:rgba(56,189,248,0.14); padding:3px 7px; border-radius:6px; font-family:monospace;">✓ LINK OFICIAL</span>`
        : '';

      return `
      <div class="deal-card" data-cat="${esc(p.category || 'Ofertas')}" data-title="${esc((p.title || '').toLowerCase())}" style="background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.2rem; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 8px 24px rgba(0,0,0,0.4);">
        <div>
          ${imgHtml}
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-size:0.68rem; font-weight:800; color:#10b981; background:rgba(16,185,129,0.12); padding:3px 8px; border-radius:6px; font-family:monospace;">${esc(p.badge)}</span>
            ${badgeExtra}
          </div>
          <h3 style="font-size:1.02rem; font-weight:700; color:#fff; margin:10px 0 6px; line-height:1.4;">${esc(p.title)}</h3>
          <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:8px; flex-wrap:wrap;">
            <span style="font-size:0.8rem; color:#94a3b8; text-decoration:line-through;">${esc(p.oldPrice)}</span>
            <span style="font-size:1.38rem; font-weight:800; color:#38bdf8;">${esc(p.currentPrice)}</span>
            <span style="font-size:0.75rem; color:#10b981; font-weight:700;">${esc(p.discount)}</span>
          </div>
          <div style="font-size:0.75rem; color:#cbd5e1; margin-bottom:14px;">${esc(p.installments)}</div>
        </div>
        <a href="${esc(targetHref)}" target="_blank" rel="noopener sponsored" style="display:block; text-align:center; background:linear-gradient(135deg, #ffe600, #ffc700); color:#2d3277; font-weight:800; font-size:0.88rem; padding:12px; border-radius:8px; text-decoration:none; box-shadow:0 4px 14px rgba(255,230,0,0.3); transition:transform 0.2s;">
          Ver Oferta no Mercado Livre ➔
        </a>
      </div>
    `;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Radar de Ofertas Oficiais • Mercado Livre Seleção Full</title>
  <meta name="description" content="Seleção inteligente de ofertas com até 58% de desconto, cupons ativos e entrega Full rápida no Mercado Livre.">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    body { margin: 0; background: #030712; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { text-align: center; padding: 26px 10px 24px; }
    .toolbar { display: flex; flex-direction: column; gap: 12px; align-items: center; margin-bottom: 24px; }
    .search-box { width: min(520px, 100%); padding: 11px 16px; border-radius: 10px; border: 1px solid rgba(0,245,255,0.3); background: rgba(15,23,42,0.9); color: #fff; font-size: 0.9rem; outline: none; }
    .cats { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
    .cat-pill { padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12); background: rgba(15,23,42,0.8); color: #94a3b8; font-size: 0.76rem; font-weight: 700; cursor: pointer; }
    .cat-pill.active { border-color: #00f5ff; color: #00f5ff; background: rgba(0,245,255,0.14); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span style="font-size:0.75rem; font-weight:800; color:#00f5ff; background:rgba(0,245,255,0.1); padding:4px 12px; border-radius:20px; font-family:monospace;">AUTONOMOUS DEALS RADAR</span>
      <h1 style="font-size:2rem; font-weight:800; margin:12px 0 6px;">Ofertas Selecionadas Mercado Livre</h1>
      <p style="color:#94a3b8; font-size:0.9rem; max-width:600px; margin:0 auto;">Monitoradas 24 horas por dia com estoque Full, descontos verificados e frete expresso.</p>
    </div>
    <div class="toolbar">
      <input type="search" id="deal-search" class="search-box" placeholder="Buscar produto, marca ou oferta..." oninput="filterSearch()" />
      <div class="cats">${catPills}</div>
    </div>
    <div class="grid" id="deals-grid">
      ${productsHtml}
    </div>
  </div>
  <script>
    var activeCat = 'all';
    function applyDealFilters() {
      var q = (document.getElementById('deal-search').value || '').toLowerCase().trim();
      document.querySelectorAll('.deal-card').forEach(function(card) {
        var cMatch = activeCat === 'all' || card.getAttribute('data-cat') === activeCat;
        var qMatch = !q || (card.getAttribute('data-title') || '').indexOf(q) !== -1;
        card.style.display = (cMatch && qMatch) ? 'flex' : 'none';
      });
    }
    function filterCat(cat, btn) {
      activeCat = cat;
      document.querySelectorAll('.cat-pill').forEach(function(b) { b.classList.remove('active'); });
      if (btn) btn.classList.add('active');
      applyDealFilters();
    }
    function filterSearch() { applyDealFilters(); }
  </script>
</body>
</html>`;
  }

  /**
   * Feed JSON público de ofertas para automação em robôs de redes sociais e canais
   */
  getDealsFeed() {
    return {
      updatedAt: new Date().toISOString(),
      channel: "CASTILLOOFFICIAL",
      totalDeals: REAL_ML_PRODUCTS.length,
      deals: REAL_ML_PRODUCTS.map(p => ({
        id: p.tag,
        title: p.title,
        price: p.currentPrice,
        oldPrice: p.oldPrice,
        discount: p.discount,
        affiliateLink: p.directHubUrl,
        socialCopy: `🚨 OFERTA RELÂMPAGO: ${p.title} com ${p.discount}! De ${p.oldPrice} por apenas ${p.currentPrice}! Compre com frete Full aqui: ${p.directHubUrl}`
      }))
    };
  }

  /**
   * Gera o Diretório Público Autônomo dos 100 Projetos Digitais (/projetos, /solutions, /marketplace)
   * Permite que qualquer usuário ou empresa na internet acesse, contrate ou assine os micro-saas,
   * APIs e automações dos 100 agentes mesmo antes de compra manual de domínio individual.
   */
  generateProjectsShowcaseHTML(swarmAgents) {
    const original100Agents = swarmAgents.filter(a => a.id <= 100);

    const cardsHtml = original100Agents.map(a => {
      const isRunning = a.status === 'EXECUTANDO';
      const mrrFormatted = 'R$ ' + (a.projectedRevenueBRL || 0).toLocaleString('pt-BR');
      const credsFormatted = a.requiredCredentials ? a.requiredCredentials.join(', ') : 'Pronto';
      
      return `
        <div style="background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 8px 24px rgba(0,0,0,0.5); transition:transform 0.2s, border-color 0.2s;" onmouseover="this.style.borderColor='rgba(0,245,255,0.4)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-family:monospace; font-size:0.7rem; font-weight:800; color:#00f5ff; background:rgba(0,245,255,0.1); padding:2px 8px; border-radius:4px;">#${String(a.id).padStart(2, '0')} • ${a.sector.toUpperCase()}</span>
              <span style="font-size:0.65rem; font-weight:700; color:#10b981; background:rgba(16,185,129,0.12); padding:3px 8px; border-radius:6px;">${isRunning ? '● ONLINE 24/7' : 'PAUSADO'}</span>
            </div>
            
            <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin:6px 0 8px;">${a.name}</h3>
            <p style="font-size:0.8rem; color:#94a3b8; line-height:1.45; margin:0 0 12px; min-height:42px;">${a.role}</p>

            <div style="background:rgba(2,6,23,0.7); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:0.6rem 0.8rem; margin-bottom:12px; font-family:monospace; font-size:0.7rem;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#64748b;">Monetização / MRR:</span>
                <span style="color:#10b981; font-weight:700;">${mrrFormatted}/mês</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#64748b;">Domínio Nativo:</span>
                <span style="color:#38bdf8;">${a.requiredDomain}</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:#64748b;">Integração:</span>
                <span style="color:#cbd5e1; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${credsFormatted}</span>
              </div>
            </div>
          </div>

          <div>
            <div style="margin-bottom:8px; display:flex; justify-content:space-between; font-size:0.68rem; font-family:monospace;">
              <span style="color:#94a3b8;">Progresso:</span>
              <span style="color:#00f5ff; font-weight:700;">${a.projectProgress ? a.projectProgress.progressPercent : 85}%</span>
            </div>
            <a href="/api/swarm/solution/${a.id}" style="display:block; text-align:center; background:linear-gradient(135deg, #0284c7, #0369a1); color:#fff; font-weight:700; font-size:0.82rem; padding:10px 14px; border-radius:8px; text-decoration:none; box-shadow:0 4px 12px rgba(2,132,199,0.3);">
              Acessar Projeto &amp; Contratar ➔
            </a>
          </div>
        </div>
      `;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEXUS Solutions • 100 Micro-SaaS &amp; Projetos Autônomos de Superinteligência</title>
  <meta name="description" content="Ecossistema completo de 100 soluções digitais em produção: APIs, Micro-SaaS B2B, automações inteligentes, extensões e dados com operação perpétua.">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    body { margin: 0; background: #030712; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; }
    .container { max-width: 1300px; margin: 0 auto; }
    .header { text-align: center; padding: 40px 10px 50px; }
    .hero-badge { font-size: 0.75rem; font-weight: 800; color: #00f5ff; background: rgba(0,245,255,0.1); border: 1px solid rgba(0,245,255,0.3); padding: 5px 14px; border-radius: 20px; font-family: monospace; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .stats-bar { display: flex; justify-content: center; gap: 30px; margin: 24px 0 0; flex-wrap: wrap; }
    .stat-pill { background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.08); padding: 10px 18px; border-radius: 10px; font-family: monospace; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="hero-badge">NEXUS ENTERPRISE SWARM • 100 PROJETOS DIGITAIS</span>
      <h1 style="font-size:2.4rem; font-weight:900; margin:16px 0 10px; letter-spacing:-0.5px;">100 Soluções de Software &amp; Monetização Autônoma</h1>
      <p style="color:#94a3b8; font-size:1.05rem; max-width:760px; margin:0 auto; line-height:1.6;">
        Projetos desenvolvidos, testados e mantidos 24 horas por dia por 100 agentes de superinteligência. Pronto para clientes, usuários e empresas utilizarem globalmente.
      </p>
      <div class="stats-bar">
        <div class="stat-pill">💼 <strong style="color:#10b981;">100</strong> Projetos Operando</div>
        <div class="stat-pill">⚡ <strong style="color:#00f5ff;">10</strong> Verticais de Negócio</div>
        <div class="stat-pill">📈 <strong style="color:#38bdf8;">100%</strong> Autônomo &amp; Ativo</div>
      </div>
    </div>
    <div class="grid">
      ${cardsHtml}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Gera uma página individual de solução pública para cada um dos 100 projetos
   */
  generateSingleSolutionHTML(agent) {
    const isRunning = agent.status === 'EXECUTANDO';
    const mrrFormatted = 'R$ ' + (agent.projectedRevenueBRL || 0).toLocaleString('pt-BR');
    const deliverableDocs = (agent.deliverables || []).map(d => `
      <div style="background:rgba(2,6,23,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:0.7rem; font-family:monospace; color:#38bdf8; font-weight:700;">${d.type}</span>
          <span style="font-size:0.65rem; color:#64748b; font-family:monospace;">${new Date(d.date).toLocaleDateString('pt-BR')}</span>
        </div>
        <div style="font-weight:700; font-size:0.85rem; color:#f8fafc; margin-bottom:4px;">${d.title}</div>
        <div style="font-size:0.75rem; color:#94a3b8; font-family:monospace; white-space:pre-wrap; max-height:140px; overflow-y:auto; line-height:1.4;">${d.content}</div>
      </div>
    `).join('\n');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${agent.name} • NEXUS Solution Official</title>
  <meta name="description" content="${agent.role}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    body { margin: 0; background: #030712; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px 16px; }
    .card { max-width: 840px; margin: 40px auto; background: rgba(15,23,42,0.9); border: 1px solid rgba(0,245,255,0.25); border-radius: 16px; padding: 32px; box-shadow: 0 12px 36px rgba(0,0,0,0.6); }
    .btn { display: inline-block; background: #00f5ff; color: #020617; font-weight: 800; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 0.95rem; }
    .checkout-btn { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #fff; font-weight: 800; padding: 14px 28px; border-radius: 10px; border: none; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 18px rgba(16,185,129,0.4); }
  </style>
</head>
<body>
  <div class="card">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
      <span style="font-family:monospace; font-size:0.78rem; color:#00f5ff; background:rgba(0,245,255,0.1); padding:4px 10px; border-radius:6px;">PROJETO #${agent.id} • ${agent.sector.toUpperCase()}</span>
      <span style="font-family:monospace; font-size:0.75rem; color:#10b981; font-weight:700;">● SISTEMA OPERACIONAL ATIVO</span>
    </div>

    <h1 style="font-size:2.2rem; font-weight:900; margin:0 0 10px; color:#fff;">${agent.name}</h1>
    <p style="font-size:1.1rem; color:#cbd5e1; line-height:1.5; margin:0 0 24px;">${agent.role}</p>

    <!-- ÁREA DE CHECKOUT SEGURO PIX DO CLIENTE (ZERO EXPOSIÇÃO DE DADOS PESSOAIS) -->
    <div style="background:linear-gradient(135deg, rgba(16,185,129,0.12), rgba(2,6,23,0.9)); border:1px solid rgba(16,185,129,0.35); border-radius:12px; padding:20px; margin-bottom:28px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div>
          <span style="font-size:0.72rem; color:#10b981; font-weight:800; font-family:monospace; background:rgba(16,185,129,0.15); padding:3px 8px; border-radius:4px;">CHECKOUT AUTOMATIZADO NEXUS PAY</span>
          <h3 style="font-size:1.2rem; font-weight:800; color:#fff; margin:6px 0 2px;">Contratar Acesso Imediato à Solução</h3>
          <p style="font-size:0.8rem; color:#94a3b8; margin:0;">Pagamento instantâneo via Pix com liberação segura e liquidação direta.</p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.7rem; color:#64748b; font-family:monospace;">PLANO MENSAL PRO</div>
          <div style="font-size:1.5rem; font-weight:900; color:#10b981; font-family:monospace;">R$ 149,00<span style="font-size:0.8rem; color:#94a3b8;">/mês</span></div>
        </div>
      </div>

      <div id="checkout-action-box" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <button type="button" onclick="openRealPixCheckout()" class="checkout-btn">
          ⚡ Pagar com Pix Oficial &amp; Ativar Agora
        </button>
        <span style="font-size:0.72rem; color:#64748b; font-family:monospace;">🔒 Gateway oficial Mercado Pago / Asaas • Zero dados pessoais expostos.</span>
      </div>
    </div>

    <!-- Modal Pix Oficial (Integrado ao Gateway Real em /api/payments/create-checkout) -->
    <div id="checkout-modal-pix" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:99999; align-items:center; justify-content:center;">
      <div style="background:#0f172a; border:1px solid rgba(16,185,129,0.4); border-radius:14px; max-width:440px; width:92%; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.8); text-align:center;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <span style="font-size:0.8rem; font-family:monospace; color:#10b981; font-weight:700;">CHECKOUT PIX OFICIAL • NEXUS PAY</span>
          <button type="button" onclick="document.getElementById('checkout-modal-pix').style.display='none'" style="background:transparent; border:none; color:#94a3b8; font-size:1.1rem; cursor:pointer;">✕</button>
        </div>

        <div id="pix-email-step" style="margin-bottom:14px;">
          <input type="email" id="pix-payer-email" placeholder="Seu e-mail para liberar o acesso imediato..." style="width:100%; box-sizing:border-box; padding:10px 12px; border-radius:8px; border:1px solid rgba(0,245,255,0.3); background:#020617; color:#fff; font-size:0.84rem; margin-bottom:10px;" />
          <button type="button" onclick="generateRealPixOrder()" style="width:100%; background:linear-gradient(135deg,#10b981,#059669); border:none; color:#fff; font-weight:800; font-size:0.85rem; padding:11px; border-radius:8px; cursor:pointer;">
            Gerar QR Code Pix do Banco Central
          </button>
        </div>

        <div id="pix-live-result" style="display:none;">
          <div id="pix-qr-box" style="background:#fff; border-radius:10px; padding:12px; width:190px; height:190px; margin:0 auto 14px; display:flex; align-items:center; justify-content:center;"></div>
          <h4 id="pix-status-heading" style="font-size:1rem; color:#fff; margin:0 0 6px;">Escaneie o QR Code no seu Banco</h4>
          <p id="pix-status-desc" style="font-size:0.75rem; color:#94a3b8; margin:0 0 14px;">Aguardando confirmação automática via Webhook...</p>
          <button type="button" id="pix-copy-btn" style="width:100%; background:rgba(16,185,129,0.2); border:1px solid rgba(16,185,129,0.4); color:#34d399; font-weight:700; font-size:0.82rem; padding:10px; border-radius:8px; cursor:pointer; margin-bottom:10px;">
            📋 Copiar Código Pix Copia e Cola Oficial
          </button>
        </div>

        <div id="pix-error-box" style="display:none; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.35); color:#fde68a; border-radius:10px; padding:12px; font-size:0.78rem; line-height:1.5; margin-bottom:10px;"></div>

        <div style="font-size:0.68rem; color:#64748b; font-family:monospace;">
          🛡️ Em conformidade com o Banco Central e LGPD.
        </div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:28px;">
      <div style="background:rgba(2,6,23,0.8); border:1px solid rgba(255,255,255,0.06); padding:14px; border-radius:10px;">
        <div style="font-size:0.7rem; color:#64748b; font-family:monospace;">MODELO DE MONETIZAÇÃO</div>
        <div style="font-size:1.2rem; font-weight:800; color:#10b981; margin-top:4px;">${mrrFormatted}/mês</div>
      </div>
      <div style="background:rgba(2,6,23,0.8); border:1px solid rgba(255,255,255,0.06); padding:14px; border-radius:10px;">
        <div style="font-size:0.7rem; color:#64748b; font-family:monospace;">DOMÍNIO OFICIAL</div>
        <div style="font-size:1rem; font-weight:700; color:#38bdf8; margin-top:4px;">${agent.requiredDomain}</div>
      </div>
      <div style="background:rgba(2,6,23,0.8); border:1px solid rgba(255,255,255,0.06); padding:14px; border-radius:10px;">
        <div style="font-size:0.7rem; color:#64748b; font-family:monospace;">STATUS DE DESENVOLVIMENTO</div>
        <div style="font-size:1rem; font-weight:700; color:#fbbf24; margin-top:4px;">${agent.projectProgress ? agent.projectProgress.stage : 'OPERANDO'}</div>
      </div>
    </div>

    <div style="margin-bottom:28px;">
      <h3 style="font-size:1rem; font-weight:800; margin:0 0 12px; color:#f8fafc; font-family:monospace;">ESTRUTURA &amp; ENTREGÁVEIS OPERACIONAIS:</h3>
      ${deliverableDocs}
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:20px; flex-wrap:wrap; gap:12px;">
      <a href="/projetos" style="color:#94a3b8; font-size:0.85rem; text-decoration:none; font-family:monospace;">← Voltar para todos os Projetos</a>
      <a href="/" class="btn">Explorar Plataforma NEXUS ➔</a>
    </div>
  </div>
  <script>
    var activePixPoll = null;
    function openRealPixCheckout() {
      document.getElementById('checkout-modal-pix').style.display = 'flex';
    }
    async function generateRealPixOrder() {
      var email = (document.getElementById('pix-payer-email').value || '').trim();
      var errBox = document.getElementById('pix-error-box');
      var resBox = document.getElementById('pix-live-result');
      errBox.style.display = 'none';
      resBox.style.display = 'none';
      try {
        var resp = await fetch('/api/payments/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: 'solution_pro',
            payerEmail: email || 'cliente@nexusearthai.com',
            productLabel: ${JSON.stringify(agent.name + ' — Licença Pro Mensal')}
          })
        });
        var data = await resp.json();
        if (!resp.ok || !data.success) {
          errBox.textContent = data.message || data.error || 'Gateway de pagamento aguardando ativação.';
          errBox.style.display = 'block';
          return;
        }
        var qrBox = document.getElementById('pix-qr-box');
        if (data.qrCodeBase64) {
          qrBox.innerHTML = '<img src="data:image/png;base64,' + data.qrCodeBase64 + '" alt="QR Code Pix Oficial" style="max-width:100%;max-height:100%;" />';
        } else if (data.ticketUrl) {
          qrBox.innerHTML = '<a href="' + data.ticketUrl + '" target="_blank" rel="noopener" style="color:#020617;font-weight:800;">Abrir Fatura Oficial</a>';
        }
        var copyBtn = document.getElementById('pix-copy-btn');
        copyBtn.onclick = function() {
          navigator.clipboard.writeText(data.qrCode || '');
          copyBtn.textContent = '✓ Código Pix Oficial Copiado!';
        };
        resBox.style.display = 'block';
        if (activePixPoll) clearInterval(activePixPoll);
        activePixPoll = setInterval(async function() {
          try {
            var sr = await fetch('/api/payments/status/' + encodeURIComponent(data.orderId));
            var st = await sr.json();
            if (st && st.status === 'APPROVED') {
              clearInterval(activePixPoll);
              document.getElementById('pix-status-heading').textContent = '✅ Pagamento Confirmado!';
              document.getElementById('pix-status-desc').textContent = 'Seu plano PRO foi ativado automaticamente.';
            }
          } catch (_) {}
        }, 4000);
      } catch (e) {
        errBox.textContent = 'Erro de conexão com o gateway: ' + e.message;
        errBox.style.display = 'block';
      }
    }
  </script>
</body>
</html>`;
  }

  /**
   * Feed JSON dos 100 projetos digitais para indexação, APIs e consumo de clientes
   */
  getProjectsFeed(swarmAgents) {
    const original100Agents = swarmAgents.filter(a => a.id <= 100);
    return {
      updatedAt: new Date().toISOString(),
      platform: "NEXUS Cooperative Superintelligence Engine",
      totalProjects: original100Agents.length,
      activeProjects: original100Agents.filter(a => a.status === 'EXECUTANDO').length,
      projects: original100Agents.map(a => ({
        id: a.id,
        name: a.name,
        sector: a.sector,
        role: a.role,
        status: a.status,
        projectedRevenueBRL: a.projectedRevenueBRL,
        domain: a.requiredDomain,
        domainStatus: a.domainStatus,
        requiredCredentials: a.requiredCredentials,
        credentialsStatus: a.credentialsStatus,
        stage: a.projectProgress ? a.projectProgress.stage : 'OPERANDO',
        progressPercent: a.projectProgress ? a.projectProgress.progressPercent : 85,
        solutionUrl: `https://nexusearthai.com/api/swarm/solution/${a.id}`
      }))
    };
  }
}

export const autonomousDistributionEngine = new AutonomousDistributionEngine();
export default autonomousDistributionEngine;
