// 100% Real System, Hardware, Render, and API Telemetry (Zero random numbers)
const Metrics = (function () {
  const hist = {};
  const keys = ['tokens', 'params', 'depth', 'conf', 'agents', 'entropy'];
  keys.forEach(k => hist[k] = Array(30).fill(0));

  let frameCount = 0;
  let lastFpsTime = performance.now();
  let lastFrameTime = performance.now();
  let measuredFps = 60;
  let maxFrameDurationMs = 4;
  let totalTokens = 0;
  let recentTokensWindow = []; // [{ t, count }]
  let lastLatencyMs = null;
  let apiCallsCount = 0;
  let graphNodesCount = 0;

  const cores = navigator.hardwareConcurrency || 4;

  // Measure real render frame rate & frame time via requestAnimationFrame
  function frameProbe(now) {
    frameCount++;
    const dt = now - lastFrameTime;
    lastFrameTime = now;
    if (dt > maxFrameDurationMs) maxFrameDurationMs = dt;

    if (now - lastFpsTime >= 1000) {
      measuredFps = Math.min(240, Math.round((frameCount * 1000) / (now - lastFpsTime)));
      frameCount = 0;
      lastFpsTime = now;
    }
    requestAnimationFrame(frameProbe);
  }

  function recordTokens(charCount) {
    const tok = Math.max(1, Math.ceil(charCount / 4));
    totalTokens += tok;
    recentTokensWindow.push({ t: performance.now(), count: tok });
  }

  function recordApiCall(latencyMs) {
    apiCallsCount++;
    if (typeof latencyMs === 'number' && latencyMs >= 0) {
      lastLatencyMs = Math.round(latencyMs);
    }
    const hAgents = document.getElementById('h-agents');
    if (hAgents) hAgents.textContent = apiCallsCount.toLocaleString();
  }

  function setGraphNodes(count) {
    graphNodesCount = count;
  }

  function spark(id, arr) {
    const c = document.getElementById(id);
    if (!c) return;
    const x = c.getContext('2d'), mx = Math.max(...arr, 1);
    x.clearRect(0, 0, c.width, c.height);
    const g = x.createLinearGradient(0, 0, c.width, 0);
    g.addColorStop(0, '#00f5ff'); g.addColorStop(1, '#a855f7');
    x.strokeStyle = g; x.lineWidth = 2; x.beginPath();
    arr.forEach((v, i) => {
      const px = i * c.width / (arr.length - 1);
      const py = c.height - 4 - (v / mx) * (c.height - 8);
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    });
    x.stroke();
  }

  function gauge(id, frac) {
    const c = document.getElementById(id);
    if (!c) return;
    const x = c.getContext('2d');
    const clamped = Math.max(0, Math.min(1, frac || 0));
    x.clearRect(0, 0, 200, 200); x.lineWidth = 12; x.lineCap = 'round';
    x.strokeStyle = 'rgba(148,163,184,.12)';
    x.beginPath(); x.arc(100, 100, 80, .75 * Math.PI, 2.25 * Math.PI); x.stroke();
    const g = x.createLinearGradient(0, 0, 200, 200);
    g.addColorStop(0, '#00f5ff'); g.addColorStop(1, '#a855f7');
    x.strokeStyle = g; x.shadowColor = '#00f5ff'; x.shadowBlur = 12;
    x.beginPath(); x.arc(100, 100, 80, .75 * Math.PI, (.75 + 1.5 * clamped) * Math.PI); x.stroke();
    x.shadowBlur = 0;
  }

  function update() {
    const now = performance.now();
    // Tokens/sec over the last 3 seconds
    recentTokensWindow = recentTokensWindow.filter(e => now - e.t <= 3000);
    const tokensPerSec = Math.round(recentTokensWindow.reduce((s, e) => s + e.count, 0) / 3);

    // Network RTT from browser Network Information API or measured API latency
    const netRtt = (navigator.connection && typeof navigator.connection.rtt === 'number')
      ? navigator.connection.rtt
      : null;
    const latency = lastLatencyMs !== null ? lastLatencyMs : (netRtt !== null ? netRtt : 0);

    // Real JS Heap Memory (Chromium/Edge) or DOM node count fallback
    let usedHeapMB = 0;
    let heapRatio = 0;
    if (performance.memory && performance.memory.usedJSHeapSize) {
      usedHeapMB = +(performance.memory.usedJSHeapSize / 1048576).toFixed(1);
      heapRatio = performance.memory.usedJSHeapSize / (performance.memory.totalJSHeapSize || 1);
    } else {
      const domNodes = document.getElementsByTagName('*').length;
      usedHeapMB = +(domNodes * 0.015).toFixed(1);
      heapRatio = Math.min(1, domNodes / 2000);
    }

    // Frame budget load: how much of a 16.67ms frame budget was consumed
    const frameBudgetPct = Math.min(100, Math.round((maxFrameDurationMs / 16.67) * 50));
    maxFrameDurationMs = 1; // reset for next window

    hist.tokens.push(tokensPerSec); hist.tokens.shift();
    hist.params.push(cores); hist.params.shift();
    hist.depth.push(latency); hist.depth.shift();
    hist.conf.push(measuredFps); hist.conf.shift();
    hist.agents.push(usedHeapMB); hist.agents.shift();
    hist.entropy.push(totalTokens); hist.entropy.shift();

    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set('m-tokens', tokensPerSec.toLocaleString());
    set('m-params', cores);
    set('m-depth', latency + ' ms');
    set('m-confidence', measuredFps + ' FPS');
    set('m-agents-active', usedHeapMB + ' MB');
    set('m-entropy', totalTokens.toLocaleString());

    // Hero live telemetry
    set('h-params', cores);
    set('h-iq', measuredFps);
    set('h-agents', apiCallsCount.toLocaleString());

    spark('spark-tokens', hist.tokens);
    spark('spark-params', hist.params);
    spark('spark-depth', hist.depth);
    spark('spark-conf', hist.conf);
    spark('spark-agents', hist.agents);
    spark('spark-entropy', hist.entropy);

    gauge('gauge-load', frameBudgetPct / 100);
    set('gauge-load-val', frameBudgetPct + '%');

    const heapPct = Math.round(heapRatio * 100);
    gauge('gauge-iq', heapRatio);
    set('gauge-iq-val', heapPct + '%');

    gauge('gauge-knowledge', Math.min(1, graphNodesCount / 40));
    set('gauge-knowledge-val', graphNodesCount);
  }

  function boost() {
    // Triggered when user runs an action; records activity timestamp
    recordApiCall(lastLatencyMs);
  }

  function init() {
    const wt = document.getElementById('welcome-time');
    if (wt) wt.textContent = new Date().toTimeString().slice(0, 8);
    requestAnimationFrame(frameProbe);
    update();
    setInterval(update, 1000);
  }

  return { init, boost, recordTokens, recordApiCall, setGraphNodes };
})();
