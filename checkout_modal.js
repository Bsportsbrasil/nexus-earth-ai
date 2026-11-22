/**
 * checkout_modal.js
 *
 * Modal Público Oficial de Assinatura & Checkout Pix (AURA Plus R$ 29,90 / NEXUS Pro R$ 97,00)
 * - Integra-se ao endpoint real POST /api/payments/create-checkout (Mercado Pago / Asaas)
 * - Exibe QR Code EMVCo Banco Central + Pix Copia e Cola
 * - Faz polling seguro em GET /api/payments/status/:orderId até aprovação automática via Webhook
 */

window.NexusCheckoutModal = (function () {
  let pollTimer = null;
  let currentPlanId = 'aura_plus';

  const PLANS = {
    aura_plus: {
      id: 'aura_plus',
      name: 'AURA Plus',
      price: 'R$ 29,90',
      period: '/mês',
      accent: '#00f5ff',
      badge: 'MAIS POPULAR',
      features: [
        'Conversas ilimitadas com AURA 24/7',
        'Voz Neural ultra-realista em 11 idiomas',
        'Memória afetiva e contextual dedicada',
        'Pesquisa na Web em tempo real'
      ]
    },
    nexus_pro: {
      id: 'nexus_pro',
      name: 'NEXUS Pro',
      price: 'R$ 97,00',
      period: '/mês',
      accent: '#10b981',
      badge: 'EMPRESARIAL',
      features: [
        'Tudo do plano AURA Plus incluso',
        'Orquestração Multi-Agentes DAG + GraphRAG',
        'Estúdio Criativo & Relatórios Executivos',
        'Prioridade máxima de inferência'
      ]
    }
  };

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function ensureDOM() {
    let overlay = document.getElementById('nexus-checkout-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'nexus-checkout-overlay';
    overlay.style.cssText = [
      'display:none', 'position:fixed', 'inset:0', 'z-index:999999',
      'background:rgba(2,6,23,0.88)', 'backdrop-filter:blur(10px)',
      'align-items:center', 'justify-content:center', 'padding:16px',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'
    ].join(';');

    overlay.innerHTML = `
      <div id="nexus-checkout-card" style="width:min(540px,100%);max-height:92vh;overflow-y:auto;background:linear-gradient(160deg,#0b132b,#030712);border:1px solid rgba(0,245,255,0.38);border-radius:18px;padding:24px;color:#f8fafc;box-shadow:0 24px 64px rgba(0,0,0,0.85);position:relative;">
        <button type="button" id="ncm-close-btn" aria-label="Fechar" style="position:absolute;top:14px;right:14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);color:#cbd5e1;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
        <div style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#38bdf8;font-weight:700;margin-bottom:4px;">NEXUS EARTH AI • UPGRADE OFICIAL</div>
        <h3 id="ncm-title" style="margin:0 0 6px;font-size:1.35rem;font-weight:800;color:#fff;">Desbloqueie Acesso Ilimitado</h3>
        <p id="ncm-subtitle" style="margin:0 0 16px;font-size:0.84rem;color:#94a3b8;line-height:1.45;">Pagamento instantâneo via Pix oficial com liberação automática da sua conta em segundos.</p>

        <div id="ncm-plan-selector" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;"></div>

        <div id="ncm-features" style="background:rgba(15,23,42,0.75);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:0.8rem;color:#cbd5e1;line-height:1.6;"></div>

        <div id="ncm-form-area">
          <label for="ncm-email" style="display:block;font-size:0.74rem;color:#94a3b8;margin-bottom:4px;">Seu e-mail para recibo e ativação:</label>
          <input type="email" id="ncm-email" placeholder="voce@email.com" style="width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.18);background:rgba(2,6,23,0.9);color:#fff;font-size:0.86rem;margin-bottom:12px;" />
          <button type="button" id="ncm-generate-btn" style="width:100%;padding:12px 16px;border:none;border-radius:10px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:800;font-size:0.92rem;cursor:pointer;">⚡ Gerar Pix Oficial Agora</button>
        </div>

        <div id="ncm-result-area" style="margin-top:14px;"></div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.getElementById('ncm-close-btn').addEventListener('click', close);
    document.getElementById('ncm-generate-btn').addEventListener('click', generatePix);
    return overlay;
  }

  function renderPlanCards() {
    const wrap = document.getElementById('ncm-plan-selector');
    const featWrap = document.getElementById('ncm-features');
    if (!wrap || !featWrap) return;

    wrap.innerHTML = Object.values(PLANS).map(p => {
      const selected = p.id === currentPlanId;
      return `
        <button type="button" data-plan="${p.id}" style="text-align:left;padding:12px;border-radius:12px;cursor:pointer;background:${selected ? 'rgba(0,245,255,0.12)' : 'rgba(15,23,42,0.65)'};border:2px solid ${selected ? p.accent : 'rgba(255,255,255,0.12)'};color:#fff;transition:all 0.15s;">
          <div style="font-size:0.65rem;font-weight:800;color:${p.accent};letter-spacing:0.06em;">${p.badge}</div>
          <div style="font-size:0.98rem;font-weight:800;margin:2px 0;">${p.name}</div>
          <div style="font-size:1.12rem;font-weight:900;color:${p.accent};">${p.price}<span style="font-size:0.72rem;color:#94a3b8;font-weight:500;">${p.period}</span></div>
        </button>
      `;
    }).join('');

    wrap.querySelectorAll('button[data-plan]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPlanId = btn.dataset.plan;
        renderPlanCards();
      });
    });

    const active = PLANS[currentPlanId] || PLANS.aura_plus;
    featWrap.innerHTML = active.features.map(f => `<div>✓ ${esc(f)}</div>`).join('');
  }

  async function generatePix() {
    stopPolling();
    const resEl = document.getElementById('ncm-result-area');
    const btn = document.getElementById('ncm-generate-btn');
    const email = (document.getElementById('ncm-email')?.value || '').trim();
    if (!resEl) return;

    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Gerando QR Code Pix Oficial...';
    }
    resEl.innerHTML = '';

    try {
      const token = (() => { try { return localStorage.getItem('nexus_session_token') || ''; } catch (_) { return ''; } })();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      const r = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          planId: currentPlanId,
          payerEmail: email || 'cliente@nexusearthai.com'
        })
      });
      const d = await r.json().catch(() => ({}));

      if (!r.ok || !d.success) {
        resEl.innerHTML = `
          <div style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.38);border-radius:10px;padding:12px;font-size:0.82rem;color:#fde68a;line-height:1.45;">
            ⚠️ ${esc(d.setupRequired ? 'O checkout Pix automático está em processo final de ativação. Tente novamente em instantes.' : (d.message || d.error || 'Não foi possível gerar o Pix agora.'))}
          </div>`;
        return;
      }

      const qrImg = d.qrCodeBase64
        ? `<img src="data:image/png;base64,${d.qrCodeBase64}" alt="QR Code Pix" style="width:170px;height:170px;background:#fff;padding:8px;border-radius:12px;margin:0 auto 10px;display:block;" />`
        : '';

      resEl.innerHTML = `
        <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.4);border-radius:12px;padding:16px;text-align:center;">
          <div style="color:#34d399;font-weight:800;font-size:0.9rem;margin-bottom:8px;">✅ Pix Oficial Gerado — Escaneie ou Copie</div>
          ${qrImg}
          <div style="font-size:0.78rem;color:#cbd5e1;margin-bottom:8px;">Pedido <code>${esc(d.orderId)}</code> • Valor: <strong>R$ ${Number(d.amountBRL || 0).toFixed(2).replace('.', ',')}</strong></div>
          <button type="button" id="ncm-copy-pix" style="padding:9px 16px;border-radius:8px;border:none;background:#00f5ff;color:#020617;font-weight:800;font-size:0.82rem;cursor:pointer;">📋 Copiar Código Pix Copia e Cola</button>
          <div id="ncm-poll-status" style="margin-top:10px;font-size:0.76rem;color:#94a3b8;">⏳ Aguardando confirmação automática do banco...</div>
        </div>
      `;

      const copyBtn = document.getElementById('ncm-copy-pix');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(d.qrCode || '').then(() => {
            copyBtn.textContent = '✓ Código Pix Copiado!';
          }).catch(() => {});
        });
      }

      if (d.orderId) {
        pollTimer = setInterval(async () => {
          try {
            const sr = await fetch('/api/payments/status/' + encodeURIComponent(d.orderId));
            if (!sr.ok) return;
            const sd = await sr.json();
            if (sd.status === 'APPROVED') {
              stopPolling();
              const stEl = document.getElementById('ncm-poll-status');
              if (stEl) {
                stEl.innerHTML = '<strong style="color:#10b981;font-size:0.9rem;">🎉 Pagamento confirmado! Seu plano foi liberado automaticamente.</strong>';
              }
            }
          } catch (_) {}
        }, 3500);
      }
    } catch (e) {
      resEl.innerHTML = `<div style="color:#f43f5e;font-size:0.8rem;">Erro de conexão: ${esc(e.message)}</div>`;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '⚡ Gerar Pix Oficial Agora';
      }
    }
  }

  function open(planId = 'aura_plus', customSubtitle = '') {
    currentPlanId = PLANS[planId] ? planId : 'aura_plus';
    const overlay = ensureDOM();
    if (customSubtitle) {
      const sub = document.getElementById('ncm-subtitle');
      if (sub) sub.textContent = customSubtitle;
    }
    const resEl = document.getElementById('ncm-result-area');
    if (resEl) resEl.innerHTML = '';
    renderPlanCards();
    overlay.style.display = 'flex';
  }

  function close() {
    stopPolling();
    const overlay = document.getElementById('nexus-checkout-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  return { open, close };
})();
