// App Bootstrap + Modular SPA Router (NexusRouter) + Lazy-Loading Controller + Zero-Mobile-Data Sandbox + PWA Manager
(function enforceMobileZeroDeviceDataSandbox() {
  try {
    // Strictly block access to mobile device geolocation, contacts, bluetooth, usb, and serial APIs
    if (typeof navigator !== 'undefined') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition = (_, err) => err && err({ code: 1, message: 'NEXUS_ZERO_DEVICE_DATA_POLICY: Geolocation access disabled.' });
        navigator.geolocation.watchPosition = (_, err) => err && err({ code: 1, message: 'NEXUS_ZERO_DEVICE_DATA_POLICY: Geolocation access disabled.' });
      }
      ['contacts', 'bluetooth', 'usb', 'serial', 'hid'].forEach((api) => {
        if (api in navigator) {
          try { Object.defineProperty(navigator, api, { get: () => undefined, configurable: false }); } catch (_) {}
        }
      });
    }
  } catch (_) {}
})();

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.style.display = 'inline-flex';
    installBtn.textContent = '📲 Instalar App';
  }
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.textContent = '✅ App Instalado';
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
      console.warn('ServiceWorker registration warning:', err);
    });
  });
}

// ============================================================================
// NEXUS MODULAR SPA ROUTER & ON-DEMAND LAZY LOADING ENGINE
// ============================================================================
const NexusRouter = (() => {
  const VALID_ROUTES = new Set([
    'home',
    'aura',
    'command-center',
    'neural',
    'agents',
    'knowledge',
    'studio',
    'proofs',
    'guide',
    'articles',
    'faq',
    'about',
    'supervisor'
  ]);

  const ALIAS_MAP = {
    '': 'home',
    '/': 'home',
    'home': 'home',
    'hero': 'home',
    'aura': 'aura',
    'companion': 'aura',
    'cooperative': 'aura',
    'command-center': 'command-center',
    'chat': 'command-center',
    'neural': 'neural',
    'agents': 'agents',
    'agentes': 'agents',
    'agents-dashboard': 'agents',
    'agentes-dashboard': 'agents',
    'knowledge': 'knowledge',
    'graph': 'knowledge',
    'studio': 'studio',
    'actions': 'studio',
    'assistant': 'studio',
    'proofs': 'proofs',
    'research': 'proofs',
    'metrics': 'proofs',
    'guide': 'guide',
    'guia': 'guide',
    'articles': 'articles',
    'artigos': 'articles',
    'faq': 'faq',
    'duvidas': 'faq',
    'perguntas': 'faq',
    'about': 'about',
    'sobre': 'about',
    'sobre-nos': 'about',
    'supervisor': 'supervisor',
    'agente-supervisor': 'supervisor',
    'supervisao': 'supervisor'
  };

  const ROUTE_PATHS = {
    'home': '/',
    'aura': '/aura',
    'command-center': '/command-center',
    'neural': '/neural',
    'agents': '/agents',
    'knowledge': '/knowledge',
    'studio': '/studio',
    'proofs': '/proofs',
    'guide': '/guide',
    'articles': '/articles',
    'faq': '/faq',
    'about': '/about',
    'supervisor': '/supervisor'
  };

  const initializedModules = new Set();
  let currentRoute = 'home';

  function ensureModuleInit(name, modObj) {
    if (initializedModules.has(name)) return;
    if (typeof modObj !== 'undefined' && modObj && typeof modObj.init === 'function') {
      try {
        modObj.init();
        initializedModules.add(name);
      } catch (err) {
        console.error(`[NexusRouter] Failed to lazy-init ${name}:`, err);
      }
    }
  }

  // Lazy-loads and triggers lifecycle hooks only for the requested route
  function activateRouteModules(route) {
    switch (route) {
      case 'home':
        // Hero 3D sphere uses NeuralViz; main neural-canvas remains paused via offsetParent gate
        if (typeof NeuralViz !== 'undefined') ensureModuleInit('NeuralViz', NeuralViz);
        break;
      case 'aura':
        if (typeof CompanionUI !== 'undefined') ensureModuleInit('CompanionUI', CompanionUI);
        if (typeof CooperativeUI !== 'undefined') ensureModuleInit('CooperativeUI', CooperativeUI);
        break;
      case 'command-center':
        if (typeof CommandCenter !== 'undefined') ensureModuleInit('CommandCenter', CommandCenter);
        if (typeof Chat !== 'undefined') ensureModuleInit('Chat', Chat);
        break;
      case 'neural':
        if (typeof NeuralViz !== 'undefined') {
          ensureModuleInit('NeuralViz', NeuralViz);
          if (typeof NeuralViz.onRouteShow === 'function') {
            requestAnimationFrame(() => NeuralViz.onRouteShow());
          }
        }
        break;
      case 'agents':
        if (typeof Agents !== 'undefined') ensureModuleInit('Agents', Agents);
        if (typeof AgentDashboardUI !== 'undefined') {
          ensureModuleInit('AgentDashboardUI', AgentDashboardUI);
          AgentDashboardUI.loadDashboardState();
        }
        break;
      case 'knowledge':
        if (typeof Graph !== 'undefined') {
          ensureModuleInit('Graph', Graph);
          if (typeof Graph.onRouteShow === 'function') {
            requestAnimationFrame(() => Graph.onRouteShow());
          }
        }
        break;
      case 'studio':
        if (typeof AssistantStudio !== 'undefined') ensureModuleInit('AssistantStudio', AssistantStudio);
        break;
      case 'proofs':
        if (typeof Metrics !== 'undefined') ensureModuleInit('Metrics', Metrics);
        if (typeof ResearchHub !== 'undefined') ensureModuleInit('ResearchHub', ResearchHub);
        break;
      case 'supervisor':
        if (typeof SupervisorWorkspace !== 'undefined') {
          ensureModuleInit('SupervisorWorkspace', SupervisorWorkspace);
          SupervisorWorkspace.loadOverview();
        }
        break;
    }
  }

  function normalizeRoute(raw) {
    if (!raw) return 'home';
    const cleaned = String(raw).replace(/^[#\/]+/, '').replace(/\/+$/, '').toLowerCase();
    return ALIAS_MAP[cleaned] || (VALID_ROUTES.has(cleaned) ? cleaned : 'home');
  }

  function resolveInitialRoute() {
    const hash = window.location.hash ? window.location.hash.slice(1) : '';
    if (hash && ALIAS_MAP[hash.toLowerCase()]) {
      return ALIAS_MAP[hash.toLowerCase()];
    }
    const path = window.location.pathname || '/';
    if (path !== '/' && path !== '/index.html') {
      return normalizeRoute(path);
    }
    return 'home';
  }

  function navigateTo(targetRoute, options = {}) {
    const { updateHistory = true, scrollTargetId = null } = options;
    const route = normalizeRoute(targetRoute);
    currentRoute = route;

    // 1. Toggle .route-active across all [data-route] sections
    document.querySelectorAll('section[data-route]').forEach((sec) => {
      const isMatch = sec.getAttribute('data-route') === route;
      sec.classList.toggle('route-active', isMatch);
    });

    // 2. Sync Navbar & Mobile Bottom Dock active states
    document.querySelectorAll('.nav-link[data-route-link], .dock-item[data-route-link]').forEach((link) => {
      const linkRoute = normalizeRoute(link.getAttribute('data-route-link'));
      link.classList.toggle('active', linkRoute === route);
    });

    // 3. Lazy-initialize & wake up only the active route's engines/canvases
    activateRouteModules(route);

    // 4. Update Browser URL cleanly (History API with safe fallback)
    if (updateHistory) {
      const cleanPath = ROUTE_PATHS[route] || '/';
      try {
        window.history.pushState({ route }, '', cleanPath);
      } catch (_) {
        window.location.hash = route;
      }
    }

    // 5. Scroll to specific sub-section or top of viewport
    if (scrollTargetId) {
      const el = document.getElementById(scrollTargetId);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Sync Executive Dashboard summary metrics on Home
  async function refreshExecutiveTelemetry() {
    try {
      const t0 = performance.now();
      const res = await fetch('/api/telemetry');
      if (!res.ok) return;
      const data = await res.json();
      const rtt = Math.max(1, Math.round(performance.now() - t0));

      const latEl = document.getElementById('exec-stat-latency');
      if (latEl) latEl.textContent = `${rtt} ms`;

      const nodesEl = document.getElementById('exec-stat-nodes');
      if (nodesEl && data.graph && typeof data.graph.nodes === 'number') {
        nodesEl.textContent = `${data.graph.nodes} Nodes`;
      }

      const entEl = document.getElementById('exec-stat-entropy');
      if (entEl && data.neural && typeof data.neural.entropy === 'number') {
        entEl.textContent = `${data.neural.entropy.toFixed(2)} bits`;
      }
    } catch (_) {
      // Quiet fallback when offline
    }
  }

  function init() {
    // Bind all declarative route links & quick-access cards
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-route-link]');
      if (!trigger) return;
      e.preventDefault();
      const targetRoute = trigger.getAttribute('data-route-link');
      const href = trigger.getAttribute('href') || '';
      const explicitSubId = (href.startsWith('#') && href.length > 1) ? href.slice(1) : null;
      navigateTo(targetRoute, { updateHistory: true, scrollTargetId: explicitSubId });
    });

    window.addEventListener('popstate', (e) => {
      const route = (e.state && e.state.route) ? e.state.route : resolveInitialRoute();
      navigateTo(route, { updateHistory: false });
    });

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash) navigateTo(hash, { updateHistory: false });
    });

    // Activate initial route
    const startRoute = resolveInitialRoute();
    navigateTo(startRoute, { updateHistory: false });

    // Executive Telemetry Poll (lightweight, every 8s when on Home)
    refreshExecutiveTelemetry();
    setInterval(() => {
      if (currentRoute === 'home' && !document.hidden) {
        refreshExecutiveTelemetry();
      }
    }, 8000);
  }

  return {
    init,
    navigateTo,
    resolveInitialRoute,
    get currentRoute() { return currentRoute; },
    get initializedModules() { return Array.from(initializedModules); }
  };
})();

