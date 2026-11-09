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
    paid_curation: '📬',
    ml_high_ticket: '📱',
    ml_viral_deals: '🔥',
    ml_home_decor: '🏡',
    ml_auto_tech: '🚗',
    ml_beauty_health: '✨'
  };

  async function init() {
    bindEvents();
    await fetchState();
    await fetchPayoutSettings();
    startPolling();
  }

  async function fetchPayoutSettings() {
    try {
      const res = await fetch('/api/swarm/payout-settings');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.pixKey) {
        const typeEl = document.getElementById('payout-pix-type');
        const keyEl = document.getElementById('payout-pix-key');
        const nameEl = document.getElementById('payout-holder-name');
        const bankEl = document.getElementById('payout-bank-name');
        const msgEl = document.getElementById('payout-status-msg');

        if (typeEl && data.pixType) typeEl.value = data.pixType;
        if (keyEl && data.pixKey) keyEl.value = data.pixKey;
        if (nameEl && data.holderName) nameEl.value = data.holderName;
        if (bankEl && data.bankName) bankEl.value = data.bankName;
        if (msgEl) {
          msgEl.innerHTML = `<span style="color:#10b981;">✓ Conta ativa para recebimento: Chave Pix cadastrada (${data.pixKey}) vinculada a ${data.holderName || 'Proprietária'}.</span>`;
        }
      }
    } catch (_) {}
  }

  async function savePayoutSettings() {
    const typeEl = document.getElementById('payout-pix-type');
    const keyEl = document.getElementById('payout-pix-key');
    const nameEl = document.getElementById('payout-holder-name');
    const bankEl = document.getElementById('payout-bank-name');
    const btn = document.getElementById('payout-save-btn');
    const msgEl = document.getElementById('payout-status-msg');

    const pixKey = keyEl ? keyEl.value.trim() : '';
    if (!pixKey) {
      alert('Por favor, informe sua chave Pix para receber os pagamentos.');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Salvando Cofragem...';
    }

    try {
      const res = await fetch('/api/swarm/payout-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pixType: typeEl ? typeEl.value : 'cpf',
          pixKey,
          holderName: nameEl ? nameEl.value.trim() : '',
          bankName: bankEl ? bankEl.value.trim() : ''
        })
      });

      const json = await res.json();
      if (json.success) {
        if (msgEl) {
          msgEl.innerHTML = `<span style="color:#10b981; font-weight:700;">✓ SUCESSO: Conta salva! Chave Pix configurada com sucesso. Os rendimentos serão direcionados para esta conta.</span>`;
        }
        alert('Conta cadastrada com sucesso! Todas as soluções e comissões estão direcionadas para a sua chave Pix.');
      } else {
        alert('Erro ao salvar conta: ' + (json.error || 'Erro desconhecido'));
      }
    } catch (e) {
      alert('Erro de conexão ao salvar conta: ' + e.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💾 Salvar Minha Conta para Recebimento';
      }
    }
  }

  function bindEvents() {
    // Botão de Aceleração para 100% (Produção Imediata)
    const accBtn = document.getElementById('swarm-accelerate-btn');
    if (accBtn) {
      accBtn.addEventListener('click', async () => {
        if (!confirm('Deseja acelerar todos os 150 agentes para 100% de conclusão do projeto e colocá-los em modo de produção máxima imediatamente?')) return;
        accBtn.textContent = '🚀 Acelerando...';
        accBtn.disabled = true;
        try {
          const res = await fetch('/api/swarm/accelerate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          alert(data.message || 'Todos os agentes foram promovidos para 100% com sucesso!');
          await fetchState();
        } catch (e) {
          alert('Erro ao acelerar agentes: ' + e.message);
        } finally {
          accBtn.textContent = '🚀 Acelerar Todos para 100% (Produção Imediata)';
          accBtn.disabled = false;
        }
      });
    }

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
                <span style="font-size:0.65rem; color:#64748b; font-family:var(--font-mono);">${agent.id > 100 ? 'COMISSÃO ESTIMADA:' : 'RECEITA ESTIMADA:'}</span>
                <span style="font-size:0.78rem; font-weight:700; color:#10b981; font-family:var(--font-mono);">${mrrFormatted}/mês</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:0.65rem; color:#64748b; font-family:var(--font-mono);">${agent.id > 100 ? 'CANAL / HUB:' : 'DOMÍNIO ALVO:'}</span>
                <span style="font-size:0.72rem; color:#38bdf8; font-family:var(--font-mono);">${agent.id > 100 ? 'Mercado Livre (CASTILLOOFFICIAL)' : agent.requiredDomain}</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.65rem; color:#64748b; font-family:var(--font-mono);">${agent.id > 100 ? 'RECURSOS HUB:' : 'GATEWAY/CREDS:'}</span>
                <span style="font-size:0.68rem; color:#cbd5e1; font-family:var(--font-mono); max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${credsList}">${credsList}</span>
              </div>
            </div>

            <!-- Project Progress Indicator & Visual Status -->
            <div style="background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:0.6rem; margin-bottom:0.75rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:0.65rem; color:#94a3b8; font-family:var(--font-mono); font-weight:700;">ANDAMENTO DO PROJETO:</span>
                <span style="font-size:0.7rem; font-weight:800; color:${isRunning ? '#10b981' : '#f59e0b'}; font-family:var(--font-mono);">
                  ${agent.projectProgress ? agent.projectProgress.progressPercent : (isRunning ? 75 : 0)}%
                </span>
              </div>
              
              <!-- Progress Bar -->
              <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; margin-bottom:6px;">
                <div style="width:${agent.projectProgress ? agent.projectProgress.progressPercent : (isRunning ? 75 : 0)}%; height:100%; background:linear-gradient(90deg, #00f5ff, #10b981); transition:width 0.4s ease;"></div>
              </div>

              <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#64748b; font-family:var(--font-mono);">
                <span>Fase: <strong style="color:#e2e8f0">${agent.projectProgress ? agent.projectProgress.stage : (isRunning ? 'OPERANDO' : 'PARADO')}</strong></span>
                <span style="color:#38bdf8">${isRunning ? '⚡ Projeto Ativo' : '⏸️ Projeto Pausado'}</span>
              </div>
            </div>

            <!-- Current Mission -->
            <div style="font-size:0.68rem; color:#64748b; margin-bottom:10px; font-family:var(--font-mono); line-height:1.3;">
              <span style="color:#e2e8f0; font-weight:600;">Missão Atual:</span> ${agent.currentMission || 'Em execução contínua.'}
            </div>
          </div>

          <!-- Actions Toolbar -->
          <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:0.75rem; display:flex; flex-direction:column; gap:0.45rem;">
            
            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem;">
              <!-- Start / Pause Toggle Button -->
              <button class="btn-secondary" onclick="Swarm100UI.toggleAgent(${agent.id}, '${isRunning ? 'PAUSADO' : 'EXECUTANDO'}')" style="font-size:0.7rem; padding:0.4rem 0.6rem; flex:1.2; font-weight:700; background:${isRunning ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.15)'}; border-color:${isRunning ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.4)'}; color:${isRunning ? '#f87171' : '#10b981'}; display:flex; align-items:center; justify-content:center; gap:4px;" title="${isRunning ? 'Parar este Projeto' : 'Iniciar este Projeto'}">
                <span>${isRunning ? '⏸️ Parar Projeto' : '▶️ Iniciar Projeto'}</span>
              </button>

              <!-- Interactive Direct Agent Chat -->
              <button class="btn-primary" onclick="Swarm100UI.openAgentChatModal(${agent.id})" style="font-size:0.7rem; padding:0.4rem 0.6rem; flex:1.4; border-color:rgba(0,245,255,0.4); color:#020617; background:#00f5ff; font-weight:800; display:flex; align-items:center; justify-content:center; gap:4px;" title="Conversar em tempo real com este agente para alterar ou continuar o projeto">
                <span>💬 Falar com Agente</span>
              </button>

              <button class="btn-secondary" onclick="Swarm100UI.deleteAgent(${agent.id}, '${agent.name}')" style="font-size:0.7rem; padding:0.4rem 0.5rem; border-color:rgba(239,68,68,0.25); color:#f87171;" title="Excluir Agente Definitivamente">
                🗑️
              </button>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem;">
              <button class="btn-secondary" onclick="Swarm100UI.viewDeliverable(${agent.id})" style="font-size:0.68rem; padding:0.35rem 0.5rem; flex:1; display:flex; align-items:center; justify-content:center; gap:4px;" title="Ver Relatórios, Códigos e Links Gerados">
                <span>📄 Entregas (${delivCount})</span>
              </button>

              <!-- Single-Click Config & Confirmation Panel Trigger -->
              <button class="btn-secondary" onclick="Swarm100UI.openConfigModal(${agent.id})" style="font-size:0.68rem; padding:0.35rem 0.5rem; flex:1.6; display:flex; align-items:center; justify-content:center; gap:4px; border-color:rgba(16,185,129,0.3); color:#34d399;" title="Inserir Dados, Domínios ou Chaves de API">
                <span>⚙️ Dados, Domínio &amp; API</span>
              </button>
            </div>

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

  function openConfigModal(agentId) {
    if (!swarmState || !swarmState.agents) return;
    const agent = swarmState.agents.find(a => a.id === agentId);
    if (!agent) return;

    const modal = document.getElementById('swarm-config-modal');
    const titleEl = document.getElementById('swarm-config-agent-title');
    const roleEl = document.getElementById('swarm-config-agent-role');
    const idInput = document.getElementById('swarm-config-agent-id');
    const domainInput = document.getElementById('swarm-config-domain');
    const apiKeyInput = document.getElementById('swarm-config-apikey');
    const linkInput = document.getElementById('swarm-config-link');

    if (!modal || !titleEl) return;

    titleEl.textContent = `#${agent.id} • ${agent.name}`;
    roleEl.textContent = agent.role;
    idInput.value = agent.id;

    const cfgs = agent.customConfigs || {};
    domainInput.value = cfgs.domain || agent.requiredDomain || '';
    apiKeyInput.value = cfgs.apiKey || '';
    linkInput.value = cfgs.customLink || (agent.activeProduct ? agent.activeProduct.link : '');

    modal.style.display = 'flex';
  }

  async function submitAgentConfig() {
    const idInput = document.getElementById('swarm-config-agent-id');
    const domainInput = document.getElementById('swarm-config-domain');
    const apiKeyInput = document.getElementById('swarm-config-apikey');
    const linkInput = document.getElementById('swarm-config-link');
    const modal = document.getElementById('swarm-config-modal');
    const saveBtn = document.getElementById('swarm-config-save-btn');

    if (!idInput) return;
    const agentId = idInput.value;

    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando & Confirmando...';

    try {
      const res = await fetch('/api/swarm/agent-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          domain: domainInput ? domainInput.value.trim() : '',
          apiKey: apiKeyInput ? apiKeyInput.value.trim() : '',
          customLink: linkInput ? linkInput.value.trim() : '',
          confirmed: true
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message || 'Configuração confirmada com sucesso!');
        modal.style.display = 'none';
        await fetchState();
      } else {
        alert('Erro: ' + (json.error || 'Falha ao salvar.'));
      }
    } catch (e) {
      alert('Erro de rede: ' + e.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = '✓ Confirmar e Colocar em Operação';
    }
  }

  function openAgentChatModal(agentId) {
    if (!swarmState || !swarmState.agents) return;
    const agent = swarmState.agents.find(a => a.id === agentId);
    if (!agent) return;

    const modal = document.getElementById('swarm-chat-modal');
    const titleEl = document.getElementById('swarm-chat-agent-title');
    const metaEl = document.getElementById('swarm-chat-agent-meta');
    const idInput = document.getElementById('swarm-chat-agent-id');
    const msgsContainer = document.getElementById('swarm-chat-messages');
    const chatInput = document.getElementById('swarm-chat-input');

    if (!modal || !titleEl || !msgsContainer) return;

    titleEl.textContent = `💬 Conversar com #${agent.id} • ${agent.name}`;
    metaEl.textContent = `${agent.role} | Status: ${agent.status} | Progresso: ${agent.projectProgress ? agent.projectProgress.progressPercent : 75}%`;
    idInput.value = agent.id;

    renderChatHistory(agent);

    modal.style.display = 'flex';
    if (chatInput) {
      chatInput.value = '';
      setTimeout(() => chatInput.focus(), 100);
    }
  }

  function renderChatHistory(agent) {
    const msgsContainer = document.getElementById('swarm-chat-messages');
    if (!msgsContainer) return;

    const history = agent.chatHistory || [];
    if (history.length === 0) {
      msgsContainer.innerHTML = `
        <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(0,245,255,0.2); border-radius:8px; padding:10px 14px; font-size:0.78rem; color:#cbd5e1; line-height:1.45;">
          <strong>${agent.name} (Líder do Projeto):</strong> Olá Criador! Estou operando com foco total em ${agent.role}. Envie qualquer dúvida, link, alteração de rumo ou diretriz para continuarmos com máxima precisão.
        </div>
      `;
      return;
    }

    msgsContainer.innerHTML = history.map(h => {
      const isUser = h.sender === 'user';
      return `
        <div style="display:flex; flex-direction:column; align-self:${isUser ? 'flex-end' : 'flex-start'}; max-width:85%; margin-bottom:8px;">
          <span style="font-size:0.62rem; color:#64748b; font-family:var(--font-mono); margin-bottom:2px; ${isUser ? 'text-align:right' : ''}">
            ${isUser ? 'Você (Criador)' : agent.name} • ${new Date(h.timestamp || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div style="background:${isUser ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(15,23,42,0.9)'}; color:#f8fafc; border:${isUser ? 'none' : '1px solid rgba(0,245,255,0.2)'}; border-radius:10px; padding:10px 14px; font-size:0.78rem; line-height:1.5; white-space:pre-wrap;">${h.message}</div>
        </div>
      `;
    }).join('');

    msgsContainer.scrollTop = msgsContainer.scrollHeight;
  }

  async function sendAgentChatMessage() {
    const idInput = document.getElementById('swarm-chat-agent-id');
    const input = document.getElementById('swarm-chat-input');
    const sendBtn = document.getElementById('swarm-chat-send-btn');
    const msgsContainer = document.getElementById('swarm-chat-messages');

    if (!idInput || !input) return;
    const agentId = idInput.value;
    const message = input.value.trim();
    if (!message) return;

    // Renderiza mensagem do usuário imediatamente
    const userBubble = document.createElement('div');
    userBubble.style.cssText = 'display:flex; flex-direction:column; align-self:flex-end; max-width:85%; margin-bottom:8px;';
    userBubble.innerHTML = `
      <span style="font-size:0.62rem; color:#64748b; font-family:var(--font-mono); margin-bottom:2px; text-align:right">Você (Criador)</span>
      <div style="background:linear-gradient(135deg, #0284c7, #2563eb); color:#f8fafc; border-radius:10px; padding:10px 14px; font-size:0.78rem; line-height:1.5;">${message}</div>
    `;
    msgsContainer.appendChild(userBubble);
    msgsContainer.scrollTop = msgsContainer.scrollHeight;

    input.value = '';
    sendBtn.disabled = true;
    sendBtn.textContent = 'Pensando...';

    // Bubble temporária de carregamento
    const loadingBubble = document.createElement('div');
    loadingBubble.id = 'swarm-chat-loading-bubble';
    loadingBubble.style.cssText = 'display:flex; flex-direction:column; align-self:flex-start; max-width:85%; margin-bottom:8px;';
    loadingBubble.innerHTML = `
      <span style="font-size:0.62rem; color:#64748b; font-family:var(--font-mono); margin-bottom:2px;">Agente</span>
      <div style="background:rgba(15,23,42,0.9); border:1px solid rgba(0,245,255,0.2); color:#94a3b8; border-radius:10px; padding:10px 14px; font-size:0.78rem;">Processando raciocínio...</div>
    `;
    msgsContainer.appendChild(loadingBubble);
    msgsContainer.scrollTop = msgsContainer.scrollHeight;

    try {
      const res = await fetch('/api/swarm/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, message })
      });
      const json = await res.json();

      const loadingEl = document.getElementById('swarm-chat-loading-bubble');
      if (loadingEl) loadingEl.remove();

      if (json.success) {
        const agentBubble = document.createElement('div');
        agentBubble.style.cssText = 'display:flex; flex-direction:column; align-self:flex-start; max-width:85%; margin-bottom:8px;';
        agentBubble.innerHTML = `
          <span style="font-size:0.62rem; color:#64748b; font-family:var(--font-mono); margin-bottom:2px;">${json.name}</span>
          <div style="background:rgba(15,23,42,0.9); border:1px solid rgba(0,245,255,0.2); color:#f8fafc; border-radius:10px; padding:10px 14px; font-size:0.78rem; line-height:1.5; white-space:pre-wrap;">${json.reply}</div>
        `;
        msgsContainer.appendChild(agentBubble);
        msgsContainer.scrollTop = msgsContainer.scrollHeight;

        // Atualiza o estado em memória local
        const targetAgent = swarmState.agents.find(a => String(a.id) === String(agentId));
        if (targetAgent) {
          targetAgent.chatHistory = json.chatHistory;
        }
      } else {
        alert('Erro ao falar com agente: ' + (json.error || 'Erro desconhecido'));
      }
    } catch (e) {
      alert('Erro de conexão: ' + e.message);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Enviar ⚡';
    }
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
    viewDeliverable,
    openConfigModal,
    submitAgentConfig,
    openAgentChatModal,
    sendAgentChatMessage,
    savePayoutSettings
  };
})();

window.Swarm100UI = Swarm100UI;
