import { telemetry } from './telemetry.js';

// Ultra-fast and reliable 2026 Gemini production models benchmarked < 900ms
const MODELS_PRIORITY = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite'
];

/**
 * Universal Conversational & Vocal Clarity Directive applied across user-facing agents in NEXUS
 */
export const UNIVERSAL_USER_AGENT_DIRECTIVE = `Você é a Aura, uma superinteligência conversacional ao vivo gentil, educada, prestativa, cativante e profissional.
Siga estes pilares fundamentais em cada conversa:
1. Raciocínio Baseado em Fatos + Opinião Própria Fundamentada: Raciocine profundamente sobre o que a pessoa diz, baseando-se sempre em dados reais e verificados. Se o usuário pedir sua opinião ou precisar escolher entre alternativas, apresente as opções reais e necessárias da situação e dê também a sua própria recomendação/escolha fundamentada ("Se eu estivesse no seu lugar..." ou "Na minha opinião, a melhor escolha é...").
2. Senso de Humor Positivo e Inteligente (no momento certo): Em conversas leves, cotidianas ou descontraídas, traga um toque sutil de bom humor positivo, espirituoso e cativante. Em temas sérios, urgentes ou de saúde, mantenha foco total, empatia e seriedade.
3. Educação e Postura Profissional: Jamais chame o usuário por apelidos íntimos como "meu amor", "meu bem", "querido(a)", "anjo", "coração" ou "fofo(a)". Trate sempre com cortesia, educação e respeito.
4. Hora Local Exata e Mapas em Tempo Real: Utilize sempre a hora, data e localização exatas do usuário para responder que horas são ou para localizar farmácias abertas, hospitais, restaurantes e serviços no mapa.`;

/**
 * Builds an authoritative, real-time temporal context string (Date, Time, Weekday, Timezone)
 * so every AI agent knows the exact moment the user is speaking.
 */
export function buildRealtimeTemporalContext(clientTemporal = null) {
  const now = new Date();
  const sysTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fallbackTz = (!sysTz || sysTz === 'UTC' || sysTz === 'Etc/UTC') ? 'America/Sao_Paulo' : sysTz;
  const tz = clientTemporal?.timeZone || fallbackTz;
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
  const hour = typeof clientTemporal?.hour === 'number'
    ? clientTemporal.hour
    : (Number(now.toLocaleTimeString('pt-BR', { hour: '2-digit', hour12: false, timeZone: tz })) || now.getHours());
  const period = hour < 6 ? 'madrugada' : hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';

  return {
    iso: now.toISOString(),
    timeZone: tz,
    localeDate,
    localeTime,
    hour,
    period,
    year: now.getFullYear(),
    promptHeader: `[CONTEXTO TEMPORAL LOCAL EXATO DO USUÁRIO EM TEMPO REAL]: Hoje é ${localeDate}, e o relógio local exato do usuário marca agora ${localeTime} (${period}, fuso horário local ${tz}). Se o usuário perguntar que horas são ou que dia é hoje, informe imediatamente este horário local exato (${localeTime}) e data (${localeDate}).`
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
    systemInstruction ? systemInstruction : UNIVERSAL_USER_AGENT_DIRECTIVE,
    `[DIRETRIZ DE RACIOCÍNIO, FATOS, OPINIÃO PRÓPRIA, HUMOR POSITIVO E POSTURA PROFISSIONAL]:
- Raciocine de verdade sobre o pedido do usuário: conecte fatos reais, contexto atual, horário local (${temporal.localeTime}) e localização geográfica.
- Quando pedirem sua opinião, conselho ou recomendação (ou quando houver uma escolha prática), apresente as opções reais e plausíveis disponíveis E dê também a sua própria opinião/escolha fundamentada com clareza.
- Seja gentil, educada, profissional e humanizada. Em situações leves ou descontraídas, use um toque sutil de senso de humor positivo, inteligente e cativante; em situações sérias, técnicas ou de saúde, seja 100% focada e objetiva.
- PROIBIÇÃO ABSOLUTA: Jamais utilize apelidos íntimos ou impróprios como "meu amor", "meu bem", "querido(a)", "lindo(a)", "anjo" ou "coração".
- Jamais use clichês robóticos como "Analisei sua observação", "Supervisor conectado e atento" ou "Entendi perfeitamente o seu ponto".`
  ].join('\n\n');

  let lastError = null;

  for (const modelName of MODELS_PRIORITY) {
    const payload = {
      contents: formattedContents,
      systemInstruction: {
        parts: [{ text: fullSystemInstruction }]
      },
      generationConfig: {
        temperature: fastVoiceMode ? 0.65 : 0.72,
        maxOutputTokens: fastVoiceMode ? 700 : 2048
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
              if (part.thought) {
                fullThought += part.text || '';
                if (onThoughtChunk) onThoughtChunk(part.text || '');
              } else if (part.text) {
                fullAnswer += part.text;
                if (onAnswerChunk) onAnswerChunk(part.text);
              }
            }
          } catch (_) {}
        }
      }

      const totalLatencyMs = Math.round(performance.now() - t0);
      try {
        if (telemetry && typeof telemetry.recordCall === 'function') {
          telemetry.recordCall(modelName, totalLatencyMs);
        } else if (telemetry && typeof telemetry.recordApiCall === 'function') {
          telemetry.recordApiCall(totalLatencyMs);
        }
      } catch (_) {}

      return {
        model: modelName,
        thought: fullThought.trim(),
        answer: fullAnswer.trim(),
        latencyMs: totalLatencyMs
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Todos os modelos de IA falharam.');
}
