// Live neural network visualization + hero preview
const NeuralViz = (function () {
  const themes = {
    cyan: ['#00f5ff', '#0ea5e9'], violet: ['#a855f7', '#ec4899'],
    aurora: ['#10b981', '#00f5ff'], fire: ['#f59e0b', '#f43f5e']
  };
  const cfg = { layers: 7, neurons: 6, speed: 5, theme: 'cyan' };
  const canvas = document.getElementById('neural-canvas');
  const ctx = canvas.getContext('2d');
  let nodes = [], edges = [], pulses = [];

  function build() {
    const W = canvas.width, H = canvas.height;
    nodes = []; edges = [];
    for (let l = 0; l < cfg.layers; l++) {
      const n = (l === 0 || l === cfg.layers - 1) ? Math.max(3, cfg.neurons - 2) : cfg.neurons;
      const layer = [];
      for (let i = 0; i < n; i++) {
        layer.push({ x: 60 + l * (W - 120) / (cfg.layers - 1), y: (i + 1) * H / (n + 1), a: Math.random() });
      }
      nodes.push(layer);
    }
    for (let l = 0; l < nodes.length - 1; l++)
      for (const a of nodes[l]) for (const b of nodes[l + 1])
        edges.push({ a, b, w: Math.random() * 2 - 1, l });
  }
  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    canvas.width = r.width; canvas.height = Math.max(480, r.height);
    build();
  }
  function inject() {
    for (const n of nodes[0]) spawnFrom(n, 0);
  }
  function spawnFrom(node, l) {
    if (l >= nodes.length - 1) return;
    edges.filter(e => e.a === node && Math.random() < .5)
      .forEach(e => pulses.push({ e, t: 0 }));
  }
  function frame() {
    const [c1, c2] = themes[cfg.theme];
    ctx.fillStyle = 'rgba(2,4,8,.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const e of edges) {
      ctx.strokeStyle = e.w > 0 ? c1 + '22' : c2 + '22';
      ctx.lineWidth = Math.abs(e.w);
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    }
    const sp = cfg.speed * .004;
    pulses = pulses.filter(p => {
      p.t += sp;
      const x = p.e.a.x + (p.e.b.x - p.e.a.x) * p.t, y = p.e.a.y + (p.e.b.y - p.e.a.y) * p.t;
      ctx.fillStyle = c1; ctx.shadowColor = c1; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      if (p.t >= 1) { p.e.b.a = 1; spawnFrom(p.e.b, p.e.l + 1); return false; }
      return true;
    });
    for (const layer of nodes) for (const n of layer) {
      n.a *= .97;
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 18);
      g.addColorStop(0, c1 + Math.floor(40 + n.a * 200).toString(16).padStart(2, '0'));
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, 18, 0, 7); ctx.fill();
      ctx.fillStyle = '#0a0f1a'; ctx.strokeStyle = c2; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(n.x, n.y, 6, 0, 7); ctx.fill(); ctx.stroke();
    }
    if (Math.random() < .03 * cfg.speed / 5) spawnFrom(nodes[0][Math.floor(Math.random() * nodes[0].length)], 0);
    requestAnimationFrame(frame);
  }
  function bindControls() {
    ['layers', 'neurons', 'speed'].forEach(k => {
      const el = document.getElementById('nn-' + k);
      el.addEventListener('input', () => {
        cfg[k] = +el.value;
        document.getElementById(`nn-${k}-val`).textContent = el.value;
        if (k !== 'speed') build();
      });
    });
    document.getElementById('nn-theme').addEventListener('change', e => cfg.theme = e.target.value);
    document.getElementById('nn-inject-btn').addEventListener('click', inject);
    setInterval(() => {
      document.getElementById('nn-activation').textContent = (0.6 + Math.random() * .3).toFixed(2);
      document.getElementById('nn-firing').textContent = Math.floor(300 + pulses.length * 4) + ' Hz';
      document.getElementById('nn-entropy').textContent = (2 + Math.random() * .8).toFixed(2);
      document.getElementById('nn-grad').textContent = (Math.random() * .02).toFixed(3);
    }, 800);
  }

  // Hero: rotating 3D neural sphere
  function hero() {
    const hc = document.getElementById('hero-neural-preview'), h = hc.getContext('2d');
    const pts = Array.from({ length: 160 }, (_, i) => {
      const phi = Math.acos(1 - 2 * (i + .5) / 160), th = Math.PI * (1 + 5 ** .5) * i;
      return [Math.cos(th) * Math.sin(phi), Math.sin(th) * Math.sin(phi), Math.cos(phi)];
    });
    let ang = 0;
    (function loop() {
      ang += .004;
      h.clearRect(0, 0, 520, 520);
      const proj = pts.map(([x, y, z]) => {
        const X = x * Math.cos(ang) - z * Math.sin(ang), Z = x * Math.sin(ang) + z * Math.cos(ang);
        const Y = y * Math.cos(ang * .6) - Z * Math.sin(ang * .6), Z2 = y * Math.sin(ang * .6) + Z * Math.cos(ang * .6);
        return [260 + X * 180, 260 + Y * 180, Z2];
      });
      for (let i = 0; i < proj.length; i++) for (let j = i + 1; j < proj.length; j++) {
        const d = Math.hypot(proj[i][0] - proj[j][0], proj[i][1] - proj[j][1]);
        if (d < 48) {
          h.strokeStyle = `rgba(0,245,255,${(1 - d / 48) * .25 * ((proj[i][2] + 1.5) / 2.5)})`;
          h.beginPath(); h.moveTo(proj[i][0], proj[i][1]); h.lineTo(proj[j][0], proj[j][1]); h.stroke();
        }
      }
      for (const [x, y, z] of proj) {
        h.fillStyle = z > 0 ? '#00f5ff' : '#a855f7';
        h.globalAlpha = .4 + (z + 1) * .3;
        h.beginPath(); h.arc(x, y, 1.5 + (z + 1), 0, 7); h.fill();
      }
      h.globalAlpha = 1;
      requestAnimationFrame(loop);
    })();
  }

  function init() { resize(); bindControls(); frame(); hero(); addEventListener('resize', resize); }
  return { init };
})();
