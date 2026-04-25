const crypto = require('crypto');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create a Razorpay order
// @route   POST /api/payment/create-order
// @access  Authenticated user
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(201).json({
      message: 'Razorpay order created',
      order: razorpayOrder,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error.message);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payment/verify
// @access  Authenticated user
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification parameters' });
    }

    // Generate signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    // Compare signatures
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      res.status(200).json({
        message: 'Payment verified successfully',
        verified: true,
        razorpay_order_id,
        razorpay_payment_id,
      });
    } else {
      res.status(400).json({
        message: 'Payment verification failed',
        verified: false,
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error.message);
    res.status(500).json({ message: 'Server error during payment verification' });
  }
};

// @desc    Get logged-in user's payment history (from orders)
// @route   GET /api/payment/history
// @access  Authenticated user
const getPaymentHistory = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find({ user: req.user._id })
      .populate('restaurant', 'name address')
      .populate('items.food', 'name image')
      .sort({ createdAt: -1 });

    const payments = orders
      .filter((o) => o.payment && o.payment.razorpay_payment_id)
      .map((o) => ({
        orderId: o._id,
        restaurant: o.restaurant,
        totalAmount: o.totalAmount,
        razorpay_order_id: o.payment.razorpay_order_id,
        razorpay_payment_id: o.payment.razorpay_payment_id,
        status: o.payment.status,
        createdAt: o.createdAt,
      }));

    res.status(200).json(payments);
  } catch (error) {
    console.error('Get payment history error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all payments (admin only)
// @route   GET /api/payment/all
// @access  Admin only
const getAllPayments = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .populate('restaurant', 'name address')
      .sort({ createdAt: -1 });

    const payments = orders
      .filter((o) => o.payment && (o.payment.razorpay_payment_id || o.payment.status !== 'Pending'))
      .map((o) => ({
        orderId: o._id,
        user: o.user,
        restaurant: o.restaurant,
        totalAmount: o.totalAmount,
        razorpay_order_id: o.payment.razorpay_order_id,
        razorpay_payment_id: o.payment.razorpay_payment_id,
        status: o.payment.status,
        createdAt: o.createdAt,
      }));

    res.status(200).json(payments);
  } catch (error) {
    console.error('Get all payments error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createRazorpayOrder, verifyPayment, getPaymentHistory, getAllPayments };

