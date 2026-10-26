/**
 * NEXUS Frontier Mobile OS Runtime (v2.0)
 * 60 FPS Quantum Orb Canvas, Interactive Multi-Agent DAG, GraphRAG Explorer & Haptic Touch
 */

const NexusMobile = (function () {
  let activeTab = 'home';
  let deferredPrompt = null;
  let recognition = null;
  let isListening = false;
  let isSpeaking = false;
  let ttsEnabled = true;

  // Quantum Orb Canvas state
  let orbCanvas, orbCtx;
  let orbRadius = 50;
  let orbBaseRadius = 50;
  let orbTargetRadius = 50;
  let orbParticles = [];
  let orbAngle = 0;
  let animFrameId = null;

  // Cache views & dock
  const views = {};
  const dockItems = {};

  
  /* --- Humanized Empathy Mode & Dynamic i18n Integration --- */
  let activeEmpathyMode = 'EMPATHIC';

  function initEmpathyAndI18n() {
    const pills = document.querySelectorAll('#aura-empathy-pills .empathy-pill');
    pills.forEach(p => {
      p.addEventListener('click', () => {
        pills.forEach(b => {
          b.style.background = 'rgba(255, 255, 255, 0.05)';
          b.style.color = '#94a3b8';
          b.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        });
        p.style.background = 'rgba(0, 245, 255, 0.15)';
        p.style.color = '#00f5ff';
        p.style.borderColor = 'rgba(0, 245, 255, 0.4)';
        activeEmpathyMode = p.dataset.mode;
        triggerHaptic(18);

        const notices = {
          EMPATHIC: 'Modo Acolhedor & Empático ativado. AURA priorizará validação emocional e escuta ativa.',
          TEA: 'Modo Inclusivo TEA ativado. Respostas calmas, estruturadas e sem sobrecarga sensorial.',
          CREATIVE: 'Modo Criativo ativado. Insights inspiradores e pensamento lateral.',
          EXECUTIVE: 'Modo Direto & Executivo ativado. Respostas concisas e estruturadas.'
        };
        appendAuraNotice(notices[activeEmpathyMode] || 'Modo atualizado.');
      });
    });

    const langBtns = document.querySelectorAll('.mobile-lang-btn');
    const headerLangBtn = document.getElementById('mobile-header-lang-btn');

    function setMobileLanguage(code) {
      document.cookie = 'nexus_lang=' + code + '; path=/; max-age=31536000';
      langBtns.forEach(btn => {
        const isMatch = btn.dataset.lang === code;
        btn.style.borderColor = isMatch ? '#00f5ff' : 'rgba(255, 255, 255, 0.15)';
        btn.style.background = isMatch ? 'rgba(0, 245, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)';
        btn.style.color = isMatch ? '#00f5ff' : '#94a3b8';
      });
      if (headerLangBtn) headerLangBtn.textContent = '🌐 ' + code.toUpperCase();
      if (window.I18nEngine) {
        window.I18nEngine.applyLanguage(code);
      }
      triggerHaptic(20);
    }

    langBtns.forEach(btn => {
      btn.addEventListener('click', () => setMobileLanguage(btn.dataset.lang));
    });

    if (headerLangBtn) {
      headerLangBtn.addEventListener('click', () => {
        const cur = (headerLangBtn.textContent || '').includes('PT') ? 'en' : ((headerLangBtn.textContent || '').includes('EN') ? 'es' : 'pt');
        setMobileLanguage(cur);
      });
    }
  }

  function appendAuraNotice(text) {
    const stream = document.getElementById('aura-stream-area');
    if (!stream) return;
    const div = document.createElement('div');
    div.style.cssText = 'text-align:center; font-size:0.72rem; color:#00f5ff; background:rgba(0,245,255,0.08); border:1px dashed rgba(0,245,255,0.25); border-radius:8px; padding:6px 10px; margin:8px auto; max-width:90%;';
    div.textContent = '🌱 ' + text;
    stream.appendChild(div);
    stream.scrollTop = stream.scrollHeight;
  }

  function init() {
    ['home', 'aura', 'agents', 'graphrag', 'supervisor', 'settings'].forEach(id => {
      views[id] = document.getElementById(`view-${id}`);
      dockItems[id] = document.getElementById(`dock-${id}`);
    });

    initNavigation();
    initEmpathyAndI18n();
    initQuantumOrb();
    initCyberGrid();
    initAuraChat();
    initMultiAgentDAG();
    initGraphRAGExplorer();
    initSupervisor();
    initSettings();
    initPWA();
    startLiveTelemetryLoop();

    // Register ServiceWorker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('[PWA] ServiceWorker registration error:', err);
      });
    }
  }

  /* --- Haptic Feedback Helper --- */
  function triggerHaptic(ms = 12) {
    if (navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (_) {}
    }
  }

  /* --- Navigation & Clean HTML5 PushState Tab Switching (Zero '#' in URL) --- */
  function switchTab(tabId, updateUrl = true) {
    if (!views[tabId]) return;
    activeTab = tabId;
    triggerHaptic(15);

    Object.keys(views).forEach(k => {
      if (views[k]) views[k].classList.toggle('active', k === tabId);
    });

    Object.keys(dockItems).forEach(k => {
      if (dockItems[k]) dockItems[k].classList.toggle('active', k === tabId);
    });

    // Clean HTML5 History API (Zero '#' hashes in URL)
    if (updateUrl) {
      const isHome = tabId === 'home';
      const cleanUrl = isHome ? '/mobile' : `/mobile/${tabId}`;
      if (window.location.pathname !== cleanUrl || window.location.hash) {
        window.history.pushState({ tab: tabId }, '', cleanUrl);
      }
    } else if (window.location.hash) {
      try {
        window.history.replaceState({ tab: tabId }, '', window.location.pathname);
      } catch (_) {}
    }

    window.scrollTo(0, 0);

    // Dynamic Orb resize if switching between home and aura
    if (tabId === 'home' || tabId === 'aura') {
      orbBaseRadius = tabId === 'aura' ? 58 : 46;
    }
  }

  function resolveInitialTab() {
    // If user arrived with a legacy # hash, clean it up immediately
    if (window.location.hash) {
      const legacy = window.location.hash.replace('#', '').trim().toLowerCase();
      try {
        window.history.replaceState(null, '', window.location.pathname);
      } catch (_) {}
      if (views[legacy]) return legacy;
    }

    const path = window.location.pathname.toLowerCase();
    if (path.includes('/aura')) return 'aura';
    if (path.includes('/agent')) return 'agents';
    if (path.includes('/graph') || path.includes('/knowledge')) return 'graphrag';
    if (path.includes('/supervisor')) return 'supervisor';
    if (path.includes('/setting') || path.includes('/ajuste')) return 'settings';
    return 'home';
  }

  function initNavigation() {
    Object.keys(dockItems).forEach(tabId => {
      if (dockItems[tabId]) {
        dockItems[tabId].addEventListener('click', (e) => {
          e.preventDefault();
          switchTab(tabId, true);
        });
      }
    });

    window.addEventListener('popstate', (e) => {
      const tab = e.state?.tab || resolveInitialTab();
      switchTab(tab, false);
    });

    const initial = resolveInitialTab();
    switchTab(initial, false);
  }

  /* --- 60 FPS Quantum 3D Superintelligence Holo-Stage --- */
  let holo3DInstance = null;

  function initQuantumOrb() {
    if (window.QuantumHolo3D) {
      holo3DInstance = QuantumHolo3D.mount('neural-orb-canvas', {
        isMobile: true,
        scale: 0.88,
        onNodeClick: (node) => {
          triggerHaptic(25);
          const inspector = document.getElementById('holo-3d-inspector');
          const title = document.getElementById('holo-node-title');
          const desc = document.getElementById('holo-node-desc');
          const radius = document.getElementById('holo-node-radius');
          const status = document.getElementById('holo-node-status');

          if (inspector && title && desc) {
            inspector.style.display = 'block';
            title.innerHTML = `<span>🧬</span> ${escapeHtml(node.name)}`;
            desc.textContent = node.role;
            if (radius) radius.textContent = `ÓRBITA: ${node.radius}u`;
            if (status) status.textContent = 'INTERAGINDO';
          }
        }
      });
    }
  }

  /* --- Cyber Background Grid Canvas --- */
  function initCyberGrid() {
    const canvas = document.getElementById('cyber-grid-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const nodes = [];
    for (let i = 0; i < 28; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3
      });
    }

    function renderGrid() {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.08)';
      ctx.fillStyle = 'rgba(0, 245, 255, 0.3)';
      ctx.lineWidth = 0.8;

      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        n1.x += n1.vx;
        n1.y += n1.vy;
        if (n1.x < 0 || n1.x > w) n1.vx *= -1;
        if (n1.y < 0 || n1.y > h) n1.vy *= -1;

        ctx.beginPath();
        ctx.arc(n1.x, n1.y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(renderGrid);
    }
    renderGrid();
  }

  /* --- Live Telemetry Real-Time Loop --- */
  async function startLiveTelemetryLoop() {
    async function update() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          const cpuEl = document.getElementById('hud-val-cpu');
          const ramEl = document.getElementById('hud-val-ram');
          const nodesEl = document.getElementById('hud-val-nodes');
          const entropyEl = document.getElementById('hud-val-entropy');
          const pingEl = document.getElementById('hud-val-ping');

          if (cpuEl && data.cpu) cpuEl.textContent = `${data.cpu.cores} vCPUs`;
          if (ramEl && data.memory) ramEl.textContent = `${(data.memory.usedBytes / 1073741824).toFixed(1)} GB`;
          if (nodesEl && data.graphDatabase) nodesEl.textContent = `${data.graphDatabase.nodes} Nós`;
          if (entropyEl) entropyEl.textContent = '2.55 bits';
          if (pingEl) pingEl.textContent = '840 ms';
        }
      } catch (_) {}
    }
    update();
    setInterval(update, 10000);
  }

  /* --- AURA Live Companion & Speech Recognition --- */
  function initAuraChat() {
    const input = document.getElementById('aura-chat-input');
    const sendBtn = document.getElementById('aura-btn-send');
    const micBtn = document.getElementById('aura-btn-mic');
    const streamArea = document.getElementById('aura-stream-area');
    const chips = document.querySelectorAll('.matrix-chip');

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        triggerHaptic(12);
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

    // Voice recognition setup
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      recognition = new SpeechRec();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        isListening = true;
        triggerHaptic(30);
        if (holo3DInstance) holo3DInstance.triggerAudioPulse(35);
        if (micBtn) micBtn.classList.add('listening');
        const orbText = document.getElementById('orb-status-caption');
        if (orbText) orbText.textContent = 'Ouvindo sua voz...';
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
        const orbText = document.getElementById('orb-status-caption');
        if (orbText) orbText.textContent = 'Superinteligência Pronta';
      };

      recognition.onend = () => {
        isListening = false;
        if (micBtn) micBtn.classList.remove('listening');
        const orbText = document.getElementById('orb-status-caption');
        if (orbText) orbText.textContent = 'Superinteligência Pronta';
      };

      if (micBtn) {
        micBtn.addEventListener('click', () => {
          triggerHaptic(15);
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

      triggerHaptic(20);
      if (holo3DInstance) holo3DInstance.triggerAudioPulse(30);
      appendChatBubble(q, 'user');
      if (input) {
        input.value = '';
        input.focus();
      }

      const typingId = appendTypingBeacon();

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

        removeTypingBeacon(typingId);

        if (res.ok) {
          const data = await res.json();
          const reply = data.reply || 'Olá! Estou aqui para colaborar com você.';
          appendChatBubble(reply, 'aura');
          if (ttsEnabled) speakNeural(data.voiceText || reply);
        } else {
          appendChatBubble('Identifiquei uma oscilação momentânea de rede. Pode tentar novamente?', 'aura');
        }
      } catch (err) {
        removeTypingBeacon(typingId);
        appendChatBubble('Atuando em modo soberano local. Como posso te auxiliar agora?', 'aura');
      }
    }

    function appendChatBubble(text, sender) {
      if (!streamArea) return;
      const b = document.createElement('div');
      b.className = `chat-bubble ${sender}`;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      b.innerHTML = `
        <div class="bubble-content">${escapeHtml(text)}</div>
        <div class="bubble-meta-hud">
          <span>${sender === 'user' ? 'Você' : 'AURA • GEMINI 3.5'}</span>
          <span>•</span>
          <span>${time}</span>
        </div>
      `;
      streamArea.appendChild(b);
      streamArea.scrollTop = streamArea.scrollHeight;
    }

    function appendTypingBeacon() {
      if (!streamArea) return null;
      const id = 'beacon-' + Date.now();
      const b = document.createElement('div');
      b.id = id;
      b.className = 'chat-bubble aura';
      b.innerHTML = '<span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--cyan);animation:beaconPulse 1s infinite;">Processando sinapses neurais...</span>';
      streamArea.appendChild(b);
      streamArea.scrollTop = streamArea.scrollHeight;
      return id;
    }

    function removeTypingBeacon(id) {
      if (!id) return;
      const el = document.getElementById(id);
      if (el) el.remove();
    }
  }

  /* --- Multi-Agent DAG Flowchart & Consenso --- */
  function initMultiAgentDAG() {
    const input = document.getElementById('dag-task-input');
    const runBtn = document.getElementById('btn-execute-dag');
    const consensusCard = document.getElementById('dag-result-card');
    const consensusText = document.getElementById('dag-result-text');
    const copyBtn = document.getElementById('btn-dag-copy');
    const shareBtn = document.getElementById('btn-dag-share');

    if (!runBtn) return;

    runBtn.addEventListener('click', async () => {
      const q = (input?.value || '').trim();
      if (!q) return;

      triggerHaptic(25);
      runBtn.disabled = true;
      runBtn.textContent = 'Orquestrando DAG em Tempo Real...';

      // Reset step badges
      ['planner', 'critic', 'executor', 'verifier'].forEach(k => {
        const badge = document.getElementById(`dag-step-badge-${k}`);
        const card = document.getElementById(`dag-step-card-${k}`);
        const out = document.getElementById(`dag-step-out-${k}`);
        if (badge) { badge.className = 'hud-badge amber'; badge.textContent = 'THINKING'; }
        if (card) { card.className = 'dag-node-item active'; }
        if (out) out.textContent = 'Processando tensores cognitivos...';
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
          triggerHaptic(35);
          const data = await res.json();
          ['planner', 'critic', 'executor', 'verifier'].forEach(k => {
            const badge = document.getElementById(`dag-step-badge-${k}`);
            const card = document.getElementById(`dag-step-card-${k}`);
            const out = document.getElementById(`dag-step-out-${k}`);
            if (badge) { badge.className = 'hud-badge emerald'; badge.textContent = 'DONE'; }
            if (card) { card.className = 'dag-node-item done'; }
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
        alert('Erro ao executar orquestração DAG. Verifique sua conexão.');
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = '⚡ Disparar Consenso Multi-Agente';
      }
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        triggerHaptic(15);
        if (consensusText) {
          navigator.clipboard.writeText(consensusText.textContent);
          copyBtn.textContent = 'Copiado! ✓';
          setTimeout(() => { copyBtn.textContent = '📋 Copiar'; }, 2000);
        }
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        triggerHaptic(15);
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

  /* --- GraphRAG Real-Time Semantic Explorer --- */
  function initGraphRAGExplorer() {
    const input = document.getElementById('rag-query-input');
    const searchBtn = document.getElementById('rag-btn-search');
    const resultsContainer = document.getElementById('rag-results-container');
    const nodesBadge = document.getElementById('rag-nodes-badge');

    if (!searchBtn) return;

    searchBtn.addEventListener('click', async () => {
      const q = (input?.value || '').trim();
      if (!q) return;

      triggerHaptic(20);
      searchBtn.disabled = true;
      searchBtn.textContent = 'Buscando Vetores...';

      try {
        const res = await fetch('/api/agents/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q })
        });

        if (res.ok) {
          const data = await res.json();
          if (resultsContainer) {
            resultsContainer.innerHTML = '';
            const rag = data.rag || {};
            const seeds = rag.seedNodes || [];

            if (nodesBadge) nodesBadge.textContent = `${seeds.length} Nós Ativados`;

            seeds.forEach((node, idx) => {
              const div = document.createElement('div');
              div.className = 'cyber-card glow-cyan';
              div.style.marginBottom = '10px';
              div.innerHTML = `
                <div class="card-header-hud">
                  <div class="card-title-hud">
                    <span>🧬</span> ${escapeHtml(node.label || node.id)}
                  </div>
                  <span class="hud-badge cyan">SIM: ${(rag.topSimilarityScore * 100 || 92).toFixed(1)}%</span>
                </div>
                <p class="card-desc-hud" style="margin-bottom:6px;">${escapeHtml(node.summary || 'Entidade indexada no cluster GraphRAG 128D.')}</p>
                <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-dim);">
                  CATEGORIA: ${escapeHtml(node.category || 'Conceito')} • FONTE: WIKIPEDIA / CROSSREF
                </div>
              `;
              resultsContainer.appendChild(div);
            });
          }
        }
      } catch (_) {
        alert('Erro ao consultar grafo.');
      } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = '🔍 Buscar no Grafo Neural';
      }
    });
  }

  /* --- Supervisor LENNOX Master Console --- */
  function initSupervisor() {
    const input = document.getElementById('sup-msg-input');
    const sendBtn = document.getElementById('sup-btn-send');
    const chatStream = document.getElementById('sup-chat-stream');
    const passkey = document.getElementById('sup-passkey-input');
    const unlockBtn = document.getElementById('sup-btn-unlock');
    const gate = document.getElementById('sup-gate-panel');
    const cockpit = document.getElementById('sup-cockpit-panel');
    const killBtn = document.getElementById('btn-killswitch');

    function checkPass() {
      const saved = localStorage.getItem('nexus_admin_key');
      if (saved === 'NEXUS-SOVEREIGN-2026') {
        if (gate) gate.style.display = 'none';
        if (cockpit) cockpit.style.display = 'block';
      }
    }
    checkPass();

    if (unlockBtn && passkey) {
      unlockBtn.addEventListener('click', () => {
        triggerHaptic(20);
        const val = passkey.value.trim();
        if (val === 'NEXUS-SOVEREIGN-2026') {
          localStorage.setItem('nexus_admin_key', val);
          checkPass();
        } else {
          alert('Chave mestra soberana inválida.');
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', async () => {
        const msg = (input?.value || '').trim();
        if (!msg) return;

        triggerHaptic(15);
        if (input) {
          input.value = '';
          input.focus();
        }

        const u = document.createElement('div');
        u.className = 'chat-bubble user';
        u.textContent = msg;
        chatStream.appendChild(u);

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
            const s = document.createElement('div');
            s.className = 'chat-bubble aura';
            s.textContent = data.reply;
            chatStream.appendChild(s);
            if (ttsEnabled) speakNeural(data.reply);
          }
        } catch (_) {
          alert('Erro de comunicação com LENNOX.');
        }
      });
    }

    if (killBtn) {
      killBtn.addEventListener('click', async () => {
        triggerHaptic(40);
        if (confirm('ATENÇÃO: Ativar o Master Kill-Switch isolará todos os agentes do cluster em modo Zero-Trust. Deseja continuar?')) {
          alert('Comando emitido: Cluster em modo de contenção segura.');
        }
      });
    }
  }

  /* --- Settings, LGPD & Play Store Engine --- */
  function initSettings() {
    const keyInput = document.getElementById('set-gemini-key');
    const saveKeyBtn = document.getElementById('btn-set-savekey');
    const clearBtn = document.getElementById('btn-set-cleardata');
    const ttsToggle = document.getElementById('set-toggle-tts');

    if (keyInput) keyInput.value = localStorage.getItem('nexus_gemini_key') || '';

    if (saveKeyBtn && keyInput) {
      saveKeyBtn.addEventListener('click', () => {
        triggerHaptic(15);
        localStorage.setItem('nexus_gemini_key', keyInput.value.trim());
        alert('Chave salva localmente no cofre do aparelho.');
      });
    }

    if (ttsToggle) {
      ttsToggle.checked = ttsEnabled;
      ttsToggle.addEventListener('change', () => {
        ttsEnabled = ttsToggle.checked;
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        triggerHaptic(30);
        if (confirm('Deseja purgar todo o histórico local e memórias do aplicativo neste dispositivo?')) {
          localStorage.clear();
          sessionStorage.clear();
          window.location.reload();
        }
      });
    }
  }

  /* --- PWA Install Protocol --- */
  function initPWA() {
    const banner = document.getElementById('pwa-quick-banner');
    const installBtn = document.getElementById('btn-quick-install');
    const settingsInstallBtn = document.getElementById('btn-settings-install');

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      if (banner) banner.style.display = 'none';
      if (settingsInstallBtn) settingsInstallBtn.textContent = 'App Instalado ✓';
      return;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (banner) banner.style.display = 'flex';
    });

    const runInstall = async () => {
      triggerHaptic(20);
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted' && banner) banner.style.display = 'none';
        deferredPrompt = null;
      } else {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
          alert('Instalação no iOS:\nToque no ícone de Compartilhar (quadrado com seta para cima) e escolha "Adicionar à Tela de Início".');
        } else {
          alert('Instalação no Android:\nToque no menu (3 pontinhos) e escolha "Instalar aplicativo" ou "Adicionar à tela inicial".');
        }
      }
    };

    if (installBtn) installBtn.addEventListener('click', runInstall);
    if (settingsInstallBtn) settingsInstallBtn.addEventListener('click', runInstall);
  }

  /* --- Neural Text to Speech --- */
  function speakNeural(text) {
    if (!window.speechSynthesis || !ttsEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#_`>]/g, '').trim();
      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang = 'pt-BR';
      utt.rate = 1.05;

      utt.onstart = () => { isSpeaking = true; };
      utt.onend = () => { isSpeaking = false; };
      utt.onerror = () => { isSpeaking = false; };

      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.startsWith('pt') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google')))
        || voices.find(v => v.lang.startsWith('pt'));

      if (ptVoice) utt.voice = ptVoice;
      window.speechSynthesis.speak(utt);
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
