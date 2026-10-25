// Live metrics, sparklines and gauges
const Metrics = (function () {
  let load = 30, hist = {};
  const keys = ['tokens', 'params', 'depth', 'conf', 'agents', 'entropy'];
  keys.forEach(k => hist[k] = Array(30).fill(0));

  function spark(id, arr) {
    const c = document.getElementById(id), x = c.getContext('2d'), mx = Math.max(...arr, 1);
    x.clearRect(0, 0, c.width, c.height);
    const g = x.createLinearGradient(0, 0, c.width, 0);
    g.addColorStop(0, '#00f5ff'); g.addColorStop(1, '#a855f7');
    x.strokeStyle = g; x.lineWidth = 2; x.beginPath();
    arr.forEach((v, i) => { const px = i * c.width / (arr.length - 1), py = c.height - 4 - v / mx * (c.height - 8);
      i ? x.lineTo(px, py) : x.moveTo(px, py); });
    x.stroke();
  }
  function gauge(id, frac) {
    const c = document.getElementById(id), x = c.getContext('2d');
    x.clearRect(0, 0, 200, 200); x.lineWidth = 12; x.lineCap = 'round';
    x.strokeStyle = 'rgba(148,163,184,.12)';
    x.beginPath(); x.arc(100, 100, 80, .75 * Math.PI, 2.25 * Math.PI); x.stroke();
    const g = x.createLinearGradient(0, 0, 200, 200);
    g.addColorStop(0, '#00f5ff'); g.addColorStop(1, '#a855f7');
    x.strokeStyle = g; x.shadowColor = '#00f5ff'; x.shadowBlur = 12;
    x.beginPath(); x.arc(100, 100, 80, .75 * Math.PI, (.75 + 1.5 * frac) * Math.PI); x.stroke();
    x.shadowBlur = 0;
  }
  function update() {
    load += (35 - load) * .05 + (Math.random() - .5) * 6;
    load = Math.max(5, Math.min(99, load));
    const vals = {
      tokens: Math.round(load * 120 + Math.random() * 300),
      params: 847, depth: Math.round(load / 6 + Math.random() * 3),
      conf: Math.round(88 + Math.random() * 10), agents: Math.round(load * 40),
      entropy: +(1.5 + Math.random()).toFixed(2)
    };
    keys.forEach(k => { hist[k].push(k === 'params' ? 840 + Math.random() * 14 : vals[k]); hist[k].shift(); });
    const set = (id, v) => document.getElementById(id).textContent = v;
    set('m-tokens', vals.tokens.toLocaleString()); set('m-depth', vals.depth);
    set('m-confidence', vals.conf + '%'); set('m-agents-active', vals.agents.toLocaleString());
    set('m-entropy', vals.entropy);
    spark('spark-tokens', hist.tokens); spark('spark-params', hist.params); spark('spark-depth', hist.depth);
    spark('spark-conf', hist.conf); spark('spark-agents', hist.agents); spark('spark-entropy', hist.entropy);
    gauge('gauge-load', load / 100); set('gauge-load-val', Math.round(load) + '%');
    const iq = 180 + Math.round(load); gauge('gauge-iq', iq / 300); set('gauge-iq-val', iq);
    const kn = 72 + load / 10; gauge('gauge-knowledge', kn / 100); set('gauge-knowledge-val', kn.toFixed(1) + '%');
  }
  function boost() { load = Math.min(99, load + 45); }
  function init() { update(); setInterval(update, 1000); }
  return { init, boost };
})();
