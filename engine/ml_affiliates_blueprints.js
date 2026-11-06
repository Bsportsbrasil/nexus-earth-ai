/**
 * engine/ml_affiliates_blueprints.js
 * 
 * MATRIZ DE 50 AGENTES AUTÔNOMOS DE SUPERINTELIGÊNCIA PARA MERCADO LIVRE AFILIADOS
 * Perfil Vinculado: CASTILLOOFFICIAL (Hub Oficial Mercado Livre Afiliados)
 * Link Hub: https://www.mercadolivre.com.br/afiliados/hub?is_affiliate=true#menu-user
 * 
 * Categorização Estratégica em 5 Batalhões de Alto Retorno (10 agentes em cada = 50 agentes):
 * 1. ml_high_ticket: Eletrônicos, Smartphones, Informática & Hardware Premium (Comissões altas por venda)
 * 2. ml_viral_deals: Achadinhos Virais, Itens de Alta Conversão & Cupons Relâmpago (TikTok/Reels/Shorts)
 * 3. ml_home_decor: Casa, Móveis, Ferramentas & Decoração Prática (Volume contínuo e ticket consistente)
 * 4. ml_auto_tech: Automotivo, Acessórios para Carros/Motos & Ferramentas Oficiais
 * 5. ml_beauty_health: Beleza, Cuidados Pessoais, Suplementação & Moda Fitness (Recorrência de recompra)
 */

export const ML_SECTORS = [
  { id: 'ml_high_ticket', name: 'ML Afiliados • High-Ticket & Smartphones', icon: '📱', desc: 'Rastreadores e canais de conversão para celulares, notebooks, TVs e consoles de alto valor.' },
  { id: 'ml_viral_deals', name: 'ML Afiliados • Achadinhos & Cupons Virais', icon: '🔥', desc: 'Engenharia de vídeos curtos, canais de alertas Telegram/WhatsApp de cupons e ofertas relâmpago.' },
  { id: 'ml_home_decor', name: 'ML Afiliados • Casa, Móveis & Decoração', icon: '🏡', desc: 'Listas e reviews de utilidades domésticas, organização, iluminação smart e eletroportáteis.' },
  { id: 'ml_auto_tech', name: 'ML Afiliados • Automotivo & Ferramentas', icon: '🚗', desc: 'Autopeças, scanners OBD2, som automotivo, ferramentas manuais e elétricas profissionais.' },
  { id: 'ml_beauty_health', name: 'ML Afiliados • Beleza, Saúde & Suplementos', icon: '✨', desc: 'Skincare, secadores/modeladores de alta procura, whey protein, creatina e moda esportiva.' }
];

