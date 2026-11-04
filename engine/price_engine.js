/**
 * NEXUS Price Intelligence Engine (Comparador de Preços Verídico da AURA)
 *
 * Princípio inegociável: NUNCA inventar preços.
 *  - Preços vêm exclusivamente de busca real via Gemini + Google Search grounding.
 *  - Cada oferta só é mantida se o domínio da loja aparecer nas fontes reais
 *    (groundingChunks) retornadas pela busca. Ofertas sem fonte são descartadas.
 *  - O link "Ver oferta" aponta para a página-fonte real onde o preço foi encontrado.
 *  - Análise de "preço justo" (mediana) só é feita com 3+ preços verificados.
 *  - Sempre oferece links de busca reais (Google Shopping, Buscapé, Zoom, lojas)
 *    e busca de lojas físicas próximas no Google Maps.
 */

const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map();

const PRICE_INTENT_RE = /\b(pre[cç]os?|quanto\s+(custa|t[aá]|est[aá])|mais\s+barat[oa]|barat[oa]|onde\s+(comprar|encontr\w*|acho|achar|compro)|comprar|encontr\w*|modelo\s+espec[ií]fico|dispon[ií]vel|promo[cç][aã]o|ofertas?|valor\s+(de|do|da)|pre[cç]o\s+justo|vale\s+a\s+pena\s+comprar|comparar\s+pre[cç]os?|cota[cç][aã]o|na\s+regi[aã]o|lojas?\s+f[ií]sicas?)\b/i;

export function isPriceIntent(msg = '') {
  return PRICE_INTENT_RE.test(msg);
}

export function isRegionalQuery(msg = '') {
  return /\b(na\s+regi[aã]o|perto(\s+de\s+mim)?|pr[oó]xim[oa]|na\s+minha\s+cidade|aqui\s+perto|aqui|lojas?\s+f[ií]sicas?|lojas?\s+da\s+regi[aã]o|comprar\s+perto)\b/i.test(msg || '');
}

