/**
 * NEXUS World-Learner Organism UI (Organismo Criativo que Aprende com o Mundo)
 * 
 * Console Interativo da Administradora:
 *  - Observação de Padrões Ocultos Multimodais
 *  - Formulação Epistêmica de Hipóteses
 *  - Simulação de Consequências Futuras (1ª, 2ª e 3ª Ordem)
 *  - Galeria de Criações Sintetizadas
 *  - Controle Total da Administradora: Edição Imediata, Validação e Exclusão Segura
 */
const WorldOrganismUI = (function () {
  let organismData = null;
  const esc = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  async function loadDashboard() {
    try {
      const res = await fetch('/api/organism/dashboard');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      organismData = await res.json();
      renderStats();
      renderObservations();
      renderHypotheses();
      renderSimulations();
      renderCreations();
    } catch (e) {
      console.warn('Erro ao carregar organismo:', e.message);
    }
  }

  function renderStats() {
    if (!organismData?.stats) return;
    const s = organismData.stats;
    const c = organismData.counts || {};

    const accEl = document.getElementById('org-stat-acc');
    const hypCountEl = document.getElementById('org-stat-hypotheses');
    const simCountEl = document.getElementById('org-stat-simulations');
    const creatCountEl = document.getElementById('org-stat-creations');
    const intervenEl = document.getElementById('org-stat-interventions');

    if (accEl) accEl.textContent = `${(s.accuracyEvolutionScore * 100).toFixed(1)}%`;
    if (hypCountEl) hypCountEl.textContent = `${c.hypotheses || 0}`;
    if (simCountEl) simCountEl.textContent = `${c.simulations || 0}`;
    if (creatCountEl) creatCountEl.textContent = `${c.creations || 0}`;
    if (intervenEl) intervenEl.textContent = `${(s.creatorModifications || 0) + (s.creatorDeletions || 0)}`;
  }

  function renderObservations() {
    const list = document.getElementById('org-observations-list');
    if (!list) return;
    const obs = organismData?.observations || [];
    if (!obs.length) {
      list.innerHTML = '<div style="font-size:0.78rem;color:var(--text-secondary);padding:0.75rem">Nenhum sinal multimodal registrado no momento.</div>';
      return;
    }

    list.innerHTML = obs.slice(0, 6).map(o => `
      <div class="org-item-card" id="obs-card-${esc(o.id)}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem">
          <span class="org-pill cyan">[${esc(o.modality)}] • ${esc(o.source)}</span>
          <div style="display:flex;gap:0.3rem">
            <span style="font-size:0.68rem;color:var(--emerald);font-weight:700">${(o.confidence * 100).toFixed(0)}% Conf.</span>
            <button class="btn-micro-del" onclick="WorldOrganismUI.deleteObservationPrompt('${esc(o.id)}')">🗑️</button>
          </div>
        </div>
        <div style="font-size:0.78rem;font-weight:700;color:var(--text-primary);margin-bottom:0.25rem">${esc(o.detectedPattern)}</div>
        <div style="font-size:0.72rem;color:var(--text-secondary)"><em>Correlação Oculta:</em> ${esc(o.latentCorrelation)}</div>
      </div>
    `).join('');
  }

  function renderHypotheses() {
    const list = document.getElementById('org-hypotheses-list');
    if (!list) return;
    const hyps = organismData?.hypotheses || [];
    if (!hyps.length) {
      list.innerHTML = '<div style="font-size:0.78rem;color:var(--text-secondary);padding:0.75rem">Nenhuma hipótese formulada. Clique em "+ Nova Hipótese" acima.</div>';
      return;
    }

    list.innerHTML = hyps.map(h => `
      <div class="org-item-card" id="hyp-card-${esc(h.id)}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;flex-wrap:wrap;gap:0.3rem">
          <span class="org-pill purple">🌐 ${esc(h.domain)}</span>
          <span style="font-size:0.7rem;color:var(--cyan);font-family:var(--font-mono)">Prior Bayesiano: ${(h.bayesianPrior * 100).toFixed(1)}%</span>
        </div>
        <div style="font-size:0.86rem;font-weight:800;color:#fff;margin-bottom:0.3rem" id="hyp-title-${esc(h.id)}">${esc(h.title)}</div>
        <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.45;margin-bottom:0.45rem" id="hyp-premise-${esc(h.id)}">${esc(h.premise)}</div>
        <div style="font-size:0.72rem;color:var(--text-dim);margin-bottom:0.65rem"><em>Raciocínio Epistêmico:</em> ${esc(h.rationale)}</div>

        <!-- Action Bar da Administradora -->
        <div class="org-action-bar">
          <button class="org-btn" onclick="WorldOrganismUI.simulateHypothesis('${esc(h.id)}')" title="Simular 1ª, 2ª e 3ª ordem">🔮 Simular Futuro</button>
          <button class="org-btn" onclick="WorldOrganismUI.synthesizeFromHypothesis('${esc(h.id)}')" title="Materializar em criação/estratégia">🎨 Gerar Criação</button>
          <button class="org-btn" onclick="WorldOrganismUI.editHypothesisPrompt('${esc(h.id)}')" title="Editar diretamente">✏️ Editar</button>
          <button class="org-btn btn-danger" onclick="WorldOrganismUI.deleteHypothesisPrompt('${esc(h.id)}')" title="Apagar hipótese">🗑️ Apagar</button>
        </div>
      </div>
    `).join('');
  }

  function renderSimulations() {
    const list = document.getElementById('org-simulations-list');
    if (!list) return;
    const sims = organismData?.simulations || [];
    if (!sims.length) {
      list.innerHTML = '<div style="font-size:0.78rem;color:var(--text-secondary);padding:0.75rem">Nenhuma simulação contrafactual executada ainda.</div>';
      return;
    }

    list.innerHTML = sims.slice(0, 5).map(s => `
      <div class="org-item-card glow-cyan">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem">
          <span style="font-size:0.8rem;font-weight:800;color:var(--cyan)">🔮 ${esc(s.scenarioName)}</span>
          <span style="font-size:0.7rem;color:var(--emerald);font-weight:700">${esc(s.projectedGain)}</span>
        </div>
        <div class="sim-order-box order-1">
          <strong>1ª Ordem (Imediato):</strong> ${esc(s.immediateOutcome1st)}
        </div>
        <div class="sim-order-box order-2">
          <strong>2ª Ordem (Sistêmico):</strong> ${esc(s.systemicRipple2nd)}
        </div>
        <div class="sim-order-box order-3">
          <strong>3ª Ordem (Impacto Cultural / Longo Prazo):</strong> ${esc(s.societalImpact3rd)}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-dim);margin-top:0.4rem">
          <span>Índice de Risco: <strong>${esc(String(s.riskIndex))}</strong></span>
          <span>Conformidade Ética: <strong style="color:var(--emerald)">${s.ethicalPass ? '✓ Aprovado EU AI Act & LGPD' : 'Revisão Necessária'}</strong></span>
        </div>
      </div>
    `).join('');
  }

  function renderCreations() {
    const list = document.getElementById('org-creations-list');
    if (!list) return;
    const creats = organismData?.creations || [];
    if (!creats.length) {
      list.innerHTML = '<div style="font-size:0.78rem;color:var(--text-secondary);padding:0.75rem">Nenhuma criação personalizada sintetizada ainda.</div>';
      return;
    }

    list.innerHTML = creats.map(c => {
      const isAdopted = c.status === 'HOMOLOGADA_PELA_ADMINISTRADORA';
      const badgeColor = isAdopted ? 'var(--emerald)' : 'var(--amber)';
      const badgeText = isAdopted ? 'HOMOLOGADA ✓' : 'AGUARDANDO VALIDAÇÃO';

      return `
        <div class="org-item-card" id="creat-card-${esc(c.id)}" style="${isAdopted ? 'border-color:rgba(16,185,129,0.45);background:rgba(16,185,129,0.04)' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;flex-wrap:wrap;gap:0.3rem">
            <span class="org-pill cyan">[${esc(c.type).toUpperCase()}]</span>
            <span style="font-size:0.68rem;padding:2px 7px;border-radius:4px;border:1px solid ${badgeColor};color:${badgeColor};font-weight:700">
              ${badgeText}
            </span>
          </div>
          <div style="font-size:0.86rem;font-weight:800;color:#fff;margin-bottom:0.3rem" id="creat-title-${esc(c.id)}">${esc(c.title)}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.4;margin-bottom:0.5rem" id="creat-summary-${esc(c.id)}">${esc(c.summary)}</div>
          
          <div style="font-size:0.72rem;color:var(--text-primary);margin-bottom:0.65rem">
            <strong>Entregáveis Prontos:</strong>
            <ul style="margin:4px 0 0 16px;padding:0;color:var(--text-muted)">
              ${(c.deliverables || []).map(d => `<li>${esc(d)}</li>`).join('')}
            </ul>
          </div>

          <div class="org-action-bar">
            ${!isAdopted ? `<button class="org-btn btn-success" onclick="WorldOrganismUI.adoptCreation('${esc(c.id)}')">🎯 Homologar e Adotar</button>` : `<span style="font-size:0.72rem;color:var(--emerald);font-weight:700">✓ Em Operação Ativa</span>`}
            <button class="org-btn" onclick="WorldOrganismUI.editCreationPrompt('${esc(c.id)}')">✏️ Editar</button>
            <button class="org-btn btn-danger" onclick="WorldOrganismUI.deleteCreationPrompt('${esc(c.id)}')">🗑️ Apagar</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Ações da Administradora (Edição, Criação e Exclusão) ---

  async function ingestSignalPrompt() {
    const rawContent = prompt('Insira um sinal do mundo (texto, observação de comportamento, notícia ou dados de mercado):');
    if (!rawContent || !rawContent.trim()) return;

    try {
      const res = await fetch('/api/organism/observe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modality: 'multimodal_custom',
          source: 'Administradora / Entrada Direta',
          rawContent: rawContent.trim(),
          detectedPattern: `Padrão inserido pela Administradora: ${rawContent.trim().slice(0, 100)}`,
          latentCorrelation: 'Cruzamento imediato com a base neural de conhecimento.'
        })
      });
      if (!res.ok) throw new Error('Falha ao ingerir sinal');
      await loadDashboard();
      alert('Sinal ingerido com sucesso no Organismo Vivo!');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function createHypothesisPrompt() {
    const title = prompt('Título da Nova Hipótese:');
    if (!title || !title.trim()) return;
    const premise = prompt('Premissa causal da Hipótese:');
    if (!premise || !premise.trim()) return;

    try {
      const res = await fetch('/api/organism/hypothesis/formulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          premise: premise.trim(),
          domain: 'Inovação & Estratégia Soberana',
          rationale: 'Criada diretamente pela Administradora da plataforma.'
        })
      });
      if (!res.ok) throw new Error('Falha ao formular hipótese');
      await loadDashboard();
      alert('Hipótese formulada e indexada no Organismo!');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function editHypothesisPrompt(id) {
    const card = document.getElementById('hyp-card-' + id);
    const currTitle = card?.querySelector('#hyp-title-' + id)?.textContent || '';
    const currPremise = card?.querySelector('#hyp-premise-' + id)?.textContent || '';

    const newTitle = prompt('Novo título da hipótese:', currTitle);
    if (newTitle === null) return;
    const newPremise = prompt('Nova premissa causal da hipótese:', currPremise);
    if (newPremise === null) return;

    try {
      const res = await fetch('/api/organism/hypothesis/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          updates: { title: newTitle.trim() || currTitle, premise: newPremise.trim() || currPremise }
        })
      });
      if (!res.ok) throw new Error('Falha ao atualizar hipótese');
      await loadDashboard();
      alert('Hipótese atualizada pela Administradora!');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function deleteHypothesisPrompt(id) {
    if (!confirm('Tem certeza de que deseja apagar esta hipótese do organismo?')) return;
    try {
      const res = await fetch('/api/organism/hypothesis/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Falha ao apagar hipótese');
      await loadDashboard();
      alert('Hipótese apagada com sucesso da memória do Organismo.');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function simulateHypothesis(id) {
    try {
      const res = await fetch('/api/organism/hypothesis/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hypothesisId: id })
      });
      if (!res.ok) throw new Error('Falha ao executar simulação');
      await loadDashboard();
      alert('Simulação de 1ª, 2ª e 3ª ordem concluída com sucesso!');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function synthesizeFromHypothesis(id) {
    const title = prompt('Título da Criação / Estratégia:', 'Estratégia Derivada da Hipótese');
    if (!title || !title.trim()) return;

    try {
      const res = await fetch('/api/organism/creation/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hypothesisId: id,
          type: 'estrategia_operacional',
          title: title.trim(),
          summary: 'Solução sintetizada com matriz de consequências aprovadas.'
        })
      });
      if (!res.ok) throw new Error('Falha ao sintetizar criação');
      await loadDashboard();
      alert('Nova criação sintetizada pelo Organismo!');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function adoptCreation(id) {
    try {
      const res = await fetch('/api/organism/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creationId: id,
          feedback: 'Homologada e adotada pela Administradora.',
          validatedByCreator: true
        })
      });
      if (!res.ok) throw new Error('Falha ao adotar criação');
      await loadDashboard();
      alert('Criação homologada com sucesso e colocada em operação!');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function editCreationPrompt(id) {
    const card = document.getElementById('creat-card-' + id);
    const currTitle = card?.querySelector('#creat-title-' + id)?.textContent || '';
    const currSummary = card?.querySelector('#creat-summary-' + id)?.textContent || '';

    const newTitle = prompt('Novo título da criação:', currTitle);
    if (newTitle === null) return;
    const newSummary = prompt('Novo resumo / diretrizes da criação:', currSummary);
    if (newSummary === null) return;

    try {
      const res = await fetch('/api/organism/creation/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          updates: { title: newTitle.trim() || currTitle, summary: newSummary.trim() || currSummary }
        })
      });
      if (!res.ok) throw new Error('Falha ao atualizar criação');
      await loadDashboard();
      alert('Criação atualizada com sucesso!');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function deleteCreationPrompt(id) {
    if (!confirm('Tem certeza de que deseja apagar esta criação?')) return;
    try {
      const res = await fetch('/api/organism/creation/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Falha ao apagar criação');
      await loadDashboard();
      alert('Criação apagada da memória do Organismo.');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function deleteObservationPrompt(id) {
    if (!confirm('Deseja excluir esta observação do organismo?')) return;
    try {
      const res = await fetch('/api/organism/observation/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Falha ao apagar observação');
      await loadDashboard();
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  function init() {
    loadDashboard();
    document.getElementById('btn-org-ingest')?.addEventListener('click', ingestSignalPrompt);
    document.getElementById('btn-org-new-hyp')?.addEventListener('click', createHypothesisPrompt);
    document.getElementById('btn-org-refresh')?.addEventListener('click', loadDashboard);
  }

  return {
    init,
    loadDashboard,
    ingestSignalPrompt,
    createHypothesisPrompt,
    editHypothesisPrompt,
    deleteHypothesisPrompt,
    simulateHypothesis,
    synthesizeFromHypothesis,
    adoptCreation,
    editCreationPrompt,
    deleteCreationPrompt,
    deleteObservationPrompt
  };
})();

window.WorldOrganismUI = WorldOrganismUI;
