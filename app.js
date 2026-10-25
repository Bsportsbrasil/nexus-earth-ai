// App bootstrap + nav highlighting + PWA Service Worker & Native Install Manager + SEO SearchAction handler
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

document.addEventListener('DOMContentLoaded', () => {
  [CompanionUI, CommandCenter, CooperativeUI, AssistantStudio, NeuralViz, Agents, Graph, Chat, Metrics].forEach(m => {
    try { m.init(); } catch (e) { console.error(e); }
  });

  // Sync both Top Navbar and Mobile Bottom Dock on section scroll
  const links = document.querySelectorAll('.nav-link, .dock-item');
  const obs = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) {
      links.forEach(l => l.classList.toggle('active', l.dataset.section === en.target.id));
    }
  }), { threshold: 0.35 });
  document.querySelectorAll('section[id]').forEach(s => obs.observe(s));

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

  // Handle Schema.org SearchAction (?q=...) for direct search engine deep-linking
  const params = new URLSearchParams(window.location.search);
  const searchQuery = params.get('q');
  if (searchQuery) {
    const graphInput = document.getElementById('graph-search-input');
    if (graphInput && typeof Graph !== 'undefined' && Graph.loadTopic) {
      graphInput.value = searchQuery;
      Graph.loadTopic(searchQuery);
    }
  }
});
