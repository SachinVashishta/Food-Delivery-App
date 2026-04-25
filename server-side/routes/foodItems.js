const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { adminOrRestaurant } = require('../middleware/roleCheck');
const { createFoodItem, updateFoodItem } = require('../controllers/foodItemController');

// Admin or Restaurant owner
router.post('/', authMiddleware, adminOrRestaurant, createFoodItem);
router.put('/:id', authMiddleware, adminOrRestaurant, updateFoodItem);

module.exports = router;

