// Live Knowledge Graph powered 100% by the real Wikipedia REST & Action APIs
const Graph = (function () {
  const colors = { Root: '#00f5ff', Linked: '#a855f7', Expanded: '#10b981' };
  let nodes = [], links = [], svg, g, linkLayer, nodeLayer, scale = 1, tx = 0, ty = 0, W, H, drag = null;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };

  async function fetchWikiTopic(topic) {
    const t0 = performance.now();
    const clean = topic.trim();
    if (!clean) return null;

    // Try English and Portuguese Wikipedia REST APIs for maximum coverage
    for (const lang of ['en', 'pt']) {
      try {
        const sumUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`;
        const r = await fetch(sumUrl);
        if (!r.ok) continue;
        const summary = await r.json();
        if (summary.type === 'disambiguation' || !summary.extract) continue;

        // Fetch related internal links via MediaWiki API
        const linksUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(summary.title)}&prop=links&plnamespace=0&pllimit=12&format=json&origin=*`;
        const lr = await fetch(linksUrl);
        const ldata = await lr.json();
        const pages = ldata?.query?.pages || {};
        const firstPage = Object.values(pages)[0] || {};
        const related = (firstPage.links || [])
          .map(lk => lk.title)
          .filter(t => t && !t.includes(':') && t.length < 36)
          .slice(0, 8);

        window.Metrics && Metrics.recordApiCall(performance.now() - t0);
        return {
          title: summary.title,
          extract: summary.extract,
          url: summary.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(summary.title)}`,
          lang,
          related
        };
      } catch (e) {
        // try next language
      }
    }
    return null;
  }

  function addOrGetNode(name, cat, desc, url) {
    let existing = nodes.find(n => n.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (desc && !existing.desc) existing.desc = desc;
      if (url && !existing.url) existing.url = url;
      if (cat === 'Root' || cat === 'Expanded') {
        existing.cat = cat;
        existing.c.setAttribute('fill', colors[cat]);
      }
      return existing;
    }
    const i = nodes.length;
    const angle = i * 1.1;
    const n = {
      name, cat, desc: desc || '', url: url || '', i,
      x: W / 2 + Math.cos(angle) * (80 + (i % 5) * 25),
      y: H / 2 + Math.sin(angle) * (80 + (i % 5) * 25),
      vx: 0, vy: 0
    };
    n.g = el('g', { style: 'cursor:pointer' });
    n.c = el('circle', { r: cat === 'Root' ? 15 : 10, fill: colors[cat] || colors.Linked, 'fill-opacity': .9, stroke: '#020408', 'stroke-width': 2 });
    n.c.style.filter = `drop-shadow(0 0 6px ${colors[cat] || colors.Linked})`;
    n.t = el('text', { fill: '#cbd5e1', 'font-size': 11, 'text-anchor': 'middle', dy: -15, 'font-family': 'Inter' });
    n.t.textContent = n.name;
    n.g.append(n.c, n.t);
    nodeLayer.appendChild(n.g);
    n.g.addEventListener('mousedown', e => { drag = n; e.stopPropagation(); });
    n.g.addEventListener('click', () => selectAndExpand(n));
    nodes.push(n);
    window.Metrics && Metrics.setGraphNodes(nodes.length);
    return n;
  }

  function addLink(a, b) {
    if (a === b) return;
    if (links.some(l => (l.a === a && l.b === b) || (l.a === b && l.b === a))) return;
    const line = el('line', { stroke: 'rgba(148,163,184,.28)', 'stroke-width': 1.2 });
    linkLayer.appendChild(line);
    links.push({ a, b, el: line });
  }

  async function selectAndExpand(n) {
    const info = document.getElementById('node-info-content');
    info.innerHTML = `<div class="node-info-title">${n.name}</div><div class="node-info-category">FETCHING LIVE WIKIPEDIA DATA…</div>`;
    const data = await fetchWikiTopic(n.name);
    if (data) {
      n.desc = data.extract;
      n.url = data.url;
      if (n.cat !== 'Root') {
        n.cat = 'Expanded';
        n.c.setAttribute('fill', colors.Expanded);
      }
      data.related.forEach(relTitle => {
        const child = addOrGetNode(relTitle, 'Linked', '', '');
        addLink(n, child);
      });
    }
    const relNames = links.filter(l => l.a === n || l.b === n).map(l => (l.a === n ? l.b.name : l.a.name));
    info.innerHTML =
      `<div class="node-info-title">${n.name}</div>
       <div class="node-info-category">LIVE WIKIPEDIA SOURCE</div>
       <p>${n.desc || 'No summary available.'}</p>
       ${n.url ? `<p style="margin-top:.5rem"><a href="${n.url}" target="_blank" rel="noopener" style="color:var(--cyan)">↗ Read full article on Wikipedia</a></p>` : ''}
       <p style="margin-top:.5rem"><strong>Connected (${relNames.length}):</strong> ${relNames.slice(0, 10).join(', ')}</p>`;
    links.forEach(l => l.el.setAttribute('stroke', (l.a === n || l.b === n) ? colors[n.cat] : 'rgba(148,163,184,.22)'));
  }

  async function loadTopic(topic, clearExisting = false) {
    if (clearExisting) {
      nodes = []; links = [];
      linkLayer.innerHTML = ''; nodeLayer.innerHTML = '';
    }
    const data = await fetchWikiTopic(topic);
    if (!data) {
      document.getElementById('node-info-content').innerHTML =
        `<p style="color:var(--rose)">Topic "${topic}" not found on Wikipedia. Try another real concept (e.g., "Artificial intelligence", "Silicon Valley", "Quantum computing").</p>`;
      return;
    }
    const root = addOrGetNode(data.title, 'Root', data.extract, data.url);
    data.related.forEach(relTitle => {
      const child = addOrGetNode(relTitle, 'Linked', '', '');
      addLink(root, child);
    });
    selectAndExpand(root);
  }

  let initialized = false;
  function onRouteShow() {
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    if (r.width > 100) {
      W = r.width;
      H = Math.max(460, r.height);
    }
  }

  function init() {
    if (initialized) {
      onRouteShow();
      return;
    }
    initialized = true;
    svg = document.getElementById('knowledge-graph');
    const r = svg.getBoundingClientRect(); W = r.width || 800; H = r.height || 520;
    g = el('g');
    linkLayer = el('g');
    nodeLayer = el('g');
    g.append(linkLayer, nodeLayer);
    svg.appendChild(g);

    let pan = null;
    svg.addEventListener('mousedown', e => pan = [e.clientX - tx, e.clientY - ty]);
    addEventListener('mousemove', e => {
      const r = svg.getBoundingClientRect();
      if (drag) { drag.x = (e.clientX - r.left - tx) / scale; drag.y = (e.clientY - r.top - ty) / scale; drag.vx = drag.vy = 0; }
      else if (pan) { tx = e.clientX - pan[0]; ty = e.clientY - pan[1]; }
    });
    addEventListener('mouseup', () => { drag = null; pan = null; });
    svg.addEventListener('wheel', e => { e.preventDefault(); scale = Math.min(3, Math.max(.4, scale * (e.deltaY < 0 ? 1.1 : .9))); }, { passive: false });
    document.getElementById('zoom-in').onclick = () => scale = Math.min(3, scale * 1.2);
    document.getElementById('zoom-out').onclick = () => scale = Math.max(.4, scale / 1.2);
    document.getElementById('zoom-reset').onclick = () => { scale = 1; tx = ty = 0; };

    const searchInput = document.getElementById('graph-search');
    const fetchBtn = document.getElementById('graph-fetch-btn');
    const triggerSearch = () => {
      const q = searchInput.value.trim();
      if (q) loadTopic(q, false);
    };
    if (fetchBtn) fetchBtn.onclick = triggerSearch;
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') triggerSearch(); });

    // Load real initial knowledge graph from Wikipedia on startup
    loadTopic('Artificial intelligence', true);
    tick();
  }

  function tick() {
    // Render-gate: pause O(N^2) force layout calculations when /knowledge route is hidden
    if (svg && svg.offsetParent !== null) {
      for (const a of nodes) for (const b of nodes) if (a !== b) {
        const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + .01, f = 1800 / d2;
        a.vx += dx * f / Math.sqrt(d2); a.vy += dy * f / Math.sqrt(d2);
      }
      for (const l of links) {
        const a = l.a, b = l.b, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - 115) * .012;
        a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
      }
      for (const n of nodes) {
        n.vx += (W / 2 - n.x) * .002; n.vy += (H / 2 - n.y) * .002;
        if (n !== drag) { n.x += n.vx; n.y += n.vy; }
        n.vx *= .85; n.vy *= .85;
        n.g.setAttribute('transform', `translate(${n.x},${n.y})`);
      }
      links.forEach(l => {
        l.el.setAttribute('x1', l.a.x); l.el.setAttribute('y1', l.a.y);
        l.el.setAttribute('x2', l.b.x); l.el.setAttribute('y2', l.b.y);
      });
      g.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`);
    }
    requestAnimationFrame(tick);
  }

  return { init, fetchWikiTopic, loadTopic, onRouteShow };
})();
