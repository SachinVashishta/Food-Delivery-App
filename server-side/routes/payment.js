const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createRazorpayOrder, verifyPayment, getPaymentHistory, getAllPayments } = require('../controllers/paymentController');
const { adminOnly } = require('../middleware/roleCheck');

// POST /api/payment/create-order
router.post('/create-order', authMiddleware, createRazorpayOrder);

// POST /api/payment/verify
router.post('/verify', authMiddleware, verifyPayment);

// GET /api/payment/history (authenticated user)
router.get('/history', authMiddleware, getPaymentHistory);

// GET /api/payment/all (admin only)
router.get('/all', authMiddleware, adminOnly, getAllPayments);

module.exports = router;

