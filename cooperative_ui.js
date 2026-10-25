// Cooperative Superintelligence UI: Controlled Release Gate, Eco-Sustainability & TEA Ludic Literature Studio
const CooperativeUI = (function () {
  const esc = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  function applyGateResult(gate) {
    if (!gate || !gate.scores) return;
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set('coop-agency', Math.round(gate.scores.humanAgency * 100) + '%');
    set('coop-inclusion', Math.round(gate.scores.socialInclusion * 100) + '%');
    set('coop-eco', Math.round(gate.scores.ecoSustainability * 100) + '%');
    if (gate.sustainability) {
      set('coop-joules', gate.sustainability.sessionTotalJoules + ' J');
    }

    const badge = document.getElementById('coop-gate-badge');
    if (badge) {
      const isHold = gate.releaseGate.includes('HOLD');
      badge.className = 'agent-badge ' + (isHold ? 'THINKING' : 'DONE');
      badge.textContent = gate.releaseGate;
    }

    const log = document.getElementById('coop-audit-log');
    if (log) {
      const t = new Date().toTimeString().slice(0, 8);
      const line = document.createElement('div');
      line.className = 'broker-line';
      line.innerHTML = `<span class="t-time">[${t}]</span> <span class="t-topic">${esc(gate.releaseGate)}</span> → Agency: ${Math.round(gate.scores.humanAgency * 100)}% | ${gate.sustainability?.requestJoules || 0}J`;
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
    }
  }

  async function auditDirective() {
    const inp = document.getElementById('coop-eval-input');
    const directive = (inp.value || '').trim() || 'Inclusão educacional cooperativa com preservação da agência humana';
    try {
      const r = await fetch('/api/cooperative/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directive, tokens: 180 })
      });
      if (r.ok) {
        applyGateResult(await r.json());
      }
    } catch (e) {}
  }

  async function generateTeaPedagogy() {
    const topic = document.getElementById('tea-topic-input')?.value || 'Explorar o Sistema Solar fazendo amigos na escola';
    const profile = document.getElementById('tea-profile-select')?.value || 'TEA Nível 1';
    const ageGroup = document.getElementById('tea-age-select')?.value || '6 a 10 anos';
    const out = document.getElementById('tea-output');
    const badge = document.getElementById('coop-tea-badge');
    const btn = document.getElementById('tea-gen-btn');

    btn.disabled = true;
    badge.className = 'agent-badge THINKING';
    badge.textContent = 'SYNTHESIZING';
    out.innerHTML = '<span class="idle-text">Avaliando Gate Ético de Liberação Controlada e gerando Literatura Lúdica + História Social adaptada para TEA...</span>';

    try {
      const r = await fetch('/api/cooperative/inclusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          profile,
          ageGroup,
          apiKey: window.Gemini ? Gemini.getKey() : ''
        })
      });
      if (r.ok) {
        const d = await r.json();
        if (d.gate) applyGateResult(d.gate);
        out.innerHTML = `<div style="width:100%">${esc(d.content).replace(/\n/g, '<br>')}</div>`;
        badge.className = 'agent-badge DONE';
        badge.textContent = 'APPROVED & READY';
      }
    } catch (e) {
      out.innerHTML = `<span style="color:var(--rose)">Erro: ${esc(e.message)}</span>`;
      badge.className = 'agent-badge IDLE';
      badge.textContent = 'ERROR';
    }
    btn.disabled = false;
  }

  function init() {
    if (window.NexusWS) {
      NexusWS.onMessage((msg) => {
        if (msg.type === 'ethics_gate' && msg.data) {
          applyGateResult(msg.data);
        }
      });
    }
    document.getElementById('coop-eval-btn')?.addEventListener('click', auditDirective);
    document.getElementById('coop-eval-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') auditDirective(); });
    document.getElementById('tea-gen-btn')?.addEventListener('click', generateTeaPedagogy);
  }

  return { init };
})();
