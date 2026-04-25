const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { adminOnly, restaurantOwnerOnly, adminOrRestaurant } = require('../middleware/roleCheck');
const {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  getMyRestaurant,
  getRestaurantsWithPopularFoods,
} = require('../controllers/restaurantController');

// Public routes
router.get('/', getAllRestaurants);

// Restaurant owner only
router.get('/my-restaurant', authMiddleware, restaurantOwnerOnly, getMyRestaurant);

// Public routes
router.get('/home', getRestaurantsWithPopularFoods);

// Public routes
router.get('/:id', getRestaurantById);

// Admin only
router.post('/', authMiddleware, adminOnly, createRestaurant);

module.exports = router;

