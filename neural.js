// Real mathematical Multi-Layer Perceptron (MLP) forward propagation + telemetry
const NeuralViz = (function () {
  const themes = {
    cyan: ['#00f5ff', '#0ea5e9'], violet: ['#a855f7', '#ec4899'],
    aurora: ['#10b981', '#00f5ff'], fire: ['#f59e0b', '#f43f5e']
  };
  const cfg = { layers: 7, neurons: 6, speed: 5, theme: 'cyan' };
  const canvas = document.getElementById('neural-canvas');
  const ctx = canvas.getContext('2d');
  let nodes = [], edges = [], pulses = [];
  let weightL2Norm = 0;

  const sigmoid = z => 1 / (1 + Math.exp(-z));

  function build() {
    const W = canvas.width, H = canvas.height;
    nodes = []; edges = [];
    for (let l = 0; l < cfg.layers; l++) {
      const n = (l === 0 || l === cfg.layers - 1) ? Math.max(3, cfg.neurons - 2) : cfg.neurons;
      const layer = [];
      for (let i = 0; i < n; i++) {
        // Deterministic Xavier-like initial bias and state
        const initA = 0.5 + 0.3 * Math.sin(l * 1.7 + i * 2.3);
        layer.push({
          x: 60 + l * (W - 120) / (cfg.layers - 1),
          y: (i + 1) * H / (n + 1),
          a: initA,
          bias: 0.1 * Math.cos(l + i)
        });
      }
      nodes.push(layer);
    }
    let sumSq = 0;
    for (let l = 0; l < nodes.length - 1; l++) {
      const fanIn = nodes[l].length;
      const scale = Math.sqrt(2 / fanIn);
      nodes[l].forEach((a, i) => {
        nodes[l + 1].forEach((b, j) => {
          // Deterministic Xavier weight initialization based on topology coordinates
          const w = Math.sin((l + 1) * 3.1 + (i + 1) * 1.9 + (j + 1) * 2.7) * scale;
          sumSq += w * w;
          edges.push({ a, b, w, l });
        });
      });
    }
    weightL2Norm = Math.sqrt(sumSq);
  }

  // Real mathematical forward pass across the network layers
  function forwardPass(inputVector) {
    if (!nodes.length) return;
    nodes[0].forEach((n, i) => {
      n.a = inputVector && inputVector[i] !== undefined ? inputVector[i] : sigmoid(Math.sin(performance.now() * 0.002 + i));
    });
    for (let l = 0; l < nodes.length - 1; l++) {
      for (const target of nodes[l + 1]) {
        let z = target.bias;
        for (const e of edges) {
          if (e.l === l && e.b === target) {
            z += e.a.a * e.w;
          }
        }
        target.a = sigmoid(z);
      }
    }
  }

  function resize() {
    if (!canvas || !canvas.parentElement) return;
    const r = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.max(680, r.width || 760);
    canvas.height = Math.max(480, r.height || 480);
    build();
    forwardPass();
  }

  function inject() {
    if (window.NexusWS && NexusWS.isOpen()) {
      NexusWS.send({ action: 'tensor_step', layers: cfg.layers, neurons: cfg.neurons, input: 'inject_' + Date.now() });
    }
    const t = performance.now() * 0.005;
    const vec = nodes[0].map((_, i) => sigmoid(Math.cos(t + i * 1.4) * 2.5));
    forwardPass(vec);
    for (const n of nodes[0]) spawnFrom(n, 0);
  }

  function spawnFrom(node, l) {
    if (l >= nodes.length - 1) return;
    edges.filter(e => e.a === node && Math.abs(e.w * node.a) > 0.18)
      .forEach(e => pulses.push({ e, t: 0 }));
  }

  function updateRealTelemetry() {
    const allNodes = nodes.flat();
    if (!allNodes.length) return;
    const meanAct = allNodes.reduce((s, n) => s + n.a, 0) / allNodes.length;

    // Real Shannon Entropy H = -sum(p_i * log2(p_i)) over normalized activations
    const sumA = allNodes.reduce((s, n) => s + Math.max(1e-6, n.a), 0);
    let entropy = 0;
    for (const n of allNodes) {
      const p = Math.max(1e-6, n.a) / sumA;
      entropy -= p * Math.log2(p);
    }

    document.getElementById('nn-activation').textContent = meanAct.toFixed(3);
    document.getElementById('nn-firing').textContent = pulses.length + ' / ' + edges.length;
    document.getElementById('nn-entropy').textContent = entropy.toFixed(2) + ' bits';
    document.getElementById('nn-grad').textContent = weightL2Norm.toFixed(3);
  }

  let stepTick = 0;
  function frame() {
    // Render-gate: pause heavy 2D canvas drawing when /neural route is not visible
    if (!canvas || canvas.offsetParent === null) {
      requestAnimationFrame(frame);
      return;
    }
    const [c1, c2] = themes[cfg.theme];
    ctx.fillStyle = 'rgba(2,4,8,.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const e of edges) {
      ctx.strokeStyle = e.w > 0 ? c1 + '22' : c2 + '22';
      ctx.lineWidth = Math.max(0.4, Math.abs(e.w) * 1.4);
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    }
    const sp = cfg.speed * .004;
    pulses = pulses.filter(p => {
      p.t += sp;
      const x = p.e.a.x + (p.e.b.x - p.e.a.x) * p.t, y = p.e.a.y + (p.e.b.y - p.e.a.y) * p.t;
      ctx.fillStyle = c1; ctx.shadowColor = c1; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      if (p.t >= 1) {
        p.e.b.a = sigmoid(p.e.b.bias + p.e.a.a * p.e.w);
        spawnFrom(p.e.b, p.e.l + 1);
        return false;
      }
      return true;
    });
    for (const layer of nodes) for (const n of layer) {
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 18);
      g.addColorStop(0, c1 + Math.floor(40 + Math.min(1, n.a) * 200).toString(16).padStart(2, '0'));
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, 18, 0, 7); ctx.fill();
      ctx.fillStyle = '#0a0f1a'; ctx.strokeStyle = c2; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(n.x, n.y, 6, 0, 7); ctx.fill(); ctx.stroke();
    }
    stepTick++;
    if (stepTick % Math.max(15, Math.floor(90 / cfg.speed)) === 0 && nodes[0].length) {
      const idx = (stepTick / 15 | 0) % nodes[0].length;
      spawnFrom(nodes[0][idx], 0);
    }
    requestAnimationFrame(frame);
  }

  function bindControls() {
    ['layers', 'neurons', 'speed'].forEach(k => {
      const el = document.getElementById('nn-' + k);
      el.addEventListener('input', () => {
        cfg[k] = +el.value;
        document.getElementById(`nn-${k}-val`).textContent = el.value;
        if (k !== 'speed') { build(); forwardPass(); }
      });
    });
    document.getElementById('nn-theme').addEventListener('change', e => cfg.theme = e.target.value);
    document.getElementById('nn-inject-btn').addEventListener('click', inject);
    if (window.NexusWS) {
      NexusWS.onMessage((msg) => {
        if (msg.type === 'tensor_state' && msg.data?.telemetry) {
          const tel = msg.data.telemetry;
          document.getElementById('nn-activation').textContent = tel.meanActivation.toFixed(3);
          document.getElementById('nn-entropy').textContent = tel.shannonEntropy.toFixed(2) + ' bits';
          document.getElementById('nn-grad').textContent = tel.gradNorm.toFixed(4);
        }
      });
    }
    setInterval(updateRealTelemetry, 400);
  }

  // Hero: rotating 3D Fibonacci sphere
  function hero() {
    const hc = document.getElementById('hero-neural-preview'), h = hc.getContext('2d');
    const pts = Array.from({ length: 160 }, (_, i) => {
      const phi = Math.acos(1 - 2 * (i + .5) / 160), th = Math.PI * (1 + 5 ** .5) * i;
      return [Math.cos(th) * Math.sin(phi), Math.sin(th) * Math.sin(phi), Math.cos(phi)];
    });
    let ang = 0;
    (function loop() {
      if (hc && hc.offsetParent !== null) {
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
      }
      requestAnimationFrame(loop);
    })();
  }

  let initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;
    resize();
    bindControls();
    updateRealTelemetry();
    frame();
    hero();
    addEventListener('resize', resize);
  }
  return { init, onRouteShow: resize };
})();
