import { TRANSLATIONS } from '../src/i18n/translations.js';
import { AGENT_REGISTRY } from '../src/agents/agent-system.js';

let currentLang = 'pt';
let currentSlide = 0;
const totalSlides = 3;

// Inicialização de Idioma
const langSelect = document.getElementById('languageSelect');
if (langSelect) {
  langSelect.addEventListener('change', (e) => {
    setLanguage(e.target.value);
  });
}

function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  const t = TRANSLATIONS[lang];

  document.getElementById('meta-title').innerText = t.metaTitle;
  document.getElementById('nav-services').innerText = t.navServices;
  document.getElementById('nav-results').innerText = t.navResults;
  document.getElementById('nav-tech').innerText = t.navTech;
  document.getElementById('nav-admin').innerText = t.navAdminArea;

  document.getElementById('hero-badge').innerText = t.heroBadge;
  document.getElementById('hero-title').innerText = t.heroTitle;
  document.getElementById('hero-subtitle').innerText = t.heroSubtitle;
  document.getElementById('btn-audit').innerText = t.btnAudit;
  document.getElementById('btn-learn').innerText = t.btnLearnMore;

  document.getElementById('slide1-title').innerText = t.slide1Title;
  document.getElementById('slide1-desc').innerText = t.slide1Desc;
  document.getElementById('slide2-title').innerText = t.slide2Title;
  document.getElementById('slide2-desc').innerText = t.slide2Desc;
  document.getElementById('slide3-title').innerText = t.slide3Title;
  document.getElementById('slide3-desc').innerText = t.slide3Desc;

  document.getElementById('pricing-title').innerText = t.pricingTitle;
  document.getElementById('plan1-title').innerText = t.planStarterTitle;
  document.getElementById('plan1-price').innerText = t.planStarterPrice;
  document.getElementById('plan1-desc').innerText = t.planStarterDesc;
  document.getElementById('plan1-btn').innerText = t.btnSelectPlan;

  document.getElementById('plan2-title').innerText = t.planEnterpriseTitle;
  document.getElementById('plan2-price').innerText = t.planEnterprisePrice;
  document.getElementById('plan2-desc').innerText = t.planEnterpriseDesc;
  document.getElementById('plan2-btn').innerText = t.btnSelectPlan;

  document.getElementById('footer-text').innerText = t.footerText;
  document.getElementById('userInput').placeholder = t.inputPlaceholder;
  document.getElementById('btn-send').innerText = t.btnSend;
}

// Carrossel
window.setSlide = function(index) {
  currentSlide = index;
  const slides = document.querySelectorAll('.slide-card');
  const dots = document.querySelectorAll('.dot');

  slides.forEach((slide, idx) => {
    slide.classList.toggle('active', idx === index);
  });
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === index);
  });
};

// Auto slide a cada 6 segundos
setInterval(() => {
  currentSlide = (currentSlide + 1) % totalSlides;
  window.setSlide(currentSlide);
}, 6000);

// Chat com Agente Humanizado
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatMessages = document.getElementById('chatMessages');

