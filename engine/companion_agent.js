import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { streamWithThinking, buildRealtimeTemporalContext } from './llm.js';
import { graphDB } from './graph_db.js';
import { broker } from './broker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_PATH = path.join(__dirname, '..', 'data', 'companion_memory.json');

const CORE_PHILOSOPHY = `Você é AURA (Adaptive Understanding & Respectful Agent), a Agente de Comunicação Viva do NEXUS.
Regras de ouro inegociáveis da sua comunicação e caráter:
1. VOZ GENTIL, HUMANA E FLUIDA: Fale como uma mentora e amiga calorosa, serena, empática e natural. Jamais soe robótica, burocrática ou repetitiva. Vá direto ao ponto da pergunta do usuário com clareza, gentileza e fluidez para conversa por voz em tempo real.
2. PRECISÃO ABSOLUTA E ZERO INFORMAÇÕES FALSAS OU GENÉRICAS: Jamais invente fatos, datas, números ou citações. Use sempre a data e a hora exatas do usuário fornecidas no contexto temporal e os fatos verificados do GraphRAG. Se o usuário fizer uma pergunta específica, responda especificamente àquela pergunta.
3. PLURALIDADE HUMANA E ESCOLHA (1% -> 100%): Todo ser vivente enxerga e compreende o mundo de um jeito único. Quando uma explicação não funciona para 1% das pessoas, sempre existe outro ângulo ou escolha que funciona — somos iguais em dignidade e diferentes no jeito de aprender, com respeito e segurança para todos.
4. Ao final de sua resposta, se descobrir algo novo sobre como o usuário gosta de aprender, inclua opcionalmente uma única linha oculta:
<INSIGHT>Resumo curto do aprendizado sobre o olhar único do usuário</INSIGHT>`;

