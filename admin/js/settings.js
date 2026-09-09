document.addEventListener('DOMContentLoaded', function () {
    setTopbarTitle('Settings', 'Account and security settings');
    renderPage();
});

function renderPage() {
    const content = document.getElementById('contentArea');
    content.innerHTML = `
        <div class="card" style="max-width: 560px;">
            <div class="card-header">
                <h3><i class="fas fa-key" style="margin-right: 8px; color: var(--primary);"></i> Change Password</h3>
            </div>
            <div class="card-body">
                <form id="passwordForm">
                    <div class="form-group">
                        <label for="oldPassword">Current Password</label>
                        <input type="password" id="oldPassword" required placeholder="Enter current password">
                    </div>
                    <div class="form-group">
                        <label for="newPassword">New Password</label>
                        <input type="password" id="newPassword" required minlength="6" placeholder="Min 6 characters">
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirm New Password</label>
                        <input type="password" id="confirmPassword" required minlength="6" placeholder="Re-enter new password">
                    </div>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update Password</button>
                </form>
            </div>
        </div>

        <div class="card" style="max-width: 560px; margin-top: 24px;">
            <div class="card-header">
                <h3><i class="fas fa-info-circle" style="margin-right: 8px; color: var(--primary);"></i> About</h3>
            </div>
            <div class="card-body" style="font-size: 0.9rem; color: var(--text-secondary);">
                <p style="margin-bottom: 10px;"><strong style="color: var(--dark);">Sri Sai Realty Admin Panel</strong> v1.0.0</p>
                <p style="margin-bottom: 10px;">Manage your property listings and customer enquiries from one place.</p>
                <p style="margin-bottom: 10px;">Data is stored securely in Supabase (PostgreSQL + Storage).</p>
                <p>Username: <code>${esc(getAdminName())}</code></p>
            </div>
        </div>`;

    document.getElementById('passwordForm').addEventListener('submit', handlePasswordChange);
}

async function handlePasswordChange(e) {
    e.preventDefault();

    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        toast('New passwords do not match', 'error');
        return;
    }

    try {
        await API.post('/api/auth/change-password', JSON.stringify({ oldPassword, newPassword }));
        toast('Password changed successfully', 'success');
        e.target.reset();
    } catch (err) {
        toast(err.message, 'error');
    }
}
