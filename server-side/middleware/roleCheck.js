const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Admins only' });
};

const restaurantOwnerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'restaurant') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Restaurant owners only' });
};

const adminOrRestaurant = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'restaurant')) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Admins or Restaurant owners only' });
};

module.exports = { adminOnly, restaurantOwnerOnly, adminOrRestaurant };

