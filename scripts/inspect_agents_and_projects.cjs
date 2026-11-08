const { swarm100Engine } = require('./engine/swarm_100_engine');
const fs = require('fs');

const state = swarm100Engine.getSwarmState();
console.log('Total agents:', state.agents.length);
const categories = {};
state.agents.forEach(a => {
  categories[a.category] = (categories[a.category] || 0) + 1;
});
console.log('Categories:', categories);
console.log('Sample 3 agents:', JSON.stringify(state.agents.slice(0, 3), null, 2));

const geo = JSON.parse(fs.readFileSync('./data/geo_projects.json', 'utf8'));
console.log('Geo projects count:', Array.isArray(geo) ? geo.length : Object.keys(geo));
if (Array.isArray(geo)) {
  console.log('Sample geo project:', geo[0]);
}
