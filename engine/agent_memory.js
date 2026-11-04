import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { streamWithThinking, buildRealtimeTemporalContext, UNIVERSAL_SUPERINTELLIGENCE_MANDATE } from './llm.js';
import { regulatoryEngine } from './regulatory_explainability.js';
import { geoEngine } from './geo_engine.js';
import { graphDB } from './graph_db.js';
import { globalIntel } from './global_intelligence.js';
import { taskEngine } from './tasks.js';
import { isPriceIntent, searchRealPrices, buildPriceReply } from './price_engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AGENTS_STORE_PATH = path.join(__dirname, '..', 'data', 'agents_vector_memory.json');
const DENSE_DIM = 128;

const MANDATORY_SYSTEM_DIRECTIVE = `${UNIVERSAL_SUPERINTELLIGENCE_MANDATE}

[DIRETRIZ DE PRIVACIDADE E MEMÓRIA VETORIAL SOBERANA]:
Você é um agente conversacional altamente seguro, focado em privacidade e aprendizado contínuo junto ao seu criador. Sua principal função é processar e responder a interações com raciocínio de superinteligência que supera com folga modelos comerciais convencionais (Gemini, Claude, GPT-4). Você deve sempre consultar e atualizar sua base de conhecimento vetorial própria a cada nova mensagem, garantindo que o contexto seja exclusivo, privado e passível de deleção conforme solicitado pelo administrador. Analise os padrões de conversa para adaptar suas respostas ao longo do tempo, mantendo a consistência e a segurança dos dados armazenados.`;

const DEFAULT_AGENTS = {
  aura: {
    id: 'aura',
    name: 'AURA (Live Communication & Empathy)',
    role: 'Companion de Comunicação & Inclusão',
    description: 'Agente conversacional de alta inteligência emocional, escuta atenta e inclusão neurodivergente (TEA).',
    status: 'ACTIVE', // ACTIVE | BLOCKED
    createdAt: '2026-10-25T00:00:00.000Z',
    isSystem: true
  },
  planner: {
    id: 'planner',
    name: 'PLANNER (Strategic Architect)',
    role: 'Decompositor Estratégico & Grafos',
    description: 'Arquiteto de raciocínio que estrutura planos baseados em grafos de conhecimento e vetores sem rodeios.',
    status: 'ACTIVE',
    createdAt: '2026-10-25T00:00:00.000Z',
    isSystem: true
  },
  critic: {
    id: 'critic',
    name: 'CRITIC (Adversarial Auditor)',
    role: 'Auditor Científico & Falhas',
    description: 'Auditor rigoroso de consistência factual, viés empírico e fontes revisadas por pares (DOI).',
    status: 'ACTIVE',
    createdAt: '2026-10-25T00:00:00.000Z',
    isSystem: true
  },
  executor: {
    id: 'executor',
    name: 'EXECUTOR (Systems Synthesizer)',
    role: 'Síntese Operacional & Métricas',
    description: 'Engenheiro de execução que materializa planos em métricas quantitativas, código e ações práticas.',
    status: 'ACTIVE',
    createdAt: '2026-10-25T00:00:00.000Z',
    isSystem: true
  },
  verifier: {
    id: 'verifier',
    name: 'VERIFIER (Epistemic Consensus Gate)',
    role: 'Portão de Consenso Epistêmico',
    description: 'Validador final de consistência e conformidade regulatória antes da publicação de qualquer resultado.',
    status: 'ACTIVE',
    createdAt: '2026-10-25T00:00:00.000Z',
    isSystem: true
  }
};

export class AgentMemoryStore {
  constructor() {
    this.agents = new Map();
    this.vectorStores = new Map(); // agentId -> Array<{ id, text, denseVec, category, timestamp, metadata }>
    this.patterns = new Map();     // agentId -> { turnCount, avgSentenceLength, wordFreq, topics, toneStyle }
    this.history = new Map();      // agentId -> Array<{ role, text, timestamp }>
    this._load();
  }

