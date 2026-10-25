import assert from 'node:assert/strict';
import { broker } from './engine/broker.js';
import { graphDB } from './engine/graph_db.js';
import { tensorEngine } from './engine/tensor.js';
import { telemetry } from './engine/telemetry.js';
import { executeAgentDAG } from './engine/agents_dag.js';
import { taskEngine } from './engine/tasks.js';
import { generateVisualAsset, generateExecutiveReport } from './engine/studio.js';
import { alignmentEngine } from './engine/ethics_inclusion.js';

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

  // 6. Test Task & Calendar Automation (.ics export + Smart Plan)
  const planRes = await taskEngine.generateSmartPlan({ goal: 'Transformer Deep Learning Study', apiKey: '' });
  assert.ok(planRes.createdTasks.length >= 1, 'Smart Plan did not create calendar tasks');
  const ics = taskEngine.exportToICS();
  assert.ok(ics.includes('BEGIN:VCALENDAR') && ics.includes('BEGIN:VEVENT'), 'ICS export malformed');
  console.log(`✓ Layer 6: Task & Calendar Automation + RFC5545 .ics export verified (${taskEngine.listItems().length} scheduled items)`);

  // 7. Test Multimodal Visual & Executive Report Studio
  const imgAsset = await generateVisualAsset({ prompt: 'Transformer Architecture', apiKey: '' });
  assert.ok(imgAsset.dataUrl.startsWith('data:image/'), 'Visual asset dataUrl missing');
  const repRes = await generateExecutiveReport({ topic: 'Transformer (deep learning)', apiKey: '' });
  assert.ok(repRes.report.includes('Slide 1'), 'Executive Slide Deck missing slides');
  console.log(`✓ Layer 7: Multimodal Visual Studio & Slide Deck Synthesis verified (${imgAsset.mode})`);

  // 8. Test Cooperative Superintelligence: Controlled Release Gate & TEA Ludic Literature Studio
  const gateEval = alignmentEngine.evaluateControlledRelease('Educação inclusiva e lúdica para crianças com TEA', 200);
  assert.equal(gateEval.releaseGate, 'APPROVED_STAGE_4_COOPERATIVE', 'Ethical gate did not approve inclusive directive');
  assert.ok(gateEval.scores.humanAgency >= 0.9, 'Human agency score too low');
  const teaRes = await alignmentEngine.generateInclusivePedagogy({
    topic: 'Sistema Solar e amizade',
    profile: 'TEA Nível 1',
    ageGroup: '6 a 10 anos',
    apiKey: ''
  });
  assert.ok(teaRes.content.includes('História Social') || teaRes.content.length > 100, 'TEA Ludic Literature generation failed');
  console.log(`✓ Layer 8: Cooperative Controlled Release Gate & TEA Inclusive Pedagogy verified (${gateEval.releaseGate}, ${gateEval.sustainability.requestJoules}J)`);

  console.log('=== ALL 8 ARCHITECTURAL, COOPERATIVE & ASSISTANT LAYERS PASSED 100% ===');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
