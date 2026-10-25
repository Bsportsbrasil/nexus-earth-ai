// Chat with visible thought chain (local simulated responses)
const Chat = (function () {
  const history = [];
  const SYSTEM = 'Você é NEXUS, um assistente de IA brilhante, preciso e honesto. Responda no idioma do usuário, de forma clara e útil. Use parágrafos curtos. Nunca invente fatos; diga quando não souber.';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const now = () => new Date().toTimeString().slice(0, 8);

  function answer(q) {
    const l = q.toLowerCase();
    if (/vale do sil|silicon valley/.test(l))
      return 'Para chegar ao Vale do Silício, o que mais pesa é um portfólio real: projetos publicados, código aberto no GitHub, usuários reais e uma história clara sobre o problema que você resolve. Este próprio projeto pode ser o primeiro item — publique-o, escreva sobre como o construiu e conecte-se com pessoas da área.';
    if (/olá|oi|hello|hi\b/.test(l)) return 'Olá! Sou o NEXUS. Pergunte sobre IA, tecnologia, carreira ou qualquer ideia que queira explorar.';
    if (/ia|ai|intelig/.test(l))
      return 'Inteligência artificial moderna combina grandes redes neurais, dados em escala e técnicas de alinhamento. O próximo salto vem de agentes que planejam, usam ferramentas e verificam o próprio raciocínio — exatamente o que o módulo de Agentes demonstra.';
    return `Analisei sua pergunta sob múltiplas perspectivas. Sobre "${q}": o melhor caminho é decompor o problema, testar hipóteses pequenas rapidamente e iterar com base em evidências. Quer que eu aprofunde algum aspecto?`;
  }
  function addMsg(role, html) {
    const box = document.getElementById('chat-messages');
    const d = document.createElement('div');
    d.className = `chat-msg ${role}-msg`;
    d.innerHTML = `<div class="msg-avatar">${role === 'user' ? 'V' : 'N'}</div>
      <div class="msg-content"><div class="msg-name">${role === 'user' ? 'VOCÊ' : 'NEXUS'}</div>
      <div class="msg-text">${html}</div><div class="msg-time">${now()}</div></div>`;
    box.appendChild(d); box.scrollTop = box.scrollHeight;
    return d.querySelector('.msg-text');
  }
  async function thoughts(q) {
    const steps = ['Parsing intent and language', 'Retrieving related concepts from knowledge graph',
      'Generating candidate responses', 'Critic agent evaluating accuracy', 'Selecting highest-confidence answer'];
    const chain = document.getElementById('thought-chain'), st = document.getElementById('thought-status');
    st.className = 'thought-badge THINKING'; st.textContent = 'THINKING';
    chain.innerHTML = '';
    for (let i = 0; i < steps.length; i++) {
      chain.querySelectorAll('.thought-step').forEach(s => s.classList.remove('active'));
      const s = document.createElement('div');
      s.className = 'thought-step active';
      s.innerHTML = `<div class="step-num">${i + 1}</div><div class="step-text">${steps[i]}</div>`;
      chain.appendChild(s);
      await sleep(450);
    }
    st.className = 'thought-badge'; st.textContent = 'DONE';
  }
  async function send() {
    const inp = document.getElementById('chat-input'), q = inp.value.trim();
    if (!q) return;
    inp.value = '';
    addMsg('user', esc(q));
    window.Metrics && Metrics.boost();
    await thoughts(q);
    const el = addMsg('assistant', '');
    if (window.Gemini && Gemini.hasKey()) {
      history.push({ role: 'user', parts: [{ text: q }] });
      try {
        const full = await Gemini.stream(history, SYSTEM, t => {
          el.innerHTML = esc(t).replace(/\n/g, '<br>') + '<span class="typing-cursor"></span>';
          el.closest('.chat-messages').scrollTop = 1e9;
        });
        el.innerHTML = esc(full).replace(/\n/g, '<br>');
        history.push({ role: 'model', parts: [{ text: full }] });
      } catch (e) {
        history.pop();
        el.classList.add('error');
        el.textContent = 'Erro ao chamar o Gemini: ' + e.message + ' — verifique sua chave em 🔑 API Key.';
      }
      return;
    }
    const txt = answer(q) + '\n\n(Modo demo — conecte sua chave em 🔑 API Key para respostas reais.)';
    for (let i = 0; i <= txt.length; i++) {
      el.innerHTML = esc(txt.slice(0, i)).replace(/\n/g, '<br>') + '<span class="typing-cursor"></span>';
      await sleep(10);
    }
    el.innerHTML = esc(txt).replace(/\n/g, '<br>');
  }
  function init() {
    document.getElementById('chat-send-btn').addEventListener('click', send);
    document.getElementById('chat-input').addEventListener('keydown', e => e.key === 'Enter' && send());
  }
  return { init };
})();
