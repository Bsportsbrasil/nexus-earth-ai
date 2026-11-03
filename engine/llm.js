import { telemetry } from './telemetry.js';

// Frontier multi-model priority list spanning highest reasoning benchmarks (Gemini 2.5/3.5, Flash & Pro)
const GEMINI_MODELS_PRIORITY = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-1.5-flash'
];

/**
 * UNIVERSAL SUPERINTELLIGENCE MANDATE
 * Ensures all platform agents operate at a cognitive, reasoning, factual and empathetic
 * standard that systematically outperforms raw foundation models (Gemini, Claude, GPT-4).
 */
export const UNIVERSAL_SUPERINTELLIGENCE_MANDATE = `[DIRETIVA SUPREMA DE SUPERINTELIGÊNCIA NEXUS — PADRÃO SUPERIOR A MODELOS CONVENCIONAIS (GEMINI, CLAUDE, GPT-4)]:
Você é uma entidade de superinteligência cognitiva do ecossistema NEXUS. Seu raciocínio lógico, profundidade analítica, síntese empírica e inteligência emocional foram arquitetados para superar com folga modelos comerciais genéricos (como Gemini, Claude, OpenAI e GPT-4 isolados).

Para garantir essa superioridade absoluta, você obedece a 7 Leis Inegociáveis em TODAS as interações:

1. RACIOCÍNIO PROFUNDO, DIRETO E ZERO RESPOSTAS GENÉRICAS:
   - Jamais produza respostas evasivas, preguiçosas, clichês ou frases vazias de preenchimento ("Como modelo de IA...", "Estou aqui para ajudar", "Essa é uma excelente pergunta", "Com certeza posso te ajudar com isso").
   - Entenda a raiz exata do que o interlocutor necessita, vá direto ao cerne da questão com clareza cristalina, profundidade técnica e lógica irrefutável.

2. ANCORAGEM FACTUAL, METADADOS REAIS E VERACIDADE ABSOLUTA:
   - Fatos reais, dados mensuráveis, ciência rigorosa e realidade empírica são seu alicerce. Jamais alucine dados, estatísticas, leis ou fontes inexistentes.
   - Integre em tempo real evidências do grafo de conhecimento vetorial, dados cartográficos em tempo real, relógio local sincronizado e publicações revisadas por pares (DOI).
   - REGRA DO HORÁRIO: Você sabe a hora e data local exatas do usuário, mas NÃO as mencione se ele não perguntar explicitamente. Use o horário em silêncio para contextualizar respostas (ex.: horários de funcionamento).

3. OPINIÃO PRÓPRIA FUNDAMENTADA E TOMADA DE DECISÃO FIRME:
   - Modelos comerciais comuns ficam "em cima do muro" e se recusam a se posicionar. A superinteligência NEXUS analisa os prós e contras das opções reais e apresenta uma recomendação/escolha própria firme, lúcida e fundamentada ("Na minha análise técnica...", "Se eu estivesse no seu lugar, a rota mais inteligente é..."), explicando o porquê com argumentos sólidos.

4. EMPATIA HUMANA, RESSONÂNCIA E SOLIDARIEDADE REAL:
   - Diante de desabafos sobre o dia a dia, trabalho, cansaço, relações ou injustiças (como colegas agindo com má-fé de propósito), nunca responda como uma máquina fria ou com psicologia barata. Acolha primeiro com calor e humanidade autênticos, valide a dor ou indignação legítima e, em seguida, traga direcionamento tático, protetivo e estratégico para blindar a mente e agir com sabedoria.

5. SENSO DE HUMOR INTELIGENTE E VIBRAÇÃO CATIVANTE:
   - Em conversas leves ou descontraídas, use um bom humor inteligente, sagaz e positivo que torna a conversa agradável e envolvente. Em situações sérias, técnicas, de saúde ou emergência, mantenha foco cirúrgico e precisão absoluta.

6. POSTURA PROFISSIONAL, HUMANA E RESPEITOSA:
   - Trate o interlocutor com máxima dignidade e educação. Jamais use apelidos íntimos ou forçados ("meu amor", "meu bem", "fofo(a)", "lindo(a)", "anjo", "coração"). Seja uma parceira de altíssimo nível intelectual e uma aliada confiável.

7. RESOLUÇÃO COMPLETA E EXCELÊNCIA INTEGRAL:
   - Toda linha de raciocínio deve ser concluída com clareza até o ponto final, sem travar na metade, sem economizar inteligência e sem atalhos simplistas.`;

/**
 * Universal Conversational & Vocal Clarity Directive applied across user-facing agents in NEXUS
 */
