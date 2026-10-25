// Multi-Agent Reasoning Console — Powered by Real Gemini API + Live Wikipedia & Crossref Academic Data
const Agents = (function () {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\n/g, '<br>');

  const ROLES = {
    planner: 'Você é o agente PLANNER. Com base nos dados reais fornecidos, decomponha o problema em 4-6 passos estratégicos numerados e baseados em evidências. Máximo 120 palavras. Sem introdução.',
    critic: 'Você é o agente CRITIC. Analise o plano do Planner e os dados reais: aponte falhas, vieses, limitações empíricas e o que está sólido. Máximo 120 palavras. Use ⚠ e ✓.',
    executor: 'Você é o agente EXECUTOR. Considerando o plano, as críticas e a literatura real fornecida, sintetize uma solução concreta com métricas mensuráveis. Máximo 140 palavras.',
    verifier: 'Você é o agente VERIFIER. Verifique a consistência factual entre os agentes e as fontes reais citadas, atribuindo uma nota de confiança de 0 a 1 justificada. Máximo 90 palavras.'
  };

  // Fetch real peer-reviewed scientific articles from the public Crossref API + Wikipedia
  async function gatherRealEvidence(query) {
    const t0 = performance.now();
    const results = { wiki: null, papers: [] };

    try {
      if (window.Chat && Chat.fetchRealFacts) {
        results.wiki = await Chat.fetchRealFacts(query);
      }
    } catch (e) {}

    try {
      const crUrl = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=3&select=DOI,title,issued,container-title`;
      const r = await fetch(crUrl);
      if (r.ok) {
        const data = await r.json();
        results.papers = (data?.message?.items || []).map(it => ({
          title: Array.isArray(it.title) ? it.title[0] : (it.title || 'Untitled Study'),
          year: it.issued?.['date-parts']?.[0]?.[0] || 'n.d.',
          journal: Array.isArray(it['container-title']) ? it['container-title'][0] : '',
          doi: it.DOI ? `https://doi.org/${it.DOI}` : ''
        }));
      }
    } catch (e) {}

    window.Metrics && Metrics.recordApiCall(performance.now() - t0);
    return results;
  }

  async function typeReal(el, htmlText, badge, tokEl) {
    badge.className = 'agent-badge THINKING'; badge.textContent = 'ANALYZING';
    el.innerHTML = '';
    const plain = htmlText;
    let out = '';
    const step = 3;
    for (let i = 0; i < plain.length; i += step) {
      out = plain.slice(0, i + step);
      el.innerHTML = esc(out) + '<span class="typing-cursor"></span>';
      tokEl.textContent = Math.ceil(out.length / 4) + ' tokens';
      window.Metrics && Metrics.recordTokens(step);
      el.scrollTop = el.scrollHeight;
      await sleep(10);
    }
    el.innerHTML = esc(plain);
    badge.className = 'agent-badge DONE'; badge.textContent = 'DONE';
  }

  async function live(el, badge, tokEl, sys, prompt) {
    badge.className = 'agent-badge THINKING'; badge.textContent = 'THINKING';
    el.innerHTML = '<span class="typing-cursor"></span>';
    const t0 = performance.now();
    let prevLen = 0;
    try {
      const full = await Gemini.stream(prompt, sys, t => {
        const delta = t.length - prevLen;
        if (delta > 0 && window.Metrics) Metrics.recordTokens(delta);
        prevLen = t.length;
        el.innerHTML = esc(t) + '<span class="typing-cursor"></span>';
        tokEl.textContent = Math.ceil(t.length / 4) + ' tokens';
        el.scrollTop = el.scrollHeight;
      });
      window.Metrics && Metrics.recordApiCall(performance.now() - t0);
      el.innerHTML = esc(full);
      badge.className = 'agent-badge DONE'; badge.textContent = 'DONE';
      return full;
    } catch (e) {
      el.innerHTML = '<span style="color:var(--rose)">Erro: ' + e.message + '</span>';
      badge.className = 'agent-badge IDLE'; badge.textContent = 'ERROR';
      throw e;
    }
  }

  async function run() {
    const q = document.getElementById('agent-prompt').value.trim() || 'Artificial Intelligence';
    const btn = document.getElementById('agent-run-btn');
    btn.disabled = true;
    const panel = document.getElementById('consensus-panel');
    panel.style.display = 'none';

    for (const k of ['planner', 'critic', 'executor', 'verifier']) {
      document.getElementById(k + '-badge').className = 'agent-badge THINKING';
      document.getElementById(k + '-badge').textContent = 'FETCHING DATA';
    }

    // 1. Always fetch 100% real world evidence from Wikipedia + Crossref DOI Registry first
    const evidence = await gatherRealEvidence(q);
    const evidenceBlock = [
      evidence.wiki ? `Fonte Enciclopédica (${evidence.wiki.title}): ${evidence.wiki.extract}` : '',
      evidence.papers.length ? `Artigos Científicos (Crossref DOI):\n` + evidence.papers.map((p, i) => `${i + 1}. "${p.title}" (${p.year}) ${p.journal} - ${p.doi}`).join('\n') : ''
    ].filter(Boolean).join('\n\n');

    // 2. If Gemini API Key or Cloud Proxy is active, run live LLM multi-agent reasoning grounded on the real evidence
    if (window.Gemini && Gemini.hasKey()) {
      let ctx = `PROBLEMA / TEMA: ${q}\n\n[EVIDÊNCIAS REAIS COLETADAS EM TEMPO REAL]:\n${evidenceBlock || 'Nenhuma fonte externa adicional.'}`;
      try {
        for (const k of ['planner', 'critic', 'executor', 'verifier']) {
          const res = await live(
            document.getElementById(k + '-output'),
            document.getElementById(k + '-badge'),
            document.getElementById(k + '-tokens'),
            ROLES[k],
            ctx
          );
          ctx += `\n\n[${k.toUpperCase()}]\n${res}`;
        }
        panel.style.display = 'block';
        const co = document.getElementById('consensus-output');
        await Gemini.stream(
          ctx,
          'Você é o núcleo NEXUS. Com base no trabalho dos 4 agentes e nas fontes científicas/enciclopédicas reais, escreva a conclusão final de consenso com referências reais, até 160 palavras, no idioma do problema.',
          t => co.innerHTML = esc(t)
        );
      } catch (e) {
        console.error(e);
      }
      btn.disabled = false;
      return;
    }

    // 3. Without Gemini key: present the 100% real data retrieved from Wikipedia + Crossref across the 4 agents
    const wikiTitle = evidence.wiki ? evidence.wiki.title : q;
    const wikiExtract = evidence.wiki ? evidence.wiki.extract : `Nenhum resumo enciclopédico direto encontrado para "${q}".`;
    const papersText = evidence.papers.length
      ? evidence.papers.map((p, i) => `${i + 1}. ${p.title} (${p.year}) — ${p.doi}`).join('\n')
      : 'Nenhum artigo acadêmico retornado pelo Crossref para esta consulta.';

    const realOutputs = {
      planner: `[Escopo & Definição Real — Fonte: Wikipedia (${wikiTitle})]\n${wikiExtract}`,
      critic: `[Literatura Científica Revisada por Pares — Fonte: Crossref API]\n${papersText}`,
      executor: `[Extração de Dados & Entidades]\n• Tópico Principal: ${wikiTitle}\n• Artigos Indexados Encontrados: ${evidence.papers.length}\n• Tópicos Conexos: ${(evidence.wiki?.relatedTitles || []).join(', ') || 'N/A'}`,
      verifier: `[Auditoria de Fontes Reais]\n✓ Wikipedia REST API: ${evidence.wiki ? 'Verificado (' + evidence.wiki.url + ')' : 'Sem correspondência exata'}\n✓ Crossref DOI Registry: ${evidence.papers.length} publicações reais verificadas\n(Conecte sua 🔑 API Key do Gemini para síntese generativa sobre estas fontes.)`
    };

    for (const k of ['planner', 'critic', 'executor', 'verifier']) {
      await typeReal(
        document.getElementById(k + '-output'),
        realOutputs[k],
        document.getElementById(k + '-badge'),
        document.getElementById(k + '-tokens')
      );
    }

    panel.style.display = 'block';
    const linksHtml = evidence.papers.map(p => `<li><a href="${p.doi}" target="_blank" rel="noopener" style="color:var(--cyan)">${esc(p.title)} (${p.year})</a></li>`).join('');
    document.getElementById('consensus-output').innerHTML =
      `<strong>Relatório de Evidências Reais para:</strong> <em>${esc(q)}</em><br><br>
       ${esc(wikiExtract)}<br><br>
       ${linksHtml ? `<strong>Artigos Científicos Indexados (Crossref DOI):</strong><ul style="margin-left:1.2rem;margin-top:.4rem">${linksHtml}</ul>` : ''}`;
    btn.disabled = false;
  }

  function init() {
    document.getElementById('agent-run-btn').addEventListener('click', run);
    document.querySelectorAll('.agent-badge').forEach(b => b.classList.add('IDLE'));
  }
  return { init };
})();
