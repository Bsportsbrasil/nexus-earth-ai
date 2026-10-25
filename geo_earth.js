/**
 * NEXUS Earth & Sovereign Geospatial Intelligence Controller
 * Google Earth Pro & Web Parity:
 * - Desktop-grade menu bar (Arquivo, Editar, Visualizar, Adicionar, Ferramentas, Ajuda)
 * - OGC KML 2.2 / KMZ / GeoJSON import, editing and export
 * - 4K Satellite Imagery, Hybrid Vector, Topography and Night Earth modes
 * - Geodesic Ruler (Distance & Spherical Polygon Area)
 * - Camera Fly-To navigation with Melbourne reference (@-37.81365318, 144.96255856)
 * - Superintelligence AI Regional & Terrain Analyzer
 */

const GeoEarth = (function () {
  let map = null;
  let activeLayerName = 'hybrid';
  let tileLayers = {};
  let currentProject = {
    id: 'proj_default_melbourne',
    title: 'Exploração Urbana Melbourne (Google Earth)',
    features: []
  };
  let activeTool = 'pan'; // 'pan', 'measure_dist', 'measure_area', 'add_marker', 'add_path', 'add_poly'
  let drawPoints = [];
  let tempDrawLayer = null;
  let featuresLayer = null;
  let undoStack = [];
  let redoStack = [];

  // Default coordinate from user's Google Earth screenshot
  const DEFAULT_VIEW = {
    lat: -37.81365318,
    lon: 144.96255856,
    zoom: 16
  };

  function ensureLeafletLoaded() {
    return new Promise((resolve) => {
      if (typeof L !== 'undefined') return resolve();
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      css.crossOrigin = '';
      document.head.appendChild(css);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.body.appendChild(script);
    });
  }

  async function init() {
    if (typeof L === 'undefined') {
      await ensureLeafletLoaded();
    }
    initMap();
    initMenuDropdowns();
    initToolbarEvents();
    initKeyboardShortcuts();
    loadProjectsList();
    loadDefaultProject();
  }

  function initMap() {
    const container = document.getElementById('earth-map-container');
    if (!container) return;

    if (typeof L === 'undefined') {
      console.warn('Leaflet não carregado; inicializando renderizador de contingência Canvas 3D.');
      renderCanvasFallback();
      return;
    }

    try {
      map = L.map('earth-map-container', {
        center: [DEFAULT_VIEW.lat, DEFAULT_VIEW.lon],
        zoom: DEFAULT_VIEW.zoom,
        zoomControl: false,
        attributionControl: false
      });

      // 1. High-Resolution Satellite Base (Esri World Imagery)
      tileLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        subdomains: ['server']
      });

      // 2. Hybrid Roads & Boundaries Overlay
      tileLayers.labels = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        pane: 'overlayPane'
      });

      // 3. OpenStreetMap Vector
      tileLayers.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      });

      // 4. CartoDB Dark (Night Earth)
      tileLayers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      });

      // 5. OpenTopoMap (Topographic Relief)
      tileLayers.topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17
      });

      // Apply initial layer
      setLayerMode(activeLayerName);

      // Feature & Measurement Layer Groups
      featuresLayer = L.layerGroup().addTo(map);
      tempDrawLayer = L.layerGroup().addTo(map);

      // Zoom Controls (Custom Positioned)
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Mouse Move Telemetry (HUD Lat/Lon/Alt update)
      map.on('mousemove', e => {
        updateHudCoordinates(e.latlng.lat, e.latlng.lng);
      });

      map.on('click', onMapClick);

      // Initial HUD setup
      updateHudCoordinates(DEFAULT_VIEW.lat, DEFAULT_VIEW.lon);

      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 300);
    } catch (e) {
      console.warn('Erro ao inicializar Leaflet Map:', e.message);
      renderCanvasFallback();
    }
  }

  function setLayerMode(mode) {
    if (!map) return;
    activeLayerName = mode;

    // Remove current base layers
    Object.values(tileLayers).forEach(l => {
      if (map.hasLayer(l)) map.removeLayer(l);
    });

    if (mode === 'satellite') {
      tileLayers.satellite.addTo(map);
    } else if (mode === 'hybrid') {
      tileLayers.satellite.addTo(map);
      tileLayers.labels.addTo(map);
    } else if (mode === 'osm') {
      tileLayers.osm.addTo(map);
    } else if (mode === 'dark') {
      tileLayers.dark.addTo(map);
    } else if (mode === 'topo') {
      tileLayers.topo.addTo(map);
    }

    // Update active state in UI
    document.querySelectorAll('[data-layer-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-layer-mode') === mode);
    });
  }

  function updateHudCoordinates(lat, lon) {
    const coordsEl = document.getElementById('earth-hud-coords');
    const zoomEl = document.getElementById('earth-hud-zoom');
    const altEl = document.getElementById('earth-hud-alt');

    const latH = lat >= 0 ? `${lat.toFixed(6)}° N` : `${Math.abs(lat).toFixed(6)}° S`;
    const lonH = lon >= 0 ? `${lon.toFixed(6)}° E` : `${Math.abs(lon).toFixed(6)}° W`;

    if (coordsEl) coordsEl.textContent = `${latH}, ${lonH}`;
    const z = map ? map.getZoom() : 16;
    if (zoomEl) zoomEl.textContent = `Zoom ${z}x`;

    // Compute approximate eye altitude
    const eyeAltKm = Math.round(40000 / Math.pow(2, z));
    const eyeAltText = eyeAltKm < 1 ? `${Math.round(eyeAltKm * 1000)} m` : `${eyeAltKm.toLocaleString()} km`;
    if (altEl) altEl.textContent = `Altitude Olho: ${eyeAltText}`;
  }

  function flyTo(lat, lon, zoom = 16) {
    if (map) {
      map.flyTo([lat, lon], zoom, {
        duration: 1.8,
        easeLinearity: 0.25
      });
      updateHudCoordinates(lat, lon);
    }
  }

  function onMapClick(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    if (activeTool === 'add_marker') {
      promptAddMarker(lat, lng);
    } else if (activeTool === 'measure_dist') {
      addMeasurePoint(lat, lng, 'line');
    } else if (activeTool === 'measure_area') {
      addMeasurePoint(lat, lng, 'poly');
    } else if (activeTool === 'add_path') {
      addDrawPoint(lat, lng, 'LineString');
    } else if (activeTool === 'add_poly') {
      addDrawPoint(lat, lng, 'Polygon');
    }
  }

  function promptAddMarker(lat, lng) {
    const name = prompt('Nome do Marcador (Placemark):', `Ponto ${currentProject.features.length + 1}`);
    if (!name) return;
    const desc = prompt('Descrição ou Anotação:', '');

    const feat = {
      id: `feat_${Date.now()}`,
      type: 'Point',
      name,
      description: desc || '',
      coordinates: [lng, lat, 0],
      color: '#00f5ff'
    };

    saveFeatureState();
    currentProject.features.push(feat);
    renderProjectFeatures();
    setActiveTool('pan');
  }

  function addMeasurePoint(lat, lng, type) {
    drawPoints.push([lng, lat]);
    renderTempMeasurement(type);
  }

  function renderTempMeasurement(type) {
    if (!tempDrawLayer || !map) return;
    tempDrawLayer.clearLayers();

    const latlngs = drawPoints.map(p => [p[1], p[0]]);

    latlngs.forEach((pt, i) => {
      L.circleMarker(pt, { radius: 5, color: '#00f5ff', fillColor: '#020617', fillOpacity: 0.9 }).addTo(tempDrawLayer);
    });

    const banner = document.getElementById('earth-measure-banner');
    const resultEl = document.getElementById('earth-measure-result');

    if (type === 'line' && latlngs.length >= 2) {
      L.polyline(latlngs, { color: '#00f5ff', weight: 3, dashArray: '6, 6' }).addTo(tempDrawLayer);
      // Compute total distance
      let totalM = 0;
      for (let i = 0; i < drawPoints.length - 1; i++) {
        const p1 = drawPoints[i];
        const p2 = drawPoints[i + 1];
        totalM += calculateHaversine(p1[1], p1[0], p2[1], p2[0]);
      }
      const km = (totalM / 1000).toFixed(3);
      if (banner) banner.style.display = 'flex';
      if (resultEl) resultEl.innerHTML = `📏 Distância Geodésica: <strong>${km} km</strong> (${Math.round(totalM)} m)`;
    } else if (type === 'poly' && latlngs.length >= 3) {
      L.polygon(latlngs, { color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.25 }).addTo(tempDrawLayer);
      const areaM2 = calculatePolygonAreaClient(drawPoints);
      const ha = (areaM2 / 10000).toFixed(2);
      const km2 = (areaM2 / 1e6).toFixed(4);
      if (banner) banner.style.display = 'flex';
      if (resultEl) resultEl.innerHTML = `📐 Área de Superfície: <strong>${ha} hectares</strong> (${km2} km² / ${Math.round(areaM2)} m²)`;
    }
  }

  function calculateHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = deg => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function calculatePolygonAreaClient(coords) {
    const R = 6371000;
    const toRad = deg => (deg * Math.PI) / 180;
    let total = 0;
    const len = coords.length;
    for (let i = 0; i < len; i++) {
      const p1 = coords[i];
      const p2 = coords[(i + 1) % len];
      const lon1 = toRad(p1[0]);
      const lat1 = toRad(p1[1]);
      const lon2 = toRad(p2[0]);
      const lat2 = toRad(p2[1]);
      total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    return Math.abs((total * R * R) / 2);
  }

  function finishMeasurement() {
    drawPoints = [];
    if (tempDrawLayer) tempDrawLayer.clearLayers();
    const banner = document.getElementById('earth-measure-banner');
    if (banner) banner.style.display = 'none';
    setActiveTool('pan');
  }

  function setActiveTool(tool) {
    activeTool = tool;
    drawPoints = [];
    if (tempDrawLayer) tempDrawLayer.clearLayers();

    document.querySelectorAll('[data-earth-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-earth-tool') === tool);
    });

    const banner = document.getElementById('earth-tool-banner');
    if (banner) {
      if (tool === 'pan') {
        banner.style.display = 'none';
      } else {
        banner.style.display = 'flex';
        const titles = {
          'add_marker': '📍 Clique no mapa para posicionar um Marcador (Placemark)',
          'measure_dist': '📏 Clique em 2 ou mais pontos para medir a Distância Geodésica',
          'measure_area': '📐 Clique em 3 ou mais vértices para calcular a Área do Polígono',
          'add_path': '〰️ Clique sequencialmente para traçar uma Linha / Rota KML',
          'add_poly': '🔷 Clique nos vértices para criar uma Área Geográfica KML'
        };
        const titleEl = document.getElementById('earth-tool-banner-text');
        if (titleEl) titleEl.textContent = titles[tool] || 'Ferramenta Ativa';
      }
    }
  }

  function renderProjectFeatures() {
    if (!featuresLayer || !map) return;
    featuresLayer.clearLayers();

    const features = currentProject.features || [];
    features.forEach(f => {
      if (f.type === 'Point') {
        const coords = f.coordinates || [0, 0];
        const marker = L.circleMarker([coords[1], coords[0]], {
          radius: 7,
          color: f.color || '#00f5ff',
          fillColor: f.color || '#00f5ff',
          fillOpacity: 0.85,
          weight: 2
        });
        marker.bindPopup(`
          <div style="font-family:var(--font-sans);font-size:0.8rem">
            <strong style="color:var(--cyan)">${escapeHtml(f.name)}</strong>
            <p style="margin:4px 0 0;color:var(--text-secondary);font-size:0.75rem">${escapeHtml(f.description || 'Ponto de interesse geoespacial.')}</p>
            <div style="font-family:var(--font-mono);font-size:0.68rem;color:#94a3b8;margin-top:4px">
              ${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}
            </div>
          </div>
        `);
        marker.addTo(featuresLayer);
      } else if (f.type === 'LineString') {
        const latlngs = (f.coordinates || []).map(c => [c[1], c[0]]);
        const polyline = L.polyline(latlngs, {
          color: f.color || '#38bdf8',
          weight: 3.5,
          opacity: 0.9
        });
        polyline.bindPopup(`<strong>${escapeHtml(f.name)}</strong><br/><small>${escapeHtml(f.description || '')}</small>`);
        polyline.addTo(featuresLayer);
      } else if (f.type === 'Polygon') {
        const latlngs = (f.coordinates || []).map(c => [c[1], c[0]]);
        const polygon = L.polygon(latlngs, {
          color: f.color || '#a855f7',
          fillColor: f.color || '#a855f7',
          fillOpacity: 0.25,
          weight: 2
        });
        polygon.bindPopup(`<strong>${escapeHtml(f.name)}</strong><br/><small>${escapeHtml(f.description || '')}</small>`);
        polygon.addTo(featuresLayer);
      }
    });

    renderLayersTree();
  }

  function renderLayersTree() {
    const listEl = document.getElementById('earth-layers-tree');
    if (!listEl) return;

    const features = currentProject.features || [];
    if (features.length === 0) {
      listEl.innerHTML = `<div style="font-size:0.72rem;color:var(--text-secondary);padding:0.5rem;text-align:center">Nenhum marcador ou elemento criado. Use o menu "Adicionar" ou importe um KML/GeoJSON.</div>`;
      return;
    }

    listEl.innerHTML = features.map((f, i) => `
      <div class="earth-layer-item" style="display:flex;align-items:center;justify-content:space-between;padding:0.4rem 0.6rem;background:rgba(255,255,255,0.03);border-radius:6px;margin-bottom:0.35rem">
        <div style="display:flex;align-items:center;gap:0.4rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer" onclick="GeoEarth.zoomToFeature(${i})">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${f.color || '#00f5ff'}"></span>
          <span style="font-size:0.75rem;color:var(--text-primary)">${escapeHtml(f.name)}</span>
          <small style="font-size:0.65rem;color:var(--text-secondary)">(${f.type})</small>
        </div>
        <button class="btn-secondary" onclick="GeoEarth.deleteFeature(${i})" style="padding:2px 6px;font-size:0.65rem;color:#f43f5e" title="Excluir">✕</button>
      </div>
    `).join('');
  }

  function zoomToFeature(index) {
    const f = currentProject.features[index];
    if (!f || !map) return;
    if (f.type === 'Point') {
      flyTo(f.coordinates[1], f.coordinates[0], 17);
    } else if (f.type === 'LineString' || f.type === 'Polygon') {
      const bounds = L.latLngBounds((f.coordinates || []).map(c => [c[1], c[0]]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  function deleteFeature(index) {
    saveFeatureState();
    currentProject.features.splice(index, 1);
    renderProjectFeatures();
  }

  function saveFeatureState() {
    undoStack.push(JSON.parse(JSON.stringify(currentProject.features)));
    redoStack = [];
  }

  function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(JSON.parse(JSON.stringify(currentProject.features)));
    currentProject.features = undoStack.pop();
    renderProjectFeatures();
  }

  function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(JSON.parse(JSON.stringify(currentProject.features)));
    currentProject.features = redoStack.pop();
    renderProjectFeatures();
  }

  function clearAllFeatures() {
    if (confirm('Deseja realmente limpar todos os marcadores e camadas do projeto?')) {
      saveFeatureState();
      currentProject.features = [];
      renderProjectFeatures();
    }
  }

  // File Import & Export
  function exportKml() {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/geo/export/kml';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'project';
    input.value = JSON.stringify(currentProject);

    fetch('/api/geo/export/kml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentProject)
    })
      .then(r => r.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(currentProject.title || 'nexus_earth').replace(/\s+/g, '_')}.kml`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(e => alert('Erro ao exportar KML: ' + e.message));
  }

  function exportGeoJson() {
    const geojson = {
      type: 'FeatureCollection',
      name: currentProject.title,
      features: (currentProject.features || []).map(f => ({
        type: 'Feature',
        properties: { name: f.name, description: f.description, color: f.color },
        geometry: {
          type: f.type,
          coordinates: f.coordinates
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentProject.title || 'nexus_earth').replace(/\s+/g, '_')}.geojson`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  function importFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (e) {
      const content = e.target.result;
      if (file.name.endsWith('.kml') || content.includes('<kml')) {
        // Send to KML parser
        try {
          const resp = await fetch('/api/geo/import/kml', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kml: content })
          });
          const data = await resp.json();
          if (data.features && data.features.length > 0) {
            saveFeatureState();
            currentProject.features = currentProject.features.concat(data.features);
            renderProjectFeatures();
            // Fly to first imported feature
            const first = data.features[0];
            if (first.coordinates) {
              const lat = first.type === 'Point' ? first.coordinates[1] : first.coordinates[0][1];
              const lon = first.type === 'Point' ? first.coordinates[0] : first.coordinates[0][0];
              flyTo(lat, lon, 15);
            }
            alert(`Sucesso: ${data.features.length} elementos geográficos importados do arquivo KML!`);
          } else {
            alert('Nenhum placemark ou elemento KML válido encontrado.');
          }
        } catch (err) {
          alert('Erro ao processar arquivo KML: ' + err.message);
        }
      } else if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          const rawFeats = parsed.features || (Array.isArray(parsed) ? parsed : [parsed]);
          const converted = [];
          rawFeats.forEach(rf => {
            const geom = rf.geometry || rf;
            const props = rf.properties || {};
            if (geom && geom.coordinates) {
              converted.push({
                id: `geojson_${Date.now()}_${converted.length}`,
                type: geom.type,
                name: props.name || props.title || 'Elemento GeoJSON',
                description: props.description || '',
                coordinates: geom.coordinates,
                color: props.color || '#00f5ff'
              });
            }
          });
          if (converted.length > 0) {
            saveFeatureState();
            currentProject.features = currentProject.features.concat(converted);
            renderProjectFeatures();
            alert(`Sucesso: ${converted.length} elementos importados do arquivo GeoJSON!`);
          }
        } catch (err) {
          alert('Erro ao ler GeoJSON: ' + err.message);
        }
      }
    };
    reader.readAsText(file);
  }

  // Geocoding Search
  async function searchLocation(query) {
    if (!query) return;
    try {
      const resp = await fetch(`/api/geo/geocode?q=${encodeURIComponent(query)}`);
      const results = await resp.json();
      renderSearchResults(results);
    } catch (e) {
      console.warn('Erro na busca geoespacial:', e.message);
    }
  }

  function renderSearchResults(results) {
    const listEl = document.getElementById('earth-search-dropdown');
    if (!listEl) return;
    if (!Array.isArray(results) || results.length === 0) {
      listEl.innerHTML = `<div style="padding:0.6rem;font-size:0.75rem;color:var(--text-secondary)">Nenhum local encontrado para a pesquisa.</div>`;
      listEl.style.display = 'block';
      return;
    }

    listEl.innerHTML = results.map(r => `
      <div class="earth-search-item" onclick="GeoEarth.selectSearchResult(${r.lat}, ${r.lon}, ${r.zoom || 16})" style="padding:0.6rem 0.8rem;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:background 0.2s ease">
        <strong style="color:var(--cyan);font-size:0.78rem;display:block">${escapeHtml(r.name)}</strong>
        <span style="font-size:0.68rem;color:var(--text-secondary)">${r.lat.toFixed(5)}, ${r.lon.toFixed(5)} • ${escapeHtml(r.category || 'Local')}</span>
      </div>
    `).join('');
    listEl.style.display = 'block';
  }

  function selectSearchResult(lat, lon, zoom = 16) {
    flyTo(lat, lon, zoom);
    const listEl = document.getElementById('earth-search-dropdown');
    if (listEl) listEl.style.display = 'none';
  }

  // GPS User Location
  function locateUser() {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada neste navegador.');
      return;
    }
    const btn = document.getElementById('earth-gps-btn');
    if (btn) btn.innerHTML = '⏳ Localizando...';

    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        flyTo(lat, lon, 16);

        // Add User Location Pin
        const userFeat = {
          id: 'user_pos',
          type: 'Point',
          name: 'Minha Posição Atual (GPS)',
          description: `Precisão: ~${Math.round(pos.coords.accuracy)} metros.`,
          coordinates: [lon, lat, pos.coords.altitude || 0],
          color: '#10b981'
        };
        currentProject.features = currentProject.features.filter(f => f.id !== 'user_pos');
        currentProject.features.push(userFeat);
        renderProjectFeatures();

        if (btn) btn.innerHTML = '📍 Minha Posição';
      },
      err => {
        alert('Permissão de geolocalização negada ou sinal GPS indisponível.');
        if (btn) btn.innerHTML = '📍 Minha Posição';
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // Superintelligence Spatial AI Analysis
  async function runAiAnalysis() {
    if (!map) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    const panel = document.getElementById('earth-ai-panel');
    const content = document.getElementById('earth-ai-content');
    if (panel) panel.style.display = 'block';
    if (content) content.innerHTML = '<div style="color:var(--cyan);font-size:0.76rem">🧠 Superinteligência processando tensores geoespaciais e sensoriamento multiespectral...</div>';

    try {
      const resp = await fetch('/api/geo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: center.lat, lon: center.lng, zoom })
      });
      const data = await resp.json();

      let insightsHtml = (data.insights || []).map(i => `<li style="margin-bottom:4px">${escapeHtml(i)}</li>`).join('');
      content.innerHTML = `
        <div style="font-size:0.78rem;line-height:1.55">
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(0,245,255,0.2);padding-bottom:0.4rem;margin-bottom:0.5rem">
            <strong>Zona: ${escapeHtml(data.climateZone)}</strong>
            <span style="color:var(--cyan);font-family:var(--font-mono)">${data.query.lat.toFixed(4)}, ${data.query.lon.toFixed(4)}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.6rem">
            <div style="background:rgba(2,6,23,0.5);padding:0.4rem;border-radius:6px">
              <small style="color:var(--text-secondary)">Elevação Est.:</small><br/>
              <strong style="color:var(--emerald)">${data.estimatedElevationM} m</strong>
            </div>
            <div style="background:rgba(2,6,23,0.5);padding:0.4rem;border-radius:6px">
              <small style="color:var(--text-secondary)">Irradiância Solar:</small><br/>
              <strong style="color:var(--purple)">${data.solarPotentialKwhM2} kWh/m²</strong>
            </div>
          </div>
          <ul style="padding-left:1.1rem;color:var(--text-secondary);font-size:0.74rem">
            ${insightsHtml}
          </ul>
        </div>
      `;
    } catch (e) {
      if (content) content.innerHTML = `<span style="color:#f43f5e">Erro na análise geoespacial: ${escapeHtml(e.message)}</span>`;
    }
  }

  // Desktop Menu Dropdowns & UI Initialization
  function initMenuDropdowns() {
    document.querySelectorAll('.earth-menu-trigger').forEach(trigger => {
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const menuName = trigger.getAttribute('data-menu');
        const dropdown = document.getElementById(`earth-menu-dd-${menuName}`);
        const wasOpen = dropdown && dropdown.classList.contains('open');

        // Close all dropdowns
        document.querySelectorAll('.earth-dropdown-menu').forEach(dd => dd.classList.remove('open'));

        if (dropdown && !wasOpen) {
          dropdown.classList.add('open');
        }
      });
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.earth-dropdown-menu').forEach(dd => dd.classList.remove('open'));
      const sdd = document.getElementById('earth-search-dropdown');
      if (sdd) sdd.style.display = 'none';
    });
  }

  function initToolbarEvents() {
    // Search input
    const searchInput = document.getElementById('earth-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          searchLocation(searchInput.value);
        }
      });
    }

    const searchBtn = document.getElementById('earth-search-btn');
    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', () => searchLocation(searchInput.value));
    }

    // Layer switcher
    document.querySelectorAll('[data-layer-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        setLayerMode(btn.getAttribute('data-layer-mode'));
      });
    });

    // Tool switcher
    document.querySelectorAll('[data-earth-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        setActiveTool(btn.getAttribute('data-earth-tool'));
      });
    });

    // File Input
    const fileInput = document.getElementById('earth-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
          importFile(e.target.files[0]);
        }
      });
    }
  }

  function initKeyboardShortcuts() {
    window.addEventListener('keydown', e => {
      // Only process when #earth is active
      const earthSection = document.getElementById('earth');
      if (!earthSection || earthSection.style.display === 'none') return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); undo(); }
        else if (e.key === 'y') { e.preventDefault(); redo(); }
        else if (e.key === 'e') { e.preventDefault(); exportKml(); }
        else if (e.key === 'j') { e.preventDefault(); newProject(); }
        else if (e.key === 'p') { e.preventDefault(); setActiveTool('add_marker'); }
        else if (e.key === 'o') { e.preventDefault(); openProjectsModal(); }
      }
    });
  }

  function newProject() {
    const title = prompt('Nome do Novo Projeto de Mapa:', 'Novo Projeto Google Earth');
    if (!title) return;
    currentProject = {
      id: `proj_${Date.now()}`,
      title,
      description: 'Projeto criado no NEXUS Earth Engine.',
      created: new Date().toISOString(),
      features: []
    };
    saveFeatureState();
    renderProjectFeatures();
    const titleEl = document.getElementById('earth-project-title');
    if (titleEl) titleEl.textContent = title;
  }

  async function loadProjectsList() {
    try {
      const resp = await fetch('/api/geo/projects');
      const list = await resp.json();
      const sel = document.getElementById('earth-projects-select');
      if (sel && Array.isArray(list)) {
        sel.innerHTML = list.map(p => `
          <option value="${p.id}" ${p.id === currentProject.id ? 'selected' : ''}>${escapeHtml(p.title)} (${p.features ? p.features.length : 0} itens)</option>
        `).join('');
      }
    } catch (e) {}
  }

  async function loadDefaultProject() {
    try {
      const resp = await fetch('/api/geo/projects');
      const list = await resp.json();
      if (Array.isArray(list) && list.length > 0) {
        currentProject = list[0];
        const titleEl = document.getElementById('earth-project-title');
        if (titleEl) titleEl.textContent = currentProject.title;
        renderProjectFeatures();
      }
    } catch (e) {}
  }

  function openProjectsModal() {
    const modal = document.getElementById('earth-projects-modal');
    if (modal) {
      loadProjectsList();
      modal.classList.add('open');
    }
  }

  function renderCanvasFallback() {
    const container = document.getElementById('earth-map-container');
    if (!container) return;
    container.innerHTML = `
      <canvas id="earth-canvas-fallback" width="900" height="600" style="width:100%;height:100%;background:#020617;display:block"></canvas>
    `;
    const canvas = document.getElementById('earth-canvas-fallback');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let angle = 0;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.min(cx, cy) * 0.75;

      // Outer Glow
      const grad = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.25);
      grad.addColorStop(0, 'rgba(0, 245, 255, 0.25)');
      grad.addColorStop(1, 'rgba(0, 245, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Sphere base
      ctx.fillStyle = '#0a192f';
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Meridians & Parallels
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.2)';
      ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) {
        const rad = (lat * Math.PI) / 180;
        const y = cy - Math.sin(rad) * r;
        const xr = Math.cos(rad) * r;
        ctx.beginPath();
        ctx.ellipse(cx, y, xr, xr * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rotating Meridian
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(Math.cos(angle)) * r, r, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Center Pin (Melbourne Reference)
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(cx + 40, cy + 30, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '12px var(--font-mono)';
      ctx.fillText('Melbourne (-37.8136, 144.9625)', cx + 52, cy + 34);

      angle += 0.01;
      requestAnimationFrame(draw);
    }
    draw();
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  return {
    init,
    flyTo,
    setLayerMode,
    setActiveTool,
    searchLocation,
    selectSearchResult,
    locateUser,
    runAiAnalysis,
    exportKml,
    exportGeoJson,
    importFile,
    undo,
    redo,
    clearAllFeatures,
    newProject,
    zoomToFeature,
    deleteFeature,
    finishMeasurement,
    openProjectsModal
  };
})();

window.GeoEarth = GeoEarth;
