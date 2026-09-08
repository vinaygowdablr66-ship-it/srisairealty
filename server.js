const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');

dotenv.config();

const db = require('./data/db');
const { signToken, requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// === Middleware ===
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Static: main website
app.use(express.static(path.join(__dirname, 'public')));

// Static: uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Static: admin pages
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Redirect /admin to login page
app.get('/admin', (req, res) => res.redirect('/admin/login.html'));
app.get('/admin/', (req, res) => res.redirect('/admin/login.html'));

// === File upload setup ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    require('fs').mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// === Health check ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// ============================
// AUTH ROUTES
// ============================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const ok = await db.verifyLogin(username, password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = signToken({ username });
    res.json({ token, username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const ok = await db.verifyLogin(req.admin.username, oldPassword);
    if (!ok) {
      return res.status(401).json({ error: 'Old password is incorrect' });
    }

    await db.changePassword(newPassword);
    res.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================
// PROPERTY ROUTES
// ============================
app.get('/api/properties', (req, res) => {
  try {
    const properties = db.getProperties();
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/properties/:id', (req, res) => {
  try {
    const property = db.getPropertyById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/properties', requireAuth, upload.array('images', 8), (req, res) => {
  try {
    const files = req.files || [];
    const imagePaths = files.map((f) => '/uploads/' + f.filename);

    const data = req.body;
    if (!data.title || !data.type || !data.location || !data.price) {
      return res.status(400).json({ error: 'Title, type, location, and price are required' });
    }

    const property = db.createProperty({
      title: data.title.trim(),
      type: data.type,
      subType: data.subType || '',
      location: data.location.trim(),
      price: data.price.trim(),
      description: data.description || '',
      beds: parseInt(data.beds) || 0,
      baths: parseInt(data.baths) || 0,
      area: data.area || '',
      status: data.status || 'For Sale',
      images: imagePaths,
      featured: data.featured === 'true' || data.featured === true
    });

    res.status(201).json(property);
  } catch (err) {
    console.error('Create property error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/properties/:id', requireAuth, upload.array('images', 8), (req, res) => {
  try {
    const existing = db.getPropertyById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const files = req.files || [];
    const newImagePaths = files.map((f) => '/uploads/' + f.filename);

    const data = req.body;
    const updates = {};

    if (data.title !== undefined) updates.title = data.title.trim();
    if (data.type !== undefined) updates.type = data.type;
    if (data.subType !== undefined) updates.subType = data.subType;
    if (data.location !== undefined) updates.location = data.location.trim();
    if (data.price !== undefined) updates.price = data.price.trim();
    if (data.description !== undefined) updates.description = data.description;
    if (data.beds !== undefined) updates.beds = parseInt(data.beds) || 0;
    if (data.baths !== undefined) updates.baths = parseInt(data.baths) || 0;
    if (data.area !== undefined) updates.area = data.area;
    if (data.status !== undefined) updates.status = data.status;

    if (newImagePaths.length > 0) {
      updates.images = [...(existing.images || []), ...newImagePaths];
    }

    if (data.featured !== undefined) {
      updates.featured = data.featured === 'true' || data.featured === true;
    }

    if (data.removeImages) {
      const toRemove = Array.isArray(data.removeImages) ? data.removeImages : [data.removeImages];
      updates.images = (existing.images || []).filter((img) => !toRemove.includes(img));
    }

    const property = db.updateProperty(req.params.id, updates);
    res.json(property);
  } catch (err) {
    console.error('Update property error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/properties/:id', requireAuth, (req, res) => {
  try {
    const ok = db.deleteProperty(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================
// ENQUIRY ROUTES
// ============================
app.post('/api/enquiries', (req, res) => {
  try {
    const { firstName, lastName, email, phone, interest, budget, location, message, propertyId, propertyTitle } = req.body;

    if (!firstName || !email || !phone) {
      return res.status(400).json({ error: 'First name, email, and phone are required' });
    }

    const enquiry = db.createEnquiry({
      firstName: firstName.trim(),
      lastName: (lastName || '').trim(),
      email: email.trim(),
      phone: phone.trim(),
      interest: interest || '',
      budget: budget || '',
      location: location || '',
      message: message || '',
      propertyId: propertyId || null,
      propertyTitle: propertyTitle || ''
    });

    res.status(201).json({ success: true, id: enquiry.id });
  } catch (err) {
    console.error('Create enquiry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/enquiries', requireAuth, (req, res) => {
  try {
    res.json(db.getEnquiries());
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/enquiries/:id', requireAuth, (req, res) => {
  try {
    const enquiry = db.getEnquiryById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    res.json(enquiry);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/enquiries/:id', requireAuth, (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const enquiry = db.updateEnquiry(req.params.id, { status });
    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    res.json(enquiry);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/enquiries/:id', requireAuth, (req, res) => {
  try {
    const ok = db.deleteEnquiry(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================
// STATS
// ============================
app.get('/api/stats', requireAuth, (req, res) => {
  try {
    res.json(db.getStats());
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// === Serve main site at root ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// === 404 handler for API ===
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// === Error handler ===
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message || 'Server error' });
});

// === Start ===
db.init();
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  Sri Sai Realty Server Running');
  console.log('  Site:      http://localhost:' + PORT);
  console.log('  Admin:     http://localhost:' + PORT + '/admin/');
  console.log('========================================');
});
