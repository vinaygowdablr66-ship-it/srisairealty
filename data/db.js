const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

// Provide a WebSocket transport for the realtime client on Node < 22,
// otherwise @supabase/supabase-js crashes during createClient().
const WebSocket = require('ws');

const createClientOptions = {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, createClientOptions);

// Map DB rows (snake_case) to API objects (camelCase)
function mapProperty(row) {
  return {
    id: row.id,
    name: row.name,
    size: row.size,
    facing: row.facing,
    khata: row.khata,
    place: row.place,
    road: row.road,
    loan: row.loan,
    available: row.available,
    description: row.description,
    price: row.price,
    status: row.status,
    images: row.images || [],
    featured: !!row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapEnquiry(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    interest: row.interest,
    budget: row.budget,
    location: row.location,
    message: row.message,
    propertyId: row.property_id,
    propertyTitle: row.property_title,
    status: row.status,
    createdAt: row.created_at
  };
}

// --- init: verify connection ---
async function init() {
  const { error } = await supabase.from('properties').select('id').limit(1);
  if (error) {
    console.error('Supabase connection error:', error.message);
    throw error;
  }
  console.log('✓ Connected to Supabase');
}

// --- Admin ---
async function getAdmin(username) {
  const { data, error } = await supabase
    .from('admin')
    .select('*')
    .eq('username', username)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

async function verifyLogin(username, password) {
  const admin = await getAdmin(username);
  if (!admin) return false;
  return await bcrypt.compare(password, admin.password_hash);
}

async function changePassword(newPassword) {
  const admin = await getAdminUsername();
  if (!admin) return false;
  const hash = bcrypt.hashSync(newPassword, 10);
  const { error } = await supabase
    .from('admin')
    .update({ password_hash: hash })
    .eq('id', admin.id);
  if (error) throw error;
  return true;
}

async function getAdminUsername() {
  const { data, error } = await supabase.from('admin').select('*').limit(1);
  if (error || !data || !data.length) return null;
  return data[0];
}

// --- Properties ---
async function getProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapProperty);
}

async function getPropertyById(id) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProperty(data) : null;
}

async function createProperty(property) {
  const row = {
    name: property.name,
    size: property.size || '',
    facing: property.facing || '',
    khata: property.khata || '',
    place: property.place || '',
    road: property.road || '',
    loan: property.loan || '',
    available: property.available || '',
    description: property.description || '',
    price: property.price || '',
    status: property.status || 'Available',
    images: property.images || [],
    featured: !!property.featured
  };
  const { data, error } = await supabase.from('properties').insert(row).select().single();
  if (error) throw error;
  return mapProperty(data);
}

async function updateProperty(id, updates) {
  const row = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.size !== undefined) row.size = updates.size;
  if (updates.facing !== undefined) row.facing = updates.facing;
  if (updates.khata !== undefined) row.khata = updates.khata;
  if (updates.place !== undefined) row.place = updates.place;
  if (updates.road !== undefined) row.road = updates.road;
  if (updates.loan !== undefined) row.loan = updates.loan;
  if (updates.available !== undefined) row.available = updates.available;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.price !== undefined) row.price = updates.price;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.images !== undefined) row.images = updates.images;
  if (updates.featured !== undefined) row.featured = !!updates.featured;

  const { data, error } = await supabase
    .from('properties')
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapProperty(data);
}

async function deleteProperty(id) {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  return !error;
}

// --- Enquiries ---
async function getEnquiries() {
  const { data, error } = await supabase
    .from('enquiries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapEnquiry);
}

async function getEnquiryById(id) {
  const { data, error } = await supabase
    .from('enquiries')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEnquiry(data) : null;
}

async function createEnquiry(enquiry) {
  const row = {
    first_name: enquiry.firstName,
    last_name: enquiry.lastName || '',
    email: enquiry.email,
    phone: enquiry.phone,
    interest: enquiry.interest || '',
    budget: enquiry.budget || '',
    location: enquiry.location || '',
    message: enquiry.message || '',
    property_id: enquiry.propertyId || null,
    property_title: enquiry.propertyTitle || ''
  };
  const { data, error } = await supabase.from('enquiries').insert(row).select().single();
  if (error) throw error;
  return mapEnquiry(data);
}

async function updateEnquiry(id, updates) {
  const row = {};
  if (updates.status !== undefined) row.status = updates.status;
  const { data, error } = await supabase
    .from('enquiries')
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapEnquiry(data);
}

async function deleteEnquiry(id) {
  const { error } = await supabase.from('enquiries').delete().eq('id', id);
  return !error;
}

async function getStats() {
  const [propsRes, enqRes] = await Promise.all([
    supabase.from('properties').select('*'),
    supabase.from('enquiries').select('status')
  ]);

  const properties = propsRes.data || [];
  const enquiries = enqRes.data || [];

  return {
    totalProperties: properties.length,
    availableCount: properties.filter((p) => p.status !== 'Sold' && p.status !== 'Rented').length,
    featuredCount: properties.filter((p) => p.featured).length,
    totalEnquiries: enquiries.length,
    newEnquiries: enquiries.filter((e) => e.status === 'new').length
  };
}

// --- Storage: image upload ---
const IMG_BUCKET = process.env.SUPABASE_BUCKET || 'property-images';

async function uploadImages(files) {
  const urls = [];
  for (const file of files) {
    const ext = (file.originalname.match(/\.\w+$/) || ['.jpg'])[0].toLowerCase();
    const fileName = `properties/${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const { error } = await supabase.storage.from(IMG_BUCKET).upload(fileName, file.buffer, {
      contentType: file.mimetype
    });
    if (error) throw error;
    const { data } = supabase.storage.from(IMG_BUCKET).getPublicUrl(fileName);
    urls.push(data.publicUrl);
  }
  return urls;
}

async function deleteImages(urls) {
  if (!urls || !urls.length) return;
  const paths = urls
    .map((u) => {
      const key = 'properties/';
      const idx = u.indexOf(key);
      return idx !== -1 ? u.slice(idx) : null;
    })
    .filter(Boolean);
  if (!paths.length) return;
  await supabase.storage.from(IMG_BUCKET).remove(paths);
}

module.exports = {
  init,
  getAdmin,
  getAdminUsername,
  verifyLogin,
  changePassword,
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getEnquiries,
  getEnquiryById,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getStats,
  uploadImages,
  deleteImages
};
