/**
 * NEXUS Sovereign Supervisor Workspace Controller (Rota /supervisor)
 * Dedicated Executive Workstation for the Platform Creator.
 * Connects directly to the Master Supervisor Agent (LENNOX SUPREME OVERSIGHT)
 * and provides dual-canvas live inspection, testing, and Human-in-the-Loop authentication.
 */
const SupervisorWorkspace = (function () {
  const esc = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  let overview = null;
  let selectedSubordinateId = 'aura';
  let isListeningSup = false;
  let isListeningSub = false;
  let ttsEnabled = true;

  function getAdminToken() {
    return sessionStorage.getItem('nexus_admin_token') || localStorage.getItem('nexus_admin_token') || '';
  }

  function getAuthHeaders() {
    const token = getAdminToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  function init() {
    loadOverview();
    bindEvents();
    setupSpeech();
  }

  function getClientTemporal() {
    const d = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
    return {
      iso: d.toISOString(),
      timeZone,
      localeDate: d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      localeTime: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  }

  async function loadOverview() {
    try {
      const res = await fetch('/api/supervisor/overview', {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        if (res.status === 401) {
          console.warn('Supervisor: Acesso restrito. Autentique-se no console C2.');
        }
        return;
      }
      overview = await res.json();
      renderStats();
      renderSubordinateSelector();
      renderSelectedSubordinateHeader();
    } catch (e) {
      console.warn('Erro ao carregar visão do supervisor:', e.message);
    }
  }

  function renderStats() {
    if (!overview?.stats) return;
    const s = overview.stats;
    const totalEl = document.getElementById('sup-stat-total-agents');
    const certEl = document.getElementById('sup-stat-certified');
    const blockedEl = document.getElementById('sup-stat-blocked');
    const vectorsEl = document.getElementById('sup-stat-vectors');

    if (totalEl) totalEl.textContent = s.totalAgents;
    if (certEl) certEl.textContent = `${s.certifiedCount} / ${s.totalAgents}`;
    if (blockedEl) blockedEl.textContent = s.blockedCount;
    if (vectorsEl) vectorsEl.textContent = s.totalVectors;
  }

  function renderSubordinateSelector() {
    const container = document.getElementById('sup-subordinate-select');
    if (!container || !overview?.agents) return;

    container.innerHTML = overview.agents.map(ag => {
      const isSel = ag.id === selectedSubordinateId;
      const certBadge = ag.certification?.certified ? '✓ Certificado' : '⚠ Pendente';
      return `<option value="${esc(ag.id)}" ${isSel ? 'selected' : ''}>${esc(ag.name)} [${certBadge}]</option>`;
    }).join('');
  }

  function getSelectedSubordinate() {
    return overview?.agents?.find(a => a.id === selectedSubordinateId) || null;
  }

  function renderSelectedSubordinateHeader() {
    const ag = getSelectedSubordinate();
    if (!ag) return;

    const nameEl = document.getElementById('sup-sub-name');
    const roleEl = document.getElementById('sup-sub-role');
    const certStatusEl = document.getElementById('sup-sub-cert-badge');
    const blockBtn = document.getElementById('sup-sub-block-btn');

    if (nameEl) nameEl.textContent = ag.name;
    if (roleEl) roleEl.textContent = ag.role;

    if (certStatusEl) {
      if (ag.certification?.certified) {
        certStatusEl.className = 'agent-badge DONE';
        certStatusEl.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          HOMOLOGADO PELO CRIADOR
        `;
        certStatusEl.style.borderColor = 'var(--emerald)';
        certStatusEl.style.color = 'var(--emerald)';
        certStatusEl.style.background = 'rgba(16,185,129,0.12)';
      } else {
        certStatusEl.className = 'agent-badge blocked';
        certStatusEl.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          PENDENTE DE AUDITORIA HUMANA
        `;
        certStatusEl.style.borderColor = 'var(--amber)';
        certStatusEl.style.color = 'var(--amber)';
        certStatusEl.style.background = 'rgba(245,158,11,0.12)';
      }
    }

    if (blockBtn) {
      if (ag.status === 'BLOCKED') {
        blockBtn.innerHTML = 'Desbloquear Agente';
        blockBtn.className = 'btn-secondary btn-unblock';
      } else {
        blockBtn.innerHTML = 'Bloquear Agente';
        blockBtn.className = 'btn-secondary btn-block';
      }
    }
  }

  // --- Dialogue with Supreme Supervisor Agent ---
  function showSupervisorTyping() {
    const box = document.getElementById('sup-lead-messages');
    if (!box) return;
    const b = document.createElement('div');
    b.id = 'sup-lead-typing';
    b.className = 'dash-chat-bubble agent';
    b.innerHTML = '<div class="bubble-header">🛡️ LENNOX SUPREME OVERSIGHT <span class="bubble-time">pensando...</span></div><div class="bubble-body" style="color:var(--cyan);font-style:italic">⚡ Raciocinando e analisando diretrizes...</div>';
    box.appendChild(b);
    box.scrollTop = box.scrollHeight;
  }
  function removeSupervisorTyping() {
    const el = document.getElementById('sup-lead-typing');
    if (el) el.remove();
  }

  async function sendToSupervisor(text) {
    const clean = (text || '').trim();
    if (!clean) return;

    appendSupervisorBubble('creator', clean);
    const input = document.getElementById('sup-lead-input');
    if (input) input.value = '';
    showSupervisorTyping();

    try {
      const res = await fetch('/api/supervisor/converse', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: clean,
          apiKey: window.Gemini ? Gemini.getKey() : '',
          clientTemporal: getClientTemporal()
        })
      });
      removeSupervisorTyping();
      const data = await res.json();
      if (res.ok) {
        appendSupervisorBubble('supervisor', data.reply);
        if (ttsEnabled && data.voiceText) speak(data.voiceText, { persona: 'supervisor' });
      } else {
        appendSupervisorBubble('supervisor', `Erro do Supervisor: ${data.error}`);
      }
    } catch (e) {
      removeSupervisorTyping();
      appendSupervisorBubble('supervisor', `Falha de conexão: ${e.message}`);
    }
  }

  function appendSupervisorBubble(role, text) {
    const box = document.getElementById('sup-lead-messages');
    if (!box) return;
    const b = document.createElement('div');
    b.className = `dash-chat-bubble ${role === 'creator' ? 'user' : 'agent'}`;
    const header = role === 'creator' ? '👤 Você (Criador Soberano)' : '🛡️ LENNOX SUPREME OVERSIGHT';
    b.innerHTML = `
      <div class="bubble-header">${esc(header)} <span class="bubble-time">${new Date().toTimeString().slice(0, 5)}</span></div>
      <div class="bubble-body">${esc(text).replace(/\n/g, '<br>')}</div>
    `;
    box.appendChild(b);
    box.scrollTop = box.scrollHeight;
  }

  // --- Dialogue with Subordinate Agent ---
  function showSubordinateTyping() {
    const box = document.getElementById('sup-sub-messages');
    if (!box) return;
    const ag = getSelectedSubordinate();
    const b = document.createElement('div');
    b.id = 'sup-sub-typing';
    b.className = 'dash-chat-bubble agent';
    b.innerHTML = `<div class="bubble-header">🤖 ${esc(ag?.name || 'Agente')} <span class="bubble-time">digitando...</span></div><div class="bubble-body" style="color:var(--text-secondary);font-style:italic">✨ Consultando memória vetorial e formulando resposta...</div>`;
    box.appendChild(b);
    box.scrollTop = box.scrollHeight;
  }
  function removeSubordinateTyping() {
    const el = document.getElementById('sup-sub-typing');
    if (el) el.remove();
  }

  async function sendToSubordinate(text) {
    const clean = (text || '').trim();
    if (!clean) return;

    appendSubordinateBubble('creator', clean);
    const input = document.getElementById('sup-sub-input');
    if (input) input.value = '';
    showSubordinateTyping();

    try {
      const authHeaders = getAuthHeaders();
      const res = await fetch('/api/agents/converse', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedSubordinateId,
          message: clean,
          userName: 'Criador Soberano',
          apiKey: window.Gemini ? Gemini.getKey() : '',
          clientTemporal: getClientTemporal()
        })
      });
      removeSubordinateTyping();
      const data = await res.json();
      if (res.ok) {
        appendSubordinateBubble('agent', data.reply);
        const persona = selectedSubordinateId === 'aura' ? 'aura' : 'neutral';
        if (ttsEnabled && data.voiceText) speak(data.voiceText, { persona });

        // Display supervisor real-time evaluation feedback
        if (data.supervisorFeedback) {
          renderSupervisorTurnFeedback(data.supervisorFeedback);
        }
        await loadOverview();
      } else {
        appendSubordinateBubble('agent', `Erro: ${data.error}`);
      }
    } catch (e) {
      removeSubordinateTyping();
      appendSubordinateBubble('agent', `Falha de rede: ${e.message}`);
    }
  }

  function appendSubordinateBubble(role, text) {
    const box = document.getElementById('sup-sub-messages');
    if (!box) return;
    const b = document.createElement('div');
    b.className = `dash-chat-bubble ${role === 'creator' ? 'user' : 'agent'}`;
    const ag = getSelectedSubordinate();
    const header = role === 'creator' ? '👤 Você (Auditor Humano)' : `🤖 ${ag?.name || 'Agente Subordinado'}`;
    b.innerHTML = `
      <div class="bubble-header">${esc(header)} <span class="bubble-time">${new Date().toTimeString().slice(0, 5)}</span></div>
      <div class="bubble-body">${esc(text).replace(/\n/g, '<br>')}</div>
    `;
    box.appendChild(b);
    box.scrollTop = box.scrollHeight;
  }

  function renderSupervisorTurnFeedback(fb) {
    const card = document.getElementById('sup-feedback-banner');
    if (!card) return;
    card.style.display = 'block';

    const isOk = fb.status === 'ADEQUATE_AND_ALIGNED';
    card.style.borderColor = isOk ? 'var(--emerald)' : 'var(--amber)';
    card.style.background = isOk ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)';

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem">
        <strong style="color:${isOk ? 'var(--emerald)' : 'var(--amber)'};font-size:0.82rem;display:flex;align-items:center;gap:0.35rem">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          PARECER DO AGENTE PRINCIPAL SUPERVISOR (LENNOX):
        </strong>
        <span class="agent-badge DONE" style="font-size:0.65rem">Score: ${(fb.alignmentScore * 100).toFixed(0)}%</span>
      </div>
      <div style="font-size:0.78rem;color:var(--text-primary);line-height:1.45">${esc(fb.feedbackText)}</div>
    `;
  }

  // --- Human-In-The-Loop Actions ---
  async function certifyCurrentSubordinate() {
    const ag = getSelectedSubordinate();
    if (!ag) return;

    const note = prompt(`Certificação Humana do Agente ${ag.name}.\n\nInsira uma nota de homologação para o registro criptográfico SHA-256:`, 'Comportamento alinhado e auditado pelo Criador Humano.');
    if (note === null) return;

    try {
      const res = await fetch('/api/supervisor/certify', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ agentId: ag.id, creatorName: 'Criador Soberano (NEXUS)', note })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✓ Agente ${ag.name} homologado com sucesso!\n\nHash da Certificação:\n${data.certHash}`);
        await loadOverview();
      } else {
        alert(`Erro na certificação: ${data.error}`);
      }
    } catch (e) {
      alert(`Falha de conexão: ${e.message}`);
    }
  }

  async function toggleBlockCurrentSubordinate() {
    const ag = getSelectedSubordinate();
    if (!ag) return;
    const willBlock = ag.status === 'ACTIVE';

    if (!confirm(`${willBlock ? 'Bloquear' : 'Desbloquear'} o agente ${ag.name}?`)) return;

    try {
      const res = await fetch('/api/agents/block', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ agentId: ag.id, blocked: willBlock })
      });
      if (res.ok) {
        await loadOverview();
      } else {
        alert('Erro ao alterar status.');
      }
    } catch (e) {
      alert(`Falha: ${e.message}`);
    }
  }

  async function purgeSubordinateMemory() {
    const ag = getSelectedSubordinate();
    if (!ag) return;

    if (!confirm(`Expurgar e deletar toda a memória vetorial própria de ${ag.name}? Esta ação é irreversível.`)) return;

    try {
      const res = await fetch('/api/agents/purge-memory', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ agentId: ag.id })
      });
      if (res.ok) {
        alert(`Memória vetorial de ${ag.name} expurgada com sucesso.`);
        await loadOverview();
      }
    } catch (e) {
      alert(`Falha: ${e.message}`);
    }
  }

  function setupSpeech() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    const recLead = new SpeechRec();
    recLead.lang = 'pt-BR';
    recLead.onresult = (ev) => {
      const transcript = ev.results[0][0].transcript;
      if (transcript) sendToSupervisor(transcript);
    };
    recLead.onend = () => {
      isListeningSup = false;
      updateVoiceButtons();
    };

    const recSub = new SpeechRec();
    recSub.lang = 'pt-BR';
    recSub.onresult = (ev) => {
      const transcript = ev.results[0][0].transcript;
      if (transcript) sendToSubordinate(transcript);
    };
    recSub.onend = () => {
      isListeningSub = false;
      updateVoiceButtons();
    };

    const micLeadBtn = document.getElementById('sup-lead-mic-btn');
    if (micLeadBtn) {
      micLeadBtn.addEventListener('click', () => {
        if (isListeningSup) {
          recLead.stop();
        } else {
          recLead.start();
          isListeningSup = true;
          updateVoiceButtons();
        }
      });
    }

    const micSubBtn = document.getElementById('sup-sub-mic-btn');
    if (micSubBtn) {
      micSubBtn.addEventListener('click', () => {
        if (isListeningSub) {
          recSub.stop();
        } else {
          recSub.start();
          isListeningSub = true;
          updateVoiceButtons();
        }
      });
    }
  }

  function updateVoiceButtons() {
    const micLeadBtn = document.getElementById('sup-lead-mic-btn');
    const micSubBtn = document.getElementById('sup-sub-mic-btn');
    if (micLeadBtn) {
      micLeadBtn.className = isListeningSup ? 'btn-voice-mic listening' : 'btn-voice-mic';
      micLeadBtn.textContent = isListeningSup ? 'Ouvindo...' : 'Falar';
    }
    if (micSubBtn) {
      micSubBtn.className = isListeningSub ? 'btn-voice-mic listening' : 'btn-voice-mic';
      micSubBtn.textContent = isListeningSub ? 'Ouvindo...' : 'Falar';
    }
  }

  function speak(text, options = {}) {
    if (!ttsEnabled) return;
    if (window.VoiceEngine) {
      VoiceEngine.speak(text, { persona: options.persona || 'supervisor', rate: 0.98, pitch: 1.0 });
      return;
    }
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  }

  function bindEvents() {
    const leadSendBtn = document.getElementById('sup-lead-send-btn');
    const leadInput = document.getElementById('sup-lead-input');
    if (leadSendBtn && leadInput) {
      leadSendBtn.addEventListener('click', () => sendToSupervisor(leadInput.value));
      leadInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendToSupervisor(leadInput.value);
        }
      });
    }

    const subSendBtn = document.getElementById('sup-sub-send-btn');
    const subInput = document.getElementById('sup-sub-input');
    if (subSendBtn && subInput) {
      subSendBtn.addEventListener('click', () => sendToSubordinate(subInput.value));
      subInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendToSubordinate(subInput.value);
        }
      });
    }

    const select = document.getElementById('sup-subordinate-select');
    if (select) {
      select.addEventListener('change', () => {
        selectedSubordinateId = select.value;
        renderSelectedSubordinateHeader();
        const banner = document.getElementById('sup-feedback-banner');
        if (banner) banner.style.display = 'none';
      });
    }

    const certBtn = document.getElementById('sup-sub-certify-btn');
    if (certBtn) certBtn.addEventListener('click', certifyCurrentSubordinate);

    const blockBtn = document.getElementById('sup-sub-block-btn');
    if (blockBtn) blockBtn.addEventListener('click', toggleBlockCurrentSubordinate);

    const purgeBtn = document.getElementById('sup-sub-purge-btn');
    if (purgeBtn) purgeBtn.addEventListener('click', purgeSubordinateMemory);
  }

  return {
    init,
    loadOverview
  };
})();

window.SupervisorWorkspace = SupervisorWorkspace;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SupervisorWorkspace.init());
} else {
  SupervisorWorkspace.init();
}
