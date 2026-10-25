// Actionable Task Automation, Multimodal Media/Report Studio & Omnichannel Voice/Translation Hub
const AssistantStudio = (function () {
  const esc = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  let ttsEnabled = false;
  let lastShareableText = 'Confira meu briefing executivo gerado no NEXUS Superintelligence Platform!';

  // ── 1. Task & Calendar Automation ──
  function renderTasks(items) {
    const box = document.getElementById('task-list-box');
    if (!box) return;
    if (!items || !items.length) {
      box.innerHTML = '<span class="idle-text">Nenhum compromisso agendado.</span>';
      return;
    }
    box.innerHTML = '';
    items.forEach(it => {
      const row = document.createElement('div');
      row.className = 'task-item' + (it.status === 'COMPLETED' ? ' done' : '');
      row.innerHTML = `
        <div style="flex:1;cursor:pointer" data-toggle="${esc(it.id)}">
          <div class="task-meta">${esc(it.date)} • ${esc(it.time || '09:00')} [${esc(it.category || 'Task')}]</div>
          <div>${esc(it.title)}</div>
        </div>
        <button class="btn-secondary" data-gcal="${esc(it.id)}" title="Sincronizar com Google Calendar API / Web" style="padding:2px 7px;font-size:0.68rem">☁️ GCal</button>
        <button class="btn-secondary" data-del="${esc(it.id)}" style="padding:2px 7px;font-size:0.7rem">✕</button>
      `;
      row.querySelector('[data-toggle]').onclick = () => toggleTask(it.id);
      row.querySelector('[data-gcal]').onclick = () => syncTaskToGoogleCalendar(it);
      row.querySelector('[data-del]').onclick = () => deleteTask(it.id);
      box.appendChild(row);
    });
  }

  async function loadTasks() {
    try {
      const r = await fetch('/api/tasks');
      if (r.ok) {
        const d = await r.json();
        renderTasks(d.items);
      }
    } catch (e) {}
  }

  async function addTask() {
    const titleEl = document.getElementById('task-title-input');
    const dateEl = document.getElementById('task-date-input');
    const timeEl = document.getElementById('task-time-input');
    const title = (titleEl.value || '').trim();
    if (!title) return;
    titleEl.value = '';
    try {
      const r = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date: dateEl.value || new Date().toISOString().slice(0, 10),
          time: timeEl.value || '09:00',
          category: 'Schedule'
        })
      });
      if (r.ok) {
        const d = await r.json();
        renderTasks(d.items);
      }
    } catch (e) {}
  }

  async function toggleTask(id) {
    try {
      const r = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id })
      });
      if (r.ok) renderTasks((await r.json()).items);
    } catch (e) {}
  }

  async function deleteTask(id) {
    try {
      const r = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      if (r.ok) renderTasks((await r.json()).items);
    } catch (e) {}
  }

  async function syncTaskToGoogleCalendar(taskItem) {
    try {
      const r = await fetch('/api/cloud/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'gcal', taskItem })
      });
      if (r.ok) {
        const d = await r.json();
        if (d.syncedToCloud && d.response?.htmlLink) {
          window.open(d.response.htmlLink, '_blank', 'noopener');
          return;
        }
        if (d.googleCalendarTemplateUrl) {
          window.open(d.googleCalendarTemplateUrl, '_blank', 'noopener');
        }
      }
    } catch (_) {}
  }

  async function generateSmartPlan() {
    const inp = document.getElementById('plan-goal-input');
    const btn = document.getElementById('plan-gen-btn');
    const out = document.getElementById('briefing-output');
    const goal = (inp.value || '').trim() || 'Rotina produtiva de Engenharia de IA e Treino Físico';
    btn.disabled = true;
    out.style.display = 'block';
    out.innerHTML = '⏳ Pesquisando evidências reais e estruturando cronograma no calendário...';

    try {
      const r = await fetch('/api/tasks/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          apiKey: window.Gemini ? Gemini.getKey() : ''
        })
      });
      if (r.ok) {
        const d = await r.json();
        renderTasks(d.items);
        out.innerHTML = esc(d.briefing).replace(/\n/g, '<br>');
        lastShareableText = d.briefing;
        speakText(d.briefing.slice(0, 220));
      }
    } catch (e) {
      out.textContent = 'Erro ao gerar plano: ' + e.message;
    }
    btn.disabled = false;
  }

  // ── 2. Multimodal Media & Executive Report Studio ──
  async function generateImageAsset() {
    const inp = document.getElementById('studio-prompt');
    const preview = document.getElementById('studio-preview');
    const badge = document.getElementById('studio-badge');
    const prompt = (inp.value || '').trim() || 'Quantum Processor Architecture';

    badge.className = 'agent-badge THINKING';
    badge.textContent = 'RENDERING';
    preview.innerHTML = '<span class="idle-text">Gerando visualização de alta resolução + buscando mídia científica verificada...</span>';

    try {
      const r = await fetch('/api/studio/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          apiKey: window.Gemini ? Gemini.getKey() : ''
        })
      });
      if (r.ok) {
        const d = await r.json();
        let html = `<img src="${d.dataUrl}" alt="${esc(d.caption)}" />`;
        html += `<div style="font-size:0.72rem;color:var(--cyan)">${esc(d.caption)} (${esc(d.mode)}) — <a href="${d.dataUrl}" download="nexus_visual.svg" style="color:var(--cyan)">⬇ Download</a></div>`;
        if (d.commonsImage?.url) {
          html += `<div style="margin-top:0.4rem;text-align:center"><img src="${esc(d.commonsImage.url)}" alt="${esc(d.commonsImage.title)}" style="max-height:140px"/><div style="font-size:0.68rem;color:var(--text-secondary)">Wikimedia Commons: ${esc(d.commonsImage.title)}</div></div>`;
        }
        preview.innerHTML = html;
        badge.className = 'agent-badge DONE';
        badge.textContent = 'DONE';
      }
    } catch (e) {
      preview.innerHTML = `<span style="color:var(--rose)">Erro: ${esc(e.message)}</span>`;
      badge.className = 'agent-badge IDLE';
      badge.textContent = 'ERROR';
    }
  }

  async function generateSlideDeck() {
    const inp = document.getElementById('studio-prompt');
    const preview = document.getElementById('studio-preview');
    const badge = document.getElementById('studio-badge');
    const topic = (inp.value || '').trim() || 'Artificial Intelligence';

    badge.className = 'agent-badge THINKING';
    badge.textContent = 'SYNTHESIZING';
    preview.innerHTML = '<span class="idle-text">Extraindo dados da Wikipedia + Crossref DOI e sintetizando slides executivos...</span>';

    try {
      const r = await fetch('/api/studio/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          apiKey: window.Gemini ? Gemini.getKey() : ''
        })
      });
      if (r.ok) {
        const d = await r.json();
        lastShareableText = d.report;
        preview.style.alignItems = 'flex-start';
        preview.style.justifyContent = 'flex-start';
        preview.innerHTML = `<div style="width:100%">${esc(d.report).replace(/\n/g, '<br>')}</div>`;
        badge.className = 'agent-badge DONE';
        badge.textContent = 'DECK READY';
      }
    } catch (e) {
      preview.innerHTML = `<span style="color:var(--rose)">Erro: ${esc(e.message)}</span>`;
      badge.className = 'agent-badge IDLE';
      badge.textContent = 'ERROR';
    }
  }

  // ── 3. Native Voice (STT / TTS), Neural Translation & App Bridges (WhatsApp / Telegram) ──
  function speakText(text) {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = /[ãõçáéíóú]/i.test(text) ? 'pt-BR' : 'en-US';
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  }

  function startVoiceRecognition(targetInputId, autoSubmitFn) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const statusEl = document.getElementById('voice-transcript');
    const badge = document.getElementById('voice-badge');
    if (!SpeechRec) {
      if (statusEl) statusEl.textContent = 'Seu navegador não suporta Web Speech API nativa. Use Chrome ou Edge.';
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'pt-BR';
    rec.interimResults = false;
    if (badge) { badge.className = 'agent-badge THINKING'; badge.textContent = 'LISTENING…'; }
    if (statusEl) statusEl.textContent = '🎙️ Ouvindo agora... fale seu comando ou pergunta.';

    rec.onresult = (ev) => {
      const transcript = ev.results?.[0]?.[0]?.transcript || '';
      if (statusEl) statusEl.textContent = `Reconhecido: "${transcript}"`;
      if (badge) { badge.className = 'agent-badge DONE'; badge.textContent = 'CAPTURED'; }
      const target = document.getElementById(targetInputId || 'cc-prompt');
      if (target) target.value = transcript;
      if (autoSubmitFn) autoSubmitFn(transcript);
    };
    rec.onerror = (ev) => {
      if (statusEl) statusEl.textContent = `Atenção no microfone: ${ev.error}`;
      if (badge) { badge.className = 'agent-badge IDLE'; badge.textContent = 'READY'; }
    };
    rec.start();
  }

  async function translateText() {
    const inp = document.getElementById('trans-input');
    const lang = document.getElementById('trans-lang').value;
    const out = document.getElementById('trans-output');
    const text = (inp.value || '').trim() || lastShareableText.slice(0, 300);
    if (!text) return;

    out.textContent = 'Traduzindo...';
    const langCodeMap = { English: 'en', Portuguese: 'pt', Spanish: 'es', Mandarin: 'zh-CN' };
    const targetCode = langCodeMap[lang] || 'en';

    // 1. If Gemini is configured, use LLM translation
    if (window.Gemini && Gemini.hasKey()) {
      try {
        const res = await Gemini.stream(
          `Translate the following text accurately into ${lang}. Output ONLY the translation:\n\n${text}`,
          'You are a neural translator.'
        );
        out.textContent = res;
        lastShareableText = res;
        return;
      } catch (e) {}
    }

    // 2. Real MyMemory / Lingva Public Translation API (100% real translation without requiring an API key)
    try {
      const srcLang = /[ãõçáéíóú]/i.test(text) ? 'pt' : 'en';
      if (srcLang === targetCode) {
        out.textContent = text;
        return;
      }
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 450))}&langpair=${srcLang}|${targetCode}`;
      const r = await fetch(url);
      if (r.ok) {
        const d = await r.json();
        const translated = d?.responseData?.translatedText || text;
        out.textContent = translated;
        lastShareableText = translated;
        return;
      }
    } catch (e) {}
    out.textContent = text;
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadCurrentSvg() {
    const preview = document.getElementById('studio-preview');
    const svgEl = preview?.querySelector('svg');
    if (svgEl) {
      downloadFile('nexus_architecture_infographic.svg', svgEl.outerHTML, 'image/svg+xml');
    } else {
      alert('Nenhum diagrama vetorial SVG ativo no momento. Clique em "Generate Image / Diagram" primeiro.');
    }
  }

  function copyCurrentSvg() {
    const preview = document.getElementById('studio-preview');
    const svgEl = preview?.querySelector('svg');
    const btn = document.getElementById('studio-copy-svg-btn');
    if (svgEl) {
      navigator.clipboard?.writeText(svgEl.outerHTML);
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✅ SVG Copiado!';
        setTimeout(() => { btn.textContent = orig; }, 1800);
      }
    } else {
      navigator.clipboard?.writeText(lastShareableText);
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✅ Conteúdo Copiado!';
        setTimeout(() => { btn.textContent = orig; }, 1800);
      }
    }
  }

  function printCurrentPdf() {
    window.print();
  }

  async function dispatchWebhook() {
    const url = prompt('Insira o Endpoint Webhook HTTPS de destino (Slack, Discord, MS Teams, n8n ou Zapier):', 'https://httpbin.org/post');
    if (!url || !url.startsWith('http')) return;
    const btn = document.getElementById('share-webhook-btn');
    if (btn) btn.textContent = '⏳ Disparando...';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'NEXUS Superintelligence Platform',
          timestamp: new Date().toISOString(),
          type: 'EXECUTIVE_BRIEFING',
          content: lastShareableText
        })
      });
      if (btn) {
        btn.textContent = res.ok ? '✅ Webhook Enviado!' : `⚠️ Status ${res.status}`;
        setTimeout(() => { btn.textContent = '⚡ Webhook API'; }, 2200);
      }
    } catch (e) {
      if (btn) {
        btn.textContent = '❌ Falha de Envio';
        setTimeout(() => { btn.textContent = '⚡ Webhook API'; }, 2200);
      }
      alert('Erro ao disparar Webhook: ' + e.message);
    }
  }

  function init() {
    const dateEl = document.getElementById('task-date-input');
    if (dateEl) dateEl.value = new Date().toISOString().slice(0, 10);
    loadTasks();

    document.getElementById('task-add-btn')?.addEventListener('click', addTask);
    document.getElementById('task-title-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
    document.getElementById('plan-gen-btn')?.addEventListener('click', generateSmartPlan);
    document.getElementById('studio-img-btn')?.addEventListener('click', generateImageAsset);
    document.getElementById('studio-rep-btn')?.addEventListener('click', generateSlideDeck);
    document.getElementById('trans-btn')?.addEventListener('click', translateText);

    // Voice buttons (both in Assistant Hub and Chat bar)
    document.getElementById('voice-command-btn')?.addEventListener('click', () => {
      startVoiceRecognition('cc-prompt', () => {
        if (window.CommandCenter) CommandCenter.executeUnifiedDirective();
      });
    });
    document.getElementById('chat-mic-btn')?.addEventListener('click', () => {
      startVoiceRecognition('chat-input', () => {
        document.getElementById('chat-send-btn')?.click();
      });
    });
    const ttsBtn = document.getElementById('chat-tts-btn');
    if (ttsBtn) {
      ttsBtn.addEventListener('click', () => {
        ttsEnabled = !ttsEnabled;
        ttsBtn.style.borderColor = ttsEnabled ? 'var(--cyan)' : '';
        ttsBtn.textContent = ttsEnabled ? '🔊 ON' : '🔊';
      });
    }

    // Cloud API + Native App Share Bridges (WhatsApp Cloud API, Telegram Bot API, Clipboard)
    document.getElementById('share-wa-btn')?.addEventListener('click', async () => {
      const txt = document.getElementById('trans-output')?.textContent || lastShareableText;
      try {
        const r = await fetch('/api/cloud/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'whatsapp', text: txt })
        });
        if (r.ok) {
          const d = await r.json();
          if (d.sentViaApi) {
            const b = document.getElementById('share-wa-btn');
            if (b) { b.textContent = '✓ Enviado via API!'; setTimeout(() => b.textContent = '🟢 WhatsApp', 2000); }
            return;
          }
        }
      } catch (_) {}
      window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
    });
    document.getElementById('share-tg-btn')?.addEventListener('click', async () => {
      const txt = document.getElementById('trans-output')?.textContent || lastShareableText;
      try {
        const r = await fetch('/api/cloud/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'telegram', text: txt })
        });
        if (r.ok) {
          const d = await r.json();
          if (d.sentViaApi) {
            const b = document.getElementById('share-tg-btn');
            if (b) { b.textContent = '✓ Enviado via Bot!'; setTimeout(() => b.textContent = '🔵 Telegram', 2000); }
            return;
          }
        }
      } catch (_) {}
      window.open(`https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
    });
    document.getElementById('share-copy-btn')?.addEventListener('click', () => {
      const txt = document.getElementById('trans-output')?.textContent || lastShareableText;
      navigator.clipboard?.writeText(txt);
      const b = document.getElementById('share-copy-btn');
      if (b) { b.textContent = '✓ Copied!'; setTimeout(() => b.textContent = '📋 Copy Briefing', 1500); }
    });
    document.getElementById('share-webhook-btn')?.addEventListener('click', dispatchWebhook);
    document.getElementById('studio-dl-svg-btn')?.addEventListener('click', downloadCurrentSvg);
    document.getElementById('studio-copy-svg-btn')?.addEventListener('click', copyCurrentSvg);
    document.getElementById('studio-print-pdf-btn')?.addEventListener('click', printCurrentPdf);

    // Zero-Trust AES-256-GCM Personal Credential Vault Save Handler
    document.getElementById('vault-save-btn')?.addEventListener('click', async () => {
      const payload = {
        googleCalendarToken: document.getElementById('vault-gcal-token')?.value || '',
        telegramBotToken: document.getElementById('vault-tg-token')?.value || '',
        telegramChatId: document.getElementById('vault-tg-chat')?.value || '',
        whatsappAccessToken: document.getElementById('vault-wa-token')?.value || '',
        whatsappPhoneId: document.getElementById('vault-wa-phone')?.value || '',
        whatsappRecipientPhone: document.getElementById('vault-wa-to')?.value || ''
      };
      const statusMsg = document.getElementById('vault-status-msg');
      try {
        const r = await fetch('/api/cloud/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (r.ok) {
          ['vault-gcal-token', 'vault-tg-token', 'vault-wa-token'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
          });
          if (statusMsg) statusMsg.textContent = '✓ Credenciais blindadas no Cofre AES-256-GCM!';
        }
      } catch (e) {
        if (statusMsg) statusMsg.textContent = 'Erro ao salvar no Cofre: ' + e.message;
      }
    });
  }

  return { init, speakText };
})();
