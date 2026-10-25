// Real mathematical Multi-Layer Perceptron (MLP) forward propagation + telemetry
// Optimized for zero forced-reflow & mobile CPU efficiency
const NeuralViz = (function () {
  const themes = {
    cyan: ['#00f5ff', '#0ea5e9'], violet: ['#a855f7', '#ec4899'],
    aurora: ['#10b981', '#00f5ff'], fire: ['#f59e0b', '#f43f5e']
  };
  const cfg = { layers: 7, neurons: 6, speed: 5, theme: 'cyan' };
  const canvas = document.getElementById('neural-canvas');
  let ctx = null;
  let nodes = [], edges = [], pulses = [];
  let weightL2Norm = 0;
  let isLoopRunning = false;
  let rafId = null;

  const sigmoid = z => 1 / (1 + Math.exp(-z));

  function build() {
    if (!canvas) return;
    const W = canvas.width || 680, H = canvas.height || 480;
    nodes = []; edges = [];
    for (let l = 0; l < cfg.layers; l++) {
      const n = (l === 0 || l === cfg.layers - 1) ? Math.max(3, cfg.neurons - 2) : cfg.neurons;
      const layer = [];
      for (let i = 0; i < n; i++) {
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
          const w = Math.sin((l + 1) * 3.1 + (i + 1) * 1.9 + (j + 1) * 2.7) * scale;
          sumSq += w * w;
          edges.push({ a, b, w, l });
        });
      });
    }
    weightL2Norm = Math.sqrt(sumSq);
  }

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
    if (!canvas) return;
    // Prevent forced layout reflow during initial page boot: check if canvas is visible first
    if (canvas.offsetParent === null) {
      if (!canvas.width) canvas.width = 680;
      if (!canvas.height) canvas.height = 480;
      if (!nodes.length) { build(); forwardPass(); }
      return;
    }
    const parent = canvas.parentElement;
    const w = parent ? (parent.clientWidth || 760) : 760;
    const h = parent ? (parent.clientHeight || 480) : 480;
    canvas.width = Math.max(340, w);
    canvas.height = Math.max(320, Math.min(600, h));
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
    const sumA = allNodes.reduce((s, n) => s + Math.max(1e-6, n.a), 0);
    let entropy = 0;
    for (const n of allNodes) {
      const p = Math.max(1e-6, n.a) / sumA;
      entropy -= p * Math.log2(p);
    }

    const aEl = document.getElementById('nn-activation');
    if (aEl) aEl.textContent = meanAct.toFixed(3);
    const fEl = document.getElementById('nn-firing');
    if (fEl) fEl.textContent = pulses.length + ' / ' + edges.length;
    const eEl = document.getElementById('nn-entropy');
    if (eEl) eEl.textContent = entropy.toFixed(2) + ' bits';
    const gEl = document.getElementById('nn-grad');
    if (gEl) gEl.textContent = weightL2Norm.toFixed(3);
  }

  let stepTick = 0;
  function frame() {
    // Zero-CPU Idle Gate: if /neural route is not active or hidden, stop the animation loop completely!
    if (!canvas || canvas.offsetParent === null || document.hidden) {
      isLoopRunning = false;
      return;
    }
    if (!ctx) ctx = canvas.getContext('2d');
    const [c1, c2] = themes[cfg.theme] || themes.cyan;
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
    rafId = requestAnimationFrame(frame);
  }

  function startLoop() {
    if (isLoopRunning) return;
    isLoopRunning = true;
    rafId = requestAnimationFrame(frame);
  }

  function bindControls() {
    ['layers', 'neurons', 'speed'].forEach(k => {
      const el = document.getElementById('nn-' + k);
      if (el) {
        el.addEventListener('input', () => {
          cfg[k] = +el.value;
          const valEl = document.getElementById(`nn-${k}-val`);
          if (valEl) valEl.textContent = el.value;
          if (k !== 'speed') { build(); forwardPass(); }
        });
      }
    });
    const themeEl = document.getElementById('nn-theme');
    if (themeEl) themeEl.addEventListener('change', e => cfg.theme = e.target.value);
    const injBtn = document.getElementById('nn-inject-btn');
    if (injBtn) injBtn.addEventListener('click', inject);
    if (window.NexusWS) {
      NexusWS.onMessage((msg) => {
        const tensorPayload = msg.type === 'tensor_state' ? msg.data : (msg.type === 'welcome' ? msg.tensor : null);
        if (tensorPayload && tensorPayload.telemetry) {
          const tel = tensorPayload.telemetry;
          if (Array.isArray(tensorPayload.activations)) {
            tensorPayload.activations.forEach((layerActs, lIdx) => {
              if (nodes[lIdx] && Array.isArray(layerActs)) {
                nodes[lIdx].forEach((n, nIdx) => {
                  if (typeof layerActs[nIdx] === 'number') n.a = layerActs[nIdx];
                });
              }
            });
          }
          if (Array.isArray(tensorPayload.weights)) {
            edges.forEach((edge) => {
              const lMat = tensorPayload.weights[edge.l];
              if (lMat && lMat[0] && typeof lMat[0][0] === 'number') {
                weightL2Norm = tel.gradNorm || tel.weightNorm || weightL2Norm;
              }
            });
          }
          const actEl = document.getElementById('nn-activation');
          if (actEl) actEl.textContent = tel.meanActivation.toFixed(3);
          const entEl = document.getElementById('nn-entropy');
          if (entEl) entEl.textContent = tel.shannonEntropy.toFixed(2) + ' bits';
          const grdEl = document.getElementById('nn-grad');
          if (grdEl) grdEl.textContent = tel.gradNorm.toFixed(4);
        }
      });
    }
    // Only update telemetry when the neural section is visibly rendered
    setInterval(() => {
      if (canvas && canvas.offsetParent !== null && !document.hidden) {
        updateRealTelemetry();
      }
    }, 1000);
  }

  // Hero: rotating 3D Fibonacci sphere - lightweight & adaptive
  function hero() {
    const hc = document.getElementById('hero-neural-preview');
    if (!hc) return;
    const h = hc.getContext('2d');
    const isMobile = window.innerWidth <= 768;
    const ptCount = isMobile ? 36 : 80;
    const pts = Array.from({ length: ptCount }, (_, i) => {
      const phi = Math.acos(1 - 2 * (i + .5) / ptCount), th = Math.PI * (1 + 5 ** .5) * i;
      return [Math.cos(th) * Math.sin(phi), Math.sin(th) * Math.sin(phi), Math.cos(phi)];
    });
    let ang = 0;
    let heroVisible = true;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        heroVisible = entries[0].isIntersecting;
      }, { threshold: 0.1 });
      observer.observe(hc);
    }

    let lastHeroTime = 0;
    (function loop(time) {
      if (!hc || hc.offsetParent === null || document.hidden || !heroVisible) {
        setTimeout(() => requestAnimationFrame(loop), 500);
        return;
      }
      // On mobile, throttle to ~30 FPS to save CPU and battery
      if (isMobile && (time - lastHeroTime < 32)) {
        requestAnimationFrame(loop);
        return;
      }
      lastHeroTime = time;
      ang += .004;
      h.clearRect(0, 0, 520, 520);
      const proj = pts.map(([x, y, z]) => {
        const X = x * Math.cos(ang) - z * Math.sin(ang), Z = x * Math.sin(ang) + z * Math.cos(ang);
        const Y = y * Math.cos(ang * .6) - Z * Math.sin(ang * .6), Z2 = y * Math.sin(ang * .6) + Z * Math.cos(ang * .6);
        return [260 + X * 180, 260 + Y * 180, Z2];
      });
      const maxDist = isMobile ? 55 : 48;
      for (let i = 0; i < proj.length; i++) for (let j = i + 1; j < proj.length; j++) {
        const d = Math.hypot(proj[i][0] - proj[j][0], proj[i][1] - proj[j][1]);
        if (d < maxDist) {
          h.strokeStyle = `rgba(0,245,255,${(1 - d / maxDist) * .25 * ((proj[i][2] + 1.5) / 2.5)})`;
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
    })(0);
  }

  let initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;
    resize();
    bindControls();
    hero();
    window.addEventListener('resize', () => {
      if (canvas && canvas.offsetParent !== null) resize();
    }, { passive: true });
  }

  function onRouteShow() {
    resize();
    updateRealTelemetry();
    startLoop();
  }

  return { init, onRouteShow };
})();
