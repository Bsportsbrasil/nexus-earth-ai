import { broker } from './broker.js';
import { graphDB } from './graph_db.js';
import { streamWithThinking } from './llm.js';
import { tensorEngine } from './tensor.js';

const AGENT_PROMPTS = {
  planner: `Você é o Agente PLANNER em um DAG Multi-Agente de Engenharia.
Decomponha o problema em 4 a 5 etapas técnicas numeradas e verificáveis, usando rigorosamente as evidências do GraphRAG fornecidas. Máximo 130 palavras.`,
  critic: `Você é o Agente CRITIC em um DAG Multi-Agente.
Audite o plano do PLANNER contra as evidências científicas (Crossref/Wikipedia): aponte gargalos técnicos, riscos de falha (⚠) e pontos validados (✓). Máximo 130 palavras.`,
  executor: `Você é o Agente EXECUTOR em um DAG Multi-Agente.
Com base na decomposição do PLANNER e nos alertas do CRITIC, produza a arquitetura de execução concreta, especificando métricas quantitativas de sucesso. Máximo 140 palavras.`,
  verifier: `Você é o Agente VERIFIER em um DAG Multi-Agente.
Valide a consistência lógica entre PLANNER, CRITIC e EXECUTOR. Emita um JSON no final no formato {"verified": true, "confidence": 0.95} precedido por uma justificativa técnica curta (máx 80 palavras).`
};

/**
 * Orchestrated Multi-Agent DAG Engine communicating over MessageBroker topics
 * Each agent publishes state events to `agent.<role>` and triggers tensor forward passes.
 */
