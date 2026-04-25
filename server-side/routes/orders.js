const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { adminOrRestaurant, restaurantOwnerOnly } = require('../middleware/roleCheck');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getRestaurantOrders,
  updateOrderStatus,
  updateOrderPayment,
} = require('../controllers/orderController');

// Authenticated user routes
router.post('/', authMiddleware, createOrder);
router.get('/myorders', authMiddleware, getMyOrders);

// Admin or Restaurant owner
router.get('/restaurant-orders', authMiddleware, adminOrRestaurant, getRestaurantOrders);

// Authenticated user routes
router.get('/:id', authMiddleware, getOrderById);
router.put('/:id/payment', authMiddleware, updateOrderPayment);

// Admin or Restaurant owner only
router.put('/:id/status', authMiddleware, adminOrRestaurant, updateOrderStatus);

module.exports = router;

