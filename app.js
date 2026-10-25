// App bootstrap + nav highlighting
document.addEventListener('DOMContentLoaded', () => {
  [CompanionUI, CommandCenter, CooperativeUI, AssistantStudio, NeuralViz, Agents, Graph, Chat, Metrics].forEach(m => {
    try { m.init(); } catch (e) { console.error(e); }
  });
  const links = document.querySelectorAll('.nav-link');
  const obs = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) links.forEach(l => l.classList.toggle('active', l.dataset.section === en.target.id));
  }), { threshold: 0.4 });
  document.querySelectorAll('section[id]').forEach(s => obs.observe(s));
});
