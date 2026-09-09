function renderLayout(activePage) {
    const pendingCount = localStorage.getItem('ssr_pending_count');
    const badge = pendingCount && parseInt(pendingCount) > 0
        ? `<span class="badge-count">${pendingCount}</span>`
        : '';

    document.body.innerHTML = `
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
            <div class="brand-icon"><i class="fas fa-home"></i></div>
            <div>
                <h2>Sri Sai Realty</h2>
                <small>Admin Panel</small>
            </div>
        </div>
        <nav class="sidebar-nav">
            <div class="nav-label">Main</div>
            <a href="/admin/dashboard.html" class="sidebar-link ${activePage === 'dashboard' ? 'active' : ''}">
                <i class="fas fa-th-large"></i> Dashboard
            </a>
            <a href="/admin/properties.html" class="sidebar-link ${activePage === 'properties' ? 'active' : ''}">
                <i class="fas fa-building"></i> Properties
            </a>
            <a href="/admin/enquiries.html" class="sidebar-link ${activePage === 'enquiries' ? 'active' : ''}">
                <i class="fas fa-envelope"></i> Enquiries ${badge}
            </a>
            <div class="nav-label">Settings</div>
            <a href="/admin/settings.html" class="sidebar-link ${activePage === 'settings' ? 'active' : ''}">
                <i class="fas fa-cog"></i> Settings
            </a>
        </nav>
        <div class="sidebar-footer">
            <a href="#" class="sidebar-link" onclick="API.logout(); return false;">
                <i class="fas fa-sign-out-alt"></i> Logout
            </a>
        </div>
    </aside>
    <div class="main-content">
        <header class="topbar">
            <button class="sidebar-toggle" onclick="toggleSidebar()"><i class="fas fa-bars"></i></button>
            <div class="topbar-title" id="topbarTitle">
                <h1>Dashboard</h1>
                <p>Overview of your real estate business</p>
            </div>
            <div class="topbar-actions">
                <a href="/" target="_blank" class="btn btn-outline btn-sm"><i class="fas fa-external-link-alt"></i> View Site</a>
                <div class="topbar-user" onclick="showUserMenu()">
                    <div class="user-avatar">${getAdminName().charAt(0).toUpperCase()}</div>
                    <div class="user-info">
                        <strong>${esc(getAdminName())}</strong>
                        <span>Administrator</span>
                    </div>
                </div>
            </div>
        </header>
        <main class="content-wrap" id="contentArea"></main>
    </div>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>`;
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.style.display = document.getElementById('sidebar').classList.contains('open') ? 'block' : 'none';
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.style.display = 'none';
}
function showUserMenu() {}

function setTopbarTitle(title, subtitle) {
    const el = document.getElementById('topbarTitle');
    if (el) {
        el.innerHTML = `<h1>${title}</h1><p>${subtitle || ''}</p>`;
    }
}

document.addEventListener('click', function (e) {
    if (e.target.classList && e.target.classList.contains('sidebar-overlay')) {
        closeSidebar();
    }
});

function updatePendingBadge() {
    if (window.location.pathname.includes('enquiries')) return;
    fetch('/api/stats', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('ssr_token') } })
        .then((r) => r.json())
        .then((data) => {
            localStorage.setItem('ssr_pending_count', data.newEnquiries || 0);
            const badge = document.querySelector('.sidebar-link[href="/admin/enquiries.html"] .badge-count');
            if (badge) badge.textContent = data.newEnquiries;
        })
        .catch(() => {});
}
