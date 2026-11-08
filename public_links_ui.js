/**
 * public_links_ui.js
 * 
 * INTERFACE EXECUTIVA DE GESTÃO DE LINKS E PÁGINAS PÚBLICAS (TAB 13 ADMIN C2)
 */

const PublicLinksUI = (() => {
  let allLinks = [];

  function getAuthHeader() {
    const token = localStorage.getItem('nexus_admin_token') || sessionStorage.getItem('nexus_admin_token') || 'NEXUS-SOVEREIGN-2026';
    return { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  }

  async function fetchLinks() {
    const container = document.getElementById('public-links-container');
    if (!container) return;

    container.innerHTML = `<div style="text-align:center; padding:2rem; color:#94a3b8; font-family:var(--font-mono);">↻ Carregando catálogo de rotas públicas...</div>`;

    try {
      const res = await fetch('/api/admin/links', {
        headers: getAuthHeader()
      });

      if (!res.ok) {
        container.innerHTML = `<div style="text-align:center; padding:2rem; color:#ef4444; font-family:var(--font-mono);">Erro ao carregar links: Acesso não autorizado ou sessão expirada.</div>`;
        return;
      }

      const data = await res.json();
      allLinks = data.links || [];
      renderLinks(allLinks);
    } catch (e) {
      container.innerHTML = `<div style="text-align:center; padding:2rem; color:#ef4444; font-family:var(--font-mono);">Falha de conexão: ${e.message}</div>`;
    }
  }

  function renderLinks(links) {
    const container = document.getElementById('public-links-container');
    if (!container) return;

    if (!links || links.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:2rem; color:#64748b; font-family:var(--font-mono);">Nenhuma rota pública encontrada com os filtros atuais.</div>`;
      return;
    }

    let html = '';
    links.forEach(link => {
      const isBlocked = link.status === 'BLOQUEADO';
      const statusBadge = isBlocked
        ? `<span class="agent-badge" style="background:rgba(239,68,68,0.15); color:#fca5a5; border-color:rgba(239,68,68,0.3); font-size:0.65rem;">BLOQUEADO</span>`
        : `<span class="agent-badge DONE" style="background:rgba(16,185,129,0.15); color:#10b981; border-color:rgba(16,185,129,0.3); font-size:0.65rem;">ATIVO NA WEB</span>`;

      html += `
        <div class="glass-panel" style="background:rgba(10,15,30,0.85); border:1px solid ${isBlocked ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}; border-radius:10px; padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="flex:1; min-width:280px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
              <span style="font-family:var(--font-mono); font-size:0.65rem; color:#00f5ff; background:rgba(0,245,255,0.1); padding:2px 8px; border-radius:4px; text-transform:uppercase;">${link.category}</span>
              ${statusBadge}
              <span style="font-size:0.65rem; color:#64748b; font-family:var(--font-mono);">Rota: ${link.path}</span>
            </div>
            <div style="font-family:var(--font-display); font-size:1.05rem; font-weight:700; color:#f8fafc; margin-bottom:4px;">
              ${link.title}
            </div>
            <div style="font-size:0.75rem; color:#94a3b8; line-height:1.4; margin-bottom:6px;">
              ${link.description || 'Página gerada e mantida por superinteligência.'}
            </div>
            <div style="font-size:0.68rem; color:#38bdf8; font-family:var(--font-mono);">
              URL: <a href="${link.fullUrl}" target="_blank" style="color:#38bdf8; text-decoration:underline;">${link.fullUrl}</a>
            </div>
          </div>

          <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
            <a href="${link.path}" target="_blank" class="btn-primary" style="font-size:0.72rem; padding:0.4rem 0.8rem; text-decoration:none; display:flex; align-items:center; gap:4px; background:#0284c7;">
              ↗ Abrir Página
            </a>
            
            <button onclick="PublicLinksUI.toggleStatus('${link.id}', '${isBlocked ? 'ATIVO' : 'BLOQUEADO'}')" class="btn-secondary" style="font-size:0.72rem; padding:0.4rem 0.8rem; color:${isBlocked ? '#10b981' : '#f87171'}; border-color:${isBlocked ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'};">
              ${isBlocked ? '▶️ Desbloquear' : '⏸️ Bloquear'}
            </button>

            <button onclick="PublicLinksUI.openEditModal('${link.id}')" class="btn-secondary" style="font-size:0.72rem; padding:0.4rem 0.8rem; color:#fbbf24;">
              ✏️ Editar
            </button>

            <button onclick="PublicLinksUI.deleteLink('${link.id}', '${link.title}')" class="btn-secondary" style="font-size:0.72rem; padding:0.4rem 0.6rem; color:#ef4444;" title="Excluir Rota">
              🗑️
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function filter() {
    const search = (document.getElementById('public-links-search')?.value || '').toLowerCase();
    const cat = document.getElementById('public-links-filter-cat')?.value || 'all';

    const filtered = allLinks.filter(item => {
      const matchCat = cat === 'all' || item.category === cat;
      const matchText = item.title.toLowerCase().includes(search) || 
                        item.path.toLowerCase().includes(search) ||
                        (item.description && item.description.toLowerCase().includes(search));
      return matchCat && matchText;
    });

    renderLinks(filtered);
  }

  async function toggleStatus(id, newStatus) {
    try {
      const res = await fetch('/api/admin/links/status', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ id, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        await fetchLinks();
      } else {
        alert('Erro ao alterar status: ' + (data.error || 'Erro'));
      }
    } catch (e) {
      alert('Falha de conexão: ' + e.message);
    }
  }

  function openEditModal(id) {
    const item = allLinks.find(l => l.id === id);
    if (!item) return;

    document.getElementById('edit-link-id').value = item.id;
    document.getElementById('edit-link-title').value = item.title;
    document.getElementById('edit-link-desc').value = item.description || '';
    document.getElementById('public-link-edit-modal').style.display = 'flex';
  }

  async function saveEdit() {
    const id = document.getElementById('edit-link-id').value;
    const title = document.getElementById('edit-link-title').value;
    const description = document.getElementById('edit-link-desc').value;

    try {
      const res = await fetch('/api/admin/links/edit', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ id, title, description })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('public-link-edit-modal').style.display = 'none';
        await fetchLinks();
      } else {
        alert('Erro ao salvar: ' + (data.error || 'Erro'));
      }
    } catch (e) {
      alert('Falha de conexão: ' + e.message);
    }
  }

  async function deleteLink(id, title) {
    if (!confirm(`TEM CERTEZA? Deseja excluir a rota "${title}" do catálogo público?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/links/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      const data = await res.json();
      if (data.success) {
        await fetchLinks();
      } else {
        alert('Erro ao excluir: ' + (data.error || 'Erro'));
      }
    } catch (e) {
      alert('Falha de conexão: ' + e.message);
    }
  }

  // Monitora a troca de abas para carregar automaticamente ao abrir a Tab 13
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab="tab-public-links"]');
    if (btn) {
      setTimeout(fetchLinks, 100);
    }
  });

  return {
    fetchLinks,
    renderLinks,
    filter,
    toggleStatus,
    openEditModal,
    saveEdit,
    deleteLink
  };
})();

window.PublicLinksUI = PublicLinksUI;
