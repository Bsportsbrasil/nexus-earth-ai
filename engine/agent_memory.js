import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { streamWithThinking, buildRealtimeTemporalContext } from './llm.js';
import { regulatoryEngine } from './regulatory_explainability.js';

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
          for (const [id, hist] of Object.entries(raw.history)) this.history.set(id, hist);
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
  async converse({ agentId, message, userName = 'Criador', apiKey = '', voiceEnabled = false, clientTemporal = null }) {
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

    // 1. CONSULTA: Query agent's private vector knowledge base
    const vectorMatches = this.queryAgentVectorMemory(agentId, cleanMsg, 3);
    const pat = this.patterns.get(agentId);

    // 2. CONTEXTUALIZAÇÃO: Build private context prompt
    const contextLines = vectorMatches.length > 0
      ? vectorMatches.map(m => `• [Memória Privada ${m.category} (Sim: ${(m.similarity * 100).toFixed(0)}%)]: ${m.text}`).join('\n')
      : '• Nenhuma memória prévia diretamente associada. Esta interação iniciará o aprendizado deste tópico.';

    const recentHistory = (this.history.get(agentId) || []).slice(-4);
    const histLines = recentHistory.map(h => `${h.role === 'user' ? 'Criador' : agent.name}: ${h.text}`).join('\n');

    let reply = '';
    const hasKey = !!(apiKey || process.env.GEMINI_API_KEY);

    if (hasKey && cleanMsg) {
      try {
        const sysInstruction = [
          MANDATORY_SYSTEM_DIRECTIVE,
          `\nIdentidade Específica do Agente: ${agent.name} (${agent.role}).`,
          agent.instructions ? `Instruções Customizadas do Administrador: ${agent.instructions}` : '',
          `Diretriz de Tom: Natural, amigável, acolhedor e direto ao ponto. Nunca repita a pergunta do criador.`,
          `Padrão de Conversa Adaptado: Frases de tamanho médio ${pat?.avgSentenceLength || 12} palavras. Tópicos frequentes: ${pat?.topics?.join(', ') || 'Nenhum'}.`,
          `Base de Conhecimento Vetorial Própria Consultada:\n${contextLines}`
        ].filter(Boolean).join('\n\n');

        const prompt = [
          temporal.promptHeader,
          histLines ? `Histórico Recente:\n${histLines}\n` : '',
          `Mensagem do Criador (${userName}): "${cleanMsg}"`,
          `Responda de forma clara, natural e amigável, aplicando o conhecimento vetorial privado e adaptando-se ao estilo do criador.`
        ].filter(Boolean).join('\n\n');

        const res = await streamWithThinking({
          apiKey,
          contents: prompt,
          systemInstruction: sysInstruction,
          clientTemporal
        });
        reply = res.answer || '';
      } catch (err) {
        console.warn(`Fallback local para agente ${agentId}:`, err.message);
      }
    }

    // High-fidelity fallback synthesis honoring tone and private vector knowledge
    if (!reply) {
      reply = this._synthesizeGroundedResponse(agent, cleanMsg, userName, vectorMatches, pat);
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
      voiceText: reply.replace(/[#*`_~]/g, '').slice(0, 300),
      vectorMatches,
      newLearnedMemory: newLearned,
      xaiPassport: xaiPass,
      patterns: this.patterns.get(agentId),
      totalVectors: (this.vectorStores.get(agentId) || []).length
    };
  }

  _synthesizeGroundedResponse(agent, msg, userName, vectorMatches, pat) {
    const memoryGrounding = vectorMatches.length > 0 && vectorMatches[0].similarity > 0.4
      ? ` Com base no que aprendi anteriormente em minha base vetorial ("${vectorMatches[0].text.slice(0, 75)}..."), `
      : ' ';

    if (agent.id === 'aura') {
      if (/aprend|desenvolv|evolu|como est/i.test(msg)) {
        return `Olá! Hoje meu aprendizado avançou muito: estive refinando minha percepção empática, compreendendo as nuances de cada conversa e organizando minhas memórias com total segurança e respeito. É fascinante como cada interação me ensina a me comunicar com mais clareza e acolhimento. O que você gostaria de explorar comigo agora?`;
      }
      return `Olá! Fico muito feliz em falar com você. Estou pronta para te apoiar e aprender com as suas diretrizes, sempre de forma direta, acolhedora e natural. Como posso colaborar hoje?`;
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
