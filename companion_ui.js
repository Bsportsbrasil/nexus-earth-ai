// AURA — Daily-Learning Pluralistic & Empathetic Companion Agent UI (Mobile & Web Optimized)
const CompanionUI = (function () {
  const esc = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const now = () => new Date().toTimeString().slice(0, 8);
  const history = [];
  let ttsActive = true;

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

  function speakAura(text) {
    const orb = document.getElementById('aura-orb');
    if (!ttsActive || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = (text || '').replace(/[*#>`~_]/g, '');
    const u = new SpeechSynthesisUtterance(clean.slice(0, 380));
    u.lang = 'pt-BR';
    u.rate = 1.04;
    u.onstart = () => orb && orb.classList.add('speaking');
    u.onend = () => orb && orb.classList.remove('speaking');
    u.onerror = () => orb && orb.classList.remove('speaking');
    window.speechSynthesis.speak(u);
  }

  async function sendToAura(overrideText) {
    const inp = document.getElementById('aura-input');
    const styleSel = document.getElementById('aura-style-select');
    const stateLabel = document.getElementById('aura-state-label');
    const orb = document.getElementById('aura-orb');

    const msg = (overrideText !== undefined ? overrideText : inp?.value || '').trim();
    if (!msg) return;
    if (inp && overrideText === undefined) inp.value = '';

    const learningStyle = styleSel?.value || 'Visual, Lúdico & Histórias Criativas';
    addAuraMessage('user', esc(msg));
    const replyEl = addAuraMessage('assistant', '<span class="typing-cursor"></span>');

    if (orb) orb.classList.add('speaking');
    if (stateLabel) stateLabel.textContent = 'Compreendendo seu olhar único e adaptando explicação...';

    try {
      const resp = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          learningStyle,
          history,
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
      if (stateLabel) stateLabel.textContent = 'Aprendizado diário registrado com sucesso ✨';
      if (orb) orb.classList.remove('speaking');
      speakAura(data.reply);
    } catch (e) {
      if (orb) orb.classList.remove('speaking');
      if (replyEl) {
        replyEl.classList.add('error');
        replyEl.textContent = e.message;
      }
      if (stateLabel) stateLabel.textContent = 'Acesso pausado ou aguardando autorização.';
    }
  }

  function startLiveVoice() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const stateLabel = document.getElementById('aura-state-label');
    const orb = document.getElementById('aura-orb');
    if (!SpeechRec) {
      if (stateLabel) stateLabel.textContent = 'Use o navegador Chrome/Edge/Safari para voz ao vivo.';
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'pt-BR';
    rec.interimResults = false;
    if (orb) orb.classList.add('speaking');
    if (stateLabel) stateLabel.textContent = '🎙️ Ouvindo você com atenção e respeito... pode falar!';

    rec.onresult = (ev) => {
      const transcript = ev.results?.[0]?.[0]?.transcript || '';
      if (transcript) sendToAura(transcript);
    };
    rec.onerror = () => {
      if (orb) orb.classList.remove('speaking');
      if (stateLabel) stateLabel.textContent = 'Pronta para conversar por texto ou voz.';
    };
    rec.start();
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
    document.getElementById('aura-live-voice-btn')?.addEventListener('click', startLiveVoice);

    const ttsBtn = document.getElementById('aura-tts-toggle');
    if (ttsBtn) {
      ttsBtn.addEventListener('click', () => {
        ttsActive = !ttsActive;
        if (!ttsActive && window.speechSynthesis) window.speechSynthesis.cancel();
        ttsBtn.textContent = ttsActive ? '🔊 Voz ON' : '🔇 Voz OFF';
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

    // Sync mobile bottom dock active highlight
    document.querySelectorAll('.dock-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.dock-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }

  return { init, sendToAura };
})();
