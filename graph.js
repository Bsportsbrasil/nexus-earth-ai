// Force-directed knowledge graph (SVG, no deps)
const Graph = (function () {
  const colors = { Technology: '#00f5ff', Science: '#a855f7', Philosophy: '#f59e0b', Society: '#10b981', Ethics: '#f43f5e' };
  const data = [
    ['Artificial Intelligence', 'Technology', 'Systems that perform tasks requiring intelligence.'],
    ['Neural Networks', 'Technology', 'Layered function approximators inspired by the brain.'],
    ['Quantum Computing', 'Technology', 'Computation using superposition and entanglement.'],
    ['Robotics', 'Technology', 'Embodied machines that sense and act.'],
    ['Neuroscience', 'Science', 'Study of the nervous system and cognition.'],
    ['Physics', 'Science', 'The fundamental laws of matter and energy.'],
    ['Genomics', 'Science', 'Study of complete sets of DNA.'],
    ['Mathematics', 'Science', 'The language of structure and pattern.'],
    ['Consciousness', 'Philosophy', 'Subjective experience — the hard problem.'],
    ['Epistemology', 'Philosophy', 'Theory of knowledge and justified belief.'],
    ['Economy', 'Society', 'Production and distribution of resources.'],
    ['Education', 'Society', 'Transmission of knowledge and skills.'],
    ['Healthcare', 'Society', 'Maintenance and improvement of health.'],
    ['AI Alignment', 'Ethics', 'Ensuring AI goals match human values.'],
    ['Privacy', 'Ethics', 'Control over personal information.'],
    ['Fairness', 'Ethics', 'Absence of unjust bias in decisions.']
  ];
  const links = [[0,1],[0,2],[0,3],[0,13],[1,4],[1,7],[2,5],[2,7],[3,0],[4,8],[8,9],[0,9],[0,10],[0,11],[0,12],[6,12],[6,0],[13,15],[13,14],[14,10],[15,10],[11,9],[5,7]];
  let nodes, svg, g, scale = 1, tx = 0, ty = 0, W, H, drag = null;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };

  function init() {
    svg = document.getElementById('knowledge-graph');
    const r = svg.getBoundingClientRect(); W = r.width || 800; H = r.height || 520;
    nodes = data.map(([name, cat, desc], i) => ({ name, cat, desc, i,
      x: W / 2 + Math.cos(i) * 150, y: H / 2 + Math.sin(i) * 150, vx: 0, vy: 0 }));
    g = el('g'); svg.appendChild(g);
    links.forEach(l => { l.el = el('line', { stroke: 'rgba(148,163,184,.2)', 'stroke-width': 1 }); g.appendChild(l.el); });
    nodes.forEach(n => {
      n.g = el('g', { style: 'cursor:pointer' });
      n.c = el('circle', { r: n.i === 0 ? 16 : 10, fill: colors[n.cat], 'fill-opacity': .85, stroke: '#020408', 'stroke-width': 2 });
      n.c.style.filter = `drop-shadow(0 0 6px ${colors[n.cat]})`;
      n.t = el('text', { fill: '#cbd5e1', 'font-size': 11, 'text-anchor': 'middle', dy: -16, 'font-family': 'Inter' });
      n.t.textContent = n.name;
      n.g.append(n.c, n.t); g.appendChild(n.g);
      n.g.addEventListener('mousedown', e => { drag = n; e.stopPropagation(); });
      n.g.addEventListener('click', () => select(n));
    });
    let pan = null;
    svg.addEventListener('mousedown', e => pan = [e.clientX - tx, e.clientY - ty]);
    addEventListener('mousemove', e => {
      const r = svg.getBoundingClientRect();
      if (drag) { drag.x = (e.clientX - r.left - tx) / scale; drag.y = (e.clientY - r.top - ty) / scale; drag.vx = drag.vy = 0; }
      else if (pan) { tx = e.clientX - pan[0]; ty = e.clientY - pan[1]; }
    });
    addEventListener('mouseup', () => { drag = null; pan = null; });
    svg.addEventListener('wheel', e => { e.preventDefault(); scale = Math.min(3, Math.max(.4, scale * (e.deltaY < 0 ? 1.1 : .9))); }, { passive: false });
    document.getElementById('zoom-in').onclick = () => scale = Math.min(3, scale * 1.2);
    document.getElementById('zoom-out').onclick = () => scale = Math.max(.4, scale / 1.2);
    document.getElementById('zoom-reset').onclick = () => { scale = 1; tx = ty = 0; };
    document.getElementById('graph-search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      nodes.forEach(n => n.g.style.opacity = !q || n.name.toLowerCase().includes(q) ? 1 : .15);
    });
    tick();
  }
  function select(n) {
    const rel = links.filter(l => l[0] === n.i || l[1] === n.i).map(l => nodes[l[0] === n.i ? l[1] : l[0]].name);
    document.getElementById('node-info-content').innerHTML =
      `<div class="node-info-title">${n.name}</div><div class="node-info-category">${n.cat.toUpperCase()}</div>
       <p>${n.desc}</p><p style="margin-top:.5rem"><strong>Connected:</strong> ${rel.join(', ')}</p>`;
    links.forEach(l => l.el.setAttribute('stroke', l[0] === n.i || l[1] === n.i ? colors[n.cat] : 'rgba(148,163,184,.2)'));
  }
  function tick() {
    for (const a of nodes) for (const b of nodes) if (a !== b) {
      const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + .01, f = 1800 / d2;
      a.vx += dx * f / Math.sqrt(d2); a.vy += dy * f / Math.sqrt(d2);
    }
    for (const [i, j] of links) {
      const a = nodes[i], b = nodes[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), f = (d - 110) * .01;
      a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
    }
    for (const n of nodes) {
      n.vx += (W / 2 - n.x) * .002; n.vy += (H / 2 - n.y) * .002;
      if (n !== drag) { n.x += n.vx; n.y += n.vy; }
      n.vx *= .85; n.vy *= .85;
      n.g.setAttribute('transform', `translate(${n.x},${n.y})`);
    }
    links.forEach(l => { const a = nodes[l[0]], b = nodes[l[1]];
      l.el.setAttribute('x1', a.x); l.el.setAttribute('y1', a.y); l.el.setAttribute('x2', b.x); l.el.setAttribute('y2', b.y); });
    g.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`);
    requestAnimationFrame(tick);
  }
  return { init };
})();
