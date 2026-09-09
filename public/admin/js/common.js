const API = (function () {
    function getToken() {
        return localStorage.getItem('ssr_token') || '';
    }

    async function request(url, options = {}) {
        const headers = { ...(options.headers || {}) };
        const token = getToken();
        if (token) headers['Authorization'] = 'Bearer ' + token;
        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        options.headers = headers;
        const res = await fetch(url, options);
        if (res.status === 401) {
            localStorage.removeItem('ssr_token');
            localStorage.removeItem('ssr_admin');
            window.location.href = '/admin/login.html';
            throw new Error('Session expired. Please login again.');
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    }

    return {
        get: (url) => request(url),
        post: (url, body) => request(url, { method: 'POST', body }),
        put: (url, body) => request(url, { method: 'PUT', body }),
        patch: (url, body) => request(url, { method: 'PATCH', body: JSON.stringify(body) }),
        del: (url) => request(url, { method: 'DELETE' }),
        logout: () => {
            localStorage.removeItem('ssr_token');
            localStorage.removeItem('ssr_admin');
            window.location.href = '/admin/login.html';
        }
    };
})();

function requireAuth() {
    if (!localStorage.getItem('ssr_token')) {
        window.location.href = '/admin/login.html';
    }
}

function getAdminName() {
    return localStorage.getItem('ssr_admin') || 'Admin';
}

function toast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toastEl = document.createElement('div');
    toastEl.className = 'toast ' + type;
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle';
    toastEl.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    container.appendChild(toastEl);
    setTimeout(() => {
        toastEl.classList.add('removing');
        setTimeout(() => toastEl.remove(), 300);
    }, 3000);
}

function formatDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function esc(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
}

function debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}
