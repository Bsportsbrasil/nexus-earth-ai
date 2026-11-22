/**
 * activation_admin_ui.js
 *
 * Controlador Exclusivo Admin C2 (Aba 15 — Ativação Comercial Real):
 * Gerencia com total segurança:
 * 1. Livro-Razão Real de Receita Confirmada (/api/admin/revenue-ledger)
 * 2. Credenciais do Gateway Oficial Mercado Pago / Asaas + Paywall (/api/admin/vault-config)
 * 3. Cadastro e Gestão de Ofertas Reais Mercado Livre (meli.la) (/api/admin/ml-offers)
 * 4. Bot Automático do Telegram 24/7 (/api/admin/telegram/broadcast)
 */

window.ActivationAdminUI = (function () {
  const TOKEN_KEY = 'nexus_admin_token';

  function getToken() {
    try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch (_) { return ''; }
  }

  function adminFetch(url, opts = {}) {
    const token = getToken();
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
      headers['x-nexus-admin-key'] = token;
    }
    return fetch(url, Object.assign({}, opts, { headers }));
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtBRL(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function setStatus(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  async function loadAll() {
    if (!getToken()) return;
    await Promise.all([loadRevenueLedger(), loadVaultStatus(), loadMlOffers()]);
  }

  async function loadRevenueLedger() {
    try {
      const r = await adminFetch('/api/admin/revenue-ledger');
      if (!r.ok) return;
      const d = await r.json();
      const revEl = document.getElementById('act-kpi-revenue');
      const cntEl = document.getElementById('act-kpi-approved');
      const gwEl = document.getElementById('act-kpi-gateway');
      const dbEl = document.getElementById('act-kpi-storage');

      if (revEl) revEl.textContent = fmtBRL(d.totalConfirmedRevenueBRL || 0);
      if (cntEl) cntEl.textContent = `${d.approvedCount || 0} pagos / ${d.pendingCount || 0} pendentes`;
      if (gwEl) {
        const active = d.gateway?.activeProvider || 'NOT_CONFIGURED';
        gwEl.textContent = active === 'NOT_CONFIGURED' ? 'Aguardando Token' : active;
        gwEl.style.color = active === 'NOT_CONFIGURED' ? '#fbbf24' : '#10b981';
      }
      if (dbEl) dbEl.textContent = d.storage?.mode || 'LOCAL_ATOMIC_FS';

      const listEl = document.getElementById('act-recent-orders');
      if (listEl) {
        const orders = d.recentOrders || [];
        if (!orders.length) {
          listEl.innerHTML = '<div style="color:#64748b; font-size:0.78rem; padding:10px;">Nenhuma transação Pix/Cartão registrada ainda. Configure seu token acima e clique em "Testar Pix Real (R$ 1,00)" para validar seu recebimento!</div>';
        } else {
          listEl.innerHTML = orders.slice(0, 12).map(o => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:1px solid rgba(255,255,255,0.06); font-size:0.76rem; font-family:var(--font-mono); gap:8px; flex-wrap:wrap;">
              <span style="color:#cbd5e1;">${esc(o.orderId)} • ${esc(o.provider)} • ${esc(o.tier)}</span>
              <span style="color:${o.status === 'APPROVED' ? '#10b981' : '#fbbf24'}; font-weight:800;">${fmtBRL(o.amountBRL)} (${esc(o.status)})</span>
            </div>
          `).join('');
        }
      }
    } catch (_) {}
  }

  async function loadVaultStatus() {
    try {
      const r = await adminFetch('/api/admin/vault-config');
      if (!r.ok) return;
      const d = await r.json();
      const k = d.keys || {};

      const setVal = (id, keyObj, isSecret) => {
        const el = document.getElementById(id);
        if (!el || !keyObj) return;
        if (isSecret) {
          el.value = '';
          el.placeholder = keyObj.configured ? `✓ Configurado (${keyObj.display}) — deixe vazio para manter` : 'Cole aqui o token de produção...';
        } else {
          el.value = keyObj.display || '';
        }
      };

      setVal('vault-mp-token', k.MP_ACCESS_TOKEN, true);
      setVal('vault-asaas-key', k.ASAAS_API_KEY, true);
      setVal('vault-asaas-wh', k.ASAAS_WEBHOOK_TOKEN, true);
      setVal('vault-tg-token', k.TELEGRAM_BOT_TOKEN, true);
      setVal('vault-tg-channel', k.TELEGRAM_CHANNEL_ID, false);
      setVal('vault-openai-key', k.OPENAI_API_KEY, true);

      const pwEl = document.getElementById('vault-enforce-paywall');
      if (pwEl && k.NEXUS_ENFORCE_PAYWALL) {
        pwEl.value = k.NEXUS_ENFORCE_PAYWALL.display === '1' ? '1' : '0';
      }
      const limEl = document.getElementById('vault-free-limit');
      if (limEl && k.NEXUS_FREE_DAILY_LIMIT) {
        limEl.value = k.NEXUS_FREE_DAILY_LIMIT.display || '15';
      }
      const intEl = document.getElementById('vault-tg-interval');
      if (intEl && k.TELEGRAM_AUTO_INTERVAL_MIN) {
        intEl.value = k.TELEGRAM_AUTO_INTERVAL_MIN.display || '0';
      }
    } catch (_) {}
  }

  async function saveGatewayConfig() {
    setStatus('act-vault-feedback', '<span style="color:#38bdf8;">⏳ Gravando no cofre .env.local (chmod 600)...</span>');
    try {
      const payload = {
        MP_ACCESS_TOKEN: (document.getElementById('vault-mp-token')?.value || '').trim(),
        ASAAS_API_KEY: (document.getElementById('vault-asaas-key')?.value || '').trim(),
        ASAAS_WEBHOOK_TOKEN: (document.getElementById('vault-asaas-wh')?.value || '').trim(),
        NEXUS_ENFORCE_PAYWALL: document.getElementById('vault-enforce-paywall')?.value || '0',
        NEXUS_FREE_DAILY_LIMIT: document.getElementById('vault-free-limit')?.value || '15',
        OPENAI_API_KEY: (document.getElementById('vault-openai-key')?.value || '').trim()
      };
      const r = await adminFetch('/api/admin/vault-config', { method: 'POST', body: JSON.stringify(payload) });
      const d = await r.json();
      if (r.ok && d.success) {
        setStatus('act-vault-feedback', `<span style="color:#10b981;">✅ Salvo com blindagem chmod 600! Aplicado ao vivo: ${(d.applied || []).join(', ') || 'nenhuma alteração nova'}.</span>`);
        await loadAll();
      } else {
        setStatus('act-vault-feedback', `<span style="color:#f43f5e;">❌ Erro: ${esc(d.error || 'Falha ao salvar')}</span>`);
      }
    } catch (e) {
      setStatus('act-vault-feedback', `<span style="color:#f43f5e;">❌ ${esc(e.message)}</span>`);
    }
  }

  async function saveTelegramConfig() {
    setStatus('act-tg-feedback', '<span style="color:#38bdf8;">⏳ Salvando configuração do Bot Telegram...</span>');
    try {
      const payload = {
        TELEGRAM_BOT_TOKEN: (document.getElementById('vault-tg-token')?.value || '').trim(),
        TELEGRAM_CHANNEL_ID: (document.getElementById('vault-tg-channel')?.value || '').trim(),
        TELEGRAM_AUTO_INTERVAL_MIN: document.getElementById('vault-tg-interval')?.value || '0'
      };
      const r = await adminFetch('/api/admin/vault-config', { method: 'POST', body: JSON.stringify(payload) });
      const d = await r.json();
      if (r.ok && d.success) {
        setStatus('act-tg-feedback', `<span style="color:#10b981;">✅ Bot Telegram salvo e agendador atualizado ao vivo!</span>`);
        await loadVaultStatus();
      } else {
        setStatus('act-tg-feedback', `<span style="color:#f43f5e;">❌ Erro: ${esc(d.error)}</span>`);
      }
    } catch (e) {
      setStatus('act-tg-feedback', `<span style="color:#f43f5e;">❌ ${esc(e.message)}</span>`);
    }
  }

  async function testConnections() {
    setStatus('act-vault-feedback', '<span style="color:#38bdf8;">🧪 Testando conexão oficial com Mercado Pago, Asaas e Telegram...</span>');
    try {
      const r = await adminFetch('/api/admin/vault-test', { method: 'POST', body: '{}' });
      const d = await r.json();
      const res = d.results || {};
      const lines = [
        `Mercado Pago: <strong style="color:${res.mercadoPago?.ok ? '#10b981' : '#fbbf24'}">${esc(res.mercadoPago?.message)}</strong>`,
        `Asaas: <strong style="color:${res.asaas?.ok ? '#10b981' : '#fbbf24'}">${esc(res.asaas?.message)}</strong>`,
        `Telegram: <strong style="color:${res.telegram?.ok ? '#10b981' : '#fbbf24'}">${esc(res.telegram?.message)}</strong>`
      ];
      setStatus('act-vault-feedback', lines.join(' &nbsp;|&nbsp; '));
    } catch (e) {
      setStatus('act-vault-feedback', `<span style="color:#f43f5e;">❌ ${esc(e.message)}</span>`);
    }
  }

  async function testRealPix1Real() {
    setStatus('act-vault-feedback', '<span style="color:#38bdf8;">⚡ Gerando Pix Oficial de teste (R$ 1,00) no gateway...</span>');
    try {
      const r = await adminFetch('/api/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({
          planId: 'aura_plus',
          amountBRL: 1.00,
          payerEmail: 'teste@nexusearthai.com',
          productLabel: 'Teste Real de Liquidação Pix NEXUS (R$ 1,00)'
        })
      });
      const d = await r.json();
      if (!r.ok || !d.success) {
        setStatus('act-vault-feedback', `<span style="color:#fbbf24;">⚠️ ${esc(d.message || d.error)}</span>`);
        return;
      }
      const qrHtml = d.qrCodeBase64
        ? `<div style="margin-top:10px; display:flex; align-items:center; gap:14px; flex-wrap:wrap; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.35); padding:12px; border-radius:10px;">
             <img src="data:image/png;base64,${d.qrCodeBase64}" style="width:120px; height:120px; background:#fff; padding:6px; border-radius:8px;" />
             <div style="text-align:left; font-size:0.78rem; color:#e2e8f0; flex:1; min-width:200px;">
               <div style="color:#10b981; font-weight:800;">✅ Pix Oficial Banco Central Gerado (${esc(d.provider)})!</div>
               <div>Pedido: <code>${esc(d.orderId)}</code> • Valor: <strong>R$ 1,00</strong></div>
               <div style="margin-top:6px;"><button type="button" class="btn-secondary" style="font-size:0.72rem; padding:4px 10px;" onclick="navigator.clipboard.writeText(${JSON.stringify(d.qrCode || '')}); this.textContent='✓ Copiado!'">📋 Copiar Pix Copia e Cola</button></div>
             </div>
           </div>`
        : `<span style="color:#10b981;">✅ Cobrança gerada (${esc(d.orderId)})!</span>`;
      setStatus('act-vault-feedback', qrHtml);
      await loadRevenueLedger();
    } catch (e) {
      setStatus('act-vault-feedback', `<span style="color:#f43f5e;">❌ ${esc(e.message)}</span>`);
    }
  }

  async function loadMlOffers() {
    try {
      const r = await adminFetch('/api/admin/ml-offers');
      if (!r.ok) return;
      const d = await r.json();
      const offers = d.offers || [];
      const verifiedCount = offers.filter(o => o.verifiedLink).length;
      const counterEl = document.getElementById('act-ml-counter');
      if (counterEl) {
        counterEl.innerHTML = `<strong style="color:#10b981;">${verifiedCount} links reais meli.la verificados</strong> / ${offers.length} ofertas na vitrine <a href="/ofertas" target="_blank" style="color:#38bdf8;">/ofertas ↗</a>`;
      }
      const listEl = document.getElementById('act-ml-offers-list');
      if (!listEl) return;
      listEl.innerHTML = offers.slice(0, 30).map(o => `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; padding:10px 12px; background:rgba(2,6,23,0.75); border:1px solid ${o.verifiedLink ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.25)'}; border-radius:10px; flex-wrap:wrap;">
          <div style="flex:1; min-width:220px;">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:3px;">
              <span style="font-size:0.65rem; font-family:var(--font-mono); font-weight:800; padding:2px 6px; border-radius:4px; background:${o.verifiedLink ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)'}; color:${o.verifiedLink ? '#34d399' : '#fbbf24'};">
                ${o.verifiedLink ? '✓ LINK OFICIAL meli.la' : '⚠️ SUBSTITUIR POR LINK meli.la'}
              </span>
              <span style="font-size:0.68rem; color:#94a3b8; font-family:var(--font-mono);">${esc(o.category)} • ${esc(o.currentPrice)}</span>
            </div>
            <div style="font-size:0.82rem; font-weight:700; color:#fff;">${esc(o.title)}</div>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            ${o.verifiedLink ? `<button type="button" class="btn-secondary" style="font-size:0.68rem; padding:4px 8px; color:#38bdf8;" onclick="ActivationAdminUI.broadcastOffer('${esc(o.id)}')">✈️ Telegram</button>` : ''}
            ${o.source === 'ADMIN_VERIFIED' ? `<button type="button" class="btn-secondary" style="font-size:0.68rem; padding:4px 8px; color:#fca5a5;" onclick="ActivationAdminUI.deleteOffer('${esc(o.id)}')">🗑️</button>` : ''}
          </div>
        </div>
      `).join('');
    } catch (_) {}
  }

  async function addMlOffer() {
    const title = (document.getElementById('ml-new-title')?.value || '').trim();
    const affiliateUrl = (document.getElementById('ml-new-url')?.value || '').trim();
    const currentPrice = (document.getElementById('ml-new-price')?.value || '').trim();
    const oldPrice = (document.getElementById('ml-new-oldprice')?.value || '').trim();
    const discount = (document.getElementById('ml-new-discount')?.value || '').trim();
    const category = (document.getElementById('ml-new-category')?.value || 'Ofertas').trim();
    const imageUrl = (document.getElementById('ml-new-image')?.value || '').trim();

    if (!title || !affiliateUrl) {
      setStatus('act-ml-feedback', '<span style="color:#f43f5e;">Preencha o título do produto e o link oficial meli.la / mercadolivre.com/sec/.</span>');
      return;
    }

    try {
      const r = await adminFetch('/api/admin/ml-offers', {
        method: 'POST',
        body: JSON.stringify({ title, affiliateUrl, currentPrice, oldPrice, discount, category, imageUrl })
      });
      const d = await r.json();
      if (r.ok && d.success) {
        setStatus('act-ml-feedback', `<span style="color:#10b981;">✅ Oferta publicada ao vivo em /ofertas! ${d.offer?.verifiedLink ? '(Link oficial meli.la verificado ✓)' : '(Atenção: prefira links encurtados meli.la ou /sec/ para garantir o cookie de comissão!)'}</span>`);
        ['ml-new-title', 'ml-new-url', 'ml-new-price', 'ml-new-oldprice', 'ml-new-discount', 'ml-new-image'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        await loadMlOffers();
      } else {
        setStatus('act-ml-feedback', `<span style="color:#f43f5e;">❌ ${esc(d.error)}</span>`);
      }
    } catch (e) {
      setStatus('act-ml-feedback', `<span style="color:#f43f5e;">❌ ${esc(e.message)}</span>`);
    }
  }

  async function deleteOffer(id) {
    if (!confirm('Remover esta oferta da vitrine /ofertas?')) return;
    await adminFetch('/api/admin/ml-offers/' + encodeURIComponent(id), { method: 'DELETE' });
    await loadMlOffers();
  }

  async function broadcastOffer(offerId = null) {
    setStatus('act-tg-feedback', '<span style="color:#38bdf8;">✈️ Enviando oferta verificada para o Canal do Telegram...</span>');
    try {
      const r = await adminFetch('/api/admin/telegram/broadcast', {
        method: 'POST',
        body: JSON.stringify({ offerId })
      });
      const d = await r.json();
      if (r.ok && d.success) {
        setStatus('act-tg-feedback', `<span style="color:#10b981;">✅ Oferta "${esc(d.offer?.title)}" publicada agora no seu Canal do Telegram!</span>`);
      } else {
        setStatus('act-tg-feedback', `<span style="color:#fbbf24;">⚠️ ${esc(d.message || d.error)}</span>`);
      }
    } catch (e) {
      setStatus('act-tg-feedback', `<span style="color:#f43f5e;">❌ ${esc(e.message)}</span>`);
    }
  }

  function init() {
    const tabBtn = document.querySelector('.c2-tab-btn[data-tab="tab-activation-commerce"]');
    if (tabBtn) {
      tabBtn.addEventListener('click', () => loadAll());
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return {
    loadAll,
    saveGatewayConfig,
    saveTelegramConfig,
    testConnections,
    testRealPix1Real,
    addMlOffer,
    deleteOffer,
    broadcastOffer
  };
})();
