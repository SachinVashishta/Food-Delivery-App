const FoodItem = require('../models/FoodItem');
const Restaurant = require('../models/Restaurant');

// @desc    Create a new food item
// @route   POST /api/foods
// @access  Restaurant owner only
const createFoodItem = async (req, res) => {
  try {
    const { name, price, image, description, category, restaurant } = req.body;

    // Verify the restaurant exists and belongs to the logged-in owner
    const existingRestaurant = await Restaurant.findById(restaurant);
    if (!existingRestaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (req.user.role !== 'admin' && existingRestaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You do not own this restaurant' });
    }

    const foodItem = await FoodItem.create({
      name,
      price,
      image,
      description,
      category,
      restaurant,
    });

    res.status(201).json({ message: 'Food item created successfully', foodItem });
  } catch (error) {
    console.error('Create food item error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a food item
// @route   PUT /api/foods/:id
// @access  Restaurant owner only
const updateFoodItem = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    // Verify the food item's restaurant belongs to the logged-in owner
    const existingRestaurant = await Restaurant.findById(foodItem.restaurant);
    if (!existingRestaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (req.user.role !== 'admin' && existingRestaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You do not own this restaurant' });
    }

    const { name, price, image, description, category, isAvailable } = req.body;

    if (name !== undefined) foodItem.name = name;
    if (price !== undefined) foodItem.price = price;
    if (image !== undefined) foodItem.image = image;
    if (description !== undefined) foodItem.description = description;
    if (category !== undefined) foodItem.category = category;
    if (isAvailable !== undefined) foodItem.isAvailable = isAvailable;

    await foodItem.save();

    res.status(200).json({ message: 'Food item updated successfully', foodItem });
  } catch (error) {
    console.error('Update food item error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteFoodItem = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    // Verify the food item's restaurant belongs to the logged-in owner
    const existingRestaurant = await Restaurant.findById(foodItem.restaurant);
    if (!existingRestaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (req.user.role !== 'admin' && existingRestaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You do not own this restaurant' });
    }

    await FoodItem.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Food item deleted successfully' });
  } catch (error) {
    console.error('Delete food item error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createFoodItem, updateFoodItem, deleteFoodItem };

