const fs = require('fs');

let c = fs.readFileSync('admin.html', 'utf8').replace(/\r\n/g, '\n');

// 1. Sidebar Nav
const navTarget = '<button class="c2-tab-btn" data-tab="tab-organism">\n            <span class="tab-icon">🌌</span>\n            <span class="tab-text">11. Organismo Vivo (Mundo)</span>\n          </button>';
const navRepl = '<button class="c2-tab-btn" data-tab="tab-organism">\n            <span class="tab-icon">🌌</span>\n            <span class="tab-text">11. Organismo Vivo (Mundo)</span>\n          </button>\n          <div class="c2-nav-group-title" style="color:#10b981">MONETIZAÇÃO &amp; NEGÓCIOS REAIS</div>\n          <button class="c2-tab-btn" data-tab="tab-swarm-100" style="border-left:2px solid #10b981;">\n            <span class="tab-icon">⚡</span>\n            <span class="tab-text" style="color:#f8fafc;font-weight:700">12. Enxame 100 Agentes (Monetização)</span>\n          </button>';

if (!c.includes(navTarget)) {
  console.error('navTarget not found');
  process.exit(1);
}
c = c.replace(navTarget, navRepl);

// 2. Tab Pane
const paneTarget = '    <!-- Formal Legal / Technical Markdown Dossier Viewer Modal -->';
const swarmPane = `    <!-- ═══════════════════════════════════════════════════════════════════════
         PILLAR 12: ENXAME DE 100 AGENTES • MONETIZAÇÃO & OPERAÇÃO PERPÉTUA (24/7)
         ═══════════════════════════════════════════════════════════════════════ -->
    <div id="tab-swarm-100" class="c2-pane">
      
      <!-- Top Panoramic Header & Swarm Macro KPIs -->
      <div style="background: linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.06) 50%, rgba(2,6,23,0.95) 100%); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span class="agent-badge DONE" style="background:rgba(16,185,129,0.15); color:#10b981; border-color:rgba(16,185,129,0.4); font-size:0.7rem; font-weight:700;">
                <span class="c2-pulse-dot" style="background:#10b981; box-shadow: 0 0 8px #10b981;"></span>
                100 AGENTES SOBERANOS EM OPERAÇÃO PERPÉTUA
              </span>
              <span style="font-family:var(--font-mono); font-size:0.68rem; color:#94a3b8;">NÍVEL SUPERINTELIGÊNCIA EXECUTIVA</span>
            </div>
            <h2 style="font-family:var(--font-display); font-size:1.4rem; font-weight:800; color:#f8fafc; margin:0; letter-spacing:0.02em;">
              Enxame de Monetização Digital &amp; Execução Contínua
            </h2>
            <p style="font-size:0.8rem; color:#94a3b8; margin:4px 0 0; max-width:760px; line-height:1.4;">
              100 agentes autônomos treinados para prospectar, criar e executar negócios digitais reais. Nenhum agente é interrompido autonomamente — eles operam 24/7 gerando código, especificações de produtos, esteiras de tráfego e modelos de conversão. Você apenas provê as credenciais e domínios quando solicitado.
            </p>
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button id="swarm-refresh-btn" class="btn-secondary" style="font-size:0.75rem; padding:0.45rem 0.85rem;" title="Recarregar Estado em Tempo Real">
              ↻ Atualizar Estado
            </button>
            <button id="swarm-hard-reset-btn" class="btn-secondary" style="font-size:0.75rem; padding:0.45rem 0.85rem; border-color:rgba(239,68,68,0.3); color:#fca5a5;" title="Restaurar Configuração Inicial do Enxame">
              ⚠️ Resetar Enxame
            </button>
          </div>
        </div>

        <!-- 4 Essential Financial & Operational Indicators -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; margin-top: 1rem;">
          <div style="background: rgba(2,6,23,0.7); border: 1px solid rgba(16,185,129,0.25); border-radius: 8px; padding: 0.85rem;">
            <div style="font-size:0.65rem; color:#94a3b8; font-family:var(--font-mono); text-transform:uppercase; margin-bottom:4px;">Receita Mensal Projetada (MRR)</div>
            <div id="swarm-kpi-mrr" style="font-family:var(--font-mono); font-size:1.5rem; font-weight:800; color:#10b981; line-height:1.1;">R$ 0,00</div>
            <div style="font-size:0.65rem; color:#64748b; margin-top:3px;">Soma dos 100 modelos de rentabilidade</div>
          </div>
          <div style="background: rgba(2,6,23,0.7); border: 1px solid rgba(6,182,212,0.25); border-radius: 8px; padding: 0.85rem;">
            <div style="font-size:0.65rem; color:#94a3b8; font-family:var(--font-mono); text-transform:uppercase; margin-bottom:4px;">Agentes em Execução Perpétua</div>
            <div id="swarm-kpi-active" style="font-family:var(--font-mono); font-size:1.5rem; font-weight:800; color:#06b6d4; line-height:1.1;">100 / 100</div>
            <div id="swarm-kpi-paused" style="font-size:0.65rem; color:#64748b; margin-top:3px;">0 pausados pelo criador</div>
          </div>
          <div style="background: rgba(2,6,23,0.7); border: 1px solid rgba(168,85,247,0.25); border-radius: 8px; padding: 0.85rem;">
            <div style="font-size:0.65rem; color:#94a3b8; font-family:var(--font-mono); text-transform:uppercase; margin-bottom:4px;">Entregáveis Prontos (Código/PRDs)</div>
            <div id="swarm-kpi-deliverables" style="font-family:var(--font-mono); font-size:1.5rem; font-weight:800; color:#c084fc; line-height:1.1;">0</div>
            <div style="font-size:0.65rem; color:#64748b; margin-top:3px;">Projetos e arquiteturas compiladas</div>
          </div>
          <div style="background: rgba(2,6,23,0.7); border: 1px solid rgba(245,158,11,0.25); border-radius: 8px; padding: 0.85rem;">
            <div style="font-size:0.65rem; color:#94a3b8; font-family:var(--font-mono); text-transform:uppercase; margin-bottom:4px;">Ações Requeridas de Você</div>
            <div id="swarm-kpi-actions" style="font-family:var(--font-mono); font-size:1.5rem; font-weight:800; color:#fbbf24; line-height:1.1;">0 Domínios / 0 Chaves</div>
            <div style="font-size:0.65rem; color:#64748b; margin-top:3px;">Apenas comprar domínio ou plugar API</div>
          </div>
        </div>
      </div>

      <!-- Sovereign Command Console (Global / Target Broadcast) -->
      <div style="background: rgba(10,15,30,0.85); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:0.95rem;">⚡</span>
            <span style="font-family:var(--font-mono); font-size:0.78rem; font-weight:700; color:#e2e8f0; text-transform:uppercase; letter-spacing:0.05em;">Terminal de Transmissão de Ordens Soberanas</span>
          </div>
          <span style="font-size:0.68rem; color:#94a3b8; font-family:var(--font-mono);">MODO OPEN CODE / SOBERANO</span>
        </div>
        
        <div style="display:grid; grid-template-columns: 200px 180px 1fr auto; gap: 0.65rem; align-items: center;">
          <!-- Scope Selector -->
          <select id="swarm-order-scope" class="text-input" style="font-size:0.76rem; padding:0.45rem;">
            <option value="all">⚡ Todos os 100 Agentes (Global)</option>
            <option value="sector">🏢 Por Vertical / Setor</option>
            <option value="single">👤 Agente Individual Específico</option>
          </select>

          <!-- Deliverable Type -->
          <select id="swarm-order-type" class="text-input" style="font-size:0.76rem; padding:0.45rem;">
            <option value="DOCUMENTO">📄 Documento / PRD</option>
            <option value="CODIGO">💻 Código-Fonte &amp; Deploy</option>
            <option value="ESTRATEGIA_TRAFEGO">📈 Estratégia de Tráfego</option>
            <option value="ANALISE_ROI">💰 Modelo Financeiro &amp; ROI</option>
          </select>

          <!-- Order Input -->
          <input type="text" id="swarm-order-input" class="text-input" placeholder="Ex: Desenvolva a landing page de alta conversão e defina a precificação para escalar para R$ 20k/mês..." style="font-size:0.8rem; padding:0.45rem 0.75rem;" />

          <!-- Transmit Button -->
          <button id="swarm-transmit-btn" class="btn-primary" style="font-size:0.76rem; padding:0.45rem 1.1rem; white-space:nowrap; display:flex; align-items:center; gap:6px;">
            <span>Transmitir Ordem</span>
            <span>⚡</span>
          </button>
        </div>

        <div id="swarm-order-feedback" style="display:none; font-size:0.72rem; margin-top:0.65rem; padding:0.45rem 0.75rem; border-radius:6px; font-family:var(--font-mono);"></div>
      </div>

      <!-- Vertical Filter Chips (10 Sectors) -->
      <div style="display:flex; gap:0.4rem; overflow-x:auto; padding-bottom:0.75rem; margin-bottom:1rem; scrollbar-width:thin;" id="swarm-sector-chips">
        <!-- Rendered dynamically -->
      </div>

      <!-- Agent Grid of 100 Cards -->
      <div id="swarm-agents-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; align-items: stretch;">
        <!-- Populated dynamically by SwarmUI -->
      </div>

    </div>

    <!-- Agent Direct Workspace & Deliverable Viewer Modal -->
    <div id="swarm-deliverable-modal" class="modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:99999; align-items:center; justify-content:center;">
      <div class="modal-box glass-panel" style="width:min(860px, 94vw); max-height:88vh; display:flex; flex-direction:column; padding:1.25rem; border:1px solid rgba(0,245,255,0.3); border-radius:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.75rem; margin-bottom:1rem;">
          <div>
            <span id="swarm-modal-agent-name" style="font-family:var(--font-display); font-size:1.1rem; font-weight:700; color:#f8fafc;">Agente</span>
            <div id="swarm-modal-agent-meta" style="font-size:0.7rem; color:#94a3b8; font-family:var(--font-mono); margin-top:2px;">Vertical • Status</div>
          </div>
          <button id="swarm-modal-close-btn" class="btn-secondary" style="padding:4px 10px; font-size:0.75rem;">✕ Fechar</button>
        </div>
        <div id="swarm-modal-content" style="flex:1; overflow-y:auto; background:rgba(2,4,12,0.9); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:1rem; font-family:var(--font-mono); font-size:0.75rem; color:#e2e8f0; line-height:1.6; white-space:pre-wrap;"></div>
        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem; border-top:1px solid rgba(255,255,255,0.08); padding-top:0.75rem;">
          <button id="swarm-modal-copy-btn" class="btn-primary" style="font-size:0.75rem; padding:0.4rem 0.85rem;">📋 Copiar Conteúdo</button>
        </div>
      </div>
    </div>

`;

if (!c.includes(paneTarget)) {
  console.error('paneTarget not found');
  process.exit(1);
}
c = c.replace(paneTarget, swarmPane + '\n    ' + paneTarget);

// 3. Add script tag at the bottom
const scriptTarget = '  <script src="world_organism_ui.js"></script>';
const scriptRepl = '  <script src="world_organism_ui.js"></script>\n  <script src="swarm_100_ui.js"></script>';
if (!c.includes(scriptTarget)) {
  console.error('scriptTarget not found');
  process.exit(1);
}
c = c.replace(scriptTarget, scriptRepl);

fs.writeFileSync('admin.html', c, 'utf8');
console.log('✅ admin.html updated with Tab 12 Swarm Panel and UI script.');
