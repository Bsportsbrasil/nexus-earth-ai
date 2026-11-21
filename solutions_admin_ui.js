/**
 * solutions_admin_ui.js
 *
 * Controlador Privado (Exclusivo Admin C2) para a Aba 14:
 * Carrega as 5 páginas detalhadas de Soluções Reais + 3 páginas de Resultados das Ordens
 * exclusivamente via endpoint autenticado GET /api/admin/solutions-page usando o token
 * da sessão administrativa em sessionStorage ('nexus_admin_token').
 */

window.SolutionsAdminUI = (function () {
  const TOKEN_KEY = 'nexus_admin_token';
  let currentRoute = '/solucoes';
  let loadedOnce = false;

  function getAdminToken() {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || '';
    } catch (_) {
      return '';
    }
  }

  function updateActiveButtons(route) {
    const clean = (route || '/solucoes').replace(/\/+$/, '');
    document.querySelectorAll('.admin-sol-nav-btn').forEach(btn => {
      const isMatch = btn.getAttribute('data-route') === clean;
      btn.style.borderColor = isMatch ? '#00f5ff' : 'rgba(255,255,255,0.12)';
      btn.style.background = isMatch ? 'rgba(0,245,255,0.18)' : 'rgba(15,23,42,0.75)';
      btn.style.color = isMatch ? '#00f5ff' : '#cbd5e1';
    });
  }

  async function loadPage(route) {
    const targetRoute = (route || currentRoute || '/solucoes').trim();
    currentRoute = targetRoute;
    updateActiveButtons(targetRoute);

    const frame = document.getElementById('admin-solutions-frame');
    const statusEl = document.getElementById('admin-solutions-status');
    const token = getAdminToken();

    if (!token) {
      if (statusEl) statusEl.textContent = '🔒 Faça login com sua Chave Mestra no painel Admin para visualizar.';
      if (frame) {
        frame.srcdoc = '<!DOCTYPE html><html><body style="background:#030712;color:#fca5a5;font-family:sans-serif;padding:40px;text-align:center;"><h3>🔒 Sessão Administrativa Necessária</h3><p>Desbloqueie o Painel Master C2 com sua Chave Mestra para acessar as páginas privadas de Soluções e Resultados.</p></body></html>';
      }
      return;
    }

    if (statusEl) statusEl.textContent = '⚡ Carregando página privada autenticada (' + targetRoute + ')...';

    try {
      const res = await fetch('/api/admin/solutions-page?route=' + encodeURIComponent(targetRoute), {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token,
          'x-nexus-admin-key': token
        }
      });

      if (!res.ok) {
        const errText = await res.text();
        if (statusEl) statusEl.textContent = '⚠️ Acesso bloqueado (' + res.status + '). Revalide sua sessão Admin.';
        if (frame) {
          frame.srcdoc = '<!DOCTYPE html><html><body style="background:#030712;color:#fca5a5;font-family:sans-serif;padding:40px;text-align:center;"><h3>🔒 Acesso Negado (' + res.status + ')</h3><pre style="color:#94a3b8;white-space:pre-wrap;">' + errText.replace(/</g, '&lt;') + '</pre></body></html>';
        }
        return;
      }

      const html = await res.text();
      if (frame) {
        frame.srcdoc = html;
      }
      loadedOnce = true;
      if (statusEl) statusEl.textContent = '🔒 Modo Privado Autenticado • Página ativa: ' + targetRoute;
    } catch (err) {
      if (statusEl) statusEl.textContent = '❌ Erro ao carregar página privada: ' + err.message;
    }
  }

  function openTab(route) {
    const tabBtn = document.querySelector('.c2-tab-btn[data-tab="tab-solutions-portal"]');
    if (tabBtn) tabBtn.click();
    loadPage(route || '/solucoes');
  }

  function init() {
    // Load when user clicks Tab 14 in sidebar
    const tabBtn = document.querySelector('.c2-tab-btn[data-tab="tab-solutions-portal"]');
    if (tabBtn) {
      tabBtn.addEventListener('click', () => {
        if (!loadedOnce || !getAdminToken()) {
          loadPage(currentRoute);
        }
      });
    }

    // Intercept internal navigation inside the private iframe
    window.addEventListener('message', (event) => {
      if (event && event.data && event.data.type === 'nexus_admin_open_solution' && event.data.route) {
        loadPage(event.data.route);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    loadPage,
    openTab
  };
})();
