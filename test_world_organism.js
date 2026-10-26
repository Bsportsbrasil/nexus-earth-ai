import { worldLearnerOrganism } from './engine/world_learner_organism.js';
import assert from 'node:assert';

console.log('Testing WorldLearnerOrganism Engine & Creator Governance...');

// 1. Initial State & Seed
const dash1 = worldLearnerOrganism.getDashboard();
assert.ok(dash1.hypotheses.length >= 2, 'Default hypotheses seed missing');
assert.ok(dash1.observations.length >= 2, 'Default observations seed missing');
assert.ok(dash1.creations.length >= 1, 'Default creations seed missing');
console.log('✓ Initial organism dashboard state verified with seed items');

// 2. Ingest Multimodal Signal
const obs = worldLearnerOrganism.observeMultimodalSignal({
  modality: 'multimodal_audio_text',
  source: 'Entrada de Campo Real',
  rawContent: 'Usuário expressou necessidade de simplificação no painel executivo com voz calma.',
  detectedPattern: 'Prevalência de clareza visual e redução de cliques intermediários para tomada de decisão.',
  latentCorrelation: 'Interfaces com menos camadas aumentam velocidade de ação em 40%.'
});
assert.ok(obs && obs.id, 'Failed to observe multimodal signal');
console.log('✓ Multimodal signal observed & latent pattern extracted:', obs.id);

// 3. Formulate Hypothesis
const hyp = worldLearnerOrganism.formulateHypothesis({
  title: 'Hipótese de Fluidez Operacional 1-Clique',
  premise: 'Disponibilizar botões diretos de edição e exclusão na raiz da interface anula o tempo de latência de intervenção humana.',
  domain: 'Ergonomia de Governança',
  observationIds: [obs.id],
  rationale: 'A remoção de fricção burocrática devolve o controle efetivo ao administrador.'
});
assert.ok(hyp && hyp.id, 'Failed to formulate hypothesis');
console.log('✓ Epistemic hypothesis formulated:', hyp.id);

// 4. Simulate Future Consequences
const sim = worldLearnerOrganism.simulateFutureConsequences(hyp.id, {
  scenarioName: 'Implementação de Ações Imediatas na Mesa C2',
  immediateOutcome1st: 'Resolução instantânea de anomalias sem necessidade de abrir terminais.',
  systemicRipple2nd: 'Aumento da segurança psicológica do operador e zero drift silencioso.',
  societalImpact3rd: 'Modelo exemplar de governança centrado na soberania da administradora.'
});
assert.ok(sim && sim.id, 'Failed to simulate future consequences');
assert.ok(sim.riskIndex < 0.2, 'Risk index calculation invalid');
console.log('✓ Future consequences simulated (1st, 2nd, 3rd order):', sim.projectedGain);

// 5. Synthesize Creation
const creat = worldLearnerOrganism.synthesizeCreation({
  hypothesisId: hyp.id,
  type: 'estrategia_operacional',
  title: 'Mesa de Ações Diretas da Administradora',
  summary: 'Painel visual com controle de edição e exclusão em tempo real de cada elemento cognitivo.',
  deliverables: ['Modal de Edição Instantânea', 'Purge com 1 Clique', 'Log Imutável de Governança']
});
assert.ok(creat && creat.id, 'Failed to synthesize creation');
console.log('✓ Bespoke creation synthesized:', creat.id);

// 6. Direct Creator Edit
const updatedHyp = worldLearnerOrganism.updateHypothesis(hyp.id, {
  title: 'Hipótese de Fluidez Operacional 1-Clique (Refinada pela Administradora)'
});
assert.strictEqual(updatedHyp.title, 'Hipótese de Fluidez Operacional 1-Clique (Refinada pela Administradora)');
assert.strictEqual(updatedHyp.modifiedByCreator, true);
console.log('✓ Creator direct hypothesis editing verified');

// 7. Outcome Learning
const learnRes = worldLearnerOrganism.recordOutcomeLearning({
  creationId: creat.id,
  feedback: 'Implementado com 100% de sucesso em produção.',
  realWorldResult: 'Zero erros e aprovação imediata.',
  validatedByCreator: true
});
assert.ok(learnRes.success, 'Failed to learn from outcome');
console.log('✓ Organism continuous learning from real world verified');

// 8. Direct Creator Deletion
const delRes = worldLearnerOrganism.deleteHypothesis(hyp.id);
assert.strictEqual(delRes.success, true);
assert.strictEqual(delRes.deletedId, hyp.id);
console.log('✓ Creator direct hypothesis deletion verified');

console.log('ALL WORLD LEARNER ORGANISM TESTS PASSED 100%!');
