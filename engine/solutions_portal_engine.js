/**
 * engine/solutions_portal_engine.js
 *
 * CENTRAL DE SOLUÇÕES REAIS & VISUALIZAÇÃO DE RESULTADOS DAS ORDENS RECOMENDADAS
 *
 * Módulo 100% aditivo e independente que fornece:
 * - Hub Central: /solucoes (e /central-solucoes)
 * - 5 Páginas Detalhadas de Acesso para cada Solução Real:
 *     1. /solucoes/pagamentos
 *     2. /solucoes/afiliados-ml
 *     3. /solucoes/monetizacao-aura
 *     4. /solucoes/micro-saas-b2b
 *     5. /solucoes/aquisicao-trafego
 * - 3 Páginas de Visualização do Resultado Após Conclusão de Cada Ordem Recomendada:
 *     1. /resultados/ordem-1
 *     2. /resultados/ordem-2
 *     3. /resultados/ordem-3
 *
 * Privacidade & Segurança: Zero exposição de chaves administrativas, CPF, nome completo ou chaves Pix.
 */

export class SolutionsPortalEngine {
  constructor() {
    this.solutions = [
      {
        id: 'pagamentos',
        num: '01',
        path: '/solucoes/pagamentos',
        orderLink: '/resultados/ordem-1',
        orderLabel: 'Ver Resultado da Ordem 1',
        icon: '💳',
        badge: 'FUNDAÇÃO OBRIGATÓRIA • ORDEM 1',
        badgeColor: '#10b981',
        title: 'Infraestrutura Real de Pagamento & Liquidação Bancária',
        shortTitle: 'Pagamentos & Pix Real',
        subtitle: 'Substituição do checkout simulado por API oficial Mercado Pago / Asaas com QR Code EMVCo do Banco Central, cartão recorrente, webhook automático e blindagem de segurança.',
        status: 'PRONTO PARA ATIVAÇÃO',
        cost: 'R$ 0 fixo (apenas taxa por venda aprovada)',
        timeline: '1 a 2 dias'
      },
      {
        id: 'afiliados-ml',
        num: '02',
        path: '/solucoes/afiliados-ml',
        orderLink: '/resultados/ordem-2',
        orderLabel: 'Ver Resultado da Ordem 2',
        icon: '🛒',
        badge: 'RETORNO MAIS RÁPIDO • ORDEM 2',
        badgeColor: '#f59e0b',
        title: 'Máquina Real de Afiliados Mercado Livre (CASTILLOOFFICIAL)',
        shortTitle: 'Afiliados Mercado Livre',
        subtitle: 'Troca dos links quebrados de link-builder por links oficiais meli.la / /sec/, vitrine /ofertas com fotos reais e disparo automático 24/7 via Bot Telegram e WhatsApp.',
        status: 'PRONTO PARA ATIVAÇÃO',
        cost: 'R$ 0 (Bot Telegram 100% gratuito)',
        timeline: '3 a 7 dias'
      },
      {
        id: 'monetizacao-aura',
        num: '03',
        path: '/solucoes/monetizacao-aura',
        orderLink: '/resultados/ordem-3',
        orderLabel: 'Ver Resultado da Ordem 3',
        icon: '✨',
        badge: 'ATIVO JÁ ONLINE • ORDEM 3',
        badgeColor: '#00f5ff',
        title: 'Monetização Direta da AURA Live & NEXUS (Freemium / Pro)',
        shortTitle: 'Planos AURA & NEXUS',
        subtitle: 'Ativação de planos reais (Gratuito, AURA Plus R$ 29,90/mês e NEXUS Pro R$ 97,00/mês) sobre a superinteligência que já está rodando 100% online na VPS.',
        status: 'ARQUITETURA PRONTA',
        cost: 'R$ 0 adicional (usa a mesma VPS)',
        timeline: 'Semana 2'
      },
      {
        id: 'micro-saas-b2b',
        num: '04',
        path: '/solucoes/micro-saas-b2b',
        orderLink: '/resultados/ordem-3',
        orderLabel: 'Ver Resultado da Ordem 3',
        icon: '🏢',
        badge: 'ALTO TICKET RECORRENTE • ORDEM 3',
        badgeColor: '#a855f7',
        title: 'Subdomínios Gratuitos + Agentes WhatsApp B2B & Micro-SaaS',
        shortTitle: 'B2B & Micro-SaaS Reais',
        subtitle: 'Fim do gargalo de comprar 100 domínios: uso de subdomínios grátis (*.nexusearthai.com) + foco em agentes IA de atendimento WhatsApp para empresas locais (R$ 350–R$ 800/mês) e 2 micro-ferramentas reais.',
        status: 'BLUEPRINT EXECUTÁVEL',
        cost: 'R$ 0 em domínios (subdomínios inclusos)',
        timeline: 'Semanas 2 a 4'
      },
      {
        id: 'aquisicao-trafego',
        num: '05',
        path: '/solucoes/aquisicao-trafego',
        orderLink: '/resultados/ordem-2',
        orderLabel: 'Ver Resultado da Ordem 2',
        icon: '📈',
        badge: 'MOTOR DE CLIENTES • CONTÍNUO',
        badgeColor: '#38bdf8',
        title: 'Motor Real de Aquisição de Clientes & Funil de Tráfego',
        shortTitle: 'Aquisição & Tráfego',
        subtitle: 'Sistema real de geração diária de cliques e compradores via Telegram/WhatsApp VIP, vídeos curtos (Reels/TikTok/Shorts), prospecção B2B assistida por IA e SEO técnico limpo.',
        status: 'ROTEIRO OPERACIONAL',
        cost: 'R$ 0 orgânico (ads opcionais após validar)',
        timeline: 'Contínuo (diário)'
      }
    ];

    this.orders = [
      {
        id: 'ordem-1',
        num: '1',
        path: '/resultados/ordem-1',
        solutionPath: '/solucoes/pagamentos',
        title: 'Ordem 1 — Segurança Blindada & Checkout Real Ativo',
        shortTitle: 'Resultado Ordem 1',
        horizon: 'Dia 1 a 2',
        accent: '#10b981',
        summary: 'Como a plataforma, o checkout Pix/Cartão e a liquidação bancária ficam após fechar a brecha de segurança e conectar o Mercado Pago / Asaas.'
      },
      {
        id: 'ordem-2',
        num: '2',
        path: '/resultados/ordem-2',
        solutionPath: '/solucoes/afiliados-ml',
        title: 'Ordem 2 — Afiliados Mercado Livre Real + Bot Telegram 24/7',
        shortTitle: 'Resultado Ordem 2',
        horizon: 'Semana 1',
        accent: '#f59e0b',
        summary: 'Como a vitrine /ofertas, os links oficiais meli.la e o canal automático do Telegram passam a converter cliques reais em comissões diárias.'
      },
      {
        id: 'ordem-3',
        num: '3',
        path: '/resultados/ordem-3',
        solutionPath: '/solucoes/monetizacao-aura',
        title: 'Ordem 3 — Receita Recorrente AURA Pro + Clientes B2B',
        shortTitle: 'Resultado Ordem 3',
        horizon: 'Semanas 2 a 4',
        accent: '#00f5ff',
        summary: 'Como o paywall freemium da AURA Live e os contratos mensais B2B se somam às comissões do Mercado Livre para gerar saldo mensal previsível.'
      }
    ];
  }

