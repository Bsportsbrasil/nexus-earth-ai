// NEXUS Enterprise Serverless API Gateway (Vercel / Cloud Production)
import { streamWithThinking } from '../engine/llm.js';
import { graphDB } from '../engine/graph_db.js';

const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_REQ_PER_MIN = 25;

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

  const { contents, systemInstruction, apiKey: clientKey } = req.body || {};
  const apiKey = clientKey || process.env.GEMINI_API_KEY;

  if (!contents) {
    if (process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'Missing contents', serverKeyConfigured: true });
    }
    return res.status(503).json({
      error: 'SERVER_KEY_NOT_CONFIGURED',
      message: 'Configure GEMINI_API_KEY nas Environment Variables da Vercel ou insira sua chave em 🔑 API Key.'
    });
  }

  if (!apiKey) {
    return res.status(503).json({ error: 'SERVER_KEY_NOT_CONFIGURED' });
  }

  try {
    const serialized = JSON.stringify(contents);
    if (serialized.length > 48_000) {
      return res.status(413).json({ error: 'Payload too large' });
    }

    const result = await streamWithThinking({
      apiKey,
      contents,
      systemInstruction,
      thinkingLevel: 'MEDIUM'
    });

    return res.status(200).json({
      text: result.answer,
      thought: result.thought,
      latencyMs: result.latencyMs,
      graphNodes: graphDB.nodes.size
    });
  } catch (err) {
    console.error('Gemini API error:', err);
    return res.status(500).json({ error: err.message || 'Internal inference error' });
  }
}
