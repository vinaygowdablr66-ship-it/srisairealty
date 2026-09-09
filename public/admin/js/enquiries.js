document.addEventListener('DOMContentLoaded', function () {
    setTopbarTitle('Enquiries', 'Customer enquiries from the website');
    renderPage();
});

let allEnquiries = [];
let currentStatus = 'all';
let propertyFilter = new URLSearchParams(window.location.search).get('property');

function renderPage() {
    const content = document.getElementById('contentArea');
    content.innerHTML = `
        <div class="filter-pills" style="margin-bottom: 20px;">
            <button class="filter-pill active" data-status="all" onclick="setStatus('all', this)">All</button>
            <button class="filter-pill" data-status="new" onclick="setStatus('new', this)">New</button>
            <button class="filter-pill" data-status="contacted" onclick="setStatus('contacted', this)">Contacted</button>
            <button class="filter-pill" data-status="closed" onclick="setStatus('closed', this)">Closed</button>
        </div>
        <div class="card">
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Interested In</th>
                            <th>Property</th>
                            <th>Message</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="enquiriesTableBody">
                        <tr><td colspan="8" class="empty-cell"><div class="spinner" style="margin: 0 auto 12px;"></div>Loading enquiries...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>`;

    loadEnquiries();
}

async function loadEnquiries() {
    const tbody = document.getElementById('enquiriesTableBody');
    try {
        allEnquiries = await API.get('/api/enquiries');
        renderTable();
        updateStatsBadge();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-cell">Failed to load enquiries: ${esc(err.message)}</td></tr>`;
    }
}

