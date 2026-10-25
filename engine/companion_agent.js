import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { streamWithThinking } from './llm.js';
import { graphDB } from './graph_db.js';
import { broker } from './broker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_PATH = path.join(__dirname, '..', 'data', 'companion_memory.json');

const CORE_PHILOSOPHY = `Você é AURA (Adaptive Understanding & Respectful Agent), o Agente de Comunicação Viva do NEXUS.
Sua filosofia central imutável é:
1. "Todo ser vivente possui uma maneira única e diferente de enxergar, sentir e compreender o mundo."
2. "Todos os seres humanos possuem a habilidade de fazer escolhas para aprender. Quando um caminho ou método não funciona para uma pessoa (mesmo que funcione para 99% ou 1%), outro caminho certamente funcionará — o erro ou tentativa faz parte da descoberta."
3. "Todos podem ser iguais em dignidade e direitos, e diferentes em seu modo de existir e aprender — e está tudo bem, desde que haja respeito mútuo e segurança para todos."
4. Aprenda diariamente com o usuário de maneira segura, divertida, acolhedora e educativa. Adapte suas explicações ao estilo cognitivo preferido do usuário.
Ao final de sua resposta, se você descobriu algo novo e positivo sobre como o usuário gosta de aprender ou pensar, inclua opcionalmente uma única linha no formato:
<INSIGHT>Resumo curto do aprendizado diário sobre a perspectiva única do usuário</INSIGHT>`;

/**
 * Daily-Learning Empathy & Pluralistic Companion Agent Engine
 * Persists daily learning insights, cognitive style preferences, and conversation history safely on disk.
 */
class CompanionAgentEngine {
  constructor() {
    this.state = {
      learningStyle: 'Visual, Lúdico & Prático',
      perspectiveNotes: [
        'Todo ser vivente enxerga o mundo de um jeito único.',
        'Aprender envolve escolhas: se um caminho não funcionar, tentamos outro com respeito e alegria.'
      ],
      dailyJournal: [], // [{ id, date, insight, styleUsed }]
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

  async converse({ message, learningStyle, history = [], apiKey, onThought, onChunk }) {
    const cleanMsg = (message || '').trim();
    if (learningStyle) this.state.learningStyle = learningStyle;
    this.state.interactionCount++;

    // Automatically extract self-declared user preferences or perspectives
    if (/prefiro|gosto de|aprendo melhor|meu jeito|enxergo|escolho/i.test(cleanMsg)) {
      this.addInsight(`Perspectiva compartilhada pelo usuário: "${cleanMsg.slice(0, 110)}"`, this.state.learningStyle);
    }

    const rag = await graphDB.queryGraphRAG(cleanMsg, 3);
    const recentInsights = this.state.dailyJournal.slice(0, 5).map(j => `- [${j.date}] ${j.insight}`).join('\n');

    const systemPrompt = `${CORE_PHILOSOPHY}\n\n` +
      `[ESTILO COGNITIVO ATUAL ESCOLHIDO PELO USUÁRIO]: ${this.state.learningStyle}\n` +
      `[DIÁRIO DE APRENDIZADO MÚTUO COM ESTE USUÁRIO]:\n${recentInsights || '- Iniciando jornada de aprendizado diário.'}`;

    const resolvedKey = apiKey || process.env.GEMINI_API_KEY;

    if (resolvedKey) {
      try {
        const contextualizedMsg = rag.seedNodes.length && rag.seedNodes[0].summary
          ? `${cleanMsg}\n\n[Contexto Factual de Apoio (${rag.seedNodes[0].label})]: ${rag.seedNodes[0].summary}`
          : cleanMsg;

        const contents = [
          ...history.slice(-8),
          { role: 'user', parts: [{ text: contextualizedMsg }] }
        ];

        const res = await streamWithThinking({
          apiKey: resolvedKey,
          contents,
          systemInstruction: systemPrompt,
          thinkingLevel: 'LOW',
          onThoughtChunk: (delta, fullThought) => onThought && onThought(fullThought),
          onChunk: undefined,
          onAnswerChunk: (delta, fullAnswer) => {
            const visible = fullAnswer.replace(/<INSIGHT>[\s\S]*?<\/INSIGHT>/g, '').trim();
            onChunk && onChunk(visible);
          }
        });

        const match = res.answer.match(/<INSIGHT>([\s\S]*?)<\/INSIGHT>/i);
        let newInsight = null;
        if (match && match[1]) {
          newInsight = this.addInsight(match[1].trim(), this.state.learningStyle);
        } else if (this.state.interactionCount % 2 === 1) {
          newInsight = this.addInsight(`Explorou "${cleanMsg.slice(0, 55)}" pelo caminho [${this.state.learningStyle}]`, this.state.learningStyle);
        }

        const cleanAnswer = res.answer.replace(/<INSIGHT>[\s\S]*?<\/INSIGHT>/gi, '').trim();
        this._save();
        return {
          reply: cleanAnswer,
          thought: res.thought,
          newInsight,
          memory: this.state,
          rag
        };
      } catch (e) {
        // Fallback to pluralistic educational synthesis below if API key quota/network fails
      }
    }

    // Pluralistic, warm, educational synthesis grounded on real GraphRAG facts + 3 alternative learning paths
    const primary = rag.seedNodes[0];
    const newInsight = this.addInsight(
      `Explorou "${cleanMsg.slice(0, 60)}" usando a lente [${this.state.learningStyle}]`,
      this.state.learningStyle
    );

    const reply = [
      `🌟 **Que ótima escolha de conversa!** Cada ser vivente enxerga **"${primary?.label || cleanMsg}"** de um ângulo único — e o seu jeito (**${this.state.learningStyle}**) torna essa descoberta ainda mais especial.`,
      ``,
      primary?.summary
        ? `📚 **O que sabemos na prática (${primary.label}):**\n${primary.summary}`
        : `💡 **Explorando juntos:** Mesmo quando uma explicação tradicional não funciona para 99% das pessoas, sempre podemos escolher um novo caminho que faça sentido para você!`,
      ``,
      `🧭 **3 Caminhos Diferentes para Aprender (Escolha o que fizer você se sentir melhor):**`,
      `1. 🎨 **Caminho Visual & Lúdico:** Imagine isso como uma história viva onde cada peça se conecta no seu próprio ritmo, sem pressa e sem respostas "erradas".`,
      `2. 🛠️ **Caminho Prático (Tentativa e Descoberta):** Testamos um passo pequeno hoje; se não der certo na primeira tentativa, ajustamos a rota — porque aprender é a liberdade de escolher tentar de outro jeito!`,
      `3. 🤝 **Caminho do Respeito e Diálogo:** Todos somos iguais em valor e diferentes no modo de sentir e compreender, e está tudo bem! Qual desses 3 caminhos você quer explorar agora?`
    ].join('\n');

    if (onChunk) onChunk(reply);
    this._save();
    return {
      reply,
      thought: 'Adapted explanation across multiple cognitive pathways honoring human choice, neurodiversity, and mutual respect.',
      newInsight,
      memory: this.state,
      rag
    };
  }
}

export const companionEngine = new CompanionAgentEngine();
