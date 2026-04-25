
const Order = require('../models/Order');
const FoodItem = require('../models/FoodItem');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Authenticated user
const createOrder = async (req, res) => {
  try {
    const { restaurant, items, deliveryAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Validate each item and calculate total
    for (const item of items) {
      const food = await FoodItem.findById(item.foodId);
      if (!food) {
        return res.status(404).json({ message: `Food item not found: ${item.foodId}` });
      }

      const qty = item.qty || 1;
      const price = food.price;
      totalAmount += price * qty;

      orderItems.push({
        food: food._id,
        qty,
        price,
      });
    }

    const order = await Order.create({
      user: req.user._id,
      restaurant,
      items: orderItems,
      totalAmount,
      deliveryAddress: deliveryAddress || { address: '', lat: null, lng: null },
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('restaurant', 'name address')
      .populate('items.food', 'name image');

    res.status(201).json({ message: 'Order created successfully', order: populatedOrder });
  } catch (error) {
    console.error('Create order error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders/myorders
// @access  Authenticated user
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('restaurant', 'name address image')
      .populate('items.food', 'name image')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Get my orders error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Authenticated user (own order) / Admin / Restaurant
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('restaurant', 'name address owner')
      .populate('items.food', 'name image description');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization check: user can view own order, admin can view any, restaurant owner can view orders for their restaurant
    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isRestaurantOwner =
      req.user.role === 'restaurant' &&
      order.restaurant.owner &&
      order.restaurant.owner.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin && !isRestaurantOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Get order error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all orders for restaurant owner (or all orders for admin)
// @route   GET /api/orders/restaurant-orders
// @access  Admin or Restaurant owner
const getRestaurantOrders = async (req, res) => {
  try {
    // Admin gets all orders across all restaurants
    if (req.user.role === 'admin') {
      const orders = await Order.find()
        .populate('user', 'name email phone')
        .populate('restaurant', 'name address')
        .populate('items.food', 'name image price')
        .sort({ createdAt: -1 });
      return res.status(200).json(orders);
    }

    // Restaurant owner gets orders for their restaurant only
    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found for this owner' });
    }

    const orders = await Order.find({ restaurant: restaurant._id })
      .populate('user', 'name email phone')
      .populate('items.food', 'name image price')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Get restaurant orders error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Admin or Restaurant owner (owner can only update their own restaurant's orders)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Cooking', 'Out for Delivery', 'Delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await Order.findById(req.params.id).populate('restaurant', 'owner');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If user is restaurant owner, verify they own this order's restaurant
    if (req.user.role === 'restaurant') {
      if (!order.restaurant.owner || order.restaurant.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied: You do not own this restaurant' });
      }
    }

    order.status = status;
    await order.save();

    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Update order status error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order payment details
// @route   PUT /api/orders/:id/payment
// @access  Authenticated user (own order)
const updateOrderPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (razorpay_order_id !== undefined) {
      order.payment.razorpay_order_id = razorpay_order_id;
    }
    if (razorpay_payment_id !== undefined) {
      order.payment.razorpay_payment_id = razorpay_payment_id;
    }

    if (status !== undefined) {
      order.payment.status = status;
      // Auto-confirm order when payment is completed
      if (status === 'Completed' && order.status === 'Pending') {
        order.status = 'Confirmed';
      }
    }

    await order.save();
    const populatedOrder = await Order.findById(order._id)
      .populate('restaurant', 'name address')
      .populate('items.food', 'name image');

    res.status(200).json({ message: 'Order payment updated', order: populatedOrder });
  } catch (error) {
    console.error('Update order payment error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, getRestaurantOrders, updateOrderStatus, updateOrderPayment };

