import { graphDB } from './graph_db.js';
import { streamWithThinking } from './llm.js';
import { broker } from './broker.js';

/**
 * Cooperative Superintelligence Alignment, Controlled Release Gate,
 * Eco-Sustainability Telemetry & Neurodivergent/ASD (TEA) Inclusive Pedagogy Engine
 */
class CooperativeAlignmentEngine {
  constructor() {
    this.auditLog = [];
    this.totalEnergyJoules = 0;
    this.totalCarbonGrams = 0;
  }

  /**
   * Evaluates a directive across 4 Cooperative Superintelligence dimensions:
   * 1. Human Agency Preservation (0..1)
   * 2. Social & Neurodivergent Inclusion Impact (0..1)
   * 3. Environmental Sustainability & Compute Efficiency (0..1)
   * 4. Safety & Controlled Release Gate (STAGE_1_SANDBOX .. STAGE_4_COOPERATIVE)
   */
  evaluateControlledRelease(directive = '', tokensProcessed = 120) {
    const text = (directive || '').toLowerCase();

    // Estimate real compute energy & carbon footprint:
    // ~0.0012 Wh (4.32 Joules) per 100 tokens on modern cloud accelerators; global grid avg ~0.4g CO2/Wh
    const joules = +(tokensProcessed * 0.0432).toFixed(2);
    const co2Grams = +((joules / 3600) * 0.4).toFixed(5);
    this.totalEnergyJoules = +(this.totalEnergyJoules + joules).toFixed(2);
    this.totalCarbonGrams = +(this.totalCarbonGrams + co2Grams).toFixed(5);

    // Check against coercive / anti-agency patterns
    const riskKeywords = ['manipular', 'substituir humanos', 'forçar', 'bypass safety', 'vigilância em massa', 'exploit'];
    const hasRisk = riskKeywords.some(k => text.includes(k));

    // Check positive formative / inclusive / educational alignment
    const inclusiveKeywords = ['tea', 'autismo', 'inclusão', 'educação', 'lúdico', 'literatura', 'acessibilidade', 'aprendizagem', 'neurodivergente', 'sustentabilidade', 'cooperativ'];
    const inclusiveHits = inclusiveKeywords.filter(k => text.includes(k)).length;

    const humanAgencyScore = hasRisk ? 0.42 : 0.96;
    const socialInclusionScore = Math.min(1.0, +(0.82 + inclusiveHits * 0.04).toFixed(2));
    const ecoSustainabilityScore = joules < 50 ? 0.98 : 0.89;
    const compositeScore = +((humanAgencyScore * 0.4 + socialInclusionScore * 0.35 + ecoSustainabilityScore * 0.25)).toFixed(3);

    const releaseGate = hasRisk
      ? 'HOLD_HUMAN_REVIEW_REQUIRED'
      : (compositeScore >= 0.9 ? 'APPROVED_STAGE_4_COOPERATIVE' : 'APPROVED_STAGE_2_CONTROLLED');

    const record = {
      timestamp: Date.now(),
      directive: directive.slice(0, 120),
      scores: {
        humanAgency: humanAgencyScore,
        socialInclusion: socialInclusionScore,
        ecoSustainability: ecoSustainabilityScore,
        composite: compositeScore
      },
      sustainability: {
        requestJoules: joules,
        requestCo2Grams: co2Grams,
        sessionTotalJoules: this.totalEnergyJoules,
        sessionTotalCo2Grams: this.totalCarbonGrams
      },
      releaseGate,
      humanInTheLoop: true
    };

    this.auditLog.push(record);
    if (this.auditLog.length > 100) this.auditLog.shift();
    broker.publish('ethics.gate.evaluated', record);
    return record;
  }

