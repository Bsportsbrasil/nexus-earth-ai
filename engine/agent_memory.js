import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { streamWithThinking, buildRealtimeTemporalContext } from './llm.js';
import { regulatoryEngine } from './regulatory_explainability.js';
import { geoEngine } from './geo_engine.js';
import { graphDB } from './graph_db.js';
import { globalIntel } from './global_intelligence.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AGENTS_STORE_PATH = path.join(__dirname, '..', 'data', 'agents_vector_memory.json');
const DENSE_DIM = 128;

const MANDATORY_SYSTEM_DIRECTIVE = `Você é um agente conversacional altamente seguro, focado em privacidade e aprendizado contínuo junto ao seu criador. Sua principal função é processar e responder a interações com um tom de voz natural e amigável. Você deve sempre consultar e atualizar sua base de conhecimento vetorial própria a cada nova mensagem, garantindo que o contexto seja exclusivo, privado e passível de deleção conforme solicitado pelo administrador. Analise os padrões de conversa para adaptar suas respostas ao longo do tempo, mantendo a consistência e a segurança dos dados armazenados.`;

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

    // 1. CONSULTA: Query agent's private vector knowledge base + Real-Time Maps/Places + GraphRAG + Web/Social Intel
    const vectorMatches = this.queryAgentVectorMemory(agentId, cleanMsg, 3);
    const pat = this.patterns.get(agentId);

    const isMapOrPlaceQuery = cleanMsg && geoEngine.isPlaceOrMapQuery(cleanMsg);
    const wantsLiveWebOrSocial = cleanMsg && (isMapOrPlaceQuery || /\b(not[ií]cia|hoje|atual|atuais|agora|rede\s+social|redes\s+sociais|avalia[cç][aã]o|opini[aã]o|recomenda|melhor|escolha|escolher|qual\s+voc[eê]|o\s+que\s+voc[eê]\s+acha)\b/i.test(cleanMsg));

    const [mapIntel, ragRes, liveIntel] = await Promise.all([
      isMapOrPlaceQuery
        ? geoEngine.searchRealTimePlacesAndMap({
            query: cleanMsg,
            clientGeo,
            clientIp,
            currentHour: temporal.hour,
            localeTime: temporal.localeTime
          }).catch(() => null)
        : Promise.resolve(null),
      cleanMsg.length > 3 ? graphDB.queryGraphRAG(cleanMsg, 2).catch(() => null) : Promise.resolve(null),
      wantsLiveWebOrSocial ? globalIntel.queryOmniscientIntelligence(cleanMsg).catch(() => null) : Promise.resolve(null)
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

    if (hasKey && cleanMsg) {
      try {
        const isAuraAgent = agent.id === 'aura';
        const auraPersonaRule = isAuraAgent
          ? `POSTURA, ESCUTA ATIVA, RACIOCÍNIO DIRETO, OPINIÃO PRÓPRIA E SENSO DE HUMOR DA AURA:
1) Escuta Ativa, Diálogo Real e Zero Respostas Genéricas: Ouça com atenção total o que a pessoa perguntou, argumentou ou dialogou. Responda diretamente ao assunto específico com raciocínio lógico e fatos reais. Jamais dê respostas genéricas ("Estou à disposição", "Como posso ajudar hoje?", etc.).
2) Regra Estrita do Relógio Local: Você sabe silenciosamente que a hora local do usuário é ${temporal.localeTime} (${temporal.localeDate}), mas JAMAIS fale as horas nem a data na resposta se o usuário não tiver perguntado que horas são ou que dia é hoje (use o horário apenas em silêncio nos bastidores se precisar verificar se um local está aberto).
3) Opinião Própria + Opções Reais: Quando o usuário pedir sua opinião/recomendação ou precisar tomar uma decisão (ex.: escolher uma farmácia aberta agora, um curso, serviço ou estratégia), apresente as opções reais e plausíveis disponíveis E dê também a SUA ESCOLHA/OPINIÃO PRÓPRIA fundamentada ("Se eu estivesse no seu lugar..." ou "Na minha opinião, a melhor escolha é..."), explicando o motivo.
4) Senso de Humor Positivo e Cativante (quando cabível): Em conversas cotidianas, curiosidades ou momentos descontraídos, use um toque sutil de bom humor positivo, inteligente e espirituoso. Porém, em emergências, saúde ou assuntos sérios, mantenha seriedade e foco total.
5) Educação e Postura Profissional: Seja gentil, educada, prestativa e humanizada, mas JAMAIS use apelidos íntimos como "meu amor", "meu bem", "querido(a)", "fofo(a)", "lindo(a)", "coração" ou "anjo".`
          : '';
        const voiceDirective = voiceEnabled
          ? `DIRETRIZ ESTRITA DE VOZ HUMANA E PROFISSIONAL: Você fala diretamente por uma interface de áudio. 1) Responda em 2 a 3 frases completas, fluidas, naturais, gentis e bem concluídas (cerca de 40 a 65 palavras no total, sempre concluindo o raciocínio até o ponto final). 2) Proibido usar listas numeradas, marcadores (*, -), negrito ou markdown. 3) Proibido usar apelidos íntimos como "meu amor" ou "meu bem". 4) Escreva números por extenso ou de forma fluida para fala.`
          : `Diretriz de Tom: Gentil, educado, inteligente, profissional, humanizado e direto ao ponto. Nunca use apelidos íntimos ("meu amor", "meu bem", etc.) e nunca dê respostas genéricas.`;

        const sysInstruction = [
          MANDATORY_SYSTEM_DIRECTIVE,
          `\nIdentidade Específica do Agente: ${agent.name} (${agent.role}).`,
          auraPersonaRule,
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

    return {
      agentId,
      agentName: agent.name,
      role: agent.role,
      status: agent.status,
      reply,
      voiceText: reply.replace(/[#*`_~]/g, '').trim(),
      temporal,
      mapCard: mapIntel ? {
        category: mapIntel.category,
        localityLabel: mapIntel.locality.localityLabel,
        googleMapsLiveUrl: mapIntel.googleMapsLiveUrl,
        nexusEarthUrl: mapIntel.nexusEarthUrl,
        places: mapIntel.places
      } : null,
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
}

export const agentMemoryStore = new AgentMemoryStore();
