function togglePassword() {
    const input = document.getElementById('password');
    const icon = document.querySelector('.toggle-password i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    errorEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Login failed');
        }

        localStorage.setItem('ssr_token', data.token);
        localStorage.setItem('ssr_admin', data.username);
        window.location.href = '/admin/dashboard.html';
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    }
});
