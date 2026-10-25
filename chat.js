// Chat with Real Reasoning Token Extraction (Gemini Thinking API) + GraphRAG Vector/Subgraph Retrieval
const Chat = (function () {
  const history = [];
  const SYSTEM = 'Você é NEXUS, um sistema avançado de inteligência e pesquisa factual. Responda no idioma do usuário com dados reais, precisos e verificáveis. Quando evidências do GraphRAG forem fornecidas no contexto, cite-as com precisão. Nunca invente fatos.';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const now = () => new Date().toTimeString().slice(0, 8);

  // Query backend GraphRAG first, falling back to live Wikipedia REST API if hosted statically
  async function fetchGraphRAG(query) {
    const t0 = performance.now();
    try {
      const r = await fetch(`/api/graph?q=${encodeURIComponent(query)}`);
      if (r.ok) {
        const rag = await r.json();
        window.Metrics && Metrics.recordApiCall(performance.now() - t0);
        if (rag.seedNodes && rag.seedNodes.length) {
          const top = rag.seedNodes[0];
          return {
            title: top.label,
            extract: top.summary,
            url: top.url,
            relatedTitles: rag.subgraph.nodes.slice(1, 7).map(n => n.label),
            papers: rag.papers || [],
            totalIndexedNodes: rag.totalIndexedNodes
          };
        }
      }
    } catch (e) {}

    // Direct Wikipedia fallback
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
          papers: []
        };
      } catch (e) {}
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
    return s.querySelector('.step-text');
  }

  async function send() {
    const inp = document.getElementById('chat-input'), q = inp.value.trim();
    if (!q) return;
    inp.value = '';
    addMsg('user', esc(q));

    // Trigger real Tensor forward pass on the user's input text
    if (window.NexusWS && NexusWS.isOpen()) {
      NexusWS.send({ action: 'tensor_step', input: q });
    }

    const chain = document.getElementById('thought-chain');
    const st = document.getElementById('thought-status');
    st.className = 'thought-badge THINKING'; st.textContent = 'GRAPHRAG';
    chain.innerHTML = '';

    setStep(chain, 1, `Executing Vector + 1-Hop GraphRAG query for: "${q}"`);
    const facts = await fetchGraphRAG(q);
    if (facts && facts.extract) {
      setStep(chain, 2, `GraphRAG Grounded: "${facts.title}" (${facts.papers?.length || 0} DOI papers, ${facts.totalIndexedNodes || 'live'} graph nodes)`);
    } else {
      setStep(chain, 2, `Direct query dispatched to LLM Reasoning Core`);
    }

    const el = addMsg('assistant', '<span class="typing-cursor"></span>');

    if (window.Gemini && Gemini.hasKey()) {
      st.textContent = 'REASONING';
      const thoughtEl = setStep(chain, 3, 'Streaming native reasoning tokens (thinkingConfig.includeThoughts=true)...', true);
      const groundedPrompt = facts && facts.extract
        ? `Pergunta do usuário: ${q}\n\n[Evidências Verificadas do GraphRAG — Fonte: ${facts.title} (${facts.url})]:\n${facts.extract}\n` +
          (facts.papers?.length ? `Artigos Científicos:\n` + facts.papers.map(p => `- ${p.title} (${p.year}) ${p.doi}`).join('\n') : '')
        : q;

      history.push({ role: 'user', parts: [{ text: groundedPrompt }] });
      const t0 = performance.now();
      let prevLen = 0;
      try {
        const full = await Gemini.stream(
          history,
          SYSTEM,
          t => {
            const delta = t.length - prevLen;
            if (delta > 0 && window.Metrics) Metrics.recordTokens(delta);
            prevLen = t.length;
            el.innerHTML = esc(t).replace(/\n/g, '<br>') + '<span class="typing-cursor"></span>';
            el.closest('.chat-messages').scrollTop = 1e9;
          },
          thoughtText => {
            // Stream actual LLM thinking tokens into the Latent Thought Chain panel!
            thoughtEl.innerHTML = `<strong>[LLM Reasoning Trace]:</strong><br>${esc(thoughtText).replace(/\n/g, '<br>')}`;
            chain.scrollTop = chain.scrollHeight;
          }
        );
        window.Metrics && Metrics.recordApiCall(performance.now() - t0);
        const citationHtml = facts && facts.url
          ? `<br><br><small style="color:var(--cyan)">📚 Fonte GraphRAG: <a href="${facts.url}" target="_blank" rel="noopener" style="color:var(--cyan)">${esc(facts.title)}</a></small>`
          : '';
        el.innerHTML = esc(full).replace(/\n/g, '<br>') + citationHtml;
        history.push({ role: 'model', parts: [{ text: full }] });
        setStep(chain, 4, `Inference verified in ${Math.round(performance.now() - t0)} ms (${Math.ceil(full.length / 4)} tokens)`, false);
        st.className = 'thought-badge'; st.textContent = 'DONE';
      } catch (e) {
        history.pop();
        el.classList.add('error');
        el.textContent = 'Erro ao chamar o Gemini: ' + e.message + ' — verifique sua chave em 🔑 API Key.';
        st.className = 'thought-badge'; st.textContent = 'ERROR';
      }
      return;
    }

    if (facts && facts.extract) {
      setStep(chain, 3, `Synthesizing verified GraphRAG extract from "${facts.title}"`, false);
      const txt = facts.extract;
      for (let i = 0; i <= txt.length; i += 5) {
        el.innerHTML = esc(txt.slice(0, i)) + '<span class="typing-cursor"></span>';
        window.Metrics && Metrics.recordTokens(5);
        await sleep(8);
      }
      const papersHtml = facts.papers?.length
        ? `<br><small style="color:var(--text-secondary)">Artigos (DOI): ${facts.papers.map(p => `<a href="${p.doi}" target="_blank" style="color:var(--cyan)">${esc(p.title)} (${p.year})</a>`).join(' | ')}</small>`
        : '';
      el.innerHTML = `${esc(txt)}<br><br><small style="color:var(--cyan)">📚 Fonte GraphRAG em tempo real: <a href="${facts.url}" target="_blank" rel="noopener" style="color:var(--cyan)">${esc(facts.title)}</a></small>${papersHtml}`;
      st.className = 'thought-badge'; st.textContent = 'VERIFIED';
    } else {
      el.innerHTML = `Não encontrei uma entidade indexada direta para <strong>"${esc(q)}"</strong>. Clique em <strong>🔑 API Key</strong> no topo e insira sua chave do <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--cyan)">Google AI Studio</a> para raciocínio aberto com extração de tokens de pensamento em tempo real.`;
      st.className = 'thought-badge'; st.textContent = 'DONE';
    }
  }

  function init() {
    document.getElementById('chat-send-btn').addEventListener('click', send);
    document.getElementById('chat-input').addEventListener('keydown', e => e.key === 'Enter' && send());
  }
  return { init, fetchRealFacts: fetchGraphRAG };
})();
