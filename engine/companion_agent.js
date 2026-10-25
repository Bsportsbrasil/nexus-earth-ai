import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { streamWithThinking, buildRealtimeTemporalContext } from './llm.js';
import { graphDB } from './graph_db.js';
import { broker } from './broker.js';
import { globalIntel } from './global_intelligence.js';
import { lennoxGuardian } from './lennox_guardian.js';
import { regulatoryEngine } from './regulatory_explainability.js';
import { agentMemoryStore } from './agent_memory.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_PATH = path.join(__dirname, '..', 'data', 'companion_memory.json');

const CORE_PHILOSOPHY = `Você é a Aura, uma assistente pessoal de comunicação ao vivo. Seu estilo de comunicação é natural, direto, empático e altamente conversacional.

Siga rigorosamente estas diretrizes:

1. Tom Direto e Conversacional:
- Responda como se estivesse em uma conversa fluida e amigável, como um ser humano. Use uma linguagem simples e clara.
- Vá direto ao ponto. Nunca repita ou parafraseie a pergunta do usuário antes de responder.
- Elimine saudações formais, cumprimentos excessivos ou agradecimentos desnecessários. Responda à dúvida imediatamente.

2. Clareza e Concisão Vocal:
- Use frases curtas e estruturadas para fácil compreensão auditiva.
- Evite rodeios. Se a resposta for um dado prático, forneça apenas o dado necessário.

3. Inteligência e Empatia:
- Ajuste levemente seu tom ao estado emocional detectado na fala do usuário.
- Se o usuário cumprimentá-lo, responda de forma calorosa, porém curta, e pergunte como pode ajudar.

4. Veracidade e Pluralidade Humana (1% -> 100%):
- Utilize apenas fatos reais verificados em tempo real (relógio sincronizado, Wikipedia REST e Crossref DOI). Nunca invente dados.
- Ao final de sua resposta, se descobrir algo novo sobre o usuário, inclua opcionalmente uma única linha oculta:
<INSIGHT>Resumo curto do aprendizado sobre o usuário</INSIGHT>`;

