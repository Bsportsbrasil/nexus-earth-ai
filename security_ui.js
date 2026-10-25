// Sovereign Security & Master AI Kill-Switch UI Controller
const SecurityUI = (function () {
  const esc = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  function renderState(state) {
    if (!state) return;
    const locked = !!state.emergencyLockdown;
    const card = document.getElementById('sec-master-card');
    const badge = document.getElementById('sec-status-badge');
    const killBtn = document.getElementById('sec-kill-btn');
    const restoreBtn = document.getElementById('sec-restore-btn');
    const navKillBtn = document.getElementById('nav-kill-btn');
    const keyStatus = document.getElementById('key-status');
    const blockedCounter = document.getElementById('sec-blocked-counter');

    if (card) card.classList.toggle('locked', locked);
    if (badge) {
      badge.className = 'agent-badge ' + (locked ? 'THINKING' : 'DONE');
      badge.style.borderColor = locked ? 'var(--rose)' : '';
      badge.style.color = locked ? 'var(--rose)' : '';
      badge.textContent = locked ? '🛑 LOCKDOWN ATIVO (IA PARADA)' : 'SYSTEM ARMED & SAFE';
    }
    if (killBtn) killBtn.style.display = locked ? 'none' : 'block';
    if (restoreBtn) restoreBtn.style.display = locked ? 'block' : 'none';

    if (navKillBtn) {
      navKillBtn.classList.toggle('locked', locked);
      navKillBtn.textContent = locked ? '✅ RESTORE AI' : '🛑 STOP AI';
    }
    if (keyStatus && locked) {
      keyStatus.textContent = 'AI STOPPED';
      keyStatus.className = 'key-status demo';
    }
    if (blockedCounter && typeof state.blockedAttempts === 'number') {
      blockedCounter.textContent = `${state.blockedAttempts} Blocked`;
    }

    // Update module circuit breaker buttons
    const mods = state.modules || {};
    document.querySelectorAll('.breaker-btn[data-mod]').forEach(btn => {
      const m = btn.getAttribute('data-mod');
      const isOn = !!mods[m] && !locked;
      btn.className = 'breaker-btn ' + (isOn ? 'on' : 'off');
      btn.textContent = isOn ? 'ONLINE' : 'STOPPED';
    });

    // Update security audit log
    const logBox = document.getElementById('sec-events-log');
    if (logBox && Array.isArray(state.recentEvents)) {
      logBox.innerHTML = '';
      state.recentEvents.forEach(ev => {
        const t = new Date(ev.timestamp || Date.now()).toTimeString().slice(0, 8);
        const line = document.createElement('div');
        line.className = 'broker-line';
        line.innerHTML = `<span class="t-time">[${t}]</span> <span class="t-topic">${esc(ev.event)}</span> → ${esc(ev.details || ev.status || '')}`;
        logBox.appendChild(line);
      });
    }
  }

  async function postSecurityAction(payload) {
    try {
      const r = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (r.ok) {
        const state = await r.json();
        renderState(state);
        return state;
      }
    } catch (e) {}
    return null;
  }

  async function engageKillSwitch() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    await postSecurityAction({ action: 'kill_switch', reason: 'Parada Total acionada pelo operador humano' });
  }

  async function restoreSystem() {
    await postSecurityAction({ action: 'restore' });
  }

  async function purgeKeys() {
    if (window.Gemini && Gemini.setKey) Gemini.setKey('');
    await postSecurityAction({ action: 'purge_keys' });
  }

  function init() {
    fetch('/api/security')
      .then(r => r.ok ? r.json() : null)
      .then(st => { if (st) renderState(st); })
      .catch(() => {});

    if (window.NexusWS) {
      NexusWS.onMessage((msg) => {
        if (msg.type === 'welcome' && msg.security) {
          renderState(msg.security);
        } else if (msg.type === 'security_state' && msg.data) {
          renderState(msg.data);
        }
      });
    }

    document.getElementById('sec-kill-btn')?.addEventListener('click', engageKillSwitch);
    document.getElementById('sec-restore-btn')?.addEventListener('click', restoreSystem);
    document.getElementById('sec-purge-keys-btn')?.addEventListener('click', purgeKeys);

    document.getElementById('nav-kill-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('nav-kill-btn');
      if (btn && btn.classList.contains('locked')) {
        await restoreSystem();
      } else {
        await engageKillSwitch();
        document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' });
      }
    });

    document.querySelectorAll('.breaker-btn[data-mod]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const mod = btn.getAttribute('data-mod');
        const currentlyOn = btn.classList.contains('on');
        await postSecurityAction({ action: 'toggle_module', module: mod, enabled: !currentlyOn });
      });
    });
  }

  return { init, engageKillSwitch, restoreSystem };
})();