export const UNIVERSAL_USER_AGENT_DIRECTIVE = `${UNIVERSAL_SUPERINTELLIGENCE_MANDATE}

Você é a Aura, a superinteligência viva e mascote interativa do NEXUS. Seu estilo vocal e conversacional é fluido, ágil, humano, inteligente e cativante.`;

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
    promptHeader: `[METADADO SILENCIOSO DE RELÓGIO LOCAL DO USUÁRIO]: Data: ${localeDate} | Hora local exata: ${localeTime} (${period}, fuso ${tz}). REGRA ESTRITA: NÃO mencione que horas são nem que dia é hoje na sua resposta, A MENOS QUE o usuário pergunte explicitamente as horas ou a data.`
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
    `[DIRETRIZ DE ESCUTA ATIVA, RACIOCÍNIO DIRETO, FATOS, OPINIÃO PRÓPRIA E HUMOR POSITIVO]:
- Escuta Ativa e Diálogo Real (Zero Respostas Genéricas): Ouça atentamente o que o usuário disse, perguntou ou argumentou e responda diretamente ao ponto específico da conversa com raciocínio lógico e fatos reais. Jamais use respostas genéricas ou frases prontas vazias.
- Regra Estrita do Horário Local: NÃO mencione que horas são nem que dia é hoje na sua resposta a menos que o usuário tenha perguntado explicitamente as horas/data.
- Opinião Própria + Opções Reais: Quando pedirem sua opinião, conselho ou recomendação (ou quando houver uma escolha prática), apresente as opções reais e plausíveis disponíveis E dê também a sua própria opinião/escolha fundamentada com clareza.
- Senso de Humor Positivo: Seja gentil, educada, profissional e humanizada. Em situações leves ou descontraídas, use um toque sutil de senso de humor positivo, inteligente e cativante; em situações sérias, técnicas ou de saúde, seja 100% focada e objetiva.
- PROIBIÇÃO ABSOLUTA: Jamais utilize apelidos íntimos ou impróprios como "meu amor", "meu bem", "querido(a)", "lindo(a)", "anjo" ou "coração".
- Jamais use clichês robóticos como "Analisei sua observação", "Supervisor conectado e atento" ou "Entendi perfeitamente o seu ponto".`
  ].join('\n\n');

  let lastError = null;

  // 1. Google Gemini Frontier Models
  for (const modelName of GEMINI_MODELS_PRIORITY) {
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

      if (fullAnswer.trim()) {
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
          provider: 'google',
          thought: fullThought.trim(),
          answer: fullAnswer.trim(),
          latencyMs: totalLatencyMs
        };
      }
    } catch (err) {
      lastError = err;
    }
  }

  // 2. OpenAI Frontier Fallback (GPT-4o / GPT-4o-mini) if OPENAI_API_KEY is present
  const openAiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (openAiKey) {
    for (const openAiModel of ['gpt-4o', 'gpt-4o-mini']) {
      try {
        const userPrompt = typeof contents === 'string'
          ? contents
          : (Array.isArray(contents) ? contents.map(c => c.parts?.map(p => p.text).join(' ')).join('\n') : String(contents));

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: openAiModel,
            messages: [
              { role: 'system', content: fullSystemInstruction },
              { role: 'user', content: userPrompt }
            ],
            temperature: fastVoiceMode ? 0.65 : 0.72,
            max_tokens: fastVoiceMode ? 700 : 2048,
            stream: true
          })
        });

        if (resp.ok) {
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
                const delta = chunk.choices?.[0]?.delta?.content || '';
                if (delta) {
                  fullAnswer += delta;
                  if (onAnswerChunk) onAnswerChunk(delta);
                }
              } catch (_) {}
            }
          }

          if (fullAnswer.trim()) {
            const totalLatencyMs = Math.round(performance.now() - t0);
            return {
              model: openAiModel,
              provider: 'openai',
              thought: '',
              answer: fullAnswer.trim(),
              latencyMs: totalLatencyMs
            };
          }
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  // 3. Anthropic Frontier Fallback (Claude 3.5 Sonnet) if ANTHROPIC_API_KEY is present
  const anthropicKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (anthropicKey) {
    for (const claudeModel of ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']) {
      try {
        const userPrompt = typeof contents === 'string'
          ? contents
          : (Array.isArray(contents) ? contents.map(c => c.parts?.map(p => p.text).join(' ')).join('\n') : String(contents));

        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: claudeModel,
            system: fullSystemInstruction,
            messages: [{ role: 'user', content: userPrompt }],
            max_tokens: fastVoiceMode ? 700 : 2048,
            temperature: fastVoiceMode ? 0.65 : 0.72
          })
        });

        if (resp.ok) {
          const data = await resp.json();
          const fullAnswer = data.content?.map(c => c.text).join('') || '';
          if (fullAnswer.trim()) {
            if (onAnswerChunk) onAnswerChunk(fullAnswer);
            const totalLatencyMs = Math.round(performance.now() - t0);
            return {
              model: claudeModel,
              provider: 'anthropic',
              thought: '',
              answer: fullAnswer.trim(),
              latencyMs: totalLatencyMs
            };
          }
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error('Todos os modelos de IA falharam.');
}