function updateStatsBadge() {
    const count = allEnquiries.filter((e) => e.status === 'new').length;
    localStorage.setItem('ssr_pending_count', count);
    const badge = document.querySelector('.sidebar-link[href="/admin/enquiries.html"] .badge-count');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

function setStatus(status, btn) {
    currentStatus = status;
    document.querySelectorAll('.filter-pill').forEach((b) => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderTable();
}

function getFilteredEnquiries() {
    return allEnquiries.filter((e) => {
        const matchesStatus = currentStatus === 'all' || e.status === currentStatus;
        const matchesProperty = !propertyFilter || e.propertyId === propertyFilter;
        return matchesStatus && matchesProperty;
    });
}

function renderTable() {
    const tbody = document.getElementById('enquiriesTableBody');
    if (!tbody) return;
    const filtered = getFilteredEnquiries();

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-cell"><i class="fas fa-envelope" style="margin-right: 8px;"></i>No enquiries found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map((e) => `
        <tr style="${e.status === 'new' ? 'background: var(--primary-50);' : ''}">
            <td>
                <strong>${esc(e.firstName)} ${esc(e.lastName)}</strong>
                ${e.propertyTitle ? `<div style="font-size:0.75rem; color: var(--primary-dark);">${esc(e.propertyTitle)}</div>` : ''}
            </td>
            <td>
                <div><a href="tel:${esc(e.phone)}" style="color: var(--info); font-size: 0.85rem;"><i class="fas fa-phone" style="margin-right: 6px;"></i>${esc(e.phone)}</a></div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${esc(e.email)}</div>
            </td>
            <td><span class="status-badge status-new">${esc(capitalize(e.interest) || '—')}</span></td>
            <td style="max-width: 160px;">
                ${e.propertyTitle
                    ? `<a href="/admin/property-form.html?id=${e.propertyId}" style="color: var(--primary-dark); font-size: 0.85rem;">${esc(e.propertyTitle)}</a>`
                    : '—'}
            </td>
            <td style="max-width: 200px;">
                ${e.message ? `<span style="font-size: 0.82rem; color: var(--text-secondary); cursor: pointer;" onclick="showEnquiry('${e.id}')">${esc(truncate(e.message, 40))}</span>` : '—'}
            </td>
            <td style="white-space: nowrap; font-size: 0.78rem; color: var(--text-muted);">${formatDate(e.createdAt)}</td>
            <td>
                <select class="status-select" data-id="${e.id}" onchange="updateStatus('${e.id}', this.value)"
                    style="padding: 6px 10px; border: 1.5px solid var(--gray-200); border-radius: var(--radius-sm); font-size: 0.8rem; font-family: 'Inter', sans-serif; color: var(--text);">
                    <option value="new" ${e.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="contacted" ${e.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                    <option value="closed" ${e.status === 'closed' ? 'selected' : ''}>Closed</option>
                </select>
            </td>
            <td style="text-align: right; white-space: nowrap;">
                <button class="icon-btn" title="View details" onclick="showEnquiry('${e.id}')"><i class="fas fa-eye"></i></button>
                <button class="icon-btn delete" title="Delete" onclick="deleteEnquiry('${e.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
}

function truncate(str, n) {
    return str.length > n ? str.substring(0, n) + '…' : str;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function updateStatus(id, status) {
    try {
        await API.patch('/api/enquiries/' + id, { status });
        toast('Status updated to ' + capitalize(status), 'success');
        updateStatsBadge();
    } catch (err) {
        toast(err.message, 'error');
    }
}

async function deleteEnquiry(id) {
    if (!confirm('Delete this enquiry?')) return;
    try {
        await API.del('/api/enquiries/' + id);
        toast('Enquiry deleted', 'success');
        loadEnquiries();
    } catch (err) {
        toast(err.message, 'error');
    }
}

function showEnquiry(id) {
    const e = allEnquiries.find((x) => x.id === id);
    if (!e) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3><i class="fas fa-envelope" style="margin-right: 8px; color: var(--primary);"></i> Enquiry Details</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="enquiry-detail-grid">
                    <div class="enquiry-detail-item">
                        <label>Name</label>
                        <p>${esc(e.firstName)} ${esc(e.lastName)}</p>
                    </div>
                    <div class="enquiry-detail-item">
                        <label>Phone</label>
                        <p><a href="tel:${esc(e.phone)}" style="color: var(--info);">${esc(e.phone)}</a></p>
                    </div>
                    <div class="enquiry-detail-item">
                        <label>Email</label>
                        <p><a href="mailto:${esc(e.email)}" style="color: var(--info);">${esc(e.email)}</a></p>
                    </div>
                    <div class="enquiry-detail-item">
                        <label>Received</label>
                        <p>${formatDate(e.createdAt)}</p>
                    </div>
                    <div class="enquiry-detail-item">
                        <label>Interested In</label>
                        <p>${esc(capitalize(e.interest) || '—')}</p>
                    </div>
                    <div class="enquiry-detail-item">
                        <label>Budget Range</label>
                        <p>${esc(e.budget || '—')}</p>
                    </div>
                    <div class="enquiry-detail-item">
                        <label>Preferred Location</label>
                        <p>${esc(e.location || '—')}</p>
                    </div>
                    <div class="enquiry-detail-item">
                        <label>Property</label>
                        <p>${e.propertyTitle ? esc(e.propertyTitle) : '—'}</p>
                    </div>
                    ${e.message ? `
                    <div class="enquiry-detail-item" style="grid-column: 1 / -1;">
                        <label>Message</label>
                        <p style="font-weight: 400; white-space: pre-wrap;">${esc(e.message)}</p>
                    </div>` : ''}
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
                    ${e.status !== 'contacted' ? `<button class="btn btn-outline btn-sm" onclick="updateStatus('${e.id}', 'contacted'); this.closest('.modal-overlay').remove();"><i class="fas fa-check"></i> Mark Contacted</button>` : ''}
                    ${e.status !== 'closed' ? `<button class="btn btn-success btn-sm" onclick="updateStatus('${e.id}', 'closed'); this.closest('.modal-overlay').remove();"><i class="fas fa-check-circle"></i> Mark Closed</button>` : ''}
                    <a href="https://wa.me/91${esc(e.phone.replace(/\D/g, ''))}" target="_blank" class="btn btn-outline btn-sm"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                    <a href="mailto:${esc(e.email)}" class="btn btn-outline btn-sm"><i class="fas fa-envelope"></i> Email</a>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);
}
