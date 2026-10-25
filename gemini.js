// NEXUS Client Core: Real-time WebSocket Stream + Gemini Thinking Extraction + Serverless Fallback
import { GoogleGenAI } from 'https://esm.run/@google/genai';

const KEY = 'nexus_gemini_key';
const MODEL = 'gemini-3-flash-preview';
let ai = null;
let serverAvailable = null;
let ws = null;
const wsListeners = new Set();

function getLocalKey() {
  return sessionStorage.getItem(KEY);
}

function client() {
  const k = getLocalKey();
  if (!k) return null;
  if (!ai) ai = new GoogleGenAI({ apiKey: k });
  return ai;
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
  getKey: () => getLocalKey() || '',
  setKey(k) {
    if (k && k.trim()) {
      sessionStorage.setItem(KEY, k.trim());
    } else {
      sessionStorage.removeItem(KEY);
    }
    ai = null;
  },
  /**
   * Streams both Reasoning Tokens (Chain-of-Thought) and Answer Tokens.
   * Supports onChunk(fullAnswer) and optional onThought(fullThought).
   */
  async stream(contents, systemInstruction, onChunk, onThought) {
    // 1. If local key is NOT set, try backend /api/gemini (which also streams over WebSocket)
    if (!getLocalKey() && serverAvailable !== false) {
      const unsub = window.NexusWS.onMessage((msg) => {
        if (msg.type === 'chat_thought' && onThought) onThought(msg.fullThought);
        if (msg.type === 'chat_answer' && onChunk) onChunk(msg.fullAnswer);
      });
      try {
        const resp = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, systemInstruction })
        });
        unsub();
        if (resp.ok) {
          serverAvailable = true;
          refresh();
          const data = await resp.json();
          if (data.thought && onThought) onThought(data.thought);
          if (onChunk) onChunk(data.text || '');
          return data.text || '';
        }
        const errData = await resp.json().catch(() => ({}));
        if (resp.status === 503 && errData.error === 'SERVER_KEY_NOT_CONFIGURED') {
          serverAvailable = false;
          refresh();
        } else {
          throw new Error(errData.error || `HTTP ${resp.status}`);
        }
      } catch (e) {
        unsub();
        if (serverAvailable === true) throw e;
        serverAvailable = false;
        refresh();
      }
    }

    // 2. Direct Browser SDK with Native Thinking Extraction (`includeThoughts: true`)
    const c = client();
    if (!c) throw new Error('NO_KEY');
    const res = await c.models.generateContentStream({
      model: MODEL,
      contents,
      config: {
        systemInstruction,
        thinkingConfig: {
          includeThoughts: true,
          thinkingLevel: 'MEDIUM'
        }
      }
    });
    let fullAnswer = '';
    let fullThought = '';
    for await (const chunk of res) {
      const parts = chunk.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (!part.text) continue;
        if (part.thought) {
          fullThought += part.text;
          onThought && onThought(fullThought);
        } else {
          fullAnswer += part.text;
          onChunk && onChunk(fullAnswer);
        }
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
  const wsActive = window.NexusWS && window.NexusWS.isOpen();
  status.textContent = serverAvailable === true
    ? 'CLOUD SECURE'
    : (on ? 'GEMINI LIVE' : (wsActive ? 'ENGINE ONLINE' : 'GRAPHRAG READY'));
  status.className = 'key-status ' + (on || wsActive ? 'live' : 'demo');
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

fetch('/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
}).then(r => {
  serverAvailable = (r.status === 400);
  refresh();
}).catch(() => {
  serverAvailable = false;
  refresh();
});
refresh();
