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
    if (!msg) {
      el.className = 'auth-feedback-box';
      el.textContent = '';
      return;
    }
    el.className = `auth-feedback-box ${isError ? 'error' : 'success'}`;
    el.innerHTML = `<span>${isError ? '⚠️' : '✓'}</span> <span>${escapeHtml(msg)}</span>`;
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /* --- Interactive Password Strength Meter & Entropy Calculator --- */
  function evaluatePasswordStrength(password) {
    if (!password) return { score: 0, text: 'Mínimo 6 caracteres', entropy: 0, color: 'transparent' };

    let pool = 0;
    if (/[a-z]/.test(password)) pool += 26;
    if (/[A-Z]/.test(password)) pool += 26;
    if (/[0-9]/.test(password)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(password)) pool += 33;

    // Shannon Entropy in bits
    const entropy = Math.round(password.length * (pool > 0 ? Math.log2(pool) : 0));

    let score = 0;
    if (password.length >= 6) score = 1;
    if (password.length >= 8 && pool >= 36) score = 2;
    if (password.length >= 10 && pool >= 62) score = 3;
    if (password.length >= 12 && pool >= 85) score = 4;

    const levels = [
      { text: 'Muito curta', color: '#ef4444' },
      { text: 'Fraca (adicione números/símbolos)', color: '#ef4444' },
      { text: 'Média (adicione maiúsculas)', color: '#f59e0b' },
      { text: 'Forte (alta segurança)', color: '#10b981' },
      { text: 'Grau Quântico Soberano', color: '#00f5ff' }
    ];

    return {
      score,
      text: levels[score].text,
      color: levels[score].color,
      entropy
    };
  }

  function updatePasswordMeter(password) {
    const meterBars = document.querySelectorAll('.auth-pwd-bar-seg');
    const statusText = document.getElementById('pwd-status-text');
    const entropyText = document.getElementById('pwd-entropy-text');

    const result = evaluatePasswordStrength(password);

    meterBars.forEach((bar, idx) => {
      if (idx < result.score) {
        bar.style.background = result.color;
        bar.style.boxShadow = `0 0 8px ${result.color}66`;
      } else {
        bar.style.background = 'rgba(255, 255, 255, 0.08)';
        bar.style.boxShadow = 'none';
      }
    });

    if (statusText) {
      statusText.textContent = result.text;
      statusText.style.color = result.color;
    }
    if (entropyText) {
      entropyText.textContent = result.entropy > 0 ? `Entropia: ${result.entropy} bits` : '';
    }
  }

  function checkPasswordMatch() {
    const pass = document.getElementById('reg-password')?.value || '';
    const confirm = document.getElementById('reg-password-confirm')?.value || '';
    const matchEl = document.getElementById('pwd-match-status');
    const confirmInput = document.getElementById('reg-password-confirm');

    if (!confirm) {
      if (matchEl) matchEl.textContent = '';
      if (confirmInput) confirmInput.style.borderColor = 'rgba(255, 255, 255, 0.14)';
      return;
    }

    if (pass === confirm) {
      if (matchEl) {
        matchEl.textContent = '✓ Senhas conferem';
        matchEl.style.color = '#10b981';
      }
      if (confirmInput) confirmInput.style.borderColor = '#10b981';
    } else {
      if (matchEl) {
        matchEl.textContent = '⚠️ As senhas não coincidem';
        matchEl.style.color = '#ef4444';
      }
      if (confirmInput) confirmInput.style.borderColor = '#ef4444';
    }
  }

  /* --- Toggle Password Visibility (Eye Icon) --- */
  function togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';

    const eyeOpen = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeSlash = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    if (btnEl) btnEl.innerHTML = isPass ? eyeSlash : eyeOpen;
  }

  function syncUserWithAuraAndNavbar(user) {
    currentUser = user || null;
    const navBtn = document.getElementById('nav-auth-btn');
    const mobileAuthBtn = document.getElementById('mobile-auth-btn');
    const guestView = document.getElementById('auth-guest-view');
    const userView = document.getElementById('auth-user-view');

    if (user) {
      const firstName = user.name.split(' ')[0];
      if (navBtn) {
        navBtn.innerHTML = `🟢 ${escapeHtml(firstName)} <small style="opacity:0.8">[Conta]</small>`;
      }
      if (mobileAuthBtn) {
        mobileAuthBtn.innerHTML = `🟢 ${escapeHtml(firstName)}`;
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
        mfaBtn.style.borderColor = user.mfaEnabled ? 'var(--emerald, #10b981)' : '';
      }
      if (sessCount) sessCount.textContent = String((user.activeSessions || []).length || 1);
      if (sessList) {
        sessList.innerHTML = (user.activeSessions || []).map(s =>
          `<div>• [${s.sessionId.slice(0, 11)}] IP ${s.ip} — ${(s.lastActiveAt || '').slice(0, 19).replace('T', ' ')}</div>`
        ).join('');
      }

      const adminLinkRow = document.getElementById('acct-admin-link-row');
      if (adminLinkRow) {
        const isAdmin = user.role === 'OWNER' || user.role === 'ADMIN' || (user.email && user.email.toLowerCase().includes('admin'));
        adminLinkRow.style.display = isAdmin ? 'block' : 'none';
      }

      const auraNameInput = document.getElementById('aura-user-name');
      if (auraNameInput) {
        auraNameInput.value = firstName;
      }
    } else {
      const signInText = 'Entrar / Criar Conta';
      if (navBtn) navBtn.textContent = '👤 ' + signInText;
      if (mobileAuthBtn) mobileAuthBtn.textContent = '👤 Entrar';
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

    if (tLogin) tLogin.className = `auth-tab-btn ${tab === 'login' ? 'active' : ''}`;
    if (tReg) tReg.className = `auth-tab-btn ${tab === 'register' ? 'active' : ''}`;
    if (tRec) tRec.className = `auth-tab-btn ${tab === 'recover' ? 'active' : ''}`;
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
        const mfaGroup = document.getElementById('login-mfa-group');
        if (mfaGroup) mfaGroup.style.display = 'flex';
        setFeedback(d.message || 'Digite seu código 2FA de 6 dígitos.', false);
        return;
      }
      setStoredToken(d.token);
      syncUserWithAuraAndNavbar(d.user);
      setFeedback(`✓ Bem-vindo(a), ${d.user.name}! Sessão segura ativa.`);
      setTimeout(() => closeModal(), 1200);
    } catch (e) {
      setFeedback('Erro de conexão: ' + e.message, true);
    }
  }

  async function handleRegister() {
    const name = document.getElementById('reg-name')?.value || '';
    const email = document.getElementById('reg-email')?.value || '';
    const password = document.getElementById('reg-password')?.value || '';
    const confirm = document.getElementById('reg-password-confirm')?.value || '';
    const company = document.getElementById('reg-company')?.value || '';
    const learningStyle = document.getElementById('reg-style')?.value || 'Visual, Empático e Prático';
    const lgpdConsent = Boolean(document.getElementById('reg-lgpd')?.checked);

    if (name.trim().length < 2) {
      setFeedback('Por favor, informe seu nome completo (mínimo 2 caracteres).', true);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFeedback('Por favor, informe um endereço de e-mail corporativo ou pessoal válido.', true);
      return;
    }
    if (password.length < 6) {
      setFeedback('A senha deve ter no mínimo 6 caracteres para proteção criptográfica.', true);
      return;
    }
    if (confirm && password !== confirm) {
      setFeedback('As senhas digitadas não coincidem. Verifique a confirmação.', true);
      return;
    }
    if (!lgpdConsent) {
      setFeedback('É necessário confirmar o consentimento de proteção de dados LGPD/GDPR.', true);
      return;
    }

    setFeedback('Gerando chaves criptográficas PBKDF2-SHA512 e criando identidade...');
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
      setFeedback(`✓ Identidade soberana criada com sucesso, ${d.user.name}! Sincronizada com AURA.`);
      setTimeout(() => closeModal(), 1400);
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
        body: JSON.stringify({ mfaEnabled: !currentUser.mfaEnabled })
      });
      const d = await r.json();
      if (r.ok && d.user) {
        syncUserWithAuraAndNavbar(d.user);
        setFeedback(d.user.mfaEnabled ? '✓ 2FA/MFA ativado com sucesso!' : '2FA/MFA desativado.');
      }
    } catch (e) {
      setFeedback('Falha ao alternar 2FA: ' + e.message, true);
    }
  }

  async function handleExportLGPD() {
    try {
      const r = await fetch('/api/auth/export-lgpd', { headers: authHeaders() });
      if (!r.ok) {
        setFeedback('Erro ao exportar dados.', true);
        return;
      }
      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus_identidade_lgpd_${Date.now()}.json`;
      a.click();
      setFeedback('✓ Pacote de dados LGPD exportado com sucesso.');
    } catch (e) {
      setFeedback('Falha no download LGPD: ' + e.message, true);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('ATENÇÃO: Deseja purgar sua conta e todas as memórias com base no Direito ao Esquecimento (LGPD Art. 18)? Essa ação é irreversível.')) {
      return;
    }
    try {
      const r = await fetch('/api/auth/account', { method: 'DELETE', headers: authHeaders() });
      if (r.ok) {
        setStoredToken('');
        syncUserWithAuraAndNavbar(null);
        closeModal();
        alert('Conta e dados criptográficos purgados definitivamente da plataforma.');
      }
    } catch (e) {
      setFeedback('Falha ao excluir conta: ' + e.message, true);
    }
  }

  async function handleRecoverRequest() {
    const email = document.getElementById('rec-email')?.value || '';
    if (!email) {
      setFeedback('Informe seu e-mail para receber o código.', true);
      return;
    }
    setFeedback('Gerando código de recuperação criptográfica...');
    try {
      const r = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const d = await r.json();
      if (!r.ok) {
        setFeedback(d.error || 'Falha ao solicitar código.', true);
        return;
      }
      const resetStep = document.getElementById('rec-reset-step');
      if (resetStep) resetStep.style.display = 'flex';
      setFeedback(`✓ Código gerado: ${d.code} (Em produção real seria enviado ao e-mail). Digite abaixo.`);
    } catch (e) {
      setFeedback('Erro: ' + e.message, true);
    }
  }

  async function handleRecoverConfirm() {
    const email = document.getElementById('rec-email')?.value || '';
    const code = document.getElementById('rec-code')?.value || '';
    const newPassword = document.getElementById('rec-new-pass')?.value || '';

    if (!code || !newPassword) {
      setFeedback('Informe o código e a nova senha.', true);
      return;
    }
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });
      const d = await r.json();
      if (!r.ok) {
        setFeedback(d.error || 'Falha ao redefinir.', true);
        return;
      }
      setFeedback('✓ Senha alterada com sucesso! Faça login com a nova senha.');
      setTimeout(() => switchAuthTab('login'), 1500);
    } catch (e) {
      setFeedback('Erro: ' + e.message, true);
    }
  }

  function openModal(tab = 'register') {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
    if (currentUser) {
      syncUserWithAuraAndNavbar(currentUser);
    } else {
      switchAuthTab(tab);
    }
  }

  function closeModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
    setFeedback('');
  }

  function init() {
    // Nav Button listeners
    const navBtn = document.getElementById('nav-auth-btn');
    if (navBtn) navBtn.addEventListener('click', () => openModal(currentUser ? 'login' : 'register'));

    const mobileAuthBtn = document.getElementById('mobile-auth-btn');
    if (mobileAuthBtn) mobileAuthBtn.addEventListener('click', () => openModal(currentUser ? 'login' : 'register'));

    // Modal Close
    const closeBtn = document.getElementById('auth-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const modalBackdrop = document.getElementById('auth-modal');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
      });
    }

    // Tabs
    document.getElementById('tab-login-btn')?.addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('tab-register-btn')?.addEventListener('click', () => switchAuthTab('register'));
    document.getElementById('tab-recover-btn')?.addEventListener('click', () => switchAuthTab('recover'));

    // Password strength meter live input
    const regPass = document.getElementById('reg-password');
    if (regPass) {
      regPass.addEventListener('input', (e) => {
        updatePasswordMeter(e.target.value);
        checkPasswordMatch();
      });
    }

    const regPassConfirm = document.getElementById('reg-password-confirm');
    if (regPassConfirm) {
      regPassConfirm.addEventListener('input', checkPasswordMatch);
    }

    // Eye toggles
    document.getElementById('toggle-login-pass')?.addEventListener('click', function () {
      togglePasswordVisibility('login-password', this);
    });
    document.getElementById('toggle-reg-pass')?.addEventListener('click', function () {
      togglePasswordVisibility('reg-password', this);
    });
    document.getElementById('toggle-confirm-pass')?.addEventListener('click', function () {
      togglePasswordVisibility('reg-password-confirm', this);
    });

    // Submits
    document.getElementById('auth-login-submit')?.addEventListener('click', handleLogin);
    document.getElementById('auth-register-submit')?.addEventListener('click', handleRegister);
    document.getElementById('auth-recover-request')?.addEventListener('click', handleRecoverRequest);
    document.getElementById('auth-recover-confirm')?.addEventListener('click', handleRecoverConfirm);

    // Profile Actions
    document.getElementById('acct-logout-btn')?.addEventListener('click', () => handleLogout(false));
    document.getElementById('acct-logout-all-btn')?.addEventListener('click', () => handleLogout(true));
    document.getElementById('acct-toggle-mfa-btn')?.addEventListener('click', handleToggleMfa);
    document.getElementById('acct-export-lgpd-btn')?.addEventListener('click', handleExportLGPD);
    document.getElementById('acct-delete-btn')?.addEventListener('click', handleDeleteAccount);

    checkSessionOnBoot();
  }

  return {
    init,
    openModal,
    closeModal,
    getCurrentUser: () => currentUser,
    checkSessionOnBoot
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  AuthUI.init();
});
