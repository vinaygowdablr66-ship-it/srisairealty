// ============================================================
// Seed / verify the admin account in Supabase
// Usage: node sql/seed-admin.js <username> <password>
//   e.g.  node sql/seed-admin.js admin mysecret123
// If run with no args, it uses ADMIN_USERNAME / ADMIN_PASSWORD from .env
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
});

const username = process.argv[2] || process.env.ADMIN_USERNAME || 'admin';
const password = process.argv[3] || process.env.ADMIN_PASSWORD;

if (!password) {
  console.error('No password provided. Usage: node sql/seed-admin.js <username> <password>');
  process.exit(1);
}

(async () => {
  const hash = bcrypt.hashSync(password, 10);

  const { data: existing, error: findErr } = await supabase
    .from('admin')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (findErr) {
    console.error('Error querying admin:', findErr.message);
    process.exit(1);
  }

  if (existing) {
    const { error } = await supabase
      .from('admin')
      .update({ password_hash: hash })
      .eq('id', existing.id);
    if (error) { console.error('Update failed:', error.message); process.exit(1); }
    console.log(`✓ Updated password for admin "${username}"`);
  } else {
    const { error } = await supabase
      .from('admin')
      .insert({ username, password_hash: hash });
    if (error) { console.error('Insert failed:', error.message); process.exit(1); }
    console.log(`✓ Created admin "${username}"`);
  }
})();