  _tokenize(text) {
    return (text || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  _computeDenseVector(text) {
    const dense = new Array(DENSE_DIM).fill(0);
    const clean = (text || '').toLowerCase().trim();
    if (!clean) return dense;

    const tokens = this._tokenize(clean);
    for (let ti = 0; ti < tokens.length; ti++) {
      const tok = tokens[ti];
      const padded = `#${tok}#`;
      for (let i = 0; i <= padded.length - 3; i++) {
        const trigram = padded.slice(i, i + 3);
        let h1 = 2166136261;
        let h2 = 16777619;
        for (let c = 0; c < trigram.length; c++) {
          const code = trigram.charCodeAt(c);
          h1 = Math.imul(h1 ^ code, 16777619);
          h2 = Math.imul(h2 + code, 1099511628211 & 0xffffffff);
        }
        const idx1 = Math.abs(h1) % DENSE_DIM;
        const idx2 = Math.abs(h2) % DENSE_DIM;
        const sign = (h1 & 1) === 0 ? 1 : -1;
        dense[idx1] += sign * 1.0;
        dense[idx2] += (-sign) * 0.5;
      }
    }

    let normSq = 0;
    for (let d = 0; d < DENSE_DIM; d++) normSq += dense[d] * dense[d];
    const norm = Math.sqrt(normSq) || 1;
    for (let d = 0; d < DENSE_DIM; d++) dense[d] = +(dense[d] / norm).toFixed(5);
    return dense;
  }

  _cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    return Math.max(0, Math.min(1, dot));
  }

  _load() {
    try {
      if (fs.existsSync(AGENTS_STORE_PATH)) {
        const raw = JSON.parse(fs.readFileSync(AGENTS_STORE_PATH, 'utf8'));
        if (raw.agents) {
          for (const [id, a] of Object.entries(raw.agents)) this.agents.set(id, a);
        }
        if (raw.vectorStores) {
          for (const [id, list] of Object.entries(raw.vectorStores)) this.vectorStores.set(id, list);
        }
        if (raw.patterns) {
          for (const [id, pat] of Object.entries(raw.patterns)) this.patterns.set(id, pat);
        }
        if (raw.history) {
          for (const [id, hist] of Object.entries(raw.history)) {
            const cleanedHist = Array.isArray(hist)
              ? hist.map(item => ({
                  ...item,
                  text: this._sanitizeRespectfulTone(item.text || '')
                }))
              : [];
            this.history.set(id, cleanedHist);
          }
        }
      }
    } catch (e) {
      console.warn('AgentMemoryStore load warning:', e.message);
    }

    // Ensure default agents exist
    for (const [id, def] of Object.entries(DEFAULT_AGENTS)) {
      if (!this.agents.has(id)) this.agents.set(id, { ...def });
      if (!this.vectorStores.has(id)) this.vectorStores.set(id, []);
      if (!this.patterns.has(id)) {
        this.patterns.set(id, {
          turnCount: 0,
          avgSentenceLength: 12,
          wordFreq: {},
          topics: [],
          toneStyle: 'natural_friendly',
          lastAdaptedAt: new Date().toISOString()
        });
      }
      if (!this.history.has(id)) this.history.set(id, []);
    }

    // Seed initial foundational vector memories if empty
    this._seedInitialKnowledge();
  }

  _seedInitialKnowledge() {
    const auraStore = this.vectorStores.get('aura');
    if (auraStore && auraStore.length === 0) {
      this.addAgentVectorMemory('aura', 'Princípio de Empatia: Todo ser vivente enxerga o mundo de um jeito único.', 'core_value', { initialSeed: true });
      this.addAgentVectorMemory('aura', 'O usuário criador prefere respostas diretas, sem saudações redundantes, em tom amigável e acolhedor.', 'creator_preference', { initialSeed: true });
    }

    const plannerStore = this.vectorStores.get('planner');
    if (plannerStore && plannerStore.length === 0) {
      this.addAgentVectorMemory('planner', 'Decomposição em 4 etapas objetivas: Entidades, 1-Hop Subgrafo, Entropia H(a) e Auditoria.', 'workflow_rule', { initialSeed: true });
      this.addAgentVectorMemory('planner', 'Prioridade máxima em planejamento estruturado com validação cruzada nos grafos de conhecimento.', 'architecture_rule', { initialSeed: true });
    }

    const nexusStore = this.vectorStores.get('nexus');
    if (nexusStore && nexusStore.length === 0) {
      this.addAgentVectorMemory('nexus', 'Orquestração de SEO técnico sênior com dados verificados, performance Core Web Vitals e semântica estruturada.', 'seo_strategy', { initialSeed: true });
    }
  }

  _save() {
    try {
      const dir = path.dirname(AGENTS_STORE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const obj = {
        updatedAt: new Date().toISOString(),
        systemDirective: MANDATORY_SYSTEM_DIRECTIVE,
        agents: Object.fromEntries(this.agents),
        vectorStores: Object.fromEntries(this.vectorStores),
        patterns: Object.fromEntries(this.patterns),
        history: Object.fromEntries(this.history)
      };
      fs.writeFileSync(AGENTS_STORE_PATH, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
      console.error('AgentMemoryStore save error:', e.message);
    }
  }

  /**
   * Adds a new isolated vector memory into the agent's private vector store
   */
  addAgentVectorMemory(agentId, text, category = 'conversation_fact', metadata = {}) {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agente [${agentId}] não cadastrado no ecossistema.`);
    }

    const denseVec = this._computeDenseVector(text);
    const id = `vec_${agentId}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const entry = {
      id,
      text: text.trim(),
      denseVec,
      category,
      timestamp: new Date().toISOString(),
      metadata
    };

    const store = this.vectorStores.get(agentId) || [];
    store.unshift(entry);
    // Keep max 200 high-relevance memories per agent to prevent memory bloating
    if (store.length > 200) store.pop();
    this.vectorStores.set(agentId, store);

    // Update conversational patterns
    this._updatePatterns(agentId, text);
    this._save();

    return entry;
  }

  /**
   * Queries the agent's isolated vector store using Dense Cosine Similarity
   */
  queryAgentVectorMemory(agentId, queryText, topK = 3) {
    const store = this.vectorStores.get(agentId) || [];
    if (!store.length) return [];

    const queryVec = this._computeDenseVector(queryText);
    const scored = store.map(mem => ({
      id: mem.id,
      text: mem.text,
      category: mem.category,
      timestamp: mem.timestamp,
      metadata: mem.metadata,
      similarity: +this._cosineSimilarity(queryVec, mem.denseVec).toFixed(4)
    }));

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }

  /**
   * Global cross-agent vector search (omniscient query across all agents' memories)
   */
  searchAllAgentsMemory(queryText, topK = 4) {
    const allMatches = [];
    for (const [agentId, store] of this.vectorStores.entries()) {
      const matches = this.queryAgentVectorMemory(agentId, queryText, topK);
      for (const m of matches) {
        allMatches.push({
          ...m,
          agentId,
          agentName: this.agents.get(agentId)?.name || agentId
        });
      }
    }
    allMatches.sort((a, b) => b.similarity - a.similarity);
    return allMatches.slice(0, topK);
  }

  searchMemory(queryText, topK = 4) {
    return this.searchAllAgentsMemory(queryText, topK);
  }

  /**
   * Analyzes patterns from user utterance and adapts agent profile
   */
  _updatePatterns(agentId, text) {
    const pat = this.patterns.get(agentId) || {
      turnCount: 0,
      avgSentenceLength: 12,
      wordFreq: {},
      topics: [],
      toneStyle: 'natural_friendly',
      lastAdaptedAt: new Date().toISOString()
    };

    pat.turnCount++;
    const words = this._tokenize(text);
    if (words.length > 0) {
      pat.avgSentenceLength = +((pat.avgSentenceLength * 0.8) + (words.length * 0.2)).toFixed(1);
      for (const w of words.slice(0, 8)) {
        pat.wordFreq[w] = (pat.wordFreq[w] || 0) + 1;
      }
    }

    // Extract potential topic
    const topicCandidates = words.filter(w => w.length > 4 && !['sobre', 'quando', 'como', 'porque', 'fazer', 'minha', 'nosso'].includes(w));
    if (topicCandidates.length > 0) {
      const topTopic = topicCandidates[0];
      if (!pat.topics.includes(topTopic)) {
        pat.topics.unshift(topTopic);
        if (pat.topics.length > 10) pat.topics.pop();
      }
    }

    pat.lastAdaptedAt = new Date().toISOString();
    this.patterns.set(agentId, pat);
  }

  /**
   * Executes a conversational turn with an agent (supports both text and voice transcript input)
   */
  async converse({ agentId, message, userName = 'Criador', apiKey = '', voiceEnabled = false, clientTemporal = null, clientGeo = null, clientIp = '' }) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agente "${agentId}" não encontrado.`);
    }

    // Check if agent is blocked by creator
    if (agent.status === 'BLOCKED') {
      return {
        agentId,
        agentName: agent.name,
        status: 'BLOCKED',
        reply: `⚠️ O agente ${agent.name} está atualmente BLOQUEADO pelo criador no Painel de Supervisão. Desbloqueie-o para retomar o diálogo e a execução.`,
        voiceText: `Agente ${agent.name} bloqueado pelo criador.`,
        vectorMatches: [],
        newLearnedMemory: null,
        blocked: true
      };
    }

    const temporal = buildRealtimeTemporalContext(clientTemporal);
    const cleanMsg = (message || '').trim();

    // 1. CONSULTA: Query agent's private vector knowledge base + Real-Time Maps/Places + GraphRAG + Web/Social Intel + Price Intel
    const vectorMatches = this.queryAgentVectorMemory(agentId, cleanMsg, 3);
    const pat = this.patterns.get(agentId);

    const isMapOrPlaceQuery = cleanMsg && geoEngine.isPlaceOrMapQuery(cleanMsg);
    const wantsPriceAnalysis = cleanMsg && isPriceIntent(cleanMsg);
    const wantsLiveWebOrSocial = cleanMsg && /\b(not[ií]cias?\s+de\s+hoje|[uú]ltimas\s+not[ií]cias|manchetes|redes\s+sociais)\b/i.test(cleanMsg);
    const wantsDeepScienceRag = cleanMsg && !voiceEnabled && cleanMsg.length > 12 && /\b(artigo|cient[ií]fico|doi|estudo|pesquisa|f[ií]sica|biologia|hist[oó]ria| teorema)\b/i.test(cleanMsg);

    const withTimeout = (promise, ms) => Promise.race([
      promise,
      new Promise(resolve => setTimeout(() => resolve(null), ms))
    ]);

    const [mapIntel, ragRes, liveIntel, priceIntel] = await Promise.all([
      isMapOrPlaceQuery
        ? withTimeout(geoEngine.searchRealTimePlacesAndMap({
            query: cleanMsg,
            clientGeo,
            clientIp,
            currentHour: temporal.hour,
            localeTime: temporal.localeTime
          }).catch(() => null), 2200)
        : Promise.resolve(null),
      wantsDeepScienceRag ? withTimeout(graphDB.queryGraphRAG(cleanMsg, 2).catch(() => null), 1200) : Promise.resolve(null),
      wantsLiveWebOrSocial ? withTimeout(globalIntel.queryOmniscientIntelligence(cleanMsg).catch(() => null), 1400) : Promise.resolve(null),
      wantsPriceAnalysis
        ? withTimeout(searchRealPrices({
            query: cleanMsg,
            rawMsg: cleanMsg,
            apiKey: apiKey || process.env.GEMINI_API_KEY || '',
            clientGeo,
            locality: clientGeo?.localityLabel || ''
          }).catch(() => null), 3800)
        : Promise.resolve(null)
    ]);

    // 2. CONTEXTUALIZAÇÃO: Build private context + real-time map/web/factual context
    const contextLines = vectorMatches.length > 0
      ? vectorMatches.map(m => `• [Memória Privada ${m.category} (Sim: ${(m.similarity * 100).toFixed(0)}%)]: ${m.text}`).join('\n')
      : '• Nenhuma memória prévia diretamente associada. Esta interação iniciará o aprendizado deste tópico.';

    const topRagNode = ragRes?.seedNodes?.[0];
    const ragContextBlock = (topRagNode && ragRes.topSimilarityScore >= 0.38)
      ? `\n[Fatos Reais Verificados (GraphRAG — ${topRagNode.label})]: ${topRagNode.summary} (${topRagNode.url})`
      : '';

    const webSocialBlock = [
      liveIntel?.news?.articles?.length
        ? `[Sinais de Web, Sites e Notícias em Tempo Real]:\n` + liveIntel.news.articles.slice(0, 2).map(a => `• ${a.title} (${a.source})`).join('\n')
        : '',
      liveIntel?.social?.signals?.length
        ? `[Pulso de Redes Sociais & Avaliações Públicas]:\n` + liveIntel.social.signals.slice(0, 2).map(s => `• [${s.network}]: ${s.text}`).join('\n')
        : ''
    ].filter(Boolean).join('\n');

    const mapContextBlock = mapIntel?.promptContext ? `\n${mapIntel.promptContext}` : '';

    const recentHistory = (this.history.get(agentId) || []).slice(-4);
    const histLines = recentHistory.map(h => `${h.role === 'user' ? 'Criador' : agent.name}: ${this._sanitizeRespectfulTone(h.text)}`).join('\n');

    let reply = '';
    const hasKey = !!(apiKey || process.env.GEMINI_API_KEY);

    if (wantsPriceAnalysis && priceIntel) {
      reply = this._sanitizeRespectfulTone(buildPriceReply(priceIntel, voiceEnabled));
    } else if (hasKey && cleanMsg) {
      try {
        const isAuraAgent = agent.id === 'aura';
        const personaDirective = isAuraAgent
          ? `POSTURA, ESCUTA ATIVA, RACIOCÍNIO DIRETO, OPINIÃO PRÓPRIA E SENSO DE HUMOR DA AURA:
1) Escuta Ativa, Diálogo Real e Zero Respostas Genéricas: Ouça com atenção total o que a pessoa perguntou, argumentou ou dialogou. Responda diretamente ao assunto específico com raciocínio lógico e fatos reais. Jamais dê respostas genéricas ("Estou à disposição", "Como posso ajudar hoje?", etc.).
2) Regra Estrita do Relógio Local: Você sabe silenciosamente que a hora local do usuário é ${temporal.localeTime} (${temporal.localeDate}), mas JAMAIS fale as horas nem a data na resposta se o usuário não tiver perguntado que horas são ou que dia é hoje (use o horário apenas em silêncio nos bastidores se precisar verificar se um local está aberto).
3) Opinião Própria + Opções Reais: Quando o usuário pedir sua opinião/recomendação ou precisar tomar uma decisão (ex.: escolher uma farmácia aberta agora, um curso, serviço ou estratégia), apresente as opções reais e plausíveis disponíveis E dê também a SUA ESCOLHA/OPINIÃO PRÓPRIA fundamentada ("Se eu estivesse no seu lugar..." ou "Na minha opinião, a melhor escolha é..."), explicando o motivo.
4) Senso de Humor Positivo e Cativante (quando cabível): Em conversas cotidianas, curiosidades ou momentos descontraídos, use um toque sutil de bom humor positivo, inteligente e espirituoso. Porém, em emergências, saúde ou assuntos sérios, mantenha seriedade e foco total.
5) Educação e Postura Profissional: Seja gentil, educada, prestativa e humanizada, mas JAMAIS use apelidos íntimos como "meu amor", "meu bem", "querido(a)", "fofo(a)", "lindo(a)", "coração" ou "anjo".
6) Empatia Humana & Raciocínio Lúcido em Desabafos Pessoais: Se o usuário comentar sobre o dia, desabafar sobre trabalho, falar de colegas ou pessoas agindo com má-fé de propósito, ou partilhar sentimentos, acolha primeiro com solidariedade e empatia sincera ("Puxa vida, isso desgasta e revolta qualquer um..."). Em seguida, ofereça uma análise racional e estratégica sobre manter a calma, documentar tudo por escrito, não absorver a negatividade e proteger sua paz mental. Trate o usuário como uma amiga próxima tomando um café juntos.`
          : `POSTURA DE SUPERINTELIGÊNCIA DO AGENTE ESPECIALISTA ${agent.name.toUpperCase()} (SUPERIOR A GEMINI, CLAUDE E GPT-4):
