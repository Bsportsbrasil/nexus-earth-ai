// NEXUS Client Core: Real-time WebSocket Stream + Server-Side Gemini Proxy (Supports AQ.* Auth Keys & AIza* Keys)
const KEY = 'nexus_gemini_key';
const MODEL = 'gemini-flash-latest';
let serverAvailable = true;
let ws = null;
const wsListeners = new Set();

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

function getLocalKey() {
  return sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || '';
}

function connectWebSocket() {
  try {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${location.host}/ws`);
    ws.addEventListener('open', () => {
      refresh();
    });
    ws.addEventListener('message', (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        for (const fn of wsListeners) fn(msg);
      } catch (e) {}
    });
    ws.addEventListener('close', () => {
      ws = null;
      setTimeout(connectWebSocket, 3000);
    });
  } catch (e) {}
}

connectWebSocket();

window.NexusWS = {
  onMessage(fn) {
    wsListeners.add(fn);
    return () => wsListeners.delete(fn);
  },
  send(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
      return true;
    }
    return false;
  },
  isOpen: () => !!(ws && ws.readyState === WebSocket.OPEN)
};

window.Gemini = {
  model: MODEL,
  hasKey: () => serverAvailable === true || !!getLocalKey(),
  getKey: () => getLocalKey(),
  setKey(k) {
    if (k && k.trim()) {
      sessionStorage.setItem(KEY, k.trim());
    } else {
      sessionStorage.removeItem(KEY);
      localStorage.removeItem(KEY);
    }
  },
  /**
   * Streams both Reasoning Tokens (Chain-of-Thought) and Answer Tokens via backend /api/gemini
   * or direct x-goog-api-key SSE stream.
   */
  async stream(contents, systemInstruction, onChunk, onThought) {
    const localKey = getLocalKey();

    // 1. Route through backend /api/gemini (streams thoughts & answer over WebSocket in real time)
    if (serverAvailable !== false || localKey) {
      const unsub = window.NexusWS.onMessage((msg) => {
        if (msg.type === 'chat_thought' && onThought) onThought(msg.fullThought);
        if (msg.type === 'chat_answer' && onChunk) onChunk(msg.fullAnswer);
      });
      try {
        const resp = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction,
            clientTemporal: getClientTemporal(),
            apiKey: localKey || undefined
          })
        });
        unsub();
        if (resp.ok) {
          if (!localKey) serverAvailable = true;
          refresh();
          const data = await resp.json();
          if (data.thought && onThought) onThought(data.thought);
          if (onChunk) onChunk(data.text || '');
          return data.text || '';
        }
        const errData = await resp.json().catch(() => ({}));
        if (resp.status === 503 && errData.error === 'SERVER_KEY_NOT_CONFIGURED' && !localKey) {
          serverAvailable = false;
          refresh();
          throw new Error('NO_KEY');
        }
        throw new Error(errData.error || `HTTP ${resp.status}`);
      } catch (e) {
        unsub();
        if (!localKey) {
          serverAvailable = false;
          refresh();
          throw e;
        }
      }
    }

    // 2. Direct browser SSE fallback with x-goog-api-key header (supports AQ.* and AIza* keys)
    if (!localKey) throw new Error('NO_KEY');
    const formattedContents = typeof contents === 'string'
      ? [{ role: 'user', parts: [{ text: contents }] }]
      : contents;
    const temporal = getClientTemporal();
    const payload = {
      contents: formattedContents,
      generationConfig: { temperature: 0.65 }
    };
    const fullSys = `[DATA E HORA ATUAL DO USUÁRIO: ${temporal.localeDate}, às ${temporal.localeTime} (${temporal.timeZone})]\n\n${systemInstruction || ''}`;
    payload.systemInstruction = { parts: [{ text: fullSys }] };

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': localKey
      },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`);

    let fullAnswer = '';
    let fullThought = '';
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const ln of lines) {
        if (!ln.startsWith('data:')) continue;
        const js = ln.slice(5).trim();
        if (!js || js === '[DONE]') continue;
        try {
          const ch = JSON.parse(js);
          for (const part of ch.candidates?.[0]?.content?.parts || []) {
            if (!part.text) continue;
            if (part.thought) {
              fullThought += part.text;
              onThought && onThought(fullThought);
            } else {
              fullAnswer += part.text;
              onChunk && onChunk(fullAnswer);
            }
          }
        } catch (e) {}
      }
    }
    return fullAnswer;
  }
};

// ── API key modal wiring ──
const modal = document.getElementById('key-modal');
const input = document.getElementById('key-input');
const status = document.getElementById('key-status');

function refresh() {
  const on = serverAvailable === true || !!getLocalKey();
  const isEn = window.I18nEngine && typeof window.I18nEngine.getCurrentLanguage === 'function' && window.I18nEngine.getCurrentLanguage() === 'en';
  status.textContent = serverAvailable === true
    ? (isEn ? 'GEMINI CLOUD ACTIVE' : 'GEMINI CLOUD ATIVO')
    : (on ? (isEn ? 'GEMINI LIVE' : 'GEMINI AO VIVO') : (isEn ? 'GRAPHRAG READY' : 'GRAPHRAG PRONTO'));
  status.className = 'key-status ' + (on ? 'live' : 'demo');
}

document.getElementById('key-btn').onclick = () => {
  input.value = getLocalKey() || '';
  modal.classList.add('open');
};
document.getElementById('key-cancel').onclick = () => modal.classList.remove('open');
document.getElementById('key-save').onclick = () => {
  Gemini.setKey(input.value);
  modal.classList.remove('open');
  refresh();
};
document.getElementById('key-clear').onclick = () => {
  Gemini.setKey('');
  input.value = '';
  modal.classList.remove('open');
  refresh();
};

// Server availability is true by default; check lazily without blocking initial paint
function checkServerLazy() {
  fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }).then(r => {
    serverAvailable = (r.status === 400 || r.status === 200);
    refresh();
  }).catch(() => {
    serverAvailable = false;
    refresh();
  });
}
refresh();
