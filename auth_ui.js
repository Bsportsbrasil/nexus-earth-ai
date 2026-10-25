// Enterprise Zero-Trust Identity, Registration, Login, Logout, 2FA/MFA, Sessions & LGPD UI Controller
const AuthUI = (function () {
  const TOKEN_KEY = 'nexus_session_jwt';
  let currentUser = null;

  function getStoredToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (_) { return ''; }
  }

  function setStoredToken(tok) {
    try {
      if (tok) localStorage.setItem(TOKEN_KEY, tok);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (_) {}
  }

  function authHeaders() {
    const tok = getStoredToken();
    const h = { 'Content-Type': 'application/json' };
    if (tok) h['Authorization'] = `Bearer ${tok}`;
    return h;
  }

  function setFeedback(msg, isError = false) {
    const el = document.getElementById('auth-feedback-msg');
    if (!el) return;
    el.style.color = isError ? 'var(--rose)' : 'var(--cyan)';
    el.textContent = msg || '';
  }

  function syncUserWithAuraAndNavbar(user) {
    currentUser = user || null;
    const navBtn = document.getElementById('nav-auth-btn');
    const guestView = document.getElementById('auth-guest-view');
    const userView = document.getElementById('auth-user-view');

    if (user) {
      if (navBtn) {
        navBtn.innerHTML = `🟢 ${user.name.split(' ')[0]} <small style="opacity:0.8">[Conta]</small>`;
      }
      if (guestView) guestView.style.display = 'none';
      if (userView) userView.style.display = 'flex';

      const nameDisp = document.getElementById('acct-name-display');
      const emailDisp = document.getElementById('acct-email-display');
      const compDisp = document.getElementById('acct-company-display');
      const roleBadge = document.getElementById('acct-role-badge');
      const quotaDisp = document.getElementById('acct-quota-display');
      const mfaBtn = document.getElementById('acct-toggle-mfa-btn');
      const sessCount = document.getElementById('acct-session-count');
      const sessList = document.getElementById('acct-sessions-list');

      if (nameDisp) nameDisp.textContent = user.name;
      if (emailDisp) emailDisp.textContent = user.email;
      if (compDisp) compDisp.textContent = user.company || 'Conta Individual NEXUS';
      if (roleBadge) roleBadge.textContent = user.role || 'TENANT_PRO';
      if (quotaDisp) quotaDisp.textContent = `Quota: ${(user.quotaTokens || 100000).toLocaleString()} tokens`;
      if (mfaBtn) {
        mfaBtn.textContent = user.mfaEnabled ? '🛡️ 2FA/MFA: ATIVO ✓' : '🛡️ Ativar 2FA/MFA';
        mfaBtn.style.borderColor = user.mfaEnabled ? 'var(--emerald)' : '';
      }
      if (sessCount) sessCount.textContent = String((user.activeSessions || []).length || 1);
      if (sessList) {
        sessList.innerHTML = (user.activeSessions || []).map(s =>
          `<div>• [${s.sessionId.slice(0, 11)}] IP ${s.ip} — ${(s.lastActiveAt || '').slice(0, 19).replace('T', ' ')}</div>`
        ).join('');
      }

      // Sync authenticated user name directly with AURA Companion input
      const auraNameInput = document.getElementById('aura-user-name');
      if (auraNameInput) {
        auraNameInput.value = user.name.split(' ')[0];
      }
    } else {
      if (navBtn) navBtn.textContent = '👤 Entrar';
      if (guestView) guestView.style.display = 'block';
      if (userView) userView.style.display = 'none';
    }
  }

  function switchAuthTab(tab) {
    const loginForm = document.getElementById('auth-login-form');
    const regForm = document.getElementById('auth-register-form');
    const recForm = document.getElementById('auth-recover-form');
    const tLogin = document.getElementById('tab-login-btn');
    const tReg = document.getElementById('tab-register-btn');
    const tRec = document.getElementById('tab-recover-btn');

    if (loginForm) loginForm.style.display = tab === 'login' ? 'flex' : 'none';
    if (regForm) regForm.style.display = tab === 'register' ? 'flex' : 'none';
    if (recForm) recForm.style.display = tab === 'recover' ? 'flex' : 'none';

    if (tLogin) tLogin.className = tab === 'login' ? 'btn-primary' : 'btn-secondary';
    if (tReg) tReg.className = tab === 'register' ? 'btn-primary' : 'btn-secondary';
    if (tRec) tRec.className = tab === 'recover' ? 'btn-primary' : 'btn-secondary';
    setFeedback('');
  }

  async function checkSessionOnBoot() {
    try {
      const r = await fetch('/api/auth/me', { headers: authHeaders() });
      if (r.ok) {
        const d = await r.json();
        if (d.authenticated && d.user) {
          syncUserWithAuraAndNavbar(d.user);
          return;
        }
      }
      setStoredToken('');
      syncUserWithAuraAndNavbar(null);
    } catch (_) {}
  }

  async function handleLogin() {
    const email = document.getElementById('login-email')?.value || '';
    const password = document.getElementById('login-password')?.value || '';
    const mfaCode = document.getElementById('login-mfa-code')?.value || '';
    setFeedback('Autenticando com verificação PBKDF2-SHA512...');

    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mfaCode })
      });
      const d = await r.json();
      if (!r.ok) {
        setFeedback(d.error || 'Falha no login.', true);
        return;
      }
      if (d.mfaRequired) {
        const mfaInput = document.getElementById('login-mfa-code');
        if (mfaInput) mfaInput.style.display = 'block';
        setFeedback(d.message || 'Digite seu código 2FA de 6 dígitos.', false);
        return;
      }
      setStoredToken(d.token);
      syncUserWithAuraAndNavbar(d.user);
      setFeedback(`✓ Bem-vindo(a) de volta, ${d.user.name}! Sessão segura ativa.`);
    } catch (e) {
      setFeedback('Erro de conexão: ' + e.message, true);
    }
  }

  async function handleRegister() {
    const name = document.getElementById('reg-name')?.value || '';
    const email = document.getElementById('reg-email')?.value || '';
    const password = document.getElementById('reg-password')?.value || '';
    const company = document.getElementById('reg-company')?.value || '';
    const learningStyle = document.getElementById('reg-style')?.value || 'Visual, Empático e Prático';
    const lgpdConsent = Boolean(document.getElementById('reg-lgpd')?.checked);

    if (!lgpdConsent) {
      setFeedback('É necessário confirmar o consentimento de proteção de dados LGPD/GDPR.', true);
      return;
    }

    setFeedback('Criando conta criptografada e provisionando agente AURA...');
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, company, learningStyle, lgpdConsent })
      });
      const d = await r.json();
      if (!r.ok) {
        setFeedback(d.error || 'Não foi possível concluir o cadastro.', true);
        return;
      }
      setStoredToken(d.token);
      syncUserWithAuraAndNavbar(d.user);
      setFeedback(`✓ Conta criada com sucesso, ${d.user.name}! Sincronizada com AURA e Governança C2.`);
    } catch (e) {
      setFeedback('Erro ao registrar: ' + e.message, true);
    }
  }

  async function handleLogout(allDevices = false) {
    const endpoint = allDevices ? '/api/auth/logout-all' : '/api/auth/logout';
    try {
      await fetch(endpoint, { method: 'POST', headers: authHeaders() });
    } catch (_) {}
    setStoredToken('');
    syncUserWithAuraAndNavbar(null);
    switchAuthTab('login');
    setFeedback(allDevices ? '✓ Todas as sessões foram encerradas com segurança.' : '✓ Logout realizado com segurança.');
  }

  async function handleToggleMfa() {
    if (!currentUser) return;
    try {
      const r = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ toggleMfa: !currentUser.mfaEnabled })
      });
      const d = await r.json();
      if (r.ok && d.user) {
        syncUserWithAuraAndNavbar(d.user);
        setFeedback(
          d.user.mfaEnabled
            ? `✓ 2FA/MFA Ativado! Seu PIN de segurança 2FA é: ${d.mfaPinPreview}`
            : '✓ 2FA/MFA Desativado.'
        );
      }
    } catch (e) {
      setFeedback(e.message, true);
    }
  }

  async function handleExportLgpd() {
    try {
      const r = await fetch('/api/auth/export-lgpd', { headers: authHeaders() });
      if (!r.ok) return;
      const d = await r.json();
      const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus_lgpd_portability_${(currentUser?.id || 'user')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setFeedback('✓ Pacote de Portabilidade LGPD assinado (HMAC-SHA256) exportado!');
    } catch (e) {
      setFeedback(e.message, true);
    }
  }

  async function handleRequestRecovery() {
    const email = document.getElementById('rec-email')?.value || '';
    try {
      const r = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const d = await r.json();
      if (!r.ok) {
        setFeedback(d.error || 'Erro ao solicitar código.', true);
        return;
      }
      const stepEl = document.getElementById('rec-reset-step');
      if (stepEl) stepEl.style.display = 'flex';
      const codeInput = document.getElementById('rec-code');
      if (codeInput) codeInput.value = d.recoveryCode;
      setFeedback(`✓ Código criptográfico gerado (válido por 15 min): ${d.recoveryCode}`);
    } catch (e) {
      setFeedback(e.message, true);
    }
  }

  async function handleConfirmRecovery() {
    const email = document.getElementById('rec-email')?.value || '';
    const recoveryCode = document.getElementById('rec-code')?.value || '';
    const newPassword = document.getElementById('rec-new-pass')?.value || '';
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, recoveryCode, newPassword })
      });
      const d = await r.json();
      if (!r.ok) {
        setFeedback(d.error || 'Falha ao redefinir senha.', true);
        return;
      }
      switchAuthTab('login');
      const loginEmail = document.getElementById('login-email');
      if (loginEmail) loginEmail.value = email;
      setFeedback('✓ Senha redefinida com sucesso! Faça login com sua nova senha.');
    } catch (e) {
      setFeedback(e.message, true);
    }
  }

  function init() {
    const modal = document.getElementById('auth-modal');
    const navBtn = document.getElementById('nav-auth-btn');
    const closeBtn = document.getElementById('auth-modal-close');

    navBtn?.addEventListener('click', () => {
      modal?.classList.add('open');
      checkSessionOnBoot();
    });
    closeBtn?.addEventListener('click', () => modal?.classList.remove('open'));
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });

    document.getElementById('tab-login-btn')?.addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('tab-register-btn')?.addEventListener('click', () => switchAuthTab('register'));
    document.getElementById('tab-recover-btn')?.addEventListener('click', () => switchAuthTab('recover'));

    document.getElementById('auth-login-submit')?.addEventListener('click', handleLogin);
    document.getElementById('auth-register-submit')?.addEventListener('click', handleRegister);
    document.getElementById('acct-logout-btn')?.addEventListener('click', () => handleLogout(false));
    document.getElementById('acct-logout-all-btn')?.addEventListener('click', () => handleLogout(true));
    document.getElementById('acct-toggle-mfa-btn')?.addEventListener('click', handleToggleMfa);
    document.getElementById('acct-export-lgpd-btn')?.addEventListener('click', handleExportLgpd);
    document.getElementById('auth-recover-request')?.addEventListener('click', handleRequestRecovery);
    document.getElementById('auth-recover-confirm')?.addEventListener('click', handleConfirmRecovery);

    checkSessionOnBoot();
  }

  return { init, get currentUser() { return currentUser; } };
})();

window.AuthUI = AuthUI;
document.addEventListener('DOMContentLoaded', () => AuthUI.init());