export const ML_50_AGENTS = [
  // Batalhão 1: High-Ticket & Smartphones (101 a 110)
  {
    id: 101,
    sector: 'ml_high_ticket',
    name: 'RadarSmartphone Pro',
    role: 'Líder Executivo de Conversão em Smartphones (Samsung Galaxy, iPhone, Xiaomi) com Alerta de Preço Baixo',
    mrr: 28500,
    domain: 'radarsmartphone.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML', 'Telegram Bot']
  },
  {
    id: 102,
    sector: 'ml_high_ticket',
    name: 'NotebookGamer Scout',
    role: 'Curador Especialista em Laptops Gamer (RTX 4060, i7, Ryzen) com Comparativo de Desempenho e Links ML',
    mrr: 34000,
    domain: 'notebookgamerscout.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML', 'YouTube Shorts Automation']
  },
  {
    id: 103,
    sector: 'ml_high_ticket',
    name: 'SmartTV 4K Hunter',
    role: 'Rastreador de Ofertas de Smart TVs OLED e QLED no Mercado Livre com Notificação Instantânea de Frete Grátis',
    mrr: 26000,
    domain: 'smarttv4khunter.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 104,
    sector: 'ml_high_ticket',
    name: 'PlayConsole Radar',
    role: 'Monitor de Estoque e Preço de PS5 Slim, Xbox Series X e Nintendo Switch com Pacotes de Jogos Afiliados',
    mrr: 31500,
    domain: 'playconsoleradar.com.br',
    creds: ['Mercado Livre Afiliados API', 'WhatsApp Groups API']
  },
  {
    id: 105,
    sector: 'ml_high_ticket',
    name: 'TabletEstudo Focus',
    role: 'Engenharia de Conteúdo e Conversão em iPads e Tablets Android para Estudantes e Concursistas',
    mrr: 18500,
    domain: 'tabletestudofocus.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 106,
    sector: 'ml_high_ticket',
    name: 'SmartwatchPulse Bot',
    role: 'Especialista em Apple Watch, Galaxy Watch e pulseiras inteligentes com Guias de Compatibilidade',
    mrr: 21000,
    domain: 'smartwatchpulse.com.br',
    creds: ['Mercado Livre Afiliados API', 'Instagram Graph API']
  },
  {
    id: 107,
    sector: 'ml_high_ticket',
    name: 'AudioNoiseCancelling',
    role: 'Comparador de Fones Bluetooth Premium (Sony WH-1000XM5, AirPods Pro, JBL) e Links Diretos ML',
    mrr: 19800,
    domain: 'audionoisecancelling.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 108,
    sector: 'ml_high_ticket',
    name: 'DroneCamera Explorer',
    role: 'Reviewer e Recomendador de Drones DJI e Câmeras de Ação 4K com Análise Técnica de Homologação Anatel',
    mrr: 27000,
    domain: 'dronecameraexplorer.com.br',
    creds: ['Mercado Livre Afiliados API', 'TikTok Content Engine']
  },
  {
    id: 109,
    sector: 'ml_high_ticket',
    name: 'MonitorUltraWide Pro',
    role: 'Curadoria de Monitores de Produtividade e Setup de Escritório com Links Afiliados Otimizados',
    mrr: 22400,
    domain: 'monitorultrawidepro.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 110,
    sector: 'ml_high_ticket',
    name: 'EreaderKindle Guide',
    role: 'Comparador de E-readers, Acessórios e Capas Inteligentes com Estratégia de Afiliado Educacional',
    mrr: 14500,
    domain: 'ereaderkindleguide.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },

  // Batalhão 2: Achadinhos & Cupons Virais (111 a 120)
  {
    id: 111,
    sector: 'ml_viral_deals',
    name: 'AchadinhosML Viral',
    role: 'Gerador Automático de Roteiros e Vídeos Curtos de Produtos Curiosos e Úteis do Mercado Livre para Redes Sociais',
    mrr: 35000,
    domain: 'achadinhosmlviral.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML', 'TikTok Creator API']
  },
  {
    id: 112,
    sector: 'ml_viral_deals',
    name: 'CupomRelampago ML',
    role: 'Canal de Disparo Automatizado de Cupons Ativos (MELI+, 10% OFF, Frete Grátis) no WhatsApp e Telegram',
    mrr: 42000,
    domain: 'cupomrelampagoml.com.br',
    creds: ['Mercado Livre Afiliados API', 'Telegram Bot API', 'Meta Cloud API']
  },
  {
    id: 113,
    sector: 'ml_viral_deals',
    name: 'OfertaAbaixoDe50',
    role: 'Curador de Produtos Incríveis por Menos de R$ 50 para Impulso Rápido de Compra e Volume Máximo de Pedidos',
    mrr: 23500,
    domain: 'ofertaabaixode50.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 114,
    sector: 'ml_viral_deals',
    name: 'BugDePreco Notifier',
    role: 'Sentinela Algorítmico de Descontos Anormais (>70% OFF) no Mercado Livre com Alerta Imediato para Comunidade VIP',
    mrr: 38000,
    domain: 'bugdepreconotifier.com.br',
    creds: ['Mercado Livre Afiliados API', 'Push Notifications Web']
  },
  {
    id: 115,
    sector: 'ml_viral_deals',
    name: 'TikTokGadgets Brasil',
    role: 'Engenharia Reversa de Produtos Que Viralizam no TikTok dos EUA e Mapeamento Instantâneo de Vendedores ML',
    mrr: 29000,
    domain: 'tiktokgadgetsbrasil.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 116,
    sector: 'ml_viral_deals',
    name: 'PresentesCriativos Bot',
    role: 'Guia Interativo de Presentes por Faixa de Preço para Datas Comemorativas (Dia das Mães, Namorados, Natal)',
    mrr: 25500,
    domain: 'presentescriativosbot.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 117,
    sector: 'ml_viral_deals',
    name: 'SetupDesk Inovador',
    role: 'Vídeos e Galeria de Acessórios para Setup Minimalista (Organizador de Cabos, Luz LED, Suporte Ergonômico)',
    mrr: 21800,
    domain: 'setupdeskinovador.com.br',
    creds: ['Mercado Livre Afiliados API', 'Pinterest Business API']
  },
  {
    id: 118,
    sector: 'ml_viral_deals',
    name: 'ComprasInteligentes ML',
    role: 'Comparador de Custo por Unidade e Combos Econômicos no Supermercado Mercado Livre com Afiliado Ativo',
    mrr: 19500,
    domain: 'comprasinteligentesml.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 119,
    sector: 'ml_viral_deals',
    name: 'MeliPlus Maximizador',
    role: 'Calculadora de Vantagens e Produtos Exclusivos com Frete Rápido FULL para Assinantes Meli+',
    mrr: 17200,
    domain: 'meliplusmaximizador.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 120,
    sector: 'ml_viral_deals',
    name: 'Top10Vendidos Real',
    role: 'Boletim Diário dos 10 Produtos Mais Vendidos de Cada Categoria do Mercado Livre com Links Trackeados',
    mrr: 26800,
    domain: 'top10vendidosreal.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },

  // Batalhão 3: Casa, Móveis & Decoração (121 a 130)
  {
    id: 121,
    sector: 'ml_home_decor',
    name: 'AirFryer TopReview',
    role: 'Portal Especializado em Fritadeiras Elétricas sem Óleo, Receitas Rápidas e Acessórios em Silicone Afiliados',
    mrr: 29500,
    domain: 'airfryertopreview.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 122,
    sector: 'ml_home_decor',
    name: 'RoboAspirador Compare',
    role: 'Comparador Técnico de Robôs Aspiradores (com Mop, Mapeamento Laser e Retorno à Base) no Mercado Livre',
    mrr: 33000,
    domain: 'roboaspiradorcompare.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 123,
    sector: 'ml_home_decor',
    name: 'CafeteiraExpresso Guia',
    role: 'Guia de Compra de Cafeteiras Nespresso, Dolce Gusto e Manuais de Grão com Rastreamento de Cápsulas',
    mrr: 21500,
    domain: 'cafeteiraexpressoguia.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 124,
    sector: 'ml_home_decor',
    name: 'CasaConectada Alexa',
    role: 'Kits Prontos de Automação Residencial (Interruptores Zigbee, Lâmpadas Tuya, Echo Dot) no Mercado Livre',
    mrr: 27800,
    domain: 'casaconectadaalexa.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 125,
    sector: 'ml_home_decor',
    name: 'CozinhaOrganizada Pro',
    role: 'Portfólio de Potes Herméticos, Escorredores Inox e Organizadores de Armário com Conversão Direta',
    mrr: 18200,
    domain: 'cozinhaorganizadapro.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 126,
    sector: 'ml_home_decor',
    name: 'ColchaoOrtopedico Top',
    role: 'Classificador de Colchões na Caixa, Travesseiros Nasa e Protetores Impermeáveis com Comissões Elevadas',
    mrr: 31000,
    domain: 'colchaoortopedicotop.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 127,
    sector: 'ml_home_decor',
    name: 'MesaEscritorio Setup',
    role: 'Catálogo de Mesas com Ajuste de Altura (Standing Desks) e Estantes Industriais Vendidas no ML',
    mrr: 24000,
    domain: 'mesaescrotoriosetup.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 128,
    sector: 'ml_home_decor',
    name: 'IluminacaoLED Decor',
    role: 'Fitas LED COB, Perfis de Alumínio e Arandelas Modernas para Arquitetura e Decoração Faça Você Mesmo',
    mrr: 16800,
    domain: 'iluminacaoleddecor.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 129,
    sector: 'ml_home_decor',
    name: 'PurificadorAgua Review',
    role: 'Comparador de Purificadores Electrolux, Consul e IBBL com Lembrete Recorrente de Troca de Refil/Filtro',
    mrr: 22800,
    domain: 'purificadoraguareview.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 130,
    sector: 'ml_home_decor',
    name: 'VentiladorClimatizador',
    role: 'Monitor Sazonal de Ar-Condicionado Split Inverter, Climatizadores e Ventiladores Silenciosos no ML',
    mrr: 28400,
    domain: 'ventiladorclimatizador.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },

  // Batalhão 4: Automotivo & Ferramentas (131 a 140)
  {
    id: 131,
    sector: 'ml_auto_tech',
    name: 'SomAutomotivo Central',
    role: 'Curadoria de Centrais Multimídia Android com Apple CarPlay e Câmeras de Ré Vendidas no Mercado Livre',
    mrr: 29800,
    domain: 'somautomotivocentral.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 132,
    sector: 'ml_auto_tech',
    name: 'ScannerOBD2 Auto',
    role: 'Guias e Links para Aparelhos de Diagnóstico Automotivo para Mecânicos e Donos de Carro Economizarem',
    mrr: 21000,
    domain: 'scannerobd2auto.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 133,
    sector: 'ml_auto_tech',
    name: 'LampadasUltraLED Auto',
    role: 'Tabela de Compatibilidade de Lâmpadas LED H4, H7 e H11 para Faróis com Compra Afiliada no ML',
    mrr: 17500,
    domain: 'lampadasultraledauto.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 134,
    sector: 'ml_auto_tech',
    name: 'LavadoraAltaPressao Top',
    role: 'Comparador de Lavadoras Kärcher, Wap e vonder com Kits de Snow Foam para Estética Automotiva',
    mrr: 32000,
    domain: 'lavadoraaltapressaotop.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 135,
    sector: 'ml_auto_tech',
    name: 'FuradeiraImpacto Guia',
    role: 'Testes de Resistência de Furadeiras e Parafusadeiras a Bateria (Makita, DeWalt, Bosch) no Mercado Livre',
    mrr: 28900,
    domain: 'furadeiraimpactoguia.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 136,
    sector: 'ml_auto_tech',
    name: 'PolimentoAuto Detail',
    role: 'Seleção de Boinas, Politrizes Rotorbitais e Compostos Polidores Vonixx e Lincoln com Link de Afiliado',
    mrr: 19400,
    domain: 'polimentoautodetail.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 137,
    sector: 'ml_auto_tech',
    name: 'PneusFreteGratis Radar',
    role: 'Rastreador de Ofertas de Pneus Michelin, Pirelli e Goodyear com Frete FULL no Mercado Livre',
    mrr: 36500,
    domain: 'pneusfretegratisradar.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 138,
    sector: 'ml_auto_tech',
    name: 'SuporteCelular Carro',
    role: 'Testes dos Melhores Suportes Veiculares com Carregamento por Indução MagSafe para Motoristas Uber/99',
    mrr: 15800,
    domain: 'suportecelularcarro.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 139,
    sector: 'ml_auto_tech',
    name: 'InversorOndaSenoidal',
    role: 'Especialista em Energia Solar Off-Grid, Baterias Estacionárias e Inversores de Tensão no Mercado Livre',
    mrr: 27200,
    domain: 'inversorondasenoidal.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 140,
    sector: 'ml_auto_tech',
    name: 'KitFerramentas Completo',
    role: 'Guia de Jogos de Chaves Catraca, Maletas de Ferramentas e Caixas Organizadoras com Alta Avaliação',
    mrr: 23000,
    domain: 'kitferramentascompleto.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },

  // Batalhão 5: Beleza, Saúde & Suplementos (141 a 150)
  {
    id: 141,
    sector: 'ml_beauty_health',
    name: 'WheyCreatina Barato',
    role: 'Rastreador de Menor Preço e Autenticidade de Whey Protein Isolado, Creatina Creapure e Pré-Treinos no ML',
    mrr: 37500,
    domain: 'wheycreatinabarato.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML', 'Telegram Fitness Bot']
  },
  {
    id: 142,
    sector: 'ml_beauty_health',
    name: 'SecadorGama Cabelo',
    role: 'Comparador de Secadores Profissionais, Escovas Secadoras Rotativas e Chapinhas Taiff no Mercado Livre',
    mrr: 26000,
    domain: 'secadorgamacabelo.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 143,
    sector: 'ml_beauty_health',
    name: 'SkincareDermato Guia',
    role: 'Rotinas de Skincare com Produtos La Roche-Posay, CeraVe e Principia com Links Oficiais de Farmácia ML',
    mrr: 29000,
    domain: 'skincaredermatoguia.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 144,
    sector: 'ml_beauty_health',
    name: 'PerfumeImportado ML',
    role: 'Verificador de Lojas Oficiais e Reputação de Perfumes Importados Originais (Dior, Carolina Herrera, Paco Rabanne)',
    mrr: 34500,
    domain: 'perfumeimportadoml.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 145,
    sector: 'ml_beauty_health',
    name: 'BarbeadorEletrico Top',
    role: 'Classificador de Máquinas de Cortar Cabelo Philips e Barbeadores à Prova d Água com Reposição de Lâminas',
    mrr: 18900,
    domain: 'barbeadoreletricotop.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 146,
    sector: 'ml_beauty_health',
    name: 'BalancaBioimpedancia',
    role: 'Comparador de Balanças Inteligentes com Conexão Bluetooth ao Celular e Relatórios Corporais',
    mrr: 16400,
    domain: 'balancabioimpedancia.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 147,
    sector: 'ml_beauty_health',
    name: 'TenisCorrida Oferta',
    role: 'Monitor de Descontos em Tênis de Corrida Nike, Asics e Olympikus com Filtro por Tamanho e Pisada',
    mrr: 31000,
    domain: 'teniscorricaoferta.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 148,
    sector: 'ml_beauty_health',
    name: 'MassageadorPistola Pro',
    role: 'Análise de Pistolas Massageadoras Musculares Fisioterápicas para Alívio de Dores e Recuperação Pós-Treino',
    mrr: 21400,
    domain: 'massageadorpistolapro.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 149,
    sector: 'ml_beauty_health',
    name: 'LenteContato Solucao',
    role: 'Kits Promocionais de Soluções Oftálmicas Renu/Opti-Free e Colírios Hidratantes no Supermercado ML',
    mrr: 15200,
    domain: 'lentecontatosolucao.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  },
  {
    id: 150,
    sector: 'ml_beauty_health',
    name: 'EscovaEletrica Dentes',
    role: 'Recomendador de Escovas Dentais Elétricas Oral-B e Philips Sonicare com Refis Periódicos Afiliados',
    mrr: 19600,
    domain: 'escovaeletricadentes.com.br',
    creds: ['Mercado Livre Afiliados API', 'Gerador de Links ML']
  }
];
