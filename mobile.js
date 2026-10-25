/**
 * NEXUS Mobile Engine (v1.0)
 * Native-grade App Runtime for Smartphones (iOS / Android)
 */

const NexusMobile = (function () {
  let activeTab = 'home';
  let deferredPrompt = null;
  let recognition = null;
  let isListening = false;
  let ttsEnabled = true;

  // Cache elements
  const views = {};
  const dockItems = {};

  function init() {
    ['home', 'aura', 'agents', 'supervisor', 'settings'].forEach(id => {
      views[id] = document.getElementById(`view-${id}`);
      dockItems[id] = document.getElementById(`dock-${id}`);
    });

    initNavigation();
    initPWA();
    initAuraChat();
    initMultiAgentDAG();
    initSupervisor();
    initSettings();
    fetchClusterTelemetry();

    // Register service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      });
    }
  }

  /* --- Navigation & Tabs --- */
  function switchTab(tabId) {
    if (!views[tabId]) return;
    activeTab = tabId;

    Object.keys(views).forEach(k => {
      if (views[k]) views[k].classList.toggle('active', k === tabId);
    });

    Object.keys(dockItems).forEach(k => {
      if (dockItems[k]) dockItems[k].classList.toggle('active', k === tabId);
    });

    window.location.hash = `#${tabId}`;
    window.scrollTo(0, 0);
  }

  function initNavigation() {
    Object.keys(dockItems).forEach(tabId => {
      if (dockItems[tabId]) {
        dockItems[tabId].addEventListener('click', (e) => {
          e.preventDefault();
          switchTab(tabId);
        });
      }
    });

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (views[hash]) switchTab(hash);
    });

    const initialHash = window.location.hash.replace('#', '');
    if (views[initialHash]) switchTab(initialHash);
    else switchTab('home');
  }

  /* --- PWA Install Engine --- */
  function initPWA() {
    const banner = document.getElementById('install-banner');
    const installBtn = document.getElementById('btn-install-pwa');
    const settingsInstallBtn = document.getElementById('settings-install-btn');

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (isStandalone) {
      if (banner) banner.style.display = 'none';
      if (settingsInstallBtn) settingsInstallBtn.textContent = 'Aplicativo Instalado ✓';
      return;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (banner) banner.style.display = 'flex';
      console.log('[PWA] beforeinstallprompt captured successfully');
    });

    const triggerInstall = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          if (banner) banner.style.display = 'none';
        }
        deferredPrompt = null;
      } else {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
          alert('Para instalar no iPhone/iPad:\n1. Toque no botão de Compartilhar (ícone com quadrado e seta para cima)\n2. Role para baixo e selecione "Adicionar à Tela de Início".');
        } else {
          alert('Para instalar no celular:\nAbra o menu do seu navegador (três pontinhos no canto superior) e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".');
        }
      }
    };

    if (installBtn) installBtn.addEventListener('click', triggerInstall);
    if (settingsInstallBtn) settingsInstallBtn.addEventListener('click', triggerInstall);
  }

  /* --- Cluster Telemetry --- */
  async function fetchClusterTelemetry() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        const cpuEl = document.getElementById('telemetry-cpu');
        const ramEl = document.getElementById('telemetry-ram');
        const nodesEl = document.getElementById('telemetry-nodes');

        if (cpuEl && data.cpu) cpuEl.textContent = `${data.cpu.model ? data.cpu.model.split(' ')[0] : 'AMD EPYC'} (${data.cpu.cores} vCPUs)`;
        if (ramEl && data.memory) ramEl.textContent = `${(data.memory.usedBytes / 1024 / 1024 / 1024).toFixed(1)} / ${(data.memory.totalBytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
        if (nodesEl) nodesEl.textContent = `${data.graphDatabase?.nodes || 181} Nós / ${data.graphDatabase?.edges || 156} Arestas`;
      }
    } catch (_) {}
  }

  /* --- AURA Live Companion & Voice Chat --- */
  function initAuraChat() {
    const input = document.getElementById('aura-input');
    const sendBtn = document.getElementById('aura-send-btn');
    const micBtn = document.getElementById('aura-mic-btn');
    const chatArea = document.getElementById('aura-chat-area');
    const chips = document.querySelectorAll('.prompt-chip');

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        if (input) {
          input.value = chip.dataset.prompt || chip.textContent;
          sendAuraMessage();
        }
      });
    });

    if (sendBtn) sendBtn.addEventListener('click', sendAuraMessage);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendAuraMessage();
      });
    }

    // Voice recognition
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      recognition = new SpeechRec();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        isListening = true;
        if (micBtn) micBtn.classList.add('listening');
      };

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        if (input && text) {
          input.value = text;
          sendAuraMessage();
        }
      };

      recognition.onerror = () => {
        isListening = false;
        if (micBtn) micBtn.classList.remove('listening');
      };

      recognition.onend = () => {
        isListening = false;
        if (micBtn) micBtn.classList.remove('listening');
      };

      if (micBtn) {
        micBtn.addEventListener('click', () => {
          if (isListening) recognition.stop();
          else recognition.start();
        });
      }
    } else {
      if (micBtn) micBtn.style.display = 'none';
    }

    async function sendAuraMessage() {
      const q = (input?.value || '').trim();
      if (!q) return;

      appendBubble(q, 'user');
      if (input) input.value = '';
      if (sendBtn) sendBtn.disabled = true;

      const typingId = appendTypingIndicator();

      try {
        const res = await fetch('/api/agents/converse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: 'aura',
            message: q,
            apiKey: localStorage.getItem('nexus_gemini_key') || ''
          })
        });

        removeTypingIndicator(typingId);

        if (res.ok) {
          const data = await res.json();
          const reply = data.reply || 'Olá! Estou aqui para te apoiar em cada etapa da sua jornada.';
          appendBubble(reply, 'aura');
          if (ttsEnabled) speakText(data.voiceText || reply);
        } else {
          appendBubble('Desculpe, tive uma oscilação pontual ao consultar a rede. Pode repetir a mensagem?', 'aura');
        }
      } catch (err) {
        removeTypingIndicator(typingId);
        appendBubble('Estou funcionando em modo local protegido. Como posso te apoiar agora?', 'aura');
      } finally {
        if (sendBtn) sendBtn.disabled = false;
      }
    }

    function appendBubble(text, sender) {
      if (!chatArea) return;
      const b = document.createElement('div');
      b.className = `message-bubble ${sender}`;
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      b.innerHTML = `
        <div class="bubble-text">${escapeHtml(text)}</div>
        <div class="bubble-meta">
          <span>${sender === 'user' ? 'Você' : 'AURA 🌱'}</span>
          <span>•</span>
          <span>${now}</span>
        </div>
      `;
      chatArea.appendChild(b);
      chatArea.scrollTop = chatArea.scrollHeight;
    }

    function appendTypingIndicator() {
      if (!chatArea) return null;
      const id = 'typing-' + Date.now();
      const b = document.createElement('div');
      b.id = id;
      b.className = 'message-bubble aura';
      b.innerHTML = '<span class="typing-dot">Pensando...</span>';
      chatArea.appendChild(b);
      chatArea.scrollTop = chatArea.scrollHeight;
      return id;
    }

    function removeTypingIndicator(id) {
      if (!id) return;
      const el = document.getElementById(id);
      if (el) el.remove();
    }
  }

  /* --- Multi-Agent DAG Orchestrator --- */
  function initMultiAgentDAG() {
    const input = document.getElementById('dag-query-input');
    const runBtn = document.getElementById('btn-run-dag');
    const consensusCard = document.getElementById('dag-consensus-card');
    const consensusText = document.getElementById('dag-consensus-text');
    const shareBtn = document.getElementById('btn-share-consensus');
    const copyBtn = document.getElementById('btn-copy-consensus');

    if (!runBtn) return;

    runBtn.addEventListener('click', async () => {
      const q = (input?.value || '').trim();
      if (!q) return;

      runBtn.disabled = true;
      runBtn.textContent = 'Orquestrando DAG...';

      // Reset badges
      ['planner', 'critic', 'executor', 'verifier'].forEach(k => {
        const b = document.getElementById(`agent-badge-${k}`);
        const out = document.getElementById(`agent-output-${k}`);
        if (b) { b.className = 'agent-badge-pill THINKING'; b.textContent = 'THINKING'; }
        if (out) out.textContent = 'Processando vetor cognitivo...';
      });

      try {
        const res = await fetch('/api/agents/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: q,
            apiKey: localStorage.getItem('nexus_gemini_key') || ''
          })
        });

        if (res.ok) {
          const data = await res.json();
          ['planner', 'critic', 'executor', 'verifier'].forEach(k => {
            const b = document.getElementById(`agent-badge-${k}`);
            const out = document.getElementById(`agent-output-${k}`);
            if (b) { b.className = 'agent-badge-pill DONE'; b.textContent = 'DONE'; }
            if (out && data.agentOutputs?.[k]) {
              out.textContent = data.agentOutputs[k];
            }
          });

          if (consensusCard && consensusText && data.consensus) {
            consensusCard.style.display = 'block';
            consensusText.textContent = data.consensus;
            consensusCard.scrollIntoView({ behavior: 'smooth' });
          }
        }
      } catch (err) {
        alert('Erro ao orquestrar DAG. Verifique sua conexão.');
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = '⚡ Executar Consenso Multi-Agente';
      }
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (consensusText) {
          navigator.clipboard.writeText(consensusText.textContent);
          copyBtn.textContent = 'Copiado! ✓';
          setTimeout(() => { copyBtn.textContent = '📋 Copiar'; }, 2000);
        }
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        if (navigator.share && consensusText) {
          try {
            await navigator.share({
              title: 'Consenso NEXUS Superinteligência',
              text: consensusText.textContent,
              url: window.location.href
            });
          } catch (_) {}
        }
      });
    }
  }

  /* --- Supervisor Executive Console --- */
  function initSupervisor() {
    const input = document.getElementById('supervisor-input');
    const sendBtn = document.getElementById('supervisor-send-btn');
    const replyArea = document.getElementById('supervisor-reply-area');
    const passkeyInput = document.getElementById('supervisor-passkey');
    const unlockBtn = document.getElementById('btn-unlock-supervisor');
    const authGate = document.getElementById('supervisor-auth-gate');
    const consoleArea = document.getElementById('supervisor-console-area');

    function checkAuth() {
      const savedKey = localStorage.getItem('nexus_admin_key');
      if (savedKey === 'NEXUS-SOVEREIGN-2026') {
        if (authGate) authGate.style.display = 'none';
        if (consoleArea) consoleArea.style.display = 'block';
      }
    }
    checkAuth();

    if (unlockBtn && passkeyInput) {
      unlockBtn.addEventListener('click', () => {
        const val = passkeyInput.value.trim();
        if (val === 'NEXUS-SOVEREIGN-2026') {
          localStorage.setItem('nexus_admin_key', val);
          checkAuth();
        } else {
          alert('Chave de administração inválida.');
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', async () => {
        const msg = (input?.value || '').trim();
        if (!msg) return;

        input.value = '';
        sendBtn.disabled = true;

        const p = document.createElement('div');
        p.className = 'message-bubble user';
        p.textContent = msg;
        replyArea.appendChild(p);

        try {
          const res = await fetch('/api/supervisor/converse', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + (localStorage.getItem('nexus_admin_key') || 'NEXUS-SOVEREIGN-2026')
            },
            body: JSON.stringify({ message: msg })
          });

          if (res.ok) {
            const data = await res.json();
            const rep = document.createElement('div');
            rep.className = 'message-bubble aura';
            rep.textContent = data.reply;
            replyArea.appendChild(rep);
            if (ttsEnabled) speakText(data.reply);
          }
        } catch (_) {
          alert('Erro na comunicação executiva.');
        } finally {
          sendBtn.disabled = false;
        }
      });
    }
  }

  /* --- Settings & Data Management --- */
  function initSettings() {
    const keyInput = document.getElementById('settings-gemini-key');
    const saveKeyBtn = document.getElementById('btn-save-key');
    const clearDataBtn = document.getElementById('btn-clear-local-data');
    const voiceToggle = document.getElementById('toggle-tts');

    if (keyInput) keyInput.value = localStorage.getItem('nexus_gemini_key') || '';

    if (saveKeyBtn && keyInput) {
      saveKeyBtn.addEventListener('click', () => {
        localStorage.setItem('nexus_gemini_key', keyInput.value.trim());
        alert('Chave Gemini salva localmente com sucesso!');
      });
    }

    if (voiceToggle) {
      voiceToggle.checked = ttsEnabled;
      voiceToggle.addEventListener('change', () => {
        ttsEnabled = voiceToggle.checked;
      });
    }

    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => {
        if (confirm('Deseja limpar todos os dados locais e histórico do aplicativo no seu celular?')) {
          localStorage.clear();
          sessionStorage.clear();
          window.location.reload();
        }
      });
    }
  }

  /* --- Neural Text to Speech --- */
  function speakText(text) {
    if (!window.speechSynthesis || !ttsEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#_`>]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.startsWith('pt') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google')))
        || voices.find(v => v.lang.startsWith('pt'));

      if (ptVoice) utterance.voice = ptVoice;
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  return { init, switchTab };
})();

document.addEventListener('DOMContentLoaded', () => {
  NexusMobile.init();
});
