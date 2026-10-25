// Hybrid Gemini client:
// 1. Server-side secure proxy (/api/gemini) using Vercel Environment Variable GEMINI_API_KEY (Silicon Valley production standard — never exposes key to the browser).
// 2. Optional BYOK (Bring Your Own Key) fallback stored in sessionStorage for local testing.
import { GoogleGenAI } from 'https://esm.run/@google/genai';

const KEY = 'nexus_gemini_key';
const MODEL = 'gemini-3-flash-preview';
let ai = null;
let serverAvailable = null; // null = unknown, true = server has GEMINI_API_KEY, false = not configured

function getLocalKey() {
  return sessionStorage.getItem(KEY);
}

function client() {
  const k = getLocalKey();
  if (!k) return null;
  if (!ai) ai = new GoogleGenAI({ apiKey: k });
  return ai;
}

async function streamText(fullText, onChunk) {
  if (!onChunk) return fullText;
  const step = Math.max(2, Math.ceil(fullText.length / 60));
  for (let i = step; i < fullText.length; i += step) {
    onChunk(fullText.slice(0, i));
    await new Promise(r => setTimeout(r, 14));
  }
  onChunk(fullText);
  return fullText;
}

window.Gemini = {
  model: MODEL,
  hasKey: () => serverAvailable === true || !!getLocalKey(),
  setKey(k) {
    if (k && k.trim()) {
      sessionStorage.setItem(KEY, k.trim());
    } else {
      sessionStorage.removeItem(KEY);
    }
    ai = null;
  },
  async stream(contents, systemInstruction, onChunk) {
    // 1. If user didn't force a local key, try secure backend proxy first
    if (!getLocalKey() && serverAvailable !== false) {
      try {
        const resp = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, systemInstruction })
        });
        if (resp.ok) {
          serverAvailable = true;
          refresh();
          const data = await resp.json();
          return await streamText(data.text || '', onChunk);
        }
        const errData = await resp.json().catch(() => ({}));
        if (resp.status === 503 && errData.error === 'SERVER_KEY_NOT_CONFIGURED') {
          serverAvailable = false;
          refresh();
        } else {
          throw new Error(errData.error || `HTTP ${resp.status}`);
        }
      } catch (e) {
        if (serverAvailable === true) throw e;
        serverAvailable = false;
        refresh();
      }
    }

    // 2. Fallback to browser BYOK key (if provided)
    const c = client();
    if (!c) throw new Error('NO_KEY');
    const res = await c.models.generateContentStream({
      model: MODEL,
      contents,
      config: systemInstruction ? { systemInstruction } : undefined
    });
    let full = '';
    for await (const chunk of res) {
      full += chunk.text || '';
      onChunk && onChunk(full);
    }
    return full;
  }
};

// ── API key modal wiring ──
const modal = document.getElementById('key-modal');
const input = document.getElementById('key-input');
const status = document.getElementById('key-status');

function refresh() {
  const on = serverAvailable === true || !!getLocalKey();
  status.textContent = serverAvailable === true ? 'CLOUD SECURE' : (on ? 'GEMINI LIVE' : 'DEMO MODE');
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

// Probe server endpoint passively on load
fetch('/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
}).then(r => {
  if (r.status === 400) {
    // 400 Missing contents means the server IS configured with GEMINI_API_KEY
    serverAvailable = true;
  } else {
    serverAvailable = false;
  }
  refresh();
}).catch(() => {
  serverAvailable = false;
  refresh();
});
refresh();
