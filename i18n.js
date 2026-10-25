/**
 * NEXUS Sovereign Internationalization & Translation Engine (i18n)
 * Global Multi-Language System with Automatic Local Country & Language Detection
 * 
 * Supported World Standard Languages:
 * - pt: Português (Brasil / Portugal)
 * - en: English (United States / UK / Global)
 * - es: Español (España / América Latina)
 * - fr: Français (France / Francophonie)
 * - de: Deutsch (Deutschland / DACH)
 * - it: Italiano (Italia)
 * - zh: 简体中文 (Chinese)
 * - ja: 日本語 (Japanese)
 * - ar: العربية (Arabic - RTL direction supported)
 * - ru: Русский (Russian)
 * - hi: हिन्दी (Hindi)
 */

const I18nEngine = (() => {
  const SUPPORTED_LANGS = {
    pt: { code: 'pt', label: 'PT', flag: '🇧🇷', native: 'Português', region: 'Brasil / Portugal', dir: 'ltr' },
    en: { code: 'en', label: 'EN', flag: '🇺🇸', native: 'English', region: 'Global / US / UK', dir: 'ltr' },
    es: { code: 'es', label: 'ES', flag: '🇪🇸', native: 'Español', region: 'España / LatAm', dir: 'ltr' },
    fr: { code: 'fr', label: 'FR', flag: '🇫🇷', native: 'Français', region: 'France / Canada', dir: 'ltr' },
    de: { code: 'de', label: 'DE', flag: '🇩🇪', native: 'Deutsch', region: 'Deutschland / DACH', dir: 'ltr' },
    it: { code: 'it', label: 'IT', flag: '🇮🇹', native: 'Italiano', region: 'Italia', dir: 'ltr' },
    zh: { code: 'zh', label: 'ZH', flag: '🇨🇳', native: '简体中文', region: 'China / Global', dir: 'ltr' },
    ja: { code: 'ja', label: 'JA', flag: '🇯🇵', native: '日本語', region: 'Japan', dir: 'ltr' },
    ar: { code: 'ar', label: 'AR', flag: '🇸🇦', native: 'العربية', region: 'Middle East (RTL)', dir: 'rtl' },
    ru: { code: 'ru', label: 'RU', flag: '🇷🇺', native: 'Русский', region: 'Eurasia', dir: 'ltr' },
    hi: { code: 'hi', label: 'HI', flag: '🇮🇳', native: 'हिन्दी', region: 'India', dir: 'ltr' }
  };

  function detectUserLanguage() {
    try {
      const saved = localStorage.getItem('nexus_lang');
      if (saved && SUPPORTED_LANGS[saved]) {
        return saved;
      }

      const navLangs = navigator.languages || [navigator.language || navigator.userLanguage || ''];
      for (const raw of navLangs) {
        if (!raw) continue;
        const code = raw.toLowerCase().split('-')[0];
        if (SUPPORTED_LANGS[code]) {
          return code;
        }
      }

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Sao_Paulo') || tz.includes('Lisbon') || tz.includes('Fortaleza')) return 'pt';
      if (tz.includes('Tokyo')) return 'ja';
      if (tz.includes('Madrid') || tz.includes('Buenos_Aires') || tz.includes('Mexico') || tz.includes('Bogota') || tz.includes('Santiago')) return 'es';
      if (tz.includes('Paris')) return 'fr';
      if (tz.includes('Berlin') || tz.includes('Vienna') || tz.includes('Zurich')) return 'de';
      if (tz.includes('Rome')) return 'it';
      if (tz.includes('Moscow')) return 'ru';
      if (tz.includes('Kolkata')) return 'hi';
      if (tz.includes('Shanghai') || tz.includes('Hong_Kong') || tz.includes('Taipei') || tz.includes('Beijing')) return 'zh';
      if (tz.includes('Riyadh') || tz.includes('Cairo') || tz.includes('Dubai')) return 'ar';
    } catch (_) {}
    return 'en';
  }

  let currentLang = detectUserLanguage();

  const TRANSLATIONS = {
    pt: {
      langBtn: 'PT',
      langTitle: 'Selecionar Idioma Global (Auto-detectado)',
      autoDetectedBadge: 'Detectado pelo seu país/navegador',
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
      kpiNodes: 'Nós Verificados no GraphRAG',
      kpiEntropy: 'Entropia de Shannon H(a)',
      kpiAgency: 'Preservação de Agência Humana',
      kpiProtocol: 'Protocolo Ético & Inclusão TEA',
      hubTag: 'Arquitetura Desacoplada sob Demanda (Lazy-Loaded Modules)',
      hubTitle: 'Ecossistema Modular NEXUS',
      hubDesc: 'Selecione qualquer módulo especializado abaixo. Os motores gráficos pesados (Canvas 60 FPS e Grafo Vetorial SVG) são carregados e renderizados sob demanda exclusivamente quando você acessa sua rota dedicada.',
      cardAuraTitle: 'AURA Live & Pedagogia Inclusiva TEA',
      cardAuraDesc: 'Conversa contínua por voz (hands-free) com inteligência emocional que trata você pelo nome, Diário de Aprendizado Mútuo e Estúdio de Literatura Lúdica (Carol Gray) para TEA.',
      cardAuraCta: 'Acessar AURA & Inclusão TEA →',
      cardCommandTitle: 'Glass-Box Command Center & Chat',
      cardCommandDesc: 'Convergência operacional dos 3 pilares (Mapa de Atenção + GraphRAG, Debate Multi-Agente e Barramento MessageBroker) integrada ao Chat com Cadeia de Pensamento.',
      cardCommandCta: 'Abrir Command Center →',
      cardEarthTitle: 'NEXUS Earth & Mapeamento Planetário 3D',
      cardEarthDesc: 'Ambiente geoespacial com imagens de satélite 4K, KML/GeoJSON, régua geodésica, análise territorial e paridade total estilo Google Earth.',
      cardEarthCta: 'Abrir Earth Geo →',
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
      auraTag: 'AURA — Adaptive Understanding & Respectful Agent',
      auraTitle: 'Daily-Learning Companion & IA de Empatia Pluralista',
      auraDesc: 'Converse por voz ou texto exatamente como no Gemini Live. A AURA aprende diariamente com você de forma segura, divertida e educativa — compreendendo que todo ser vivente enxerga o mundo de um jeito único.',
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
      ccTag: 'Centro de Controle de IA Glass-Box',
      ccTitle: 'Convergência Cognitiva & Operacional Unificada',
      ccDesc: 'Ao contrário de chatbots de caixa-preta convencionais, envie uma única diretriz e visualize os 3 pilares operando simultaneamente: Inspeção de Tensores e GraphRAG, Consenso Multi-Agente DAG e Barramento MessageBroker.',
      earthTag: 'Geointeligência Soberana • Paridade Google Earth & IA Planetária',
      earthTitle: 'NEXUS Earth & Inteligência Geoespacial Soberana',
      earthDesc: 'Ambiente planetário de alta precisão inspirado no Google Earth Pro e Web: imagens de satélite 4K, geolocalização avançada, importação e exportação de arquivos KML/GeoJSON, régua geodésica e análise territorial por Superinteligência.',
      earthMenuFile: 'Arquivo ▾',
      earthMenuEdit: 'Editar ▾',
      earthMenuView: 'Visualizar ▾',
      earthMenuAdd: 'Adicionar ▾',
      earthMenuTools: 'Ferramentas ▾',
      earthMenuHelp: 'Ajuda ▾'
    },

    en: {
      langBtn: 'EN',
      langTitle: 'Select Global Language (Auto-detected)',
      autoDetectedBadge: 'Detected from your country/browser',
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
      kpiNodes: 'Verified GraphRAG Nodes',
      kpiEntropy: 'Shannon Entropy H(a)',
      kpiAgency: 'Human Agency Preservation',
      kpiProtocol: 'Ethical Protocol & TEA Inclusion',
      hubTag: 'Decoupled On-Demand Architecture (Lazy-Loaded Modules)',
      hubTitle: 'NEXUS Modular Ecosystem',
      hubDesc: 'Select any specialized module below. Heavy visual engines (60 FPS Canvas and Vector SVG Graph) are loaded and rendered on-demand exclusively when you navigate to their dedicated route.',
      cardAuraTitle: 'AURA Live & TEA Inclusive Pedagogy',
      cardAuraDesc: 'Continuous hands-free voice dialogue with emotional intelligence addressing you by name, Mutual Learning Journal, and Carol Gray Social Story studio for TEA.',
      cardAuraCta: 'Access AURA & TEA Support →',
      cardCommandTitle: 'Glass-Box Command Center & Chat',
      cardCommandDesc: 'Operational convergence of the 3 foundational pillars (Attention Tensor + GraphRAG, Multi-Agent Debate, and MessageBroker Bus) paired with Chain-of-Thought Chat.',
      cardCommandCta: 'Open Command Center →',
      cardEarthTitle: 'NEXUS Earth & 3D Planetary Mapping',
      cardEarthDesc: 'Geospatial environment with 4K satellite imagery, KML/GeoJSON processing, geodesic ruler, territorial analysis, and full Google Earth parity.',
      cardEarthCta: 'Open Earth Geo →',
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
      auraTag: 'AURA — Adaptive Understanding & Respectful Agent',
      auraTitle: 'Daily-Learning Companion & Pluralistic Empathy AI',
      auraDesc: 'Chat via live voice or text just like Gemini Live. AURA learns with you every day in a safe, fun, and educational manner — understanding that every living being perceives the world in a unique way.',
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
      ccTag: 'Glass-Box AI Control Center',
      ccTitle: 'Unified Cognitive & Operational Convergence',
      ccDesc: 'Unlike black-box chatbots, dispatch a directive below and watch all 3 pillars operate in parallel: Tensor & GraphRAG Inspection, Multi-Agent Consensus, and MessageBroker Bus.',
      earthTag: 'Sovereign Geospatial • Google Earth Parity & Planetary AI',
      earthTitle: 'NEXUS Earth & Sovereign Geospatial Intelligence',
      earthDesc: 'High-precision planetary environment inspired by Google Earth Pro and Web: 4K satellite imagery, advanced geolocation, KML/GeoJSON import and export, geodesic ruler, and territorial AI analysis.',
      earthMenuFile: 'File ▾',
      earthMenuEdit: 'Edit ▾',
      earthMenuView: 'View ▾',
      earthMenuAdd: 'Add ▾',
      earthMenuTools: 'Tools ▾',
      earthMenuHelp: 'Help ▾'
    },

    es: {
      langBtn: 'ES',
      langTitle: 'Seleccionar Idioma Global (Auto-detectado)',
      autoDetectedBadge: 'Detectado según tu país/navegador',
      navHome: 'Inicio',
      navAura: 'AURA Live',
      navCommand: 'Comando',
      navEarth: 'Earth Geo',
      navNeural: 'Neural',
      navAgents: 'Agentes',
      navSupervisor: 'Supervisor',
      navKnowledge: 'Conocimiento',
      navStudio: 'Estudio',
      navProofs: 'Pruebas',
      navGuide: 'Guía',
      navArticles: 'Artículos',
      navFaq: 'FAQ',
      navAbout: 'Sobre Nosotros',
      navInstallApp: 'Instalar App',
      navSignIn: 'Iniciar Sesión',
      navApiKey: 'Clave API',
      keyStatusDemo: 'MODO DEMO',
      keyStatusActive: 'GEMINI CLOUD ACTIVO',
      keyStatusReady: 'GRAPHRAG LISTO',
      heroBadge: 'Superinteligencia Cooperativa Glass-Box • Arquitectura de Investigación Abierta',
      heroTitle1: 'Superinteligencia Transparente.',
      heroTitle2: 'Alineada con la Pluralidad Humana.',
      heroDesc: 'NEXUS converge Interpretabilidad Mecanística (entropía de Shannon y tensores de atención en vivo), Consenso Multi-Agente DAG, GraphRAG Vectorial (Wikipedia + Crossref DOIs) y AURA — compañera de voz empática diseñada para la neurodiversidad (TEA).',
      heroAuraBtn: '✨ Conversar con AURA Live',
      heroLaunchBtn: '⚡ Glass-Box Command Center',
      heroBenchBtn: '🏛️ Whitepaper & Benchmarks',
      statThreads: 'Hilos de Hardware',
      statFps: 'FPS de Render',
      statCalls: 'Llamadas API Reales',
      kpiNodes: 'Nodos Verificados GraphRAG',
      kpiEntropy: 'Entropía de Shannon H(a)',
      kpiAgency: 'Preservación de Agencia Humana',
      kpiProtocol: 'Protocolo Ético & Inclusión TEA',
      hubTag: 'Arquitectura Desacoplada Bajo Demanda (Módulos Lazy-Loaded)',
      hubTitle: 'Ecosistema Modular NEXUS',
      hubDesc: 'Seleccione cualquier módulo especializado abajo. Los motores gráficos pesados se cargan y renderizan bajo demanda exclusivamente en su ruta dedicada.',
      cardAuraTitle: 'AURA Live & Pedagogía Inclusiva TEA',
      cardAuraDesc: 'Diálogo continuo por voz manos libres con inteligencia emocional, Diario de Aprendizaje Mutuo y Estudio de Historias Sociales para TEA.',
      cardAuraCta: 'Acceder a AURA & Apoyo TEA →',
      cardCommandTitle: 'Glass-Box Command Center & Chat',
      cardCommandDesc: 'Convergencia operativa de los 3 pilares con Chat de Cadena de Pensamiento integrado.',
      cardCommandCta: 'Abrir Command Center →',
      cardEarthTitle: 'NEXUS Earth & Mapeo Planetario 3D',
      cardEarthDesc: 'Entorno geoespacial con imágenes satelitales 4K, KML/GeoJSON, regla geodésica y paridad con Google Earth.',
      cardEarthCta: 'Abrir Earth Geo →',
      cardNeuralTitle: 'Interpretabilidad Mecanística (MLP)',
      cardNeuralDesc: 'Inspección matemática en tiempo real de propagación directa e inversa y entropía de Shannon.',
      cardNeuralCta: 'Inspeccionar Red Neuronal →',
      cardAgentsTitle: 'Razonamiento Multi-Agente (DAG)',
      cardAgentsDesc: 'Orquestación autónoma de 4 agentes especializados (Planner, Critic, Executor y Verifier) hasta el consenso.',
      cardAgentsCta: 'Ejecutar Pipeline de Agentes →',
      cardKnowledgeTitle: 'GraphRAG & Wikipedia/DOI en Vivo',
      cardKnowledgeDesc: 'Explorador interactivo del Grafo de Conocimiento conectado a Wikipedia REST y Crossref DOIs.',
      cardKnowledgeCta: 'Explorar Grafo de Conocimiento →',
      cardStudioTitle: 'Estudio Multimodal & Calendario (.ICS)',
      cardStudioDesc: 'Síntesis de diagramas SVG dinámicos, informes Markdown y exportación RFC 5545 iCalendar.',
      cardStudioCta: 'Abrir Estudio Creativo →',
      cardProofsTitle: 'Pruebas Formales & Benchmarks',
      cardProofsDesc: 'Whitepaper matemático completo, citas BibTeX académicas y suite de tests con hash SHA-256.',
      cardProofsCta: 'Auditar Pruebas y Métricas →',
      cardGuideTitle: 'Guía Educativa & Manual Técnico Senior',
      cardGuideDesc: 'Manual completo con 100% de verificación técnica, SEO estructurado Schema.org y fórmulas formales.',
      cardGuideCta: 'Explorar Guía Oficial →',
      auraTag: 'AURA — Adaptive Understanding & Respectful Agent',
      auraTitle: 'Daily-Learning Companion & IA de Empatía Pluralista',
      auraDesc: 'Conversa por voz o texto como en Gemini Live. AURA aprende contigo a diario con respeto y comprensión única.',
      auraRole: 'AURA — Agente de Comunicación Viva',
      auraState: 'Lista para conversar y aprender contigo hoy',
      auraVoiceLive: '🎙️ Voz en Vivo',
      auraVoiceOn: '🔊 Voz ON',
      auraVoiceOff: '🔈 Voz Silenciada',
      auraUserNameLabel: '👤 Tu Nombre:',
      auraStyleLabel: '🧭 Mi Estilo:',
      auraEmotionBadge: '🤝 Tono: Empatía & Enfoque',
      auraInputPlaceholder: 'Habla con AURA (aprende cada día de tu forma única)…',
      auraSendBtn: 'Enviar',
      auraJournalTitle: '📔 Diario de Aprendizaje Mutuo',
      auraJournalClear: 'Limpiar',
      auraPhilosophyStrong: '🤝 Principio de Pluralidad Humana:',
      auraPhilosophyBody: 'Cada ser viviente percibe el mundo de forma única. Cuando un método no funciona para el 1%, otro camino funciona — iguales en dignidad, diversos en nuestra forma de ser.',
      auraLearnedLabel: 'Lo que AURA ha aprendido contigo',
      ccTag: 'Centro de Control IA Glass-Box',
      ccTitle: 'Convergencia Cognitiva y Operacional',
      ccDesc: 'Envía una directriz y observa los tres pilares operando en paralelo con total transparencia.',
      earthTag: 'Geointeligencia Soberana • Paridad Google Earth',
      earthTitle: 'NEXUS Earth & Inteligencia Geoespacial Soberana',
      earthDesc: 'Entorno planetario de alta precisión con satélite 4K, geolocalización, soporte KML/GeoJSON y análisis territorial con IA.',
      earthMenuFile: 'Archivo ▾',
      earthMenuEdit: 'Editar ▾',
      earthMenuView: 'Ver ▾',
      earthMenuAdd: 'Añadir ▾',
      earthMenuTools: 'Herramientas ▾',
      earthMenuHelp: 'Ayuda ▾'
    },

    fr: {
      langBtn: 'FR',
      langTitle: 'Sélectionner la Langue Mondiale (Auto-détectée)',
      autoDetectedBadge: 'Détecté selon votre pays/navigateur',
      navHome: 'Accueil',
      navAura: 'AURA Live',
      navCommand: 'Commande',
      navEarth: 'Earth Géo',
      navNeural: 'Neural',
      navAgents: 'Agents',
      navSupervisor: 'Superviseur',
      navKnowledge: 'Savoir',
      navStudio: 'Studio',
      navProofs: 'Preuves',
      navGuide: 'Guide',
      navArticles: 'Articles',
      navFaq: 'FAQ',
      navAbout: 'À Propos',
      navInstallApp: 'Installer App',
      navSignIn: 'Connexion',
      navApiKey: 'Clé API',
      keyStatusDemo: 'MODE DÉMO',
      keyStatusActive: 'GEMINI CLOUD ACTIF',
      keyStatusReady: 'GRAPHRAG PRÊT',
      heroBadge: 'Superintelligence Coopérative Glass-Box • Recherche Ouverte',
      heroTitle1: 'Superintelligence Transparente.',
      heroTitle2: 'Alignée sur la Pluralité Humaine.',
      heroDesc: 'NEXUS allie Interprétabilité Mécaniste (entropie de Shannon & tenseurs en direct), Consensus Multi-Agents DAG, GraphRAG Vectoriel et AURA — compagne vocale empathique pour la neurodiversité.',
      heroAuraBtn: '✨ Parler à AURA Live',
      heroLaunchBtn: '⚡ Glass-Box Command Center',
      heroBenchBtn: '🏛️ Whitepaper & Benchmarks',
      statThreads: 'Threads Matériels',
      statFps: 'FPS de Rendu',
      statCalls: 'Appels API Réels',
      kpiNodes: 'Nœuds GraphRAG Vérifiés',
      kpiEntropy: 'Entropie de Shannon H(a)',
      kpiAgency: 'Préservation de l’Agence Humaine',
      kpiProtocol: 'Protocole Éthique & Inclusion TSA',
      hubTag: 'Architecture Découplée à la Demande',
      hubTitle: 'Écosystème Modulaire NEXUS',
      hubDesc: 'Sélectionnez un module spécialisé. Les moteurs graphiques lourds sont rendus à la demande sur leur itinéraire dédié.',
      cardAuraTitle: 'AURA Live & Pédagogie Inclusive TSA',
      cardAuraDesc: 'Dialogue vocal mains-libres continu, Journal d’Apprentissage Mutuel et scénarios sociaux pour le TSA.',
      cardAuraCta: 'Accéder à AURA →',
      cardCommandTitle: 'Glass-Box Command Center & Chat',
      cardCommandDesc: 'Convergence opérationnelle des 3 piliers avec Chat à chaîne de pensée.',
      cardCommandCta: 'Ouvrir Command Center →',
      cardEarthTitle: 'NEXUS Earth & Cartographie Planétaire 3D',
      cardEarthDesc: 'Environnement géospatial avec imagerie 4K satellite, KML/GeoJSON, règle géodésique et parité Google Earth.',
      cardEarthCta: 'Ouvrir Earth Géo →',
      cardNeuralTitle: 'Interprétabilité Mécaniste (MLP)',
      cardNeuralDesc: 'Inspection mathématique en direct des tenseurs et de l’entropie de Shannon.',
      cardNeuralCta: 'Inspecter Réseau Neuronal →',
      cardAgentsTitle: 'Raisonnement Multi-Agents (DAG)',
      cardAgentsDesc: 'Orchestration autonome de 4 agents (Planner, Critic, Executor, Verifier) vers le consensus.',
      cardAgentsCta: 'Lancer Pipeline d’Agents →',
      cardKnowledgeTitle: 'GraphRAG & Wikipedia/DOI en Direct',
      cardKnowledgeDesc: 'Explorateur de graphe de connaissances relié aux API Wikipédia et aux DOI scientifiques Crossref.',
      cardKnowledgeCta: 'Explorer le Graphe →',
      cardStudioTitle: 'Studio Multimodal & Calendrier (.ICS)',
      cardStudioDesc: 'Synthèse dynamique en SVG, rapports Markdown et planification d’événements RFC 5545.',
      cardStudioCta: 'Ouvrir le Studio Créatif →',
      cardProofsTitle: 'Preuves Formelles & Benchmarks',
      cardProofsDesc: 'Whitepaper rigoureux, exportations BibTeX académiques et métriques certifiées SHA-256.',
      cardProofsCta: 'Consulter les Preuves →',
      cardGuideTitle: 'Guide Éducatif & Manuel Technique',
      cardGuideDesc: 'Manuel technique approfondi, SEO structuré Schema.org et conformité réglementaire intégrale.',
      cardGuideCta: 'Explorer le Guide Officiel →',
      auraTag: 'AURA — Adaptive Understanding & Respectful Agent',
      auraTitle: 'Daily-Learning Companion & IA d’Empathie Pluraliste',
      auraDesc: 'Discutez par la voix ou par texte. AURA apprend quotidiennement avec vous de manière sûre et bienveillante.',
      auraRole: 'AURA — Agente de Communication Vivante',
      auraState: 'Prête à dialoguer et apprendre avec vous aujourd’hui',
      auraVoiceLive: '🎙️ Voix en Direct',
      auraVoiceOn: '🔊 Voix ON',
      auraVoiceOff: '🔈 Voix Muette',
      auraUserNameLabel: '👤 Votre Nom :',
      auraStyleLabel: '🧭 Mon Style :',
      auraEmotionBadge: '🤝 Ton : Empathie & Clarté',
      auraInputPlaceholder: 'Parlez à AURA (elle apprend chaque jour de votre singularité)…',
      auraSendBtn: 'Envoyer',
      auraJournalTitle: '📔 Journal d’Apprentissage Mutuel',
      auraJournalClear: 'Effacer',
      auraPhilosophyStrong: '🤝 Principe de Pluralité Humaine :',
      auraPhilosophyBody: 'Chaque être perçoit le monde de façon unique. Égaux en dignité et divers dans notre façon d’être.',
      auraLearnedLabel: 'Ce qu’AURA a appris avec vous',
      ccTag: 'Centre de Contrôle IA Glass-Box',
      ccTitle: 'Convergence Cognitive et Opérationnelle',
      ccDesc: 'Supervisez les trois piliers opérant en direct avec une transparence absolue.',
      earthTag: 'Géointelligence Souveraine • Parité Google Earth',
      earthTitle: 'NEXUS Earth & Intelligence Géospatiale',
      earthDesc: 'Environnement planétaire haute fidélité avec imagerie satellite 4K, géolocalisation et analyse par IA.',
      earthMenuFile: 'Fichier ▾',
      earthMenuEdit: 'Édition ▾',
      earthMenuView: 'Affichage ▾',
      earthMenuAdd: 'Ajouter ▾',
      earthMenuTools: 'Outils ▾',
      earthMenuHelp: 'Aide ▾'
    },

    de: {
      langBtn: 'DE',
      langTitle: 'Globale Sprache wählen (Automatisch erkannt)',
      autoDetectedBadge: 'Erkannt anhand Ihres Landes/Browsers',
      navHome: 'Startseite',
      navAura: 'AURA Live',
      navCommand: 'Kommando',
      navEarth: 'Earth Geo',
      navNeural: 'Neural',
      navAgents: 'Agenten',
      navSupervisor: 'Supervisor',
      navKnowledge: 'Wissen',
      navStudio: 'Studio',
      navProofs: 'Beweise',
      navGuide: 'Handbuch',
      navArticles: 'Artikel',
      navFaq: 'FAQ',
      navAbout: 'Über Uns',
      navInstallApp: 'App Installieren',
      navSignIn: 'Anmelden',
      navApiKey: 'API-Schlüssel',
      keyStatusDemo: 'DEMO-MODUS',
      keyStatusActive: 'GEMINI CLOUD AKTIV',
      keyStatusReady: 'GRAPHRAG BEREIT',
      heroBadge: 'Kooperative Glass-Box-Superintelligenz • Offene Forschungsarchitektur',
      heroTitle1: 'Transparente Superintelligenz.',
      heroTitle2: 'Abgestimmt auf Menschliche Pluralität.',
      heroDesc: 'NEXUS vereint mechanistische Interpretierbarkeit, Multi-Agenten-DAG-Konsens, Vektor-GraphRAG und AURA — empathische Kommunikationsbegleiterin für kognitive Vielfalt und Inklusion.',
      heroAuraBtn: '✨ Mit AURA Live sprechen',
      heroLaunchBtn: '⚡ Glass-Box Command Center',
      heroBenchBtn: '🏛️ Whitepaper & Benchmarks',
      statThreads: 'Hardware-Threads',
      statFps: 'Render-FPS',
      statCalls: 'Echte API-Aufrufe',
      kpiNodes: 'Verifizierte GraphRAG-Knoten',
      kpiEntropy: 'Shannon-Entropie H(a)',
      kpiAgency: 'Wahrung Menschlicher Autonomie',
      kpiProtocol: 'Ethisches Protokoll & Inklusion',
      hubTag: 'Entkoppelte On-Demand-Architektur',
      hubTitle: 'Modulares NEXUS-Ökosystem',
      hubDesc: 'Wählen Sie ein Spezialmodul. Aufwändige Grafik-Engines laden bedarfsgerecht bei Anwahl der dedizierten Route.',
      cardAuraTitle: 'AURA Live & Inklusive Pädagogik',
      cardAuraDesc: 'Fortlaufender Freisprech-Sprachdialog, gegenseitiges Lerntagebuch und soziale Geschichten.',
      cardAuraCta: 'AURA öffnen →',
      cardCommandTitle: 'Glass-Box Command Center & Chat',
      cardCommandDesc: 'Operative Konvergenz der 3 Säulen integriert mit Chain-of-Thought Chat.',
      cardCommandCta: 'Command Center öffnen →',
      cardEarthTitle: 'NEXUS Earth & 3D-Planetenkartierung',
      cardEarthDesc: 'Geodatenumgebung mit 4K-Satellitenbildern, KML/GeoJSON, geodätischem Lineal und Google-Earth-Parität.',
      cardEarthCta: 'Earth Geo öffnen →',
      cardNeuralTitle: 'Mechanistische Interpretierbarkeit (MLP)',
      cardNeuralDesc: 'Mathematische Echtzeit-Inspektion von Tensoren und Shannon-Entropie.',
      cardNeuralCta: 'Netzwerk inspizieren →',
      cardAgentsTitle: 'Multi-Agenten-Inferenz (DAG)',
      cardAgentsDesc: 'Autonome Koordination von 4 Agenten (Planner, Critic, Executor, Verifier) zum Konsens.',
      cardAgentsCta: 'Agenten-Pipeline starten →',
      cardKnowledgeTitle: 'GraphRAG & Live-Wikipedia/DOI',
      cardKnowledgeDesc: 'Interaktiver Wissensgraph verbunden mit Wikipedia REST und Crossref DOIs.',
      cardKnowledgeCta: 'Wissensgraphen erkunden →',
      cardStudioTitle: 'Multimodales Studio & Kalender (.ICS)',
      cardStudioDesc: 'Dynamische SVG-Synthese, Markdown-Berichte und RFC 5545 Kalenderexport.',
      cardStudioCta: 'Studio öffnen →',
      cardProofsTitle: 'Formale Beweise & Benchmarks',
      cardProofsDesc: 'Vollständiges mathematisches Whitepaper, BibTeX-Zitate und SHA-256 gesicherte Benchmarks.',
      cardProofsCta: 'Beweise prüfen →',
      cardGuideTitle: 'Bildungshandbuch & Fachdokumentation',
      cardGuideDesc: 'Ausführliches technisches Handbuch mit Schema.org SEO und vollständiger Compliance.',
      cardGuideCta: 'Offizielles Handbuch öffnen →',
      auraTag: 'AURA — Adaptive Understanding & Respectful Agent',
      auraTitle: 'Daily-Learning Begleiterin & Pluralismus-KI',
      auraDesc: 'Sprechen Sie per Sprache oder Text. AURA lernt täglich mit Ihnen und respektiert jede Denkweise.',
      auraRole: 'AURA — Lebendige Kommunikationsagentin',
      auraState: 'Bereit für den heutigen Austausch mit Ihnen',
      auraVoiceLive: '🎙️ Live-Stimme',
      auraVoiceOn: '🔊 Stimme AN',
      auraVoiceOff: '🔈 Stumm',
      auraUserNameLabel: '👤 Ihr Name:',
      auraStyleLabel: '🧭 Mein Stil:',
      auraEmotionBadge: '🤝 Ton: Empathie & Fokus',
      auraInputPlaceholder: 'Mit AURA sprechen (sie lernt täglich von Ihrer Denkweise)…',
      auraSendBtn: 'Senden',
      auraJournalTitle: '📔 Gegenseitiges Lerntagebuch',
      auraJournalClear: 'Leeren',
      auraPhilosophyStrong: '🤝 Prinzip Menschlicher Vielfalt:',
      auraPhilosophyBody: 'Gleich an Würde und vielfältig in unserer Art zu sein, mit Respekt und Sicherheit für alle.',
      auraLearnedLabel: 'Was AURA von Ihnen gelernt hat',
      ccTag: 'Glass-Box KI-Kontrollzentrum',
      ccTitle: 'Kognitive und Operative Einheit',
      ccDesc: 'Überwachen Sie alle drei Säulen parallel mit voller mathematischer Transparenz.',
      earthTag: 'Souveräne Geointelligenz • Google Earth Parität',
      earthTitle: 'NEXUS Earth & Geodaten-Intelligenz',
      earthDesc: 'Hochpräzise Planetenumgebung mit 4K-Satellitenbildern, Geopositionierung und KI-Terrainanalyse.',
      earthMenuFile: 'Datei ▾',
      earthMenuEdit: 'Bearbeiten ▾',
      earthMenuView: 'Ansicht ▾',
      earthMenuAdd: 'Hinzufügen ▾',
      earthMenuTools: 'Werkzeuge ▾',
      earthMenuHelp: 'Hilfe ▾'
    },

    it: {
      langBtn: 'IT',
      langTitle: 'Seleziona Lingua Globale (Riconoscimento Automatico)',
      autoDetectedBadge: 'Rilevato in base al tuo paese/browser',
      navHome: 'Home',
      navAura: 'AURA Live',
      navCommand: 'Comando',
      navEarth: 'Earth Geo',
      navNeural: 'Neurone',
      navAgents: 'Agenti',
      navSupervisor: 'Supervisore',
      navKnowledge: 'Sapere',
      navStudio: 'Studio',
      navProofs: 'Prove',
      navGuide: 'Guida',
      navArticles: 'Articoli',
      navFaq: 'FAQ',
      navAbout: 'Chi Siamo',
      navInstallApp: 'Installa App',
      navSignIn: 'Accedi',
      navApiKey: 'Chiave API',
      keyStatusDemo: 'MODO DEMO',
      keyStatusActive: 'GEMINI CLOUD ATTIVO',
      keyStatusReady: 'GRAPHRAG PRONTO',
      heroBadge: 'Superintelligenza Cooperativa Glass-Box • Ricerca Aperta',
      heroTitle1: 'Superintelligenza Trasparente.',
      heroTitle2: 'Allineata alla Pluralità Umana.',
      heroDesc: 'NEXUS unisce Interpretabilità Meccanicistica, Consenso Multi-Agente DAG, GraphRAG Vettoriale e AURA — compagna di comunicazione vocale empatica creata per la diversità cognitiva.',
      heroAuraBtn: '✨ Parla con AURA Live',
      heroLaunchBtn: '⚡ Glass-Box Command Center',
      heroBenchBtn: '🏛️ Whitepaper & Benchmark',
      statThreads: 'Thread Hardware',
      statFps: 'Render FPS',
      statCalls: 'Chiamate API Reali',
      kpiNodes: 'Nodi GraphRAG Verificati',
      kpiEntropy: 'Entropia di Shannon H(a)',
      kpiAgency: 'Preservazione dell’Autonomia',
      kpiProtocol: 'Protocollo Etico & Inclusione',
      hubTag: 'Architettura su Misura Disaccoppiata',
      hubTitle: 'Ecosistema Modulare NEXUS',
      hubDesc: 'Seleziona un modulo specializzato. I motori grafici pesanti caricano su richiesta quando accedi alla rotta dedicata.',
      cardAuraTitle: 'AURA Live & Pedagogia Inclusiva',
      cardAuraDesc: 'Dialogo continuo a voce, Diario di Apprendimento Condiviso e supporto cognitivo.',
      cardAuraCta: 'Apri AURA →',
      cardCommandTitle: 'Glass-Box Command Center & Chat',
      cardCommandDesc: 'Convergenza operativa dei 3 pilastri unificata con Chat Chain-of-Thought.',
      cardCommandCta: 'Apri Command Center →',
      cardEarthTitle: 'NEXUS Earth & Mappatura Planetaria 3D',
      cardEarthDesc: 'Ambiente geospaziale con immagini satellitari 4K, KML/GeoJSON, righello geodetico e parità Google Earth.',
      cardEarthCta: 'Apri Earth Geo →',
      cardNeuralTitle: 'Interpretabilità Meccanicistica (MLP)',
      cardNeuralDesc: 'Ispezione matematica in tempo reale di tensori ed entropia di Shannon.',
      cardNeuralCta: 'Ispeziona Rete Neurale →',
      cardAgentsTitle: 'Ragionamento Multi-Agente (DAG)',
      cardAgentsDesc: 'Coordinamento autonomo di 4 agenti (Planner, Critic, Executor, Verifier) per il consenso.',
      cardAgentsCta: 'Esegui Pipeline Agenti →',
      cardKnowledgeTitle: 'GraphRAG & Wikipedia/DOI in Tempo Reale',
      cardKnowledgeDesc: 'Grafo di conoscenza connesso a Wikipedia REST e DOI scientifici Crossref.',
      cardKnowledgeCta: 'Esplora Grafo →',
      cardStudioTitle: 'Studio Multimodale & Agenda (.ICS)',
      cardStudioDesc: 'Sintesi SVG dinamica, report Markdown ed esportazione RFC 5545 iCalendar.',
      cardStudioCta: 'Apri Studio Creativo →',
      cardProofsTitle: 'Prove Formali & Benchmark',
      cardProofsDesc: 'Whitepaper matematico completo, citazioni BibTeX e hash crittografico SHA-256.',
      cardProofsCta: 'Verifica Prove →',
      cardGuideTitle: 'Guida Tecnica Ufficiale',
      cardGuideDesc: 'Manuale completo al 100% veritiero con formule matematiche e architettura Glass-Box.',
      cardGuideCta: 'Esplora Guida Ufficiale →',
      auraTag: 'AURA — Adaptive Understanding & Respectful Agent',
      auraTitle: 'Daily-Learning Companion & IA Empatica',
      auraDesc: 'Parla a voce o per testo. AURA apprende con te ogni giorno comprendendo la tua unicità.',
      auraRole: 'AURA — Agente di Comunicazione Viva',
      auraState: 'Pronta a conversare e imparare con te oggi',
      auraVoiceLive: '🎙️ Voce Live',
      auraVoiceOn: '🔊 Voce ON',
      auraVoiceOff: '🔈 Muto',
      auraUserNameLabel: '👤 Tuo Nome:',
      auraStyleLabel: '🧭 Mio Stile:',
      auraEmotionBadge: '🤝 Tono: Empatia & Focus',
      auraInputPlaceholder: 'Parla con AURA (apprende ogni giorno dalla tua unicità)…',
      auraSendBtn: 'Invia',
      auraJournalTitle: '📔 Diario di Apprendimento Reciproco',
      auraJournalClear: 'Cancella',
      auraPhilosophyStrong: '🤝 Principio di Pluralità Umana:',
      auraPhilosophyBody: 'Uguali in dignità e diversi nel nostro modo di essere, con rispetto e sicurezza per tutti.',
      auraLearnedLabel: 'Cosa ha imparato AURA da te',
      ccTag: 'Centro di Controllo IA Glass-Box',
      ccTitle: 'Convergenza Cognitiva & Operativa',
      ccDesc: 'Invia una direttiva e osserva i tre pilastri operare con trasparenza totale.',
      earthTag: 'Geointelligenza Sovrana • Parità Google Earth',
      earthTitle: 'NEXUS Earth & Intelligenza Geospaziale',
      earthDesc: 'Ambiente planetario con satelliti 4K, coordinate, KML/GeoJSON e analisi territoriale IA.',
      earthMenuFile: 'File ▾',
      earthMenuEdit: 'Modifica ▾',
      earthMenuView: 'Visualizza ▾',
      earthMenuAdd: 'Aggiungi ▾',
      earthMenuTools: 'Strumenti ▾',
      earthMenuHelp: 'Aiuto ▾'
    },

    zh: {
      langBtn: '中文',
      langTitle: '选择全球语言（根据地区自动识别）',
      autoDetectedBadge: '根据您的所在国家/浏览器自动识别',
      navHome: '首页',
      navAura: 'AURA 实时语音',
      navCommand: '指令中心',
      navEarth: '地球地理',
      navNeural: '神经网络',
      navAgents: '多智能体',
      navSupervisor: '超级监督',
      navKnowledge: '知识图谱',
      navStudio: '创作工作室',
      navProofs: '数学证明',
      navGuide: '技术指南',
      navArticles: '学术论文',
      navFaq: '常见问答',
      navAbout: '关于我们',
      navInstallApp: '安装应用',
      navSignIn: '登录',
      navApiKey: 'API 密钥',
      keyStatusDemo: '演示模式',
      keyStatusActive: 'GEMINI 云已激活',
      keyStatusReady: 'GRAPHRAG 就绪',
      heroBadge: '透明可解释协作超级智能 • 开放研究架构',
      heroTitle1: '透明开放的超级智能。',
      heroTitle2: '契合人类多样性与认知多元。',
      heroDesc: 'NEXUS 汇聚机械可解释性（香农熵与实时注意力张量）、多智能体 DAG 对抗共识、向量 GraphRAG 以及 AURA —— 专为认知多元性与包容性打造的实时高情商语音伴侣。',
      heroAuraBtn: '✨ 与 AURA 实时对话',
      heroLaunchBtn: '⚡ Glass-Box 指令中心',
      heroBenchBtn: '🏛️ 白皮书与基准测试',
      statThreads: '硬件计算线程',
      statFps: '渲染帧率 FPS',
      statCalls: '真实 API 调用',
      kpiNodes: 'GraphRAG 验证节点',
      kpiEntropy: '香农熵 H(a)',
      kpiAgency: '人类自主性保障',
      kpiProtocol: '伦理协议与包容性',
      hubTag: '解耦按需架构（惰性加载模块）',
      hubTitle: 'NEXUS 模块化生态系统',
      hubDesc: '选择下方专门模块。高性能 60FPS 画布与 SVG 向量图谱仅在导航至专属路由时按需加载。',
      cardAuraTitle: 'AURA 实时伴侣与包容性支持',
      cardAuraDesc: '免提连续语音交互、共同学习日记以及认知多样性支持工作室。',
      cardAuraCta: '开启 AURA 伴侣 →',
      cardCommandTitle: 'Glass-Box 指令中心与对话',
      cardCommandDesc: '三大支柱统一协同运作，集成思维链 Chain-of-Thought 逻辑推理。',
      cardCommandCta: '进入指令中心 →',
      cardEarthTitle: 'NEXUS 地球与 3D 行星测绘',
      cardEarthDesc: '4K 卫星影像、KML/GeoJSON 处理、测地距离测量，全面对标谷歌地球。',
      cardEarthCta: '进入地球地理 →',
      cardNeuralTitle: '机械可解释性神经网络 (MLP)',
      cardNeuralDesc: '正向与反向传播数学透视、香农熵实时计算与信号注入测试。',
      cardNeuralCta: '透视神经网络 →',
      cardAgentsTitle: '多智能体 DAG 协同推理',
      cardAgentsDesc: '四大专业智能体（规划、批评、执行、验证）协同达成交付共识。',
      cardAgentsCta: '启动智能体流水线 →',
      cardKnowledgeTitle: '向量 GraphRAG 与维基/DOI 实时图谱',
      cardKnowledgeDesc: '连接维基百科与 Crossref DOI 学术文献的实时 1-Hop 子图知识图谱。',
      cardKnowledgeCta: '探索知识图谱 →',
      cardStudioTitle: '多模态工作室与日历自动化 (.ICS)',
      cardStudioDesc: '生成动态 SVG 架构图、Markdown 执行摘要及 RFC 5545 日历日程。',
      cardStudioCta: '进入创作工作室 →',
      cardProofsTitle: '形式化数学证明与复现基准',
      cardProofsDesc: '严谨学术白皮书、BibTeX 导出、SHA-256 签名消融实验及普罗米修斯指标。',
      cardProofsCta: '查验数学证明 →',
      cardGuideTitle: '教育指南与资深技术手册',
      cardGuideDesc: '100% 真实全面的技术全书，涵盖 Schema.org 结构化 SEO 与合规认证。',
      cardGuideCta: '查阅官方技术手册 →',
      auraTag: 'AURA — Adaptive Understanding & Respectful Agent',
      auraTitle: '每日学习伴侣与多元共情人工智能',
      auraDesc: '像 Gemini Live 一样通过语音或文字交流。AURA 每天安全友善地伴您学习，理解每位个体的独特认知。',
      auraRole: 'AURA — 鲜活生命化交流智能体',
      auraState: '今天已准备好与您交流并共同学习',
      auraVoiceLive: '🎙️ 实时语音',
      auraVoiceOn: '🔊 语音开启',
      auraVoiceOff: '🔈 静音',
      auraUserNameLabel: '👤 您的称呼：',
      auraStyleLabel: '🧭 我的风格：',
      auraEmotionBadge: '🤝 语调：共情与专注',
      auraInputPlaceholder: '与 AURA 对话（她每天都在学习理解您独特的视角）…',
      auraSendBtn: '发送',
      auraJournalTitle: '📔 共同学习日记（加密安全）',
      auraJournalClear: '清空',
      auraPhilosophyStrong: '🤝 人类多样性原则：',
      auraPhilosophyBody: '每一个生命都以独特视角看待世界。尊严平等，各具精彩，以尊重和安全包容所有人。',
      auraLearnedLabel: 'AURA 与您共同习得的认知',
      ccTag: 'Glass-Box 人工智能控制中心',
      ccTitle: '统一认知与操作汇聚',
      ccDesc: '输入一条指令，实时掌控三大支柱并发运作全流程。',
      earthTag: '主权地理智能 • 对标谷歌地球与行星级 AI',
      earthTitle: 'NEXUS Earth 与主权地理空间智能',
      earthDesc: '高精度行星级地理环境：4K 卫星影像、高阶定位、KML/GeoJSON 导入导出与超级智能地貌分析。',
      earthMenuFile: '文件 ▾',
      earthMenuEdit: '编辑 ▾',
      earthMenuView: '视图 ▾',
      earthMenuAdd: '添加 ▾',
      earthMenuTools: '工具 ▾',
      earthMenuHelp: '帮助 ▾'
    },

    ja: {
      langBtn: 'JA',
      langTitle: 'グローバル言語を選択（自動検出）',
      autoDetectedBadge: 'お使いの地域・ブラウザから自動検出',
      navHome: 'ホーム',
      navAura: 'AURA ライブ',
      navCommand: 'コマンド',
      navEarth: '地球ジオ',
      navNeural: 'ニューラル',
      navAgents: 'エージェント',
      navSupervisor: '監督官',
      navKnowledge: 'ナレッジ',
      navStudio: 'スタジオ',
      navProofs: '証明',
      navGuide: 'ガイド',
      navArticles: '論文',
      navFaq: 'FAQ',
      navAbout: '会社概要',
      navInstallApp: 'アプリ導入',
      navSignIn: 'ログイン',
      navApiKey: 'APIキー',
      keyStatusDemo: 'デモモード',
      keyStatusActive: 'GEMINI CLOUD 稼働中',
      keyStatusReady: 'GRAPHRAG 準備完了',
      heroBadge: '透明性の高い協調型超知能 • オープン研究アーキテクチャ',
      heroTitle1: '透明で開かれた超知能。',
      heroTitle2: '人間の多様性に寄り添う。',
      heroDesc: 'NEXUS は、機構的解釈可能性（リアルタイムのシャノンエントロピーとアテンションテンソル）、マルチエージェント DAG 合意形成、ベクトル GraphRAG、そして認知の多様性に寄り添う共感型対話エージェント AURA を統合します。',
      heroAuraBtn: '✨ AURA Live と対話する',
      heroLaunchBtn: '⚡ Glass-Box コマンドセンター',
      heroBenchBtn: '🏛️ ホワイトペーパーと検証',
      statThreads: 'ハードウェアスレッド',
      statFps: '描画 FPS',
      statCalls: '実 API 呼出数',
      kpiNodes: '検証済 GraphRAG ノード',
      kpiEntropy: 'シャノンエントロピー H(a)',
      kpiAgency: '人間の主体性の保持',
      kpiProtocol: '倫理規定とインクルージョン',
      hubTag: 'オンデマンド非同期アーキテクチャ',
      hubTitle: 'NEXUS モジュラーエコシステム',
      hubDesc: '専門モジュールを選択してください。高負荷なグラフィックエンジンは必要な時にのみ描画されます。',
      cardAuraTitle: 'AURA ライブ＆インクルーシブ教育',
      cardAuraDesc: 'ハンズフリー音声対話、相互学習ジャーナル、認知特性に配慮した支援スタジオ。',
      cardAuraCta: 'AURA を開く →',
      cardCommandTitle: 'Glass-Box コマンドセンター',
      cardCommandDesc: '3大基盤のリアルタイム統合と Chain-of-Thought 推論チャット。',
      cardCommandCta: 'コマンドセンターを開く →',
      cardEarthTitle: 'NEXUS Earth & 3D 惑星マッピング',
      cardEarthDesc: '4K 衛星写真、KML/GeoJSON 対応、測地線距離計測、Google Earth パリティ。',
      cardEarthCta: '地球ジオを開く →',
      cardNeuralTitle: '機構的解釈可能性 (MLP)',
      cardNeuralDesc: 'テンソルの伝播とシャノンエントロピーの数学的リアルタイム可視化。',
      cardNeuralCta: 'ニューラル網を検証 →',
      cardAgentsTitle: 'マルチエージェント協調推論 (DAG)',
      cardAgentsDesc: '4つの専門エージェントが自律的に連携し、合意を形成します。',
      cardAgentsCta: 'エージェントを実行 →',
      cardKnowledgeTitle: 'GraphRAG ＆ ライブナレッジ',
      cardKnowledgeDesc: 'Wikipedia や Crossref DOI 学術論文と直結したリアルタイム知識グラフ。',
      cardKnowledgeCta: '知識グラフを探索 →',
      cardStudioTitle: 'マルチモーダルスタジオ＆予定連携 (.ICS)',
      cardStudioDesc: '動的 SVG 生成、Markdown レポート作成、カレンダー自動出力。',
      cardStudioCta: 'スタジオを開く →',
      cardProofsTitle: '形式的数学証明＆ベンチマーク',
      cardProofsDesc: '完全な論文仕様、BibTeX 引用、SHA-256 署名付き再現性テスト。',
      cardProofsCta: '証明を確認 →',
      cardGuideTitle: '教育ガイド＆公式技術手引書',
      cardGuideDesc: '100% 正確な公式手引書、Schema.org SEO および法規制対応。',
      cardGuideCta: '公式ガイドを開く →',
      auraTag: 'AURA — Adaptive Understanding & Respectful Agent',
      auraTitle: 'デイリーラーニング＆共感型知能',
      auraDesc: 'Gemini Live のように音声やテキストで話しかけてください。AURA は毎日あなた独自の視点を学びます。',
      auraRole: 'AURA — リアルタイム対話エージェント',
      auraState: 'あなたとお話しする準備が整いました',
      auraVoiceLive: '🎙️ 音声ライブ',
      auraVoiceOn: '🔊 音声 ON',
      auraVoiceOff: '🔈 ミュート',
      auraUserNameLabel: '👤 お名前：',
      auraStyleLabel: '🧭 私のスタイル：',
      auraEmotionBadge: '🤝 トーン：共感と集中',
      auraInputPlaceholder: 'AURA に話しかける（彼女はあなたの個性を毎日学びます）…',
      auraSendBtn: '送信',
      auraJournalTitle: '📔 相互学習ジャーナル（暗号化）',
      auraJournalClear: 'クリア',
      auraPhilosophyStrong: '🤝 人間の多様性原則：',
      auraPhilosophyBody: 'すべての生命は世界を独自の方法で理解しています。尊厳は平等であり、個性は尊重されます。',
      auraLearnedLabel: 'AURA があなたから学んだ知見',
      ccTag: 'Glass-Box AI 制御センター',
      ccTitle: '認知的・運用的統合',
      ccDesc: '指令を送信し、3大基盤が並列稼働する様子を完全な透明性のもとで確認してください。',
      earthTag: '主権型空間知能 • Google Earth パリティ',
      earthTitle: 'NEXUS Earth & 地球空間知能',
      earthDesc: '高精度な惑星環境：4K 衛星写真、高度測位、KML/GeoJSON の入出力、AI による地形分析。',
      earthMenuFile: 'ファイル ▾',
      earthMenuEdit: '編集 ▾',
      earthMenuView: '表示 ▾',
      earthMenuAdd: '追加 ▾',
      earthMenuTools: 'ツール ▾',
      earthMenuHelp: 'ヘルプ ▾'
    },

    ar: {
      langBtn: 'العربية',
      langTitle: 'اختيار اللغة العالمية (اكتشاف تلقائي)',
      autoDetectedBadge: 'تم اكتشافها تلقائياً بناءً على بلدك ومتصفحك',
      navHome: 'الرئيسية',
      navAura: 'أورا لايف',
      navCommand: 'مركز القيادة',
      navEarth: 'أرض جيو',
      navNeural: 'الشبكة العصبية',
      navAgents: 'الوكلاء',
      navSupervisor: 'المشرف',
      navKnowledge: 'المعرفة',
      navStudio: 'الاستوديو',
      navProofs: 'البراهين',
      navGuide: 'الدليل',
      navArticles: 'المقالات',
      navFaq: 'الأسئلة الشائعة',
      navAbout: 'من نحن',
      navInstallApp: 'تثبيت التطبيق',
      navSignIn: 'تسجيل الدخول',
      navApiKey: 'مفتاح API',
      keyStatusDemo: 'وضع العرض',
      keyStatusActive: 'سحابة جيميني نشطة',
      keyStatusReady: 'GraphRAG جاهز',
      heroBadge: 'ذكاء فائق تعاوني شفاف (Glass-Box) • بنية بحثية مفتوحة',
      heroTitle1: 'ذكاء فائق شفاف وموثوق.',
      heroTitle2: 'متوافق مع التعددية الإنسانية.',
      heroDesc: 'يجمع NEXUS بين إمكانية التفسير الميكانيكي، وإجماع الوكلاء المتعددين (DAG)، وGraphRAG الموجه، وAURA — الرفيقة الصوتية الحية التي تراعي التنوع المعرفي.',
      heroAuraBtn: '✨ تحدث مع AURA لايف',
      heroLaunchBtn: '⚡ مركز قيادة Glass-Box',
      heroBenchBtn: '🏛️ الورقة العلمية والمعايير',
      statThreads: 'مسارات المعالجة',
      statFps: 'معدل الإطارات FPS',
      statCalls: 'استدعاءات API الحقيقية',
      kpiNodes: 'عقد GraphRAG الموثقة',
      kpiEntropy: 'إنتروبيا شانون H(a)',
      kpiAgency: 'حفظ الإرادة البشرية',
      kpiProtocol: 'البروتوكول الأخلاقي والشمول',
      hubTag: 'بنية معيارية عند الطلب',
      hubTitle: 'منظومة NEXUS المعيارية',
      hubDesc: 'اختر أي وحدة متخصصة أدناه. يتم تحميل المحركات الرسومية عند الطلب فقط لضمان أقصى سرعة.',
      cardAuraTitle: 'AURA Live والتربية الشاملة',
      cardAuraDesc: 'محادثة صوتية حية مستمرة، مذكرة التعلم المتبادل، واستوديو القصص الداعمة.',
      cardAuraCta: 'الدخول إلى AURA →',
      cardCommandTitle: 'مركز قيادة Glass-Box والمحادثة',
      cardCommandDesc: 'التقارب التشغيلي للركائز الثلاث متكامل مع سلسلة الأفكار المنطقية.',
      cardCommandCta: 'فتح مركز القيادة →',
      cardEarthTitle: 'NEXUS Earth ورسم الخرائط الكوكبية 3D',
      cardEarthDesc: 'صور فضائية 4K، معالجة KML/GeoJSON، مسطرة جيوديسية، ومطابقة كاملة لـ Google Earth.',
      cardEarthCta: 'فتح كوكب الأرض →',
      cardNeuralTitle: 'التفسير الميكانيكي (MLP)',
      cardNeuralDesc: 'فحص رياضي مباشر لتدفق التنسورات وإنتروبيا شانون بدقة متناهية.',
      cardNeuralCta: 'فحص الشبكة العصبية →',
      cardAgentsTitle: 'الاستدلال متعدد الوكلاء (DAG)',
      cardAgentsDesc: 'تنسيق ذاتي لأربعة وكلاء متخصصين وصولاً للإجماع الكامل.',
      cardAgentsCta: 'تشغيل خط أنابيب الوكلاء →',
      cardKnowledgeTitle: 'GraphRAG ورسم المعرفة المباشر',
      cardKnowledgeDesc: 'مستكشف رسوم بيانية للمعرفة مرتبط بـ Wikipedia وCrossref DOIs.',
      cardKnowledgeCta: 'استكشاف رسم المعرفة →',
      cardStudioTitle: 'استوديو متعدد الوسائط والتقويم (.ICS)',
      cardStudioDesc: 'توليد رسوم بيانية SVG ديناميكية، تقارير Markdown وتصدير تقويم قياسي.',
      cardStudioCta: 'فتح الاستوديو الإبداعي →',
      cardProofsTitle: 'البراهين الرياضية والاختبارات القياسية',
      cardProofsDesc: 'ورقة بحثية علمية كاملة، توثيق BibTeX، واختبارات قياسية مختومة بـ SHA-256.',
      cardProofsCta: 'تدقيق البراهين →',
      cardGuideTitle: 'الدليل التعليمي والمرجع التقني',
      cardGuideDesc: 'دليل شامل وموثق 100% يشرح كافة وظائف المنصة مع مراعاة المعايير القياسية.',
      cardGuideCta: 'استكشاف الدليل الرسمي →',
      auraTag: 'AURA — Adaptive Understanding & Respectful Agent',
      auraTitle: 'الرفيقة اليومية وذكاء التعاطف التعددي',
      auraDesc: 'تحدث بالصوت أو النص كما في Gemini Live. تتعلم AURA معك يومياً باحترام وأمان.',
      auraRole: 'AURA — وكيلة التواصل الحي',
      auraState: 'جاهزة للحديث والتعلم معك اليوم',
      auraVoiceLive: '🎙️ صوت مباشر',
      auraVoiceOn: '🔊 الصوت يعمل',
      auraVoiceOff: '🔈 صامت',
      auraUserNameLabel: '👤 اسمك:',
      auraStyleLabel: '🧭 أسلوبي:',
      auraEmotionBadge: '🤝 النبرة: تعاطف وتركيز',
      auraInputPlaceholder: 'تحدث مع AURA (تتعلم يومياً من طريقتك الفريدة)…',
      auraSendBtn: 'إرسال',
      auraJournalTitle: '📔 سجل التعلم المتبادل',
      auraJournalClear: 'مسح',
      auraPhilosophyStrong: '🤝 مبدأ التعددية الإنسانية:',
      auraPhilosophyBody: 'كل كائن حي يدرك العالم بطريقة فريدة. متساوون في الكرامة ومتنوعون في طرق العيش باحترام وأمان للجميع.',
      auraLearnedLabel: 'ما تعلمته AURA معك',
      ccTag: 'مركز التحكم بالذكاء الاصطناعي الشفاف',
      ccTitle: 'التقارب المعرفي والتشغيلي الموحد',
      ccDesc: 'أرسل توجيهاً وشاهد الركائز الثلاث تعمل بتزامن تام وشفافية مطلقة.',
      earthTag: 'الذكاء الجغرافي السيادي • مطابقة Google Earth',
      earthTitle: 'NEXUS Earth والذكاء الجغرافي السيادي',
      earthDesc: 'بيئة كوكبية عالية الدقة: صور أقمار صناعية 4K، تحديد مواقع متقدم وتحليل جغرافي بالذكاء الاصطناعي.',
      earthMenuFile: 'ملف ▾',
      earthMenuEdit: 'تعديل ▾',
      earthMenuView: 'عرض ▾',
      earthMenuAdd: 'إضافة ▾',
      earthMenuTools: 'أدوات ▾',
      earthMenuHelp: 'مساعدة ▾'
    },

    ru: {
      langBtn: 'RU',
      langTitle: 'Выбор мирового языка (Автоопределение)',
      autoDetectedBadge: 'Определено по вашей стране и браузеру',
      navHome: 'Главная',
      navAura: 'AURA Live',
      navCommand: 'Команды',
      navEarth: 'Earth Гео',
      navNeural: 'Нейросеть',
      navAgents: 'Агенты',
      navSupervisor: 'Супервизор',
      navKnowledge: 'База знаний',
      navStudio: 'Студия',
      navProofs: 'Доказательства',
      navGuide: 'Руководство',
      navArticles: 'Статьи',
      navFaq: 'FAQ',
      navAbout: 'О нас',
      navInstallApp: 'Установить',
      navSignIn: 'Вход',
      navApiKey: 'API-ключ',
      keyStatusDemo: 'ДЕМО-РЕЖИМ',
      keyStatusActive: 'GEMINI CLOUD АКТИВЕН',
      keyStatusReady: 'GRAPHRAG ГОТОВ',
      heroBadge: 'Прозрачный кооперативный сверхразум Glass-Box • Открытая архитектура',
      heroTitle1: 'Прозрачный сверхразум.',
      heroTitle2: 'В гармонии с человеческим многообразием.',
      heroDesc: 'NEXUS объединяет механистическую интерпретируемость (энтропия Шеннона и тензоры внимания в реальном времени), мультиагентный консенсус DAG, векторный GraphRAG и AURA — эмпатичного голосового компаньона.',
      heroAuraBtn: '✨ Поговорить с AURA Live',
      heroLaunchBtn: '⚡ Командный центр Glass-Box',
      heroBenchBtn: '🏛️ Whitepaper и тесты',
      statThreads: 'Потоки оборудования',
      statFps: 'FPS рендера',
      statCalls: 'Реальные вызовы API',
      kpiNodes: 'Проверенные узлы GraphRAG',
      kpiEntropy: 'Энтропия Шеннона H(a)',
      kpiAgency: 'Сохранение агентности человека',
      kpiProtocol: 'Этический протокол и инклюзивность',
      hubTag: 'Модульная архитектура по требованию',
      hubTitle: 'Модульная экосистема NEXUS',
      hubDesc: 'Выберите модуль ниже. Высоконагруженные графические движки загружаются исключительно при переходе на выделенный маршрут.',
      cardAuraTitle: 'AURA Live и инклюзивная педагогика',
      cardAuraDesc: 'Непрерывный голосовой диалог hands-free, дневник взаимного обучения и социальные сценарии.',
      cardAuraCta: 'Перейти к AURA →',
      cardCommandTitle: 'Командный центр Glass-Box и Чат',
      cardCommandDesc: 'Операционная конвергенция трех столпов платформы с поддержкой цепочки рассуждений (CoT).',
      cardCommandCta: 'Открыть Командный центр →',
      cardEarthTitle: 'NEXUS Earth и 3D-планетарные карты',
      cardEarthDesc: 'Спутниковые снимки 4K, обработка KML/GeoJSON, геодезическая линейка и паритет с Google Earth.',
      cardEarthCta: 'Открыть Earth Гео →',
      cardNeuralTitle: 'Механистическая интерпретируемость (MLP)',
      cardNeuralDesc: 'Математический анализ тензоров и расчет энтропии Шеннона в реальном времени.',
      cardNeuralCta: 'Инспектировать нейросеть →',
      cardAgentsTitle: 'Мультиагентные рассуждения (DAG)',
      cardAgentsDesc: 'Автономная координация 4 специализированных агентов для достижения консенсуса.',
      cardAgentsCta: 'Запустить агентов →',
      cardKnowledgeTitle: 'GraphRAG и Граф Знаний (Wiki/DOI)',
      cardKnowledgeDesc: 'Интерактивный граф знаний, подключенный к Wikipedia REST API и Crossref DOI.',
      cardKnowledgeCta: 'Исследовать Граф Знаний →',
      cardStudioTitle: 'Мультимодальная студия и календарь (.ICS)',
      cardStudioDesc: 'Генерация динамических SVG-схем, отчетов в Markdown и экспорт задач RFC 5545.',
      cardStudioCta: 'Открыть Студию →',
      cardProofsTitle: 'Формальные доказательства и бенчмарки',
      cardProofsDesc: 'Академический Whitepaper, цитаты BibTeX и воспроизводимые тесты с хешами SHA-256.',
      cardProofsCta: 'Проверить доказательства →',
      cardGuideTitle: 'Техническое руководство и документация',
      cardGuideDesc: 'Полное подтвержденное руководство со структурированным Schema.org SEO и соответствием нормам.',
      cardGuideCta: 'Открыть руководство →',
      auraTag: 'AURA — Adaptive Understanding & Respectful Agent',
      auraTitle: 'Компаньон ежедневного обучения и эмпатии',
      auraDesc: 'Общайтесь голосом или текстом, как в Gemini Live. AURA ежедневно учится вместе с вами с уважением к вашей индивидуальности.',
      auraRole: 'AURA — Живой агент коммуникации',
      auraState: 'Готова к общению и обучению с вами сегодня',
      auraVoiceLive: '🎙️ Живой голос',
      auraVoiceOn: '🔊 Звук ВКЛ',
      auraVoiceOff: '🔈 Без звука',
      auraUserNameLabel: '👤 Ваше имя:',
      auraStyleLabel: '🧭 Мой стиль:',
      auraEmotionBadge: '🤝 Тон: Эмпатия и фокус',
      auraInputPlaceholder: 'Поговорите с AURA (она ежедневно познает ваш уникальный взгляд)…',
      auraSendBtn: 'Отправить',
      auraJournalTitle: '📔 Дневник взаимного обучения',
      auraJournalClear: 'Очистить',
      auraPhilosophyStrong: '🤝 Принцип человеческого многообразия:',
      auraPhilosophyBody: 'Каждое живое существо воспринимает мир уникально. Равны в достоинстве и разнообразны в проявлениях.',
      auraLearnedLabel: 'Что AURA узнала вместе с вами',
      ccTag: 'Центр управления ИИ Glass-Box',
      ccTitle: 'Единая когнитивная и операционная конвергенция',
      ccDesc: 'Отправьте директиву и наблюдайте за синхронной работой трех фундаментальных столпов.',
      earthTag: 'Суверенный геоинтеллект • Паритет с Google Earth',
      earthTitle: 'NEXUS Earth и геопространственный интеллект',
      earthDesc: 'Высокоточная планетарная среда: снимки 4K, геолокация, KML/GeoJSON и анализ рельефа с помощью ИИ.',
      earthMenuFile: 'Файл ▾',
      earthMenuEdit: 'Правка ▾',
      earthMenuView: 'Вид ▾',
      earthMenuAdd: 'Добавить ▾',
      earthMenuTools: 'Инструменты ▾',
      earthMenuHelp: 'Справка ▾'
    },

    hi: {
      langBtn: 'HI',
      langTitle: 'वैश्विक भाषा चुनें (स्वतः पहचानी गई)',
      autoDetectedBadge: 'आपके देश और ब्राउज़र के अनुसार पहचानी गई',
      navHome: 'होम',
      navAura: 'AURA लाइव',
      navCommand: 'कमांड',
      navEarth: 'अर्थ जियो',
      navNeural: 'न्यूरल',
      navAgents: 'एजेंट्स',
      navSupervisor: 'पर्यवेक्षक',
      navKnowledge: 'ज्ञान कोष',
      navStudio: 'स्टूडियो',
      navProofs: 'प्रमाण',
      navGuide: 'मार्गदर्शिका',
      navArticles: 'लेख',
      navFaq: 'FAQ',
      navAbout: 'हमारे बारे में',
      navInstallApp: 'ऐप इंस्टॉल करें',
      navSignIn: 'लॉग इन',
      navApiKey: 'API कुंजी',
      keyStatusDemo: 'डेमो मोड',
      keyStatusActive: 'GEMINI क्लाउड सक्रिय',
      keyStatusReady: 'GRAPHRAG तैयार',
      heroBadge: 'पारदर्शी सहकारी सुपरइंटेलिजेंस (Glass-Box) • खुला अनुसंधान ढांचा',
      heroTitle1: 'पारदर्शी सुपरइंटेलिजेंस।',
      heroTitle2: 'मानव बहुलता और विविधता के अनुकूल।',
      heroDesc: 'NEXUS वास्तविक समय शैनन एंट्रॉपी, मल्टी-एजेंट DAG सर्वसम्मति, वेक्टर GraphRAG और AURA — संज्ञान विविधता के लिए तैयार की गई संवेदनशील आवाज़ साथी को जोड़ता है।',
      heroAuraBtn: '✨ AURA Live से बात करें',
      heroLaunchBtn: '⚡ Glass-Box कमांड सेंटर',
      heroBenchBtn: '🏛️ श्वेतपत्र और मानक',
      statThreads: 'हार्डवेयर थ्रेड्स',
      statFps: 'रेंडर FPS',
      statCalls: 'वास्तविक API कॉल्स',
      kpiNodes: 'सत्यापित GraphRAG नोड्स',
      kpiEntropy: 'शैनन एंट्रॉपी H(a)',
      kpiAgency: 'मानव स्वायत्तता का संरक्षण',
      kpiProtocol: 'नैतिक प्रोटोकॉल और समावेश',
      hubTag: 'मांग पर आधारित मॉड्यूलर वास्तुकला',
      hubTitle: 'NEXUS मॉड्यूलर इकोसिस्टम',
      hubDesc: 'नीचे से कोई भी मॉड्यूल चुनें। उच्च क्षमता वाले ग्राफिक्स इंजन केवल समर्पित मार्ग पर जाने पर ही लोड होते हैं।',
      cardAuraTitle: 'AURA Live और समावेशी शिक्षा',
      cardAuraDesc: 'हैंड्स-फ्री निरंतर वॉयस संवाद, साझा सीखने की डायरी और न्यूरोडाइवर्सिटी सहायता।',
      cardAuraCta: 'AURA खोलें →',
      cardCommandTitle: 'Glass-Box कमांड सेंटर और चैट',
      cardCommandDesc: 'विचार श्रृंखला (CoT) चैट के साथ तीनों स्तंभों का एकीकृत संचालन।',
      cardCommandCta: 'कमांड सेंटर खोलें →',
      cardEarthTitle: 'NEXUS Earth और 3D ग्रहीय मानचित्रण',
      cardEarthDesc: '4K उपग्रह चित्र, KML/GeoJSON समर्थन, भूगणितीय पैमाना और Google Earth जैसी सुविधाएं।',
      cardEarthCta: 'अर्थ जियो खोलें →',
      cardNeuralTitle: 'क्रियाविधि व्याख्यात्मकता (MLP)',
      cardNeuralDesc: 'टेंसर प्रवाह और शैनन एंट्रॉपी का वास्तविक समय गणितीय निरीक्षण।',
      cardNeuralCta: 'न्यूरल नेटवर्क जांचें →',
      cardAgentsTitle: 'मल्टी-एजेंट तर्क (DAG)',
      cardAgentsDesc: 'सर्वसम्मति तक पहुँचने के लिए 4 विशेषज्ञ एजेंटों का स्वायत्त समन्वय।',
      cardAgentsCta: 'एजेंट पाइपलाइन चलाएं →',
      cardKnowledgeTitle: 'GraphRAG और लाइव ज्ञान ग्राफ',
      cardKnowledgeDesc: 'विकिपीडिया और Crossref DOI वैज्ञानिक संदर्भों से जुड़ा ज्ञान ग्राफ।',
      cardKnowledgeCta: 'ज्ञान ग्राफ देखें →',
      cardStudioTitle: 'मल्टीमॉडल स्टूडियो और कैलेंडर (.ICS)',
      cardStudioDesc: 'डायनामिक SVG आरेख, मार्कडाउन रिपोर्ट और RFC 5545 कैलेंडर कार्य।',
      cardStudioCta: 'स्टूडियो खोलें →',
      cardProofsTitle: 'औपचारिक प्रमाण और बेंचमार्क',
      cardProofsDesc: 'सम्पूर्ण गणितीय श्वेतपत्र, BibTeX संदर्भ और SHA-256 सत्यापित परीक्षण।',
      cardProofsCta: 'प्रमाण देखें →',
      cardGuideTitle: 'शैक्षणिक गाइड और तकनीकी मैनुअल',
      cardGuideDesc: '100% सत्यापित तथ्यों और संरचित Schema.org SEO के साथ आधिकारिक गाइड।',
      cardGuideCta: 'गाइड पढ़ें →',
      auraTag: 'AURA — Adaptive Understanding & Respectful Agent',
      auraTitle: 'दैनिक साथी और संवेदनशील AI',
      auraDesc: 'Gemini Live की तरह आवाज़ या टेक्स्ट से बात करें। AURA हर दिन आपके साथ सम्मान से सीखती है।',
      auraRole: 'AURA — सजीव संचार एजेंट',
      auraState: 'आज आपसे बात करने और सीखने के लिए तैयार',
      auraVoiceLive: '🎙️ लाइव आवाज़',
      auraVoiceOn: '🔊 आवाज़ चालू',
      auraVoiceOff: '🔈 म्यूट',
      auraUserNameLabel: '👤 आपका नाम:',
      auraStyleLabel: '🧭 मेरा अंदाज़:',
      auraEmotionBadge: '🤝 टोन: सहानुभूति और फोकस',
      auraInputPlaceholder: 'AURA से बात करें (वह हर दिन आपके अनूठे दृष्टिकोण से सीखती है)…',
      auraSendBtn: 'भेजें',
      auraJournalTitle: '📔 पारस्परिक सीखने की डायरी',
      auraJournalClear: 'साफ़ करें',
      auraPhilosophyStrong: '🤝 मानव बहुलता का सिद्धांत:',
      auraPhilosophyBody: 'हर प्राणी दुनिया को अपने अनूठे नज़रिए से समझता है। गरिमा में समान और विविधता में सुरक्षित।',
      auraLearnedLabel: 'AURA ने आपके साथ क्या सीखा',
      ccTag: 'Glass-Box AI नियंत्रण केंद्र',
      ccTitle: 'एकीकृत संज्ञानात्मक और परिचालन संगम',
      ccDesc: 'एक निर्देश भेजें और तीनों स्तंभों को पूर्ण पारदर्शिता के साथ एक साथ कार्य करते देखें।',
      earthTag: 'संप्रभु भू-स्थानिक बुद्धिमत्ता • Google Earth क्षमता',
      earthTitle: 'NEXUS Earth और ग्रहीय बुद्धिमत्ता',
      earthDesc: 'उच्च सटीकता वाला ग्रहीय परिवेश: 4K उपग्रह चित्र, उन्नत भौगोलिक स्थान और AI भूभाग विश्लेषण।',
      earthMenuFile: 'फ़ाइल ▾',
      earthMenuEdit: 'संपादित करें ▾',
      earthMenuView: 'देखें ▾',
      earthMenuAdd: 'जोड़ें ▾',
      earthMenuTools: 'उपकरण ▾',
      earthMenuHelp: 'मदद ▾'
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

  function renderDropdownMenu() {
    const menu = document.getElementById('lang-dropdown-menu');
    if (!menu) return;

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    let html = `
      <div class="lang-dropdown-header" style="font-size:0.72rem;color:var(--text-muted);padding:0.4rem 0.5rem;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:0.35rem;display:flex;align-items:center;justify-content:space-between;">
        <span>🌐 ${t.autoDetectedBadge || 'Selecione o Idioma'}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;">
    `;

    for (const [key, langObj] of Object.entries(SUPPORTED_LANGS)) {
      const isSelected = key === currentLang;
      html += `
        <button class="lang-dropdown-item ${isSelected ? 'active' : ''}" data-lang-code="${key}" style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:0.45rem 0.65rem;border:none;background:${isSelected ? 'rgba(0,245,255,0.18)' : 'transparent'};color:${isSelected ? 'var(--cyan)' : '#e2e8f0'};border-radius:6px;cursor:pointer;font-size:0.83rem;text-align:left;transition:all 0.15s ease;">
          <span style="display:flex;align-items:center;gap:0.5rem;">
            <span style="font-size:1.1rem;line-height:1;">${langObj.flag}</span>
            <strong style="font-weight:${isSelected ? '600' : '400'}">${langObj.native}</strong>
          </span>
          <span style="font-size:0.72rem;color:var(--text-muted);opacity:0.8;">${langObj.label}</span>
        </button>
      `;
    }

    html += `</div>`;
    menu.innerHTML = html;

    menu.querySelectorAll('.lang-dropdown-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const code = btn.getAttribute('data-lang-code');
        if (code && SUPPORTED_LANGS[code]) {
          applyLanguage(code);
          closeDropdown();
        }
      });
    });
  }

  function closeDropdown() {
    const menu = document.getElementById('lang-dropdown-menu');
    const btn = document.getElementById('lang-toggle-btn');
    if (menu) menu.style.display = 'none';
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function toggleDropdown(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('lang-dropdown-menu');
    const btn = document.getElementById('lang-toggle-btn');
    if (!menu) return;
    const isHidden = menu.style.display === 'none' || !menu.style.display;
    if (isHidden) {
      renderDropdownMenu();
      menu.style.display = 'block';
      if (btn) btn.setAttribute('aria-expanded', 'true');
    } else {
      closeDropdown();
    }
  }

  function applyLanguage(lang) {
    if (!SUPPORTED_LANGS[lang]) lang = 'en';
    currentLang = lang;
    try {
      localStorage.setItem('nexus_lang', currentLang);
    } catch (_) {}

    const langConfig = SUPPORTED_LANGS[currentLang];
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    // Document HTML Lang & Direction (RTL support for Arabic, LTR for others)
    document.documentElement.lang = currentLang;
    document.documentElement.dir = langConfig.dir || 'ltr';

    // 1. Navbar Language Button
    const langBtn = document.getElementById('lang-toggle-btn');
    const langCodeEl = document.getElementById('current-lang-code');
    if (langCodeEl) {
      langCodeEl.textContent = `${langConfig.flag} ${langConfig.label}`;
    } else if (langBtn) {
      langBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <span>${langConfig.flag} ${langConfig.label}</span>
      `;
    }
    if (langBtn) {
      langBtn.title = `${t.langTitle} • ${langConfig.native} (${langConfig.region})`;
    }

    // 2. Navigation Route Icons
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

    // 3. Navigation Bar & Mobile Drawer Links
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
        const cleanText = text.replace(/^[^\w\s\u00C0-\u00FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\u0400-\u04FF\u0900-\u097F]+\s*/, '');
        link.innerHTML = `${icon}<span>${cleanText}</span>`;
      }
    });

    // 4. Action Buttons
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

    // 5. Hero Section
    updateElementText('hero-badge-text', t.heroBadge);
    updateElementText('hero-title-1', t.heroTitle1);
    updateElementText('hero-title-2', t.heroTitle2);
    updateElementText('hero-desc-text', t.heroDesc);
    updateElementText('hero-aura-btn', t.heroAuraBtn);
    updateElementText('hero-launch-btn-text', t.heroLaunchBtn);
    updateElementText('hero-bench-btn', t.heroBenchBtn);

    // 6. KPI Strip
    const kpiCards = document.querySelectorAll('.exec-telemetry-strip .exec-kpi-card');
    if (kpiCards.length >= 4) {
      const spans = [t.kpiNodes, t.kpiEntropy, t.kpiAgency, t.kpiProtocol];
      kpiCards.forEach((card, idx) => {
        const s = card.querySelector('span');
        if (s && spans[idx]) s.textContent = spans[idx];
      });
    }

    // 7. Executive Modular Hub
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
      'earth': { title: t.cardEarthTitle, desc: t.cardEarthDesc, cta: t.cardEarthCta },
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

    // 8. AURA Live Interface
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

    // 9. Command Center Section Header
    const ccHeader = document.querySelector('#command-center .section-header');
    if (ccHeader) {
      const tag = ccHeader.querySelector('.section-tag');
      const title = ccHeader.querySelector('.section-title');
      const desc = ccHeader.querySelector('.section-desc');
      if (tag) tag.textContent = t.ccTag;
      if (title) title.textContent = t.ccTitle;
      if (desc) desc.textContent = t.ccDesc;
    }

    // 10. Earth Geo Section & Menu Bar
    const earthSection = document.getElementById('earth');
    if (earthSection) {
      const earthTag = earthSection.querySelector('.section-tag');
      const earthTitle = earthSection.querySelector('.section-title');
      const earthDesc = earthSection.querySelector('.section-desc');
      if (earthTag) earthTag.textContent = t.earthTag;
      if (earthTitle) earthTitle.textContent = t.earthTitle;
      if (earthDesc) earthDesc.textContent = t.earthDesc;

      const menuButtons = earthSection.querySelectorAll('.earth-menu-btn');
      menuButtons.forEach(btn => {
        const m = btn.getAttribute('data-menu');
        if (m === 'file') btn.textContent = t.earthMenuFile;
        else if (m === 'edit') btn.textContent = t.earthMenuEdit;
        else if (m === 'view') btn.textContent = t.earthMenuView;
        else if (m === 'add') btn.textContent = t.earthMenuAdd;
        else if (m === 'tools') btn.textContent = t.earthMenuTools;
        else if (m === 'help') btn.textContent = t.earthMenuHelp;
      });
    }

    // Dispatch custom event for submodules (AURA, Earth, etc.)
    window.dispatchEvent(new CustomEvent('nexus:languageChanged', { 
      detail: { 
        lang: currentLang, 
        config: langConfig, 
        translations: t 
      } 
    }));
  }

  function init() {
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.addEventListener('click', toggleDropdown);
    }

    document.addEventListener('click', (e) => {
      const wrapper = document.querySelector('.lang-selector-container');
      if (wrapper && !wrapper.contains(e.target)) {
        closeDropdown();
      }
    });

    applyLanguage(currentLang);
  }

  return {
    init,
    applyLanguage,
    toggleDropdown,
    detectUserLanguage,
    get currentLang() { return currentLang; },
    get supportedLanguages() { return SUPPORTED_LANGS; }
  };
})();

window.I18nEngine = I18nEngine;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => I18nEngine.init());
} else {
  I18nEngine.init();
}
