/**
 * NEXUS World-Learner Organism UI (Organismo Criativo que Aprende com o Mundo)
 * 
 * Console Interativo da Administradora:
 *  - Terminal de Diálogo Cognitivo & Testes de Desenvolvimento em Tempo Real
 *  - Entrada por Voz (Microfone / Web Speech API) e Leitura Neural de Voz (TTS)
 *  - Observação de Padrões Ocultos Multimodais
 *  - Formulação Epistêmica de Hipóteses
 *  - Simulação de Consequências Futuras (1ª, 2ª e 3ª Ordem)
 *  - Galeria de Criações Sintetizadas
 *  - Controle Total da Administradora: Edição Imediata, Validação e Exclusão Segura
 */
const WorldOrganismUI = (function () {
  let organismData = null;
  let recognizer = null;
  let isListening = false;
  let ttsEnabled = true;
  let isAwaitingReply = false;
  let activeAbortController = null;

  const esc = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  function getClientTemporal() {
    const d = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
    return {
      timeZone,
      localeDate: d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone }),
      localeTime: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone })
    };
  }

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
      renderSavedChatHistory();
    } catch (e) {
      console.warn('Erro ao carregar organismo:', e.message);
      renderErrorFallbacks(e.message);
    }
  }

  function renderErrorFallbacks(msg) {
    const fallbackHtml = `<div style="padding:1rem;font-size:0.78rem;color:#f87171;background:rgba(239,68,68,0.08);border:1px dashed rgba(239,68,68,0.3);border-radius:8px">
      ⚠️ Erro ao sincronizar dados do Organismo: ${esc(msg)}
      <button class="org-btn" style="margin-left:8px;margin-top:4px" onclick="WorldOrganismUI.loadDashboard()">🔄 Tentar Novamente</button>
    </div>`;

    ['org-hypotheses-list', 'org-simulations-list', 'org-creations-list', 'org-observations-list'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.innerHTML.includes('Carregando')) {
        el.innerHTML = fallbackHtml;
      }
    });
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
      list.innerHTML = '<div style="font-size:0.78rem;color:var(--text-secondary);padding:0.75rem">Nenhum sinal multimodal registrado no momento. Clique em "📡 Ingerir Sinal" acima.</div>';
      return;
    }

    list.innerHTML = obs.slice(0, 8).map(o => `
      <div class="org-item-card" id="obs-card-${esc(o.id)}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem">
          <span class="org-pill cyan">[${esc(o.modality)}] • ${esc(o.source)}</span>
          <div style="display:flex;gap:0.3rem">
            <span style="font-size:0.68rem;color:var(--emerald);font-weight:700">${(o.confidence * 100).toFixed(0)}% Conf.</span>
            <button class="org-btn btn-danger" style="padding:2px 6px;font-size:0.68rem" onclick="WorldOrganismUI.deleteObservationPrompt('${esc(o.id)}')" title="Apagar observação">🗑️</button>
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
      list.innerHTML = '<div style="font-size:0.78rem;color:var(--text-secondary);padding:0.75rem">Nenhuma hipótese formulada. Clique em "💡 + Nova Hipótese" acima.</div>';
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
      list.innerHTML = '<div style="font-size:0.78rem;color:var(--text-secondary);padding:0.75rem">Nenhuma simulação contrafactual executada ainda. Clique em "🔮 + Simulação Direta" acima.</div>';
      return;
    }

    list.innerHTML = sims.slice(0, 6).map(s => `
      <div class="org-item-card glow-cyan" id="sim-card-${esc(s.id)}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem">
          <span style="font-size:0.82rem;font-weight:800;color:var(--cyan)">🔮 ${esc(s.scenarioName)}</span>
          <span style="font-size:0.7rem;color:var(--emerald);font-weight:700">${esc(s.projectedGain || '+45% Eficiência')}</span>
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
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.7rem;color:var(--text-dim);margin-top:0.4rem;flex-wrap:wrap;gap:0.3rem">
          <span>Risco: <strong>${esc(String(s.riskIndex))}</strong> • Ética: <strong style="color:var(--emerald)">${s.ethicalPass ? '✓ Aprovado EU AI Act & LGPD' : 'Revisão'}</strong></span>
        </div>
        
        <div class="org-action-bar">
          <button class="org-btn" onclick="WorldOrganismUI.viewSimulationDossier('${esc(s.id)}')" title="Ver dossiê completo de auditoria">📜 Ver Dossiê</button>
          <button class="org-btn" onclick="WorldOrganismUI.editSimulationPrompt('${esc(s.id)}')" title="Ajustar premissas do cenário">✏️ Ajustar</button>
          <button class="org-btn btn-danger" onclick="WorldOrganismUI.deleteSimulationPrompt('${esc(s.id)}')" title="Apagar simulação">🗑️ Apagar</button>
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

  function renderSavedChatHistory() {
    const list = document.getElementById('org-chat-messages');
    if (!list || !organismData?.chatHistory?.length) return;
    if (list.children.length > 2) return; // already populated

    organismData.chatHistory.forEach(turn => {
      appendChatMessage(turn.role === 'organism' ? 'organism' : 'user', turn.text, null, turn.actions);
    });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CONVERSATIONAL & DEVELOPMENT TEST ENGINE
  // ═════════════════════════════════════════════════════════════════════════

  function appendChatMessage(role, text, turnId = null, actions = null) {
    const list = document.getElementById('org-chat-messages');
    if (!list) return;

    const div = document.createElement('div');
    if (turnId) div.id = turnId;
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.maxWidth = '88%';
    div.style.marginBottom = '0.5rem';

    const isOrg = role === 'organism';
    div.style.alignSelf = isOrg ? 'flex-start' : 'flex-end';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '6px';
    header.style.marginBottom = '2px';
    header.style.fontSize = '0.7rem';
    header.style.color = 'var(--text-dim)';

    if (isOrg) {
      header.innerHTML = `<span>🧠</span> <strong style="color:#c084fc">Organismo Criativo</strong> • <span>${new Date().toLocaleTimeString().slice(0, 5)}</span>`;
    } else {
      header.innerHTML = `<strong style="color:var(--cyan)">Administradora</strong> • <span>${new Date().toLocaleTimeString().slice(0, 5)}</span> <span>👤</span>`;
    }

    const bubble = document.createElement('div');
    bubble.className = 'org-chat-content-bubble';
    bubble.style.padding = '0.75rem 0.95rem';
    bubble.style.borderRadius = '8px';
    bubble.style.fontSize = '0.8rem';
    bubble.style.lineHeight = '1.5';
    bubble.style.wordBreak = 'break-word';

    if (isOrg) {
      bubble.style.background = 'rgba(168, 85, 247, 0.12)';
      bubble.style.border = '1px solid rgba(168, 85, 247, 0.35)';
      bubble.style.color = '#fff';
    } else {
      bubble.style.background = 'rgba(0, 245, 255, 0.12)';
      bubble.style.border = '1px solid rgba(0, 245, 255, 0.35)';
      bubble.style.color = '#fff';
    }

    bubble.innerHTML = formatChatText(text);

    div.appendChild(header);
    div.appendChild(bubble);

    if (isOrg && actions) {
      renderActionBoxes(div, actions);
    }

    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
  }

  function updateChatMessage(turnId, text, actions = null) {
    const el = document.getElementById(turnId);
    if (!el) return;
    const bubble = el.querySelector('.org-chat-content-bubble');
    if (bubble) {
      bubble.innerHTML = formatChatText(text);
    }
    if (actions) {
      renderActionBoxes(el, actions);
    }
    const list = document.getElementById('org-chat-messages');
    if (list) list.scrollTop = list.scrollHeight;
  }

  function renderActionBoxes(container, actions) {
    if (!actions) return;

    if (actions.hypothesis || actions.suggestedHypothesis) {
      const h = actions.hypothesis || actions.suggestedHypothesis;
      const box = document.createElement('div');
      box.className = 'org-chat-suggestion-box';
      box.innerHTML = `
        <div class="title">💡 Hipótese Sugerida pelo Organismo: "${esc(h.title)}"</div>
        <div class="desc">${esc(h.premise)}</div>
        <div class="actions">
          <button class="org-btn btn-success" onclick="WorldOrganismUI.saveSuggestedHypothesis('${esc(JSON.stringify(h).replace(/'/g, "&apos;"))}')">✅ Salvar como Hipótese</button>
          <button class="org-btn" onclick="WorldOrganismUI.putInInput('${esc(h.title)}')">✏️ Carregar no Campo</button>
        </div>
      `;
      container.appendChild(box);
    }

    if (actions.simulation || actions.suggestedSimulation) {
      const s = actions.simulation || actions.suggestedSimulation;
      const box = document.createElement('div');
      box.className = 'org-chat-suggestion-box';
      box.innerHTML = `
        <div class="title">🔮 Simulação Contrafactual Sugerida: "${esc(s.scenarioName)}"</div>
        <div class="desc">1ª Ordem: ${esc(s.immediateOutcome1st || '')}</div>
        <div class="actions">
          <button class="org-btn btn-success" onclick="WorldOrganismUI.saveSuggestedSimulation('${esc(JSON.stringify(s).replace(/'/g, "&apos;"))}')">🔮 Executar Simulação</button>
        </div>
      `;
      container.appendChild(box);
    }

    if (actions.creation || actions.suggestedCreation) {
      const c = actions.creation || actions.suggestedCreation;
      const box = document.createElement('div');
      box.className = 'org-chat-suggestion-box';
      box.innerHTML = `
        <div class="title">🎨 Criação Estratégica Proposta: "${esc(c.title)}"</div>
        <div class="desc">${esc(c.summary)}</div>
        <div class="actions">
          <button class="org-btn btn-success" onclick="WorldOrganismUI.saveSuggestedCreation('${esc(JSON.stringify(c).replace(/'/g, "&apos;"))}')">🎯 Homologar Criação</button>
        </div>
      `;
      container.appendChild(box);
    }
  }

  function formatChatText(txt) {
    if (!txt) return '';
    return esc(txt)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px;font-family:var(--font-mono)">$1</code>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  }

  async function sendMessage(text, fromVoice = false) {
    const clean = (text || '').trim();
    if (!clean) return;

    if (isAwaitingReply && activeAbortController) {
      activeAbortController.abort();
    }

    appendChatMessage('user', clean);

    const input = document.getElementById('org-chat-input');
    if (input) {
      input.value = '';
      input.focus();
    }

    const turnId = 'org_turn_' + Date.now();
    appendChatMessage('organism', '<span class="c2-pulse-dot" style="background:#c084fc;margin-right:6px"></span><em>Organismo processando padrões mundiais simultaneamente...</em>', turnId);

    isAwaitingReply = true;
    activeAbortController = new AbortController();

    try {
      const apiKey = window.Gemini ? window.Gemini.getKey() : '';
      const res = await fetch('/api/organism/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: activeAbortController.signal,
        body: JSON.stringify({
          message: clean,
          apiKey,
          clientTemporal: getClientTemporal(),
          voiceEnabled: fromVoice || ttsEnabled
        })
      });

      const data = await res.json();
      isAwaitingReply = false;

      if (!res.ok) {
        updateChatMessage(turnId, `❌ Erro no organismo: ${data.error || 'Falha de processamento'}`);
      } else {
        updateChatMessage(turnId, data.reply, {
          hypothesis: data.suggestedHypothesis,
          simulation: data.suggestedSimulation,
          creation: data.suggestedCreation
        });

        if (ttsEnabled && data.voiceText) {
          speakOrganismReply(data.voiceText);
        }
        await loadDashboard();
      }
    } catch (e) {
      isAwaitingReply = false;
      if (e.name === 'AbortError') {
        updateChatMessage(turnId, '<em>⚠️ Interação cancelada pela Administradora.</em>');
      } else {
        updateChatMessage(turnId, `❌ Erro de comunicação: ${e.message}`);
      }
    }
  }

  function sendQuickPrompt(promptText) {
    const input = document.getElementById('org-chat-input');
    if (input) input.value = promptText;
    sendMessage(promptText, false);
  }

  function cancelCurrentTest() {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    const input = document.getElementById('org-chat-input');
    if (input) input.value = '';
  }

  async function clearConversation() {
    if (!confirm('Deseja limpar todo o diálogo e histórico de testes com o Organismo?')) return;
    try {
      const res = await fetch('/api/organism/chat/clear', { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao limpar histórico');
      const list = document.getElementById('org-chat-messages');
      if (list) {
        list.innerHTML = `
          <div class="dash-chat-sys-log">
            🌌 <strong>Canal Soberano Ativo com o Organismo Criativo.</strong> Diálogo reiniciado. Fale ou digite para questionar, compreender seus padrões ocultos ou realizar novos testes de desenvolvimento.
          </div>
        `;
      }
      alert('Histórico de diálogo reiniciado com sucesso.');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  function putInInput(text) {
    const input = document.getElementById('org-chat-input');
    if (input) {
      input.value = text;
      input.focus();
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SPEECH RECOGNITION & NEURAL VOICE TTS
  // ═════════════════════════════════════════════════════════════════════════

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
      };

      recognizer.onresult = (ev) => {
        const transcript = ev.results[0][0].transcript;
        const input = document.getElementById('org-chat-input');
        if (input) input.value = transcript;
        sendMessage(transcript, true);
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
      setupSpeechRecognition();
      if (!recognizer) {
        alert('Reconhecimento de voz não suportado pelo seu navegador atual. Utilize Google Chrome ou Edge.');
        return;
      }
    }

    if (isListening) {
      recognizer.stop();
      isListening = false;
    } else {
      try {
        recognizer.start();
        isListening = true;
      } catch (e) {
        console.warn('Erro ao iniciar reconhecimento:', e);
      }
    }
    updateVoiceButtonState();
  }

  function updateVoiceButtonState() {
    const btn = document.getElementById('org-voice-mic-btn');
    if (!btn) return;
    if (isListening) {
      btn.style.background = 'rgba(239, 68, 68, 0.35)';
      btn.style.borderColor = '#f87171';
      btn.style.color = '#fff';
      btn.innerHTML = '🔴 Ouvindo...';
    } else {
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.innerHTML = '🎙️ Falar';
    }
  }

  function speakOrganismReply(text) {
    if (!ttsEnabled) return;
    if (window.VoiceEngine) {
      VoiceEngine.speak(text, { persona: 'neutral', rate: 1.0, pitch: 0.98 });
      return;
    }
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = 1.02;
    u.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => /pt[-_]?br|portugu/i.test(v.lang + ' ' + v.name));
    if (ptVoice) u.voice = ptVoice;

    window.speechSynthesis.speak(u);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SOBERANIA DA ADMINISTRADORA: AÇÕES DIRETAS (CRUD, SIMULAÇÕES & ADOÇÃO)
  // ═════════════════════════════════════════════════════════════════════════

  async function ingestSignalPrompt() {
    const rawContent = prompt('Insira um sinal do mundo (texto, telemetria, comportamento ou observação de campo):');
    if (!rawContent || !rawContent.trim()) return;

    try {
      const res = await fetch('/api/organism/observe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modality: 'texto_e_comportamento',
          source: 'Administradora (Entrada Manual Soberana)',
          rawContent: rawContent.trim(),
          detectedPattern: `Sinal informado pela Administradora: "${rawContent.trim().slice(0, 80)}..."`,
          latentCorrelation: 'Intervenção soberana humana priorizada no vetor de aprendizado.'
        })
      });
      if (!res.ok) throw new Error('Falha ao registrar sinal');
      await loadDashboard();
      alert('Sinal multimodal ingerido e correlacionado com sucesso!');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function createHypothesisPrompt() {
    const title = prompt('Título da Hipótese:');
    if (!title || !title.trim()) return;
    const premise = prompt('Premissa Causal:');
    if (!premise || !premise.trim()) return;
    const domain = prompt('Domínio da Hipótese (ex: Ergonomia Cognitiva, Arquitetura, UX):', 'Ergonomia Cognitiva') || 'Geral';

    try {
      const res = await fetch('/api/organism/hypothesis/formulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          premise: premise.trim(),
          domain: domain.trim(),
          rationale: 'Formulada diretamente pela Administradora via Console Soberano.'
        })
      });
      if (!res.ok) throw new Error('Falha ao formular hipótese');
      await loadDashboard();
      alert('Hipótese formulada com sucesso na matriz do Organismo!');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function saveSuggestedHypothesis(jsonStr) {
    try {
      const h = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      const res = await fetch('/api/organism/hypothesis/formulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: h.title,
          premise: h.premise,
          domain: h.domain || 'Governança & Co-Evolução',
          rationale: h.rationale || 'Originada em diálogo interativo com a Administradora.'
        })
      });
      if (!res.ok) throw new Error('Falha ao salvar hipótese');
      await loadDashboard();
      alert(`Hipótese "${h.title}" registrada com sucesso!`);
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function editHypothesisPrompt(id) {
    const card = document.getElementById('hyp-card-' + id);
    const currTitle = card?.querySelector('#hyp-title-' + id)?.textContent || '';
    const currPremise = card?.querySelector('#hyp-premise-' + id)?.textContent || '';

    const newTitle = prompt('Editar Título da Hipótese:', currTitle);
    if (newTitle === null) return;
    const newPremise = prompt('Editar Premissa Causal:', currPremise);
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
      alert('Hipótese atualizada com sucesso pela Administradora!');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function deleteHypothesisPrompt(id) {
    if (!confirm('Tem certeza de que deseja apagar esta hipótese da memória do organismo?')) return;
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

  async function createDirectSimulationPrompt() {
    const hyps = organismData?.hypotheses || [];
    if (!hyps.length) {
      alert('Crie ou selecione ao menos uma hipótese antes de simular.');
      return;
    }
    const hyp = hyps[0];
    const scenario = prompt('Nome do Cenário Contrafactual:', `Projeção Dinâmica: ${hyp.title}`);
    if (!scenario || !scenario.trim()) return;

    try {
      const res = await fetch('/api/organism/hypothesis/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hypothesisId: hyp.id,
          options: { scenarioName: scenario.trim() }
        })
      });
      if (!res.ok) throw new Error('Falha ao executar simulação direta');
      await loadDashboard();
      alert('Nova simulação contrafactual gerada com sucesso!');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function saveSuggestedSimulation(jsonStr) {
    try {
      const s = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      const hyp = organismData?.hypotheses?.[0];
      const res = await fetch('/api/organism/hypothesis/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hypothesisId: hyp ? hyp.id : null,
          options: {
            scenarioName: s.scenarioName,
            immediateOutcome1st: s.immediateOutcome1st,
            systemicRipple2nd: s.systemicRipple2nd,
            societalImpact3rd: s.societalImpact3rd
          }
        })
      });
      if (!res.ok) throw new Error('Falha ao registrar simulação');
      await loadDashboard();
      alert(`Simulação "${s.scenarioName}" executada e adicionada com sucesso!`);
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function editSimulationPrompt(id) {
    const sims = organismData?.simulations || [];
    const s = sims.find(x => x.id === id);
    if (!s) return;

    const newScenario = prompt('Editar Nome do Cenário:', s.scenarioName);
    if (newScenario === null) return;
    const new1st = prompt('Editar Efeito Imediato (1ª Ordem):', s.immediateOutcome1st);
    if (new1st === null) return;

    try {
      const res = await fetch('/api/organism/simulation/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          updates: { scenarioName: newScenario.trim() || s.scenarioName, immediateOutcome1st: new1st.trim() || s.immediateOutcome1st }
        })
      });
      if (!res.ok) throw new Error('Falha ao atualizar simulação');
      await loadDashboard();
      alert('Simulação atualizada com sucesso!');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  async function deleteSimulationPrompt(id) {
    if (!confirm('Deseja apagar esta simulação contrafactual do histórico?')) return;
    try {
      const res = await fetch('/api/organism/simulation/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Falha ao apagar simulação');
      await loadDashboard();
      alert('Simulação apagada com sucesso.');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  function viewSimulationDossier(id) {
    const sims = organismData?.simulations || [];
    const s = sims.find(x => x.id === id);
    if (!s) return;

    const modal = document.getElementById('xai-dossier-modal');
    const content = document.getElementById('xai-modal-content');
    const title = document.getElementById('xai-modal-title');

    if (title) title.textContent = `🔮 Dossiê de Simulação Contrafactual: ${s.scenarioName}`;
    if (content) {
      content.textContent = `# RELATÓRIO TÉCNICO DE SIMULAÇÃO DE CONSEQUÊNCIAS
ID: ${s.id}
Hipótese Vinculada: ${s.hypothesisTitle || s.hypothesisId}
Timestamp: ${s.timestamp}
Conformidade: EU AI Act Art. 13/14 | LGPD Art. 20 (Soberania Humana Garantida)

## 1. CENÁRIO CONTRAFACTUAL PROJETADO
${s.scenarioName}

## 2. MATRIZ DE IMPACTO EM TRÊS ORDENS
• 1ª Ordem (Efeito Imediato):
  ${s.immediateOutcome1st}

• 2ª Ordem (Efeito Sistêmico & Informacional):
  ${s.systemicRipple2nd}

• 3ª Ordem (Impacto Cultural, Longo Prazo & Humano):
  ${s.societalImpact3rd}

## 3. INDICADORES PREDITIVOS & GOVERNANÇA
- Ganho Projetado: ${s.projectedGain || 'N/A'}
- Índice de Risco Estimado: ${s.riskIndex}
- Triagem Ética: ${s.ethicalPass ? 'APROVADO (Zero Conflito com Valores Soberanos)' : 'REVISÃO'}
- Autoridade de Decisão: ADMINISTRADORA EXCLUSIVA (Reversão e cancelamento disponíveis)`;
    }
    if (modal) modal.classList.add('active');
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

  async function saveSuggestedCreation(jsonStr) {
    try {
      const c = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      const res = await fetch('/api/organism/creation/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: c.type || 'estrategia_operacional',
          title: c.title,
          summary: c.summary,
          deliverables: c.deliverables
        })
      });
      if (!res.ok) throw new Error('Falha ao homologar criação');
      await loadDashboard();
      alert(`Criação "${c.title}" adicionada com sucesso ao painel!`);
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

  // ═════════════════════════════════════════════════════════════════════════
  // INITIALIZATION & EVENT LISTENERS
  // ═════════════════════════════════════════════════════════════════════════

  function init() {
    loadDashboard();
    setupSpeechRecognition();

    document.getElementById('btn-org-ingest')?.addEventListener('click', ingestSignalPrompt);
    document.getElementById('btn-org-new-hyp')?.addEventListener('click', createHypothesisPrompt);
    document.getElementById('btn-org-new-sim')?.addEventListener('click', createDirectSimulationPrompt);
    document.getElementById('btn-org-refresh')?.addEventListener('click', loadDashboard);
    document.getElementById('btn-org-chat-clear')?.addEventListener('click', clearConversation);

    // Chat Bar Listeners
    const sendBtn = document.getElementById('org-chat-send-btn');
    const input = document.getElementById('org-chat-input');
    const cancelBtn = document.getElementById('org-chat-cancel-btn');
    const micBtn = document.getElementById('org-voice-mic-btn');
    const muteBtn = document.getElementById('org-voice-mute-btn');

    if (sendBtn && input) {
      sendBtn.addEventListener('click', () => sendMessage(input.value, false));
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          sendMessage(input.value, false);
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', cancelCurrentTest);
    }

    if (micBtn) {
      micBtn.addEventListener('click', toggleVoiceInput);
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        ttsEnabled = !ttsEnabled;
        muteBtn.textContent = ttsEnabled ? '🔊 Voz Ativa' : '🔇 Voz Desativada';
        muteBtn.style.color = ttsEnabled ? 'var(--cyan)' : 'var(--text-dim)';
        if (!ttsEnabled && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      });
    }
  }

  return {
    init,
    loadDashboard,
    sendMessage,
    sendQuickPrompt,
    cancelCurrentTest,
    clearConversation,
    putInInput,
    toggleVoiceInput,
    ingestSignalPrompt,
    createHypothesisPrompt,
    saveSuggestedHypothesis,
    editHypothesisPrompt,
    deleteHypothesisPrompt,
    simulateHypothesis,
    createDirectSimulationPrompt,
    saveSuggestedSimulation,
    editSimulationPrompt,
    deleteSimulationPrompt,
    viewSimulationDossier,
    synthesizeFromHypothesis,
    saveSuggestedCreation,
    adoptCreation,
    editCreationPrompt,
    deleteCreationPrompt,
    deleteObservationPrompt
  };
})();

window.WorldOrganismUI = WorldOrganismUI;

// Auto-mount immediately or on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => WorldOrganismUI.init());
} else {
  WorldOrganismUI.init();
}