window.NexusRouter = NexusRouter;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Sovereign Bilingual I18n Engine
  if (typeof I18nEngine !== 'undefined') I18nEngine.init();

  // Initialize Modular SPA Router (lazy-loads active route modules on demand)
  NexusRouter.init();

  // PWA Install Button & Modal Handler
  const installBtn = document.getElementById('pwa-install-btn');
  const installModal = document.getElementById('pwa-install-modal');
  const closeModalBtn = document.getElementById('pwa-modal-close');

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          deferredInstallPrompt = null;
          installBtn.textContent = '✅ App Instalado';
        }
      } else if (installModal) {
        installModal.classList.add('open');
      }
    });
  }

  if (closeModalBtn && installModal) {
    closeModalBtn.addEventListener('click', () => installModal.classList.remove('open'));
    installModal.addEventListener('click', (e) => {
      if (e.target === installModal) installModal.classList.remove('open');
    });
  }

  // Mobile Navigation Drawer Handlers
  const mobileDrawer = document.getElementById('mobile-drawer');
  const drawerOverlay = document.getElementById('mobile-drawer-overlay');
  const openDrawerBtn = document.getElementById('mobile-menu-btn');
  const dockMenuBtn = document.getElementById('dock-menu-btn');
  const closeDrawerBtn = document.getElementById('mobile-drawer-close');

  function openDrawer() {
    if (mobileDrawer) mobileDrawer.classList.add('open');
    if (drawerOverlay) drawerOverlay.classList.add('open');
  }

  function closeDrawer() {
    if (mobileDrawer) mobileDrawer.classList.remove('open');
    if (drawerOverlay) drawerOverlay.classList.remove('open');
  }

  if (openDrawerBtn) openDrawerBtn.addEventListener('click', openDrawer);
  if (dockMenuBtn) dockMenuBtn.addEventListener('click', (e) => { e.preventDefault(); openDrawer(); });
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  document.querySelectorAll('#mobile-drawer [data-route-link]').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Interactive FAQ Accordion & Live Filter
  document.querySelectorAll('.faq-accordion-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.faq-item');
      if (parent) parent.classList.toggle('active');
    });
  });

  const faqSearch = document.getElementById('faq-search-input');
  if (faqSearch) {
    faqSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.faq-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? 'block' : 'none';
      });
    });
  }

  // Articles Filter Chips
  document.querySelectorAll('.article-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.article-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const tag = chip.getAttribute('data-tag');
      document.querySelectorAll('.article-card').forEach(card => {
        if (!tag || tag === 'all' || card.getAttribute('data-category') === tag) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Handle Schema.org SearchAction (?q=...) for direct search engine deep-linking into /knowledge
  const params = new URLSearchParams(window.location.search);
  const searchQuery = params.get('q');
  if (searchQuery) {
    NexusRouter.navigateTo('knowledge', { updateHistory: false });
    const graphInput = document.getElementById('graph-search');
    if (graphInput && typeof Graph !== 'undefined' && Graph.loadTopic) {
      graphInput.value = searchQuery;
      Graph.loadTopic(searchQuery);
    }
  }

  // Multi-Agent Dashboard Subtab Controller
  window.switchAgentSubTab = function(tab) {
    const dashView = document.getElementById('agent-dashboard-view');
    const dagView = document.getElementById('agent-dag-view');
    const btnDash = document.getElementById('tab-btn-agent-dashboard');
    const btnDag = document.getElementById('tab-btn-agent-dag');

    if (tab === 'dashboard') {
      if (dashView) dashView.style.display = 'block';
      if (dagView) dagView.style.display = 'none';
      if (btnDash) btnDash.classList.add('active');
      if (btnDag) btnDag.classList.remove('active');
      if (window.AgentDashboardUI) window.AgentDashboardUI.loadDashboardState();
    } else {
      if (dashView) dashView.style.display = 'none';
      if (dagView) dagView.style.display = 'block';
      if (btnDash) btnDash.classList.remove('active');
      if (btnDag) btnDag.classList.add('active');
    }
  };
});
