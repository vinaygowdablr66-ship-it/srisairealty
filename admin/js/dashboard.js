document.addEventListener('DOMContentLoaded', function () {
    const content = document.getElementById('contentArea');
    if (!content) return;

    content.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading dashboard...</p>
        </div>`;

    loadDashboard();
});

async function loadDashboard() {
    const content = document.getElementById('contentArea');
    setTopbarTitle('Dashboard', 'Overview of your real estate business');

    try {
        const [stats, properties, enquiries] = await Promise.all([
            API.get('/api/stats'),
            API.get('/api/properties'),
            API.get('/api/enquiries')
        ]);

        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon gold"><i class="fas fa-building"></i></div>
                    <div class="stat-info">
                        <h3>${stats.totalProperties}</h3>
                        <p>Total Properties</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-tag"></i></div>
                    <div class="stat-info">
                        <h3>${stats.availableCount}</h3>
                        <p>Available Properties</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue"><i class="fas fa-home"></i></div>
                    <div class="stat-info">
                        <h3>${stats.featuredCount}</h3>
                        <p>Featured Properties</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red"><i class="fas fa-envelope"></i></div>
                    <div class="stat-info">
                        <h3>${stats.newEnquiries}</h3>
                        <p>New Enquiries</p>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-clock" style="color: var(--primary); margin-right: 8px;"></i> Recent Enquiries</h3>
                    <a href="/admin/enquiries.html" class="btn btn-outline btn-sm">View All <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Property</th>
                                <th>Interest</th>
                                <th>Phone</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderRecentEnquiries(enquiries)}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-building" style="color: var(--primary); margin-right: 8px;"></i> Latest Properties</h3>
                    <a href="/admin/properties.html" class="btn btn-outline btn-sm">Manage All <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Property</th>
                                <th>Size</th>
                                <th>Place</th>
                                <th>Price</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderRecentProperties(properties)}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                <a href="/admin/property-form.html" class="btn btn-primary" style="flex: 1; justify-content: center; padding: 16px;">
                    <i class="fas fa-plus"></i> Add New Property
                </a>
                <a href="/admin/enquiries.html" class="btn btn-outline" style="flex: 1; justify-content: center; padding: 16px;">
                    <i class="fas fa-envelope"></i> View Enquiries
                </a>
            </div>`;

        localStorage.setItem('ssr_pending_count', stats.newEnquiries || 0);
    } catch (err) {
        content.innerHTML = `
            <div class="card">
                <div class="card-body" style="text-align: center; padding: 60px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: var(--warning); margin-bottom: 16px; display: block;"></i>
                    <h3 style="color: var(--dark); margin-bottom: 8px;">Failed to load dashboard</h3>
                    <p style="color: var(--text-muted); margin-bottom: 20px;">${esc(err.message)}</p>
                    <button class="btn btn-primary" onclick="loadDashboard()"><i class="fas fa-sync"></i> Retry</button>
                </div>
            </div>`;
    }
}

function renderRecentProperties(properties) {
    if (!properties.length) {
        return `<tr><td colspan="5" class="empty-cell"><i class="fas fa-building" style="margin-right: 8px;"></i>No properties yet. Add your first property!</td></tr>`;
    }
    return properties.slice(0, 5).map((p) => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    ${p.images && p.images.length
                        ? `<img src="${p.images[0]}" class="table-img" alt="">`
                        : `<div class="table-img" style="background: var(--gray-100); display: flex; align-items: center; justify-content: center; color: var(--text-muted);"><i class="fas fa-building"></i></div>`}
                    <strong>${esc(p.name)}</strong>
                </div>
            </td>
            <td>${esc(p.size || '—')}</td>
            <td><i class="fas fa-map-marker-alt" style="color: var(--primary); margin-right: 6px;"></i>${esc(p.place || '—')}</td>
            <td><strong style="color: var(--primary-dark);">${esc(p.price || '—')}</strong></td>
            <td><span class="status-badge ${p.featured ? 'status-featured' : 'status-normal'}">${p.featured ? 'Featured' : esc(p.status || '—')}</span></td>
        </tr>`).join('');
}

function renderRecentEnquiries(enquiries) {
    if (!enquiries.length) {
        return `<tr><td colspan="6" class="empty-cell"><i class="fas fa-envelope" style="margin-right: 8px;"></i>No enquiries yet.</td></tr>`;
    }
    return enquiries.slice(0, 6).map((e) => `
        <tr>
            <td><strong>${esc(e.firstName)} ${esc(e.lastName)}</strong></td>
            <td>${e.propertyTitle ? `<a href="/admin/property-form.html?id=${e.propertyId}" style="color: var(--primary-dark);">${esc(e.propertyTitle)}</a>` : esc(capitalize(e.interest) || 'General')}</td>
            <td><span class="status-badge status-new">${esc(capitalize(e.interest) || '—')}</span></td>
            <td><a href="tel:${esc(e.phone)}" style="color: var(--info);">${esc(e.phone)}</a></td>
            <td style="white-space: nowrap;">${formatDate(e.createdAt)}</td>
            <td><span class="status-badge status-${e.status}">${esc(capitalize(e.status))}</span></td>
        </tr>`).join('');
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
