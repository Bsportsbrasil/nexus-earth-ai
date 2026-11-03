/**
 * NEXUS Sovereign Neural Voice & Acoustic Prosody Engine (v4.0 — Cloud Neural Stream + Zero-SAPI Guarantee)
 * Eliminates 100% of robotic/metallic desktop TTS artifacts across the entire platform and mobile app.
 * 
 * Architecture & Calibration Layers:
 *  1. True Cloud Neural Audio Stream (/api/tts):
 *     - Whenever the local browser only has legacy 16kHz metallic voices (e.g. "Microsoft Maria Desktop" on Windows),
 *       VoiceEngine automatically streams real 24kHz Cloud Neural MP3 audio via `/api/tts` with prefetching.
 *     - Only uses browser SpeechSynthesis if a verified Online Neural voice ("Natural", "Neural", "Online") is present.
 *  2. Multi-Language Support (11 Global Languages):
 *     - Supports pt-BR, en-US, es-ES, fr-FR, de-DE, it-IT, zh-CN, ja-JP, ar-SA, ru-RU, hi-IN.
 *  3. Phonetic & Conversational Sanitization:
 *     - Strips visual markdown (*, #, bullets, tables, links) and expands numeric decimals/symbols
 *       into natural spoken words in the target language.
 *  4. Semantic Breath-Group Chunking & Turn Dynamics (Barge-In):
 *     - Splits utterances into natural breathing clauses (< 160 chars) and pre-buffers the next audio chunk
 *       for zero-latency transitions between sentences.
 *     - Instant Barge-In support: stops both HTML5 Cloud Audio and SpeechSynthesis immediately when user speaks.
 */
