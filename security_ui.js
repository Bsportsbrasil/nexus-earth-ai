// Exclusive Owner Sovereign Control Plane Script (Only runs on /admin.html with Admin Bearer Token)
(function () {
  const TOKEN_KEY = 'nexus_owner_admin_token';
  const esc = s => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(t) {
    if (t) sessionStorage.setItem(TOKEN_KEY, t);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  function showDashboard(state) {
    document.getElementById('admin-auth-gate').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('admin-logout-btn').style.display = 'inline-flex';
    renderState(state);
  }

  function showLoginGate(errMsg = '') {
    document.getElementById('admin-auth-gate').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('admin-logout-btn').style.display = 'none';
    const errEl = document.getElementById('admin-auth-error');
    if (errEl) {
      errEl.style.display = errMsg ? 'block' : 'none';
      errEl.textContent = errMsg;
    }
  }

  function renderState(state) {
    if (!state) return;
    const locked = !!state.emergencyLockdown;
    const card = document.getElementById('sec-master-card');
    const badge = document.getElementById('sec-status-badge');
    const killBtn = document.getElementById('sec-kill-btn');
    const restoreBtn = document.getElementById('sec-restore-btn');
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

    if (blockedCounter && typeof state.blockedAttempts === 'number') {
      blockedCounter.textContent = `${state.blockedAttempts} Blocked`;
    }

    const mods = state.modules || {};
    document.querySelectorAll('.breaker-btn[data-mod]').forEach(btn => {
      const m = btn.getAttribute('data-mod');
      const isOn = !!mods[m] && !locked;
      btn.className = 'breaker-btn ' + (isOn ? 'on' : 'off');
      btn.textContent = isOn ? 'ONLINE' : 'STOPPED';
    });

    if (state.telemetry) {
      const t = state.telemetry;
      const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
      if (t.cpu) set('adm-cpu', t.cpu.loadPct + '%');
      if (t.memory) set('adm-ram', t.memory.ramUsedGB + ' GB');
      if (t.ai) {
        set('adm-tokens', (t.ai.totalTokens || 0).toLocaleString());
        set('adm-calls', (t.ai.totalApiCalls || 0).toLocaleString());
      }
    }

    const logBox = document.getElementById('sec-events-log');
    if (logBox && Array.isArray(state.recentEvents)) {
      logBox.innerHTML = '';
      state.recentEvents.forEach(ev => {
        const tm = new Date(ev.timestamp || Date.now()).toTimeString().slice(0, 8);
        const line = document.createElement('div');
        line.className = 'broker-line';
        line.innerHTML = `<span class="t-time">[${tm}]</span> <span class="t-topic">${esc(ev.event)}</span> → ${esc(ev.details || ev.status || '')}`;
        logBox.appendChild(line);
      });
    }
  }

  async function fetchAdminState() {
    const tok = getToken();
    if (!tok) return showLoginGate();
    try {
      const r = await fetch('/api/security', {
        headers: { 'Authorization': `Bearer ${tok}` }
      });
      if (r.status === 401) {
        setToken('');
        return showLoginGate();
      }
      if (r.ok) {
        showDashboard(await r.json());
      }
    } catch (e) {}
  }

  async function postSecurityAction(payload) {
    const tok = getToken();
    if (!tok) return showLoginGate('Sessão expirada. Faça login novamente.');
    try {
      const r = await fetch('/api/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tok}`
        },
        body: JSON.stringify(payload)
      });
      if (r.status === 401) {
        setToken('');
        return showLoginGate('Sessão não autorizada.');
      }
      if (r.ok) {
        await fetchAdminState();
      }
    } catch (e) {}
  }

  async function login() {
    const inp = document.getElementById('admin-pass-input');
    const passkey = (inp?.value || '').trim();
    if (!passkey) return;
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey })
      });
      const d = await r.json();
      if (!r.ok) {
        return showLoginGate(d.error || 'Chave inválida');
      }
      inp.value = '';
      setToken(d.token);
      await fetchAdminState();
    } catch (e) {
      showLoginGate('Erro de conexão com o servidor.');
    }
  }

  document.getElementById('admin-login-btn')?.addEventListener('click', login);
  document.getElementById('admin-pass-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });
  document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
    setToken('');
    showLoginGate();
  });

  document.getElementById('sec-kill-btn')?.addEventListener('click', () => {
    postSecurityAction({ action: 'kill_switch', reason: 'Parada Total acionada pela Administradora no Console Soberano' });
  });
  document.getElementById('sec-restore-btn')?.addEventListener('click', () => {
    postSecurityAction({ action: 'restore' });
  });
  document.getElementById('sec-purge-keys-btn')?.addEventListener('click', () => {
    postSecurityAction({ action: 'purge_keys' });
  });

  document.querySelectorAll('.breaker-btn[data-mod]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mod = btn.getAttribute('data-mod');
      const currentlyOn = btn.classList.contains('on');
      postSecurityAction({ action: 'toggle_module', module: mod, enabled: !currentlyOn });
    });
  });

  fetchAdminState();
  setInterval(() => {
    if (getToken()) fetchAdminState();
  }, 2500);
})();
