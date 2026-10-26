// AURA — Continuous Hands-Free Live Voice & Daily-Learning Pluralistic Companion UI
const CompanionUI = (function () {
  const esc = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const now = () => new Date().toTimeString().slice(0, 8);
  const history = [];
  let ttsActive = true;
  let liveSessionActive = false;
  let isAuraSpeaking = false;
  let isProcessingTurn = false;
  let lastAuraSpokenText = "";
  let activeRecognizer = null;
  let cachedVoices = [];
  let userCadence = Number(localStorage.getItem('nexus_aura_voice_rate') || 1.0);

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

    const nameInp = document.getElementById('aura-user-name');
    if (nameInp && memory.userName && document.activeElement !== nameInp) {
      nameInp.value = memory.userName;
    }

    const emoBadge = document.getElementById('aura-emotion-badge');
    if (emoBadge && memory.lastDetectedEmotion) {
      emoBadge.textContent = memory.lastDetectedEmotion;
    }

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
  function speakAura(text, onDoneSpeaking, emotionProfile = null) {
    const orb = document.getElementById('aura-orb');
    const stateLabel = document.getElementById('aura-state-label');

    if (!ttsActive || !('speechSynthesis' in window)) {
      isAuraSpeaking = false;
      if (onDoneSpeaking) onDoneSpeaking();
      return;
    }

    // Stop active mic while AURA speaks so she doesn't hear her own audio output
    stopRecognizerInstance();

    if (window.VoiceEngine) {
      isAuraSpeaking = true;
      if (orb) orb.classList.add('speaking');
      if (stateLabel) stateLabel.textContent = 'AURA respondendo com voz natural e acolhedora...';

      VoiceEngine.speak(text, {
        persona: 'aura',
        rate: Math.min(1.2, Math.max(0.85, (emotionProfile?.rate || 0.98) * userCadence)),
        pitch: emotionProfile?.pitch || 1.01,
        onDone: () => {
          isAuraSpeaking = false;
          if (orb) orb.classList.remove('speaking');
          if (stateLabel) {
            stateLabel.textContent = liveSessionActive
              ? 'AURA ouvindo continuamente você agora (fale livremente)...'
              : 'Pronta para conversar e aprender com você hoje';
          }
          if (onDoneSpeaking) onDoneSpeaking();
        }
      });
      return;
    }

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
    lastAuraSpokenText = clean.toLowerCase();
    const voice = pickGentleHumanizedVoice();
    const targetRate = Math.min(1.8, Math.max(0.6, (emotionProfile?.rate || 1.0) * userCadence));
    const targetPitch = emotionProfile?.pitch || 1.03;

    // Split text into natural conversational chunks by commas, semicolons and sentences for natural breathing pauses
    const chunks = clean.match(/[^.,!?;:]+[.,!?;:]*/g) || [clean];

    let currentIdx = 0;
    function speakNextChunk() {
      if (!isAuraSpeaking || currentIdx >= chunks.length) {
        isAuraSpeaking = false;
        if (orb) orb.classList.remove('speaking');
        if (stateLabel) {
          stateLabel.textContent = liveSessionActive
            ? '🎙️ AURA ouvindo continuamente você agora (fale livremente)...'
            : 'Pronta para conversar e aprender com você hoje';
        }
        setTimeout(() => {
          if (onDoneSpeaking) onDoneSpeaking();
        }, 700);
        return;
      }

      const phrase = (chunks[currentIdx] || '').trim();
      currentIdx++;
      if (!phrase) {
        speakNextChunk();
        return;
      }

      const u = new SpeechSynthesisUtterance(phrase);
      const tLang = window.I18nEngine ? I18nEngine.currentLang : 'pt';
      u.lang = tLang === 'en' ? 'en-US' :
               tLang === 'es' ? 'es-ES' :
               tLang === 'fr' ? 'fr-FR' :
               tLang === 'de' ? 'de-DE' :
               tLang === 'it' ? 'it-IT' :
               tLang === 'zh' ? 'zh-CN' :
               tLang === 'ja' ? 'ja-JP' :
               tLang === 'ar' ? 'ar-SA' :
               tLang === 'ru' ? 'ru-RU' :
               tLang === 'hi' ? 'hi-IN' : 'pt-BR';
      if (voice) u.voice = voice;
      u.rate = targetRate;
      u.pitch = targetPitch;
      u.volume = 1.0;

      u.onstart = () => {
        if (orb) orb.classList.add('speaking');
        if (stateLabel) {
          stateLabel.textContent = liveSessionActive
            ? '🌸 AURA respondendo com voz natural e acolhedora...'
            : '🌸 AURA falando com entonação empática e direta...';
        }
      };

      u.onend = () => {
        // Natural micro-pause between clauses
        setTimeout(speakNextChunk, 45);
      };

      u.onerror = () => {
        speakNextChunk();
      };

      window.speechSynthesis.speak(u);
    }

    speakNextChunk();
  }

  async function sendToAura(overrideText) {
    const inp = document.getElementById('aura-input');
    const styleSel = document.getElementById('aura-style-select');
    const stateLabel = document.getElementById('aura-state-label');
    const orb = document.getElementById('aura-orb');

    const msg = (overrideText !== undefined ? overrideText : inp?.value || '').trim();
    if (!msg) return;
    if (inp) {
      inp.value = '';
      inp.focus();
    }

    // Barge-in: if user sends a message while AURA is speaking, interrupt speech immediately
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    if (window.VoiceEngine && typeof VoiceEngine.stop === 'function') {
      VoiceEngine.stop();
    }
    isAuraSpeaking = false;

    const learningStyle = styleSel?.value || 'Visual, Lúdico & Histórias Criativas';
    const userName = (document.getElementById('aura-user-name')?.value || 'Ana').trim() || 'Ana';
    const clientTemporal = getClientTemporal();

    addAuraMessage('user', esc(msg));
    const replyEl = addAuraMessage('assistant', '<span class="typing-cursor"></span>');

    if (orb) orb.classList.add('speaking');
    if (stateLabel) stateLabel.textContent = `⚡ Analisando contexto emocional de ${userName} (${clientTemporal.localeTime})...`;

    try {
      const resp = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          userName,
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

      let formatted = esc(data.reply || '').replace(/\n/g, '<br>');
      const lowerQ = msg.toLowerCase();
      const hasGeoIntent = lowerQ.includes('localiza') || lowerQ.includes('mercado') || lowerQ.includes('onde') || lowerQ.includes('mapa') || lowerQ.includes('earth') || lowerQ.includes('distancia') || lowerQ.includes('coordenada') || lowerQ.includes('pipa') || lowerQ.includes('restaurante') || lowerQ.includes('praia') || lowerQ.includes('hotel') || lowerQ.includes('comer') || (data.reply && data.reply.includes('/earth#'));
      if (hasGeoIntent) {
        const earthMatch = data.reply && data.reply.match(/\(\/earth#[^\)]+\)/);
        const earthUrl = earthMatch ? earthMatch[1] : '/earth';
        formatted += `<div style="margin-top:0.65rem;display:flex;gap:0.4rem;flex-wrap:wrap;">
          <a href="${earthUrl}" class="aura-chip" style="text-decoration:none;display:inline-flex;align-items:center;gap:0.35rem;border-color:var(--cyan);color:var(--cyan);background:rgba(0,245,255,0.12);font-weight:600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/></svg>
            🌍 Abrir Módulo Earth Geo (Mapeamento 3D &amp; Satélite HD)
          </a>
        </div>`;
      }
      if (replyEl) replyEl.innerHTML = formatted;

      history.push({ role: 'user', parts: [{ text: msg }] });
      history.push({ role: 'model', parts: [{ text: data.reply || '' }] });

      if (data.memory) renderJournal(data.memory);
      isProcessingTurn = false;

      // Speak response with emotionally adapted vocal prosody and automatically re-open microphone when finished if live session is active!
      speakAura(data.reply, () => {
        if (liveSessionActive) {
          startListeningTurn();
        } else if (stateLabel) {
          stateLabel.textContent = `Sincronizada com ${data.memory?.userName || userName} (${getClientTemporal().localeTime}) ✨`;
        }
      }, data.emotionProfile);
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
    const currentLang = window.I18nEngine ? I18nEngine.currentLang : 'pt';
    rec.lang = currentLang === 'en' ? 'en-US' :
               currentLang === 'es' ? 'es-ES' :
               currentLang === 'fr' ? 'fr-FR' :
               currentLang === 'de' ? 'de-DE' :
               currentLang === 'it' ? 'it-IT' :
               currentLang === 'zh' ? 'zh-CN' :
               currentLang === 'ja' ? 'ja-JP' :
               currentLang === 'ar' ? 'ar-SA' :
               currentLang === 'ru' ? 'ru-RU' :
               currentLang === 'hi' ? 'hi-IN' : 'pt-BR';
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
      const lower = spoken.toLowerCase();
      const isEcho = lastAuraSpokenText && (
        lower.length < 4 ||
        lastAuraSpokenText.includes(lower) ||
        (lower.length > 15 && lastAuraSpokenText.includes(lower.slice(0, 25)))
      );
      if (spoken && !isEcho && liveSessionActive && !isProcessingTurn) {
        sendToAura(spoken);
      } else if (liveSessionActive && !isAuraSpeaking && !isProcessingTurn) {
        // Keep listening seamlessly without requiring the user to press the button again
        setTimeout(() => {
          if (liveSessionActive && !isAuraSpeaking && !isProcessingTurn) startListeningTurn();
        }, 350);
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

    const isMobile = window.innerWidth <= 768;

    const t = window.I18nEngine ? window.I18nEngine.t : (k, d) => d;
    if (liveSessionActive) {
      liveBtn.textContent = isMobile ? t('auraLiveBtnStop', '🔴 Parar') : t('auraLiveBtnStop', '🔴 Parar');
      liveBtn.style.borderColor = 'var(--rose)';
      liveBtn.style.color = '#fff';
      liveBtn.style.background = 'rgba(244,63,94,0.28)';
    } else {
      liveBtn.textContent = isMobile ? t('auraLiveBtnStart', '🎙️ Voz Ao Vivo') : t('auraLiveBtnStart', '🎙️ Iniciar Conversa Ao Vivo');
      liveBtn.style.borderColor = '';
      liveBtn.style.color = '';
      liveBtn.style.background = '';
      if (orb) orb.classList.remove('speaking');
      if (stateLabel) stateLabel.textContent = `${t('auraReady', 'Pronta para conversar e aprender com você hoje ✨')}`;
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

    const cadenceBtn = document.getElementById('aura-cadence-btn');
    if (cadenceBtn) {
      cadenceBtn.textContent = `⚡ ${userCadence.toFixed(userCadence === 1.15 ? 2 : 1)}x`;
      cadenceBtn.addEventListener('click', () => {
        if (userCadence === 1.0) userCadence = 1.15;
        else if (userCadence === 1.15) userCadence = 1.3;
        else if (userCadence === 1.3) userCadence = 0.9;
        else userCadence = 1.0;
        localStorage.setItem('nexus_aura_voice_rate', userCadence);
        cadenceBtn.textContent = `⚡ ${userCadence.toFixed(userCadence === 1.15 ? 2 : 1)}x`;
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
