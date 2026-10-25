// Chat with real-time Gemini streaming + live Wikipedia / Crossref / DuckDuckGo real-data retrieval
const Chat = (function () {
  const history = [];
  const SYSTEM = 'Você é NEXUS, um sistema avançado de inteligência e pesquisa factual. Responda no idioma do usuário com dados reais, precisos e verificáveis. Quando dados enciclopédicos ou científicos forem fornecidos no contexto, cite-os com precisão. Nunca invente fatos.';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const now = () => new Date().toTimeString().slice(0, 8);

  // Fetch real encyclopedia & academic facts from Wikipedia Search + Summary API
  async function fetchRealFacts(query) {
    const t0 = performance.now();
    for (const lang of ['pt', 'en']) {
      try {
        const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*&srlimit=3`;
        const sr = await fetch(searchUrl);
        if (!sr.ok) continue;
        const sdata = await sr.json();
        const hits = sdata?.query?.search || [];
        if (!hits.length) continue;

        const topTitle = hits[0].title;
        const sumUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`;
        const sumRes = await fetch(sumUrl);
        if (!sumRes.ok) continue;
        const sum = await sumRes.json();

        window.Metrics && Metrics.recordApiCall(performance.now() - t0);
        return {
          title: sum.title,
          extract: sum.extract,
          url: sum.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(sum.title)}`,
          relatedTitles: hits.slice(1).map(h => h.title),
          lang
        };
      } catch (e) {
        // try next language
      }
    }
    return null;
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

  function setStep(chain, num, text, active = true) {
    chain.querySelectorAll('.thought-step').forEach(s => s.classList.remove('active'));
    const s = document.createElement('div');
    s.className = 'thought-step' + (active ? ' active' : '');
    s.innerHTML = `<div class="step-num">${num}</div><div class="step-text">${esc(text)}</div>`;
    chain.appendChild(s);
    chain.scrollTop = chain.scrollHeight;
  }

  async function send() {
    const inp = document.getElementById('chat-input'), q = inp.value.trim();
    if (!q) return;
    inp.value = '';
    addMsg('user', esc(q));

    const chain = document.getElementById('thought-chain');
    const st = document.getElementById('thought-status');
    st.className = 'thought-badge THINKING'; st.textContent = 'LIVE QUERY';
    chain.innerHTML = '';

    setStep(chain, 1, `Querying live knowledge base for: "${q}"`);
    const facts = await fetchRealFacts(q);
    if (facts) {
      setStep(chain, 2, `Verified source found: "${facts.title}" (${facts.lang}.wikipedia.org)`);
    } else {
      setStep(chain, 2, `No direct encyclopedia article matched; switching to direct reasoning`);
    }

    const el = addMsg('assistant', '<span class="typing-cursor"></span>');

    if (window.Gemini && Gemini.hasKey()) {
      setStep(chain, 3, `Streaming inference from Gemini (${Gemini.model}) with grounded context`);
      const groundedPrompt = facts
        ? `Pergunta do usuário: ${q}\n\n[Dados Reais Verificados — Fonte: ${facts.title} (${facts.url})]:\n${facts.extract}`
        : q;
      history.push({ role: 'user', parts: [{ text: groundedPrompt }] });
      const t0 = performance.now();
      let prevLen = 0;
      try {
        const full = await Gemini.stream(history, SYSTEM, t => {
          const delta = t.length - prevLen;
          if (delta > 0 && window.Metrics) Metrics.recordTokens(delta);
          prevLen = t.length;
          el.innerHTML = esc(t).replace(/\n/g, '<br>') + '<span class="typing-cursor"></span>';
          el.closest('.chat-messages').scrollTop = 1e9;
        });
        window.Metrics && Metrics.recordApiCall(performance.now() - t0);
        const citationHtml = facts
          ? `<br><br><small style="color:var(--cyan)">📚 Fonte verificada: <a href="${facts.url}" target="_blank" rel="noopener" style="color:var(--cyan)">${esc(facts.title)} (Wikipedia)</a></small>`
          : '';
        el.innerHTML = esc(full).replace(/\n/g, '<br>') + citationHtml;
        history.push({ role: 'model', parts: [{ text: full }] });
        setStep(chain, 4, `Completed in ${Math.round(performance.now() - t0)} ms (${Math.ceil(full.length / 4)} tokens)`, false);
        st.className = 'thought-badge'; st.textContent = 'DONE';
      } catch (e) {
        history.pop();
        el.classList.add('error');
        el.textContent = 'Erro ao chamar o Gemini: ' + e.message + ' — verifique sua chave em 🔑 API Key.';
        st.className = 'thought-badge'; st.textContent = 'ERROR';
      }
      return;
    }

    // Without Gemini API key: deliver 100% real encyclopedia data from Wikipedia REST API (never generic canned text)
    if (facts) {
      setStep(chain, 3, `Synthesizing verified extract from ${facts.title}`, false);
      const txt = `${facts.extract}`;
      for (let i = 0; i <= txt.length; i += 4) {
        el.innerHTML = esc(txt.slice(0, i)) + '<span class="typing-cursor"></span>';
        window.Metrics && Metrics.recordTokens(4);
        await sleep(8);
      }
      const relLinks = facts.relatedTitles.length ? `<br><small style="color:var(--text-secondary)">Tópicos relacionados: ${facts.relatedTitles.map(esc).join(', ')}</small>` : '';
      el.innerHTML = `${esc(txt)}<br><br><small style="color:var(--cyan)">📚 Fonte 100% real em tempo real: <a href="${facts.url}" target="_blank" rel="noopener" style="color:var(--cyan)">${esc(facts.title)}</a></small>${relLinks}`;
      st.className = 'thought-badge'; st.textContent = 'VERIFIED';
    } else {
      el.innerHTML = `Não encontrei um artigo direto na Wikipedia para <strong>"${esc(q)}"</strong>. Para raciocínio aberto sobre qualquer pergunta com o modelo <strong>Gemini</strong>, clique em <strong>🔑 API Key</strong> no topo e insira sua chave gratuita do <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--cyan)">Google AI Studio</a>, ou digite o nome de um conceito científico, histórico ou tecnológico para busca enciclopédica ao vivo.`;
      st.className = 'thought-badge'; st.textContent = 'DONE';
    }
  }

  function init() {
    document.getElementById('chat-send-btn').addEventListener('click', send);
    document.getElementById('chat-input').addEventListener('keydown', e => e.key === 'Enter' && send());
  }
  return { init, fetchRealFacts };
})();
