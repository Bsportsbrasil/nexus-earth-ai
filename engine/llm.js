import { telemetry } from './telemetry.js';

const DEFAULT_MODEL = 'gemini-3-flash-preview';

/**
 * Frontier LLM Reasoning Engine with Native Chain-of-Thought Extraction
 * Uses Gemini 3 `thinkingConfig: { includeThoughts: true, thinkingLevel }` via direct
 * Server-Sent Events (SSE) streaming — zero external npm packages required,
 * while also supporting @google/genai if installed.
 */
export async function streamWithThinking({
  apiKey,
  contents,
  systemInstruction,
  thinkingLevel = 'MEDIUM',
  onThoughtChunk,
  onAnswerChunk
}) {
  const resolvedKey = apiKey || process.env.GEMINI_API_KEY;
  if (!resolvedKey) {
    throw new Error('NO_API_KEY');
  }

  const t0 = performance.now();
  const formattedContents = typeof contents === 'string'
    ? [{ role: 'user', parts: [{ text: contents }] }]
    : contents;

  const payload = {
    contents: formattedContents,
    generationConfig: {
      thinkingConfig: {
        includeThoughts: true,
        thinkingLevel
      }
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:streamGenerateContent?alt=sse&key=${encodeURIComponent(resolvedKey)}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API HTTP ${resp.status}: ${errText.slice(0, 200)}`);
  }

  let fullThought = '';
  let fullAnswer = '';

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;
      try {
        const chunk = JSON.parse(jsonStr);
        const parts = chunk.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (!part.text) continue;
          const estTokens = Math.max(1, Math.ceil(part.text.length / 4));
          if (part.thought) {
            fullThought += part.text;
            telemetry.recordTokens(estTokens, true);
            if (onThoughtChunk) onThoughtChunk(part.text, fullThought);
          } else {
            fullAnswer += part.text;
            telemetry.recordTokens(estTokens, false);
            if (onAnswerChunk) onAnswerChunk(part.text, fullAnswer);
          }
        }
      } catch (e) {}
    }
  }

  telemetry.recordApiCall(performance.now() - t0);
  return { thought: fullThought, answer: fullAnswer, latencyMs: Math.round(performance.now() - t0) };
}
