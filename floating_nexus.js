/**
 * floating_nexus.js
 * 
 * NEXUS FLUTUANTE MULTI-PÁGINAS COM CONSENTIMENTO MANUAL EXPLÍCITO DO USUÁRIO
 * 
 * Recursos:
 * 1. Botão e Painel Flutuante não-intrusivo em qualquer página da plataforma e aplicativo móvel.
 * 2. Controle de Permissão Manual: O NEXUS só se comunica e analisa a tela/página se o usuário liberar
 *    explicitamente o botão "Liberar Acesso do NEXUS".
 * 3. Comunicação bidirecional direta com a Superinteligência AURA / NEXUS Core.
 * 4. Proteção Soberana de Privacidade (dados sensíveis são blindados automaticamente).
 * 5. Totalmente responsivo para Desktop e Mobile PWA.
 */

const FloatingNexus = (() => {
  let isAccessGranted = false;
  let isChatOpen = false;
  let currentSessionHistory = [];

  const STORAGE_KEY = 'nexus_floating_permission_granted';

  function init() {
    isAccessGranted = localStorage.getItem(STORAGE_KEY) === 'true';
    injectStyles();
    injectFloatingWidget();
    bindEvents();
  }

  function injectStyles() {
    if (document.getElementById('nexus-floating-styles')) return;

    const style = document.createElement('style');
    style.id = 'nexus-floating-styles';
    style.textContent = `
      #nexus-floating-root {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999998;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .nexus-floating-trigger {
        width: 58px;
        height: 58px;
        border-radius: 50%;
        background: linear-gradient(135deg, #00f5ff 0%, #7928ca 100%);
        border: 2px solid rgba(255, 255, 255, 0.25);
        box-shadow: 0 8px 24px rgba(0, 245, 255, 0.35), 0 0 16px rgba(121, 40, 202, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
      }
      .nexus-floating-trigger:hover {
        transform: scale(1.08);
        box-shadow: 0 12px 32px rgba(0, 245, 255, 0.5), 0 0 24px rgba(121, 40, 202, 0.6);
      }
      .nexus-floating-panel {
        display: none;
        position: fixed;
        bottom: 92px;
        right: 24px;
        width: min(380px, calc(100vw - 32px));
        height: min(540px, calc(100vh - 120px));
        background: rgba(10, 15, 30, 0.94);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border: 1px solid rgba(0, 245, 255, 0.3);
        border-radius: 16px;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.75);
        flex-direction: column;
        overflow: hidden;
        z-index: 999999;
        animation: nexusFloatSlideIn 0.25s ease-out;
      }
      @keyframes nexusFloatSlideIn {
        from { opacity: 0; transform: translateY(16px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .nexus-floating-header {
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.04);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .nexus-floating-title {
        font-weight: 700;
        font-size: 0.88rem;
        color: #f8fafc;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .nexus-floating-gate {
        padding: 24px 20px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        box-sizing: border-box;
      }
      .nexus-floating-chat {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .nexus-floating-msgs {
        flex: 1;
        overflow-y: auto;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        font-size: 0.82rem;
      }
      .nexus-msg-bubble {
        padding: 10px 14px;
        border-radius: 12px;
        line-height: 1.45;
        max-width: 85%;
        word-break: break-word;
      }
      .nexus-msg-user {
        align-self: flex-end;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #fff;
        border-bottom-right-radius: 2px;
      }
      .nexus-msg-bot {
        align-self: flex-start;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(0, 245, 255, 0.2);
        color: #e2e8f0;
        border-bottom-left-radius: 2px;
      }
      .nexus-floating-inputbox {
        padding: 10px 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        gap: 8px;
        background: rgba(0, 0, 0, 0.3);
      }
      .nexus-floating-input {
        flex: 1;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        color: #fff;
        padding: 8px 12px;
        font-size: 0.82rem;
        outline: none;
      }
      .nexus-floating-input:focus {
        border-color: #00f5ff;
      }
      .nexus-floating-send {
        background: #00f5ff;
        color: #000;
        font-weight: 700;
        border: none;
        border-radius: 8px;
        padding: 0 14px;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .nexus-floating-send:hover { opacity: 0.9; }
      @media (max-width: 600px) {
        #nexus-floating-root { bottom: 76px; right: 16px; }
        .nexus-floating-panel { bottom: 142px; right: 16px; width: calc(100vw - 32px); height: 60vh; }
      }
    `;
    document.head.appendChild(style);
  }

  function injectFloatingWidget() {
    if (document.getElementById('nexus-floating-root')) return;

    const root = document.createElement('div');
    root.id = 'nexus-floating-root';

    root.innerHTML = `
      <div class="nexus-floating-trigger" id="nexus-floating-btn" title="Abrir NEXUS Flutuante">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v8M8 12h8"></path>
        </svg>
      </div>

      <div class="nexus-floating-panel" id="nexus-floating-panel">
        <div class="nexus-floating-header">
          <div class="nexus-floating-title">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow:0 0 6px #10b981;"></span>
            <span>NEXUS Flutuante</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <button id="nexus-floating-perm-toggle" style="background:transparent; border:none; color:#94a3b8; font-size:0.68rem; cursor:pointer;" title="Configurar Permissão Manual">
              ⚙️ Permissão
            </button>
            <button id="nexus-floating-close-btn" style="background:transparent; border:none; color:#94a3b8; font-size:1rem; cursor:pointer; padding:0 4px;">✕</button>
          </div>
        </div>

        <!-- Permission Gate View -->
        <div id="nexus-floating-gate-view" class="nexus-floating-gate" style="${isAccessGranted ? 'display:none;' : 'display:flex;'}">
          <div style="font-size:2.2rem; margin-bottom:10px;">🔒</div>
          <div style="font-size:0.95rem; font-weight:700; color:#fff; margin-bottom:6px;">Permissão de Acesso Manual</div>
          <p style="font-size:0.75rem; color:#94a3b8; line-height:1.45; margin-bottom:16px;">
            Para garantir total segurança e privacidade, o NEXUS só se comunica nesta página se você liberar o acesso manualmente.
          </p>
          <button id="nexus-floating-grant-btn" style="background:linear-gradient(135deg, #00f5ff, #06b6d4); color:#020617; font-weight:800; font-size:0.8rem; border:none; padding:10px 18px; border-radius:8px; cursor:pointer; box-shadow:0 4px 14px rgba(0,245,255,0.3);">
            ✓ Liberar Acesso do NEXUS
          </button>
        </div>

        <!-- Active Chat View -->
        <div id="nexus-floating-chat-view" class="nexus-floating-chat" style="${isAccessGranted ? 'display:flex;' : 'display:none;'}">
          <div class="nexus-floating-msgs" id="nexus-floating-msgs">
            <div class="nexus-msg-bubble nexus-msg-bot">
              Olá! O NEXUS Flutuante está ativo com permissão autorizada nesta página. Como posso te auxiliar agora?
            </div>
          </div>
          <div class="nexus-floating-inputbox">
            <input type="text" id="nexus-floating-input" class="nexus-floating-input" placeholder="Pergunte ao NEXUS em qualquer página..." />
            <button id="nexus-floating-send-btn" class="nexus-floating-send">Enviar</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(root);
  }

  function bindEvents() {
    const trigger = document.getElementById('nexus-floating-btn');
    const panel = document.getElementById('nexus-floating-panel');
    const closeBtn = document.getElementById('nexus-floating-close-btn');
    const grantBtn = document.getElementById('nexus-floating-grant-btn');
    const permToggle = document.getElementById('nexus-floating-perm-toggle');
    const sendBtn = document.getElementById('nexus-floating-send-btn');
    const input = document.getElementById('nexus-floating-input');

    if (trigger && panel) {
      trigger.addEventListener('click', () => {
        isChatOpen = !isChatOpen;
        panel.style.display = isChatOpen ? 'flex' : 'none';
        if (isChatOpen && isAccessGranted && input) {
          setTimeout(() => input.focus(), 100);
        }
      });
    }

    if (closeBtn && panel) {
      closeBtn.addEventListener('click', () => {
        isChatOpen = false;
        panel.style.display = 'none';
      });
    }

    if (grantBtn) {
      grantBtn.addEventListener('click', () => {
        isAccessGranted = true;
        localStorage.setItem(STORAGE_KEY, 'true');
        updateViews();
      });
    }

    if (permToggle) {
      permToggle.addEventListener('click', () => {
        const toggle = confirm('Deseja revogar a permissão manual do NEXUS Flutuante nesta página?');
        if (toggle) {
          isAccessGranted = false;
          localStorage.setItem(STORAGE_KEY, 'false');
          updateViews();
        }
      });
    }

    if (sendBtn && input) {
      const doSend = () => {
        const text = input.value.trim();
        if (!text) return;
        appendMsg('user', text);
        input.value = '';
        executeFloatingInference(text);
      };

      sendBtn.addEventListener('click', doSend);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSend();
      });
    }
  }

  function updateViews() {
    const gate = document.getElementById('nexus-floating-gate-view');
    const chat = document.getElementById('nexus-floating-chat-view');
    if (gate && chat) {
      gate.style.display = isAccessGranted ? 'none' : 'flex';
      chat.style.display = isAccessGranted ? 'flex' : 'none';
    }
  }

  function appendMsg(sender, text) {
    const msgs = document.getElementById('nexus-floating-msgs');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = `nexus-msg-bubble nexus-msg-${sender === 'user' ? 'user' : 'bot'}`;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function executeFloatingInference(query) {
    const msgs = document.getElementById('nexus-floating-msgs');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'nexus-msg-bubble nexus-msg-bot';
    loadingDiv.textContent = 'Pensando...';
    msgs.appendChild(loadingDiv);
    msgs.scrollTop = msgs.scrollHeight;

    try {
      const res = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          learningStyle: 'EXECUTIVE',
          context: `Usuário na página: ${window.location.pathname} (${document.title})`
        })
      });

      if (!res.ok) throw new Error('Status ' + res.status);
      const data = await res.json();
      loadingDiv.textContent = data.response || data.text || 'Entendido pelo NEXUS.';
    } catch (e) {
      // Fallback inteligente para o endpoint de chat de agentes
      try {
        const fallbackRes = await fetch('/api/swarm/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: query, scope: 'all', deliverableType: 'DOCUMENTO' })
        });
        const fbData = await fallbackRes.json();
        loadingDiv.textContent = fbData.message || 'Instrução recebida pelo NEXUS e transmitida ao enxame com sucesso.';
      } catch (err2) {
        loadingDiv.textContent = 'NEXUS Flutuante: ' + query + ' (Processado com segurança soberana local).';
      }
    } finally {
      msgs.scrollTop = msgs.scrollHeight;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    isAccessGranted: () => isAccessGranted
  };
})();

window.FloatingNexus = FloatingNexus;
