// Unified Glass-Box AI Control Center (3-Pillar Real-Time Convergence)
const CommandCenter = (function () {
  const esc = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  let brokerEventsCount = 0;

  function setStage(stageId, state) {
    const el = document.getElementById('cc-st-' + stageId);
    if (!el) return;
    el.className = 'cc-stage ' + (state || '');
  }

  function resetStages() {
    ['graphrag', 'tensor', 'planner', 'critic', 'executor', 'verifier'].forEach(s => setStage(s, ''));
  }

  function appendBrokerLog(topic, summary) {
    brokerEventsCount++;
    const counterEl = document.getElementById('cc-msgs');
    if (counterEl) counterEl.textContent = brokerEventsCount.toLocaleString();
    const box = document.getElementById('cc-broker-log');
    if (!box) return;
    const t = new Date().toTimeString().slice(0, 8);
    const line = document.createElement('div');
    line.className = 'broker-line';
    line.innerHTML = `<span class="t-time">[${t}]</span> <span class="t-topic">${esc(topic)}</span> → ${esc(summary)}`;
    box.appendChild(line);
    while (box.children.length > 40) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
  }

  function renderAttentionHeatmap(tensorData) {
    const canvas = document.getElementById('cc-attn-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const acts = tensorData?.activations || [];
    const L = acts.length || 7;
    const D = (acts[0] && acts[0].length) || 6;
    const cellW = Math.floor((W - 16) / L);
    const cellH = Math.floor((H - 16) / D);

    for (let l = 0; l < L; l++) {
      for (let i = 0; i < D; i++) {
        const val = acts[l]?.[i] ?? (0.5 + 0.4 * Math.sin(l * 1.3 + i * 0.9 + performance.now() * 0.002));
        const alpha = Math.max(0.12, Math.min(0.95, val));
        ctx.fillStyle = l === L - 1
          ? `rgba(168, 85, 247, ${alpha})`
          : `rgba(0, 245, 255, ${alpha})`;
        ctx.fillRect(8 + l * cellW, 8 + i * cellH, cellW - 3, cellH - 3);
      }
    }

    if (tensorData?.telemetry) {
      const st = document.getElementById('cc-tensor-stats');
      if (st) {
        st.textContent = `H = ${tensorData.telemetry.shannonEntropy} bits | ||∇W|| = ${tensorData.telemetry.gradNorm}`;
      }
    }
  }

  function renderGraphRAGPane(rag) {
    const list = document.getElementById('cc-rag-list');
    if (!list || !rag) return;
    list.innerHTML = '';

    const nodes = rag.seedNodes || [];
    nodes.forEach(n => {
      const div = document.createElement('div');
      div.className = 'rag-pill';
      div.innerHTML = `<strong>[Node] ${esc(n.label)}</strong>: ${esc((n.summary || '').slice(0, 140))}…` +
        (n.url ? ` <a href="${esc(n.url)}" target="_blank" rel="noopener" style="color:var(--cyan)">↗</a>` : '');
      list.appendChild(div);
    });

    (rag.papers || []).forEach(p => {
      const div = document.createElement('div');
      div.className = 'rag-pill';
      div.innerHTML = `<strong>[DOI Paper]</strong> ${esc(p.title)} (${esc(String(p.year))})` +
        (p.doi ? ` <a href="${esc(p.doi)}" target="_blank" rel="noopener" style="color:var(--cyan)">DOI ↗</a>` : '');
      list.appendChild(div);
    });

    const gnodes = document.getElementById('cc-gnodes');
    if (gnodes && rag.totalIndexedNodes) gnodes.textContent = rag.totalIndexedNodes;
  }

  function upsertDebateEntry(role, text, isDone = false) {
    const stream = document.getElementById('cc-debate-stream');
    if (!stream) return;
    const idle = stream.querySelector('.idle-text');
    if (idle) idle.remove();

    let entry = document.getElementById('cc-debate-' + role);
    if (!entry) {
      entry = document.createElement('div');
      entry.id = 'cc-debate-' + role;
      entry.className = 'debate-entry ' + role;
      stream.appendChild(entry);
    }
    entry.innerHTML = `<div class="debate-role">${role.toUpperCase()} ${isDone ? '✓' : '⚡'}</div>` +
      `<div>${esc(text).replace(/\n/g, '<br>')}</div>`;
    stream.scrollTop = stream.scrollHeight;
  }

  function bindRealtimeBus() {
    if (!window.NexusWS) return;
    NexusWS.onMessage((msg) => {
      if (msg.type === 'welcome') {
        if (msg.tensor) renderAttentionHeatmap(msg.tensor);
        if (msg.telemetry) updateMiniTelemetry(msg.telemetry);
        appendBrokerLog('ws.handshake', 'Connected to NEXUS RFC6455 Stream');
      } else if (msg.type === 'telemetry') {
        updateMiniTelemetry(msg.data);
      } else if (msg.type === 'tensor_state') {
        renderAttentionHeatmap(msg.data);
        setStage('tensor', 'done');
      } else if (msg.type === 'broker_message' && msg.msg) {
        const m = msg.msg;
        appendBrokerLog(m.topic, JSON.stringify(m.payload).slice(0, 75));
      } else if (msg.type === 'dag_event') {
        const ev = msg.event;
        const p = msg.msg?.payload || {};
        if (ev === 'graphrag.lookup') {
          setStage('graphrag', 'active');
          document.getElementById('cc-p1-badge').className = 'agent-badge THINKING';
          document.getElementById('cc-p1-badge').textContent = 'RETRIEVING';
        } else if (ev === 'graphrag.complete') {
          setStage('graphrag', 'done');
          setStage('tensor', 'active');
          document.getElementById('cc-p1-badge').className = 'agent-badge DONE';
          document.getElementById('cc-p1-badge').textContent = `${p.nodesFound} NODES`;
        } else if (ev === 'agent.status') {
          setStage('tensor', 'done');
          setStage(p.role, p.status === 'DONE' ? 'done' : 'active');
          document.getElementById('cc-p2-badge').className = 'agent-badge ' + (p.status === 'DONE' ? 'DONE' : 'THINKING');
          document.getElementById('cc-p2-badge').textContent = `${p.role.toUpperCase()}: ${p.status}`;
          if (p.output) upsertDebateEntry(p.role, p.output, true);
        }
      } else if (msg.type === 'agent_stream') {
        upsertDebateEntry(msg.role, msg.text, false);
      } else if (msg.type === 'consensus_stream') {
        upsertDebateEntry('consensus', msg.text, true);
        document.getElementById('cc-p2-badge').className = 'agent-badge DONE';
        document.getElementById('cc-p2-badge').textContent = 'CONSENSUS VERIFIED';
      }
    });
  }

  function updateMiniTelemetry(snap) {
    if (!snap) return;
    const cpuEl = document.getElementById('cc-cpu');
    const ramEl = document.getElementById('cc-ram');
    const gnEl = document.getElementById('cc-gnodes');
    if (cpuEl && snap.cpu) cpuEl.textContent = snap.cpu.loadPct + '%';
    if (ramEl && snap.memory) ramEl.textContent = snap.memory.ramUsedGB + ' GB';
    if (gnEl && snap.graph) gnEl.textContent = snap.graph.totalNodes || 0;
  }

  async function executeUnifiedDirective() {
    const input = document.getElementById('cc-prompt');
    const q = (input.value || '').trim() || 'Quantum computing impact on cryptography';
    const btn = document.getElementById('cc-exec-btn');
    btn.disabled = true;

    resetStages();
    const stream = document.getElementById('cc-debate-stream');
    if (stream) stream.innerHTML = '';

    appendBrokerLog('command.dispatch', `Directive: "${q}"`);
    setStage('graphrag', 'active');

    // Sync the query to individual modules so the entire page updates in harmony
    const agentPrompt = document.getElementById('agent-prompt');
    if (agentPrompt) agentPrompt.value = q;
    const graphSearch = document.getElementById('graph-search');
    if (graphSearch) graphSearch.value = q;

    try {
      // 1. Trigger Tensor Forward/Backprop pass
      fetch('/api/tensor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: q })
      }).then(r => r.ok ? r.json() : null).then(tData => {
        if (tData) renderAttentionHeatmap(tData);
      }).catch(() => {});

      // 2. Execute full GraphRAG + Multi-Agent DAG pipeline
      const resp = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          apiKey: window.Gemini ? Gemini.getKey() : ''
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.rag) renderGraphRAGPane(data.rag);
        ['graphrag', 'tensor', 'planner', 'critic', 'executor', 'verifier'].forEach(s => setStage(s, 'done'));
        for (const k of ['planner', 'critic', 'executor', 'verifier']) {
          if (data.agentOutputs?.[k]) {
            upsertDebateEntry(k, data.agentOutputs[k], true);
            const cardOut = document.getElementById(k + '-output');
            if (cardOut) cardOut.innerHTML = esc(data.agentOutputs[k]).replace(/\n/g, '<br>');
          }
        }
        if (data.consensus) {
          upsertDebateEntry('consensus', data.consensus, true);
        }
      }
    } catch (e) {
      appendBrokerLog('dlq.error', e.message);
    }

    btn.disabled = false;
  }

  function init() {
    bindRealtimeBus();
    renderAttentionHeatmap(null);
    const btn = document.getElementById('cc-exec-btn');
    const inp = document.getElementById('cc-prompt');
    if (btn) btn.addEventListener('click', executeUnifiedDirective);
    if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') executeUnifiedDirective(); });
  }

  return { init, executeUnifiedDirective };
})();
