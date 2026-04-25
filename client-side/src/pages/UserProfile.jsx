import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './UserProfile.css';

const API = import.meta.env.VITE_API;
const API_BASE = API ||'http://localhost:3500/api';

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const axiosInstance = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const [activeTab, setActiveTab] = useState('orders');
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', image: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchOrders();
    fetchPayments();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get('/auth/profile');
      setProfile(res.data);
      setEditForm({
        name: res.data.name || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        image: res.data.image || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profile');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get('/orders/myorders');
      setOrders(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await axiosInstance.get('/payment/history');
      setPayments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch payments', err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMessage(null);
    try {
      const res = await axiosInstance.put('/auth/profile', editForm);
      setProfile(res.data.user);
      setEditMode(false);
      setEditMessage('Profile updated successfully');
      setTimeout(() => setEditMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  if (!user) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1 className="profile-title">My Profile</h1>

        {editMessage && <div className="profile-message success">{editMessage}</div>}
        {error && <div className="profile-error">{error}</div>}

        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            {profile?.image ? (
              <img src={profile.image} alt={profile.name} className="profile-avatar-img" />
            ) : (
              profile?.name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          {!editMode ? (
            <div className="profile-info">
              <h2>{profile?.name || user.name}</h2>
              <p><strong>Email:</strong> {profile?.email || user.email}</p>
              <p><strong>Phone:</strong> {profile?.phone || 'Not provided'}</p>
              <p><strong>Address:</strong> {profile?.address || 'Not provided'}</p>
              <button className="btn-edit-profile" onClick={() => setEditMode(true)}>
                Edit Profile
              </button>
            </div>
          ) : (
            <form className="profile-edit-form" onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  rows={2}
                  placeholder="Enter address"
                />
              </div>
              <div className="form-group">
                <label>Profile Image URL</label>
                <input
                  type="text"
                  value={editForm.image}
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="profile-edit-actions">
                <button type="submit" className="btn-primary" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            My Orders ({orders.length})
          </button>
          <button
            className={`profile-tab ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            My Payments ({payments.length})
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="profile-section">
            {loading ? (
              <div className="profile-loading">Loading orders...</div>
            ) : orders.length === 0 ? (
              <p className="empty-state">No orders yet.</p>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <div>
                        <span className="order-label">Order #{order._id?.slice(-6).toUpperCase()}</span>
                        <span className="order-date">{formatDate(order.createdAt)}</span>
                      </div>
                      <span className={`order-status-badge status-${order.status?.replace(/\s+/g, '-').toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-restaurant">
                      <strong>{order.restaurant?.name || 'Unknown Restaurant'}</strong>
                      <span>{order.restaurant?.address || ''}</span>
                    </div>
                    <div className="order-items">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="order-item-row">
                          <span>{item.food?.name || 'Unknown'} x{item.qty}</span>
                          <span>₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-footer">
                      <span className="order-total">Total: ₹{order.totalAmount}</span>
                      <div className="order-actions">
                        <Link to={`/track/${order._id}`} className="btn-track">
                          Track Order
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="profile-section">
            {payments.length === 0 ? (
              <p className="empty-state">No payment history yet.</p>
            ) : (
              <div className="payments-table-wrapper">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Restaurant</th>
                      <th>Amount</th>
                      <th>Payment ID</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.orderId}>
                        <td className="payment-order-id">{p.orderId?.slice(-6).toUpperCase()}</td>
                        <td>{p.restaurant?.name || 'N/A'}</td>
                        <td className="payment-amount">₹{p.totalAmount}</td>
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
    </div>
  );
};

export default UserProfile;

