const Restaurant = require('../models/Restaurant');
const FoodItem = require('../models/FoodItem');

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().populate('owner', 'name email');
    res.status(200).json(restaurants);
  } catch (error) {
    console.error('Get all restaurants error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single restaurant with its food items
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate(
      'owner',
      'name email'
    );

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const foods = await FoodItem.find({ restaurant: req.params.id });

    res.status(200).json({ restaurant, foods });
  } catch (error) {
    console.error('Get restaurant error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new restaurant
// @route   POST /api/restaurants
// @access  Admin only
const createRestaurant = async (req, res) => {
  try {
    const { name, image, address, location, cuisine, rating, deliveryTime, owner } = req.body;

    // Validate required fields
    if (!name || !(address || location)) {
      return res.status(400).json({
        message: 'Name and location/address are required',
      });
    }

    // Support both 'address' and 'location' fields from frontend
    const restaurantAddress = address || location;

    // Auto-assign owner from logged-in admin if not provided
    const restaurantOwner = owner || req.user?._id;

    const restaurant = await Restaurant.create({
      name,
      image: image || '',
      address: restaurantAddress,
      cuisine: cuisine || [],
      rating: rating || 0,
      deliveryTime: deliveryTime || 30,
      owner: restaurantOwner,
    });

    res.status(201).json({ message: 'Restaurant created successfully', restaurant });
  } catch (error) {
    console.error('Create restaurant error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get logged-in restaurant owner's restaurant
// @route   GET /api/restaurants/my-restaurant
// @access  Restaurant owner only
const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found for this owner' });
    }
    res.status(200).json(restaurant);
  } catch (error) {
    console.error('Get my restaurant error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all restaurants with 4-5 popular food items
// @route   GET /api/restaurants/home
// @access  Public
const getRestaurantsWithPopularFoods = async (req, res) => {
  try {
    const result = await Restaurant.aggregate([
      {
        $lookup: {
          from: 'fooditems',
          localField: '_id',
          foreignField: 'restaurant',
          as: 'popularFoods',
          pipeline: [
            { $match: { isAvailable: true } },
            { $limit: 5 },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          restaurant: {
            _id: '$_id',
            name: '$name',
            image: '$image',
            address: '$address',
            cuisine: '$cuisine',
            rating: '$rating',
            deliveryTime: '$deliveryTime',
            owner: '$owner',
            createdAt: '$createdAt',
            updatedAt: '$updatedAt',
          },
          popularFoods: 1,
        },
      },
    ]);

    res.status(200).json(result);
  } catch (error) {
    console.error('Get restaurants with popular foods error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  getMyRestaurant,
  getRestaurantsWithPopularFoods,
};

