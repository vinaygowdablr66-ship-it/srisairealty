document.addEventListener('DOMContentLoaded', function () {
    setTopbarTitle('Properties', 'Manage your property listings');
    renderPage();
});

let allProperties = [];
let currentFilter = 'all';
let searchTerm = '';

function renderPage() {
    const content = document.getElementById('contentArea');
    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px;">
            <div class="search-bar">
                <i class="fas fa-search"></i>
                <input type="text" id="searchInput" placeholder="Search properties..." oninput="debouncedSearch(this.value)">
            </div>
            <a href="/admin/property-form.html" class="btn btn-primary"><i class="fas fa-plus"></i> Add Property</a>
        </div>
        <div class="card">
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Size</th>
                            <th>Place</th>
                            <th>Facing</th>
                            <th>Khata</th>
                            <th>Available</th>
                            <th>Price</th>
                            <th>Featured</th>
                            <th>Updated</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="propertiesTableBody">
                        <tr><td colspan="10" class="empty-cell"><div class="spinner" style="margin: 0 auto 12px;"></div>Loading properties...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>`;

    loadProperties();
}

const debouncedSearch = debounce((term) => {
    searchTerm = term.toLowerCase();
    renderTable();
});

async function loadProperties() {
    const tbody = document.getElementById('propertiesTableBody');
    try {
        allProperties = await API.get('/api/properties');
        renderTable();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="10" class="empty-cell">Failed to load properties: ${esc(err.message)}</td></tr>`;
    }
}

function getFilteredProperties() {
    return allProperties.filter((p) => {
        const matchesSearch =
            !searchTerm ||
            (p.name || '').toLowerCase().includes(searchTerm) ||
            (p.place || '').toLowerCase().includes(searchTerm) ||
            (p.size || '').toLowerCase().includes(searchTerm) ||
            (p.price || '').toLowerCase().includes(searchTerm);
        return matchesSearch;
    });
}

function renderTable() {
    const tbody = document.getElementById('propertiesTableBody');
    if (!tbody) return;
    const filtered = getFilteredProperties();

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="10" class="empty-cell"><i class="fas fa-building" style="margin-right: 8px;"></i>No properties found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map((p) => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    ${p.images && p.images.length
                        ? `<img src="${p.images[0]}" class="table-img" alt="">`
                        : `<div class="table-img" style="background: var(--gray-100); display: flex; align-items: center; justify-content: center; color: var(--text-muted);"><i class="fas fa-building"></i></div>`}
                    <div>
                        <strong>${esc(p.name)}</strong>
                        ${p.loan ? `<div style="font-size: 0.75rem; color: ${p.loan === 'Yes' ? 'var(--warning)' : 'var(--text-muted)'};">Loan: ${esc(p.loan)}</div>` : ''}
                    </div>
                </div>
            </td>
            <td>${esc(p.size)}</td>
            <td><i class="fas fa-map-marker-alt" style="color: var(--primary); margin-right: 6px;"></i>${esc(p.place)}</td>
            <td>${esc(p.facing)}</td>
            <td><span class="status-badge status-new">${esc(p.khata || '—')}</span></td>
            <td>${esc(p.available || '—')}</td>
            <td><strong style="color: var(--primary-dark);">${esc(p.price || '—')}</strong></td>
            <td>
                <label class="toggle">
                    <input type="checkbox" ${p.featured ? 'checked' : ''} onchange="toggleFeatured('${p.id}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </td>
            <td style="white-space: nowrap; font-size: 0.8rem; color: var(--text-muted);">${formatDate(p.updatedAt)}</td>
            <td style="text-align: right; white-space: nowrap;">
                <a href="/admin/property-form.html?id=${p.id}" class="icon-btn edit" title="Edit"><i class="fas fa-edit"></i></a>
                <a href="/admin/enquiries.html?property=${p.id}" class="icon-btn" title="View enquiries"><i class="fas fa-envelope"></i></a>
                <button class="icon-btn delete" title="Delete" onclick="deleteProperty('${p.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
}

async function toggleFeatured(id, featured) {
    try {
        await API.put('/api/properties/' + id, JSON.stringify({ featured }));
        toast(featured ? 'Property marked as featured' : 'Feature removed', 'success');
    } catch (err) {
        toast(err.message, 'error');
        renderTable();
    }
}

async function deleteProperty(id) {
    const p = allProperties.find((x) => x.id === id);
    if (!confirm(`Delete "${p ? p.name : 'this property'}"? This cannot be undone.`)) return;

    try {
        await API.del('/api/properties/' + id);
        toast('Property deleted', 'success');
        loadProperties();
    } catch (err) {
        toast(err.message, 'error');
    }
}
