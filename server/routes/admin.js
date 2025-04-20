const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all admin routes
router.use(adminLimiter);

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // Optimize query by only selecting needed fields
    const admin = await Admin.findOne({ username }).select('+password');
    
    if (!admin || !(await admin.checkPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    admin.lastLogin = Date.now();
    await admin.save();

    const token = jwt.sign({ id: admin._id }, process.env.SERVER_JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, admin: { username: admin.username, role: admin.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new admin (protected or first admin)
router.post('/create', async (req, res) => {
  try {
    // Check if this is the first admin
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      // Allow creating first admin without auth
      const admin = new Admin({ ...req.body, role: 'super' });
      await admin.save();
      return res.status(201).json(admin);
    }

    // For subsequent admins, require super admin auth
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Please authenticate' });
    }

    const decoded = jwt.verify(token, process.env.SERVER_JWT_SECRET);
    const existingAdmin = await Admin.findById(decoded.id);
    
    if (!existingAdmin || existingAdmin.role !== 'super') {
      return res.status(403).json({ message: 'Only super admins can create new admins' });
    }

    const admin = new Admin(req.body);
    await admin.save();
    res.status(201).json(admin);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all admins (protected)
router.get('/', auth, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update admin credentials (protected)
router.patch('/update-credentials', auth, async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findById(req.admin._id);
    
    if (username) admin.username = username;
    if (password) admin.password = password;
    
    await admin.save();
    res.json({ message: 'Credentials updated successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router; 