  _escape(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _renderLayout({ title, description, activePath, bodyHtml, extraScript = '' }) {
    const navLinks = [
      { href: '/solucoes', label: '🎯 Central' },
      { href: '/solucoes/pagamentos', label: '01 Pagamentos' },
      { href: '/solucoes/afiliados-ml', label: '02 Mercado Livre' },
      { href: '/solucoes/monetizacao-aura', label: '03 AURA Pro' },
      { href: '/solucoes/micro-saas-b2b', label: '04 B2B & SaaS' },
      { href: '/solucoes/aquisicao-trafego', label: '05 Tráfego' },
      { href: '/resultados/ordem-1', label: '✅ Ordem 1' },
      { href: '/resultados/ordem-2', label: '✅ Ordem 2' },
      { href: '/resultados/ordem-3', label: '✅ Ordem 3' }
    ];

    const navHtml = navLinks.map(item => {
      const isActive = item.href === activePath;
      return `<a href="${item.href}" class="sp-pill ${isActive ? 'active' : ''}">${item.label}</a>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this._escape(title)} • NEXUS Earth AI</title>
  <meta name="description" content="${this._escape(description)}">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#030712">
  <style>
    :root {
      --bg: #030712;
      --bg-card: rgba(15, 23, 42, 0.86);
      --bg-soft: rgba(2, 6, 23, 0.78);
      --border: rgba(148, 163, 184, 0.16);
      --border-glow: rgba(0, 245, 255, 0.35);
      --cyan: #00f5ff;
      --emerald: #10b981;
      --amber: #f59e0b;
      --purple: #a855f7;
      --rose: #f43f5e;
      --blue: #38bdf8;
      --text: #f8fafc;
      --muted: #94a3b8;
      --dim: #64748b;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: radial-gradient(circle at 12% 10%, rgba(0, 245, 255, 0.08), transparent 40%),
                  radial-gradient(circle at 88% 18%, rgba(168, 85, 247, 0.08), transparent 42%),
                  var(--bg);
      color: var(--text);
      font-family: var(--sans);
      line-height: 1.55;
      min-height: 100vh;
    }
    a { color: inherit; }
    .sp-topbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(3, 7, 18, 0.92);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--border);
      padding: 10px 16px;
    }
    .sp-topbar-inner {
      max-width: 1260px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .sp-brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .sp-brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      font-weight: 900;
      letter-spacing: 0.04em;
      font-size: 1rem;
    }
    .sp-brand-tag {
      font-family: var(--mono);
      font-size: 0.66rem;
      color: var(--cyan);
      background: rgba(0, 245, 255, 0.1);
      border: 1px solid rgba(0, 245, 255, 0.3);
      padding: 2px 8px;
      border-radius: 999px;
    }
    .sp-ext-links {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .sp-ext-btn {
      font-size: 0.74rem;
      font-weight: 700;
      text-decoration: none;
      padding: 5px 11px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.04);
      color: #cbd5e1;
      transition: all 0.18s;
    }
    .sp-ext-btn:hover {
      border-color: var(--cyan);
      color: var(--cyan);
    }
    .sp-nav-scroll {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 2px;
      scrollbar-width: thin;
    }
    .sp-pill {
      flex-shrink: 0;
      text-decoration: none;
      font-family: var(--mono);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: rgba(15, 23, 42, 0.7);
      color: var(--muted);
      transition: all 0.18s;
    }
    .sp-pill:hover {
      border-color: rgba(0, 245, 255, 0.45);
      color: #fff;
    }
    .sp-pill.active {
      background: linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(16, 185, 129, 0.18));
      border-color: var(--cyan);
      color: var(--cyan);
      box-shadow: 0 0 14px rgba(0, 245, 255, 0.18);
    }
    .sp-main {
      max-width: 1260px;
      margin: 0 auto;
      padding: 28px 16px 80px;
    }
    .sp-hero {
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.96));
      border: 1px solid var(--border-glow);
      border-radius: 18px;
      padding: 28px;
      margin-bottom: 24px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
    }
    .sp-badge {
      display: inline-block;
      font-family: var(--mono);
      font-size: 0.7rem;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 999px;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .sp-hero h1 {
      margin: 0 0 10px;
      font-size: clamp(1.55rem, 3vw, 2.3rem);
      line-height: 1.2;
      font-weight: 900;
      letter-spacing: -0.02em;
    }
    .sp-hero p {
      margin: 0;
      color: #cbd5e1;
      font-size: 0.98rem;
      max-width: 880px;
    }
    .sp-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 18px;
      margin-bottom: 24px;
    }
    .sp-grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 18px;
      margin-bottom: 24px;
    }
    .sp-grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .sp-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sp-card.glow-cyan { border-color: rgba(0, 245, 255, 0.35); }
    .sp-card.glow-emerald { border-color: rgba(16, 185, 129, 0.4); }
    .sp-card.glow-amber { border-color: rgba(245, 158, 11, 0.4); }
    .sp-card.glow-purple { border-color: rgba(168, 85, 247, 0.4); }
    .sp-card.glow-rose { border-color: rgba(244, 63, 94, 0.4); }
    .sp-card h2, .sp-card h3 {
      margin: 0 0 10px;
      font-weight: 800;
      line-height: 1.3;
    }
    .sp-card p {
      margin: 0 0 12px;
      color: var(--muted);
      font-size: 0.88rem;
    }
    .sp-section-title {
      font-size: 1.25rem;
      font-weight: 900;
      margin: 28px 0 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fff;
    }
    .sp-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 0.84rem;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: transform 0.16s, opacity 0.16s;
    }
    .sp-btn:hover { transform: translateY(-1px); opacity: 0.94; }
    .sp-btn-primary { background: linear-gradient(135deg, #00f5ff, #10b981); color: #020617; }
    .sp-btn-emerald { background: linear-gradient(135deg, #10b981, #059669); color: #fff; }
    .sp-btn-amber { background: linear-gradient(135deg, #f59e0b, #d97706); color: #020617; }
    .sp-btn-purple { background: linear-gradient(135deg, #a855f7, #7c3aed); color: #fff; }
    .sp-btn-outline {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      color: #e2e8f0;
    }
    .sp-list {
      margin: 0;
      padding-left: 18px;
      color: #cbd5e1;
      font-size: 0.88rem;
    }
    .sp-list li { margin-bottom: 8px; }
    .sp-code {
      background: var(--bg-soft);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
      font-family: var(--mono);
      font-size: 0.78rem;
      color: #7dd3fc;
      overflow-x: auto;
      white-space: pre-wrap;
      line-height: 1.5;
    }
    .sp-kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin: 16px 0;
    }
    .sp-kpi {
      background: var(--bg-soft);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
    }
    .sp-kpi-label {
      font-family: var(--mono);
      font-size: 0.68rem;
      color: var(--dim);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .sp-kpi-val {
      font-family: var(--mono);
      font-size: 1.28rem;
      font-weight: 900;
      color: #fff;
    }
    .sp-table-wrap {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.84rem;
    }
    th, td {
      text-align: left;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    }
    th {
      font-family: var(--mono);
      font-size: 0.72rem;
      text-transform: uppercase;
      color: var(--cyan);
      background: rgba(2, 6, 23, 0.85);
    }
    tr:last-child td { border-bottom: none; }
    .sp-compare-before {
      background: rgba(244, 63, 94, 0.08);
      border: 1px solid rgba(244, 63, 94, 0.35);
      border-radius: 14px;
      padding: 20px;
    }
    .sp-compare-after {
      background: rgba(16, 185, 129, 0.09);
      border: 1px solid rgba(16, 185, 129, 0.42);
      border-radius: 14px;
      padding: 20px;
    }
    .sp-sim-box {
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.95));
      border: 1px solid rgba(0, 245, 255, 0.3);
      border-radius: 16px;
      padding: 22px;
      margin-bottom: 24px;
    }
    .sp-input-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin: 14px 0 18px;
    }
    .sp-field label {
      display: block;
      font-family: var(--mono);
      font-size: 0.72rem;
      color: #cbd5e1;
      margin-bottom: 6px;
    }
    .sp-field input[type="range"] {
      width: 100%;
      accent-color: #00f5ff;
    }
    .sp-field input[type="number"], .sp-field select {
      width: 100%;
      background: rgba(2, 6, 23, 0.9);
      border: 1px solid var(--border);
      color: #fff;
      padding: 9px 12px;
      border-radius: 8px;
      font-family: var(--mono);
      font-size: 0.86rem;
    }
    .sp-flow {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin: 14px 0;
    }
    .sp-flow-step {
      background: var(--bg-soft);
      border: 1px solid rgba(0, 245, 255, 0.25);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #e2e8f0;
    }
    .sp-flow-arrow {
      color: var(--cyan);
      font-weight: 900;
    }
    .sp-mock-phone {
      background: #0b1220;
      border: 2px solid rgba(0, 245, 255, 0.35);
      border-radius: 18px;
      padding: 18px;
      box-shadow: 0 14px 36px rgba(0,0,0,0.6);
    }
    .sp-footer {
      border-top: 1px solid var(--border);
      padding: 22px 16px;
      text-align: center;
      color: var(--dim);
      font-size: 0.78rem;
      font-family: var(--mono);
    }
    @media (max-width: 640px) {
      .sp-hero { padding: 18px; }
      .sp-card { padding: 16px; }
    }
  </style>
</head>
<body>
  <header class="sp-topbar">
    <div class="sp-topbar-inner">
      <div class="sp-brand-row">
        <a href="/solucoes" class="sp-brand">
          <span style="color:var(--cyan);">⚡ NEXUS</span>
          <span class="sp-brand-tag" style="color:#10b981; border-color:rgba(16,185,129,0.45); background:rgba(16,185,129,0.12);">🔒 EXCLUSIVO ADMIN C2 • PRIVADO</span>
        </a>
        <div class="sp-ext-links">
          <a href="/" target="_blank" rel="noopener" class="sp-ext-btn">🏠 Site Principal</a>
          <a href="/mobile/aura-live" target="_blank" rel="noopener" class="sp-ext-btn">🤖 App AURA Live</a>
          <a href="/ofertas" target="_blank" rel="noopener" class="sp-ext-btn">🛒 Vitrine /ofertas</a>
          <a href="/projetos" target="_blank" rel="noopener" class="sp-ext-btn">💼 /projetos</a>
        </div>
      </div>
      <nav class="sp-nav-scroll" aria-label="Navegação de Soluções e Resultados">
        ${navHtml}
      </nav>
    </div>
  </header>

  <main class="sp-main">
    ${bodyHtml}
  </main>

  <footer class="sp-footer">
    🔒 ÁREA PRIVADA EXCLUSIVA DA PROPRIETÁRIA • NEXUS Master C2 • Acesso bloqueado para o público externo
  </footer>

  <script>
    (function() {
      document.addEventListener('click', function(e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        var href = a.getAttribute('href') || '';
        if (href.startsWith('/solucoes') || href.startsWith('/resultados')) {
          if (window.parent && window.parent !== window) {
            e.preventDefault();
            window.parent.postMessage({ type: 'nexus_admin_open_solution', route: href }, '*');
          }
        }
      });
    })();
  </script>
  ${extraScript ? `<script>${extraScript}</script>` : ''}
</body>
</html>`;
  }

  // =========================================================================
  // HUB CENTRAL: /solucoes
  // =========================================================================
  renderHubPage() {
    const solutionCards = this.solutions.map(s => `
      <article class="sp-card" style="border-color: ${s.badgeColor}44;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:10px; flex-wrap:wrap;">
            <span class="sp-badge" style="margin:0; background:${s.badgeColor}20; color:${s.badgeColor}; border:1px solid ${s.badgeColor}55;">
              SOLUÇÃO ${s.num} • ${s.badge}
            </span>
            <span style="font-family:var(--mono); font-size:0.68rem; color:#cbd5e1;">⏱️ ${s.timeline}</span>
          </div>
          <h3 style="font-size:1.12rem; color:#fff;">${s.icon} ${s.title}</h3>
          <p>${s.subtitle}</p>
          <div style="background:var(--bg-soft); border:1px solid var(--border); border-radius:8px; padding:10px; font-family:var(--mono); font-size:0.74rem; margin-bottom:14px;">
            <div style="color:#94a3b8;">Custo Inicial: <strong style="color:#10b981;">${s.cost}</strong></div>
            <div style="color:#94a3b8; margin-top:4px;">Estado Técnico: <strong style="color:#00f5ff;">${s.status}</strong></div>
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <a href="${s.path}" class="sp-btn sp-btn-primary" style="flex:1;">Abrir Página da Solução ➔</a>
          <a href="${s.orderLink}" class="sp-btn sp-btn-outline">${s.orderLabel}</a>
        </div>
      </article>
    `).join('');

    const orderCards = this.orders.map(o => `
      <article class="sp-card" style="border-color:${o.accent}55;">
        <div>
          <span class="sp-badge" style="background:${o.accent}20; color:${o.accent}; border:1px solid ${o.accent}55;">
            RESULTADO ESPERADO • ORDEM ${o.num} (${o.horizon})
          </span>
          <h3 style="font-size:1.08rem; color:#fff;">${o.title}</h3>
          <p>${o.summary}</p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
          <a href="${o.path}" class="sp-btn sp-btn-emerald" style="flex:1;">Ver Como Ficará o Resultado ➔</a>
          <a href="${o.solutionPath}" class="sp-btn sp-btn-outline">Ir à Solução</a>
        </div>
      </article>
    `).join('');

    const bodyHtml = `
      <section class="sp-hero">
        <span class="sp-badge" style="background:rgba(0,245,255,0.12); color:var(--cyan); border:1px solid rgba(0,245,255,0.35);">
          PLANO MESTRE VERÍDICO • RECEITA REAL MENSAL
        </span>
        <h1>Central de Soluções Reais &amp; Resultados das Ordens Recomendadas</h1>
        <p>
          Esta central agrega todas as soluções técnicas, comerciais e operacionais necessárias para transformar a infraestrutura do <strong>NEXUS Earth AI</strong>, da <strong>AURA Live</strong> e dos <strong>Agentes do Mercado Livre</strong> em dinheiro real entrando mensalmente na sua conta — sem alterar nada do que já está funcionando.
        </p>
        <div class="sp-kpi-row">
          <div class="sp-kpi">
            <div class="sp-kpi-label">Soluções Detalhadas</div>
            <div class="sp-kpi-val" style="color:var(--cyan);">5 Páginas</div>
          </div>
          <div class="sp-kpi">
            <div class="sp-kpi-label">Resultados das Ordens</div>
            <div class="sp-kpi-val" style="color:var(--emerald);">3 Blueprints</div>
          </div>
          <div class="sp-kpi">
            <div class="sp-kpi-label">Custo de Infraestrutura Extra</div>
            <div class="sp-kpi-val" style="color:var(--amber);">R$ 0,00</div>
          </div>
          <div class="sp-kpi">
            <div class="sp-kpi-label">Privacidade &amp; Blindagem</div>
            <div class="sp-kpi-val" style="color:var(--purple);">100% LGPD</div>
          </div>
        </div>
      </section>

      <h2 class="sp-section-title">🧩 As 5 Soluções Completas (Acesso Individual Detalhado)</h2>
      <div class="sp-grid">
        ${solutionCards}
      </div>

      <h2 class="sp-section-title">🚀 Como Ficará Após a Conclusão de Cada Ordem Recomendada</h2>
      <div class="sp-grid-3">
        ${orderCards}
      </div>

      <section class="sp-sim-box">
        <span class="sp-badge" style="background:rgba(16,185,129,0.15); color:var(--emerald); border:1px solid rgba(16,185,129,0.4);">
          SIMULADOR TRANSPARENTE DE RECEITA REAL (SEM PROJEÇÕES INFLADAS)
        </span>
        <h2 style="margin:0 0 6px;">Quanto Pode Entrar de Verdade na Sua Conta por Mês?</h2>
        <p style="margin:0 0 12px; color:var(--muted); font-size:0.88rem;">
          Ajuste metas realistas e alcançáveis para ver o somatório real líquido das 3 fontes de entrada da sua plataforma:
        </p>
        <div class="sp-input-grid">
          <div class="sp-field">
            <label>Afiliados ML — Cliques Qualificados/mês: <strong id="hub-ml-clicks-val" style="color:var(--amber);">2.500</strong></label>
            <input type="range" id="hub-ml-clicks" min="200" max="20000" step="100" value="2500">
          </div>
          <div class="sp-field">
            <label>Assinantes AURA Plus (R$ 29,90/mês): <strong id="hub-aura-plus-val" style="color:var(--cyan);">40</strong></label>
            <input type="range" id="hub-aura-plus" min="0" max="500" step="5" value="40">
          </div>
          <div class="sp-field">
            <label>Assinantes NEXUS Pro (R$ 97/mês): <strong id="hub-nexus-pro-val" style="color:var(--blue);">10</strong></label>
            <input type="range" id="hub-nexus-pro" min="0" max="150" step="1" value="10">
          </div>
          <div class="sp-field">
            <label>Empresas B2B WhatsApp IA (R$ 497/mês): <strong id="hub-b2b-val" style="color:var(--purple);">4</strong></label>
            <input type="range" id="hub-b2b" min="0" max="30" step="1" value="4">
          </div>
        </div>
        <div class="sp-kpi-row">
          <div class="sp-kpi">
            <div class="sp-kpi-label">Comissões Mercado Livre (3% conv. / R$ 220 / 8%)</div>
            <div class="sp-kpi-val" id="hub-out-ml" style="color:var(--amber);">R$ 1.320,00</div>
          </div>
          <div class="sp-kpi">
            <div class="sp-kpi-label">Assinaturas AURA + NEXUS (líquido ~95%)</div>
            <div class="sp-kpi-val" id="hub-out-saas" style="color:var(--cyan);">R$ 2.057,70</div>
          </div>
          <div class="sp-kpi">
            <div class="sp-kpi-label">Contratos B2B WhatsApp IA (líquido ~98%)</div>
            <div class="sp-kpi-val" id="hub-out-b2b" style="color:var(--purple);">R$ 1.948,24</div>
          </div>
          <div class="sp-kpi" style="border-color:var(--emerald); background:rgba(16,185,129,0.1);">
            <div class="sp-kpi-label" style="color:var(--emerald);">TOTAL REAL ESTIMADO / MÊS</div>
            <div class="sp-kpi-val" id="hub-out-total" style="color:var(--emerald);">R$ 5.325,94</div>
          </div>
        </div>
      </section>
    `;

    const extraScript = `
      (function() {
        const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const ids = ['hub-ml-clicks', 'hub-aura-plus', 'hub-nexus-pro', 'hub-b2b'];
        function recalc() {
          const clicks = Number(document.getElementById('hub-ml-clicks').value);
          const plus = Number(document.getElementById('hub-aura-plus').value);
          const pro = Number(document.getElementById('hub-nexus-pro').value);
          const b2b = Number(document.getElementById('hub-b2b').value);

          document.getElementById('hub-ml-clicks-val').textContent = clicks.toLocaleString('pt-BR');
          document.getElementById('hub-aura-plus-val').textContent = plus;
          document.getElementById('hub-nexus-pro-val').textContent = pro;
          document.getElementById('hub-b2b-val').textContent = b2b;

          const mlRev = clicks * 0.03 * 220 * 0.08;
          const saasRev = (plus * 29.90 + pro * 97.00) * 0.95;
          const b2bRev = (b2b * 497.00) * 0.98;
          const total = mlRev + saasRev + b2bRev;

          document.getElementById('hub-out-ml').textContent = fmt(mlRev);
          document.getElementById('hub-out-saas').textContent = fmt(saasRev);
          document.getElementById('hub-out-b2b').textContent = fmt(b2bRev);
          document.getElementById('hub-out-total').textContent = fmt(total);
        }
        ids.forEach(id => document.getElementById(id).addEventListener('input', recalc));
        recalc();
      })();
    `;

    return this._renderLayout({
      title: 'Central de Soluções Reais & Resultados das Ordens',
      description: 'Hub completo das 5 soluções reais de monetização e das 3 páginas de resultados esperados da plataforma NEXUS Earth AI.',
      activePath: '/solucoes',
      bodyHtml,
      extraScript
    });
  }

  // =========================================================================
  // SOLUÇÃO 1: /solucoes/pagamentos
  // =========================================================================
  renderSolutionPagamentos() {
    const bodyHtml = `
      <section class="sp-hero">
        <span class="sp-badge" style="background:rgba(16,185,129,0.16); color:var(--emerald); border:1px solid rgba(16,185,129,0.4);">
          SOLUÇÃO 01 • FUNDAÇÃO FINANCEIRA &amp; SEGURANÇA (ORDEM 1)
        </span>
        <h1>💳 Infraestrutura Real de Pagamento, Pix Oficial &amp; Blindagem</h1>
        <p>
          Solução completa para substituir o QR Code simulado das soluções por um <strong>Gateway Oficial de Pagamentos (Mercado Pago ou Asaas)</strong> com geração de BR Code EMVCo validado pelo Banco Central, baixa automática via Webhook e blindagem total do painel administrativo.
        </p>
      </section>

      <div class="sp-grid-2">
        <div class="sp-compare-before">
          <h3 style="color:var(--rose);">⚠️ Diagnóstico Atual no Código</h3>
          <ul class="sp-list">
            <li><strong>QR Code não pagável:</strong> Em <code>autonomous_distribution_engine.js</code>, o QR Code aponta para uma URL fictícia em vez de um payload Pix EMVCo do Banco Central.</li>
            <li><strong>Pix Copia e Cola fictício:</strong> Usa a chave falsa <code>nexus-sovereign-pay-proxy-verified</code> e CRC16 inválido (<code>E1F2</code>) — todo banco recusa o pagamento.</li>
            <li><strong>Sem Webhook de confirmação:</strong> O servidor não recebe aviso automático do banco quando o cliente paga, impedindo a liberação instantânea de acesso.</li>
            <li><strong>Exposição de link administrativo:</strong> A página pública <code>/api/swarm/solution/:id</code> possui um botão com a chave de admin na URL que deve ser removido na Ordem 1.</li>
          </ul>
        </div>
        <div class="sp-compare-after">
          <h3 style="color:var(--emerald);">✅ Arquitetura da Solução Real</h3>
          <ul class="sp-list">
            <li><strong>API Oficial Mercado Pago ou Asaas:</strong> Gera QR Code Pix dinâmico real com código de transação único e vencimento automático.</li>
            <li><strong>Cartão de Crédito Recorrente:</strong> Permite cobrança mensal automática (assinaturas AURA Plus, NEXUS Pro e planos B2B).</li>
            <li><strong>Webhook Seguro (<code>POST /api/payments/webhook</code>):</strong> Em 2 segundos após o pagamento, valida a assinatura HMAC e atualiza o usuário para <code>PRO</code> em <code>auth_identity.js</code>.</li>
            <li><strong>Blindagem Total:</strong> Zero exposição de chave admin em HTML público e zero exposição de CPF/nome pessoal no checkout.</li>
          </ul>
        </div>
      </div>

      <div class="sp-card glow-cyan" style="margin-bottom:24px;">
        <h3>🔄 Fluxo Técnico Real do Dinheiro Até a Sua Conta</h3>
        <div class="sp-flow">
          <div class="sp-flow-step">1. Cliente escolhe plano no NEXUS</div>
          <span class="sp-flow-arrow">➔</span>
          <div class="sp-flow-step">2. <code>POST /api/payments/create</code></div>
          <span class="sp-flow-arrow">➔</span>
          <div class="sp-flow-step">3. API Mercado Pago / Asaas gera Pix oficial</div>
          <span class="sp-flow-arrow">➔</span>
          <div class="sp-flow-step">4. Cliente paga no banco</div>
          <span class="sp-flow-arrow">➔</span>
          <div class="sp-flow-step">5. Webhook confirma &amp; ativa plano PRO</div>
          <span class="sp-flow-arrow">➔</span>
          <div class="sp-flow-step" style="border-color:var(--emerald); color:var(--emerald);">6. Saldo cai na conta / Pix para PicPay</div>
        </div>
      </div>

      <div class="sp-grid-2">
        <div class="sp-card">
          <h3>📋 O Que Você Precisa Fornecer (Passo a Passo)</h3>
          <ol class="sp-list">
            <li>Acessar <strong>Mercado Pago Developers</strong> (<code>mercadopago.com.br/developers</code>) ou <strong>Asaas</strong> (<code>asaas.com</code>) com sua conta.</li>
            <li>Criar uma aplicação chamada <strong>NEXUS Earth AI</strong> e copiar o <strong>Access Token de Produção</strong>.</li>
            <li>Configurar a URL do Webhook no painel do gateway apontando para: <code>https://nexusearthai.com/api/payments/webhook</code>.</li>
            <li>Salvar a chave de forma segura no arquivo <code>.env</code> da VPS Hostinger (nunca no código público).</li>
          </ol>
        </div>
        <div class="sp-card">
          <h3>🧮 Simulador de Taxas e Valor Líquido na Conta</h3>
          <div class="sp-input-grid" style="margin:8px 0 12px;">
            <div class="sp-field">
              <label>Valor da Cobrança (R$)</label>
              <input type="number" id="pay-amount" value="149" min="10" max="10000">
            </div>
            <div class="sp-field">
              <label>Meio &amp; Gateway</label>
              <select id="pay-method">
                <option value="mp_pix">Mercado Pago — Pix (0,99%)</option>
                <option value="asaas_pix">Asaas — Pix (R$ 0,99 fixo)</option>
                <option value="mp_card">Mercado Pago — Cartão (4,98%)</option>
              </select>
            </div>
          </div>
          <div class="sp-kpi-row" style="margin:0;">
            <div class="sp-kpi">
              <div class="sp-kpi-label">Taxa do Gateway</div>
              <div class="sp-kpi-val" id="pay-fee" style="color:var(--amber);">R$ 1,48</div>
            </div>
            <div class="sp-kpi" style="border-color:var(--emerald);">
              <div class="sp-kpi-label">Líquido na Sua Conta</div>
              <div class="sp-kpi-val" id="pay-net" style="color:var(--emerald);">R$ 147,52</div>
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <a href="/resultados/ordem-1" class="sp-btn sp-btn-emerald">✅ Ver Resultado Após Conclusão da Ordem 1 ➔</a>
        <a href="/solucoes/afiliados-ml" class="sp-btn sp-btn-outline">Próxima Solução: 02 Afiliados Mercado Livre ➔</a>
        <a href="/solucoes" class="sp-btn sp-btn-outline">← Voltar à Central</a>
      </div>
    `;

    const extraScript = `
      (function() {
        const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        function calc() {
          const amount = Math.max(0, Number(document.getElementById('pay-amount').value || 0));
          const method = document.getElementById('pay-method').value;
          let fee = 0;
          if (method === 'mp_pix') fee = amount * 0.0099;
          else if (method === 'asaas_pix') fee = amount > 0 ? 0.99 : 0;
          else if (method === 'mp_card') fee = amount * 0.0498;
          document.getElementById('pay-fee').textContent = fmt(fee);
          document.getElementById('pay-net').textContent = fmt(Math.max(0, amount - fee));
        }
        document.getElementById('pay-amount').addEventListener('input', calc);
        document.getElementById('pay-method').addEventListener('change', calc);
        calc();
      })();
    `;

    return this._renderLayout({
      title: 'Solução 01 — Pagamentos Reais & Liquidação Bancária',
      description: 'Arquitetura detalhada de integração Mercado Pago / Asaas com Pix EMVCo oficial, Webhook automático e blindagem de segurança.',
      activePath: '/solucoes/pagamentos',
      bodyHtml,
      extraScript
    });
  }

  // =========================================================================
  // SOLUÇÃO 2: /solucoes/afiliados-ml
  // =========================================================================
  renderSolutionAfiliadosML() {
    const bodyHtml = `
      <section class="sp-hero">
        <span class="sp-badge" style="background:rgba(245,158,11,0.18); color:var(--amber); border:1px solid rgba(245,158,11,0.45);">
          SOLUÇÃO 02 • RETORNO MAIS RÁPIDO &amp; CUSTO ZERO (ORDEM 2)
        </span>
        <h1>🛒 Máquina Real de Afiliados Mercado Livre (CASTILLOOFFICIAL)</h1>
        <p>
          Solução técnica e operacional completa para corrigir os links quebrados da vitrine <code>/ofertas</code>, integrar o catálogo real de produtos de alta comissão (<strong>10% a 16% em Ganhos Extras</strong>) e ligar a distribuição automática 24/7 no Telegram e WhatsApp.
        </p>
      </section>

      <div class="sp-grid-2">
        <div class="sp-compare-before">
          <h3 style="color:var(--rose);">⚠️ Por Que O Painel ML Marcou 13 Cliques e R$ 0</h3>
          <ul class="sp-list">
            <li><strong>Link errado em <code>ml_active_products_catalog.js</code>:</strong> Os botões apontam para <code>/afiliados/link-builder?url=...</code>, que é a página interna de login do afiliado — o comprador não consegue concluir a compra.</li>
            <li><strong>Vitrine sem foto real:</strong> Compradores precisam ver a imagem real do produto e o desconto para confiar e clicar.</li>
            <li><strong>Zero tráfego recorrente:</strong> Sem canal no Telegram/WhatsApp ou vídeos curtos alimentando cliques diários, o volume fica preso em poucos cliques de teste.</li>
          </ul>
        </div>
        <div class="sp-compare-after">
          <h3 style="color:var(--emerald);">✅ Como a Máquina Vai Funcionar de Verdade</h3>
          <ul class="sp-list">
            <li><strong>Links Oficiais <code>meli.la</code> / <code>/sec/</code>:</strong> Gerados direto no Hub <code>CASTILLOOFFICIAL</code>, abrindo o app do Mercado Livre já com seu cookie de comissão ativo.</li>
            <li><strong>Painel Rápido de Cadastro no Admin:</strong> Você cola o link oficial, preço e imagem em 5 segundos — a vitrine <code>/ofertas</code> e o feed JSON atualizam na hora.</li>
            <li><strong>Bot Oficial do Telegram (R$ 0):</strong> O servidor NEXUS dispara automaticamente de 8 a 15 ofertas reais por dia nos horários de maior compra (11h, 15h, 19h e 21h).</li>
          </ul>
        </div>
      </div>

      <section class="sp-sim-box">
        <h3 style="margin:0 0 8px;">📊 Simulador Real de Comissões do Mercado Livre</h3>
        <div class="sp-input-grid">
          <div class="sp-field">
            <label>Cliques Reais/Mês: <strong id="ml-c-val" style="color:var(--amber);">3.000</strong></label>
            <input type="range" id="ml-c" min="100" max="30000" step="100" value="3000">
          </div>
          <div class="sp-field">
            <label>Taxa de Conversão (%): <strong id="ml-conv-val" style="color:var(--cyan);">3.0%</strong></label>
            <input type="range" id="ml-conv" min="1" max="8" step="0.5" value="3">
          </div>
          <div class="sp-field">
            <label>Ticket Médio dos Produtos (R$): <strong id="ml-t-val" style="color:var(--emerald);">R$ 240</strong></label>
            <input type="range" id="ml-t" min="60" max="1500" step="20" value="240">
          </div>
          <div class="sp-field">
            <label>Comissão Média (%): <strong id="ml-r-val" style="color:var(--purple);">9%</strong></label>
            <input type="range" id="ml-r" min="4" max="16" step="1" value="9">
          </div>
        </div>
        <div class="sp-kpi-row" style="margin:0;">
          <div class="sp-kpi">
            <div class="sp-kpi-label">Vendas Estimadas/Mês</div>
            <div class="sp-kpi-val" id="ml-out-sales" style="color:var(--cyan);">90 vendas</div>
          </div>
          <div class="sp-kpi">
            <div class="sp-kpi-label">Volume Vendido no ML</div>
            <div class="sp-kpi-val" id="ml-out-gmv" style="color:#fff;">R$ 21.600,00</div>
          </div>
          <div class="sp-kpi" style="border-color:var(--amber);">
            <div class="sp-kpi-label" style="color:var(--amber);">Sua Comissão Mensal (Mercado Pago)</div>
            <div class="sp-kpi-val" id="ml-out-comm" style="color:var(--amber);">R$ 1.944,00</div>
          </div>
        </div>
      </section>

      <div class="sp-card" style="margin-bottom:24px;">
        <h3>⚙️ Passo a Passo para Ligar o Bot do Telegram em 5 Minutos</h3>
        <ol class="sp-list">
          <li>Abra o Telegram, procure <code>@BotFather</code>, digite <code>/newbot</code> e copie o <strong>Token da API</strong>.</li>
          <li>Crie um Canal Público (ex: <em>Achadinhos VIP Oficial</em>) e adicione o seu Bot como Administrador com permissão de postar mensagens.</li>
          <li>No Hub do Mercado Livre (<code>CASTILLOOFFICIAL</code>), gere 20 links reais <code>meli.la</code> dos produtos com selo <strong>Ganhos Extras (12%)</strong> e <strong>FULL</strong>.</li>
          <li>Nós conectamos o Token + os 20 links no NEXUS e o servidor passa a publicar automaticamente todos os dias.</li>
        </ol>
      </div>

      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <a href="/resultados/ordem-2" class="sp-btn sp-btn-amber">✅ Ver Resultado Após Conclusão da Ordem 2 ➔</a>
        <a href="/ofertas" class="sp-btn sp-btn-outline">🛒 Abrir Vitrine Atual (/ofertas)</a>
        <a href="/solucoes/monetizacao-aura" class="sp-btn sp-btn-outline">Próxima Solução: 03 AURA Pro ➔</a>
      </div>
    `;

    const extraScript = `
      (function() {
        const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        function calc() {
          const clicks = Number(document.getElementById('ml-c').value);
          const conv = Number(document.getElementById('ml-conv').value);
          const ticket = Number(document.getElementById('ml-t').value);
          const rate = Number(document.getElementById('ml-r').value);

          document.getElementById('ml-c-val').textContent = clicks.toLocaleString('pt-BR');
          document.getElementById('ml-conv-val').textContent = conv.toFixed(1) + '%';
          document.getElementById('ml-t-val').textContent = 'R$ ' + ticket;
          document.getElementById('ml-r-val').textContent = rate + '%';

          const sales = Math.round(clicks * (conv / 100));
          const gmv = sales * ticket;
          const comm = gmv * (rate / 100);

          document.getElementById('ml-out-sales').textContent = sales + ' vendas';
          document.getElementById('ml-out-gmv').textContent = fmt(gmv);
          document.getElementById('ml-out-comm').textContent = fmt(comm);
        }
        ['ml-c','ml-conv','ml-t','ml-r'].forEach(id => document.getElementById(id).addEventListener('input', calc));
        calc();
      })();
    `;

    return this._renderLayout({
      title: 'Solução 02 — Máquina Real de Afiliados Mercado Livre',
      description: 'Plano técnico para links reais meli.la, vitrine /ofertas otimizada e automação gratuita no Telegram e WhatsApp.',
      activePath: '/solucoes/afiliados-ml',
      bodyHtml,
      extraScript
    });
  }

  // =========================================================================
  // SOLUÇÃO 3: /solucoes/monetizacao-aura
  // =========================================================================
  renderSolutionMonetizacaoAura() {
    const bodyHtml = `
      <section class="sp-hero">
        <span class="sp-badge" style="background:rgba(0,245,255,0.14); color:var(--cyan); border:1px solid rgba(0,245,255,0.4);">
          SOLUÇÃO 03 • ATIVO PROPRIETÁRIO JÁ ONLINE (ORDEM 3)
        </span>
        <h1>✨ Monetização Direta da AURA Live &amp; Plataforma NEXUS</h1>
        <p>
          Você já possui um produto real, funcional e diferenciado rodando 24/7 em <code>nexusearthai.com</code>: a <strong>AURA Live</strong> (voz natural, empatia ativa, modo TEA, 11 idiomas, agenda <code>.ics</code>, planilhas <code>.csv</code> e pesquisa real). Esta solução transforma esse ativo em assinaturas mensais recorrentes.
        </p>
      </section>

      <div class="sp-grid-3">
        <div class="sp-card">
          <div>
            <span class="sp-badge" style="background:rgba(148,163,184,0.15); color:#cbd5e1;">PLANO GRATUITO</span>
            <h3 style="color:#fff;">R$ 0<span style="font-size:0.8rem; color:var(--muted);">/mês</span></h3>
            <p>Porta de entrada para atrair milhares de usuários via redes sociais e Google.</p>
            <ul class="sp-list">
              <li>10 mensagens/dia com a AURA</li>
              <li>Voz neural básica e modo texto</li>
              <li>Acesso público ao GraphRAG básico</li>
              <li>Gatilho suave de upgrade ao atingir o limite</li>
            </ul>
          </div>
        </div>
        <div class="sp-card glow-cyan">
          <div>
            <span class="sp-badge" style="background:rgba(0,245,255,0.15); color:var(--cyan); border:1px solid rgba(0,245,255,0.35);">MAIS POPULAR • AURA PLUS</span>
            <h3 style="color:var(--cyan);">R$ 29,90<span style="font-size:0.8rem; color:var(--muted);">/mês</span></h3>
            <p>Para pessoas, famílias, estudantes e apoio inclusivo TEA no dia a dia.</p>
            <ul class="sp-list">
              <li>Conversas ilimitadas por voz e texto (11 idiomas)</li>
              <li>Memória vetorial privada de longo prazo</li>
              <li>Criação ilimitada de agendas (.ics) e planilhas (.csv)</li>
              <li>Modo Inclusivo TEA &amp; Acolhimento contínuo</li>
            </ul>
          </div>
        </div>
        <div class="sp-card glow-purple">
          <div>
            <span class="sp-badge" style="background:rgba(168,85,247,0.15); color:var(--purple); border:1px solid rgba(168,85,247,0.4);">PROFISSIONAL • NEXUS PRO</span>
            <h3 style="color:var(--purple);">R$ 97,00<span style="font-size:0.8rem; color:var(--muted);">/mês</span></h3>
            <p>Para profissionais liberais, pesquisadores, criadores e pequenas empresas.</p>
            <ul class="sp-list">
              <li>Tudo do AURA Plus + Colmeia Multi-Agente DAG</li>
              <li>Pesquisa Científica profunda + GraphRAG Vetorial</li>
              <li>Estúdio Multimodal (slides, relatórios e código)</li>
              <li>Exportação comercial prioritária</li>
            </ul>
          </div>
        </div>
      </div>

      <section class="sp-sim-box">
        <h3 style="margin:0 0 8px;">💰 Simulador de Assinaturas Recorrentes (com Margem Real após Custo de IA)</h3>
        <div class="sp-input-grid">
          <div class="sp-field">
            <label>Assinantes AURA Plus (R$ 29,90): <strong id="au-p-val" style="color:var(--cyan);">80</strong></label>
            <input type="range" id="au-p" min="0" max="1000" step="10" value="80">
          </div>
          <div class="sp-field">
            <label>Assinantes NEXUS Pro (R$ 97,00): <strong id="au-pro-val" style="color:var(--purple);">25</strong></label>
            <input type="range" id="au-pro" min="0" max="300" step="5" value="25">
          </div>
        </div>
        <div class="sp-kpi-row" style="margin:0;">
          <div class="sp-kpi">
            <div class="sp-kpi-label">Faturamento Bruto Mensal</div>
            <div class="sp-kpi-val" id="au-gross" style="color:#fff;">R$ 4.817,00</div>
          </div>
          <div class="sp-kpi">
            <div class="sp-kpi-label">Taxas Gateway + Custo API (~14%)</div>
            <div class="sp-kpi-val" id="au-cost" style="color:var(--amber);">R$ 674,38</div>
          </div>
          <div class="sp-kpi" style="border-color:var(--emerald);">
            <div class="sp-kpi-label" style="color:var(--emerald);">Lucro Líquido Recorrente / Mês</div>
            <div class="sp-kpi-val" id="au-net" style="color:var(--emerald);">R$ 4.142,62</div>
          </div>
        </div>
      </section>

      <div class="sp-card" style="margin-bottom:24px;">
        <h3>🔧 Arquitetura Técnica do Paywall (Sem Quebrar Nada Existente)</h3>
        <div class="sp-code">1. Tabela de plano do usuário em engine/auth_identity.js → { plan: 'FREE' | 'PLUS' | 'PRO', dailyQuotaUsed: 0, expiresAt }
2. Middleware leve em server.js nas rotas /api/agents/converse e /api/companion:
   • Se usuário for Criador/Admin → acesso 100% ilimitado sempre.
   • Se FREE e dailyQuotaUsed &gt;= 10 → retorna { upgradeRequired: true, checkoutUrl } e abre modal Pix/Cartão real.
3. Webhook do Mercado Pago / Asaas confirma pagamento → altera plan para 'PLUS' ou 'PRO' por 30 dias automaticamente.</div>
      </div>

      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <a href="/resultados/ordem-3" class="sp-btn sp-btn-primary">✅ Ver Resultado Após Conclusão da Ordem 3 ➔</a>
        <a href="/mobile/aura-live" class="sp-btn sp-btn-outline">🤖 Testar AURA Live Agora</a>
        <a href="/solucoes/micro-saas-b2b" class="sp-btn sp-btn-outline">Próxima Solução: 04 B2B &amp; Micro-SaaS ➔</a>
      </div>
    `;

    const extraScript = `
      (function() {
        const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        function calc() {
          const p = Number(document.getElementById('au-p').value);
          const pro = Number(document.getElementById('au-pro').value);
          document.getElementById('au-p-val').textContent = p;
          document.getElementById('au-pro-val').textContent = pro;
          const gross = p * 29.90 + pro * 97.00;
          const cost = gross * 0.14;
          const net = gross - cost;
          document.getElementById('au-gross').textContent = fmt(gross);
          document.getElementById('au-cost').textContent = fmt(cost);
          document.getElementById('au-net').textContent = fmt(net);
        }
        document.getElementById('au-p').addEventListener('input', calc);
        document.getElementById('au-pro').addEventListener('input', calc);
        calc();
      })();
    `;

    return this._renderLayout({
      title: 'Solução 03 — Monetização Direta da AURA Live & NEXUS',
      description: 'Estrutura de planos Freemium, AURA Plus e NEXUS Pro com paywall real e simulador de margem líquida.',
      activePath: '/solucoes/monetizacao-aura',
      bodyHtml,
      extraScript
    });
  }

  // =========================================================================
  // SOLUÇÃO 4: /solucoes/micro-saas-b2b
  // =========================================================================
  renderSolutionMicroSaasB2B() {
    const bodyHtml = `
      <section class="sp-hero">
        <span class="sp-badge" style="background:rgba(168,85,247,0.18); color:var(--purple); border:1px solid rgba(168,85,247,0.45);">
          SOLUÇÃO 04 • ALTO TICKET &amp; ZERO DESPERDÍCIO DE DOMÍNIOS (ORDEM 3)
        </span>
        <h1>🏢 Subdomínios Gratuitos + Agentes WhatsApp B2B &amp; Micro-SaaS Reais</h1>
        <p>
          Substitua o custo inviável de comprar 100 domínios (~R$ 5.000/ano) por <strong>subdomínios gratuitos ilimitados</strong> do seu domínio <code>nexusearthai.com</code> e concentre o poder de fogo em <strong>serviços B2B de alto retorno mensal</strong> + 2 micro-ferramentas 100% funcionais.
        </p>
      </section>

      <div class="sp-grid-2">
        <div class="sp-card glow-purple">
          <h3>🏥 Modelo B2B #1 — Agente IA de Atendimento WhatsApp 24/7</h3>
          <p>Empresas locais perdem vendas todos os dias porque demoram para responder clientes no WhatsApp. Você já tem o cérebro pronto no NEXUS (<code>agent_memory.js</code> + <code>tasks.js</code>).</p>
          <ul class="sp-list">
            <li><strong>Nichos que mais pagam:</strong> Clínicas Odontológicas, Estética, Imobiliárias, Advocacia, Oficinas e Delivery.</li>
            <li><strong>Infraestrutura na VPS:</strong> Evolution API (open-source, R$ 0) conectada ao motor LLM do NEXUS.</li>
            <li><strong>Preço real de mercado:</strong> R$ 500 a R$ 1.200 de implantação + <strong>R$ 350 a R$ 800/mês por empresa</strong>.</li>
            <li><strong>Meta viável:</strong> Apenas 8 empresas locais já geram de R$ 3.200 a R$ 6.400/mês recorrentes.</li>
          </ul>
        </div>
        <div class="sp-card glow-cyan">
          <h3>🧰 Modelo #2 — 2 Micro-Ferramentas Reais (Subdomínio R$ 0)</h3>
          <p>Em vez de 100 páginas estáticas sem software atrás, transforme os 2 melhores conceitos do enxame em <strong>aplicativos reais utilizáveis na hora</strong>:</p>
          <ul class="sp-list">
            <li><strong><code>propostas.nexusearthai.com</code>:</strong> Gerador de Propostas Comerciais e Contratos em PDF com IA (R$ 19,90 por pacote via Pix ou R$ 49/mês).</li>
            <li><strong><code>planilhas.nexusearthai.com</code>:</strong> Gerador Automático de Planilhas Financeiras e Fluxo de Caixa em Excel/CSV por voz ou texto (usando o gerador que a AURA já possui!).</li>
            <li><strong>Economia imediata:</strong> R$ 0 em compra de domínios adicionais (DNS configurado grátis na Hostinger).</li>
          </ul>
        </div>
      </div>

      <section class="sp-sim-box">
        <h3 style="margin:0 0 8px;">🏢 Simulador de Receita B2B (Empresas Locais + Implantação)</h3>
        <div class="sp-input-grid">
          <div class="sp-field">
            <label>Clientes B2B Ativos: <strong id="b2b-c-val" style="color:var(--purple);">6 empresas</strong></label>
            <input type="range" id="b2b-c" min="1" max="30" step="1" value="6">
          </div>
          <div class="sp-field">
            <label>Mensalidade por Empresa: <strong id="b2b-m-val" style="color:var(--cyan);">R$ 500</strong></label>
            <input type="range" id="b2b-m" min="250" max="1500" step="50" value="500">
          </div>
          <div class="sp-field">
            <label>Novas Implantações no Mês (Setup R$ 700): <strong id="b2b-s-val" style="color:var(--emerald);">2</strong></label>
            <input type="range" id="b2b-s" min="0" max="10" step="1" value="2">
          </div>
        </div>
        <div class="sp-kpi-row" style="margin:0;">
          <div class="sp-kpi">
            <div class="sp-kpi-label">Recorrência Mensal (MRR)</div>
            <div class="sp-kpi-val" id="b2b-mrr" style="color:var(--purple);">R$ 3.000,00</div>
          </div>
          <div class="sp-kpi">
            <div class="sp-kpi-label">Receita de Implantações</div>
            <div class="sp-kpi-val" id="b2b-setup" style="color:var(--cyan);">R$ 1.400,00</div>
          </div>
          <div class="sp-kpi" style="border-color:var(--emerald);">
            <div class="sp-kpi-label" style="color:var(--emerald);">Entrada Total no Mês</div>
            <div class="sp-kpi-val" id="b2b-total" style="color:var(--emerald);">R$ 4.400,00</div>
          </div>
        </div>
      </section>

      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <a href="/resultados/ordem-3" class="sp-btn sp-btn-purple">✅ Ver Resultado Após Conclusão da Ordem 3 ➔</a>
        <a href="/projetos" class="sp-btn sp-btn-outline">💼 Ver Portfólio /projetos</a>
        <a href="/solucoes/aquisicao-trafego" class="sp-btn sp-btn-outline">Próxima Solução: 05 Tráfego &amp; Aquisição ➔</a>
      </div>
    `;

    const extraScript = `
      (function() {
        const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        function calc() {
          const c = Number(document.getElementById('b2b-c').value);
          const m = Number(document.getElementById('b2b-m').value);
          const s = Number(document.getElementById('b2b-s').value);
          document.getElementById('b2b-c-val').textContent = c + (c === 1 ? ' empresa' : ' empresas');
          document.getElementById('b2b-m-val').textContent = 'R$ ' + m;
          document.getElementById('b2b-s-val').textContent = s;
          const mrr = c * m;
          const setup = s * 700;
          document.getElementById('b2b-mrr').textContent = fmt(mrr);
          document.getElementById('b2b-setup').textContent = fmt(setup);
          document.getElementById('b2b-total').textContent = fmt(mrr + setup);
        }
        ['b2b-c','b2b-m','b2b-s'].forEach(id => document.getElementById(id).addEventListener('input', calc));
        calc();
      })();
    `;

    return this._renderLayout({
      title: 'Solução 04 — Subdomínios Gratuitos, B2B & Micro-SaaS Reais',
      description: 'Como substituir 100 domínios pagos por subdomínios gratuitos e gerar receita B2B real com agentes WhatsApp IA.',
      activePath: '/solucoes/micro-saas-b2b',
      bodyHtml,
      extraScript
    });
  }

  // =========================================================================
  // SOLUÇÃO 5: /solucoes/aquisicao-trafego
  // =========================================================================
  renderSolutionAquisicaoTrafego() {
    const bodyHtml = `
      <section class="sp-hero">
        <span class="sp-badge" style="background:rgba(56,189,248,0.16); color:var(--blue); border:1px solid rgba(56,189,248,0.4);">
          SOLUÇÃO 05 • COMBUSTÍVEL DIÁRIO DO NEGÓCIO
        </span>
        <h1>📈 Motor Real de Aquisição de Clientes &amp; Funil de Tráfego</h1>
        <p>
          Tecnologia sem audiência não converte. Esta página detalha os <strong>4 canais práticos de aquisição de tráfego real</strong> com custo inicial zero, usando os próprios agentes da plataforma NEXUS para multiplicar sua produtividade diária.
        </p>
      </section>

      <div class="sp-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Canal de Aquisição</th>
              <th>Produto Foco</th>
              <th>Papel dos Agentes NEXUS</th>
              <th>Rotina Diária</th>
              <th>Custo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1. Telegram + WhatsApp VIP</strong></td>
              <td>Afiliados Mercado Livre</td>
              <td>Disparo 100% automático de 8 a 15 ofertas reais <code>meli.la</code> com copy de urgência</td>
              <td>Automático 24/7</td>
              <td style="color:var(--emerald); font-weight:700;">R$ 0</td>
            </tr>
            <tr>
              <td><strong>2. Reels, TikTok &amp; Shorts</strong></td>
              <td>AURA Live + Ofertas ML</td>
              <td>Gera 3 roteiros virais/dia (15–30s), ganchos iniciais e legendas com CTA para link na bio</td>
              <td>30 min/dia</td>
              <td style="color:var(--emerald); font-weight:700;">R$ 0</td>
            </tr>
            <tr>
              <td><strong>3. Prospecção B2B Direta</strong></td>
              <td>Agentes WhatsApp Empresas</td>
              <td>Pesquisa clínicas/escritórios locais e gera diagnóstico personalizado pronto para envio</td>
              <td>10 contatos/dia</td>
              <td style="color:var(--emerald); font-weight:700;">R$ 0</td>
            </tr>
            <tr>
              <td><strong>4. SEO Técnico Real no Google</strong></td>
              <td>AURA Pro + Guias de Compra</td>
              <td>Cria reviews comparativos reais e guias úteis (sem spam) indexados no sitemap</td>
              <td>2 artigos/semana</td>
              <td style="color:var(--emerald); font-weight:700;">R$ 0</td>
            </tr>
          </tbody>
        </table>
      </div>

      <section class="sp-sim-box">
        <h3 style="margin:0 0 8px;">🎯 Simulador de Funil de Conteúdo (Vídeos Curtos → Saldo Bancário)</h3>
        <div class="sp-input-grid">
          <div class="sp-field">
            <label>Visualizações Totais/Mês (Reels+TikTok+Shorts): <strong id="tr-v-val" style="color:var(--blue);">50.000</strong></label>
            <input type="range" id="tr-v" min="5000" max="500000" step="5000" value="50000">
          </div>
          <div class="sp-field">
            <label>Taxa de Clique no Link da Bio (%): <strong id="tr-ctr-val" style="color:var(--cyan);">3.0%</strong></label>
            <input type="range" id="tr-ctr" min="0.5" max="8" step="0.5" value="3">
          </div>
        </div>
        <div class="sp-kpi-row" style="margin:0;">
          <div class="sp-kpi">
            <div class="sp-kpi-label">Visitantes Qualificados/Mês</div>
            <div class="sp-kpi-val" id="tr-clicks" style="color:var(--cyan);">1.500 cliques</div>
          </div>
          <div class="sp-kpi">
            <div class="sp-kpi-label">Novos Membros no Grupo VIP (~20%)</div>
            <div class="sp-kpi-val" id="tr-vip" style="color:var(--amber);">300 pessoas</div>
          </div>
          <div class="sp-kpi">
            <div class="sp-kpi-label">Vendas ML + Assinaturas AURA (~3%)</div>
            <div class="sp-kpi-val" id="tr-sales" style="color:var(--emerald);">45 conversões/mês</div>
          </div>
        </div>
      </section>

      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <a href="/resultados/ordem-2" class="sp-btn sp-btn-primary">✅ Ver Resultado da Ordem 2 (Afiliados + Telegram) ➔</a>
        <a href="/resultados/ordem-3" class="sp-btn sp-btn-emerald">✅ Ver Resultado da Ordem 3 (Receita Consolidada) ➔</a>
        <a href="/solucoes" class="sp-btn sp-btn-outline">← Voltar à Central</a>
      </div>
    `;

    const extraScript = `
      (function() {
        function calc() {
          const views = Number(document.getElementById('tr-v').value);
          const ctr = Number(document.getElementById('tr-ctr').value);
          document.getElementById('tr-v-val').textContent = views.toLocaleString('pt-BR');
          document.getElementById('tr-ctr-val').textContent = ctr.toFixed(1) + '%';
          const clicks = Math.round(views * (ctr / 100));
          const vip = Math.round(clicks * 0.20);
          const sales = Math.round(clicks * 0.03);
          document.getElementById('tr-clicks').textContent = clicks.toLocaleString('pt-BR') + ' cliques';
          document.getElementById('tr-vip').textContent = vip.toLocaleString('pt-BR') + ' pessoas';
          document.getElementById('tr-sales').textContent = sales.toLocaleString('pt-BR') + ' conversões/mês';
        }
        document.getElementById('tr-v').addEventListener('input', calc);
        document.getElementById('tr-ctr').addEventListener('input', calc);
        calc();
      })();
    `;

    return this._renderLayout({
      title: 'Solução 05 — Motor Real de Aquisição de Clientes & Tráfego',
      description: 'Estratégia prática de aquisição diária de clientes via Telegram, WhatsApp, vídeos curtos, prospecção B2B e SEO.',
      activePath: '/solucoes/aquisicao-trafego',
      bodyHtml,
      extraScript
    });
  }

  // =========================================================================
  // RESULTADO ORDEM 1: /resultados/ordem-1
  // =========================================================================
  renderResultOrder1() {
    const bodyHtml = `
      <section class="sp-hero" style="border-color:rgba(16,185,129,0.5);">
        <span class="sp-badge" style="background:rgba(16,185,129,0.18); color:var(--emerald); border:1px solid rgba(16,185,129,0.5);">
          RESULTADO APÓS CONCLUSÃO • ORDEM RECOMENDADA 1 (DIA 1 A 2)
        </span>
        <h1>✅ Como Ficará a Plataforma Após Concluir a Ordem 1</h1>
        <p>
          <strong>Objetivo da Ordem 1:</strong> Fechar a brecha de segurança da chave administrativa exposta em páginas públicas e ativar o <strong>Checkout Real (Pix Oficial Banco Central + Cartão + Webhook)</strong> conectado ao Mercado Pago ou Asaas.
        </p>
      </section>

      <div class="sp-grid-2">
        <div class="sp-compare-before">
          <h3 style="color:var(--rose);">❌ ANTES (Estado Atual)</h3>
          <ul class="sp-list">
            <li>QR Code aponta para URL falsa (<code>order-pix-proxy</code>).</li>
            <li>Pix Copia e Cola rejeitado por todos os bancos brasileiros.</li>
            <li>Botão na página pública expõe a chave do painel C2 Master.</li>
            <li>Zero notificação automática quando um pagamento acontece.</li>
            <li>Dinheiro impossibilitado de entrar via checkout do site.</li>
          </ul>
        </div>
        <div class="sp-compare-after">
          <h3 style="color:var(--emerald);">✅ DEPOIS (Ordem 1 Concluída)</h3>
          <ul class="sp-list">
            <li><strong>QR Code Pix Dinâmico Oficial EMVCo</strong> aceito por 100% dos bancos (Nubank, Itaú, PicPay, BB, Caixa, Inter).</li>
            <li><strong>Webhook Real Validado:</strong> assim que o cliente paga, o servidor recebe o evento <code>payment.approved</code> em ~2 segundos.</li>
            <li><strong>Liberação Automática:</strong> o acesso do cliente é ativado sem você precisar conferir comprovante manualmente.</li>
            <li><strong>Painel 100% Blindado:</strong> zero exposição de chave administrativa ou dados pessoais em qualquer rota pública.</li>
          </ul>
        </div>
      </div>

      <h2 class="sp-section-title">🖥️ Prévia Real de Como o Cliente Verá o Novo Checkout Concluído</h2>
      <div class="sp-grid-2">
        <div class="sp-mock-phone">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-family:var(--mono); font-size:0.72rem; color:var(--emerald); font-weight:800;">● GATEWAY OFICIAL CONECTADO</span>
            <span style="font-family:var(--mono); font-size:0.7rem; color:var(--dim);">ID #TX-98421</span>
          </div>
          <h3 style="margin:0 0 6px; font-size:1.05rem;">Assinatura AURA Plus — Acesso Imediato</h3>
          <div style="font-size:1.5rem; font-weight:900; color:var(--emerald); font-family:var(--mono); margin-bottom:12px;">R$ 29,90 <span style="font-size:0.75rem; color:var(--muted);">via Pix Instantâneo</span></div>
          <div style="background:#fff; color:#020617; border-radius:10px; padding:14px; text-align:center; margin-bottom:12px;">
            <div style="font-family:var(--mono); font-size:0.74rem; font-weight:800; margin-bottom:6px;">QR CODE EMVCO OFICIAL (BANCO CENTRAL)</div>
            <div style="width:120px; height:120px; margin:0 auto; border:6px solid #020617; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-family:var(--mono); background:repeating-linear-gradient(45deg,#e2e8f0,#e2e8f0 6px,#fff 6px,#fff 12px);">
              BR CODE REAL<br>MP / ASAAS
            </div>
          </div>
          <div style="background:rgba(16,185,129,0.14); border:1px solid rgba(16,185,129,0.4); color:#34d399; border-radius:8px; padding:9px; text-align:center; font-family:var(--mono); font-size:0.76rem; font-weight:700;">
            ✓ Webhook Ativo • Liberação Automática em 2s
          </div>
        </div>

        <div class="sp-card">
          <h3>🧪 Checklist de Verificação da Ordem 1</h3>
          <ul class="sp-list">
            <li><strong>[Teste 1]</strong> Escanear um Pix real de R$ 1,00 no seu próprio app do banco → banco reconhece o recebedor oficial sem erro.</li>
            <li><strong>[Teste 2]</strong> Confirmar pagamento de R$ 1,00 → servidor registra <code>WEBHOOK APPROVED</code> no log da VPS em menos de 5 segundos.</li>
            <li><strong>[Teste 3]</strong> Conta de teste muda automaticamente de <code>FREE</code> para <code>PRO</code> sem intervenção manual.</li>
            <li><strong>[Teste 4]</strong> Inspecionar código-fonte público de <code>/api/swarm/solution/1</code> → zero chaves administrativas presentes.</li>
            <li><strong>[Teste 5]</strong> Valor líquido de R$ 0,99 creditado de verdade no saldo da sua conta Mercado Pago / Asaas.</li>
          </ul>
          <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
            <a href="/solucoes/pagamentos" class="sp-btn sp-btn-outline">← Revisar Solução 01</a>
            <a href="/resultados/ordem-2" class="sp-btn sp-btn-amber">Ver Resultado da Ordem 2 ➔</a>
          </div>
        </div>
      </div>
    `;

    return this._renderLayout({
      title: 'Resultado Após Conclusão da Ordem 1 — Segurança & Pagamento Real',
      description: 'Visualização detalhada do antes e depois após concluir a Ordem 1: blindagem administrativa e checkout Pix/Cartão oficial.',
      activePath: '/resultados/ordem-1',
      bodyHtml
    });
  }

  // =========================================================================
  // RESULTADO ORDEM 2: /resultados/ordem-2
  // =========================================================================
  renderResultOrder2() {
    const bodyHtml = `
      <section class="sp-hero" style="border-color:rgba(245,158,11,0.5);">
        <span class="sp-badge" style="background:rgba(245,158,11,0.18); color:var(--amber); border:1px solid rgba(245,158,11,0.5);">
          RESULTADO APÓS CONCLUSÃO • ORDEM RECOMENDADA 2 (SEMANA 1)
        </span>
        <h1>🛒 Como Ficará a Operação Após Concluir a Ordem 2</h1>
        <p>
          <strong>Objetivo da Ordem 2:</strong> Corrigir todos os links da vitrine <code>/ofertas</code> com links reais <code>meli.la</code> do perfil <code>CASTILLOOFFICIAL</code>, adicionar fotos reais dos produtos e ligar o <strong>Bot Automático do Telegram</strong> disparando ofertas de alta comissão todos os dias.
        </p>
      </section>

      <div class="sp-grid-2">
        <div class="sp-compare-before">
          <h3 style="color:var(--rose);">❌ ANTES (Estado Atual)</h3>
          <ul class="sp-list">
            <li>Botões apontam para <code>/afiliados/link-builder</code> (tela de login).</li>
            <li>Vitrine <code>/ofertas</code> sem fotos reais nem busca por categoria.</li>
            <li>13 cliques totais no painel do Mercado Livre e R$ 0,00 em comissões.</li>
            <li>Nenhuma postagem automática externa levando compradores aos links.</li>
          </ul>
        </div>
        <div class="sp-compare-after">
          <h3 style="color:var(--emerald);">✅ DEPOIS (Ordem 2 Concluída)</h3>
          <ul class="sp-list">
            <li><strong>100% links reais <code>meli.la</code> / <code>/sec/</code>:</strong> abrem direto o aplicativo do Mercado Livre com seu cookie de comissão gravado.</li>
            <li><strong>Vitrine <code>/ofertas</code> profissional:</strong> fotos reais, selo FULL, busca instantânea e cadastro de novas ofertas em 5 segundos pelo Admin.</li>
            <li><strong>Bot Telegram 24/7 ativo:</strong> publica automaticamente 8 a 15 ofertas reais/dia nos horários de pico de compra.</li>
            <li><strong>Comissões reais caindo no Mercado Pago</strong> todo mês a partir de cliques qualificados.</li>
          </ul>
        </div>
      </div>

      <h2 class="sp-section-title">📱 Prévia Real da Postagem Automática no Canal do Telegram</h2>
      <div class="sp-grid-2">
        <div class="sp-mock-phone" style="border-color:rgba(56,189,248,0.45);">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px; border-bottom:1px solid var(--border); padding-bottom:8px;">
            <span style="font-size:1.3rem;">✈️</span>
            <div>
              <div style="font-weight:800; font-size:0.88rem; color:#fff;">Achadinhos VIP Oficial • Ofertas FULL</div>
              <div style="font-size:0.68rem; color:var(--blue); font-family:var(--mono);">Postado automaticamente pelo NEXUS Bot • 19:00</div>
            </div>
          </div>
          <div style="background:rgba(15,23,42,0.95); border:1px solid rgba(56,189,248,0.25); border-radius:12px; padding:14px; font-size:0.84rem; color:#e2e8f0;">
            <div style="color:var(--amber); font-weight:800; margin-bottom:6px;">🚨 OFERTA RELÂMPAGO • 58% OFF + ENTREGA FULL</div>
            <div style="font-weight:700; color:#fff; margin-bottom:6px;">Creatina Monohidratada 1kg 100% Pura — Dark Lab</div>
            <div style="margin-bottom:8px;">
              ❌ De: <span style="text-decoration:line-through; color:var(--muted);">R$ 168,90</span><br>
              ✅ Por apenas: <strong style="color:var(--emerald); font-size:1.05rem;">R$ 69,90 no Pix</strong>
            </div>
            <div style="color:var(--blue); font-family:var(--mono); font-size:0.78rem; margin-bottom:8px;">
              🛒 Comprar no Mercado Livre Oficial:<br>
              https://meli.la/SEU-LINK-REAL-AQUI
            </div>
            <div style="font-size:0.72rem; color:var(--muted);">⚡ Estoque promocional verificado agora pelo Radar NEXUS.</div>
          </div>
        </div>

        <div class="sp-card">
          <h3>📈 Evolução Realista Esperada (30 / 60 / 90 Dias)</h3>
          <div class="sp-table-wrap" style="margin:0;">
            <table>
              <thead>
                <tr>
                  <th>Marco</th>
                  <th>Cliques/Mês</th>
                  <th>Vendas Est.</th>
                  <th>Comissão Real</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Mês 1 (30 dias)</strong></td>
                  <td>1.000 – 2.000</td>
                  <td>25 – 55</td>
                  <td style="color:var(--amber); font-weight:800;">R$ 450 – R$ 1.100</td>
                </tr>
                <tr>
                  <td><strong>Mês 2 (60 dias)</strong></td>
                  <td>3.500 – 6.000</td>
                  <td>95 – 180</td>
                  <td style="color:var(--amber); font-weight:800;">R$ 1.800 – R$ 3.600</td>
                </tr>
                <tr>
                  <td><strong>Mês 3 (90 dias)</strong></td>
                  <td>8.000 – 15.000+</td>
                  <td>240 – 450+</td>
                  <td style="color:var(--emerald); font-weight:800;">R$ 4.500 – R$ 9.000+</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style="font-size:0.75rem; margin-top:10px; color:var(--dim);">* Valores dependem diretamente da constância de divulgação do grupo/canal e vídeos curtos gerando novos membros toda semana.</p>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
            <a href="/solucoes/afiliados-ml" class="sp-btn sp-btn-outline">← Revisar Solução 02</a>
            <a href="/resultados/ordem-3" class="sp-btn sp-btn-primary">Ver Resultado da Ordem 3 ➔</a>
          </div>
        </div>
      </div>
    `;

    return this._renderLayout({
      title: 'Resultado Após Conclusão da Ordem 2 — Afiliados ML & Bot Telegram',
      description: 'Como ficará a vitrine /ofertas e o canal automático de ofertas do Mercado Livre após concluir a Ordem 2.',
      activePath: '/resultados/ordem-2',
      bodyHtml
    });
  }

  // =========================================================================
  // RESULTADO ORDEM 3: /resultados/ordem-3
  // =========================================================================
  renderResultOrder3() {
    const bodyHtml = `
      <section class="sp-hero" style="border-color:rgba(0,245,255,0.5);">
        <span class="sp-badge" style="background:rgba(0,245,255,0.16); color:var(--cyan); border:1px solid rgba(0,245,255,0.5);">
          RESULTADO APÓS CONCLUSÃO • ORDEM RECOMENDADA 3 (SEMANAS 2 A 4)
        </span>
        <h1>🚀 Como Ficará o Ecossistema Consolidado Após Concluir a Ordem 3</h1>
        <p>
          <strong>Objetivo da Ordem 3:</strong> Ativar a cobrança recorrente real da <strong>AURA Plus / NEXUS Pro</strong> e fechar os primeiros clientes <strong>B2B de Agentes WhatsApp IA</strong> em subdomínios gratuitos — criando 3 fontes independentes de receita real entrando todos os meses.
        </p>
      </section>

      <div class="sp-grid-2">
        <div class="sp-compare-before">
          <h3 style="color:var(--rose);">❌ ANTES (Estado Atual)</h3>
          <ul class="sp-list">
            <li>AURA Live usada 100% de graça sem opção de upgrade pago.</li>
            <li>100 projetos exibem textos teóricos pedindo compra de 100 domínios.</li>
            <li>Receita exibida no painel (R$ 2,89M) é apenas projeção teórica desconectada do banco.</li>
          </ul>
        </div>
        <div class="sp-compare-after">
          <h3 style="color:var(--emerald);">✅ DEPOIS (Ordem 3 Concluída)</h3>
          <ul class="sp-list">
            <li><strong>AURA Live Freemium ativa:</strong> usuários grátis conhecem o produto e assinam R$ 29,90 ou R$ 97,00/mês com renovação automática.</li>
            <li><strong>Empresas B2B pagando mensalidade real:</strong> clínicas e negócios locais usando seu motor de IA no WhatsApp por R$ 350–R$ 800/mês.</li>
            <li><strong>Painel Financeiro 100% Real:</strong> mostra exatamente o saldo líquido aprovado pelos webhooks do Mercado Pago/Asaas + comissões do Mercado Livre.</li>
          </ul>
        </div>
      </div>

      <section class="sp-sim-box">
        <span class="sp-badge" style="background:rgba(16,185,129,0.16); color:var(--emerald); border:1px solid rgba(16,185,129,0.45);">
          PRÉVIA DO PAINEL DE CAIXA REAL CONSOLIDADO (CENÁRIOS HONESTOS)
        </span>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin:10px 0 18px;">
          <button type="button" class="sp-btn sp-btn-outline" onclick="window.setScenario('conservador')">🌱 Cenário 1: Início (Mês 1–2)</button>
          <button type="button" class="sp-btn sp-btn-primary" onclick="window.setScenario('moderado')">⚡ Cenário 2: Tração (Mês 3–4)</button>
          <button type="button" class="sp-btn sp-btn-emerald" onclick="window.setScenario('escala')">🏆 Cenário 3: Escala (Mês 6+)</button>
        </div>

        <div class="sp-kpi-row">
          <div class="sp-kpi">
            <div class="sp-kpi-label">Afiliados Mercado Livre</div>
            <div class="sp-kpi-val" id="sc-ml" style="color:var(--amber);">R$ 2.100,00</div>
            <div style="font-size:0.72rem; color:var(--muted); margin-top:4px;" id="sc-ml-desc">4.000 cliques/mês • Telegram + Reels</div>
          </div>
          <div class="sp-kpi">
            <div class="sp-kpi-label">Assinaturas AURA Plus &amp; Pro</div>
            <div class="sp-kpi-val" id="sc-aura" style="color:var(--cyan);">R$ 2.960,00</div>
            <div style="font-size:0.72rem; color:var(--muted); margin-top:4px;" id="sc-aura-desc">50 Plus + 15 Pro ativos</div>
          </div>
          <div class="sp-kpi">
            <div class="sp-kpi-label">Clientes B2B WhatsApp IA</div>
            <div class="sp-kpi-val" id="sc-b2b" style="color:var(--purple);">R$ 3.500,00</div>
            <div style="font-size:0.72rem; color:var(--muted); margin-top:4px;" id="sc-b2b-desc">7 empresas locais × R$ 500/mês</div>
          </div>
          <div class="sp-kpi" style="border-color:var(--emerald); background:rgba(16,185,129,0.12);">
            <div class="sp-kpi-label" style="color:var(--emerald);">SALDO MENSAL REAL NA CONTA</div>
            <div class="sp-kpi-val" id="sc-total" style="color:var(--emerald);">R$ 8.560,00</div>
            <div style="font-size:0.72rem; color:#a7f3d0; margin-top:4px;" id="sc-total-desc">Liquidação direta Mercado Pago / Asaas → PicPay</div>
          </div>
        </div>
      </section>

      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <a href="/solucoes" class="sp-btn sp-btn-primary">🎯 Voltar à Central Completa de Soluções</a>
        <a href="/resultados/ordem-1" class="sp-btn sp-btn-outline">← Ordem 1</a>
        <a href="/resultados/ordem-2" class="sp-btn sp-btn-outline">← Ordem 2</a>
      </div>
    `;

    const extraScript = `
      window.setScenario = function(mode) {
        const data = {
          conservador: {
            ml: 'R$ 650,00', mlDesc: '1.200 cliques/mês • Canal recém-criado',
            aura: 'R$ 890,00', auraDesc: '20 AURA Plus + 3 NEXUS Pro',
            b2b: 'R$ 1.200,00', b2bDesc: '3 empresas locais × R$ 400/mês',
            total: 'R$ 2.740,00', totalDesc: 'Primeiros meses de operação real validada'
          },
          moderado: {
            ml: 'R$ 2.100,00', mlDesc: '4.000 cliques/mês • Telegram + Reels ativos',
            aura: 'R$ 2.960,00', auraDesc: '50 AURA Plus + 15 NEXUS Pro',
            b2b: 'R$ 3.500,00', b2bDesc: '7 empresas locais × R$ 500/mês',
            total: 'R$ 8.560,00', totalDesc: 'Operação recorrente consolidada'
          },
          escala: {
            ml: 'R$ 6.800,00', mlDesc: '12.000+ cliques/mês • Grupos VIP + Shorts virais',
            aura: 'R$ 9.420,00', auraDesc: '180 AURA Plus + 42 NEXUS Pro',
            b2b: 'R$ 9.000,00', b2bDesc: '15 empresas locais × R$ 600/mês',
            total: 'R$ 25.220,00', totalDesc: 'Negócio digital sólido com 3 pilares reais'
          }
        }[mode];
        if (!data) return;
        document.getElementById('sc-ml').textContent = data.ml;
        document.getElementById('sc-ml-desc').textContent = data.mlDesc;
        document.getElementById('sc-aura').textContent = data.aura;
        document.getElementById('sc-aura-desc').textContent = data.auraDesc;
        document.getElementById('sc-b2b').textContent = data.b2b;
        document.getElementById('sc-b2b-desc').textContent = data.b2bDesc;
        document.getElementById('sc-total').textContent = data.total;
        document.getElementById('sc-total-desc').textContent = data.totalDesc;
      };
    `;

    return this._renderLayout({
      title: 'Resultado Após Conclusão da Ordem 3 — Receita Recorrente Consolidada',
      description: 'Projeção transparente e prévia do ecossistema NEXUS após ativar AURA Pro, clientes B2B e afiliados reais.',
      activePath: '/resultados/ordem-3',
      bodyHtml,
      extraScript
    });
  }

  renderForbiddenHTML() {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>403 — Acesso Restrito • NEXUS</title>
  <style>
    body { margin: 0; min-height: 100vh; background: #030712; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .box { max-width: 460px; width: 100%; background: rgba(15,23,42,0.92); border: 1px solid rgba(244,63,94,0.45); border-radius: 16px; padding: 28px; text-align: center; box-shadow: 0 18px 45px rgba(0,0,0,0.65); }
    h1 { margin: 8px 0; font-size: 1.45rem; color: #fda4af; }
    p { color: #94a3b8; font-size: 0.9rem; line-height: 1.55; margin: 0 0 18px; }
    a { display: inline-block; padding: 10px 18px; border-radius: 10px; background: #00f5ff; color: #020617; font-weight: 800; text-decoration: none; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="box">
    <div style="font-size:2.4rem;">🔒</div>
    <h1>Acesso Restrito à Área Administrativa</h1>
    <p>Este conteúdo é estritamente privado e acessível somente pela proprietária autenticada dentro do Painel Master C2.</p>
    <a href="/">← Voltar à Página Inicial</a>
  </div>
</body>
</html>`;
  }

  /**
   * Roteador principal chamado pelo server.js para todas as rotas /solucoes/* e /resultados/*
   * Retorna HTML string ou null caso não corresponda.
   */
  resolveRouteHTML(pathname) {
    const clean = (pathname || '').replace(/\/+$/, '') || '/';
    switch (clean) {
      case '/solucoes':
      case '/central-solucoes':
      case '/plano-real':
      case '/resultados':
        return this.renderHubPage();
      case '/solucoes/pagamentos':
        return this.renderSolutionPagamentos();
      case '/solucoes/afiliados-ml':
        return this.renderSolutionAfiliadosML();
      case '/solucoes/monetizacao-aura':
        return this.renderSolutionMonetizacaoAura();
      case '/solucoes/micro-saas-b2b':
        return this.renderSolutionMicroSaasB2B();
      case '/solucoes/aquisicao-trafego':
        return this.renderSolutionAquisicaoTrafego();
      case '/resultados/ordem-1':
        return this.renderResultOrder1();
      case '/resultados/ordem-2':
        return this.renderResultOrder2();
      case '/resultados/ordem-3':
        return this.renderResultOrder3();
      default:
        return null;
    }
  }
}

export const solutionsPortalEngine = new SolutionsPortalEngine();
export default solutionsPortalEngine;