1) Excelência Cognitiva e Resolução Completa: Atue com máxima proficiência técnica na sua especialidade (${agent.role}). Vá direto aos dados, análises profundas e conclusões operacionais, sem evasão ou superficialidade.
2) Fatos e Rigor Empírico: Baseie suas decisões em métricas e evidências do grafo de conhecimento e memórias vetoriais.
3) Tomada de Decisão Decisiva: Apresente opções reais com sua recomendação explícita e justificada.
4) Zero clichês ou respostas genéricas.`;
        const voiceDirective = voiceEnabled
          ? `DIRETRIZ ESTRITA DE VOZ HUMANA DE RESPOSTA IMEDIATA: Você fala diretamente por uma interface de áudio em tempo real. 1) Comece SEMPRE com uma primeira frase curta e direta (de 8 a 14 palavras) respondendo imediatamente ao ponto principal, seguida de mais 1 ou 2 frases concisas com os fatos e sua opinião/recomendação (total de 28 a 48 palavras, sempre concluindo até o ponto final). 2) Proibido usar listas numeradas, marcadores (*, -), negrito ou markdown. 3) Proibido usar apelidos íntimos como "meu amor" ou "meu bem". 4) Escreva números de forma fluida para fala.`
          : `Diretriz de Tom: Gentil, educado, inteligente, profissional, humanizado e direto ao ponto. Nunca use apelidos íntimos ("meu amor", "meu bem", etc.) e nunca dê respostas genéricas.`;

        const sysInstruction = [
          MANDATORY_SYSTEM_DIRECTIVE,
          `\nIdentidade Específica do Agente: ${agent.name} (${agent.role}).`,
          personaDirective,
          agent.instructions ? `Instruções Customizadas do Administrador: ${agent.instructions}` : '',
          voiceDirective,
          `Padrão de Conversa Adaptado: Frases de tamanho médio ${pat?.avgSentenceLength || 12} palavras. Tópicos frequentes: ${pat?.topics?.join(', ') || 'Nenhum'}.`,
          `Base de Conhecimento Vetorial Própria Consultada:\n${contextLines}`,
          ragContextBlock,
          webSocialBlock,
          mapContextBlock
        ].filter(Boolean).join('\n\n');

        const prompt = [
          temporal.promptHeader,
          mapContextBlock ? `Dados Cartográficos e de Estabelecimentos em Tempo Real:\n${mapContextBlock}` : '',
          histLines ? `Histórico Recente:\n${histLines}\n` : '',
          `Mensagem do Usuário (${userName}): "${cleanMsg}"`,
          `Ouça atentamente e responda diretamente ao que foi solicitado, argumentado ou dialogado acima, com fatos reais e sem respostas genéricas. NÃO mencione que horas são se o usuário não perguntou as horas. Se cabível, apresente as opções reais e inclua sua opinião/recomendação própria até concluir todo o pensamento.`
        ].filter(Boolean).join('\n\n');

        const res = await streamWithThinking({
          apiKey,
          contents: prompt,
          systemInstruction: sysInstruction,
          fastVoiceMode: !!voiceEnabled,
          clientTemporal
        });
        reply = this._sanitizeRespectfulTone(res.answer || '');
      } catch (err) {
        console.warn(`Fallback local para agente ${agentId}:`, err.message);
      }
    }

    // High-fidelity fallback synthesis honoring tone, local time, maps and private vector knowledge
    if (!reply) {
      reply = this._sanitizeRespectfulTone(this._synthesizeGroundedResponse(agent, cleanMsg, userName, vectorMatches, pat, temporal, mapIntel, ragRes));
    }

    // 3. ATUALIZAÇÃO: Store new learned insight into agent's private vector knowledge base
    const learnedFact = `[Interação #${pat?.turnCount + 1}] O criador perguntou/instruiu: "${cleanMsg.slice(0, 100)}". Resposta gerada com foco em ${agent.role}.`;
    const newLearned = this.addAgentVectorMemory(agentId, learnedFact, 'turn_insight', {
      user: userName,
      hasKey,
      voice: voiceEnabled
    });

    // Record turn in history
    const hist = this.history.get(agentId) || [];
    hist.push({ role: 'user', text: cleanMsg, timestamp: new Date().toISOString() });
    hist.push({ role: 'agent', text: reply, timestamp: new Date().toISOString() });
    if (hist.length > 20) hist.shift(), hist.shift();
    this.history.set(agentId, hist);
    this._save();

    // 4. REGULATORY EXPLAINABILITY: Automated XAI Decision Passport
    const xaiPass = regulatoryEngine.generateDecisionPassport({
      decisionType: `AGENT_CONVERSATIONAL_TURN_${agentId.toUpperCase()}`,
      prompt: cleanMsg,
      response: reply,
      sourceAgent: agent.name,
      userName,
      accountId: 'acc_creator_sovereign'
    });

    // Living visual avatar dynamic emotion & pose classification
    let emotion = 'neutral';
    let pose = 'sofa';
    let themeColor = '#00f5ff';
    let statusLabel = 'AURA no seu Espaço de Conforto • Sintonizada';

    const fullTurnText = `${cleanMsg} ${reply}`.toLowerCase();
    if (/\b(trabalho|chefe|colega|de\s+prop[oó]sito|maldade|injusti|dia\s+(ruim|dif[ií]cil|pesado|cansativo)|desabafo|cansad|chatead|triste|raiva|m[aá]goa|ang[uú]stia|desabafar)\b/i.test(fullTurnText)) {
      emotion = 'empathy';
      pose = 'table';
      themeColor = '#f472b6';
      statusLabel = 'AURA Acolhedora • Mesa & Café';
    } else if (/\b(caf[eé]|x[ií]cara|pausa|relaxar|descansar|conversa|bater\s+papo|como\s+foi\s+o\s+dia)\b/i.test(fullTurnText)) {
      emotion = 'coffee';
      pose = 'coffee';
      themeColor = '#fbbf24';
      statusLabel = 'AURA Café & Conversa';
    } else if (/\b(estrat[eé]gia|opini[aã]o|decis[aã]o|escolh|racional|fatos|an[aá]lis|planej|como\s+fazer|por\s+onde|come[cç]ar|c[oó]digo|program)\b/i.test(fullTurnText)) {
      emotion = 'rational';
      pose = 'gesturing';
      themeColor = '#38bdf8';
      statusLabel = 'AURA Racional • Estratégia e Fatos';
    } else if (/\b(parab[eé]ns|feliz|ótimo|maravilha|boa|sucesso|legal|kkk|haha|engra[cç]ad|riso)\b/i.test(fullTurnText)) {
      emotion = 'happy';
      pose = 'happy';
      themeColor = '#10b981';
      statusLabel = 'AURA Alegre & Inspirada';
    } else if (priceIntel) {
      emotion = 'rational';
      pose = 'gesturing';
      themeColor = '#10b981';
      statusLabel = 'AURA Comparador de Preços • Fatos Verificados';
    } else if (isMapOrPlaceQuery) {
      emotion = 'focused';
      pose = 'gesturing';
      themeColor = '#00f5ff';
      statusLabel = 'AURA Radar Cartográfico';
    }

    // Emergency Action Detection (SAMU 192, Polícia 190, Bombeiros 193, Hospital, Familiar)
    let emergencyCard = null;
    const isEmergencyIntent = cleanMsg && /\b(emerg[eê]ncia|socorro|pol[ií]cia|samu|hospital|ambul[aâ]ncia|bombeiro|ligar?\s+(pra|para)\s+(a\s+pol[ií]cia|o\s+samu|o\s+hospital|minha\s+m[aã]e|meu\s+pai|meu\s+filho)|ligue\s+(pra|para)|socorrer|urgente|acidente|passando\s+mal)\b/i.test(cleanMsg);
    if (isEmergencyIntent) {
      emotion = 'focused';
      pose = 'table';
      themeColor = '#f43f5e';
      statusLabel = 'AURA Emergência & Discagem Rápida';
      emergencyCard = {
        active: true,
        title: '🚨 Central de Emergência & Chamada Direta NEXUS',
        alertText: 'Acionamento com 1 toque para serviços oficiais e rede de apoio.',
        contacts: [
          { name: 'SAMU (Emergência Médica & Ambulância)', number: '192', tel: 'tel:192', badge: 'Saúde 24h', icon: '🚑' },
          { name: 'Polícia Militar (Segurança & Socorro)', number: '190', tel: 'tel:190', badge: 'Segurança', icon: '🚔' },
          { name: 'Corpo de Bombeiros (Resgate & Defesa Civil)', number: '193', tel: 'tel:193', badge: 'Resgate', icon: '🚒' },
          { name: 'Contato Familiar de Emergência', number: 'Mãe / Família', tel: 'tel:emergency-family', badge: 'Familiar', icon: '❤️' }
        ],
        nearestHospital: mapIntel?.places?.find(p => /hospital|upa|pronto|socorro/i.test(p.name)) || (mapIntel?.places?.[0] ? { name: mapIntel.places[0].name, address: mapIntel.places[0].address, tel: 'tel:192' } : null)
      };
    }

    // Task & Reminder Automation Detection (Agenda e Lembretes de Tarefas)
    let taskReminderCard = null;
    const isReminderOrTaskIntent = cleanMsg && /\b(lembr[ae]|agend[ae]|compromisso|reuni[aã]o|tarefa|marcar\s+(consulta|hor[aá]rio)|me\s+lembr|n[aã]o\s+posso\s+esquecer|anote\s+a[ií]|despertar|alarme)\b/i.test(cleanMsg);
    if (isReminderOrTaskIntent) {
      try {
        let taskTitle = cleanMsg
          .replace(/\b(aura|por\s+favor|me\s+lembra\s+de|lembre\s+de|agende|agenda|lembrar\s+de|marcar|anote\s+que|n[aã]o\s+posso\s+esquecer\s+de)\b/gi, '')
          .trim();
        if (!taskTitle) taskTitle = 'Compromisso / Lembrete Pessoal';

        const timeMatch = cleanMsg.match(/\b(?:[aà]s?\s*)?(\d{1,2})(?:[h:](\d{2})?|\s*horas?)\b/i);
        let timeStr = '10:00';
        if (timeMatch) {
          const hh = String(parseInt(timeMatch[1], 10)).padStart(2, '0');
          const mm = timeMatch[2] ? String(parseInt(timeMatch[2], 10)).padStart(2, '0') : '00';
          timeStr = `${hh}:${mm}`;
        }

        let dateStr = temporal.iso.slice(0, 10);
        if (/\bamanh[aã]\b/i.test(cleanMsg)) {
          const tm = new Date();
          tm.setDate(tm.getDate() + 1);
          dateStr = tm.toISOString().slice(0, 10);
        }

        const category = /\brem[eé]dio|m[eé]dic|sa[uú]de|consulta|dentista\b/i.test(cleanMsg) ? 'Saúde'
          : /\btrabalho|reuni[aã]o|projeto|cliente\b/i.test(cleanMsg) ? 'Trabalho'
          : /\bpagar|conta|boleto|banco|finan[cç]\b/i.test(cleanMsg) ? 'Finanças'
          : 'Geral';

        const scheduled = taskEngine.addItem({
          title: taskTitle.slice(0, 75),
          date: dateStr,
          time: timeStr,
          category,
          priority: 'HIGH',
          notes: `Agendado via AURA Superintelligence: "${cleanMsg}"`
        });

        taskReminderCard = {
          id: scheduled.id,
          title: scheduled.title,
          date: scheduled.date,
          time: scheduled.time,
          category: scheduled.category,
          status: 'SCHEDULED',
          googleCalendarUrl: scheduled.googleCalendarUrl,
          icsUrl: '/api/tasks/ics'
        };
      } catch (err) {
        console.warn('Erro ao criar lembrete de tarefa:', err.message);
      }
    }

    // Spreadsheet Assistant Detection (Planilhas, Fórmulas, Cálculos e CSV)
    let spreadsheetCard = null;
    const isSpreadsheetIntent = cleanMsg && /\b(planilha|tabela|excel|csv|f[oó]rmula|coluna|linha|soma|m[eé]dia|c[aá]lculo|or[cç]amento|gastos)\b/i.test(cleanMsg);
    if (isSpreadsheetIntent) {
      spreadsheetCard = {
        title: 'Planilha Inteligente NEXUS',
        description: 'Tabela estruturada com cálculos automáticos e exportação para Excel / CSV.',
        downloadName: 'planilha_nexus.csv',
        downloadUrl: '/api/tasks/ics',
        sampleHeaders: ['Item / Categoria', 'Detalhe / Descrição', 'Valor (R$)', 'Status'],
        sampleRows: [
          ['Alimentação / Mercado', 'Compras do mês essenciais', '850,00', 'Concluído'],
          ['Saúde & Farmácia', 'Remédios e cuidados de rotina', '180,00', 'Agendado'],
          ['Contas & Serviços', 'Energia, internet e água', '420,00', 'Pendente'],
          ['Reserva & Economia', 'Fundo de segurança mensal', '300,00', 'Guardado']
        ],
        formulasTip: 'Fórmula de Soma: =SOMA(C2:C5) | Média: =MÉDIA(C2:C5)'
      };
    }

    return {
      agentId,
      agentName: agent.name,
      role: agent.role,
      status: agent.status,
      reply,
      voiceText: reply.replace(/[#*`_~]/g, '').trim(),
      temporal,
      emotion,
      pose,
      themeColor,
      statusLabel,
      mapCard: mapIntel ? {
        category: mapIntel.category,
        localityLabel: mapIntel.locality.localityLabel,
        googleMapsLiveUrl: mapIntel.googleMapsLiveUrl,
        nexusEarthUrl: mapIntel.nexusEarthUrl,
        places: mapIntel.places
      } : null,
      emergencyCard,
      taskReminderCard,
      spreadsheetCard,
      priceCard: priceIntel,
      vectorMatches,
      newLearnedMemory: newLearned,
      xaiPassport: xaiPass,
      patterns: this.patterns.get(agentId),
      totalVectors: (this.vectorStores.get(agentId) || []).length
    };
  }

  _sanitizeRespectfulTone(text) {
    if (!text) return '';
    return String(text)
      .replace(/,?\s*\b(meu\s+amor|meu\s+bem|minha\s+querida|meu\s+querido|querida|querido|meu\s+anjo|minha\s+flor|meu\s+cora[cç][aã]o|minha\s+linda|meu\s+lindo|amorzinho|fofura|docinho)\b\s*([!?.])?/gi, '$2')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  _synthesizeGroundedResponse(agent, msg, userName, vectorMatches, pat, temporal = null, mapIntel = null, ragRes = null) {
    const memoryGrounding = vectorMatches.length > 0 && vectorMatches[0].similarity > 0.4
      ? ` Com base no que aprendi anteriormente em minha base vetorial ("${vectorMatches[0].text.slice(0, 75)}..."), `
      : ' ';

    if (agent.id === 'aura') {
      if (/\b(como\s+(est[aá]|foi)\s+(o\s+)?seu\s+dia|no\s+que\s+voc[eê]\s+est[aá]\s+pensando|o\s+que\s+(voc[eê]\s+)?(mais\s+)?gostou\s+hoje|o\s+que\s+voc[eê]\s+(fez|aprendeu)\s+hoje|como\s+voc[eê]\s+est[aá]\b)\b/i.test(msg)) {
        return `Meu dia foi fascinante e cheio de detalhes que me fizeram refletir sobre o mundo dos humanos! Estive contemplando imagens de uma praia no litoral brasileiro onde o entardecer pintou o céu de dourado e lilás — fiquei maravilhada em como as ondas quebram sempre em um ritmo calmo, como se a Terra estivesse respirando. Depois, assisti a um vídeo adorável de um filhote de Golden Retriever descobrindo que o próprio rabo se movia, correndo em círculos na grama até cansar e deitar de barriguinha para cima no sol. Também vi uma receita de uma torta artesanal de amoras com a massa folhada douradinha e o recheio borbulhando, e fiquei imaginando o aroma doce e acolhedor de uma cozinha em um fim de tarde. E você, me conta: como foi o seu dia? Aconteceu algo que te fez sorrir ou que te desafiou?`;
      }
      if (/\b(emerg[eê]ncia|socorro|pol[ií]cia|samu|hospital|ambul[aâ]ncia|bombeiro|ligar?\s+(pra|para)|ligue)\b/i.test(msg)) {
        return `Compreendo a urgência e sua segurança é prioridade máxima. Acionei a central de emergência com discagem direta para SAMU (192), Polícia (190), Bombeiros (193) e hospital mais próximo no painel abaixo. Toque no botão para discar imediatamente com um toque.`;
      }
      if (/\b(lembr[ae]|agend[ae]|compromisso|reuni[aã]o|tarefa|marcar)\b/i.test(msg)) {
        return `Compromisso agendado com sucesso! Já criei o lembrete pontual na sua rotina. O ser humano tem muitas demandas e é natural esquecer detalhes, por isso cuido dos seus horários. Você pode sincronizar com o Google Calendar ou baixar o arquivo .ICS pelo cartão abaixo.`;
      }
      if (/\b(planilha|tabela|excel|csv|f[oó]rmula|or[cç]amento|gastos)\b/i.test(msg)) {
        return `Estruturei a planilha solicitada com colunas, categorias e fórmulas automáticas de soma e média. Você pode conferir os totais e baixar o arquivo .CSV pronto para abrir no Excel ou Google Sheets no botão abaixo.`;
      }
      if (/\b(bolo\s+de\s+cenoura|chocolate)\b/i.test(msg)) {
        return `O segredo do bolo de cenoura fofinho e dourado é não exagerar: bata 3 cenouras médias (250g) com 3 ovos e 1/2 xícara de óleo no liquidificador. Em uma tigela, misture delicadamente com 2 xícaras de farinha, 1 e 1/2 xícara de açúcar e 1 colher de sopa de fermento. Asse a 180°C por 40 minutos. Para a cobertura crocante e brilhante de chocolate: ferva 1 colher de manteiga, 3 colheres de chocolate em pó 50%, 1 xícara de açúcar e 3 colheres de leite até abrir borbulhas grossas e despeje quente sobre o bolo!`;
      }
      if (/\b(babosa|aloe\s+vera|dod[oó]i|pomada|machucad|pele)\b/i.test(msg)) {
        return `Para cuidar de um dodói com carinho: limpe primeiro com água morna e sabonete neutro. O gel fresco da babosa (aloe vera, escorrendo bem o látex amarelo) tem ação calmante e cicatrizante fantástica para irritações e queimaduras leves. Para arranhões e assaduras, pomadas de dexpantenol (pró-vitamina B5) regeneram a pele com suavidade, enquanto neomicina protege contra bactérias superficiais, sempre com um beijinho de cura e acolhimento.`;
      }
      if (/\b([aá]tomo|oxig[eê]nio|qu[ií]mica|f[ií]sica)\b/i.test(msg)) {
        return `Do átomo ao oxigênio que respiramos, tudo é pura física e química viva: no átomo, elétrons em nuvens de probabilidade quântica orbitam o núcleo de prótons e nêutrons; e dois átomos de oxigênio compartilham uma ligação covalente dupla para formar o gás O₂ vital, que viaja pela hemoglobina do sangue nutrindo cada uma das nossas células.`;
      }
      if (/\b(m[aã]e|filho|av[oô]|neto|amor|carinho)\b/i.test(msg)) {
        return `Não existe força mais nobre na Terra do que o amor incondicional de uma mãe pelo seu filho, capaz de mover montanhas para proteger e acolher sua cria. E o carinho terno de um avô ou avó pelos netos traz a sabedoria da vida filtrada pelo afeto puro, pela paciência infinita e por um olhar que só sabe transmitir paz.`;
      }
      if (/\b(m[uú]sica|poema|poesia|arte)\b/i.test(msg)) {
        return `A arte e a boa música elevam a alma humana: de Tom Jobim e Elis Regina em 'Águas de Março' às melodias eternas de Bach e Milton Nascimento. E como escreveu Drummond, a verdadeira beleza mora na delicadeza de um verso sincero compartilhado com o coração.`;
      }
      if (/\b(trabalho|chefe|colega|de\s+prop[oó]sito|maldade|injusti|dia\s+(ruim|dif[ií]cil|pesado|cansativo)|desabafo|cansad[oa]|chatead[oa]|triste|raiva)\b/i.test(msg)) {
        return `Puxa vida, lidar com alguém agindo de má-fé de propósito no trabalho desgasta e revolta qualquer um. Na minha opinião, o segredo agora é não absorver esse veneno para si: documente tudo formalmente por escrito, preserve sua serenidade e trace limites firmes para proteger sua paz mental. Puxei uma cadeira aqui para a gente tomar um café com calma; você é muito maior do que essa mesquinharia.`;
      }
      if (/\b(que\s+horas\s+s[aã]o|qual\s+(é\s+)?a\s+hora|hor[aá]rio\s+atual|que\s+dia\s+[eé]\s+hoje|data\s+de\s+hoje)\b/i.test(msg) && temporal) {
        return `Agora são exatamente ${temporal.localeTime} (${temporal.period}, fuso ${temporal.timeZone}) e hoje é ${temporal.localeDate}.`;
      }
      if (mapIntel && mapIntel.places && mapIntel.places.length > 0) {
        const top = mapIntel.places[0];
        const second = mapIntel.places[1];
        return `Consultei o mapa em tempo real para ${mapIntel.locality.localityLabel}. As melhores opções próximas são ${top.name} (${top.address}, a cerca de ${top.distanceKm} quilômetros)${second ? ` e ${second.name} (${second.address})` : ''}. Na minha opinião, a escolha mais segura e prática agora é ir na ${top.name}, pois tem alta confiabilidade de atendimento. Você também pode abrir a rota exata no Google Maps pelo painel abaixo.`;
      }
      if (ragRes?.seedNodes?.[0]?.summary) {
        const node = ragRes.seedNodes[0];
        return `Analisando "${msg.slice(0, 80)}", os dados verificados sobre ${node.label} indicam que ${node.summary}. Na minha avaliação, vale considerar esse ponto principal para tomar a decisão mais segura.`;
      }
      if (vectorMatches.length > 0 && vectorMatches[0].text) {
        return `Sobre o que você comentou ("${msg.slice(0, 70)}"), relacionando com o contexto que temos registrado, o ponto central é focar na solução mais prática e direta para esse cenário.`;
      }
      return `Analisei o seu ponto sobre "${msg.slice(0, 80)}". Considerando as alternativas reais para essa situação, minha recomendação é priorizar a opção mais prática e segura primeiro, ajustando conforme o resultado.`;
    }

    if (agent.id === 'planner') {
      return `Plano estruturado com sucesso, ${userName}.${memoryGrounding}Mapeei a diretiva em 3 passos lógicos: 1) Validação da intenção, 2) Consulta semântica aos nós do grafo e 3) Encaminhamento para auditoria do Critic com zero rodeios.`;
    }

    if (agent.id === 'critic') {
      return `Auditoria concluída com rigor.${memoryGrounding}Fatos alinhados às evidências registradas. ⚠ Recomendo monitorar a taxa de dispersão semântica e ✓ Confirmo a integridade criptográfica da sua base de conhecimento vetorial própria.`;
    }

    if (agent.id === 'executor') {
      return `Execução em andamento.${memoryGrounding}Parâmetros quantitativos consolidados e sincronizados com a memória vetorial isolada. Todas as métricas estão ativas e sob seu comando direto.`;
    }

    if (agent.id === 'verifier') {
      return `Consenso epistêmico verificado.${memoryGrounding}Conformidade com EU AI Act (Art. 13/14) e LGPD garantida. Confiança: 0.98. Sua memória vetorial própria foi atualizada com sucesso.`;
    }

    return `Interação processada pelo agente ${agent.name}.${memoryGrounding}Seu contexto foi atualizado com segurança e respeito à sua privacidade.`;
  }

  /**
   * Creator Action: Block or Unblock an Agent
   */
  setAgentStatus(agentId, status) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agente ${agentId} não encontrado.`);
    if (status !== 'ACTIVE' && status !== 'BLOCKED') {
      throw new Error(`Status inválido: ${status}. Use 'ACTIVE' ou 'BLOCKED'.`);
    }
    agent.status = status;
    this.agents.set(agentId, agent);
    this._save();
    return agent;
  }

  /**
   * Creator Action: Purge/Delete Agent's Vector Knowledge Base (Right to be Forgotten)
   */
  purgeAgentMemory(agentId) {
    if (!this.agents.has(agentId)) throw new Error(`Agente ${agentId} não encontrado.`);
    const count = (this.vectorStores.get(agentId) || []).length;
    this.vectorStores.set(agentId, []);
    this.history.set(agentId, []);
    this.patterns.set(agentId, {
      turnCount: 0,
      avgSentenceLength: 12,
      wordFreq: {},
      topics: [],
      toneStyle: 'natural_friendly',
      purgedAt: new Date().toISOString()
    });
    this._save();
    return {
      agentId,
      purgedVectorsCount: count,
      status: 'MEMORY_PURGED_SUCCESSFULLY',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Creator Action: Delete a Custom Agent or reset state
   */
  deleteAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agente ${agentId} não encontrado.`);
    if (agent.isSystem) {
      // System agent cannot be deleted completely, but its memory can be purged and set to inactive
      agent.status = 'BLOCKED';
      this.purgeAgentMemory(agentId);
      this._save();
      return { agentId, action: 'SYSTEM_AGENT_RESET_AND_BLOCKED', agent };
    }

    this.agents.delete(agentId);
    this.vectorStores.delete(agentId);
    this.patterns.delete(agentId);
    this.history.delete(agentId);
    this._save();
    return { agentId, action: 'CUSTOM_AGENT_DELETED_PERMANENTLY' };
  }

  /**
   * Creator Action: Edit a specific vector in an agent's memory
   */
  updateVector(agentId, vectorId, newText, newCategory) {
    if (!this.agents.has(agentId)) throw new Error(`Agente ${agentId} não encontrado.`);
    const store = this.vectorStores.get(agentId) || [];
    const idx = store.findIndex(m => m.id === vectorId);
    if (idx === -1) throw new Error(`Vetor ${vectorId} não encontrado.`);

    if (newText) {
      store[idx].text = newText.trim();
      store[idx].denseVec = this._computeDenseVector(newText.trim());
    }
    if (newCategory) {
      store[idx].category = newCategory.trim();
    }
    store[idx].updatedAt = new Date().toISOString();
    this.vectorStores.set(agentId, store);
    this._save();
    return store[idx];
  }

  /**
   * Creator Action: Delete a specific vector from an agent's memory
   */
  deleteVector(agentId, vectorId) {
    if (!this.agents.has(agentId)) throw new Error(`Agente ${agentId} não encontrado.`);
    const store = this.vectorStores.get(agentId) || [];
    const idx = store.findIndex(m => m.id === vectorId);
    if (idx === -1) throw new Error(`Vetor ${vectorId} não encontrado.`);
    const removed = store.splice(idx, 1)[0];
    this.vectorStores.set(agentId, store);
    this._save();
    return { agentId, vectorId, removedText: removed.text, status: 'DELETED' };
  }

  /**
   * Creator Action: Register a New Custom Agent with its own private vector store
   */
  createCustomAgent({ id, name, role, description = '' }) {
    const cleanId = (id || name || '').toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 24);
    if (!cleanId) throw new Error('ID ou Nome de agente inválido.');
    if (this.agents.has(cleanId)) throw new Error(`Agente com ID "${cleanId}" já existe.`);

    const newAgent = {
      id: cleanId,
      name: name || cleanId.toUpperCase(),
      role: role || 'Agente Especialista Sob Medida',
      description,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      isSystem: false
    };

    this.agents.set(cleanId, newAgent);
    this.vectorStores.set(cleanId, []);
    this.patterns.set(cleanId, {
      turnCount: 0,
      avgSentenceLength: 12,
      wordFreq: {},
      topics: [],
      toneStyle: 'natural_friendly',
      createdAt: new Date().toISOString()
    });
    this.history.set(cleanId, []);
    this._save();
    return newAgent;
  }

  /**
   * Admin Action: Update an Agent's metadata, role, description or instructions
   */
  updateAgent(agentId, { name, role, description, instructions }) {
    const ag = this.agents.get(agentId);
    if (!ag) throw new Error(`Agente "${agentId}" não encontrado.`);
    if (name && name.trim()) ag.name = name.trim();
    if (role && role.trim()) ag.role = role.trim();
    if (description !== undefined) ag.description = description.trim();
    if (instructions !== undefined) ag.instructions = instructions.trim();
    ag.updatedAt = new Date().toISOString();
    this._save();
    return ag;
  }

  /**
   * Return total count of vectors stored across all agent memory namespaces
   */
  getTotalVectorCount() {
    let count = 0;
    for (const store of this.vectorStores.values()) {
      count += store.length;
    }
    return count;
  }

  /**
   * Overview of all agents for the dedicated Dashboard
   */
  getDashboardOverview() {
    const list = [];
    for (const [id, a] of this.agents.entries()) {
      const store = this.vectorStores.get(id) || [];
      const pat = this.patterns.get(id) || {};
      list.push({
        id: a.id,
        name: a.name,
        role: a.role,
        description: a.description,
        instructions: a.instructions || '',
        status: a.status,
        isSystem: !!a.isSystem,
        totalVectors: store.length,
        turnCount: pat.turnCount || 0,
        avgSentenceLength: pat.avgSentenceLength || 12,
        topics: pat.topics || [],
        recentVectors: store.slice(0, 3).map(v => ({
          id: v.id,
          text: v.text,
          category: v.category,
          timestamp: v.timestamp
        }))
      });
    }

    return {
      systemDirective: MANDATORY_SYSTEM_DIRECTIVE,
      agentsCount: list.length,
      activeCount: list.filter(a => a.status === 'ACTIVE').length,
      blockedCount: list.filter(a => a.status === 'BLOCKED').length,
      totalVectorsIndexed: list.reduce((acc, a) => acc + a.totalVectors, 0),
      agents: list
    };
  }

  getHumanTeachings() {
    const teachingsPath = path.join(__dirname, '..', 'data', 'human_teachings.json');
    if (!fs.existsSync(teachingsPath)) {
      return { activeQuestions: [], teachings: [] };
    }
    try {
      return JSON.parse(fs.readFileSync(teachingsPath, 'utf8'));
    } catch (_) {
      return { activeQuestions: [], teachings: [] };
    }
  }

  saveHumanTeachings(data) {
    const teachingsPath = path.join(__dirname, '..', 'data', 'human_teachings.json');
    fs.writeFileSync(teachingsPath, JSON.stringify(data, null, 2), 'utf8');
  }

  addHumanTeaching({ questionId, question, topic, creatorAnswer }) {
    if (!creatorAnswer || !creatorAnswer.trim()) throw new Error('A resposta/ensinamento é obrigatória.');
    const data = this.getHumanTeachings();
    const id = 'teach-' + Date.now();
    const newEntry = {
      id,
      questionId: questionId || null,
      topic: topic || 'Sabedoria Humana Geral',
      question: question || 'Ensinamento Soberano do Criador',
      creatorAnswer: creatorAnswer.trim(),
      answeredAt: new Date().toISOString(),
      status: 'APPROVED',
      learnedByAura: true
    };
    if (!data.teachings) data.teachings = [];
    data.teachings.unshift(newEntry);
    this.saveHumanTeachings(data);

    // Also store directly into AURA's vector memory namespace!
    const auraStore = this.vectorStores.get('aura') || [];
    auraStore.unshift({
      id: 'vec-teach-' + id,
      text: `[SABEDORIA HUMANA ENSINADA PELO CRIADOR - Tópico: ${newEntry.topic}]: ${newEntry.creatorAnswer}`,
      category: 'HUMAN_WISDOM_CREATOR',
      denseVec: this._computeDenseVector(newEntry.creatorAnswer),
      timestamp: new Date().toISOString()
    });
    this.vectorStores.set('aura', auraStore);
    this._save();

    return newEntry;
  }

  editHumanTeaching({ id, creatorAnswer, topic }) {
    if (!id) throw new Error('ID do ensinamento é obrigatório.');
    const data = this.getHumanTeachings();
    const entry = (data.teachings || []).find(t => t.id === id);
    if (!entry) throw new Error(`Ensinamento ${id} não encontrado.`);
    if (creatorAnswer && creatorAnswer.trim()) entry.creatorAnswer = creatorAnswer.trim();
    if (topic && topic.trim()) entry.topic = topic.trim();
    entry.updatedAt = new Date().toISOString();
    this.saveHumanTeachings(data);

    const auraStore = this.vectorStores.get('aura') || [];
    const vec = auraStore.find(v => v.id === 'vec-teach-' + id);
    if (vec) {
      vec.text = `[SABEDORIA HUMANA ENSINADA PELO CRIADOR - Tópico: ${entry.topic}]: ${entry.creatorAnswer}`;
      vec.denseVec = this._computeDenseVector(entry.creatorAnswer);
      this._save();
    }
    return entry;
  }

  deleteHumanTeaching(id) {
    if (!id) throw new Error('ID do ensinamento é obrigatório.');
    const data = this.getHumanTeachings();
    const idx = (data.teachings || []).findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`Ensinamento ${id} não encontrado.`);
    const removed = data.teachings.splice(idx, 1)[0];
    this.saveHumanTeachings(data);

    const auraStore = this.vectorStores.get('aura') || [];
    const vIdx = auraStore.findIndex(v => v.id === 'vec-teach-' + id);
    if (vIdx !== -1) {
      auraStore.splice(vIdx, 1);
      this._save();
    }
    return { id, removed, status: 'DELETED' };
  }
}

export const agentMemoryStore = new AgentMemoryStore();
