// AURA — Continuous Hands-Free Live Voice & Daily-Learning Pluralistic Companion UI
const CompanionUI = (function () {
  const esc = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const now = () => new Date().toTimeString().slice(0, 8);
  const history = [];
  let ttsActive = true;
  let liveSessionActive = false;
  let isAuraSpeaking = false;
  let isProcessingTurn = false;
  let activeRecognizer = null;
  let cachedVoices = [];

  if ('speechSynthesis' in window) {
    const loadVoices = () => { cachedVoices = window.speechSynthesis.getVoices() || []; };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
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

  /**
   * Selects the most natural, gentle, non-robotic Neural PT-BR female voice available
   * Prioritizes Cloud/Neural Online voices (Francisca Natural, Thalita Natural, Google PT-BR, Luciana)
   * and avoids old metallic desktop SAPI voices whenever a neural voice exists.
   */
  function pickGentleHumanizedVoice() {
    if (!cachedVoices.length && 'speechSynthesis' in window) {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    }
    const ptVoices = cachedVoices.filter(v => /pt[-_]?br|portugu/i.test(v.lang + ' ' + v.name));
    const preferredPatterns = [
      /francisca.*natural/i,
      /thalita.*natural/i,
      /leila.*natural/i,
      /online.*natural/i,
      /google.*portugu/i,
      /luciana/i,
      /joana/i,
      /francisca/i,
      /thalita/i,
      /maria/i,
      /female|feminina/i
    ];
    for (const pat of preferredPatterns) {
      const match = ptVoices.find(v => pat.test(v.name));
      if (match) return match;
    }
    return ptVoices[0] || cachedVoices[0] || null;
  }

  function renderJournal(memory) {
    if (!memory) return;
    const countEl = document.getElementById('aura-count');
    if (countEl) countEl.textContent = memory.interactionCount || 0;

    const list = document.getElementById('aura-journal-list');
    if (!list) return;
    list.innerHTML = '';

    const items = memory.dailyJournal || [];
    if (!items.length) {
      list.innerHTML = '<span class="idle-text">Converse com a AURA para construir seu diário de descobertas diárias!</span>';
      return;
    }

    items.forEach(it => {
      const div = document.createElement('div');
      div.className = 'journal-item';
      div.innerHTML = `
        <div class="journal-meta">${esc(it.date)} ${esc(it.time || '')} • [${esc(it.styleUsed || 'Plural')}]</div>
        <div>${esc(it.insight)}</div>
      `;
      list.appendChild(div);
    });
  }

  function addAuraMessage(role, html) {
    const box = document.getElementById('aura-messages');
    if (!box) return null;
    const d = document.createElement('div');
    d.className = `chat-msg ${role}-msg`;
    d.innerHTML = `
      <div class="msg-avatar">${role === 'user' ? 'V' : 'A'}</div>
      <div class="msg-content">
        <div class="msg-name">${role === 'user' ? 'VOCÊ' : 'AURA'}</div>
        <div class="msg-text">${html}</div>
        <div class="msg-time">${now()}</div>
      </div>
    `;
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
    return d.querySelector('.msg-text');
  }

  /**
   * Speaks AURA's response with natural, gentle human prosody and automatically
   * resumes hands-free microphone listening the moment she finishes speaking.
   */
  function speakAura(text, onDoneSpeaking) {
    const orb = document.getElementById('aura-orb');
    const stateLabel = document.getElementById('aura-state-label');

    if (!ttsActive || !('speechSynthesis' in window)) {
      isAuraSpeaking = false;
      if (onDoneSpeaking) onDoneSpeaking();
      return;
    }

    // Stop active mic while AURA speaks so she doesn't hear her own audio output
    stopRecognizerInstance();
    window.speechSynthesis.cancel();

    const clean = (text || '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[*#>`~_•]/g, ' ')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 620);

    if (!clean) {
      isAuraSpeaking = false;
      if (onDoneSpeaking) onDoneSpeaking();
      return;
    }

    isAuraSpeaking = true;
    const sentences = clean.match(/[^.!?]+[.!?]*/g) || [clean];
    const voice = pickGentleHumanizedVoice();

    sentences.forEach((sentence, idx) => {
      const phrase = sentence.trim();
      if (!phrase) return;
      const u = new SpeechSynthesisUtterance(phrase);
      u.lang = 'pt-BR';
      if (voice) u.voice = voice;
      // Natural human conversational flow (not slow/robotic, not rushed, warm pitch)
      u.rate = 1.0;
      u.pitch = 1.03;
      u.volume = 1.0;

      if (idx === 0) {
        u.onstart = () => {
          isAuraSpeaking = true;
          if (orb) orb.classList.add('speaking');
          if (stateLabel) {
            stateLabel.textContent = liveSessionActive
              ? '🌸 AURA respondendo (Conversa Contínua Ao Vivo ativa)...'
              : '🌸 AURA falando com voz natural e gentil...';
          }
        };
      }
      if (idx === sentences.length - 1) {
        u.onend = () => {
          isAuraSpeaking = false;
          if (orb) orb.classList.remove('speaking');
          if (onDoneSpeaking) onDoneSpeaking();
        };
      }
      u.onerror = () => {
        isAuraSpeaking = false;
        if (orb) orb.classList.remove('speaking');
        if (onDoneSpeaking) onDoneSpeaking();
      };
      window.speechSynthesis.speak(u);
    });
  }

  async function sendToAura(overrideText) {
    const inp = document.getElementById('aura-input');
    const styleSel = document.getElementById('aura-style-select');
    const stateLabel = document.getElementById('aura-state-label');
    const orb = document.getElementById('aura-orb');

    const msg = (overrideText !== undefined ? overrideText : inp?.value || '').trim();
    if (!msg || isProcessingTurn) return;
    if (inp) inp.value = '';

    // Barge-in: if user sends a message while AURA is speaking, interrupt speech immediately
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    isAuraSpeaking = false;
    isProcessingTurn = true;

    const learningStyle = styleSel?.value || 'Visual, Lúdico & Histórias Criativas';
    const clientTemporal = getClientTemporal();

    addAuraMessage('user', esc(msg));
    const replyEl = addAuraMessage('assistant', '<span class="typing-cursor"></span>');

    if (orb) orb.classList.add('speaking');
    if (stateLabel) stateLabel.textContent = `⚡ Respondendo em tempo real (${clientTemporal.localeTime})...`;

    try {
      const resp = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          learningStyle,
          history,
          clientTemporal,
          apiKey: window.Gemini ? Gemini.getKey() : ''
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || `HTTP ${resp.status}`);
      }

      const formatted = esc(data.reply || '').replace(/\n/g, '<br>');
      if (replyEl) replyEl.innerHTML = formatted;

      history.push({ role: 'user', parts: [{ text: msg }] });
      history.push({ role: 'model', parts: [{ text: data.reply || '' }] });

      if (data.memory) renderJournal(data.memory);
      isProcessingTurn = false;

      // Speak response and automatically re-open microphone when finished if live session is active!
      speakAura(data.reply, () => {
        if (liveSessionActive) {
          startListeningTurn();
        } else if (stateLabel) {
          stateLabel.textContent = `Sincronizada (${getClientTemporal().localeTime}) • Pronta para conversar ✨`;
        }
      });
    } catch (e) {
      isProcessingTurn = false;
      if (orb) orb.classList.remove('speaking');
      if (replyEl) {
        replyEl.classList.add('error');
        replyEl.textContent = e.message;
      }
      if (stateLabel) stateLabel.textContent = 'Acesso contido pelo C2 ou aguardando autorização.';
      if (liveSessionActive) {
        setTimeout(startListeningTurn, 1200);
      }
    }
  }

  function stopRecognizerInstance() {
    if (activeRecognizer) {
      try {
        activeRecognizer.onend = null;
        activeRecognizer.stop();
      } catch (e) {}
      activeRecognizer = null;
    }
  }

  /**
   * Starts a single continuous listening turn in Hands-Free Live Mode.
   * Automatically restarts if silence occurs while liveSessionActive === true.
   */
  function startListeningTurn() {
    if (!liveSessionActive || isAuraSpeaking || isProcessingTurn) return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const stateLabel = document.getElementById('aura-state-label');
    const orb = document.getElementById('aura-orb');
    const inp = document.getElementById('aura-input');

    if (!SpeechRec) {
      liveSessionActive = false;
      updateLiveButtonUI();
      if (stateLabel) stateLabel.textContent = 'Use o Chrome, Edge ou Safari para conversa por voz contínua.';
      return;
    }

    stopRecognizerInstance();
    const rec = new SpeechRec();
    activeRecognizer = rec;
    rec.lang = 'pt-BR';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    if (orb) orb.classList.add('speaking');
    if (stateLabel) stateLabel.textContent = '🎙️ Conversa Ao Vivo Ativa — Pode falar naturalmente (sem apertar botões)...';

    let finalTranscript = '';

    rec.onresult = (ev) => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) {
          finalTranscript += t + ' ';
        } else {
          interim += t;
        }
      }
      if (inp && (finalTranscript || interim)) {
        inp.value = (finalTranscript + interim).trim();
      }
    };

    rec.onend = () => {
      activeRecognizer = null;
      const spoken = finalTranscript.trim();
      if (spoken && liveSessionActive && !isProcessingTurn) {
        sendToAura(spoken);
      } else if (liveSessionActive && !isAuraSpeaking && !isProcessingTurn) {
        // Keep listening seamlessly without requiring the user to press the button again
        setTimeout(() => {
          if (liveSessionActive && !isAuraSpeaking && !isProcessingTurn) startListeningTurn();
        }, 250);
      } else if (!liveSessionActive && orb) {
        orb.classList.remove('speaking');
      }
    };

    rec.onerror = (ev) => {
      activeRecognizer = null;
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        liveSessionActive = false;
        updateLiveButtonUI();
        if (orb) orb.classList.remove('speaking');
        if (stateLabel) stateLabel.textContent = 'Permissão de microfone negada no navegador.';
        return;
      }
      if (liveSessionActive && !isAuraSpeaking && !isProcessingTurn) {
        setTimeout(startListeningTurn, 500);
      }
    };

    try {
      rec.start();
    } catch (e) {}
  }

  function updateLiveButtonUI() {
    const liveBtn = document.getElementById('aura-live-voice-btn');
    const orb = document.getElementById('aura-orb');
    const stateLabel = document.getElementById('aura-state-label');
    if (!liveBtn) return;

    if (liveSessionActive) {
      liveBtn.textContent = '🔴 Conversa Ao Vivo Ativa (Parar)';
      liveBtn.style.borderColor = 'var(--rose)';
      liveBtn.style.color = '#fff';
      liveBtn.style.background = 'rgba(244,63,94,0.28)';
    } else {
      liveBtn.textContent = '🎙️ Iniciar Conversa Ao Vivo';
      liveBtn.style.borderColor = '';
      liveBtn.style.color = '';
      liveBtn.style.background = '';
      if (orb) orb.classList.remove('speaking');
      if (stateLabel) stateLabel.textContent = `Sincronizada (${getClientTemporal().localeTime}) • Pronta para conversar ✨`;
    }
  }

  function toggleContinuousLiveVoice() {
    liveSessionActive = !liveSessionActive;
    updateLiveButtonUI();
    if (liveSessionActive) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      isAuraSpeaking = false;
      startListeningTurn();
    } else {
      stopRecognizerInstance();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      isAuraSpeaking = false;
    }
  }

  function init() {
    fetch('/api/companion')
      .then(r => r.ok ? r.json() : null)
      .then(mem => { if (mem) renderJournal(mem); })
      .catch(() => {});

    if (window.NexusWS) {
      NexusWS.onMessage((msg) => {
        if (msg.type === 'aura_stream' && msg.visibleText) {
          const box = document.getElementById('aura-messages');
          const last = box?.querySelector('.assistant-msg:last-child .msg-text');
          if (last) {
            last.innerHTML = esc(msg.visibleText).replace(/\n/g, '<br>') + '<span class="typing-cursor"></span>';
            box.scrollTop = box.scrollHeight;
          }
        }
      });
    }

    document.getElementById('aura-send-btn')?.addEventListener('click', () => sendToAura());
    document.getElementById('aura-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendToAura();
    });
    document.getElementById('aura-live-voice-btn')?.addEventListener('click', toggleContinuousLiveVoice);

    // Clicking the AURA orb also toggles continuous hands-free voice conversation
    document.getElementById('aura-orb')?.addEventListener('click', toggleContinuousLiveVoice);

    const ttsBtn = document.getElementById('aura-tts-toggle');
    if (ttsBtn) {
      ttsBtn.addEventListener('click', () => {
        ttsActive = !ttsActive;
        if (!ttsActive && window.speechSynthesis) window.speechSynthesis.cancel();
        ttsBtn.textContent = ttsActive ? '🔊 Voz Natural ON' : '🔇 Voz OFF';
      });
    }

    document.getElementById('aura-clear-btn')?.addEventListener('click', async () => {
      const r = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });
      if (r.ok) renderJournal(await r.json());
    });

    document.querySelectorAll('.aura-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const p = chip.getAttribute('data-prompt');
        if (p) sendToAura(p);
      });
    });

    document.querySelectorAll('.dock-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.dock-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });

    updateLiveButtonUI();
  }

  return { init, sendToAura };
})();
