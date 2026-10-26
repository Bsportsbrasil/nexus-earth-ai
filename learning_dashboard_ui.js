/**
 * NEXUS Visual Continuous Learning & Epistemic Evolution Dashboard
 * Mobile-First, Responsive, Real-Time Telemetry Component
 */

const LearningDashboardUI = (function () {
  let isMounted = false;
  let metricsCache = null;

  async function fetchMetrics() {
    try {
      const res = await fetch('/api/learning/metrics');
      if (res.ok) {
        metricsCache = await res.json();
        return metricsCache;
      }
    } catch (err) {
      console.warn('[Dashboard] Fetch metrics error:', err.message);
    }
    return null;
  }

  function renderChartSVG(curveData) {
    if (!curveData || !curveData.length) {
      return '<div style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:20px;">Carregando curva de evolução...</div>';
    }

    const w = 480;
    const h = 180;
    const padX = 35;
    const padY = 25;
    const graphW = w - padX * 2;
    const graphH = h - padY * 2;

    const maxAcc = 100;
    const minAcc = 85;

    // Build SVG Path
    const points = curveData.map((d, i) => {
      const x = padX + (i / (curveData.length - 1)) * graphW;
      const normY = (d.accuracy - minAcc) / (maxAcc - minAcc);
      const y = h - padY - normY * graphH;
      return { x, y, ...d };
    });

    const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${h - padY} L ${points[0].x.toFixed(1)} ${h - padY} Z`;

    const dots = points.map(p => `
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="#00f5ff" stroke="#02040a" stroke-width="1.5">
        <title>${p.date}: ${p.accuracy}% (${p.totalKnowledge} nós válidos)</title>
      </circle>
    `).join('');

    return `
      <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block;overflow:visible;" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#00f5ff" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#00f5ff" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Horizontal Grid Lines -->
        <line x1="${padX}" y1="${padY}" x2="${w - padX}" y2="${padY}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3 3" />
        <line x1="${padX}" y1="${padY + graphH * 0.5}" x2="${w - padX}" y2="${padY + graphH * 0.5}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3 3" />
        <line x1="${padX}" y1="${h - padY}" x2="${w - padX}" y2="${h - padY}" stroke="rgba(255,255,255,0.15)" />

        <!-- Axis Labels -->
        <text x="${padX - 6}" y="${padY + 4}" fill="#64748b" font-size="9" text-anchor="end" font-family="monospace">100%</text>
        <text x="${padX - 6}" y="${padY + graphH * 0.5 + 3}" fill="#64748b" font-size="9" text-anchor="end" font-family="monospace">92%</text>
        <text x="${padX - 6}" y="${h - padY + 3}" fill="#64748b" font-size="9" text-anchor="end" font-family="monospace">85%</text>

        <!-- Gradient Area & Stroke Line -->
        <path d="${areaD}" fill="url(#curveGrad)" />
        <path d="${pathD}" fill="none" stroke="#00f5ff" stroke-width="2.5" stroke-linecap="round" />
        ${dots}
      </svg>
    `;
  }

  function renderHistoryItems(items, filter = 'ALL') {
    if (!items || !items.length) {
      return '<div style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:12px;">Nenhuma interação avaliada no período.</div>';
    }

    const filtered = items.filter(it => {
      if (filter === 'APPROVED') return it.verdict === 'APPROVED_VERIFIED_KNOWLEDGE';
      if (filter === 'BLOCKED') return it.verdict !== 'APPROVED_VERIFIED_KNOWLEDGE';
      return true;
    });

    return filtered.map(it => {
      const isApproved = it.verdict === 'APPROVED_VERIFIED_KNOWLEDGE';
      const badgeColor = isApproved ? '#10b981' : '#ef4444';
      const badgeBg = isApproved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
      const badgeText = isApproved ? 'VALIDADO ✓' : 'ALUCINAÇÃO BLOQUEADA 🛡️';

      return `
        <div style="background:rgba(3,7,18,0.7);border:1px solid ${isApproved ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.3)'};border-radius:10px;padding:10px 12px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:0.72rem;font-weight:700;font-family:monospace;color:#94a3b8;">${it.agentId}</span>
            <span style="font-size:0.65rem;font-weight:700;font-family:monospace;padding:2px 7px;border-radius:5px;background:${badgeBg};color:${badgeColor};border:1px solid ${badgeColor}44;">
              ${badgeText}
            </span>
          </div>
          <div style="font-size:0.82rem;color:#f1f5f9;line-height:1.4;margin-bottom:6px;">
            "${it.statement}"
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.68rem;font-family:monospace;color:#64748b;">
            <span>Confiança: ${(it.confidenceScore * 100).toFixed(0)}% • H: ${it.entropyBits} bits</span>
            <span>${(it.timestamp || '').slice(11, 19)}</span>
          </div>
          ${it.rejectionReason ? `<div style="font-size:0.7rem;color:#fca5a5;margin-top:4px;border-top:1px dashed rgba(239,68,68,0.25);padding-top:4px;">⚠️ Motivo: ${it.rejectionReason}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  async function testManualAssertion() {
    const input = document.getElementById('dash-manual-assertion-input');
    const resultBox = document.getElementById('dash-manual-assertion-result');
    if (!input || !input.value.trim()) return;

    if (resultBox) {
      resultBox.style.display = 'block';
      resultBox.innerHTML = '<span style="color:#00f5ff;">Avaliando pela compuerta epistêmica anti-alucinação...</span>';
    }

    try {
      const res = await fetch('/api/learning/validate-and-commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statement: input.value.trim(), agentId: 'MANUAL_TESTER' })
      });
      const data = await res.json();
      if (resultBox) {
        if (data.ok) {
          resultBox.innerHTML = `
            <div style="color:#10b981;font-weight:700;">✓ APROVADO: Conhecimento Factual Verificado</div>
            <div style="font-size:0.75rem;color:#cbd5e1;margin-top:2px;">
              Confiança: ${(data.confidenceScore * 100).toFixed(0)}% • Entropia: ${data.entropyBits} bits • Gravado no RAG Vetorial.
            </div>
          `;
        } else {
          resultBox.innerHTML = `
            <div style="color:#ef4444;font-weight:700;">🛡️ BLOQUEADO: Filtro Zero-Achismos Ativado</div>
            <div style="font-size:0.75rem;color:#fca5a5;margin-top:2px;">
              Motivo: ${data.rejectionReason || 'Especulação não comprovada.'}
            </div>
          `;
        }
      }
      refresh();
    } catch (err) {
      if (resultBox) resultBox.innerHTML = `<span style="color:#ef4444;">Erro: ${err.message}</span>`;
    }
  }

  async function refresh() {
    const data = await fetchMetrics();
    if (!data) return;

    const accEl = document.getElementById('dash-val-accuracy');
    const valEl = document.getElementById('dash-val-validated');
    const blkEl = document.getElementById('dash-val-blocked');
    const entEl = document.getElementById('dash-val-entropy');
    const chartBox = document.getElementById('dash-chart-container');
    const streamBox = document.getElementById('dash-stream-container');

    if (accEl) accEl.textContent = `${data.epistemicAccuracyPct}%`;
    if (valEl) valEl.textContent = data.totalApproved;
    if (blkEl) blkEl.textContent = data.totalBlocked;
    if (entEl) entEl.textContent = `${data.averageEntropy} bits`;

    if (chartBox) chartBox.innerHTML = renderChartSVG(data.learningCurve);
    if (streamBox) streamBox.innerHTML = renderHistoryItems(data.recentInteractions);
  }

  function mount(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="learning-dashboard-wrapper" style="display:flex;flex-direction:column;gap:14px;box-sizing:border-box;">
        
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <div style="font-size:1.05rem;font-weight:800;color:#fff;display:flex;align-items:center;gap:8px;">
              <span>📈</span> Curva de Aprendizado & Zero Alucinação
            </div>
            <div style="font-size:0.75rem;color:#94a3b8;font-family:monospace;">
              Filtro Epistêmico de Grounding • Shannon Entropy Gate
            </div>
          </div>
          <button type="button" id="btn-dash-refresh" class="cyber-btn-secondary" style="font-size:0.75rem;padding:5px 12px;">
            🔄 Atualizar
          </button>
        </div>

        <!-- 4 KPI Cards -->
        <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:10px;">
          <div class="cyber-card" style="padding:10px 12px;margin:0;">
            <div style="font-size:0.68rem;color:#94a3b8;text-transform:uppercase;font-family:monospace;">Precisão Epistêmica</div>
            <div id="dash-val-accuracy" style="font-size:1.25rem;font-weight:800;color:#00f5ff;font-family:monospace;">99.4%</div>
          </div>
          <div class="cyber-card" style="padding:10px 12px;margin:0;">
            <div style="font-size:0.68rem;color:#94a3b8;text-transform:uppercase;font-family:monospace;">Conhecimento Validado</div>
            <div id="dash-val-validated" style="font-size:1.25rem;font-weight:800;color:#10b981;font-family:monospace;">185</div>
          </div>
          <div class="cyber-card" style="padding:10px 12px;margin:0;">
            <div style="font-size:0.68rem;color:#94a3b8;text-transform:uppercase;font-family:monospace;">Alucinações Bloqueadas</div>
            <div id="dash-val-blocked" style="font-size:1.25rem;font-weight:800;color:#f43f5e;font-family:monospace;">40</div>
          </div>
          <div class="cyber-card" style="padding:10px 12px;margin:0;">
            <div style="font-size:0.68rem;color:#94a3b8;text-transform:uppercase;font-family:monospace;">Entropia Shannon</div>
            <div id="dash-val-entropy" style="font-size:1.25rem;font-weight:800;color:#a855f7;font-family:monospace;">2.42 bits</div>
          </div>
        </div>

        <!-- Interactive SVG Learning Curve Chart -->
        <div class="cyber-card glow-cyan" style="padding:14px;margin:0;">
          <div style="font-size:0.85rem;font-weight:700;color:#fff;margin-bottom:8px;display:flex;justify-content:space-between;">
            <span>Curva de Evolução do Conhecimento (Últimos 14 Dias)</span>
            <span style="font-size:0.7rem;color:#00f5ff;font-family:monospace;">Taxa: +1.4% / dia</span>
          </div>
          <div id="dash-chart-container" style="width:100%;min-height:140px;"></div>
        </div>

        <!-- Manual Epistemic Validator Tester -->
        <div class="cyber-card" style="padding:12px;margin:0;border:1px solid rgba(0,245,255,0.2);">
          <div style="font-size:0.82rem;font-weight:700;color:#fff;margin-bottom:6px;">
            🧪 Testar Validação Factual (Filtro Zero-Achismos)
          </div>
          <div style="display:flex;gap:6px;">
            <input type="text" id="dash-manual-assertion-input" class="cyber-input" placeholder="Digite uma afirmação (ex: 'A bacia amazônica tem...')" style="flex:1;font-size:0.82rem;" />
            <button type="button" id="btn-dash-test-assertion" class="cyber-btn-primary" style="font-size:0.78rem;padding:6px 12px;white-space:nowrap;">
              Validar
            </button>
          </div>
          <div id="dash-manual-assertion-result" style="display:none;margin-top:8px;padding:8px 10px;border-radius:8px;background:rgba(3,7,18,0.85);font-size:0.78rem;"></div>
        </div>

        <!-- Live Interaction Stream -->
        <div class="cyber-card" style="padding:12px;margin:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="font-size:0.82rem;font-weight:700;color:#fff;">
              ⚡ Histórico de Validações em Tempo Real
            </div>
            <div style="display:flex;gap:4px;">
              <button type="button" class="dash-filter-btn active" data-filter="ALL" style="font-size:0.68rem;padding:2px 8px;border-radius:6px;background:rgba(0,245,255,0.15);border:1px solid rgba(0,245,255,0.3);color:#00f5ff;cursor:pointer;">Todos</button>
              <button type="button" class="dash-filter-btn" data-filter="APPROVED" style="font-size:0.68rem;padding:2px 8px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;cursor:pointer;">Válidos</button>
              <button type="button" class="dash-filter-btn" data-filter="BLOCKED" style="font-size:0.68rem;padding:2px 8px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;cursor:pointer;">Bloqueados</button>
            </div>
          </div>
          <div id="dash-stream-container" style="max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;"></div>
        </div>

      </div>
    `;

    // Wire up events
    document.getElementById('btn-dash-refresh')?.addEventListener('click', refresh);
    document.getElementById('btn-dash-test-assertion')?.addEventListener('click', testManualAssertion);
    document.getElementById('dash-manual-assertion-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') testManualAssertion();
    });

    const filterBtns = container.querySelectorAll('.dash-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.style.background = 'rgba(255,255,255,0.06)';
          b.style.color = '#94a3b8';
          b.style.borderColor = 'rgba(255,255,255,0.12)';
        });
        btn.style.background = 'rgba(0,245,255,0.15)';
        btn.style.color = '#00f5ff';
        btn.style.borderColor = 'rgba(0,245,255,0.3)';

        const streamBox = document.getElementById('dash-stream-container');
        if (streamBox && metricsCache) {
          streamBox.innerHTML = renderHistoryItems(metricsCache.recentInteractions, btn.dataset.filter);
        }
      });
    });

    isMounted = true;
    refresh();
  }

  return {
    mount,
    refresh,
    fetchMetrics
  };
})();

// Auto-mount if container exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('learning-dashboard-container')) {
    LearningDashboardUI.mount('learning-dashboard-container');
  }
});
