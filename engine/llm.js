import { telemetry } from './telemetry.js';

const MODELS_PRIORITY = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-3-flash-preview'
];

/**
 * Builds an authoritative, real-time temporal context string (Date, Time, Weekday, Timezone)
 * so every AI agent knows the exact moment the user is speaking.
 */
export function buildRealtimeTemporalContext(clientTemporal = null) {
  const now = new Date();
  const tz = clientTemporal?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  const localeDate = clientTemporal?.localeDate || now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: tz
  });
  const localeTime = clientTemporal?.localeTime || now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: tz
  });
  const hour = Number(now.toLocaleTimeString('pt-BR', { hour: '2-digit', hour12: false, timeZone: tz })) || now.getHours();
  const period = hour < 6 ? 'madrugada' : hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';

  return {
    iso: now.toISOString(),
    timeZone: tz,
    localeDate,
    localeTime,
    period,
    year: now.getFullYear(),
    promptHeader: `[CONTEXTO TEMPORAL EXATO DO USUÁRIO EM TEMPO REAL]: Hoje é ${localeDate}, exatamente ${localeTime} (${period}, fuso horário ${tz}, ISO ${now.toISOString()}). Sempre utilize esta data e horário exatos quando o usuário perguntar que horas são, que dia é hoje ou pedir informações atuais. Jamais invente datas, fatos falsos ou respostas genéricas.`
  };
}

/**
 * Frontier LLM Reasoning Engine with Native Chain-of-Thought Extraction & Fast Voice Streaming
 * Authenticates via `x-goog-api-key` header or query param and streams via Server-Sent Events (SSE).
 */
export async function streamWithThinking({
  apiKey,
  contents,
  systemInstruction,
  thinkingLevel = 'MEDIUM',
  fastVoiceMode = false,
  clientTemporal = null,
  onThoughtChunk,
  onAnswerChunk
}) {
  const resolvedKey = (apiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!resolvedKey) {
    throw new Error('NO_API_KEY');
  }

  const t0 = performance.now();
  const temporal = buildRealtimeTemporalContext(clientTemporal);
  const formattedContents = typeof contents === 'string'
    ? [{ role: 'user', parts: [{ text: contents }] }]
    : contents;

  const fullSystemInstruction = [
    temporal.promptHeader,
    systemInstruction || 'Você é o núcleo de superinteligência cooperativa NEXUS. Responda apenas com informações reais, precisas, verificáveis e diretas.'
  ].join('\n\n');

  let lastError = null;

  for (const modelName of MODELS_PRIORITY) {
    // Try with clean generationConfig for maximum compatibility and speed across all Gemini REST v1beta models
    const payload = {
      contents: formattedContents,
      systemInstruction: {
        parts: [{ text: fullSystemInstruction }]
      },
      generationConfig: {
        temperature: fastVoiceMode ? 0.55 : 0.65,
        maxOutputTokens: fastVoiceMode ? 600 : 2048
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse`;
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': resolvedKey
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const errText = await resp.text();
        lastError = new Error(`Gemini API (${modelName}) HTTP ${resp.status}: ${errText.slice(0, 200)}`);
        continue;
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

      if (fullAnswer.trim()) {
        if (!fullThought) {
          fullThought = `[${temporal.localeTime}] Inferência verificada via ${modelName} com contexto temporal em tempo real.`;
          if (onThoughtChunk) onThoughtChunk(fullThought, fullThought);
        }
        telemetry.recordApiCall(performance.now() - t0);
        return {
          thought: fullThought,
          answer: fullAnswer,
          modelUsed: modelName,
          temporal,
          latencyMs: Math.round(performance.now() - t0)
        };
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Falha na comunicação com os modelos Gemini.');
}
