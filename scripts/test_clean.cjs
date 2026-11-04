function cleanProduct(msg) {
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
  return s.slice(0, 90);
}

const tests = [
  'Aura pesquise um modelo especifico disponivel de cabine portatil com preco barato na regiao',
  'pesquisar modelo especifico de cabine de pintura portatil barata',
  'onde posso comprar uma cabine de led portátil para unhas na minha cidade',
  'Aura, qual o menor preço do iPhone 15 Pro Max 256GB na minha cidade?',
  'onde encontro furadeira de impacto makita 12v mais barata nas lojas físicas',
  'compare preços de geladeira brastemp frost free inox',
  'quanto custa um playstation 5 slim com leitor hoje?'
];

tests.forEach(t => console.log(t, '\n  ===> [', cleanProduct(t), ']\n'));