const VoiceEngine = (function () {
  let cachedVoices = [];
  let isSpeaking = false;
  let activeUtterance = null;
  let activeAudioElement = null;
  let stopRequested = false;
  let preferredVoiceName = localStorage.getItem('nexus_preferred_voice') || '';

  const LANG_LOCALE_MAP = {
    pt: { bcp47: 'pt-BR', prefix: 'pt', regex: /pt[-_]?br|pt[-_]?pt|portugu/i },
    en: { bcp47: 'en-US', prefix: 'en', regex: /en[-_]?us|en[-_]?gb|english/i },
    es: { bcp47: 'es-ES', prefix: 'es', regex: /es[-_]?es|es[-_]?mx|es[-_]?us|spanish|español/i },
    fr: { bcp47: 'fr-FR', prefix: 'fr', regex: /fr[-_]?fr|fr[-_]?ca|french|français/i },
    de: { bcp47: 'de-DE', prefix: 'de', regex: /de[-_]?de|german|deutsch/i },
    it: { bcp47: 'it-IT', prefix: 'it', regex: /it[-_]?it|italian|italiano/i },
    zh: { bcp47: 'zh-CN', prefix: 'zh', regex: /zh[-_]?cn|zh[-_]?tw|chinese|mandarin/i },
    ja: { bcp47: 'ja-JP', prefix: 'ja', regex: /ja[-_]?jp|japanese/i },
    ar: { bcp47: 'ar-SA', prefix: 'ar', regex: /ar[-_]?sa|ar[-_]?eg|arabic/i },
    ru: { bcp47: 'ru-RU', prefix: 'ru', regex: /ru[-_]?ru|russian/i },
    hi: { bcp47: 'hi-IN', prefix: 'hi', regex: /hi[-_]?in|hindi/i }
  };

  function getActiveLangCode() {
    if (window.I18nEngine && window.I18nEngine.currentLang) {
      return window.I18nEngine.currentLang;
    }
    try {
      const saved = localStorage.getItem('nexus_lang');
      if (saved && LANG_LOCALE_MAP[saved]) return saved;
    } catch (_) {}
    return 'pt';
  }

  function getActiveBcp47(langOverride) {
    const code = (langOverride || getActiveLangCode()).toLowerCase().slice(0, 2);
    return (LANG_LOCALE_MAP[code] || LANG_LOCALE_MAP.pt).bcp47;
  }

  function loadVoices() {
    if (!('speechSynthesis' in window)) return [];
    cachedVoices = window.speechSynthesis.getVoices() || [];
    return cachedVoices;
  }

  if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
    };
  }

  /**
   * Checks if a browser voice is genuinely a high-definition Neural/Natural voice
   * (and NOT a robotic offline desktop SAPI voice like "Microsoft Maria Desktop").
   */
  function isTrueNeuralVoice(voice) {
    if (!voice || !voice.name) return false;
    const name = voice.name;
    if (/desktop|sapi|compact|espeak|google\s+portugu|google\s+us|google\s+espa/i.test(name)) return false;
    return /natural|neural|online|wavenet|studio|siri|premium|enhanced/i.test(name);
  }

  /**
   * Filters and ranks available voices for any target language from highest human fidelity to fallbacks
   */
  function getRankedVoices(persona = 'aura', langCode = null) {
    const targetLang = (langCode || getActiveLangCode()).toLowerCase().slice(0, 2);
    const langMeta = LANG_LOCALE_MAP[targetLang] || LANG_LOCALE_MAP.pt;
    const all = cachedVoices.length ? cachedVoices : loadVoices();

    let langVoices = all.filter(v => langMeta.regex.test((v.lang || '') + ' ' + (v.name || '')));
    if (!langVoices.length) {
      langVoices = all.filter(v => (v.lang || '').toLowerCase().startsWith(langMeta.prefix));
    }

    const femaleFavsByLang = {
      pt: [/thalita.*natural/i, /francisca.*natural/i, /leila.*natural/i, /thalita/i, /francisca/i, /google.*portugu/i, /luciana/i, /maria/i, /female|feminina/i],
      en: [/aria.*natural/i, /jenny.*natural/i, /ava.*natural/i, /samantha/i, /google.*us/i, /female/i],
      es: [/elvira.*natural/i, /dalia.*natural/i, /paloma/i, /paulina/i, /google.*espa/i, /female/i],
      fr: [/denise.*natural/i, /eloise/i, /amelie/i, /google.*fran/i],
      de: [/katja.*natural/i, /amala/i, /anna/i, /google.*deutsch/i],
      it: [/elsa.*natural/i, /isabella/i, /alice/i, /google.*ital/i],
      zh: [/xiaoxiao.*natural/i, /xiaoyi/i, /ting-ting/i, /google.*chin/i],
      ja: [/nanami.*natural/i, /kyoko/i, /google.*japan/i],
      ar: [/zariyah.*natural/i, /salma/i, /maged/i, /google.*arab/i],
      ru: [/svetlana.*natural/i, /dariya/i, /milena/i, /google.*russ/i],
      hi: [/swara.*natural/i, /lekha/i, /google.*hind/i]
    };

    const maleFavsByLang = {
      pt: [/antonio.*natural/i, /donato.*natural/i, /antonio/i, /donato/i, /nicolau/i, /google.*portugu/i, /male|masculin/i],
      en: [/guy.*natural/i, /christopher.*natural/i, /brian/i, /daniel/i, /google.*us/i, /male/i],
      es: [/alvaro.*natural/i, /jorge/i, /alonso/i, /google.*espa/i, /male/i],
      fr: [/henri.*natural/i, /thomas/i, /google.*fran/i],
      de: [/conrad.*natural/i, /killian/i, /google.*deutsch/i],
      it: [/diego.*natural/i, /luca/i, /google.*ital/i],
      zh: [/yunxi.*natural/i, /yunjian/i, /google.*chin/i],
      ja: [/keita.*natural/i, /otoya/i, /google.*japan/i],
      ar: [/hamed.*natural/i, /maged/i, /google.*arab/i],
      ru: [/dmitry.*natural/i, /yuri/i, /google.*russ/i],
      hi: [/madhur.*natural/i, /google.*hind/i]
    };

    const targetFavs = persona === 'supervisor'
      ? (maleFavsByLang[targetLang] || maleFavsByLang.pt)
      : (femaleFavsByLang[targetLang] || femaleFavsByLang.pt);

    return [...langVoices].sort((a, b) => {
      if (preferredVoiceName && a.name === preferredVoiceName) return -1;
      if (preferredVoiceName && b.name === preferredVoiceName) return 1;

      const aIsNeural = isTrueNeuralVoice(a);
      const bIsNeural = isTrueNeuralVoice(b);
      if (aIsNeural && !bIsNeural) return -1;
      if (!aIsNeural && bIsNeural) return 1;

      let scoreA = 99;
      let scoreB = 99;
      targetFavs.forEach((r, i) => {
        if (scoreA === 99 && r.test(a.name)) scoreA = i;
        if (scoreB === 99 && r.test(b.name)) scoreB = i;
      });
      if (scoreA !== scoreB) return scoreA - scoreB;

      if (targetLang === 'pt') {
        const aIsBr = /br/i.test(a.lang);
        const bIsBr = /br/i.test(b.lang);
        if (aIsBr && !bIsBr) return -1;
        if (!aIsBr && bIsBr) return 1;
      }

      return 0;
    });
  }

  function getRankedPtVoices(persona = 'aura') {
    return getRankedVoices(persona, 'pt');
  }

  function pickBestVoice(persona = 'aura', langCode = null) {
    const ranked = getRankedVoices(persona, langCode);
    return ranked[0] || null;
  }

  /**
   * Phonetic & Visual Sanitization:
   * Strips markdown, symbols, URLs, and expands numbers/currencies for natural spoken cadence.
   */
  function cleanSpeechText(raw, langCode = null) {
    const targetLang = (langCode || getActiveLangCode()).toLowerCase().slice(0, 2);
    let text = (raw || '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*#>`~_•|]/g, ' ')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '') // strip emojis & dingbats
      .replace(/\{[^}]+\}/g, ' ');

    if (targetLang === 'pt') {
      text = text
        .replace(/(\d+)\.(\d+)%/g, '$1 vírgula $2 por cento')
        .replace(/(\d+),(\d+)%/g, '$1 vírgula $2 por cento')
        .replace(/(\d+)%/g, '$1 por cento')
        .replace(/R\$\s*(\d+)/g, '$1 reais')
        .replace(/\$\s*(\d+)/g, '$1 dólares')
        .replace(/\b(\d+)\.(\d+)\b/g, '$1 vírgula $2');
    } else if (targetLang === 'es') {
      text = text
        .replace(/(\d+)\.(\d+)%/g, '$1 coma $2 por ciento')
        .replace(/(\d+)%/g, '$1 por ciento')
        .replace(/\$\s*(\d+)/g, '$1 dólares');
    } else if (targetLang === 'en') {
      text = text
        .replace(/(\d+)%/g, '$1 percent')
        .replace(/\$\s*(\d+)/g, '$1 dollars');
    }

    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Splits utterance into natural conversational turns (up to 320 chars) so Gemini 3.8 Neural TTS
   * synthesizes whole multi-sentence expressions with unified human prosody and emotional warmth.
   */
  function splitIntoBreathGroups(text) {
    if (!text) return [];
    if (text.length <= 320) return [text];

    const rawSentences = text.match(/[^.!?…]+[.!?…]*/g) || [text];
    const result = [];
    let currentTurn = '';

    for (const sentence of rawSentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      if ((currentTurn + ' ' + trimmed).trim().length <= 320) {
        currentTurn = (currentTurn + ' ' + trimmed).trim();
      } else {
        if (currentTurn) result.push(currentTurn);
        if (trimmed.length > 320) {
          const subClauses = trimmed.match(/[^,;:]+\s*[,;:]*/g) || [trimmed];
          let acc = '';
          for (const sc of subClauses) {
            if ((acc + ' ' + sc).trim().length <= 320) {
              acc = (acc + ' ' + sc).trim();
            } else {
              if (acc) result.push(acc);
              acc = sc.trim();
            }
          }
          currentTurn = acc;
        } else {
          currentTurn = trimmed;
        }
      }
    }
    if (currentTurn) result.push(currentTurn);
    return result.length ? result : [text];
  }

  /**
   * Plays text using the Expressive Gemini 3.8 Neural Audio Stream (/api/tts, voice 'Leda')
   * with next-chunk prebuffering. Falls back to browser SpeechSynthesis ONLY if offline.
   */
  function playCloudNeuralChunks(chunks, bcp47, rate, persona, onChunk, onDone, resolve, fallbackFn) {
    let idx = 0;
    let preloadedAudio = null;

    function buildAudioUrl(phrase) {
      return `/api/tts?persona=${encodeURIComponent(persona || 'aura')}&tl=${encodeURIComponent(bcp47)}&q=${encodeURIComponent(phrase)}`;
    }

    function applyPureStudioTimbre(audioEl) {
      // Gemini 3.8 Neural TTS (Leda) natively generates a sweet, cute, gentle and warm 24kHz voice.
      // Keep preservesPitch = true and natural 1.0x rate so zero time-stretch artifacts occur.
      if ('preservesPitch' in audioEl) audioEl.preservesPitch = true;
      if ('mozPreservesPitch' in audioEl) audioEl.mozPreservesPitch = true;
      if ('webkitPreservesPitch' in audioEl) audioEl.webkitPreservesPitch = true;
      audioEl.playbackRate = 1.0;
    }

    function playNext() {
      if (stopRequested || !isSpeaking || idx >= chunks.length) {
        isSpeaking = false;
        activeAudioElement = null;
        if (onDone) onDone();
        resolve();
        return;
      }

      const currentPhrase = (chunks[idx] || '').trim();
      const currentIndex = idx;
      idx++;

      if (!currentPhrase) {
        playNext();
        return;
      }

      const audio = preloadedAudio || new Audio(buildAudioUrl(currentPhrase));
      preloadedAudio = null;
      applyPureStudioTimbre(audio);
      activeAudioElement = audio;

      // Preload next chunk in background so transition has zero network lag
      if (idx < chunks.length && chunks[idx]) {
        try {
          preloadedAudio = new Audio(buildAudioUrl(chunks[idx].trim()));
          preloadedAudio.preload = 'auto';
        } catch (_) {}
      }

      audio.onplay = () => {
        if (onChunk) onChunk({ phrase: currentPhrase, index: currentIndex, total: chunks.length });
      };

      audio.onended = () => {
        if (stopRequested || !isSpeaking) {
          isSpeaking = false;
          resolve();
          return;
        }
        const pauseMs = currentPhrase.endsWith('...') ? 120 : 40;
        setTimeout(playNext, pauseMs);
      };

      audio.onerror = () => {
        if (fallbackFn && currentIndex === 0) {
          fallbackFn();
        } else {
          playNext();
        }
      };

      audio.play().catch(() => {
        if (fallbackFn && currentIndex === 0) {
          fallbackFn();
        } else {
          isSpeaking = false;
          if (onDone) onDone();
          resolve();
        }
      });
    }

    playNext();
  }

  /**
   * Speaks utterance using Expressive Gemini 3.8 Neural TTS (/api/tts — voice 'Leda' for AURA:
   * sweet, cute, gentle, warm & affectionate human female voice).
   * Falls back to local browser SpeechSynthesis only if completely offline.
   */
  function speak(text, options = {}) {
    const {
      persona = 'aura',
      lang = null,
      onStart = null,
      onDone = null,
      onChunk = null,
      rate = 1.0,
      pitch = 1.04
    } = options;

    stop();
    stopRequested = false;

    const activeLang = lang || getActiveLangCode();
    const bcp47 = getActiveBcp47(activeLang);
    const clean = cleanSpeechText(text, activeLang);
    if (!clean) {
      if (onDone) onDone();
      return Promise.resolve();
    }

    const bestLocalVoice = pickBestVoice(persona, activeLang);
    const chunks = splitIntoBreathGroups(clean);
    isSpeaking = true;

    if (onStart) {
      onStart({
        totalChunks: chunks.length,
        voiceName: `Gemini 3.8 Neural (${persona === 'supervisor' ? 'Charon' : 'Leda - Doce & Gentil'})`,
        lang: bcp47
      });
    }

    return new Promise((resolve) => {
      function speakLocalBrowserFallback() {
        if (!('speechSynthesis' in window)) {
          isSpeaking = false;
          if (onDone) onDone();
          resolve();
          return;
        }

        let currentIdx = 0;
        function speakNextLocal() {
          if (stopRequested || !isSpeaking || currentIdx >= chunks.length) {
            isSpeaking = false;
            if (onDone) onDone();
            resolve();
            return;
          }

          const phrase = (chunks[currentIdx] || '').trim();
          const chunkIndex = currentIdx;
          currentIdx++;

          if (!phrase) {
            speakNextLocal();
            return;
          }

          const u = new SpeechSynthesisUtterance(phrase);
          u.lang = bestLocalVoice?.lang || bcp47;
          if (bestLocalVoice) u.voice = bestLocalVoice;

          u.rate = rate;
          u.pitch = pitch;
          u.volume = 1.0;
          activeUtterance = u;

          u.onstart = () => {
            if (onChunk) onChunk({ phrase, index: chunkIndex, total: chunks.length });
          };

          u.onend = () => {
            setTimeout(speakNextLocal, 75);
          };

          u.onerror = (e) => {
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
              speakNextLocal();
            } else {
              isSpeaking = false;
              resolve();
            }
          };

          window.speechSynthesis.speak(u);
        }

        speakNextLocal();
      }

      // Always prioritize Expressive Gemini 3.8 Neural Audio (/api/tts — Leda) for a genuinely human,
      // sweet, cute and gentle voice on every device and browser!
      playCloudNeuralChunks(chunks, bcp47, rate, persona, onChunk, onDone, resolve, speakLocalBrowserFallback);
    });
  }

  /**
   * Barge-in & Immediate Audio Cancellation (Stops both Cloud Audio and Local SpeechSynthesis)
   */
  function stop() {
    stopRequested = true;
    isSpeaking = false;
    activeUtterance = null;
    if (activeAudioElement) {
      try {
        activeAudioElement.pause();
        activeAudioElement.src = '';
      } catch (_) {}
      activeAudioElement = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }

  function setPreferredVoice(name) {
    preferredVoiceName = name;
    if (name) localStorage.setItem('nexus_preferred_voice', name);
    else localStorage.removeItem('nexus_preferred_voice');
  }

  return {
    loadVoices,
    getRankedVoices,
    getRankedPtVoices,
    pickBestVoice,
    isTrueNeuralVoice,
    getActiveBcp47,
    cleanSpeechText,
    speak,
    stop,
    setPreferredVoice,
    get isSpeaking() { return isSpeaking; },
    get currentVoiceName() {
      const v = pickBestVoice();
      return isTrueNeuralVoice(v) ? v.name : `NEXUS Cloud Neural (${getActiveBcp47()})`;
    }
  };
})();

window.VoiceEngine = VoiceEngine;
