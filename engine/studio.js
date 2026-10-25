import { graphDB } from './graph_db.js';
import { streamWithThinking } from './llm.js';
import { telemetry } from './telemetry.js';

/**
 * Multimodal Visual & Executive Report Studio Engine
 * 1. Generates high-resolution images via Gemini `gemini-2.5-flash-image` when an API key is active,
 *    or generates data-driven scientific SVG diagrams + fetches real Wikimedia Commons high-res imagery.
 * 2. Synthesizes structured Executive Reports & Slide Decks grounded on real Wikipedia + Crossref DOI sources.
 */
export async function generateVisualAsset({ prompt, apiKey }) {
  const cleanPrompt = (prompt || 'Neural Network Architecture').trim();
  const resolvedKey = apiKey || process.env.GEMINI_API_KEY;
  const t0 = performance.now();

  // 1. If Gemini API Key is present, attempt native Gemini Image Generation (gemini-2.5-flash-image)
  if (resolvedKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${encodeURIComponent(resolvedKey)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: cleanPrompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const p of parts) {
          if (p.inlineData && p.inlineData.data) {
            telemetry.recordApiCall(performance.now() - t0);
            return {
              mode: 'gemini-2.5-flash-image',
              mimeType: p.inlineData.mimeType || 'image/png',
              dataUrl: `data:${p.inlineData.mimeType || 'image/png'};base64,${p.inlineData.data}`,
              caption: cleanPrompt
            };
          }
        }
      }
    } catch (e) {}
  }

  // 2. Search Wikimedia Commons API for authentic high-resolution scientific/technical photography/diagrams
  let commonsImage = null;
  try {
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:bitmap|drawing%20${encodeURIComponent(cleanPrompt)}&gsrlimit=4&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;
    const r = await fetch(commonsUrl);
    if (r.ok) {
      const data = await r.json();
      const pages = Object.values(data?.query?.pages || {});
      for (const page of pages) {
        const info = page?.imageinfo?.[0];
        if (info?.url && /\.(jpg|jpeg|png|svg)$/i.test(info.url)) {
          commonsImage = {
            url: info.url,
            title: (page.title || '').replace(/^File:/i, '')
          };
          break;
        }
      }
    }
  } catch (e) {}

  // 3. Also build a custom Vector Architectural Infographic SVG grounded on GraphRAG entities
  const rag = await graphDB.queryGraphRAG(cleanPrompt, 5);
  const nodes = rag.subgraph.nodes.slice(0, 6);
  const centerLabel = (rag.seedNodes[0]?.label || cleanPrompt).slice(0, 28);

  const nodeCircles = nodes.map((n, idx) => {
    const angle = (idx / Math.max(1, nodes.length)) * Math.PI * 2;
    const cx = Math.round(400 + Math.cos(angle) * 190);
    const cy = Math.round(225 + Math.sin(angle) * 135);
    const lbl = (n.label || '').replace(/[<>&"]/g, '').slice(0, 22);
    return `
      <line x1="400" y1="225" x2="${cx}" y2="${cy}" stroke="#00f5ff" stroke-opacity="0.45" stroke-width="2" stroke-dasharray="4 4"/>
      <circle cx="${cx}" cy="${cy}" r="26" fill="#0f1629" stroke="#a855f7" stroke-width="2.5"/>
      <text x="${cx}" y="${cy + 42}" fill="#e2e8f0" font-family="Inter, sans-serif" font-size="12" font-weight="600" text-anchor="middle">${lbl}</text>
    `;
  }).join('');

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <radialGradient id="bgGlow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#020408"/>
      </radialGradient>
      <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00f5ff"/>
        <stop offset="100%" stop-color="#a855f7"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bgGlow)"/>
    <circle cx="400" cy="225" r="190" fill="none" stroke="#00f5ff" stroke-opacity="0.12" stroke-width="1"/>
    <circle cx="400" cy="225" r="120" fill="none" stroke="#a855f7" stroke-opacity="0.18" stroke-width="1"/>
    ${nodeCircles}
    <circle cx="400" cy="225" r="44" fill="url(#coreGrad)"/>
    <text x="400" y="229" fill="#020408" font-family="Inter, sans-serif" font-size="12" font-weight="800" text-anchor="middle">${centerLabel.replace(/[<>&"]/g, '')}</text>
    <text x="24" y="34" fill="#00f5ff" font-family="monospace" font-size="13">NEXUS VISUAL SYNTHESIS // GRAPHRAG TOPOLOGY</text>
    <text x="24" y="428" fill="#94a3b8" font-family="monospace" font-size="11">Nodes Indexed: ${rag.totalIndexedNodes} | Verified Citations: ${rag.papers.length}</text>
  </svg>`;

  const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString, 'utf8').toString('base64')}`;
  telemetry.recordApiCall(performance.now() - t0);

  return {
    mode: 'graphrag-vector-svg',
    mimeType: 'image/svg+xml',
    dataUrl: svgDataUrl,
    commonsImage,
    caption: `Diagrama Topológico GraphRAG: ${centerLabel}`
  };
}

export async function generateExecutiveReport({ topic, apiKey }) {
  const cleanTopic = (topic || 'Artificial Intelligence').trim();
  const rag = await graphDB.queryGraphRAG(cleanTopic, 6);
  const resolvedKey = apiKey || process.env.GEMINI_API_KEY;

  if (resolvedKey) {
    const sys = `Você é o Sintetizador de Relatórios Executivos e Apresentações do NEXUS.
Gere um Relatório Executivo e Estrutura de Slides (4 slides) altamente técnico, usando dados 100% reais das fontes fornecidas (Wikipedia e Crossref DOI). Inclua métricas, implicações estratégicas e links para as fontes.`;
    const context = `Tema: ${cleanTopic}\n\nEntidades GraphRAG:\n` +
      rag.seedNodes.map(n => `- ${n.label}: ${n.summary} (${n.url})`).join('\n') +
      `\n\nArtigos Científicos (DOI):\n` +
      rag.papers.map(p => `- ${p.title} (${p.year}) [${p.journal}] - ${p.doi}`).join('\n');

    const res = await streamWithThinking({
      apiKey: resolvedKey,
      contents: context,
      systemInstruction: sys,
      thinkingLevel: 'LOW'
    });
    return { report: res.answer, rag };
  }

  const primary = rag.seedNodes[0];
  const report = [
    `# 📊 Relatório Executivo & Apresentação: ${primary?.label || cleanTopic}`,
    `**Data de Geração:** ${new Date().toISOString().slice(0, 10)} | **Nós Verificados no Grafo:** ${rag.totalIndexedNodes}`,
    ``,
    `## Slide 1 — Sumário Executivo & Definição Factual`,
    `${primary?.summary || 'Análise técnica baseada na indexação em tempo real do NEXUS GraphRAG.'}`,
    primary?.url ? `🔗 **Fonte Primária:** ${primary.url}` : '',
    ``,
    `## Slide 2 — Topologia de Conceitos Conectados (1-Hop Subgraph)`,
    rag.subgraph.nodes.slice(0, 8).map(n => `- **${n.label}** (${n.category})`).join('\n'),
    ``,
    `## Slide 3 — Evidências Científicas Revisadas por Pares (Crossref DOI)`,
    rag.papers.length
      ? rag.papers.map((p, i) => `${i + 1}. **${p.title}** (${p.year}) — *${p.journal}* — ${p.doi}`).join('\n')
      : `- Nenhuma publicação com DOI específico retornada para a string exata.`,
    ``,
    `## Slide 4 — Recomendações de Engenharia & Próximos Passos`,
    `1. Consolidar o monitoramento das entidades adjacentes identificadas no grafo.`,
    `2. Auditar as referências primárias listadas acima antes de tomada de decisão crítica.`,
    `3. Exportar este relatório ou acionar o DAG Multi-Agente para decomposição operacional.`
  ].filter(Boolean).join('\n');

  return { report, rag };
}
