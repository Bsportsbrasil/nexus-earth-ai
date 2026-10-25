// Real-time Telemetry Dashboard connected to Backend OS/Prometheus Telemetry via WebSockets + Browser Performance APIs
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
  let recentTokensWindow = [];
  let lastLatencyMs = 0;
  let apiCallsCount = 0;
  let graphNodesCount = 0;
  let hostCpuLoadPct = null;
  let hostRamPct = null;
  let hostRamUsedGB = null;
  let hostCores = navigator.hardwareConcurrency || 4;

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

  function applyServerSnapshot(snap) {
    if (!snap) return;
    if (snap.cpu) {
      hostCores = snap.cpu.cores || hostCores;
      hostCpuLoadPct = snap.cpu.loadPct;
    }
    if (snap.memory) {
      hostRamPct = snap.memory.ramPct;
      hostRamUsedGB = snap.memory.ramUsedGB;
    }
    if (snap.ai) {
      if (snap.ai.totalTokens > totalTokens) totalTokens = snap.ai.totalTokens;
      if (snap.ai.totalApiCalls > apiCallsCount) apiCallsCount = snap.ai.totalApiCalls;
      if (snap.ai.lastLatencyMs) lastLatencyMs = snap.ai.lastLatencyMs;
    }
    if (snap.graph && typeof snap.graph.totalNodes === 'number') {
      graphNodesCount = Math.max(graphNodesCount, snap.graph.totalNodes);
    }
  }

  function bindWs() {
    if (!window.NexusWS) return;
    NexusWS.onMessage((msg) => {
      if (msg.type === 'welcome' && msg.telemetry) {
        applyServerSnapshot(msg.telemetry);
      } else if (msg.type === 'telemetry') {
        applyServerSnapshot(msg.data);
      }
    });
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
  }

  function setGraphNodes(count) {
    graphNodesCount = Math.max(graphNodesCount, count);
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
    recentTokensWindow = recentTokensWindow.filter(e => now - e.t <= 3000);
    const tokensPerSec = Math.round(recentTokensWindow.reduce((s, e) => s + e.count, 0) / 3);

    const netRtt = (navigator.connection && typeof navigator.connection.rtt === 'number')
      ? navigator.connection.rtt
      : 0;
    const latency = lastLatencyMs > 0 ? lastLatencyMs : netRtt;

    let memLabel = '0 MB';
    let memNumeric = 0;
    let memRatio = 0;
    if (hostRamUsedGB !== null) {
      memLabel = hostRamUsedGB + ' GB';
      memNumeric = hostRamUsedGB;
      memRatio = (hostRamPct || 50) / 100;
    } else if (performance.memory && performance.memory.usedJSHeapSize) {
      memNumeric = +(performance.memory.usedJSHeapSize / 1048576).toFixed(1);
      memLabel = memNumeric + ' MB';
      memRatio = performance.memory.usedJSHeapSize / (performance.memory.totalJSHeapSize || 1);
    }

    const cpuPct = hostCpuLoadPct !== null
      ? hostCpuLoadPct
      : Math.min(100, Math.round((maxFrameDurationMs / 16.67) * 50));
    maxFrameDurationMs = 1;

    hist.tokens.push(tokensPerSec); hist.tokens.shift();
    hist.params.push(hostCores); hist.params.shift();
    hist.depth.push(latency); hist.depth.shift();
    hist.conf.push(measuredFps); hist.conf.shift();
    hist.agents.push(memNumeric); hist.agents.shift();
    hist.entropy.push(totalTokens); hist.entropy.shift();

    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set('m-tokens', tokensPerSec.toLocaleString());
    set('m-params', hostCores);
    set('m-depth', latency + ' ms');
    set('m-confidence', measuredFps + ' FPS');
    set('m-agents-active', memLabel);
    set('m-entropy', totalTokens.toLocaleString());

    set('h-params', hostCores);
    set('h-iq', measuredFps);
    set('h-agents', apiCallsCount.toLocaleString());

    spark('spark-tokens', hist.tokens);
    spark('spark-params', hist.params);
    spark('spark-depth', hist.depth);
    spark('spark-conf', hist.conf);
    spark('spark-agents', hist.agents);
    spark('spark-entropy', hist.entropy);

    gauge('gauge-load', cpuPct / 100);
    set('gauge-load-val', cpuPct + '%');

    const ramPctDisplay = Math.round(memRatio * 100);
    gauge('gauge-iq', memRatio);
    set('gauge-iq-val', ramPctDisplay + '%');

    gauge('gauge-knowledge', Math.min(1, graphNodesCount / 40));
    set('gauge-knowledge-val', graphNodesCount);
  }

  function boost() {
    recordApiCall(lastLatencyMs);
  }

  function init() {
    const wt = document.getElementById('welcome-time');
    if (wt) wt.textContent = new Date().toTimeString().slice(0, 8);
    bindWs();
    requestAnimationFrame(frameProbe);
    update();
    setInterval(update, 1000);
  }

  return { init, boost, recordTokens, recordApiCall, setGraphNodes };
})();
