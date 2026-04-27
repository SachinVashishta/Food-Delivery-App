const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env';
dotenv.config({ path: envFile });

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const foodItemRoutes = require('./routes/foodItems');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173/' , credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/foods', foodItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3500;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

