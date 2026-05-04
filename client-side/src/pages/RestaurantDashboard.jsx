import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './RestaurantDashboard.css';

const API = import.meta.env.VITE_API;
const API_BASE = API || 'http://localhost:3500/api';
const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Cooking', 'Out for Delivery', 'Delivered'];

const RestaurantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin' && user.role !== 'restaurant') {
      navigate('/');
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [adminTab, setAdminTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [showAddRestaurantModal, setShowAddRestaurantModal] = useState(false);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantForm, setRestaurantForm] = useState({ name: '', image: '', location: '', cuisine: '', rating: '' });
  const [foodForm, setFoodForm] = useState({ name: '', price: '', image: '', description: '' });
  const [showManageMenuModal, setShowManageMenuModal] = useState(false);
  const [manageMenuRestaurant, setManageMenuRestaurant] = useState(null);

  const [activeTab, setActiveTab] = useState('menu');
  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [addForm, setAddForm] = useState({ name: '', price: '', image: '', category: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const token = localStorage.getItem('token');
  const axiosInstance = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchAllRestaurants = async () => {
    try {
      setLoading(true); setError(null);
      const res = await axiosInstance.get('/restaurants');
      setRestaurants(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch restaurants');
    } finally { setLoading(false); }
  };

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const payload = {
        name: restaurantForm.name,
        image: restaurantForm.image,
        location: restaurantForm.location,
        cuisine: restaurantForm.cuisine.split(',').map(c => c.trim()).filter(c => c),
        rating: Number(restaurantForm.rating) || 0,
      };
      const res = await axiosInstance.post('/restaurants', payload);
      if (res.data?.restaurant) {
        showMessage('Restaurant added successfully');
        setRestaurantForm({ name: '', image: '', location: '', cuisine: '', rating: '' });
        setShowAddRestaurantModal(false);
        await fetchAllRestaurants();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add restaurant');
    }
  };

  const openAddFoodModal = (rest) => {
    setSelectedRestaurant(rest);
    setFoodForm({ name: '', price: '', image: '', description: '' });
    setShowAddFoodModal(true);
    setError(null);
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    try {
      setError(null);
      const payload = {
        name: foodForm.name,
        price: Number(foodForm.price),
        image: foodForm.image,
        description: foodForm.description,
        restaurant: selectedRestaurant._id,
      };
      const res = await axiosInstance.post('/foods', payload);
      if (res.data?.foodItem) {
        showMessage(`Food item added to ${selectedRestaurant.name}`);
        setFoodForm({ name: '', price: '', image: '', description: '' });
        setShowAddFoodModal(false);
        setSelectedRestaurant(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add food item');
    }
  };

  const fetchAllOrders = async () => {
    try {
      setLoading(true); setError(null);
      const res = await axiosInstance.get('/orders/restaurant-orders');
      setAllOrders(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
    } finally { setLoading(false); }
  };

  const fetchAllPayments = async () => {
    try {
      setLoading(true); setError(null);
      const res = await axiosInstance.get('/payment/all');
      setAllPayments(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch payments');
    } finally { setLoading(false); }
  };

  const fetchMyRestaurant = async () => {
    try {
      const res = await axiosInstance.get('/restaurants/my-restaurant');
      setRestaurant(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch restaurant');
      return null;
    }
  };

  const fetchFoods = async (restaurantId) => {
    try {
      const res = await axiosInstance.get(`/restaurants/${restaurantId}`);
      setFoods(res.data?.foods || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch menu items');
      setFoods([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get('/orders/restaurant-orders');
      setOrders(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
    }
  };

  const handleAddFoodOwner = async (e) => {
    e.preventDefault();
    if (!restaurant) return;
    try {
      const res = await axiosInstance.post('/foods', {
        ...addForm,
        price: Number(addForm.price),
        restaurant: restaurant._id,
      });
      if (res.data?.foodItem) {
        showMessage('Food item added successfully');
        setAddForm({ name: '', price: '', image: '', category: '', description: '' });
        await fetchFoods(restaurant._id);
        setActiveTab('menu');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add food');
    }
  };

  const handleToggleAvailable = async (food) => {
    try {
      const res = await axiosInstance.put(`/foods/${food._id}`, { isAvailable: !food.isAvailable });
      if (res.data?.foodItem) {
        setFoods(prev => prev.map(f => f._id === food._id ? { ...f, isAvailable: !f.isAvailable } : f));
        showMessage('Availability updated');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update');
    }
  };

  const startEdit = (food) => {
    setEditingId(food._id);
    setEditForm({
      name: food.name,
      price: food.price,
      image: food.image || '',
      category: food.category || '',
      description: food.description || '',
    });
  };

  const handleSaveEdit = async (foodId) => {
    try {
      const res = await axiosInstance.put(`/foods/${foodId}`, {
        ...editForm,
        price: Number(editForm.price),
      });
      if (res.data?.foodItem) {
        setFoods(prev => prev.map(f => f._id === foodId ? { ...f, ...editForm, price: Number(editForm.price) } : f));
        setEditingId(null);
        showMessage('Food item updated');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update');
    }
  };

  const handleDeleteFood = async (foodId) => {
    if (!window.confirm('Are you sure you want to delete this food item?')) return;
    try {
      await axiosInstance.delete(`/foods/${foodId}`);
      setFoods(prev => prev.filter(f => f._id !== foodId));
      showMessage('Food item deleted');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete food item');
    }
  };

  const openManageMenuModal = async (rest) => {
    setManageMenuRestaurant(rest);
    setShowManageMenuModal(true);
    setError(null);
    await fetchFoods(rest._id);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await axiosInstance.put(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data?.order) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        setAllOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        showMessage('Order status updated');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update status');
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') {
      fetchAllRestaurants();
    } else if (user.role === 'restaurant') {
      const load = async () => {
        setLoading(true); setError(null);
        const rest = await fetchMyRestaurant();
        if (rest) await fetchFoods(rest._id);
        setLoading(false);
      };
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user?.role === 'restaurant' && activeTab === 'orders') {
      setLoading(true); setError(null);
      fetchOrders().finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    setLoading(true); setError(null);
    if (adminTab === 'restaurants') fetchAllRestaurants().finally(() => setLoading(false));
    else if (adminTab === 'allOrders') fetchAllOrders().finally(() => setLoading(false));
    else if (adminTab === 'allPayments') fetchAllPayments().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminTab, user]);

  if (!user || (user.role !== 'admin' && user.role !== 'restaurant')) return null;

  const ADMIN_TABS = [
    { id: 'restaurants', label: 'Restaurants' },
    { id: 'allOrders', label: 'All Orders' },
    { id: 'allPayments', label: 'All Payments' },
  ];

  const OWNER_TABS = [
    { id: 'menu', label: 'My Menu' },
    { id: 'add', label: 'Add Food' },
    { id: 'orders', label: 'Orders' },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  {/* Edit Food Modal - Shared for Admin and Restaurant Owner */}
  {editingId && (
    <div className="modal-overlay" onClick={() => setEditingId(null)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Food Item</h3>
          <button className="modal-close" onClick={() => setEditingId(null)}>×</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(editingId); }} className="modal-form">
          <div className="form-group">
            <label>Food Name *</label>
            <input type="text" value={editForm.name}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              required placeholder="e.g. Chicken Biryani" />
          </div>
          <div className="form-group">
            <label>Price (₹) *</label>
            <input type="number" value={editForm.price}
              onChange={e => setEditForm({ ...editForm, price: e.target.value })}
              required placeholder="e.g. 250" />
          </div>
          <div className="form-group">
            <label>Image URL</label>
            <input type="text" value={editForm.image}
              onChange={e => setEditForm({ ...editForm, image: e.target.value })}
              placeholder="https://..." />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input type="text" value={editForm.category}
              onChange={e => setEditForm({ ...editForm, category: e.target.value })}
              placeholder="e.g. Main Course, Appetizer" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={editForm.description}
              onChange={e => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Enter food description..." />
          </div>
          <button type="submit" className="btn-primary">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  )}

  /* ─────────── Admin Dashboard ─────────── */
  if (user.role === 'admin') {
    return (
      <div className="dashboard-container">
        <h1 className="dashboard-title">Restaurant Dashboard</h1>
        <p className="dashboard-subtitle">Admin Panel — Manage Restaurants, Orders & Payments</p>

        {message && <div className="dashboard-message success">{message}</div>}
        {error && <div className="dashboard-message error">{error}</div>}

        <div className="dashboard-tabs">
          {ADMIN_TABS.map(tab => (
            <button
              key={tab.id}
              className={`dashboard-tab ${adminTab === tab.id ? 'active' : ''}`}
              onClick={() => { setAdminTab(tab.id); setError(null); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="dashboard-content">
          {loading && <div className="dashboard-loading">Loading...</div>}

          {adminTab === 'restaurants' && !loading && (
            <div className="restaurants-tab">
              <div className="admin-actions">
                <button className="btn-primary" onClick={() => { setShowAddRestaurantModal(true); setError(null); }}>
                  + Add Restaurant
                </button>
              </div>
              {restaurants.length === 0 ? (
                <p className="empty-state">No restaurants available. Add your first restaurant above.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr><th>Image</th><th>Name</th><th>Location</th><th>Cuisine</th><th>Rating</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {restaurants.map(rest => (
                        <tr key={rest._id}>
                          <td>
                            {rest.image ? (
                              <img src={rest.image} alt={rest.name} className="table-thumb" />
                            ) : (
                              <div className="table-thumb-placeholder">{rest.name?.[0]}</div>
                            )}
                          </td>
                          <td className="cell-name">{rest.name}</td>
                          <td>{rest.address || rest.location || 'N/A'}</td>
                          <td>{rest.cuisine?.length > 0 ? rest.cuisine.join(', ') : 'N/A'}</td>
                          <td><span className="rating-badge">{rest.rating || 0} ★</span></td>
                          <td>
                            <div className="admin-row-actions">
                              <button className="btn-secondary btn-sm" onClick={() => openAddFoodModal(rest)}>
                                Add Food
                              </button>
                              <button className="btn-secondary btn-sm" onClick={() => openManageMenuModal(rest)}>
                                Manage Menu
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {adminTab === 'allOrders' && !loading && (
            <div className="orders-tab">
              {allOrders.length === 0 ? (
                <p className="empty-state">No orders found.</p>
              ) : (
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th><th>Customer</th><th>Restaurant</th><th>Items</th>
                        <th>Total</th><th>Order Status</th><th>Update Status</th><th>Payment</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allOrders.map(order => (
                        <tr key={order._id}>
                          <td className="order-id">{order._id.slice(-6).toUpperCase()}</td>
                          <td>
                            <div className="customer-info">
                              <span className="customer-name">{order.user?.name || 'N/A'}</span>
                              <span className="customer-email">{order.user?.email || ''}</span>
                            </div>
                          </td>
                          <td>{order.restaurant?.name || 'N/A'}</td>
                          <td>
                            <ul className="order-items-list">
                              {order.items?.map((item, idx) => (
                                <li key={idx}>{item.food?.name || 'Unknown'} x{item.qty}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="order-total">₹{order.totalAmount}</td>
                          <td>
                            <span className={`status-badge status-${order.status?.replace(/\s+/g, '-').toLowerCase()}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <select
                              className="status-select"
                              value={order.status}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            >
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td>
                            <span className={`payment-status status-${order.payment?.status?.toLowerCase()}`}>
                              {order.payment?.status || 'Pending'}
                            </span>
                          </td>
                          <td>{formatDate(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {adminTab === 'allPayments' && !loading && (
            <div className="payments-tab">
              {allPayments.length === 0 ? (
                <p className="empty-state">No payments found.</p>
              ) : (
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th><th>User</th><th>Restaurant</th><th>Amount</th>
                        <th>Razorpay Order ID</th><th>Razorpay Payment ID</th><th>Status</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPayments.map(p => (
                        <tr key={p.orderId}>
                          <td className="order-id">{p.orderId?.slice(-6).toUpperCase()}</td>
                          <td>
                            <div className="customer-info">
                              <span className="customer-name">{p.user?.name || 'N/A'}</span>
                              <span className="customer-email">{p.user?.email || ''}</span>
                            </div>
                          </td>
                          <td>{p.restaurant?.name || 'N/A'}</td>
                          <td className="order-total">₹{p.totalAmount}</td>
                          <td className="payment-id">{p.razorpay_order_id || 'N/A'}</td>
                          <td className="payment-id">{p.razorpay_payment_id || 'N/A'}</td>
                          <td>
                            <span className={`payment-status status-${p.status?.toLowerCase()}`}>
                              {p.status}
                            </span>
                          </td>
                          <td>{formatDate(p.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Restaurant Modal */}
        {showAddRestaurantModal && (
          <div className="modal-overlay" onClick={() => setShowAddRestaurantModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Restaurant</h3>
                <button className="modal-close" onClick={() => setShowAddRestaurantModal(false)}>×</button>
              </div>
              <form onSubmit={handleAddRestaurant} className="modal-form">
                <div className="form-group">
                  <label>Restaurant Name *</label>
                  <input type="text" value={restaurantForm.name}
                    onChange={e => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                    required placeholder="e.g. Biryani House" />
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input type="text" value={restaurantForm.image}
                    onChange={e => setRestaurantForm({ ...restaurantForm, image: e.target.value })}
                    placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input type="text" value={ restaurantForm.location} 
                    onChange={e => setRestaurantForm({ ...restaurantForm, location: e.target.value })}
                    required placeholder="e.g. Downtown, City" />
                </div>
                <div className="form-group">
                  <label>Cuisine Types (comma separated)</label>
                  <input type="text" value={restaurantForm.cuisine}
                    onChange={e => setRestaurantForm({ ...restaurantForm, cuisine: e.target.value })}
                    placeholder="e.g. Indian, Chinese, Fast Food" />
                </div>
                <div className="form-group">
                  <label>Rating (0-5)</label>
                  <input type="number" value={restaurantForm.rating}
                    onChange={e => setRestaurantForm({ ...restaurantForm, rating: e.target.value })}
                    min="0" max="5" step="0.1" placeholder="e.g. 4.5" />
                </div>
                <button type="submit" className="btn-primary">Add Restaurant</button>
              </form>
            </div>
          </div>
        )}
        {/* Add Food Modal */}
        {showAddFoodModal && selectedRestaurant && (
          <div className="modal-overlay" onClick={() => setShowAddFoodModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Food Item to {selectedRestaurant.name}</h3>
                <button className="modal-close" onClick={() => setShowAddFoodModal(false)}>×</button>
              </div>
              <form onSubmit={handleAddFood} className="modal-form">
                <div className="form-group">
                  <label>Food Name *</label>
                  <input type="text" value={foodForm.name}
                    onChange={e => setFoodForm({ ...foodForm, name: e.target.value })}
                    required placeholder="e.g. Chicken Biryani" />
                </div>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" value={foodForm.price}
                    onChange={e => setFoodForm({ ...foodForm, price: e.target.value })}
                    required placeholder="e.g. 250" />
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input type="text" value={foodForm.image}
                    onChange={e => setFoodForm({ ...foodForm, image: e.target.value })}
                    placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={foodForm.description}
                    onChange={e => setFoodForm({ ...foodForm, description: e.target.value })}
                    placeholder="A delicious dish that you'll love!">
                  </textarea>
                </div>
                <button type="submit" className="btn-primary">Add Food Item</button>
              </form>
            </div>
          </div>
        )}
        {/* Manage Menu Modal */}
        {showManageMenuModal && manageMenuRestaurant && (
          <div className="modal-overlay" onClick={() => setShowManageMenuModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Manage Menu for {manageMenuRestaurant.name}</h3>
                <button className="modal-close" onClick={() => setShowManageMenuModal(false)}>×</button>
              </div>
              <div className="menu-management">
                {foods.length === 0 ? (
                  <p className="empty-state">No food items found for this restaurant.</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr><th>Image</th><th>Name</th><th>Price</th><th>Category</th><th>Description</th><th>Available</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {foods.map(food => (
                          <tr key={food._id}>
                            <td>
                              {food.image ? (
                                <img src={food.image} alt={food.name} className="table-thumb" />
                              ) : (
                                <div className="table-thumb-placeholder">{food.name?.[0]}</div>
                              )}
                            </td>
                            <td className="cell-name">{food.name}</td>
                            <td>₹{food.price}</td>
                            <td>{food.category || 'N/A'}</td>
                            <td>{food.description || 'N/A'}</td>
                            <td>
                              <span className={`availability-badge ${food.isAvailable ? 'available' : 'unavailable'}`}>
                                {food.isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                            </td>
                            <td>
                              <button className="btn-secondary btn-sm" onClick={() => handleToggleAvailable(food)}>
                                {food.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                              </button>
                              <button className="btn-secondary btn-sm" onClick={() => startEdit(food)}>
                                Edit
                              </button>
                              <button className="btn-danger btn-sm" onClick={() => handleDeleteFood(food._id)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );

  }
  /* ─────────── Restaurant Owner Dashboard ─────────── */
  else if (user.role === 'restaurant') {
    return (
      <div className="dashboard-container">
        <h1 className="dashboard-title">My Restaurant Dashboard</h1>
        <p className="dashboard-subtitle">Manage your menu and orders</p>
        {message && <div className="dashboard-message success">{message}</div>}
        {error && <div className="dashboard-message error">{error}</div>}
        <div className="dashboard-tabs">
          {OWNER_TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="dashboard-content">
          {loading && <div className="dashboard-loading">Loading...</div>}
          {activeTab === 'menu' && !loading && (
            <div className="menu-tab">
              {foods.length === 0 ? (
                <p className="empty-state">No food items found. Add your first food item in the "Add Food" tab.</p>
              ) : (
            <div className="table-wrapper">                                  
              <table className="data-table">
                <thead>
                  <tr><th>Image</th><th>Name</th><th>Price</th><th>Category</th><th>Description</th><th>Available</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {foods.map(food => (
                    <tr key={food._id}>
                      <td>
                        {food.image ? (
                          <img src={food.image} alt={food.name} className="table-thumb" />
                        ) : (
                          <div className="table-thumb-placeholder">{food.name?.[0]}</div>
                        )}
                      </td>
                      <td className="cell-name">{food.name}</td>
                      <td>₹{food.price}</td>
                      <td>{food.category || 'N/A'}</td>
                      <td>{food.description || 'N/A'}</td>
                      <td>
                        <span className={`availability-badge ${food.isAvailable ? 'available' : 'unavailable'}`}>
                          {food.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-secondary btn-sm" onClick={() => handleToggleAvailable(food)}>
                          {food.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                        <button className="btn-secondary btn-sm" onClick={() => startEdit(food)}>
                          Edit
                        </button>
                        <button className="btn-danger btn-sm" onClick={() => handleDeleteFood(food._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              )}
            </div>
          )}
          {activeTab === 'add' && !loading && (
            <div className="add-food-tab">
              <form onSubmit={handleAddFoodOwner} className="add-food-form">
                <div className="form-group">
                  <label>Food Name *</label>
                  <input type="text" value={addForm.name}
                    onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                    required placeholder="e.g. Chicken Biryani" />
                </div>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" value={addForm.price}
                    onChange={e => setAddForm({ ...addForm, price: e.target.value })}
                    required placeholder="e.g. 250" />
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input type="text" value={addForm.image}
                    onChange={e => setAddForm({ ...addForm, image: e.target.value })}
                    placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" value={addForm.category}
                    onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                    placeholder="e.g. Main Course, Appetizer" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={addForm.description}
                    onChange={e => setAddForm({ ...addForm, description: e.target.value })}
                    placeholder="Enter food description..." />
                </div>
                <button type="submit" className="btn-primary">
                  Add Food
                </button>
              </form>
            </div>
          )}
          {activeTab === 'orders' && !loading && (
            <div className="orders-tab">
              {orders.length === 0 ? (
                <p className="empty-state">No orders found.</p>
              ) : (
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Update Status</th><th>Payment</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order._id}>
                          <td className="order-id">{order._id.slice(-6).toUpperCase()}</td>
                          <td>
                            <div className="customer-info">
                              <span className="customer-name">{order.user?.name ||  'Unknown Customer'}</span>
                              <span className="customer-email">{order.user?.email || ''}</span>
                            </div>
                          </td>
                          <td>
                            <ul className="order-items-list">
                              {order.items?.map((item, idx) => (
                                <li key={idx}>{item.food?.name || 'Unknown'} x{item.qty}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="order-total">₹{order.totalAmount}</td>
                          <td>
                            <span className={`status-badge status-${order.status?.replace(/\s+/g, '-').toLowerCase()}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <select className="status-select"
                              value={order.status}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            >
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td>
                            <span className={`payment-status status-${order.payment?.status?.toLowerCase()}`}>
                              {order.payment?.status || 'Pending'}
                            </span>
                          </td>
                          <td>{formatDate(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
};
 
  
export default RestaurantDashboard;