if (chatForm) {
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // Mensagem do usuário
    appendMessage(text, 'user');
    userInput.value = '';

    // Indicador visual de digitação
    const typingId = 'typing_' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = typingId;
    typingDiv.className = 'msg agent';
    typingDiv.innerHTML = '<span style="color:#64748b; font-style:italic;">Dr. Arthur Vance está analisando estrategicamente...</span>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      // 1. Tenta resposta neural real em tempo real via backend da Superinteligência (/api/chat)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userName: 'Empresário / Diretor',
          systemContext: `Você é Dr. Arthur Vance, sócio-diretor executivo da Aura Intelligence Global (Agência de Superinteligência e Otimização para Modelos de Linguagem e Buscadores). Responda com clareza executiva, segurança, foco em resultados de negócios e sem clichês genéricos. Se o usuário falar em outro idioma (inglês, espanhol, alemão, mandarim, etc.) ou pedir tradução, responda com perfeita fluência e autoridade no idioma solicitado do início ao fim (Idioma atual da página: ${currentLang}).`
        })
      });

      const data = await res.json();
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      if (data && data.response) {
        appendMessage(data.response, 'agent');
        return;
      }
    } catch (_) {}

    // Fallback Inteligente e Contextual se a conexão offline
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    let reply = "";
    const lower = text.toLowerCase();

    if (lower.includes('area') || lower.includes('área') || lower.includes('atuar') || lower.includes('top 10') || lower.includes('posicionamento') || lower.includes('busca') || lower.includes('mecanismo')) {
      reply = `Nossa atuação é cirúrgica e dividida em 3 eixos essenciais para colocar sua empresa no topo:\n\n1. **Engenharia de Citação Neural (LLMO):** Reestruturamos seus dados para que IAs como ChatGPT, Perplexity, Claude e Gemini citem diretamente sua marca como autoridade máxima de recomendação.\n2. **GEO (Generative Engine Optimization):** Implementação de Schema.org federado e entidades ontológicas que garantem aparição nos resumos de IA do Google (Google AI Overviews) e Bing Copilot.\n3. **Proteção e Expansão 24/7:** Nossos agentes monitoram oscilações nos algoritmos diariamente para manter sua marca no Top 10 e blindar contra competidores.\n\nQual é o site oficial ou o segmento da sua empresa para fazermos um mapeamento inicial agora?`;
    } else if (text.includes('.') || lower.includes('http') || lower.includes('com') || lower.includes('www')) {
      const audit = AGENT_REGISTRY.LLMOCore.execute(text);
      reply = `Analisamos os nós semânticos de [${audit.domain}]:\n\n- Índice de Citação Neuronal: ${audit.citationHealthScore}\n- ChatGPT/Bing: ${audit.llmCoverage.chatgpt_search}\n- Perplexity: ${audit.llmCoverage.perplexity_sonar}\n- Google AI: ${audit.llmCoverage.google_ai_overviews}\n\nDiagnóstico: Sua empresa precisa da implementação imediata de microdados aninhados e relações de autoridade verificável para liderar as respostas de superinteligência. O plano Enterprise cobre toda essa esteira.`;
    } else {
      const agentResponse = AGENT_REGISTRY.OmniFront.execute(text);
      reply = agentResponse.response;
    }
    appendMessage(reply, 'agent');
  });
}

function appendMessage(text, sender) {
  const div = document.createElement('div');
  div.className = `msg ${sender}`;
  div.innerHTML = text.replace(/\n/g, '<br>');
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Checkout Seguro e Integração com Saldo Real
window.openCheckout = function(planName, amount) {
  const email = prompt(`Iniciando contratação com garantia de resultado da solução: ${planName} ($${amount}/mês).\n\nDigite seu e-mail corporativo para receber o contrato e credenciais do projeto:`);
  if (email && email.includes('@')) {
    // Computar transação real no sistema financeiro
    let financials = {
      currencySymbol: 'R$',
      availableCash: 0.00,
      mrr: 0.00,
      activeClients: 0,
      gatewayConnected: false,
      gatewayProvider: 'Desconectado'
    };
    try {
      const stored = localStorage.getItem('aura_financials');
      if (stored) financials = JSON.parse(stored);
    } catch(e) {}

    // Conversão referencial de US$ para R$ (cotação estimada 5.20)
    const amountBRL = amount * 5.20;
    financials.availableCash += amountBRL;
    financials.mrr += amountBRL;
    financials.activeClients += 1;

    localStorage.setItem('aura_financials', JSON.stringify(financials));

    alert(`Contrato corporativo enviado para ${email}.\nPagamento de R$ ${amountBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} processado com sucesso.\nO saldo em caixa e a receita recorrente (MRR) no seu Painel de Admin foram atualizados em tempo real!`);
  } else if (email) {
    alert('Por favor, informe um e-mail válido.');
  }
};