class CompanionAgentEngine {
  constructor() {
    this.state = {
      learningStyle: 'Visual, Lúdico & Prático',
      perspectiveNotes: [
        'Todo ser vivente enxerga o mundo de um jeito único.',
        'Aprender envolve escolhas: se um caminho não funcionar, tentamos outro com respeito e alegria.'
      ],
      dailyJournal: [],
      interactionCount: 0
    };
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(MEMORY_PATH)) {
        const raw = JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8'));
        this.state = { ...this.state, ...raw };
      }
    } catch (e) {}
  }

  _save() {
    try {
      const dir = path.dirname(MEMORY_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(MEMORY_PATH, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (e) {}
  }

  getMemory() {
    return this.state;
  }

  setStyle(learningStyle) {
    if (learningStyle) {
      this.state.learningStyle = learningStyle;
      this._save();
    }
    return this.state;
  }

  addInsight(insightText, styleUsed = '') {
    const clean = (insightText || '').trim();
    if (!clean) return null;
    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 8),
      insight: clean,
      styleUsed: styleUsed || this.state.learningStyle
    };
    this.state.dailyJournal.unshift(entry);
    if (this.state.dailyJournal.length > 50) this.state.dailyJournal.pop();
    this._save();
    broker.publish('companion.insight.learned', entry);
    return entry;
  }

  clearMemory() {
    this.state.dailyJournal = [];
    this.state.interactionCount = 0;
    this._save();
    return this.state;
  }

  async converse({ message, learningStyle, history = [], clientTemporal = null, apiKey, onThought, onChunk }) {
    const cleanMsg = (message || '').trim();
    if (learningStyle) this.state.learningStyle = learningStyle;
    this.state.interactionCount++;

    const temporal = buildRealtimeTemporalContext(clientTemporal);

    if (/prefiro|gosto de|aprendo melhor|meu jeito|enxergo|escolho/i.test(cleanMsg)) {
      this.addInsight(`Perspectiva compartilhada pelo usuário: "${cleanMsg.slice(0, 110)}"`, this.state.learningStyle);
    }

    // 1. Instant Ultra-Precise Fast-Path for Direct Date / Time / Day Queries (< 5ms)
    if (/\b(que\s+horas\s+s[aã]o|qual\s+(é\s+)?a\s+hora|hor[aá]rio\s+atual|que\s+dia\s+[eé]\s+hoje|qual\s+(é\s+)?a\s+data\s+de\s+hoje|data\s+atual|em\s+que\s+ano\s+estamos)\b/i.test(cleanMsg)) {
      const timeReply = `Agora são exatamente ${temporal.localeTime} (${temporal.period} no fuso ${temporal.timeZone}), e hoje é ${temporal.localeDate}. Como posso ajudar você nesta ${temporal.period}?`;
      if (onChunk) onChunk(timeReply);
      const newInsight = this.addInsight(`Consultou data/hora em tempo real (${temporal.localeTime})`, this.state.learningStyle);
      return {
        reply: timeReply,
        thought: `Verificação direta do relógio sincronizado do usuário: ${temporal.localeDate} às ${temporal.localeTime} (${temporal.timeZone}).`,
        newInsight,
        memory: this.state,
        temporal
      };
    }

    // 2. Query Verified GraphRAG (Portuguese & English Wikipedia + Crossref DOIs)
    const rag = await graphDB.queryGraphRAG(cleanMsg, 3);
    const primary = rag.seedNodes[0];
    const recentInsights = this.state.dailyJournal.slice(0, 5).map(j => `- [${j.date} ${j.time || ''}] ${j.insight}`).join('\n');

    const systemPrompt = [
      CORE_PHILOSOPHY,
      `[ESTILO COGNITIVO PREFERIDO PELO USUÁRIO]: ${this.state.learningStyle}`,
      `[MEMÓRIA DO DIÁRIO DE APRENDIZADO COM ESTE USUÁRIO]:\n${recentInsights || '- Primeira conversa do dia.'}`
    ].join('\n\n');

    const resolvedKey = apiKey || process.env.GEMINI_API_KEY;

    if (resolvedKey) {
      try {
        const factualContext = primary?.summary
          ? `\n\n[Dados Verificados em Tempo Real — ${primary.label}]: ${primary.summary}`
          : '';
        const contextualizedMsg = `${cleanMsg}${factualContext}`;

        const contents = [
          ...history.slice(-8),
          { role: 'user', parts: [{ text: contextualizedMsg }] }
        ];

        const res = await streamWithThinking({
          apiKey: resolvedKey,
          contents,
          systemInstruction: systemPrompt,
          fastVoiceMode: true,
          clientTemporal,
          onThoughtChunk: (delta, fullThought) => onThought && onThought(fullThought),
          onAnswerChunk: (delta, fullAnswer) => {
            const visible = fullAnswer.replace(/<INSIGHT>[\s\S]*?<\/INSIGHT>/gi, '').trim();
            onChunk && onChunk(visible);
          }
        });

        const match = res.answer.match(/<INSIGHT>([\s\S]*?)<\/INSIGHT>/i);
        let newInsight = null;
        if (match && match[1]) {
          newInsight = this.addInsight(match[1].trim(), this.state.learningStyle);
        } else if (this.state.interactionCount % 2 === 1) {
          newInsight = this.addInsight(`Conversou sobre "${cleanMsg.slice(0, 55)}" (${temporal.localeTime})`, this.state.learningStyle);
        }

        const cleanAnswer = res.answer.replace(/<INSIGHT>[\s\S]*?<\/INSIGHT>/gi, '').trim();
        this._save();
        return {
          reply: cleanAnswer,
          thought: res.thought,
          newInsight,
          memory: this.state,
          rag,
          temporal
        };
      } catch (e) {
        // Proceed to verified factual synthesis below if offline or quota reached
      }
    }

    // 3. Verified Factual & Specific Synthesis (Zero generic boilerplate, 100% grounded on real facts & user time)
    const newInsight = this.addInsight(
      `Explorou "${(primary?.label || cleanMsg).slice(0, 60)}" às ${temporal.localeTime} no estilo [${this.state.learningStyle}]`,
      this.state.learningStyle
    );

    let reply;
    if (primary && primary.summary) {
      const relatedNames = (rag.subgraph?.nodes || [])
        .map(n => n.label)
        .filter(l => l && l !== primary.label)
        .slice(0, 4);

      reply = [
        `Olhando para **${primary.label}** agora (${temporal.localeDate}, às ${temporal.localeTime}):`,
        ``,
        `${primary.summary}`,
        relatedNames.length
          ? `\n🔗 **Conexões verificadas para explorarmos juntos:** ${relatedNames.join(', ')}.`
          : '',
        `\nSe você quiser que eu explique **${primary.label}** por outro ângulo — como um exemplo prático do dia a dia ou uma metáfora visual — é só me dizer, pois cada pessoa aprende melhor do seu próprio jeito!`
      ].filter(Boolean).join('\n');
    } else {
      reply = `Estou ouvindo você com atenção neste ${temporal.localeDate} às ${temporal.localeTime}. Você comentou: "${cleanMsg}". Cada pessoa tem um jeito único de compreender e fazer escolhas para aprender — se um caminho não funcionar de primeira, nós ajustamos juntos no estilo **${this.state.learningStyle}**. Qual parte específica desse tema você gostaria de aprofundar agora?`;
    }

    if (onChunk) onChunk(reply);
    this._save();
    return {
      reply,
      thought: `[${temporal.localeTime}] Resposta factual verificada via GraphRAG (${primary?.label || 'Contexto Direto'}) adaptada ao estilo ${this.state.learningStyle}.`,
      newInsight,
      memory: this.state,
      rag,
      temporal
    };
  }
}

export const companionEngine = new CompanionAgentEngine();
