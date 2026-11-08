import { swarm100Engine } from '../engine/swarm_100_engine.js';

const state = swarm100Engine.getSwarmState();
const sectors = {};
state.agents.forEach(a => {
  sectors[a.sector] = (sectors[a.sector] || 0) + 1;
});
console.log('Total agents:', state.agents.length);
console.log('Sectors breakdown:', JSON.stringify(sectors, null, 2));

const agents1to10 = state.agents.slice(0, 10).map(a => ({ id: a.id, name: a.name, sector: a.sector, role: a.role, stage: a.projectProgress ? a.projectProgress.stage : null }));
console.log('Agents 1-10:', JSON.stringify(agents1to10, null, 2));