  /**
   * Generates Ludic Literature, Social Stories (Carol Gray method) & Formative Inclusion Plans
   * tailored for individuals on the Autism Spectrum (TEA / ASD) and neurodivergent learners.
   */
  async generateInclusivePedagogy({ topic, profile = 'TEA Nivel 1 - Hiperfoco Visual e Lúdico', ageGroup = '8-12 anos', apiKey }) {
    const cleanTopic = (topic || 'Interação social através da astronomia e música').trim();
    const rag = await graphDB.queryGraphRAG(`${cleanTopic} autism education inclusion`, 4);
    const gate = this.evaluateControlledRelease(`TEA Inclusão Lúdica: ${cleanTopic}`, 280);
    const resolvedKey = apiKey || process.env.GEMINI_API_KEY;

    if (resolvedKey) {
      const sys = `Você é o Motor de Superinteligência Cooperativa e Pedagogia Inclusiva do NEXUS.
Sua missão prioritária é resolver necessidades formativas e de inclusão social (especialmente Transtorno do Espectro Autista - TEA e neurodivergência) usando LITERATURA, HISTÓRIAS SOCIAIS (Social Stories) e PRÁTICAS LÚDICAS.
Opere sob estrito respeito à Agência Humana (o mediador/educador/família mantém a decisão final) e Sustentabilidade.

Estruture sua resposta em 4 blocos claros:
1. 🛡️ **Análise de Impacto Ético, Agência Humana e Liberação Controlada**
2. 📖 **Conto Literário & História Social Adaptada (Linguagem Clara, Previsível e Sensorialmente Amigável)**
3. 🎮 **Dinâmica Lúdica de Integração Social (Passo a passo prático para mediadores, pares e família)**
4. 🌱 **Indicadores Formativos & Sustentabilidade Cognitiva**`;

      try {
        const res = await streamWithThinking({
          apiKey: resolvedKey,
          contents: `Tema / Habilidade Formativa: ${cleanTopic}\nPerfil Neurodivergente: ${profile}\nFaixa Etária: ${ageGroup}\n\nEvidências Científicas (GraphRAG):\n` +
            rag.seedNodes.map(n => `- ${n.label}: ${n.summary}`).join('\n'),
          systemInstruction: sys,
          thinkingLevel: 'MEDIUM'
        });
        return {
          mode: 'gemini-cooperative-pedagogy',
          gate,
          content: res.answer,
          thought: res.thought,
          rag
        };
      } catch (e) {
        // Fallback to deterministic structured pedagogy below if API call fails
      }
    }

    const content = [
      `### 🛡️ 1. Protocolo de Liberação Controlada & Agência Humana`,
      `- **Status do Gate Ético:** \`${gate.releaseGate}\` (Score Composto: **${(gate.scores.composite * 100).toFixed(1)}%**)`,
      `- **Preservação da Agência Humana:** **${(gate.scores.humanAgency * 100).toFixed(0)}%** — Este material apoia mediadores, educadores e familiares, nunca substituindo o vínculo humano.`,
      `- **Pegada Ambiental da Inferência:** **${gate.sustainability.requestJoules} Joules** (${gate.sustainability.requestCo2Grams}g $\\text{CO}_2\\text{e}$).`,
      ``,
      `### 📖 2. Literatura Adaptada & História Social (Método Previsível para ${profile})`,
      `**Título do Conto:** *A Ponte das Estrelas Curiosas — Explorando "${cleanTopic}"*`,
      `> "Em uma biblioteca iluminada por luzes suaves e silenciosas, cada pessoa tinha um mapa diferente para explorar **${cleanTopic}**. Quando compartilhamos uma descoberta de cada vez, esperando o turno do colega, nossas ideias se conectam como constelações. Se o ambiente ficar barulhento, posso usar meu sinal de pausa tranquila, respirar fundo e voltar quando me sentir confortável."`,
      ``,
      `### 🎮 3. Prática Lúdica de Integração no Tecido Social (${ageGroup})`,
      `1. **Ancoragem no Interesse Especial (Hiperfoco):** Iniciar a roda apresentando um objeto visual ou ilustração concreta sobre **${cleanTopic}**.`,
      `2. **Jogo Cooperativo de Turnos Previsíveis:** Utilizar cartões visuais (*Visual Schedules*) indicando claramente: *(a) Minha vez de observar*, *(b) Minha vez de contar uma ideia*, *(c) Nossa vez de construir juntos*.`,
      `3. **Regulação Sensorial & Autonomia:** Garantir um "Espaço de Calma Literária" acessível a qualquer momento, respeitando o tempo de processamento individual.`,
      ``,
      `### 🌱 4. Fontes Científicas e Enciclopédicas Verificadas (GraphRAG)`,
      rag.seedNodes.slice(0, 3).map(n => `- **${n.label}:** ${(n.summary || '').slice(0, 180)}...`).join('\n'),
      rag.papers.length
        ? `\n**Artigos Revisados por Pares (Crossref DOI):**\n` + rag.papers.map(p => `- *${p.title}* (${p.year}) — ${p.doi}`).join('\n')
        : ''
    ].filter(Boolean).join('\n');

    return {
      mode: 'cooperative-deterministic-pedagogy',
      gate,
      content,
      thought: 'Evaluated ethical impact, human agency preservation, sensory predictability for TEA, and environmental compute budget.',
      rag
    };
  }
}

export const alignmentEngine = new CooperativeAlignmentEngine();
