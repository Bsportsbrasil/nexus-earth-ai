/**
 * NEXUS Sovereign Neural Voice & Acoustic Prosody Engine
 * Eliminates robotic/metallic TTS artifacts across the entire platform.
 * 
 * Features:
 *  1. Online Neural & Natural Voice Prioritization:
 *     - Automatically scans and prioritizes high-fidelity Microsoft Natural Online (Francisca, Antonio, Thalita)
 *       and Google Neural PT-BR voices over legacy 16kHz desktop SAPI voices.
 *  2. Semantic Breath-Group Chunking:
 *     - Splits utterances into natural breathing clauses at punctuation and conjunctions.
 *     - Inserts physiological micro-pauses (50ms - 90ms) to emulate human vocal pacing.
 *  3. Dynamic Prosody Contouring:
 *     - Applies natural pitch inflections on questions (?) and cadence reduction on sentence completions (.).
 *  4. Specialized Personas:
 *     - 'aura': Empathetic, warm, humanized neural female voice.
 *     - 'supervisor': Executive, calm, authoritative neural male/lead voice.
 *     - 'neutral': Balanced crisp clarity.
 */
const VoiceEngine = (function () {
  let cachedVoices = [];
  let isSpeaking = false;
  let activeUtterance = null;
  let preferredVoiceName = localStorage.getItem('nexus_preferred_voice') || '';

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
   * Filters and ranks available voices from highest human fidelity to legacy desktop fallbacks
   */
  function getRankedPtVoices(persona = 'aura') {
    const all = cachedVoices.length ? cachedVoices : loadVoices();
    const ptVoices = all.filter(v => /pt[-_]?br|portugu/i.test(v.lang + ' ' + v.name));

    // Priority lists by persona
    const femalePriorities = [
      /francisca.*natural/i,
      /thalita.*natural/i,
      /brenda.*natural/i,
      /leila.*natural/i,
      /google.*portugu.*brasil/i,
      /google.*portugu/i,
      /online.*natural/i,
      /natural/i,
      /luciana/i,
      /joana/i,
      /maria.*natural/i,
      /female|feminina/i
    ];

    const malePriorities = [
      /antonio.*natural/i,
      /donato.*natural/i,
      /nicolau.*natural/i,
      /google.*portugu.*brasil/i,
      /google.*portugu/i,
      /online.*natural/i,
      /natural/i,
      /felipe/i,
      /male|masculin/i
    ];

    const priorityList = persona === 'supervisor' ? malePriorities : femalePriorities;

    // Sort: Preferred user voice first, then natural/online, avoid 'Desktop'/'SAPI' formants
    return [...ptVoices].sort((a, b) => {
      if (preferredVoiceName && a.name === preferredVoiceName) return -1;
      if (preferredVoiceName && b.name === preferredVoiceName) return 1;

      // Penalize legacy robotic Desktop SAPI voices
      const aIsDesktop = /desktop|sapi/i.test(a.name);
      const bIsDesktop = /desktop|sapi/i.test(b.name);
      if (!aIsDesktop && bIsDesktop) return -1;
      if (aIsDesktop && !bIsDesktop) return 1;

      let scoreA = 999;
      let scoreB = 999;
      priorityList.forEach((pat, idx) => {
        if (scoreA === 999 && pat.test(a.name)) scoreA = idx;
        if (scoreB === 999 && pat.test(b.name)) scoreB = idx;
      });

      return scoreA - scoreB;
    });
  }

  function pickBestVoice(persona = 'aura') {
    const ranked = getRankedPtVoices(persona);
    return ranked[0] || (cachedVoices.length ? cachedVoices[0] : null);
  }

  /**
   * Sanitizes text to remove markdown, URLs, technical symbols and raw math
   * that sound robotic when read out literally by speech synthesizers.
   */
  function cleanSpeechText(raw) {
    return (raw || '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/```[\s\S]*?```/g, 'Bloco de código omitido.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#>`~_•]/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '') // strip emoji graphics
      .replace(/\{[^}]+\}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Splits utterance into semantic breath-groups with commas and clause boundaries
   */
  function splitIntoBreathGroups(text) {
    if (!text) return [];
    // Match clauses ending with punctuation or clauses of ~12-16 words
    const rawChunks = text.match(/[^.,!?;:]+[.,!?;:]*/g) || [text];
    const result = [];

    for (const chunk of rawChunks) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;
      // If chunk is too long (> 140 chars), split at conjunctions
      if (trimmed.length > 140) {
        const sub = trimmed.split(/\s+(e|mas|porém|pois|porque|quando|onde)\s+/i);
        for (let i = 0; i < sub.length; i++) {
          if (sub[i].trim()) result.push(sub[i].trim());
        }
      } else {
        result.push(trimmed);
      }
    }
    return result.length ? result : [text];
  }

  /**
   * Speaks utterance with humanized breathing cadence and natural prosody contour
   */
  function speak(text, options = {}) {
    if (!('speechSynthesis' in window)) return Promise.resolve();

    const {
      persona = 'aura',
      onStart = null,
      onDone = null,
      onChunk = null,
      rate = 0.98,
      pitch = 1.01
    } = options;

    stop();

    const clean = cleanSpeechText(text);
    if (!clean) {
      if (onDone) onDone();
      return Promise.resolve();
    }

    const voice = pickBestVoice(persona);
    const chunks = splitIntoBreathGroups(clean);
    let currentIdx = 0;
    isSpeaking = true;

    if (onStart) onStart({ totalChunks: chunks.length, voiceName: voice?.name || 'Default' });

    return new Promise((resolve) => {
      function speakNext() {
        if (!isSpeaking || currentIdx >= chunks.length) {
          isSpeaking = false;
          if (onDone) onDone();
          resolve();
          return;
        }

        const phrase = (chunks[currentIdx] || '').trim();
        const chunkIndex = currentIdx;
        currentIdx++;

        if (!phrase) {
          speakNext();
          return;
        }

        const u = new SpeechSynthesisUtterance(phrase);
        u.lang = 'pt-BR';
        if (voice) u.voice = voice;

        // Prosody adjustments based on sentence ending
        let phraseRate = rate;
        let phrasePitch = pitch;

        if (phrase.endsWith('?')) {
          phrasePitch = Math.min(1.2, pitch * 1.08); // slight inquisitive rise
        } else if (phrase.endsWith('.')) {
          phraseRate = Math.max(0.85, rate * 0.95); // gentle completion deceleration
        }

        u.rate = phraseRate;
        u.pitch = phrasePitch;
        u.volume = 1.0;
        activeUtterance = u;

        u.onstart = () => {
          if (onChunk) onChunk({ phrase, index: chunkIndex, total: chunks.length });
        };

        u.onend = () => {
          // Human-like physiological pause between breath-groups (55ms - 80ms)
          const pauseMs = phrase.endsWith('.') || phrase.endsWith('!') ? 110 : 60;
          setTimeout(speakNext, pauseMs);
        };

        u.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            speakNext();
          } else {
            isSpeaking = false;
            resolve();
          }
        };

        window.speechSynthesis.speak(u);
      }

      speakNext();
    });
  }

  function stop() {
    isSpeaking = false;
    activeUtterance = null;
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
    getRankedPtVoices,
    pickBestVoice,
    speak,
    stop,
    setPreferredVoice,
    get isSpeaking() { return isSpeaking; },
    get currentVoiceName() { return preferredVoiceName || pickBestVoice()?.name || 'Sistema'; }
  };
})();

window.VoiceEngine = VoiceEngine;
