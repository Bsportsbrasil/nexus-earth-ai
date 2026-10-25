import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3-flash-preview';

// Simple in-memory sliding-window rate limiter per IP (protects your quota)
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_REQ_PER_MIN = 20;

function checkRateLimit(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (list.length >= MAX_REQ_PER_MIN) return false;
  list.push(now);
  hits.set(ip, list);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anon').toString().split(',')[0].trim();
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'SERVER_KEY_NOT_CONFIGURED',
      message: 'Configure GEMINI_API_KEY nas Environment Variables da Vercel ou insira uma chave local.'
    });
  }

  try {
    const { contents, systemInstruction } = req.body || {};
    if (!contents) {
      return res.status(400).json({ error: 'Missing contents' });
    }

    // Input size guard
    const serialized = JSON.stringify(contents);
    if (serialized.length > 32_000) {
      return res.status(413).json({ error: 'Payload too large' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: systemInstruction ? { systemInstruction } : undefined
    });

    return res.status(200).json({ text: response.text || '' });
  } catch (err) {
    console.error('Gemini API error:', err);
    return res.status(500).json({ error: err.message || 'Internal inference error' });
  }
}