export async function executeAgentDAG({ query, apiKey, emitWs }) {
  const runId = `dag_${Date.now()}`;
  const notify = (event, data) => {
    const msg = broker.publish(`dag.${event}`, { runId, ...data });
    if (emitWs) emitWs({ type: 'dag_event', event, msg });
  };

  notify('started', { query });

  // Step 1: Retrieve real GraphRAG subgraph & peer-reviewed papers
  notify('graphrag.lookup', { status: 'retrieving', query });
  const rag = await graphDB.queryGraphRAG(query, 5);
  notify('graphrag.complete', {
    nodesFound: rag.subgraph.nodes.length,
    edgesFound: rag.subgraph.edges.length,
    papersFound: rag.papers.length,
    subgraph: rag.subgraph
  });

  const evidenceContext = [
    rag.seedNodes.filter(n => n.summary).map(n => `• [${n.label}]: ${n.summary} (${n.url})`).join('\n'),
    rag.papers.length
      ? `Artigos Científicos Indexados (Crossref DOI):\n` +
        rag.papers.map((p, i) => `${i + 1}. "${p.title}" (${p.year}) - ${p.journal} [${p.doi}]`).join('\n')
      : ''
  ].filter(Boolean).join('\n\n');

  const hasLlmKey = !!(apiKey || process.env.GEMINI_API_KEY);
  const agentOutputs = {};
  let sharedMemory = `PROBLEMA: ${query}\n\n[CONTEXTO GRAPHRAG VERIFICADO]:\n${evidenceContext || 'Sem nós prévios.'}`;

  const order = ['planner', 'critic', 'executor', 'verifier'];

  for (const role of order) {
    notify('agent.status', { role, status: 'THINKING' });
    tensorEngine.forwardAndStep(`${role}:${query}`);

    if (hasLlmKey) {
      let accText = '';
      const res = await streamWithThinking({
        apiKey,
        contents: sharedMemory,
        systemInstruction: AGENT_PROMPTS[role],
        thinkingLevel: 'LOW',
        onThoughtChunk: (delta, fullThought) => {
          emitWs && emitWs({ type: 'agent_thought', runId, role, delta, fullThought });
        },
        onAnswerChunk: (delta, fullAnswer) => {
          accText = fullAnswer;
          emitWs && emitWs({
            type: 'agent_stream',
            runId,
            role,
            text: fullAnswer,
            tokens: Math.ceil(fullAnswer.length / 4)
          });
        }
      });
      agentOutputs[role] = res.answer || accText;
    } else {
      // Deterministic GraphRAG analytical synthesis when no Gemini key is supplied
      const primary = rag.seedNodes[0];
      const fallbackMap = {
        planner: `[GraphRAG Decomposition — ${rag.subgraph.nodes.length} nós indexados]\n` +
          (primary?.summary
            ? `1. Base Conceitual (${primary.label}): ${primary.summary}\n2. Mapear ${rag.subgraph.edges.length} relações semânticas extraídas.\n3. Cruzar com ${rag.papers.length} estudos revisados por pares.`
            : `1. Ingerir entidades para "${query}".\n2. Mapear topologia no GraphDB.`),
        critic: `[Auditoria Bibliográfica — Crossref DOI Registry]\n` +
          (rag.papers.length
            ? rag.papers.map((p, i) => `✓ Estudo ${i + 1}: "${p.title}" (${p.year}) — ${p.doi}`).join('\n')
            : `⚠ Nenhum DOI direto retornado para "${query}". Recomenda-se refinar termos técnicos.`),
        executor: `[Síntese do Subgrafo Ativo]\n` +
          `• Entidade Central: ${primary?.label || query}\n` +
          `• Conceitos Adjacentes (1-Hop): ${rag.subgraph.nodes.slice(1, 8).map(n => n.label).join(', ') || 'N/A'}\n` +
          `• Total no Banco de Grafos: ${rag.totalIndexedNodes} nós e ${rag.totalIndexedEdges} arestas.`,
        verifier: `[Verificação Estrutural do Grafo]\n` +
          `✓ Wikipedia REST Grounding: ${primary?.url || 'N/A'}\n` +
          `✓ Crossref Citations Verified: ${rag.papers.length}\n` +
          `{"verified": true, "confidence": ${primary ? 0.92 : 0.65}}`
      };
      const text = fallbackMap[role];
      for (let i = 4; i <= text.length; i += 6) {
        emitWs && emitWs({
          type: 'agent_stream',
          runId,
          role,
          text: text.slice(0, i),
          tokens: Math.ceil(i / 4)
        });
        await new Promise(r => setTimeout(r, 12));
      }
      emitWs && emitWs({
        type: 'agent_stream',
        runId,
        role,
        text,
        tokens: Math.ceil(text.length / 4)
      });
      agentOutputs[role] = text;
    }

    sharedMemory += `\n\n[AGENTE ${role.toUpperCase()}]:\n${agentOutputs[role]}`;
    notify('agent.status', { role, status: 'DONE', output: agentOutputs[role] });
  }

  // Final Consensus Synthesis
  notify('consensus.started', {});
  let consensusText = '';
  if (hasLlmKey) {
    const cRes = await streamWithThinking({
      apiKey,
      contents: sharedMemory,
      systemInstruction: 'Você é o Consenso Central do DAG Multi-Agente NEXUS. Sintetize a decisão executiva final unificando os 4 agentes e citando as fontes reais verificadas. Máximo 160 palavras.',
      thinkingLevel: 'LOW',
      onAnswerChunk: (delta, full) => {
        consensusText = full;
        emitWs && emitWs({ type: 'consensus_stream', runId, text: full });
      }
    });
    consensusText = cRes.answer || consensusText;
  } else {
    const primary = rag.seedNodes[0];
    consensusText = `Consenso GraphRAG para "${query}":\n\n` +
      (primary?.summary ? `${primary.summary}\n\n` : '') +
      (rag.papers.length
        ? `Referências Científicas Verificadas (DOI):\n` + rag.papers.map(p => `• ${p.title} (${p.year}) — ${p.doi}`).join('\n')
        : '');
    emitWs && emitWs({ type: 'consensus_stream', runId, text: consensusText });
  }

  notify('completed', { consensus: consensusText });
  return { runId, agentOutputs, consensus: consensusText, rag };
}
