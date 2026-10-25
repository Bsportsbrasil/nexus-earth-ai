/**
 * NEXUS Sovereign Internationalization & Translation Engine (i18n)
 * Fully bilingual: Portuguese (PT-BR) <-> English (EN-US)
 * Persists user preference in localStorage ('nexus_lang')
 * Seamlessly updates UI across all 9 SPA modules, navbar, hero, cards, and modals
 */
const I18nEngine = (() => {
  let currentLang = 'pt';
  try {
    currentLang = localStorage.getItem('nexus_lang') || 'pt';
  } catch (_) {
    currentLang = 'pt';
  }

  const TRANSLATIONS = {
    pt: {
      langBtn: 'PT (EN)',
      langTitle: 'Alternar idioma para Inglês (Vale do Silício & Labs Globais)',

      // Navigation
      navHome: 'Início',
      navAura: 'AURA Live',
      navCommand: 'Comando',
      navEarth: 'Earth Geo',
      navNeural: 'Neural',
      navAgents: 'Agentes',
      navSupervisor: 'Supervisor',
      navKnowledge: 'Conhecimento',
      navStudio: 'Estúdio',
      navProofs: 'Provas',
      navGuide: 'Guia',
      navArticles: 'Artigos',
      navFaq: 'FAQ',
      navAbout: 'Sobre Nós',

      navInstallApp: 'Instalar App',
      navSignIn: 'Entrar',
      navApiKey: 'Chave API',
      keyStatusDemo: 'MODO DEMO',
      keyStatusActive: 'GEMINI CLOUD ATIVO',
      keyStatusReady: 'GRAPHRAG PRONTO',

      // Hero
      heroBadge: 'Superinteligência Cooperativa Glass-Box • Arquitetura Aberta de Pesquisa',
      heroTitle1: 'Superinteligência Transparente.',
      heroTitle2: 'Alinhada à Pluralidade Humana.',
      heroDesc: 'O NEXUS une Interpretabilidade Mecanística (entropia de Shannon e tensores de atenção ao vivo), Consenso Multi-Agente DAG, GraphRAG Vetorial (Wikipedia + Crossref DOIs) e a AURA — uma agente de comunicação ao vivo altamente empática construída para a diversidade cognitiva e inclusão neurodivergente (TEA).',
      heroAuraBtn: '✨ Conversar com AURA Live',
      heroLaunchBtn: '⚡ Glass-Box Command Center',
      heroBenchBtn: '🏛️ Whitepaper & Benchmarks',
      statThreads: 'Hardware Threads',
      statFps: 'Render FPS',
      statCalls: 'Chamadas Reais de API',

      // Executive KPI Strip
      kpiNodes: 'Nós Verificados no GraphRAG',
      kpiEntropy: 'Entropia de Shannon H(a)',
      kpiAgency: 'Preservação de Agência Humana',
      kpiProtocol: 'Protocolo Ético & Inclusão TEA',

      // Modular Hub Header
      hubTag: 'Arquitetura Desacoplada sob Demanda (Lazy-Loaded Modules)',
      hubTitle: 'Ecossistema Modular NEXUS',
      hubDesc: 'Selecione qualquer módulo especializado abaixo. Os motores gráficos pesados (Canvas 60 FPS e Grafo Vetorial SVG) são carregados e renderizados sob demanda exclusivamente quando você acessa sua rota dedicada.',

      // Executive Cards
      cardAuraTitle: 'AURA Live & Pedagogia Inclusiva TEA',
      cardAuraDesc: 'Conversa contínua por voz (hands-free) com inteligência emocional que trata você pelo nome, Diário de Aprendizado Mútuo e Estúdio de Literatura Lúdica (Carol Gray) para TEA.',
      cardAuraCta: 'Acessar AURA & Inclusão TEA →',

      cardCommandTitle: 'Glass-Box Command Center & Chat',
      cardCommandDesc: 'Convergência operacional dos 3 pilares (Mapa de Atenção + GraphRAG, Debate Multi-Agente e Barramento MessageBroker) integrada ao Chat com Cadeia de Pensamento.',
      cardCommandCta: 'Abrir Command Center →',

      cardNeuralTitle: 'Interpretabilidade Mecanística (MLP)',
      cardNeuralDesc: 'Inspeção matemática em tempo real de propagação direta e reversa (a⁽ˡ⁾ = σ(W⁽ˡ⁾a⁽ˡ⁻¹⁾ + b⁽ˡ⁾)), Entropia de Shannon, norma L2 de gradientes e injetor de sinais.',
      cardNeuralCta: 'Inspecionar Rede Neural →',

      cardAgentsTitle: 'Raciocínio Multi-Agente (DAG)',
      cardAgentsDesc: 'Orquestração autônoma de 4 agentes especializados (Planner, Critic, Executor e Verifier) que decompõem, auditam e validam problemas complexos até o consenso.',
      cardAgentsCta: 'Executar Pipeline de Agentes →',

      cardKnowledgeTitle: 'GraphRAG & Wikipedia/DOI ao Vivo',
      cardKnowledgeDesc: 'Explorador interativo do Grafo de Conhecimento em tempo real conectado à Wikipedia REST API e artigos científicos Crossref DOI com expansão de subgrafos 1-Hop.',
      cardKnowledgeCta: 'Explorar Grafo de Conhecimento →',

      cardStudioTitle: 'Estúdio Multimodal & Automação (.ICS)',
      cardStudioDesc: 'Geração de sínteses visuais em SVG dinâmico, relatórios executivos em Markdown e agendamento de tarefas com exportação de calendário padrão RFC 5545 iCalendar.',
      cardStudioCta: 'Abrir Estúdio Criativo & Agenda →',

      cardProofsTitle: 'Provas Formais & Benchmarks Reproduzíveis',
      cardProofsDesc: 'Whitepaper matemático completo, exportação BibTeX acadêmica, suite de testes de ablação ao vivo com hash SHA-256 e métricas auditáveis em formato Prometheus.',
      cardProofsCta: 'Auditar Provas & Telemetria →',

      cardGuideTitle: 'Guia Educativo & Manual Técnico Sênior',
      cardGuideDesc: 'Manual completo e aprofundado com SEO técnico sênior, documentação 100% verídica de cada uma das funções da plataforma, arquitetura Glass-Box e conformidade regulatória.',
      cardGuideCta: 'Explorar Guia Técnico Oficial →',

      // AURA Section
      auraTag: 'AURA — Adaptive Understanding & Respectful Agent',
      auraTitle: 'Daily-Learning Companion & IA de Empatia Pluralista',
      auraDesc: 'Converse por voz ou texto exatamente como no Gemini Live. A AURA aprende diariamente com você de forma segura, divertida e educativa — compreendendo que todo ser vivente enxerga o mundo de um jeito único e que sempre existe um caminho de escolha que funciona para cada pessoa, com respeito e segurança para todos.',
      auraRole: 'AURA — Agente de Comunicação Viva',
      auraState: 'Pronta para conversar e aprender com você hoje',
      auraVoiceLive: '🎙️ Voz Ao Vivo',
      auraVoiceOn: '🔊 Voz ON',
      auraVoiceOff: '🔈 Voz Mudo',
      auraUserNameLabel: '👤 Seu Nome:',
      auraStyleLabel: '🧭 Meu Jeito:',
      auraEmotionBadge: '🤝 Tom: Empatia & Foco',
      auraInputPlaceholder: 'Converse com a AURA (ela aprende diariamente com seu jeito único)…',
      auraSendBtn: 'Enviar',
      auraJournalTitle: '📔 Diário de Aprendizado Mútuo (Memória Segura)',
      auraJournalClear: 'Limpar',
      auraPhilosophyStrong: '🤝 Princípio da Pluralidade Humana:',
      auraPhilosophyBody: 'Todo ser vivente compreende o mundo de forma única. Quando um método não funciona com 1%, outro caminho funciona — somos iguais em dignidade e diferentes no jeito de ser, com respeito e segurança para todos.',
      auraLearnedLabel: 'O que a AURA aprendeu com você',

      // Command Center Section
      ccTag: 'Centro de Controle de IA Glass-Box',
      ccTitle: 'Convergência Cognitiva & Operacional Unificada',
      ccDesc: 'Ao contrário de chatbots de caixa-preta convencionais, envie uma única diretriz e visualize os 3 pilares operando simultaneamente: Inspeção de Tensores e GraphRAG, Consenso Multi-Agente DAG e Barramento MessageBroker.',

      // Neural Section
      neuralTag: 'Interpretabilidade Mecanística em Tempo Real',
      neuralTitle: 'Topologia Perceptron Multi-Camadas & Tensores ao Vivo',
      neuralDesc: 'Monitore o fluxo de tensores de ativação, ativações ReLU, cálculo contínuo de entropia de Shannon e gradiente retropropagado através de camadas densas.',

      // Agents Section
      agentsTag: 'Orquestração de Grafos Acíclicos Dirigidos (DAG)',
      agentsTitle: 'Consenso Multi-Agente com Barramento MessageBroker',
      agentsDesc: 'Quatro agentes especializados cooperam autonomamente em um fluxo assíncrono para planejar, criticar, executar e verificar soluções completas.',

      // Knowledge Section
      graphTag: 'Grounding de Conhecimento Vetorial & Científico',
      graphTitle: 'GraphRAG Vetorial com Traversal de Subgrafos 1-Hop',
      graphDesc: 'Recuperação semântica híbrida (similaridade de cosseno TF-IDF) enriquecida com metadados científicos da Wikipedia REST e artigos indexados no Crossref DOI.',

      // Studio Section
      studioTag: 'Estúdio de Síntese Multimodal & Calendário RFC 5545',
      studioTitle: 'Automação Criativa, Relatórios & Planejamento Temporal',
      studioDesc: 'Transforme diretrizes em diagramas vetoriais SVG, relatórios executivos em Markdown e eventos agendados com exportação direta para arquivos de calendário .ics.',

      // Proofs Section
      proofsTag: 'Rigor Matemático, Benchmarks & Métricas Globais',
      proofsTitle: 'Provas Formais & Suite de Avaliação Científica',
      proofsDesc: 'Artigo técnico para citação acadêmica, benchmarks de ablação reproduzíveis com assinatura criptográfica SHA-256 e telemetria Prometheus em tempo real.',

      // Guide Section
      guideTag: 'Manual Técnico Sênior & Arquitetura Oficial',
      guideTitle: 'Guia Educativo da Plataforma NEXUS',
      guideDesc: 'Manual completo e aprofundado com 100% de veracidade, SEO técnico estruturado (Schema.org JSON-LD), fórmulas matemáticas e explicação operacional de todas as 9 funções da plataforma.'
    },

    en: {
      langBtn: 'EN (PT)',
      langTitle: 'Switch language to Portuguese (PT-BR)',

      // Navigation
      navHome: 'Home',
      navAura: 'AURA Live',
      navCommand: 'Command',
      navEarth: 'Earth Geo',
      navNeural: 'Neural',
      navAgents: 'Agents',
      navSupervisor: 'Supervisor',
      navKnowledge: 'Knowledge',
      navStudio: 'Studio',
      navProofs: 'Proofs',
      navGuide: 'Guide',
      navArticles: 'Articles',
      navFaq: 'FAQ',
      navAbout: 'About Us',

      navInstallApp: 'Install App',
      navSignIn: 'Sign In',
      navApiKey: 'API Key',
      keyStatusDemo: 'DEMO MODE',
      keyStatusActive: 'GEMINI CLOUD ACTIVE',
      keyStatusReady: 'GRAPHRAG READY',

      // Hero
      heroBadge: 'Glass-Box Cooperative Superintelligence • Open Research Architecture',
      heroTitle1: 'Transparent Superintelligence.',
      heroTitle2: 'Aligned with Human Plurality.',
      heroDesc: 'NEXUS converges Mechanistic Interpretability (real-time Shannon entropy & attention tensors), Adversarial Multi-Agent DAG Consensus, Vector GraphRAG (Wikipedia + Crossref DOIs), and AURA — a highly empathetic live communication companion built for cognitive diversity and neurodivergent (TEA) inclusion.',
      heroAuraBtn: '✨ Talk to AURA Live',
      heroLaunchBtn: '⚡ Glass-Box Command Center',
      heroBenchBtn: '🏛️ Whitepaper & Benchmarks',
      statThreads: 'Hardware Threads',
      statFps: 'Render FPS',
      statCalls: 'Real API Calls',

      // Executive KPI Strip
      kpiNodes: 'Verified GraphRAG Nodes',
      kpiEntropy: 'Shannon Entropy H(a)',
      kpiAgency: 'Human Agency Preservation',
      kpiProtocol: 'Ethical Protocol & TEA Inclusion',

      // Modular Hub Header
      hubTag: 'Decoupled On-Demand Architecture (Lazy-Loaded Modules)',
      hubTitle: 'NEXUS Modular Ecosystem',
      hubDesc: 'Select any specialized module below. Heavy visual engines (60 FPS Canvas and Vector SVG Graph) are loaded and rendered on-demand exclusively when you navigate to their dedicated route.',

      // Executive Cards
      cardAuraTitle: 'AURA Live & TEA Inclusive Pedagogy',
      cardAuraDesc: 'Continuous hands-free voice dialogue with emotional intelligence addressing you by name, Mutual Learning Journal, and Carol Gray Social Story studio for TEA.',
      cardAuraCta: 'Access AURA & TEA Support →',

      cardCommandTitle: 'Glass-Box Command Center & Chat',
      cardCommandDesc: 'Operational convergence of the 3 foundational pillars (Attention Tensor + GraphRAG, Multi-Agent Debate, and MessageBroker Bus) paired with Chain-of-Thought Chat.',
      cardCommandCta: 'Open Command Center →',

      cardNeuralTitle: 'Mechanistic Interpretability (MLP)',
      cardNeuralDesc: 'Real-time mathematical inspection of forward & backward propagation (a⁽ˡ⁾ = σ(W⁽ˡ⁾a⁽ˡ⁻¹⁾ + b⁽ˡ⁾)), Shannon Entropy, L2 gradient norm, and signal injection.',
      cardNeuralCta: 'Inspect Neural Network →',

      cardAgentsTitle: 'Multi-Agent Reasoning (DAG)',
      cardAgentsDesc: 'Autonomous orchestration of 4 specialized agents (Planner, Critic, Executor, and Verifier) that decompose, audit, and validate complex problems to consensus.',
      cardAgentsCta: 'Run Agent Pipeline →',

      cardKnowledgeTitle: 'GraphRAG & Live Wikipedia/DOI',
      cardKnowledgeDesc: 'Interactive real-time Knowledge Graph explorer grounded in live Wikipedia REST APIs and Crossref scientific DOIs with 1-Hop subgraph expansion.',
      cardKnowledgeCta: 'Explore Knowledge Graph →',

      cardStudioTitle: 'Multimodal Studio & Task Automation (.ICS)',
      cardStudioDesc: 'Dynamic SVG vector synthesis, Markdown executive report distillation, and calendar task automation exporting standard RFC 5545 iCalendar files.',
      cardStudioCta: 'Open Creative Studio & Agenda →',

      cardProofsTitle: 'Formal Proofs & Reproducible Benchmarks',
      cardProofsDesc: 'Complete mathematical whitepaper, academic BibTeX export, live ablation benchmark suite sealed with SHA-256 hashes, and Prometheus telemetry metrics.',
      cardProofsCta: 'Audit Proofs & Telemetry →',

      cardGuideTitle: 'Educational Guide & Senior Technical Manual',
      cardGuideDesc: 'In-depth senior technical manual with structured Schema.org JSON-LD SEO, 100% verified facts covering all platform modules, Glass-Box architecture and compliance.',
      cardGuideCta: 'Explore Official Technical Guide →',

      // AURA Section
      auraTag: 'AURA — Adaptive Understanding & Respectful Agent',
      auraTitle: 'Daily-Learning Companion & Pluralistic Empathy AI',
      auraDesc: 'Chat via live voice or text just like Gemini Live. AURA learns with you every day in a safe, fun, and educational manner — understanding that every living being perceives the world in a unique way and that there is always a pathway that works for each learner, with respect and safety for all.',
      auraRole: 'AURA — Live Communication Agent',
      auraState: 'Ready to converse and learn with you today',
      auraVoiceLive: '🎙️ Live Voice',
      auraVoiceOn: '🔊 Voice ON',
      auraVoiceOff: '🔈 Voice Muted',
      auraUserNameLabel: '👤 Your Name:',
      auraStyleLabel: '🧭 My Style:',
      auraEmotionBadge: '🤝 Tone: Empathy & Focus',
      auraInputPlaceholder: 'Talk to AURA (she learns every day from your unique way)…',
      auraSendBtn: 'Send',
      auraJournalTitle: '📔 Mutual Learning Journal (Encrypted Memory)',
      auraJournalClear: 'Clear',
      auraPhilosophyStrong: '🤝 Principle of Human Plurality:',
      auraPhilosophyBody: 'Every living being understands the world uniquely. When one method does not work for 1%, another pathway succeeds — we are equal in dignity and diverse in our way of being, with respect and safety for everyone.',
      auraLearnedLabel: 'What AURA has learned with you',

      // Command Center Section
      ccTag: 'Glass-Box AI Control Center',
      ccTitle: 'Unified Cognitive & Operational Convergence',
      ccDesc: 'Unlike black-box chatbots, dispatch a directive below and watch all 3 pillars operate in parallel: Tensor & GraphRAG Inspection, Multi-Agent Consensus, and MessageBroker Bus.',

      // Neural Section
      neuralTag: 'Real-Time Mechanistic Interpretability',
      neuralTitle: 'Multilayer Perceptron Topology & Live Tensors',
      neuralDesc: 'Monitor activation tensor flows, ReLU nonlinearities, continuous Shannon activation entropy, and backward gradient propagation across dense layers.',

      // Agents Section
      agentsTag: 'Directed Acyclic Graph (DAG) Orchestration',
      agentsTitle: 'Multi-Agent Consensus with MessageBroker Bus',
      agentsDesc: 'Four specialized autonomous agents collaborate in an asynchronous graph to plan, critique, execute, and verify complete solutions.',

      // Knowledge Section
      graphTag: 'Vector & Scientific Knowledge Grounding',
      graphTitle: 'Vector GraphRAG with 1-Hop Subgraph Traversal',
      graphDesc: 'Hybrid semantic retrieval (TF-IDF cosine similarity) augmented with scientific metadata from Wikipedia REST and Crossref DOI indexed publications.',

      // Studio Section
      studioTag: 'Multimodal Synthesis & RFC 5545 Calendar',
      studioTitle: 'Creative Automation, Reports & Time Scheduling',
      studioDesc: 'Synthesize dynamic SVG visual architecture cards, Markdown executive reports, and schedule calendar tasks with instant export to .ics files.',

      // Proofs Section
      proofsTag: 'Mathematical Rigor, Benchmarks & Global Metrics',
      proofsTitle: 'Formal Proofs & Scientific Evaluation Suite',
      proofsDesc: 'Frontier whitepaper specification, academic BibTeX citations, SHA-256 sealed ablation benchmarks, and real-time Prometheus telemetry metrics.',

      // Guide Section
      guideTag: 'Senior Technical Manual & Official Architecture',
      guideTitle: 'NEXUS Platform Educational Guide',
      guideDesc: 'Complete in-depth manual with 100% verified facts, Schema.org JSON-LD structured SEO, formal mathematical equations, and full operational documentation across all 9 platform modules.'
    }
  };

  function updateElementText(id, text) {
    const el = document.getElementById(id);
    if (el && typeof text === 'string') el.textContent = text;
  }

  function updateElementHtml(id, html) {
    const el = document.getElementById(id);
    if (el && typeof html === 'string') el.innerHTML = html;
  }

  function applyLanguage(lang) {
    currentLang = lang === 'en' ? 'en' : 'pt';
    try {
      localStorage.setItem('nexus_lang', currentLang);
    } catch (_) {}

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;
    document.documentElement.lang = currentLang === 'en' ? 'en' : 'pt-BR';

    // 1. Language Button in Header
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.textContent = t.langBtn;
      langBtn.title = t.langTitle;
    }

    // Bespoke Futuristic SVG Vector Glyphs (Zero Generic Emojis)
    const ROUTE_ICONS = {
      home: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      aura: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 3v3m0 12v3M3 12h3m12 0h3"/></svg>`,
      'command-center': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
      earth: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
      neural: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="12" r="3"/><line x1="8.5" y1="7.5" x2="15.5" y2="10.5"/><line x1="8.5" y1="16.5" x2="15.5" y2="13.5"/></svg>`,
      agents: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></svg>`,
      supervisor: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
      knowledge: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
      studio: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      proofs: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
      guide: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
      articles: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
      faq: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      about: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    };

    // 2. Navigation Bar & Mobile Drawer Links
    const navLinks = document.querySelectorAll('.nav-links .nav-link, #mobile-drawer .nav-link');
    navLinks.forEach(link => {
      const route = link.getAttribute('data-route-link');
      const icon = ROUTE_ICONS[route] || '';
      let text = '';
      if (route === 'home') text = t.navHome;
      else if (route === 'aura') text = t.navAura;
      else if (route === 'command-center') text = t.navCommand;
      else if (route === 'earth') text = t.navEarth;
      else if (route === 'neural') text = t.navNeural;
      else if (route === 'agents') text = t.navAgents;
      else if (route === 'supervisor') text = t.navSupervisor;
      else if (route === 'knowledge') text = t.navKnowledge;
      else if (route === 'studio') text = t.navStudio;
      else if (route === 'proofs') text = t.navProofs;
      else if (route === 'guide') text = t.navGuide;
      else if (route === 'articles') text = t.navArticles;
      else if (route === 'faq') text = t.navFaq;
      else if (route === 'about') text = t.navAbout;

      if (text) {
        const cleanText = text.replace(/^[^\w\s\u00C0-\u00FF]+\s*/, '');
        link.innerHTML = `${icon}<span>${cleanText}</span>`;
      }
    });

    // 3. Navigation Bar Action Buttons
    updateElementText('pwa-install-btn', t.navInstallApp);
    updateElementText('key-btn', t.navApiKey);
    const navAuthBtn = document.getElementById('nav-auth-btn');
    if (navAuthBtn && !navAuthBtn.textContent.includes('(') && !navAuthBtn.textContent.includes('🟢')) {
      navAuthBtn.textContent = t.navSignIn;
    }

    const keyStatus = document.getElementById('key-status');
    if (keyStatus) {
      if (keyStatus.classList.contains('demo')) keyStatus.textContent = t.keyStatusDemo;
      else if (keyStatus.classList.contains('live')) keyStatus.textContent = t.keyStatusActive;
    }

    // 4. Hero Section
    updateElementText('hero-badge-text', t.heroBadge);
    updateElementText('hero-title-1', t.heroTitle1);
    updateElementText('hero-title-2', t.heroTitle2);
    updateElementText('hero-desc-text', t.heroDesc);
    updateElementText('hero-aura-btn', t.heroAuraBtn);
    updateElementText('hero-launch-btn-text', t.heroLaunchBtn);
    updateElementText('hero-bench-btn', t.heroBenchBtn);

    // 5. Executive KPI Strip
    const kpiCards = document.querySelectorAll('.exec-telemetry-strip .exec-kpi-card');
    if (kpiCards.length >= 4) {
      const spans = [t.kpiNodes, t.kpiEntropy, t.kpiAgency, t.kpiProtocol];
      kpiCards.forEach((card, idx) => {
        const s = card.querySelector('span');
        if (s && spans[idx]) s.textContent = spans[idx];
      });
    }

    // 6. Executive Modular Hub Header & 9 Cards
    const execHeader = document.querySelector('#home-exec-dashboard .section-header');
    if (execHeader) {
      const tag = execHeader.querySelector('.section-tag');
      const title = execHeader.querySelector('.section-title');
      const desc = execHeader.querySelector('.section-desc');
      if (tag) tag.textContent = t.hubTag;
      if (title) title.textContent = t.hubTitle;
      if (desc) desc.textContent = t.hubDesc;
    }

    const cardsMap = {
      'aura': { title: t.cardAuraTitle, desc: t.cardAuraDesc, cta: t.cardAuraCta },
      'command-center': { title: t.cardCommandTitle, desc: t.cardCommandDesc, cta: t.cardCommandCta },
      'neural': { title: t.cardNeuralTitle, desc: t.cardNeuralDesc, cta: t.cardNeuralCta },
      'agents': { title: t.cardAgentsTitle, desc: t.cardAgentsDesc, cta: t.cardAgentsCta },
      'knowledge': { title: t.cardKnowledgeTitle, desc: t.cardKnowledgeDesc, cta: t.cardKnowledgeCta },
      'studio': { title: t.cardStudioTitle, desc: t.cardStudioDesc, cta: t.cardStudioCta },
      'proofs': { title: t.cardProofsTitle, desc: t.cardProofsDesc, cta: t.cardProofsCta },
      'guide': { title: t.cardGuideTitle, desc: t.cardGuideDesc, cta: t.cardGuideCta }
    };

    document.querySelectorAll('.exec-module-card').forEach(card => {
      const route = card.getAttribute('data-goto-route');
      const d = cardsMap[route];
      if (d) {
        const titleEl = card.querySelector('.exec-card-title');
        const descEl = card.querySelector('.exec-card-desc');
        const ctaEl = card.querySelector('.exec-card-cta');
        if (titleEl) titleEl.textContent = d.title;
        if (descEl) descEl.textContent = d.desc;
        if (ctaEl) ctaEl.textContent = d.cta;
      }
    });

    // 7. AURA Live Interface
    const auraHeader = document.querySelector('#companion .section-header');
    if (auraHeader) {
      const tag = auraHeader.querySelector('.section-tag');
      const title = auraHeader.querySelector('.section-title');
      const desc = auraHeader.querySelector('.section-desc');
      if (tag) tag.textContent = t.auraTag;
      if (title) title.textContent = t.auraTitle;
      if (desc) desc.textContent = t.auraDesc;
    }

    const auraInput = document.getElementById('aura-input');
    if (auraInput) auraInput.placeholder = t.auraInputPlaceholder;
    updateElementText('aura-send-btn', t.auraSendBtn);
    updateElementText('aura-state-label', t.auraState);
    updateElementText('aura-emotion-badge', t.auraEmotionBadge);

    const banner = document.querySelector('.aura-philosophy-banner');
    if (banner) {
      banner.innerHTML = `<strong>${t.auraPhilosophyStrong}</strong><br/>${t.auraPhilosophyBody}`;
    }

    // 8. Command Center Section Header
    const ccHeader = document.querySelector('#command-center .section-header');
    if (ccHeader) {
      const tag = ccHeader.querySelector('.section-tag');
      const title = ccHeader.querySelector('.section-title');
      const desc = ccHeader.querySelector('.section-desc');
      if (tag) tag.textContent = t.ccTag;
      if (title) title.textContent = t.ccTitle;
      if (desc) desc.textContent = t.ccDesc;
    }

    // 9. Dispatch custom event for submodules
    window.dispatchEvent(new CustomEvent('nexus:languageChanged', { detail: { lang: currentLang } }));
  }

  function toggleLanguage() {
    applyLanguage(currentLang === 'pt' ? 'en' : 'pt');
  }

  function init() {
    // Bind click listener on language button
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.removeEventListener('click', toggleLanguage);
      langBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleLanguage();
      });
    }

    // Apply stored language
    applyLanguage(currentLang);
  }

  return {
    init,
    applyLanguage,
    toggleLanguage,
    get currentLang() { return currentLang; }
  };
})();

window.I18nEngine = I18nEngine;

// Run immediately if DOM is ready, otherwise on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => I18nEngine.init());
} else {
  I18nEngine.init();
}
