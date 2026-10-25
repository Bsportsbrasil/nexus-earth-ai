/**
 * NEXUS Sovereign Multi-Agent Evaluation, Voice/Text Conversation & Memory Hub UI
 * Dedicated dashboard separating regular User access (1 dedicated personal agent)
 * from Administrator/Creator access (complete multi-agent management, blocking,
 * deletion, updating, creation, and individual vector testing).
 */
const AgentDashboardUI = (function () {
  const esc = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  let currentOverview = null;
  let activeAgentId = 'aura';
  let isListening = false;
  let ttsEnabled = true;
  let recognizer = null;
  let isProcessingTurn = false;

  function isAdminMode() {
    if (typeof window === 'undefined') return false;
    if (window.location.pathname.includes('admin') || window.location.hash.includes('admin')) return true;
    if (sessionStorage.getItem('nexus_admin_token') || localStorage.getItem('nexus_admin_token')) return true;
    const user = window.AuthUI ? window.AuthUI.getCurrentUser() : null;
    if (user && (user.role === 'SOVEREIGN_OWNER' || user.role === 'ADMIN' || user.role === 'OWNER')) return true;
    return false;
  }

  function init() {
    loadDashboardState();
    bindEvents();
    setupSpeechRecognition();
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

  async function loadDashboardState() {
    try {
      const res = await fetch('/api/agents/dashboard');
      if (!res.ok) return;
      currentOverview = await res.json();
      renderAgentsList();
      renderActiveAgentHeader();
      renderInspector();
    } catch (e) {
      console.warn('Erro ao carregar estado do dashboard de agentes:', e.message);
    }
  }

  function renderAgentsList() {
    const container = document.getElementById('agents-nav-rail');
    if (!container || !currentOverview?.agents) return;

    const isAdmin = isAdminMode();
    const createBtn = document.getElementById('dash-create-agent-btn');
    const blockBtn = document.getElementById('dash-agent-toggle-block-btn');
    const delBtn = document.getElementById('dash-agent-delete-btn');
    const editBtn = document.getElementById('dash-agent-edit-btn');
    const purgeBtn = document.getElementById('dash-agent-purge-memory-btn');
    const railTitle = document.getElementById('agent-rail-title');
    const dagTabBtn = document.getElementById('tab-btn-agent-dag');

    if (!isAdmin) {
      // 1 AGENT PER USER: Regular users interact ONLY with their 1 dedicated personal agent (e.g. AURA)
      if (createBtn) createBtn.style.display = 'none';
      if (blockBtn) blockBtn.style.display = 'none';
      if (delBtn) delBtn.style.display = 'none';
      if (editBtn) editBtn.style.display = 'none';
      if (dagTabBtn) dagTabBtn.style.display = 'none';

      if (railTitle) railTitle.textContent = 'Seu Agente de IA';

      if (purgeBtn) {
        purgeBtn.style.display = 'inline-block';
        purgeBtn.innerHTML = '🧹 Limpar Histórico / Memória';
        purgeBtn.title = 'Limpar histórico e memória pessoal do seu agente sob privacidade LGPD';
      }

      const userAgent = currentOverview.agents.find(a => a.id === 'aura') || currentOverview.agents[0];
      if (userAgent) {
        activeAgentId = userAgent.id;
        container.innerHTML = `
          <div class="agent-rail-item selected" data-agent-id="${esc(userAgent.id)}" style="cursor:default;border-color:var(--cyan);background:rgba(0,245,255,0.08)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem">
              <strong style="color:var(--text-primary);font-size:0.92rem">🌟 ${esc(userAgent.name.split('(')[0].trim())}</strong>
              <span class="status-pill active">🟢 SEU AGENTE EXCLUSIVO</span>
            </div>
            <div style="font-size:0.74rem;color:var(--cyan);margin-bottom:0.35rem;font-weight:600">1 Agente Exclusivo Vinculado à sua Conta</div>
            <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:0.35rem">${esc(userAgent.role)}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.68rem;color:var(--text-secondary);font-family:var(--font-mono)">
              <span>🧠 ${userAgent.totalVectors} memórias aprendidas</span>
              <span>💬 ${userAgent.turnCount} conversas</span>
            </div>
          </div>
        `;
      }
      return;
    }

    // ADMIN MODE: Show all agents, administrative actions, and create button
    if (createBtn) createBtn.style.display = 'inline-block';
    if (blockBtn) blockBtn.style.display = 'inline-block';
    if (delBtn) delBtn.style.display = 'inline-block';
    if (editBtn) editBtn.style.display = 'inline-block';
    if (dagTabBtn) dagTabBtn.style.display = 'inline-block';

    if (railTitle) railTitle.textContent = 'Agentes Registrados (Admin)';

    if (purgeBtn) {
      purgeBtn.style.display = 'inline-block';
      purgeBtn.innerHTML = '🗑️ Limpar Memória';
      purgeBtn.title = 'Expurgar toda a base vetorial própria deste agente';
    }

    container.innerHTML = currentOverview.agents.map(ag => {
      const isSelected = ag.id === activeAgentId;
      const isBlocked = ag.status === 'BLOCKED';
      const statusBadge = isBlocked
        ? '<span class="status-pill blocked">🔴 BLOQUEADO</span>'
        : '<span class="status-pill active">🟢 ATIVO</span>';

      return `
        <div class="agent-rail-item ${isSelected ? 'selected' : ''} ${isBlocked ? 'is-blocked' : ''}" data-agent-id="${esc(ag.id)}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem">
            <strong style="color:var(--text-primary);font-size:0.88rem">${esc(ag.name.split('(')[0].trim())}</strong>
            ${statusBadge}
          </div>
          <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:0.35rem">${esc(ag.role)}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.68rem;color:var(--cyan);font-family:var(--font-mono)">
            <span>🧠 ${ag.totalVectors} vetores</span>
            <span>💬 ${ag.turnCount} turnos</span>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.agent-rail-item').forEach(el => {
      el.addEventListener('click', () => {
        activeAgentId = el.getAttribute('data-agent-id');
        renderAgentsList();
        renderActiveAgentHeader();
        renderInspector();
        appendSystemLog(`Conectado ao agente ${activeAgentId.toUpperCase()}. Memória vetorial própria carregada.`);
      });
    });
  }

  function getActiveAgent() {
    return currentOverview?.agents?.find(a => a.id === activeAgentId) || null;
  }

  function renderActiveAgentHeader() {
    const ag = getActiveAgent();
    if (!ag) return;

    const isAdmin = isAdminMode();
    const titleEl = document.getElementById('dash-agent-name');
    const roleEl = document.getElementById('dash-agent-role');
    const statusEl = document.getElementById('dash-agent-status-badge');
    const blockBtn = document.getElementById('dash-agent-toggle-block-btn');
    const editBtn = document.getElementById('dash-agent-edit-btn');
    const delBtn = document.getElementById('dash-agent-delete-btn');

    if (titleEl) {
      titleEl.textContent = isAdmin
        ? ag.name
        : `${ag.name.split('(')[0].trim()} (Seu Agente Pessoal)`;
    }
    if (roleEl) {
      roleEl.textContent = isAdmin
        ? ag.role
        : `${ag.role} • 1 Agente Exclusivo Vinculado`;
    }

    if (statusEl) {
      if (!isAdmin) {
        statusEl.className = 'agent-badge DONE';
        statusEl.textContent = '🟢 SEU AGENTE EXCLUSIVO';
        statusEl.style.background = 'rgba(16,185,129,0.18)';
        statusEl.style.borderColor = '#10b981';
        statusEl.style.color = '#10b981';
      } else {
        if (ag.status === 'BLOCKED') {
          statusEl.className = 'agent-badge blocked';
          statusEl.textContent = '🔴 BLOQUEADO';
          statusEl.style.background = 'rgba(244,63,94,0.18)';
          statusEl.style.borderColor = '#f43f5e';
          statusEl.style.color = '#f43f5e';
        } else {
          statusEl.className = 'agent-badge DONE';
          statusEl.textContent = '🟢 ATIVO';
          statusEl.style.background = 'rgba(16,185,129,0.18)';
          statusEl.style.borderColor = '#10b981';
          statusEl.style.color = '#10b981';
        }
      }
    }

    if (blockBtn) {
      if (!isAdmin) {
        blockBtn.style.display = 'none';
      } else {
        blockBtn.style.display = 'inline-block';
        if (ag.status === 'BLOCKED') {
          blockBtn.innerHTML = '🟢 Desbloquear Agente';
          blockBtn.className = 'btn-secondary btn-unblock';
        } else {
          blockBtn.innerHTML = '🛑 Bloquear Agente';
          blockBtn.className = 'btn-secondary btn-block';
        }
      }
    }

    if (editBtn) {
      editBtn.style.display = isAdmin ? 'inline-block' : 'none';
    }

    if (delBtn) {
      delBtn.style.display = isAdmin ? 'inline-block' : 'none';
    }
  }

  function renderInspector(lastTurnData = null) {
    const ag = getActiveAgent();
    if (!ag) return;

    const vecCountEl = document.getElementById('insp-vector-count');
    const topicsEl = document.getElementById('insp-topics');
    const sentenceEl = document.getElementById('insp-sentence-len');
    const matchesEl = document.getElementById('insp-matches-list');
    const newLearnedEl = document.getElementById('insp-new-learned');

    if (vecCountEl) vecCountEl.textContent = `${ag.totalVectors} vetores`;
    if (sentenceEl) sentenceEl.textContent = `${ag.avgSentenceLength} palavras/frase`;
    if (topicsEl) {
      topicsEl.innerHTML = (ag.topics && ag.topics.length)
        ? ag.topics.map(t => `<span class="topic-pill">#${esc(t)}</span>`).join(' ')
        : '<span style="color:var(--text-secondary);font-size:0.75rem">Nenhum tópico dominante ainda</span>';
    }

    if (matchesEl) {
      const matches = lastTurnData?.vectorMatches || ag.recentVectors || [];
      if (!matches.length) {
        matchesEl.innerHTML = '<div style="font-size:0.75rem;color:var(--text-secondary)">Nenhum vetor consultado nesta sessão.</div>';
      } else {
        matchesEl.innerHTML = matches.map(m => {
          const sim = m.similarity ? `${(m.similarity * 100).toFixed(0)}% sim` : 'Recente';
          return `
            <div class="vector-match-card">
              <div style="display:flex;justify-content:space-between;font-size:0.68rem;color:var(--cyan);margin-bottom:0.2rem">
                <span>[${esc(m.category || 'vetor')}]</span>
                <span>${esc(sim)}</span>
              </div>
              <div style="font-size:0.76rem;color:var(--text-primary)">${esc(m.text)}</div>
            </div>
          `;
        }).join('');
      }
    }

    if (newLearnedEl) {
      if (lastTurnData?.newLearnedMemory) {
        newLearnedEl.innerHTML = `
          <div class="vector-match-card new-vector">
            <div style="font-size:0.68rem;color:var(--emerald);font-weight:700;margin-bottom:0.2rem">✨ Novo Vetor Indexado nesta Mensagem:</div>
            <div style="font-size:0.76rem;color:var(--text-primary)">${esc(lastTurnData.newLearnedMemory.text)}</div>
          </div>
        `;
      } else {
        newLearnedEl.innerHTML = '<div style="font-size:0.75rem;color:var(--text-secondary)">Envie uma mensagem para disparar nova indexação vetorial.</div>';
      }
    }
  }

  function appendChatMessage(role, text) {
    const log = document.getElementById('dash-chat-messages');
    if (!log) return;

    const row = document.createElement('div');
    row.className = `dash-chat-bubble ${role}`;
    const header = role === 'user'
      ? (isAdminMode() ? '👤 Você (Criador/Admin)' : '👤 Você')
      : `🤖 ${getActiveAgent()?.name || 'Agente'}`;

    row.innerHTML = `
      <div class="bubble-header">${esc(header)} <span class="bubble-time">${new Date().toTimeString().slice(0, 5)}</span></div>
      <div class="bubble-body">${esc(text).replace(/\n/g, '<br>')}</div>
    `;
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  function appendSystemLog(msg) {
    const log = document.getElementById('dash-chat-messages');
    if (!log) return;
    const sys = document.createElement('div');
    sys.className = 'dash-chat-sys-log';
    sys.textContent = `ℹ️ [${new Date().toTimeString().slice(0, 5)}] ${msg}`;
    log.appendChild(sys);
    log.scrollTop = log.scrollHeight;
  }

  async function sendMessage(text, fromVoice = false) {
    const clean = (text || '').trim();
    if (!clean || isProcessingTurn) return;

    isProcessingTurn = true;
    appendChatMessage('user', clean);

    const input = document.getElementById('dash-chat-input');
    if (input) input.value = '';

    const sendBtn = document.getElementById('dash-chat-send-btn');
    if (sendBtn) sendBtn.disabled = true;

    try {
      const user = window.AuthUI ? window.AuthUI.getCurrentUser() : null;
      const userName = isAdminMode() ? 'Criador' : (user?.name || 'Usuário');

      const res = await fetch('/api/agents/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: activeAgentId,
          message: clean,
          userName,
          voiceEnabled: fromVoice,
          apiKey: window.Gemini ? Gemini.getKey() : '',
          clientTemporal: getClientTemporal()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        appendChatMessage('agent', `❌ Erro: ${data.error || 'Falha na resposta do agente'}`);
      } else {
        appendChatMessage('agent', data.reply);
        if (ttsEnabled && data.voiceText) {
          speakAgentReply(data.voiceText);
        }
        renderInspector(data);
        await loadDashboardState();
      }
    } catch (e) {
      appendChatMessage('agent', `❌ Falha de rede: ${e.message}`);
    } finally {
      isProcessingTurn = false;
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  function setupSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('SpeechRecognition não suportado neste navegador.');
      return;
    }

    try {
      recognizer = new SpeechRec();
      recognizer.lang = 'pt-BR';
      recognizer.continuous = false;
      recognizer.interimResults = false;

      recognizer.onstart = () => {
        isListening = true;
        updateVoiceButtonState();
        appendSystemLog('🎙️ Microfone ativo. Pode falar...');
      };

      recognizer.onresult = (ev) => {
        const transcript = ev.results[0][0].transcript;
        if (transcript) {
          sendMessage(transcript, true);
        }
      };

      recognizer.onerror = (ev) => {
        console.warn('SpeechRecognition erro:', ev.error);
        isListening = false;
        updateVoiceButtonState();
      };

      recognizer.onend = () => {
        isListening = false;
        updateVoiceButtonState();
      };
    } catch (e) {
      console.warn('Erro ao configurar SpeechRecognition:', e.message);
    }
  }

  function toggleVoiceInput() {
    if (!recognizer) {
      alert('Reconhecimento de voz não suportado pelo seu navegador. Use navegadores baseados em Chromium (Chrome, Edge, Brave).');
      return;
    }

    if (isListening) {
      recognizer.stop();
    } else {
      try {
        recognizer.start();
      } catch (e) {
        console.warn('Erro ao iniciar reconhecimento:', e.message);
      }
    }
  }

  function updateVoiceButtonState() {
    const btn = document.getElementById('dash-voice-mic-btn');
    if (!btn) return;
    if (isListening) {
      btn.className = 'btn-voice-mic listening';
      btn.innerHTML = '🔴 Ouvindo...';
    } else {
      btn.className = 'btn-voice-mic';
      btn.innerHTML = '🎙️ Falar';
    }
  }

  function speakAgentReply(text) {
    if (!ttsEnabled) return;
    if (window.VoiceEngine) {
      VoiceEngine.speak(text, { persona: 'neutral', rate: 0.98, pitch: 1.0 });
      return;
    }
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = 1.05;
    u.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => /pt[-_]?br|portugu/i.test(v.lang + ' ' + v.name));
    if (ptVoice) u.voice = ptVoice;

    window.speechSynthesis.speak(u);
  }

  async function toggleBlockCurrentAgent() {
    const ag = getActiveAgent();
    if (!ag) return;

    const willBlock = ag.status === 'ACTIVE';
    const confirmMsg = willBlock
      ? `Tem certeza que deseja BLOQUEAR o agente ${ag.name}? Ele não processará mensagens nem participará de orquestrações.`
      : `Deseja DESBLOQUEAR o agente ${ag.name}?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/agents/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: ag.id, blocked: willBlock })
      });
      const data = await res.json();
      if (res.ok) {
        appendSystemLog(`Agente ${ag.id.toUpperCase()} agora está ${data.status}.`);
        await loadDashboardState();
      } else {
        alert(`Erro ao alterar status: ${data.error}`);
      }
    } catch (e) {
      alert(`Falha de conexão: ${e.message}`);
    }
  }

  async function purgeMemoryCurrentAgent() {
    const ag = getActiveAgent();
    if (!ag) return;

    const isAdmin = isAdminMode();
    const confirmMsg = isAdmin
      ? `⚠️ ATENÇÃO: Deseja realmente EXPURGAR E EXCLUIR toda a base de conhecimento vetorial própria do agente ${ag.name}?\n\nEsta ação é irreversível e atende ao Direito ao Esquecimento (LGPD/GDPR).`
      : `Deseja limpar todo o histórico de conversas e memórias aprendidas com o seu agente ${ag.name}? Seus dados serão redefinidos conforme as diretrizes de privacidade.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/agents/purge-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: ag.id })
      });
      const data = await res.json();
      if (res.ok) {
        appendSystemLog(`🗑️ Memória do agente ${ag.id.toUpperCase()} foi limpa (${data.purgedVectorsCount} memórias deletadas).`);
        const log = document.getElementById('dash-chat-messages');
        if (log) {
          log.innerHTML = `<div class="dash-chat-sys-log">🛡️ Memória e conversas reinicializadas com sucesso sob conformidade de privacidade.</div>`;
        }
        await loadDashboardState();
      } else {
        alert(`Erro ao expurgar memória: ${data.error}`);
      }
    } catch (e) {
      alert(`Falha de conexão: ${e.message}`);
    }
  }

  async function deleteCurrentAgent() {
    const ag = getActiveAgent();
    if (!ag) return;

    if (!confirm(`Deseja EXCLUIR o agente ${ag.name}? Se for um agente de sistema, sua memória será zerada e ele será mantido bloqueado.`)) {
      return;
    }

    try {
      const res = await fetch('/api/agents/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: ag.id })
      });
      const data = await res.json();
      if (res.ok) {
        appendSystemLog(`Agente ${ag.id.toUpperCase()} excluído/desativado.`);
        activeAgentId = 'aura';
        await loadDashboardState();
      } else {
        alert(`Erro ao excluir: ${data.error}`);
      }
    } catch (e) {
      alert(`Falha de conexão: ${e.message}`);
    }
  }

  async function editAgentPrompt() {
    const ag = getActiveAgent();
    if (!ag) return;

    const newName = prompt(`Nome do Agente:`, ag.name);
    if (newName === null) return;

    const newRole = prompt(`Função / Especialidade do Agente:`, ag.role);
    if (newRole === null) return;

    const newDesc = prompt(`Descrição da persona e objetivos:`, ag.description || '');
    if (newDesc === null) return;

    const newInst = prompt(`Diretrizes de Comportamento / Prompt do Sistema (opcional):`, ag.instructions || '');
    if (newInst === null) return;

    try {
      const res = await fetch('/api/agents/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: ag.id,
          name: newName.trim() || ag.name,
          role: newRole.trim() || ag.role,
          description: newDesc.trim(),
          instructions: newInst.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        appendSystemLog(`Agente ${ag.id.toUpperCase()} atualizado com sucesso.`);
        await loadDashboardState();
      } else {
        alert(`Erro ao atualizar agente: ${data.error}`);
      }
    } catch (e) {
      alert(`Falha ao atualizar agente: ${e.message}`);
    }
  }

  async function createCustomAgentPrompt() {
    const name = prompt('Nome do Novo Agente (ex: RESEARCHER, GUARDIAN, FINANCE):');
    if (!name || !name.trim()) return;

    const role = prompt('Função / Especialidade do Agente (ex: Pesquisador Biomédico, Análise Contábil):') || 'Especialista Dedicado';
    const desc = prompt('Descrição curta da persona e objetivo:') || '';

    try {
      const res = await fetch('/api/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), role: role.trim(), description: desc.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        appendSystemLog(`Novo agente criado com sucesso: ${data.name}. Base vetorial própria inicializada.`);
        activeAgentId = data.id;
        await loadDashboardState();
      } else {
        alert(`Erro ao criar agente: ${data.error}`);
      }
    } catch (e) {
      alert(`Falha ao criar agente: ${e.message}`);
    }
  }

  function bindEvents() {
    const sendBtn = document.getElementById('dash-chat-send-btn');
    const input = document.getElementById('dash-chat-input');
    const voiceBtn = document.getElementById('dash-voice-mic-btn');
    const muteBtn = document.getElementById('dash-voice-mute-btn');
    const blockBtn = document.getElementById('dash-agent-toggle-block-btn');
    const purgeBtn = document.getElementById('dash-agent-purge-memory-btn');
    const delBtn = document.getElementById('dash-agent-delete-btn');
    const editBtn = document.getElementById('dash-agent-edit-btn');
    const newAgentBtn = document.getElementById('dash-create-agent-btn');

    if (sendBtn && input) {
      sendBtn.addEventListener('click', () => sendMessage(input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendMessage(input.value);
        }
      });
    }

    if (voiceBtn) voiceBtn.addEventListener('click', toggleVoiceInput);
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        ttsEnabled = !ttsEnabled;
        muteBtn.innerHTML = ttsEnabled ? '🔊 Voz Ativa' : '🔈 Mudo';
        if (!ttsEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      });
    }

    if (blockBtn) blockBtn.addEventListener('click', toggleBlockCurrentAgent);
    if (purgeBtn) purgeBtn.addEventListener('click', purgeMemoryCurrentAgent);
    if (delBtn) delBtn.addEventListener('click', deleteCurrentAgent);
    if (editBtn) editBtn.addEventListener('click', editAgentPrompt);
    if (newAgentBtn) newAgentBtn.addEventListener('click', createCustomAgentPrompt);
  }

  return {
    init,
    loadDashboardState,
    sendMessage,
    isAdminMode,
    getActiveAgent: () => getActiveAgent()
  };
})();

window.AgentDashboardUI = AgentDashboardUI;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AgentDashboardUI.init());
} else {
  AgentDashboardUI.init();
}
