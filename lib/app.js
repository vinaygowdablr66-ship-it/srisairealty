const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');

dotenv.config();

const db = require('../data/db');
const { signToken, requireAuth } = require('../middleware/auth');

const projectRoot = path.join(__dirname, '..');

function createApp() {
  const app = express();

  // === Middleware ===
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Static: main website
  app.use(express.static(path.join(projectRoot, 'public')));

  // Static: admin pages
  app.use('/admin', express.static(path.join(projectRoot, 'admin')));

  // === File upload setup (memory storage -> forwarded to Supabase Storage) ===
  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|gif|webp/;
      const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
      const mimeOk = allowed.test(file.mimetype);
      if (extOk && mimeOk) cb(null, true);
      else cb(new Error('Only image files are allowed'));
    },
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
  app.get('/api/properties', async (req, res) => {
    try {
      const properties = await db.getProperties();
      res.json(properties);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/properties/:id', async (req, res) => {
    try {
      const property = await db.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
      res.json(property);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/properties', requireAuth, upload.array('images', 8), async (req, res) => {
    try {
      const files = req.files || [];
      const imageUrls = files.length ? await db.uploadImages(files) : [];

      const data = req.body;
      if (!data.name || !data.size) {
        return res.status(400).json({ error: 'Property name and size are required' });
      }

      const property = await db.createProperty({
        name: data.name.trim(),
        size: data.size.trim(),
        facing: data.facing || '',
        khata: data.khata || '',
        place: data.place || '',
        road: data.road || '',
        loan: data.loan || '',
        available: data.available || '',
        description: data.description || '',
        price: data.price || '',
        status: data.status || 'Available',
        images: imageUrls,
        featured: data.featured === 'true' || data.featured === true
      });

      res.status(201).json(property);
    } catch (err) {
      console.error('Create property error:', err.message);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  });

  app.put('/api/properties/:id', requireAuth, upload.array('images', 8), async (req, res) => {
    try {
      const existing = await db.getPropertyById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Property not found' });
      }

      const files = req.files || [];
      let imageUrls = existing.images || [];
      if (files.length) {
        const newUrls = await db.uploadImages(files);
        imageUrls = [...imageUrls, ...newUrls];
      }

      if (req.body.removeImages) {
        const toRemove = Array.isArray(req.body.removeImages) ? req.body.removeImages : [req.body.removeImages];
        imageUrls = imageUrls.filter((img) => !toRemove.includes(img));
        await db.deleteImages(toRemove).catch(() => {});
      }

      const data = req.body;
      const updates = {};
      if (data.name !== undefined) updates.name = data.name.trim();
      if (data.size !== undefined) updates.size = data.size.trim();
      if (data.facing !== undefined) updates.facing = data.facing;
      if (data.khata !== undefined) updates.khata = data.khata;
      if (data.place !== undefined) updates.place = data.place;
      if (data.road !== undefined) updates.road = data.road;
      if (data.loan !== undefined) updates.loan = data.loan;
      if (data.available !== undefined) updates.available = data.available;
      if (data.description !== undefined) updates.description = data.description;
      if (data.price !== undefined) updates.price = data.price;
      if (data.status !== undefined) updates.status = data.status;
      if (data.featured !== undefined) updates.featured = data.featured === 'true' || data.featured === true;
      updates.images = imageUrls;

      const property = await db.updateProperty(req.params.id, updates);
      res.json(property);
    } catch (err) {
      console.error('Update property error:', err.message);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  });

  app.delete('/api/properties/:id', requireAuth, async (req, res) => {
    try {
      const existing = await db.getPropertyById(req.params.id);
      if (existing && existing.images && existing.images.length) {
        await db.deleteImages(existing.images).catch(() => {});
      }
      const ok = await db.deleteProperty(req.params.id);
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
  app.post('/api/enquiries', async (req, res) => {
    try {
      const { firstName, lastName, email, phone, interest, budget, location, message, propertyId, propertyTitle } = req.body;

      if (!firstName || !email || !phone) {
        return res.status(400).json({ error: 'First name, email, and phone are required' });
      }

      const enquiry = await db.createEnquiry({
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

  app.get('/api/enquiries', requireAuth, async (req, res) => {
    try {
      res.json(await db.getEnquiries());
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/enquiries/:id', requireAuth, async (req, res) => {
    try {
      const enquiry = await db.getEnquiryById(req.params.id);
      if (!enquiry) {
        return res.status(404).json({ error: 'Enquiry not found' });
      }
      res.json(enquiry);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.patch('/api/enquiries/:id', requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      const enquiry = await db.updateEnquiry(req.params.id, { status });
      if (!enquiry) {
        return res.status(404).json({ error: 'Enquiry not found' });
      }
      res.json(enquiry);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/enquiries/:id', requireAuth, async (req, res) => {
    try {
      const ok = await db.deleteEnquiry(req.params.id);
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
  app.get('/api/stats', requireAuth, async (req, res) => {
    try {
      res.json(await db.getStats());
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // === Serve main site at root ===
  app.get('/', (req, res) => {
    res.sendFile(path.join(projectRoot, 'public', 'index.html'));
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

  return app;
}

module.exports = { createApp };
