const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const { registerUser, loginUser, getAllUsers, getProfile, updateProfile } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

// GET /api/auth/users (admin only)
router.get('/users', authMiddleware, adminOnly, getAllUsers);

// GET /api/auth/profile (authenticated user)
router.get('/profile', authMiddleware, getProfile);

// PUT /api/auth/profile (authenticated user)
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;