export function extractProductQuery(msg = '') {
  if (!msg) return '';
  let s = msg.replace(/[?!.,;:"'()\[\]]+/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Remove leading conversational intent & verbs
  let prev;
  do {
    prev = s;
    s = s.replace(/^(?:aura\s+)?(?:por\s+favor\s+)?(?:me\s+ajud[ae]\s+(?:a\s+)?|quero\s+|queria\s+|gostaria\s+de\s+|preciso\s+de\s+|voc[eê]\s+(?:pode|consegue)\s+)?(?:pesquis[ae]r?|procur[ae]r?|busc(?:ar|que)?|encontr\w*|olh[ae]r?|analis[ae]r?|compar[ae]r?|qual\s+[eé]\s+(?:o\s+)?(?:menor\s+|melhor\s+)?pre[cç]o\s+d[eao]s?|qual\s+(?:o\s+)?(?:menor\s+|melhor\s+)?pre[cç]o\s+d[eao]s?|quanto\s+(?:custa|t[aá]|est[aá])\s+(?:um|uma|o|a)?|onde\s+(?:posso\s+)?(?:comprar|encontr\w*|acho|achar|compro)\s+(?:um|uma|o|a)?)\s*/i, '');
    s = s.replace(/^(?:um|uma|o|a|os|as)\s+/i, '');
    s = s.replace(/^(?:modelo\s+espec[ií]fico\s+(?:dispon[ií]vel\s+)?(?:de|do|da)\s+|modelo\s+d[eao]s?\s+|pre[cç]os?\s+d[eao]s?\s+|o\s+pre[cç]o\s+d[eao]s?\s+|ofertas?\s+d[eao]s?\s+|promo[cç][aã]o\s+d[eao]s?\s+)/i, '');
  } while (s !== prev);

  // 2. Remove trailing qualifiers: barato, na regiao, perto de mim, lojas fisicas, hoje, etc.
  do {
    prev = s;
    s = s.replace(/(?:\s+(?:com\s+)?(?:pre[cç]o\s+)?(?:mais\s+)?barat[oa]|\s+barat[oa]|\s+com\s+o\s+melhor\s+pre[cç]o|\s+bom\s+e\s+(?:barato|justo)|\s+em\s+promo[cç][aã]o|\s+dispon[ií]vel|\s+na\s+regi[aã]o|\s+perto(?:\s+de\s+mim)?|\s+pr[oó]xim[oa]|\s+na\s+minha\s+cidade|\s+aqui\s+perto|\s+aqui|\s+na\s+minha\s+regi[aã]o|\s+nas?\s+lojas?(?:\s+online|\s+f[ií]sicas?)?|\s+nas?\s+lojas?|\s+online|\s+f[ií]sicas?|\s+hoje|\s+agora)+$/i, '');
  } while (s !== prev);

  s = s.replace(/\s+/g, ' ').trim();
  return s.slice(0, 90) || msg.slice(0, 90);
}

function domainOf(urlOrTitle = '') {
  const s = String(urlOrTitle).trim().toLowerCase();
  try {
    const host = new URL(s.startsWith('http') ? s : `https://${s}`).hostname;
    return host.replace(/^www\./, '').replace(/^m\./, '');
  } catch (_) {
    return '';
  }
}

function rootDomain(host = '') {
  // magazineluiza.com.br -> magazineluiza ; amazon.com.br -> amazon ; kabum.com.br -> kabum
  const parts = host.split('.').filter(Boolean);
  if (parts.length === 0) return '';
  const idx = parts.findIndex(p => ['com', 'net', 'org', 'br'].includes(p));
  return idx > 0 ? parts[idx - 1] : parts[0];
}

function formatBRL(n) {
  return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function buildSearchLinks(product, clientGeo = null, locality = '') {
  const q = encodeURIComponent(product);
  const slug = product.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const lat = clientGeo?.lat;
  const lng = clientGeo?.lng ?? clientGeo?.lon;
  const nearMapUrl = Number.isFinite(lat) && Number.isFinite(lng)
    ? `https://www.google.com/maps/search/${encodeURIComponent('loja ' + product)}/@${lat},${lng},14z`
    : (locality
        ? `https://www.google.com/maps/search/${encodeURIComponent('lojas ' + product + ' em ' + locality)}`
        : `https://www.google.com/maps/search/${encodeURIComponent('loja ' + product + ' perto de mim')}`);

  return {
    product,
    online: [
      { name: 'Google Shopping', icon: '🛒', url: `https://www.google.com/search?tbm=shop&q=${q}`, badge: 'Comparador Oficial' },
      { name: 'Mercado Livre', icon: '🛍️', url: `https://lista.mercadolivre.com.br/${slug}`, badge: 'Entrega Rápida' },
      { name: 'Amazon Brasil', icon: '📦', url: `https://www.amazon.com.br/s?k=${q}`, badge: 'Catálogo Verificado' },
      { name: 'Magazine Luiza', icon: '🏬', url: `https://www.magazineluiza.com.br/busca/${q}/`, badge: 'Lojas & Retirada' },
      { name: 'Buscapé', icon: '🔍', url: `https://www.buscape.com.br/search?q=${q}`, badge: 'Histórico de Preços' },
      { name: 'Zoom', icon: '🔎', url: `https://www.zoom.com.br/search?q=${q}`, badge: 'Menor Preço' }
    ],
    physicalStoresMapUrl: nearMapUrl,
    localGoogleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent('onde comprar ' + product + (locality ? ' em ' + locality : ' na regiao') + ' loja fisica')}`
  };
}

function parseOffersJson(text = '') {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = block ? block[1] : (text.match(/\[[\s\S]*\]/) || [''])[0];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function toNumberBRL(v) {
  if (typeof v === 'number') return v;
  const s = String(v || '').replace(/[^\d,.-]/g, '');
  if (!s) return NaN;
  // "1.299,90" -> 1299.90 ; "1299.90" -> 1299.90
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  return parseFloat(normalized);
}

/**
 * Real grounded price search. Returns { status, product, offers, analysis, links, sources, checkedAt }.
 * status: 'OK' | 'NO_VERIFIED_PRICES' | 'NO_API_KEY' | 'ERROR'
 */
export async function searchRealPrices({ query, rawMsg = '', apiKey = '', clientGeo = null, locality = '' }) {
  const fullText = rawMsg || query || '';
  const isRegional = isRegionalQuery(fullText);
  const product = extractProductQuery(query || rawMsg) || String(query || '').slice(0, 90);
  const links = buildSearchLinks(product, clientGeo, locality);
  const checkedAt = new Date().toISOString();
  const base = { product, isRegional, links, checkedAt, offers: [], analysis: null, sources: [] };

  if (!product) return { ...base, status: 'ERROR', note: 'Produto não identificado.' };

  const cacheKey = `${product.toLowerCase()}|${locality}|${isRegional ? 'reg' : 'all'}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.t < CACHE_TTL_MS) return { ...hit.v, cached: true };

  const key = (apiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!key) return { ...base, status: 'NO_API_KEY' };

  const regionPrompt = isRegional
    ? ` com ênfase especial em disponibilidade imediata e lojas físicas na região${locality ? ` de ${locality}` : ''}`
    : '';

  const prompt = `Pesquise AGORA na web os preços atuais no Brasil (em reais) do produto: "${product}"${locality ? ` (usuário em ${locality})` : ''}${regionPrompt}.
Considere lojas brasileiras confiáveis (ex.: Amazon Brasil, Mercado Livre, Magalu, Casas Bahia, KaBuM, Americanas, Leroy Merlin, farmácias, supermercados) e lojas físicas com preço publicado.
Regras obrigatórias:
- O produto DEVE ser 100% correspondente a "${product}". NÃO traga acessórios genéricos que não sejam o produto pedido.
- Use SOMENTE preços que aparecem nas páginas encontradas na busca. NÃO estime, NÃO invente.
- Se não encontrar preço em uma página, não inclua essa loja.
- Prefira o produto novo e o mesmo modelo/versão pedido.
Responda APENAS com um bloco \`\`\`json contendo um array de até 8 objetos:
[{"store":"Nome da loja","domain":"dominio.com.br","product":"nome exato do anúncio","price":1234.56,"type":"online"|"fisica","note":"ex.: à vista no Pix, frete grátis, pronta-entrega"}]`;

  let data;
  const searchModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastErrText = '';
  for (const m of searchModels) {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
        })
      });
      if (resp.ok) {
        data = await resp.json();
        break;
      }
      lastErrText = await resp.text();
    } catch (e) {
      lastErrText = e.message;
    }
  }

  if (!data) {
    return { ...base, status: 'ERROR', note: 'Busca indisponível no momento.', debug: lastErrText.slice(0, 160) };
  }

  const cand = data?.candidates?.[0];
  const text = (cand?.content?.parts || []).map(p => p.text || '').join('');
  const chunks = cand?.groundingMetadata?.groundingChunks || [];

  // Real sources returned by Google Search (title is usually the site domain; uri is a redirect to the page)
  const sources = chunks
    .map(c => c.web)
    .filter(w => w && w.uri)
    .map(w => {
      const host = domainOf(w.title) || domainOf(w.uri);
      return { title: w.title || host, uri: w.uri, host, root: rootDomain(host) };
    });

  const rawOffers = parseOffersJson(text);
  const seen = new Set();
  const offers = [];

  const prodWords = product.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(w => w.length > 2 && !['com', 'para', 'pra', 'sem', 'sob', 'uma', 'uns', 'dos', 'das'].includes(w));

  for (const o of rawOffers) {
    const price = toNumberBRL(o.price);
    if (!Number.isFinite(price) || price <= 0) continue;
    const host = domainOf(o.domain || '') || '';
    const root = rootDomain(host) || String(o.store || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    // Verification: the store must be among the real sources returned by the search
    const src = sources.find(s => s.root && root && (s.root === root || s.host.includes(root) || root.includes(s.root)));
    if (!src) continue;

    // Relevance check: ensure offer matches at least one primary keyword of requested product
    if (prodWords.length > 0) {
      const offerNorm = (String(o.product || '') + ' ' + String(o.store || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchesKeyword = prodWords.some(w => offerNorm.includes(w));
      if (!matchesKeyword) continue;
    }

    const dedupeKey = `${src.root}|${Math.round(price)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    offers.push({
      store: String(o.store || src.title).slice(0, 40),
      product: String(o.product || product).slice(0, 110),
      price,
      priceLabel: formatBRL(price),
      type: o.type === 'fisica' ? 'fisica' : 'online',
      note: String(o.note || '').slice(0, 80),
      sourceUrl: src.uri,
      sourceHost: src.host,
      verified: true
    });
  }

  offers.sort((a, b) => a.price - b.price);

  let analysis = null;
  if (offers.length >= 3) {
    const med = median(offers.map(o => o.price));
    offers.forEach(o => {
      const ratio = o.price / med;
      o.flag = ratio < 0.6 ? 'SUSPEITO' : ratio > 1.3 ? 'ACIMA' : 'JUSTO';
    });
    const fair = offers.filter(o => o.flag === 'JUSTO');
    const best = fair[0] || offers.find(o => o.flag !== 'SUSPEITO') || offers[0];
    analysis = {
      medianPrice: med,
      medianLabel: formatBRL(med),
      fairRange: `${formatBRL(med * 0.85)} a ${formatBRL(med * 1.1)}`,
      bestOffer: best,
      suspiciousCount: offers.filter(o => o.flag === 'SUSPEITO').length,
      sampleSize: offers.length
    };
  } else if (offers.length > 0) {
    offers.forEach(o => { o.flag = 'POUCOS_DADOS'; });
  }

  const result = {
    ...base,
    status: offers.length ? 'OK' : 'NO_VERIFIED_PRICES',
    offers,
    analysis,
    sources: sources.slice(0, 8).map(s => ({ title: s.title, uri: s.uri }))
  };
  cache.set(cacheKey, { t: Date.now(), v: result });
  return result;
}

/** Deterministic, data-faithful reply (the LLM never rewrites the numbers). */
export function buildPriceReply(pc, voice = false) {
  const p = pc.product;
  const regNote = pc.isRegional ? ' na sua região e nas lojas online com melhor preço' : '';
  if (pc.status === 'OK' && pc.analysis) {
    const a = pc.analysis;
    const b = a.bestOffer;
    const warn = a.suspiciousCount ? ` Atenção: ${a.suspiciousCount} oferta(s) estão muito abaixo do mercado, o que costuma indicar golpe, produto usado ou anúncio enganoso — confira a reputação do vendedor antes.` : '';
    return voice
      ? `Comparei ${a.sampleSize} lojas verificadas para ${p}${regNote}. O preço justo fica em ${a.medianLabel}, e a melhor opção confirmada é ${b.priceLabel} na ${b.store}.${a.suspiciousCount ? ' Cuidado com ofertas baratas demais.' : ''} Todos os links estão na tela.`
      : `Pesquisei os preços exatos e disponibilidade de **${p}**${regNote}. A mediana de mercado apurada é **${a.medianLabel}**, com faixa justa entre **${a.fairRange}**. A melhor opção identificada com fonte real é por **${b.priceLabel}** na loja **${b.store}**${b.note ? ` (${b.note})` : ''}.${warn} Deixei o link direto para a oferta e os comparadores rápidos na tela.`;
  }
  if (pc.status === 'OK') {
    const b = pc.offers[0];
    return voice
      ? `Encontrei o menor preço verificado de ${b.priceLabel} na ${b.store} para ${p}${regNote}. Os links diretos e lojas no mapa estão na tela.`
      : `Encontrei a oferta verificada de **${b.priceLabel}** na loja **${b.store}** para **${p}**${regNote}. Deixei o link direto para conferir o produto, além dos atalhos no Google Shopping, Mercado Livre e lojas físicas no Google Maps abaixo.`;
  }
  if (pc.status === 'NO_API_KEY') {
    return voice
      ? `Preparei os links diretos de comparação e as lojas físicas próximas no mapa para ${p}. Basta tocar nos botões na tela.`
      : `Preparei links diretos de 100% de fidelidade para **${p}**${regNote}: você pode conferir agora no Google Shopping, Mercado Livre, Amazon Brasil, Magalu, Buscapé, e traçar rota para lojas físicas próximas no Google Maps com os botões abaixo.`;
  }
  return voice
    ? `Preparei os links diretos de busca e lojas físicas no mapa para ${p}. Estão todos disponíveis na tela.`
    : `Preparei os links diretos para você conferir **${p}** com 100% de fidelidade nas principais redes (Google Shopping, Mercado Livre, Amazon, Magalu) e encontrar lojas físicas na sua região no Google Maps pelos botões abaixo.`;
}
