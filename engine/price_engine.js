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

const PRICE_INTENT_RE = /\b(pre[cç]os?|quanto\s+(custa|t[aá]|est[aá])|mais\s+barat[oa]|onde\s+(comprar|encontr\w*|acho)|comprar|promo[cç][aã]o|ofertas?|valor\s+(de|do|da)|pre[cç]o\s+justo|vale\s+a\s+pena\s+comprar|comparar\s+pre[cç]os?|cota[cç][aã]o)\b/i;

export function isPriceIntent(msg = '') {
  return PRICE_INTENT_RE.test(msg);
}

export function extractProductQuery(msg = '') {
  return msg
    .replace(/\b(aura|por\s+favor|pfv|me\s+(ajude?|ajuda)\s+a|quero|queria|gostaria\s+de|preciso\s+de?|voc[eê]\s+(pode|consegue)|pesquis[ae]r?|procur[ae]r?|encontr[ae]r?|compar[ae]r?|analis[ae]r?|o\s+pre[cç]o\s+(de|do|da|dos|das)|pre[cç]os?\s+(de|do|da|dos|das)?|quanto\s+(custa|t[aá]|est[aá])|quanto|qual\s+[eé]|qual|onde\s+(comprar|encontrar|acho)|comprar|mais\s+barat[oa]|com\s+(o\s+)?melhor\s+pre[cç]o|pre[cç]o\s+justo|bom\s+e\s+justo|em\s+promo[cç][aã]o|promo[cç][aã]o\s+de|ofertas?\s+de|nas?\s+lojas?(\s+online|\s+f[ií]sicas?)?|lojas?|online|f[ií]sicas?|hoje|agora|um|uma|o|a|os|as|de|do|da|dos|das)\b/gi, ' ')
    .replace(/[?!.,;:"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
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

export function buildSearchLinks(product, clientGeo = null) {
  const q = encodeURIComponent(product);
  const slug = product.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const lat = clientGeo?.lat;
  const lng = clientGeo?.lng ?? clientGeo?.lon;
  const near = Number.isFinite(lat) && Number.isFinite(lng)
    ? `https://www.google.com/maps/search/${encodeURIComponent('loja ' + product)}/@${lat},${lng},14z`
    : `https://www.google.com/maps/search/${encodeURIComponent('loja ' + product + ' perto de mim')}`;
  return {
    online: [
      { name: 'Google Shopping', url: `https://www.google.com/search?tbm=shop&q=${q}` },
      { name: 'Buscapé', url: `https://www.buscape.com.br/search?q=${q}` },
      { name: 'Zoom', url: `https://www.zoom.com.br/search?q=${q}` },
      { name: 'Mercado Livre', url: `https://lista.mercadolivre.com.br/${slug}` },
      { name: 'Amazon Brasil', url: `https://www.amazon.com.br/s?k=${q}` },
      { name: 'Magalu', url: `https://www.magazineluiza.com.br/busca/${q}/` }
    ],
    physicalStoresMapUrl: near
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
export async function searchRealPrices({ query, apiKey = '', clientGeo = null, locality = '' }) {
  const product = extractProductQuery(query) || String(query || '').slice(0, 90);
  const links = buildSearchLinks(product, clientGeo);
  const checkedAt = new Date().toISOString();
  const base = { product, links, checkedAt, offers: [], analysis: null, sources: [] };

  if (!product) return { ...base, status: 'ERROR', note: 'Produto não identificado.' };

  const cacheKey = `${product.toLowerCase()}|${locality}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.t < CACHE_TTL_MS) return { ...hit.v, cached: true };

  const key = (apiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!key) return { ...base, status: 'NO_API_KEY' };

  const prompt = `Pesquise AGORA na web os preços atuais no Brasil (em reais) do produto: "${product}"${locality ? ` (usuário em ${locality})` : ''}.
Considere lojas online brasileiras confiáveis (ex.: Amazon Brasil, Mercado Livre, Magalu, Casas Bahia, KaBuM, Americanas, Drogasil/Raia para farmácia, supermercados) e lojas físicas com preço publicado.
Regras obrigatórias:
- Use SOMENTE preços que aparecem nas páginas encontradas na busca. NÃO estime, NÃO invente.
- Se não encontrar preço em uma página, não inclua essa loja.
- Prefira o produto novo e o mesmo modelo/versão pedido.
Responda APENAS com um bloco \`\`\`json contendo um array de até 8 objetos:
[{"store":"Nome da loja","domain":"dominio.com.br","product":"nome exato do anúncio","price":1234.56,"type":"online"|"fisica","note":"ex.: à vista no Pix, frete grátis, usado"}]`;

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

  for (const o of rawOffers) {
    const price = toNumberBRL(o.price);
    if (!Number.isFinite(price) || price <= 0) continue;
    const host = domainOf(o.domain || '') || '';
    const root = rootDomain(host) || String(o.store || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    // Verification: the store must be among the real sources returned by the search
    const src = sources.find(s => s.root && root && (s.root === root || s.host.includes(root) || root.includes(s.root)));
    if (!src) continue;
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
  if (pc.status === 'OK' && pc.analysis) {
    const a = pc.analysis;
    const b = a.bestOffer;
    const warn = a.suspiciousCount ? ` Atenção: ${a.suspiciousCount} oferta(s) estão muito abaixo do mercado, o que costuma indicar golpe, produto usado ou anúncio enganoso — confira a reputação do vendedor antes.` : '';
    return voice
      ? `Comparei ${a.sampleSize} lojas com preço publicado para ${p}. O preço justo está perto de ${a.medianLabel}, e a melhor oferta confiável que encontrei é ${b.priceLabel} na ${b.store}.${a.suspiciousCount ? ' Cuidado com ofertas muito baratas, podem ser golpe.' : ''} Os links estão na tela.`
      : `Pesquisei agora preços reais de ${p} em ${a.sampleSize} lojas com fonte verificada. A mediana do mercado é ${a.medianLabel}, então um preço bom e justo fica entre ${a.fairRange}. Na minha análise, a melhor escolha é ${b.priceLabel} na ${b.store}${b.note ? ` (${b.note})` : ''}, porque está dentro da faixa justa e vem de uma loja identificável.${warn} Preços mudam rápido: confirme o valor final, frete e prazo no link antes de pagar.`;
  }
  if (pc.status === 'OK') {
    const b = pc.offers[0];
    return voice
      ? `Encontrei poucas lojas com preço publicado para ${p}. O menor valor verificado é ${b.priceLabel} na ${b.store}. Deixei links para comparar mais na tela.`
      : `Encontrei apenas ${pc.offers.length} preço(s) com fonte verificada para ${p}; o menor é ${b.priceLabel} na ${b.store}. Com tão poucos dados não dá para afirmar qual é o preço justo, então deixei abaixo links do Google Shopping, Buscapé e Zoom para você comparar mais lojas, além de lojas físicas próximas no mapa.`;
  }
  if (pc.status === 'NO_API_KEY') {
    return `Para buscar preços reais em tempo real preciso que a chave da API Gemini esteja configurada. Enquanto isso, deixei links diretos de comparação (Google Shopping, Buscapé, Zoom e grandes lojas) e lojas físicas próximas no mapa para ${p}.`;
  }
  return voice
    ? `Não consegui confirmar preços com fonte segura para ${p} agora, e não vou chutar valores. Deixei links de comparação e lojas próximas na tela.`
    : `Não consegui confirmar preços com fonte verificável para ${p} neste momento — e prefiro não inventar números. Deixei abaixo links diretos para comparar no Google Shopping, Buscapé, Zoom e nas principais lojas, além das lojas físicas próximas no mapa.`;
}
