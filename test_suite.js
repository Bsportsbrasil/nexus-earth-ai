import assert from 'node:assert/strict';
import { broker } from './engine/broker.js';
import { graphDB } from './engine/graph_db.js';
import { tensorEngine } from './engine/tensor.js';
import { telemetry } from './engine/telemetry.js';
import { executeAgentDAG } from './engine/agents_dag.js';

async function runTests() {
  console.log('=== NEXUS Enterprise Engine Verification Suite ===');

  // 1. Test MessageBroker Pub/Sub
  let received = null;
  const unsub = broker.subscribe('test.topic', (msg) => { received = msg; });
  broker.publish('test.topic', { hello: 'silicon_valley' });
  unsub();
  assert.ok(received && received.payload.hello === 'silicon_valley', 'MessageBroker failed');
  console.log('✓ Layer 2a: MessageBroker Pub/Sub verified');

  // 2. Test GraphDB & Vector Cosine Similarity GraphRAG
  graphDB.upsertNode({
    id: 'Transformer (deep learning)',
    label: 'Transformer (deep learning)',
    category: 'Root',
    summary: 'A Transformer is a deep learning architecture based on the multi-head self-attention mechanism.',
    url: 'https://en.wikipedia.org/wiki/Transformer_(deep_learning)'
  });
  graphDB.upsertNode({
    id: 'Self-attention',
    label: 'Self-attention',
    category: 'Linked',
    summary: 'Attention mechanism relating different positions of a single sequence.'
  });
  graphDB.upsertEdge('Transformer (deep learning)', 'Self-attention', 'USES_MECHANISM', 0.98);

  const rag = await graphDB.queryGraphRAG('Transformer attention mechanism', 3);
  assert.ok(rag.seedNodes.length >= 1, 'GraphRAG vector search returned no seed nodes');
  assert.ok(rag.subgraph.edges.length >= 1, 'GraphRAG 1-hop subgraph traversal returned no edges');
  console.log(`✓ Layer 3: Persistent GraphDB + Vector GraphRAG verified (${rag.totalIndexedNodes} nodes, ${rag.totalIndexedEdges} edges)`);

  // 3. Test Real Tensor Forward & Backward Propagation Engine
  const tState = tensorEngine.forwardAndStep('Transformer self-attention input');
  assert.equal(tState.activations.length, tState.layers, 'Tensor layer count mismatch');
  assert.ok(tState.telemetry.shannonEntropy > 0, 'Shannon entropy should be positive');
  assert.ok(tState.telemetry.gradNorm >= 0, 'Gradient norm should be non-negative');
  console.log(`✓ Layer 4a: Tensor Forward/Backward Engine verified (H=${tState.telemetry.shannonEntropy} bits, ||grad||=${tState.telemetry.gradNorm})`);

  // 4. Test OS/Hardware & Prometheus Telemetry
  telemetry.recordTokens(128, true);
  const snap = telemetry.getSnapshot({ totalNodes: graphDB.nodes.size, totalEdges: graphDB.edges.length }, broker.getStats());
  assert.ok(snap.cpu.cores >= 1, 'CPU cores not detected');
  assert.ok(snap.memory.ramTotalGB > 0, 'RAM total not detected');
  const prom = telemetry.toPrometheusText({ totalNodes: graphDB.nodes.size }, broker.getStats());
  assert.ok(prom.includes('nexus_cpu_utilization_percent'), 'Prometheus metrics missing CPU gauge');
  console.log(`✓ Layer 4b: Host OS & Prometheus Telemetry verified (${snap.cpu.cores} cores, ${snap.memory.ramUsedGB}/${snap.memory.ramTotalGB} GB RAM)`);

  // 5. Test Orchestrated Multi-Agent DAG Execution
  const events = [];
  const dagRes = await executeAgentDAG({
    query: 'Transformer attention mechanism',
    apiKey: '',
    emitWs: (ev) => events.push(ev)
  });
  assert.ok(dagRes.agentOutputs.planner && dagRes.agentOutputs.critic && dagRes.agentOutputs.executor && dagRes.agentOutputs.verifier, 'DAG missing agent outputs');
  assert.ok(dagRes.consensus.length > 10, 'DAG consensus empty');
  assert.ok(events.length > 4, 'DAG did not stream events');
  console.log(`✓ Layer 2b: Multi-Agent DAG Orchestrator verified (${events.length} real-time stream events emitted)`);

  console.log('=== ALL 5 ARCHITECTURAL LAYERS PASSED 100% ===');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
