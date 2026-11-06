/**
 * swarm_100_ui.js
 * 
 * INTERFACE EXECUTIVA DO ENXAME DE 100 AGENTES AUTÔNOMOS (TAB 12 ADMIN C2)
 * 
 * Funcionalidades:
 * - Carregamento instantâneo do estado dos 100 agentes
 * - Filtro dinâmico pelas 10 verticais de monetização
 * - Cards minimalistas com dados reais de mercado (MRR, Domínio, Credenciais, Entregáveis)
 * - Transmissão de ordens soberanas (Global, Vertical ou Individual) no padrão Open Code
 * - Modal executivo com visualização de documentos, código gerado e PRDs
 * - Controle Soberano: Pausar/Retomar e Exclusão definitiva de agentes
 */

const Swarm100UI = (() => {
  let swarmState = null;
  let activeSector = null; // null = todos os 100
  let isPolling = false;

  const SECTOR_ICONS = {
    micro_saas: '⚡',
    b2b_automation: '🏢',
    traffic_arbitrage: '📈',
    affiliate_engines: '🛒',
    browser_extensions: '🧩',
    pwa_utilities: '📱',
    premium_info: '📚',
    financial_data: '💎',
    digital_stores: '📦',
    paid_curation: '📬'
  };

  async function init() {
    bindEvents();
    await fetchState();
    startPolling();
  }

  function bindEvents() {
    // Botão de Refresh
    const refreshBtn = document.getElementById('swarm-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.textContent = '↻ Atualizando...';
        await fetchState();
        refreshBtn.textContent = '↻ Atualizar Estado';
      });
    }

    // Botão de Hard Reset
    const resetBtn = document.getElementById('swarm-hard-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        if (!confirm('ATENÇÃO SOBERANA: Deseja restaurar a matriz original dos 100 agentes para a configuração de fábrica?')) {
          return;
        }
        try {
          const res = await fetch('/api/swarm/reset', { method: 'POST' });
          const json = await res.json();
          alert(json.message || 'Enxame restaurado com sucesso.');
          await fetchState();
        } catch (e) {
          alert('Erro ao resetar: ' + e.message);
        }
      });
    }

    // Transmissão de Ordem Soberana
    const transmitBtn = document.getElementById('swarm-transmit-btn');
    const orderInput = document.getElementById('swarm-order-input');
    const scopeSelect = document.getElementById('swarm-order-scope');
    const typeSelect = document.getElementById('swarm-order-type');

    if (transmitBtn && orderInput) {
      const sendOrder = async () => {
        const orderText = orderInput.value.trim();
        if (!orderText) {
          showFeedback('Por favor, digite uma ordem ou especificação para o enxame.', 'error');
          return;
        }

        const scope = scopeSelect ? scopeSelect.value : 'all';
        const type = typeSelect ? typeSelect.value : 'DOCUMENTO';

        transmitBtn.disabled = true;
        transmitBtn.innerHTML = '<span>Transmitindo...</span> <span>⏳</span>';

        try {
          const payload = {
            order: orderText,
            deliverableType: type,
            scope: scope,
            agentId: scope === 'single' ? prompt('Digite o número do Agente (#1 a #100):', '1') : null,
            sectorId: scope === 'sector' ? (activeSector || 'micro_saas') : null
          };

          const res = await fetch('/api/swarm/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const json = await res.json();

          if (json.success) {
            orderInput.value = '';
            showFeedback(json.message || 'Ordem processada com sucesso!', 'success');
            await fetchState();
          } else {
            showFeedback(json.error || 'Erro ao processar ordem.', 'error');
          }
        } catch (e) {
          showFeedback('Falha de conexão: ' + e.message, 'error');
        } finally {
          transmitBtn.disabled = false;
          transmitBtn.innerHTML = '<span>Transmitir Ordem</span> <span>⚡</span>';
        }
      };

      transmitBtn.addEventListener('click', sendOrder);
      orderInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendOrder();
      });
    }

    // Fechar Modal de Entregável
    const closeBtn = document.getElementById('swarm-modal-close-btn');
    const modal = document.getElementById('swarm-deliverable-modal');
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });
    }

    // Copiar Conteúdo do Modal
    const copyBtn = document.getElementById('swarm-modal-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const content = document.getElementById('swarm-modal-content');
        if (content) {
          navigator.clipboard.writeText(content.textContent || '');
          copyBtn.textContent = '✓ Copiado!';
          setTimeout(() => { copyBtn.textContent = '📋 Copiar Conteúdo'; }, 2000);
        }
      });
    }
  }

  function showFeedback(msg, type = 'info') {
    const el = document.getElementById('swarm-order-feedback');
    if (!el) return;
    el.style.display = 'block';
    el.textContent = msg;
    if (type === 'error') {
      el.style.background = 'rgba(239,68,68,0.15)';
      el.style.color = '#fca5a5';
      el.style.border = '1px solid rgba(239,68,68,0.3)';
    } else {
      el.style.background = 'rgba(16,185,129,0.15)';
      el.style.color = '#6ee7b7';
      el.style.border = '1px solid rgba(16,185,129,0.3)';
    }
    setTimeout(() => { el.style.display = 'none'; }, 6000);
  }

  async function fetchState() {
    try {
      const url = activeSector ? `/api/swarm/state?sector=${activeSector}` : '/api/swarm/state';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Status ' + res.status);
      swarmState = await res.json();
      renderKPIs();
      renderSectorChips();
      renderAgentsGrid();
    } catch (e) {
      console.warn('[Swarm100UI] Erro ao sincronizar enxame:', e.message);
    }
  }

  function startPolling() {
    if (isPolling) return;
    isPolling = true;
    setInterval(() => {
      // Polling leve a cada 30 segundos se a aba 12 estiver visível
      const pane = document.getElementById('tab-swarm-100');
      if (pane && pane.classList.contains('active')) {
        fetchState();
      }
    }, 30000);
  }

  function renderKPIs() {
    if (!swarmState || !swarmState.metrics) return;
    const m = swarmState.metrics;

    const mrrEl = document.getElementById('swarm-kpi-mrr');
    if (mrrEl) {
      mrrEl.textContent = 'R$ ' + (m.totalProjectedMRR || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }

    const activeEl = document.getElementById('swarm-kpi-active');
    if (activeEl) {
      activeEl.textContent = `${m.totalActive || 0} / ${m.totalAgents || 0}`;
    }

    const pausedEl = document.getElementById('swarm-kpi-paused');
    if (pausedEl) {
      pausedEl.textContent = `${m.totalPaused || 0} pausados pelo criador`;
    }

    const delivEl = document.getElementById('swarm-kpi-deliverables');
    if (delivEl) {
      delivEl.textContent = m.totalDeliverables || 0;
    }

    const actionsEl = document.getElementById('swarm-kpi-actions');
    if (actionsEl) {
      actionsEl.textContent = `${m.pendingDomains || 0} Domínios / ${m.pendingCredentials || 0} Chaves`;
    }
  }

  function renderSectorChips() {
    const container = document.getElementById('swarm-sector-chips');
    if (!container || !swarmState || !swarmState.sectors) return;

    let html = `
      <button class="c2-tab-btn ${activeSector === null ? 'active' : ''}" data-sector="all" style="padding:0.35rem 0.75rem; font-size:0.72rem; white-space:nowrap; border-radius:20px;">
        🌐 Todas as Verticais (100)
      </button>
    `;

    swarmState.sectors.forEach(s => {
      const isAct = activeSector === s.id;
      html += `
        <button class="c2-tab-btn ${isAct ? 'active' : ''}" data-sector="${s.id}" style="padding:0.35rem 0.75rem; font-size:0.72rem; white-space:nowrap; border-radius:20px;">
          ${s.icon || '⚡'} ${s.name}
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = btn.getAttribute('data-sector');
        activeSector = sec === 'all' ? null : sec;
        fetchState();
      });
    });
  }

  function renderAgentsGrid() {
    const grid = document.getElementById('swarm-agents-grid');
    if (!grid || !swarmState || !swarmState.agents) return;

    if (swarmState.agents.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding:3rem 1rem; color:#94a3b8; font-family:var(--font-mono);">
          Nenhum agente encontrado nesta vertical.
        </div>
      `;
      return;
    }

    let html = '';
    swarmState.agents.forEach(agent => {
      const isRunning = agent.status === 'EXECUTANDO';
      const statusColor = isRunning ? '#10b981' : '#f59e0b';
      const statusBadge = isRunning
        ? `<span class="agent-badge DONE" style="font-size:0.62rem; background:rgba(16,185,129,0.1); color:#10b981; border-color:rgba(16,185,129,0.3);"><span class="c2-pulse-dot" style="background:#10b981;"></span> 24/7 PERPÉTUO</span>`
        : `<span class="agent-badge" style="font-size:0.62rem; background:rgba(245,158,11,0.1); color:#fbbf24; border-color:rgba(245,158,11,0.3);">PAUSADO</span>`;

      const mrrFormatted = 'R$ ' + (agent.projectedRevenueBRL || 0).toLocaleString('pt-BR');
      const delivCount = agent.deliverables ? agent.deliverables.length : 0;
      const credsList = agent.requiredCredentials ? agent.requiredCredentials.join(', ') : 'Nenhuma';

      html += `
        <div class="glass-panel" style="background:rgba(10,15,30,0.75); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; display:flex; flex-direction:column; justify-content:space-between; transition:all 0.2s ease; position:relative;" onmouseover="this.style.borderColor='rgba(0,245,255,0.3)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
          
          <!-- Agent Card Header -->
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-family:var(--font-mono); font-size:0.7rem; font-weight:800; color:#00f5ff; background:rgba(0,245,255,0.1); padding:2px 6px; border-radius:4px;">#${String(agent.id).padStart(2, '0')}</span>
                <span style="font-size:0.68rem; color:#94a3b8; font-family:var(--font-mono); text-transform:uppercase;">${agent.sector}</span>
              </div>
              ${statusBadge}
            </div>

            <div style="font-family:var(--font-display); font-size:1.02rem; font-weight:700; color:#f8fafc; margin-bottom:4px;">
              ${agent.name}
            </div>
            
            <div style="font-size:0.74rem; color:#94a3b8; line-height:1.4; margin-bottom:10px; min-height:34px;">
              ${agent.role}
            </div>

            <!-- Revenue & Mission Box -->
            <div style="background:rgba(2,6,23,0.8); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:0.6rem; margin-bottom:0.75rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:0.65rem; color:#64748b; font-family:var(--font-mono);">RECEITA ESTIMADA:</span>
                <span style="font-size:0.78rem; font-weight:700; color:#10b981; font-family:var(--font-mono);">${mrrFormatted}/mês</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:0.65rem; color:#64748b; font-family:var(--font-mono);">DOMÍNIO ALVO:</span>
                <span style="font-size:0.72rem; color:#38bdf8; font-family:var(--font-mono);">${agent.requiredDomain}</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.65rem; color:#64748b; font-family:var(--font-mono);">GATEWAY/CREDS:</span>
                <span style="font-size:0.68rem; color:#cbd5e1; font-family:var(--font-mono); max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${credsList}">${credsList}</span>
              </div>
            </div>

            <!-- Current Mission -->
            <div style="font-size:0.68rem; color:#64748b; margin-bottom:10px; font-family:var(--font-mono); line-height:1.3;">
              <span style="color:#e2e8f0; font-weight:600;">Missão Atual:</span> ${agent.currentMission || 'Em execução contínua.'}
            </div>
          </div>

          <!-- Actions Toolbar -->
          <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:0.75rem; display:flex; justify-content:space-between; align-items:center; gap:0.4rem;">
            
            <button class="btn-secondary" onclick="Swarm100UI.viewDeliverable(${agent.id})" style="font-size:0.7rem; padding:0.35rem 0.6rem; flex:1; display:flex; align-items:center; justify-content:center; gap:4px;" title="Ver Projetos, Códigos e PRDs">
              <span>📄 Projetos (${delivCount})</span>
            </button>

            <button class="btn-secondary" onclick="Swarm100UI.promptAgentOrder(${agent.id}, '${agent.name}')" style="font-size:0.7rem; padding:0.35rem 0.6rem; flex:1; border-color:rgba(0,245,255,0.3); color:#38bdf8;" title="Dar Ordem Direta a este Agente">
              <span>⚡ Ordenar</span>
            </button>

            <button class="btn-secondary" onclick="Swarm100UI.toggleAgent(${agent.id}, '${isRunning ? 'PAUSADO' : 'EXECUTANDO'}')" style="font-size:0.7rem; padding:0.35rem 0.5rem; color:${isRunning ? '#fbbf24' : '#10b981'};" title="${isRunning ? 'Pausar Operação' : 'Retomar Operação'}">
              ${isRunning ? '⏸️' : '▶️'}
            </button>

            <button class="btn-secondary" onclick="Swarm100UI.deleteAgent(${agent.id}, '${agent.name}')" style="font-size:0.7rem; padding:0.35rem 0.45rem; border-color:rgba(239,68,68,0.25); color:#f87171;" title="Excluir Agente Definitivamente">
              🗑️
            </button>
          </div>

        </div>
      `;
    });

    grid.innerHTML = html;
  }

  async function toggleAgent(agentId, newStatus) {
    try {
      const res = await fetch('/api/swarm/agent-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        await fetchState();
      } else {
        alert('Erro: ' + (json.error || 'Falha ao alterar estado.'));
      }
    } catch (e) {
      alert('Erro de rede: ' + e.message);
    }
  }

  async function deleteAgent(agentId, agentName) {
    if (!confirm(`TEM CERTEZA? Deseja excluir permanentemente o Agente #${agentId} (${agentName}) do enxame?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/swarm/agent/${agentId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        await fetchState();
      } else {
        alert('Erro: ' + (json.error || 'Falha ao excluir agente.'));
      }
    } catch (e) {
      alert('Erro de conexão: ' + e.message);
    }
  }

  function promptAgentOrder(agentId, agentName) {
    const order = prompt(`[ORDEM SOBERANA] Digite a instrução direta para o Agente #${agentId} (${agentName}):\nEx: Crie o código-fonte da API com integração Stripe pronta.`);
    if (!order || !order.trim()) return;

    fetch('/api/swarm/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId,
        order: order.trim(),
        deliverableType: 'DOCUMENTO_OU_CODIGO'
      })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          alert(`Ordem transmitida com sucesso para ${agentName}!`);
          fetchState();
        } else {
          alert('Erro: ' + (res.error || 'Não foi possível transmitir ordem.'));
        }
      })
      .catch(e => alert('Erro de rede: ' + e.message));
  }

  function viewDeliverable(agentId) {
    if (!swarmState || !swarmState.agents) return;
    const agent = swarmState.agents.find(a => a.id === agentId);
    if (!agent) return;

    const modal = document.getElementById('swarm-deliverable-modal');
    const nameEl = document.getElementById('swarm-modal-agent-name');
    const metaEl = document.getElementById('swarm-modal-agent-meta');
    const contentEl = document.getElementById('swarm-modal-content');

    if (!modal || !nameEl || !contentEl) return;

    nameEl.textContent = `#${agent.id} • ${agent.name}`;
    metaEl.textContent = `Vertical: ${agent.sector} | Status: ${agent.status} | MRR: R$ ${(agent.projectedRevenueBRL || 0).toLocaleString('pt-BR')}/mês`;

    let bodyText = '';
    if (agent.deliverables && agent.deliverables.length > 0) {
      bodyText = agent.deliverables.map((d, idx) => {
        return `================================================================================\n[ENTREGÁVEL #${idx + 1}] - ${d.title}\nTipo: ${d.type} | Data: ${d.date}\n================================================================================\n\n${d.content}\n\n`;
      }).join('\n');
    } else {
      bodyText = 'Nenhum entregável compilado ainda. Envie uma ordem para este agente gerar código ou PRD.';
    }

    if (agent.orderHistory && agent.orderHistory.length > 0) {
      bodyText += `\n\n================================================================================\nHISTÓRICO DE ORDENS DO CRIADOR:\n================================================================================\n` +
        agent.orderHistory.map(o => `• [${o.date}] Ordem: "${o.order}" (Status: ${o.status})`).join('\n');
    }

    contentEl.textContent = bodyText;
    modal.style.display = 'flex';
  }

  // Inicialização Automática quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    fetchState,
    toggleAgent,
    deleteAgent,
    promptAgentOrder,
    viewDeliverable
  };
})();

window.Swarm100UI = Swarm100UI;
