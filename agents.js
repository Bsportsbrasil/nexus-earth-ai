// Multi-agent reasoning console (simulated, scripted reasoning)
const Agents = (function () {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const scripts = q => ({
    planner: `Decomposing: "${q}"\n→ 1. Define the objective and constraints\n→ 2. Map stakeholders and resources\n→ 3. Generate candidate strategies\n→ 4. Simulate second-order effects\n→ 5. Rank by impact / feasibility`,
    critic: `Reviewing plan…\n⚠ Step 3 risks optimism bias — require evidence.\n⚠ Step 4 needs explicit failure modes.\n✓ Decomposition is complete and non-overlapping.\nRecommendation: add measurable success metrics.`,
    executor: `Synthesizing solution…\n• Strategy A: incremental, low risk, slow\n• Strategy B: systemic redesign, high impact\n• Hybrid: pilot B in small scope, scale on proven metrics\nSelected: Hybrid (expected value highest).`,
    verifier: `Cross-checking agents…\nPlanner ↔ Critic: concerns addressed ✓\nExecutor ↔ Metrics: success criteria defined ✓\nConsistency score: 0.94\nConsensus reached.`
  });
  async function type(el, text, badge, tokEl) {
    badge.className = 'agent-badge THINKING'; badge.textContent = 'THINKING';
    el.innerHTML = '';
    let out = '';
    for (const ch of text) {
      out += ch;
      el.innerHTML = out.replace(/\n/g, '<br>') + '<span class="typing-cursor"></span>';
      tokEl.textContent = Math.ceil(out.length / 4) + ' tokens';
      el.scrollTop = el.scrollHeight;
      await sleep(12);
    }
    el.innerHTML = out.replace(/\n/g, '<br>');
    badge.className = 'agent-badge DONE'; badge.textContent = 'DONE';
  }
  const ROLES = {
    planner: 'Você é o agente PLANNER. Decomponha o problema em 4-6 passos estratégicos numerados. Máximo 120 palavras. Sem introdução.',
    critic: 'Você é o agente CRITIC. Analise o plano do Planner: aponte falhas, vieses e riscos, e o que está sólido. Máximo 120 palavras. Use ⚠ e ✓.',
    executor: 'Você é o agente EXECUTOR. Considerando o plano e as críticas, sintetize uma solução concreta e acionável. Máximo 140 palavras.',
    verifier: 'Você é o agente VERIFIER. Verifique a consistência entre os agentes, dê uma nota de confiança de 0 a 1 justificada. Máximo 90 palavras.'
  };
  async function live(el, badge, tokEl, sys, prompt) {
    badge.className = 'agent-badge THINKING'; badge.textContent = 'THINKING';
    el.innerHTML = '<span class="typing-cursor"></span>';
    const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\n/g, '<br>');
    try {
      const full = await Gemini.stream(prompt, sys, t => {
        el.innerHTML = esc(t) + '<span class="typing-cursor"></span>';
        tokEl.textContent = Math.ceil(t.length / 4) + ' tokens';
        el.scrollTop = el.scrollHeight;
      });
      el.innerHTML = esc(full);
      badge.className = 'agent-badge DONE'; badge.textContent = 'DONE';
      return full;
    } catch (e) {
      el.innerHTML = '<span style="color:var(--rose)">Erro: ' + e.message + '</span>';
      badge.className = 'agent-badge IDLE'; badge.textContent = 'ERROR';
      throw e;
    }
  }
  async function runLive(q) {
    const out = {};
    let ctx = `PROBLEMA: ${q}`;
    for (const k of ['planner', 'critic', 'executor', 'verifier']) {
      out[k] = await live(document.getElementById(k + '-output'), document.getElementById(k + '-badge'),
        document.getElementById(k + '-tokens'), ROLES[k], ctx);
      ctx += `\n\n[${k.toUpperCase()}]\n${out[k]}`;
    }
    const panel = document.getElementById('consensus-panel');
    panel.style.display = 'block';
    const co = document.getElementById('consensus-output');
    await Gemini.stream(ctx, 'Você é o núcleo NEXUS. Com base no trabalho dos 4 agentes, escreva a conclusão final de consenso: clara, prática, até 150 palavras, no idioma do problema.',
      t => co.innerHTML = t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\n/g, '<br>'));
  }
  async function run() {
    const q = document.getElementById('agent-prompt').value.trim() || 'Untitled problem';
    const btn = document.getElementById('agent-run-btn');
    btn.disabled = true;
    if (window.Gemini && Gemini.hasKey()) {
      document.getElementById('consensus-panel').style.display = 'none';
      window.Metrics && Metrics.boost();
      try { await runLive(q); } catch (e) { console.error(e); }
      btn.disabled = false;
      return;
    }
    const s = scripts(q);
    const panel = document.getElementById('consensus-panel');
    panel.style.display = 'none';
    for (const k of ['planner', 'critic', 'executor', 'verifier']) {
      document.getElementById(k + '-badge').className = 'agent-badge IDLE';
      document.getElementById(k + '-badge').textContent = 'IDLE';
    }
    window.Metrics && Metrics.boost();
    for (const k of ['planner', 'critic', 'executor', 'verifier']) {
      await type(document.getElementById(k + '-output'), s[k],
        document.getElementById(k + '-badge'), document.getElementById(k + '-tokens'));
    }
    panel.style.display = 'block';
    document.getElementById('consensus-output').innerHTML =
      `<strong>Conclusion for:</strong> <em>${q.replace(/</g, '&lt;')}</em><br><br>
       Adopt a hybrid approach: pilot the high-impact systemic strategy at small scale, define measurable
       success metrics up front, monitor second-order effects, and scale only what the evidence supports.`;
    btn.disabled = false;
  }
  function init() {
    document.getElementById('agent-run-btn').addEventListener('click', run);
    document.querySelectorAll('.agent-badge').forEach(b => b.classList.add('IDLE'));
  }
  return { init };
})();
