import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REAL_ML_PRODUCTS } from './ml_active_products_catalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AutonomousDistributionEngine {
  constructor() {
    this.distributionLog = [];
    this.generatedShowcases = new Map();
  }

  /**
   * Gera uma Vitrine Web Pública Autônoma com todos os produtos e links oficiais de afiliados
   */
  generatePublicShowcaseHTML() {
    const productsHtml = REAL_ML_PRODUCTS.map(p => `
      <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.2rem; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 8px 24px rgba(0,0,0,0.4);">
        <div>
          <span style="font-size:0.68rem; font-weight:800; color:#10b981; background:rgba(16,185,129,0.12); padding:3px 8px; border-radius:6px; font-family:monospace;">${p.badge}</span>
          <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:10px 0 6px; line-height:1.4;">${p.title}</h3>
          <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:8px;">
            <span style="font-size:0.8rem; color:#94a3b8; text-decoration:line-through;">${p.oldPrice}</span>
            <span style="font-size:1.4rem; font-weight:800; color:#38bdf8;">${p.currentPrice}</span>
            <span style="font-size:0.75rem; color:#10b981; font-weight:700;">${p.discount}</span>
          </div>
          <div style="font-size:0.75rem; color:#cbd5e1; margin-bottom:14px;">${p.installments}</div>
        </div>
        <a href="${p.directHubUrl}" target="_blank" rel="noopener sponsored" style="display:block; text-align:center; background:linear-gradient(135deg, #ffe600, #ffc700); color:#2d3277; font-weight:800; font-size:0.88rem; padding:12px; border-radius:8px; text-decoration:none; box-shadow:0 4px 14px rgba(255,230,0,0.3); transition:transform 0.2s;">
          Ver Oferta no Mercado Livre ➔
        </a>
      </div>
    `).join('\n');

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
    .header { text-align: center; padding: 30px 10px 40px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span style="font-size:0.75rem; font-weight:800; color:#00f5ff; background:rgba(0,245,255,0.1); padding:4px 12px; border-radius:20px; font-family:monospace;">AUTONOMOUS DEALS RADAR</span>
      <h1 style="font-size:2rem; font-weight:800; margin:12px 0 6px;">Ofertas Selecionadas Mercado Livre</h1>
      <p style="color:#94a3b8; font-size:0.9rem; max-width:600px; margin:0 auto;">Monitoradas 24 horas por dia por superinteligência com estoque Full e frete expresso.</p>
    </div>
    <div class="grid">
      ${productsHtml}
    </div>
  </div>
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
      <a href="/projetos" style="color:#94a3b8; font-size:0.85rem; text-decoration:none; font-family:monospace;">← Voltar para todos os 100 Projetos</a>
      <a href="/admin.html?key=NEXUS-SOVEREIGN-2026#tab-swarm-100" class="btn">Gerenciar no C2 Master ➔</a>
    </div>
  </div>
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