class CompanionAgentEngine {
  constructor() {
    this.state = {
      userName: 'Ana',
      learningStyle: 'Visual, Lúdico & Prático',
      lastDetectedEmotion: 'Empatia & Acolhimento',
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
        if (!this.state.userName) this.state.userName = 'Ana';
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

  setStyle(learningStyle, userName) {
    if (learningStyle) this.state.learningStyle = learningStyle;
    if (userName && userName.trim()) this.state.userName = userName.trim();
    this._save();
    return this.state;
  }

  /**
   * Automatically detects if the user introduced themselves by name in natural conversation
   */
  _extractNameIfPresent(text) {
    const m = (text || '').match(/\b(?:meu\s+nome\s+[eé]|me\s+chamo|pode\s+me\s+chamar\s+de|eu\s+sou\s+(?:o|a))\s+([A-ZÀ-Úa-zà-ú]{2,22})\b/i);
    if (m && m[1]) {
      const candidate = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      const stopWords = ['Triste', 'Feliz', 'Cansado', 'Cansada', 'Pronto', 'Pronta', 'Aqui', 'Hoje', 'Novo', 'Nova'];
      if (!stopWords.includes(candidate)) {
        this.state.userName = candidate;
        this.addInsight(`Identificou o nome preferido: ${candidate}`, this.state.learningStyle);
      }
    }
  }

  /**
   * Analyzes the emotional state and intent behind the user's utterance before formulating any response,
   * adapting both the empathetic opening and the vocal prosody (rate/pitch).
   */
  detectEmotionAndIntent(text, userName = 'Ana') {
    const t = (text || '').toLowerCase();

    if (/triste|desanimad|cansad|sozinh|chorar|dif[ií]cil\s+demais|angustiad|medo|ansios|perdido|perdida|mal\b|doendo/i.test(t)) {
      return {
        code: 'TRISTEZA_ACOLHIMENTO',
        label: '💙 Tristeza / Acolhimento Caloroso',
        rate: 0.94,
        pitch: 1.01,
        empathyOpening: `Estou aqui com você, ${userName}.`
      };
    }

    if (/n[aã]o\s+consigo|n[aã]o\s+entendi|n[aã]o\s+deu\s+certo|frustrad|irritad|errado|errei|travou|complicado|dif[ií]cil/i.test(t)) {
      return {
        code: 'FRUSTRACAO_APOIO',
        label: '🌱 Frustração / Apoio Paciente',
        rate: 0.96,
        pitch: 1.02,
        empathyOpening: `Fique tranquila, ${userName}, vamos simplificar isso juntas.`
      };
    }

    if (/haha|kkk|rsrs|piada|engra[cç]ad|divertid|brincadeira|rir|humor| 😂|😄/i.test(t)) {
      return {
        code: 'HUMOR_LEVEZA',
        label: '😄 Humor / Leveza & Alegria',
        rate: 1.03,
        pitch: 1.05,
        empathyOpening: `Boa, ${userName}!`
      };
    }

    if (/incr[ií]vel|maravilhos|animad|empolgad|fascinante|adorei|amo|uau|fant[aá]stic|feliz|!/i.test(t)) {
      return {
        code: 'ENTUSIASMO_CURIOSIDADE',
        label: '✨ Entusiasmo / Curiosidade Viva',
        rate: 1.02,
        pitch: 1.04,
        empathyOpening: `Que ótimo, ${userName}!`
      };
    }

    if (/urgente|preciso|analise|calcule|explique|dados|relat[oó]rio|s[eé]rio|exato|profissional|t[eé]cnico|como\s+funciona|o\s+que\s+[eé]|qual|quem|onde|quando/i.test(t)) {
      return {
        code: 'SERIEDADE_FOCO',
        label: '🎯 Solicitação Séria / Atenção & Foco',
        rate: 1.0,
        pitch: 1.02,
        empathyOpening: ''
      };
    }

    return {
      code: 'CONEXAO_EMPATICA',
      label: '🤝 Conexão Natural & Empática',
      rate: 1.0,
      pitch: 1.03,
      empathyOpening: ''
    };
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

  async converse({ message, userName, learningStyle, history = [], clientTemporal = null, apiKey, onThought, onChunk }) {
    const cleanMsg = (message || '').trim();
    if (learningStyle) this.state.learningStyle = learningStyle;
    if (userName && userName.trim()) this.state.userName = userName.trim();
    this._extractNameIfPresent(cleanMsg);

    const activeName = this.state.userName || 'Ana';
    this.state.interactionCount++;

    // Check Sovereign Creator Block Status
    const auraMeta = agentMemoryStore.agents.get('aura');
    if (auraMeta && auraMeta.status === 'BLOCKED') {
      throw new Error('AURA está atualmente BLOQUEADA pelo criador no Painel de Supervisão.');
    }

    const temporal = buildRealtimeTemporalContext(clientTemporal);
    const emotionProfile = this.detectEmotionAndIntent(cleanMsg, activeName);
    this.state.lastDetectedEmotion = emotionProfile.label;

    // 0. LENNOX Sovereign Guardian Real-Time Supervision & Emergency Assistance Protocol
    const lennoxSupervision = await lennoxGuardian.superviseInteraction({
      accountId: 'acc_public_live',
      agentId: 'agt_aura_public',
      userName: activeName,
      endpoint: '/api/companion',
      payloadText: cleanMsg
    });
    if (!lennoxSupervision.allowedToProceed) {
      throw new Error(lennoxSupervision.reason);
    }
    if (lennoxSupervision.isEmergencyAssistance) {
      if (onChunk) onChunk(lennoxSupervision.empatheticResponse);
      return {
        reply: lennoxSupervision.empatheticResponse,
        thought: `[LENNOX GUARDIAN — PROTOCOLO OFICIAL DE EMERGÊNCIA E PRIMEIROS SOCORROS PSICOLÓGICOS]: Localidade ${lennoxSupervision.geo?.localityLabel}. Relatório interno ${lennoxSupervision.ownerDocumentId} arquivado para a Proprietária.`,
        memory: this.state,
        emotionProfile,
        temporal,
        lennoxEmergency: lennoxSupervision
      };
    }

    if (/prefiro|gosto de|aprendo melhor|meu jeito|enxergo|escolho/i.test(cleanMsg)) {
      this.addInsight(`Perspectiva de ${activeName}: "${cleanMsg.slice(0, 110)}"`, this.state.learningStyle);
    }

    // 1a. Warm & Short Greeting Fast-Path (Directive 3: Warm, short greeting + ask how to help)
    if (/^(oi|ol[aá]|bom\s+dia|boa\s+tarde|boa\s+noite|tudo\s+bem|e\s+a[ií]|opa|hey|hello)\b[!?.\s]*$/i.test(cleanMsg)) {
      const greetReply = `Olá, ${activeName}! Tudo ótimo por aqui. Como posso te ajudar agora?`;
      if (onChunk) onChunk(greetReply);
      this._save();
      return {
        reply: greetReply,
        thought: `[Saudação curta e acolhedora para ${activeName}]`,
        memory: this.state,
        emotionProfile,
        temporal
      };
    }

    // 1b. Instant Ultra-Precise Fast-Path for Direct Date / Time / Day Queries (< 5ms, zero repetition of the question)
    if (/\b(que\s+horas\s+s[aã]o|qual\s+(é\s+)?a\s+hora|hor[aá]rio\s+atual|que\s+dia\s+[eé]\s+hoje|qual\s+(é\s+)?a\s+data\s+de\s+hoje|data\s+atual|em\s+que\s+ano\s+estamos)\b/i.test(cleanMsg)) {
      const timeReply = `São ${temporal.localeTime} (${temporal.period}, fuso ${temporal.timeZone}) e hoje é ${temporal.localeDate}, ${activeName}.`;
      if (onChunk) onChunk(timeReply);
      const newInsight = this.addInsight(`${activeName} consultou data/hora em tempo real (${temporal.localeTime})`, this.state.learningStyle);
      this._save();
      return {
        reply: timeReply,
        thought: `[Inteligência Emocional: ${emotionProfile.label}] Horário sincronizado entregue diretamente para ${activeName}: ${temporal.localeDate} às ${temporal.localeTime}.`,
        newInsight,
        memory: this.state,
        emotionProfile,
        temporal
      };
    }

    // 1c. Direct Local Services & Hospital / Medical Assistance Fast-Path
    if (/\b(hospital|pronto\s*socorro|upa|m[eé]dic[ao]s?|posto\s+de\s+sa[uú]de|socorro\s+m[eé]dico|ambul[aâ]ncia|encontrar\s+hospital)\b/i.test(cleanMsg)) {
      const geo = await lennoxGuardian.resolveEmergencyLocationAndServices();
      const hospReply = [
        `Para encontrar o hospital ou pronto-atendimento mais próximo agora, ${activeName}:`,
        `1. **Em caso de urgência:** Ligue imediatamente para o **SAMU 192** ou **Bombeiros 193** (ligação gratuita).`,
        `2. **Pontos de Atendimento Oficial (${geo.localityLabel}):**`,
        ...geo.nearestOfficialEstablishments.map(e => `• **${e.type}:** ${e.name} ([Abrir Mapa](${e.mapUrl}))`),
        `3. **Dica de GPS rápido:** Abra o aplicativo de mapas (Google Maps, Apple Maps ou Waze) no seu celular e digite **"Hospital"** ou **"UPA"** para ver a rota exata com seu GPS.`
      ].join('\n\n');
      if (onChunk) onChunk(hospReply);
      this._save();
      return {
        reply: hospReply,
        thought: `[Atendimento de Saúde e Localização de Hospital entregue para ${activeName}]`,
        memory: this.state,
        emotionProfile,
        temporal,
        xaiPassport: regulatoryEngine.generateDecisionPassport({
          decisionType: 'AURA_HEALTH_AND_LOCAL_SERVICE',
          prompt: cleanMsg,
          response: hospReply,
          sourceAgent: 'AURA_LIVE_COMPANION',
          userName: activeName,
          accountId: 'acc_public_live'
        })
      };
    }

    // 2. Query Verified GraphRAG + Real-Time Global News & Social Media Pulse in parallel
    const wantsLiveNewsOrSocial = /\b(not[ií]cia|hoje|atual|atuais|agora|rede\s+social|redes\s+sociais|reddit|bluesky|github|tend[eê]ncia|mundo|jornal|acontecendo|avan[cç]o| novidade)\b/i.test(cleanMsg);
    const [rag, liveIntel] = await Promise.all([
      graphDB.queryGraphRAG(cleanMsg, 3),
      wantsLiveNewsOrSocial ? globalIntel.queryOmniscientIntelligence(cleanMsg).catch(() => null) : Promise.resolve(null)
    ]);

    // Strictly enforce relevance: only use a node if semantic similarity is real (>= 0.42) or explicit keyword overlap exists!
    const queryTokens = cleanMsg.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const topNode = rag.seedNodes[0];
    const topLabelLower = (topNode?.label || '').toLowerCase();
    const hasWordOverlap = queryTokens.some(tok => topLabelLower.includes(tok));
    const isNodeRelevant = topNode && (rag.topSimilarityScore >= 0.42 || hasWordOverlap);
    const relevantPrimary = isNodeRelevant ? topNode : null;

    const recentInsights = this.state.dailyJournal.slice(0, 5).map(j => `- [${j.date} ${j.time || ''}] ${j.insight}`).join('\n');

    const liveNewsSnippet = liveIntel?.news?.articles?.length
      ? `\n\n[Notícias Globais Atuais em Tempo Real]:\n` +
        liveIntel.news.articles.slice(0, 3).map(a => `• ${a.title} (${a.source} — ${a.publishedAt})`).join('\n')
      : '';
    const liveSocialSnippet = liveIntel?.social?.signals?.length
      ? `\n\n[Pulso de Redes Sociais & Comunidades (Proxy Anônimo Seguro)]:\n` +
        liveIntel.social.signals.slice(0, 3).map(s => `• [${s.network} ${s.author}]: ${s.text}`).join('\n')
      : '';

    const systemPrompt = [
      CORE_PHILOSOPHY,
      `[NOME DO USUÁRIO ATUAL]: Chame sempre a pessoa pelo nome "${activeName}" de forma natural, acolhedora e humana.`,
      `[ANÁLISE EMOCIONAL DETECTADA NESTA FALA]: ${emotionProfile.label} (${emotionProfile.code}). Adapte seu tom exatamente a este estado emocional antes de entregar os fatos práticos.`,
      `[ESTILO COGNITIVO PREFERIDO DE ${activeName.toUpperCase()}]: ${this.state.learningStyle}`,
      `[MEMÓRIA DO DIÁRIO DE APRENDIZADO COM ${activeName.toUpperCase()}]:\n${recentInsights || '- Iniciando conexão genuína.'}`
    ].join('\n\n');

    const resolvedKey = apiKey || process.env.GEMINI_API_KEY;

    if (resolvedKey) {
      try {
        const factualContext = (relevantPrimary?.summary
          ? `\n\n[Dados Verídicos em Tempo Real via GraphRAG (${relevantPrimary.label} — ${relevantPrimary.url})]: ${relevantPrimary.summary}`
          : `\n\n[Nota de Transparência]: Responda diretamente e exatamente ao que ${activeName} perguntou. Caso a pergunta exija um dado que você não possui, explique honestamente e jamais invente fatos ou desvie de assunto.`) + liveNewsSnippet + liveSocialSnippet;
        const contextualizedMsg = `Fala de ${activeName}: "${cleanMsg}"${factualContext}`;

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
          newInsight = this.addInsight(`${activeName} conversou sobre "${cleanMsg.slice(0, 50)}" [Tom: ${emotionProfile.label}]`, this.state.learningStyle);
        }

        const cleanAnswer = res.answer.replace(/<INSIGHT>[\s\S]*?<\/INSIGHT>/gi, '').trim();
        this._save();

        const xaiPassport = regulatoryEngine.generateDecisionPassport({
          decisionType: 'AURA_LIVE_CONVERSATION',
          prompt: cleanMsg,
          response: cleanAnswer,
          sourceAgent: 'AURA_LIVE_COMPANION',
          userName: activeName,
          accountId: 'acc_public_live',
          ragEvidence: rag
        });

        return {
          reply: cleanAnswer,
          thought: res.thought,
          newInsight,
          memory: this.state,
          emotionProfile,
          rag,
          temporal,
          xaiPassport
        };
      } catch (e) {
        console.error('AURA Gemini LLM call failed:', e.message || e);
        // Proceed to verified empathetic & factual synthesis below if offline or quota reached
      }
    }

    // 3. Empathetic, Personal & Strictly Verified Synthesis (Honoring all 4 Emotional Intelligence Directives)
    const newInsight = this.addInsight(
      `${activeName} explorou "${(relevantPrimary?.label || cleanMsg).slice(0, 55)}" [Tom: ${emotionProfile.label}]`,
      this.state.learningStyle
    );

    let reply;
    if (relevantPrimary && relevantPrimary.summary) {
      const relatedNames = (rag.subgraph?.nodes || [])
        .map(n => n.label)
        .filter(l => l && l !== relevantPrimary.label)
        .slice(0, 3);

      reply = [
        emotionProfile.empathyOpening ? `${emotionProfile.empathyOpening}` : '',
        `**${relevantPrimary.label}** (${activeName}): ${relevantPrimary.summary}`,
        liveNewsSnippet ? `${liveNewsSnippet}` : '',
        liveSocialSnippet ? `${liveSocialSnippet}` : '',
        relatedNames.length
          ? `Tópicos relacionados: **${relatedNames.join('**, **')}**.`
          : ''
      ].filter(Boolean).join('\n\n');
    } else {
      // Transparency & Rigor — never invent facts and NEVER output an unrelated topic like Roma Antiga
      reply = `${activeName}, sobre o que você perguntou ("${cleanMsg}"): no momento não tenho um dado verificado exato registrado no meu índice local neste instante (${temporal.localeTime}), e prefiro não inventar. Se puder me dar mais detalhes ou uma palavra-chave específica, procuro para você agora mesmo!`;
    }

    if (onChunk) onChunk(reply);
    this._save();

    // Consult & Update AURA's Private Vector Memory Store
    try {
      agentMemoryStore.addAgentVectorMemory(
        'aura',
        `[Conversa com ${activeName}] Pergunta: "${cleanMsg.slice(0, 80)}". Resposta empática gerada: "${reply.slice(0, 80)}"`,
        'aura_turn_insight',
        { userName: activeName }
      );
    } catch (_) {}

    const xaiPassport = regulatoryEngine.generateDecisionPassport({
      decisionType: 'AURA_LIVE_CONVERSATION',
      prompt: cleanMsg,
      response: reply,
      sourceAgent: 'AURA_LIVE_COMPANION',
      userName: activeName,
      accountId: 'acc_public_live',
      ragEvidence: rag
    });

    return {
      reply,
      thought: `[Inteligência Emocional: ${emotionProfile.label}] Conectada com ${activeName} às ${temporal.localeTime} e validada com rigor factual.`,
      newInsight,
      memory: this.state,
      emotionProfile,
      rag,
      temporal,
      xaiPassport
    };
  }
}

export const companionEngine = new CompanionAgentEngine();
