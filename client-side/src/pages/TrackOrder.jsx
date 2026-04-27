import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import './TrackOrder.css';

const API = import.meta.env.VITE_API;
const API_BASE = API || 'http://localhost:3500/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_STEPS = [
  'Pending',
  'Confirmed',
  'Cooking',
  'Out for Delivery',
  'Delivered',
];

const STATUS_COLORS = {
  Pending: '#9ca3af',
  Confirmed: '#3b82f6',
  Cooking: '#f59e0b',
  'Out for Delivery': '#8b5cf6',
  Delivered: '#10b981',
};

const TrackOrder = () => {
  const { orderId } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch order');
      }
      setOrder(data);
      if (data.status === 'Delivered') {
        setPolling(false);
      }
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(() => {
      fetchOrder();
    }, 10000);

    return () => clearInterval(interval);
  }, [polling, orderId]);

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    return STATUS_STEPS.indexOf(order.status);
  };

  const getMapCenter = () => {
    if (!order) return { lat: 20.5937, lng: 78.9629 }; // Default: India center

    if (
      order.deliveryBoyLocation?.lat != null &&
      order.deliveryBoyLocation?.lng != null
    ) {
      return {
        lat: order.deliveryBoyLocation.lat,
        lng: order.deliveryBoyLocation.lng,
      };
    }

    if (
      order.deliveryAddress?.lat != null &&
      order.deliveryAddress?.lng != null
    ) {
      return {
        lat: order.deliveryAddress.lat,
        lng: order.deliveryAddress.lng,
      };
    }

    return { lat: 20.5937, lng: 78.9629 };
  };

  if (loading) {
    return (
      <div className="track-page">
        <div className="track-container">
          <div className="track-loading">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="track-page">
        <div className="track-container">
          <div className="track-error">{error}</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="track-page">
        <div className="track-container">
          <div className="track-error">Order not found</div>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();
  const mapCenter = getMapCenter();
  const hasDeliveryLocation =
    order.deliveryBoyLocation?.lat != null &&
    order.deliveryBoyLocation?.lng != null;
  const hasDeliveryAddress =
    order.deliveryAddress?.lat != null &&
    order.deliveryAddress?.lng != null;

  return (
    <div className="track-page">
      <div className="track-container">
        <h1 className="track-title">Track Order</h1>
        <p className="track-order-id">Order #{order._id}</p>

        <div className="track-status-card">
          <div className="track-status-header">
            <span
              className="track-status-badge"
              style={{
                backgroundColor: STATUS_COLORS[order.status] + '20',
                color: STATUS_COLORS[order.status],
              }}
            >
              {order.status}
            </span>
            <span className="track-polling-status">
              {polling ? 'Live tracking' : 'Tracking ended'}
            </span>
          </div>

          <div className="track-progress">
            {STATUS_STEPS.map((step, index) => (
              <div key={step} className="track-progress-step">
                <div
                  className={`track-progress-dot ${
                    index <= currentStep ? 'active' : ''
                  }`}
                  style={{
                    backgroundColor:
                      index <= currentStep
                        ? STATUS_COLORS[step]
                        : '#e5e7eb',
                    borderColor:
                      index <= currentStep
                        ? STATUS_COLORS[step]
                        : '#e5e7eb',
                  }}
                />
                {index < STATUS_STEPS.length - 1 && (
                  <div
                    className={`track-progress-line ${
                      index < currentStep ? 'active' : ''
                    }`}
                  />
                )}
                <span
                  className={`track-progress-label ${
                    index <= currentStep ? 'active' : ''
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="track-details">
          <h2 className="track-section-title">Order Details</h2>
          <div className="track-payment-info">
            <div className="track-payment-row">
              <span>Payment Status:</span>
              <span className={`track-payment-badge status-${order.payment?.status?.toLowerCase() || 'pending'}`}>
                {order.payment?.status || 'Pending'}
              </span>
            </div>
            {order.payment?.razorpay_payment_id && (
              <div className="track-payment-row">
                <span>Payment ID:</span>
                <span className="track-payment-id">{order.payment.razorpay_payment_id}</span>
              </div>
            )}
          </div>
          <div className="track-items">
            {order.items.map((item) => (
              <div key={item.food?._id || item._id} className="track-item">
                <span className="track-item-name">
                  {item.food?.name || 'Unknown Item'} x {item.qty}
                </span>
                <span className="track-item-price">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>
          <div className="track-total">
            <span>Total</span>
            <span>₹{order.totalAmount}</span>
          </div>
          <div className="track-address">
            <strong>Delivery Address:</strong>
            <p>{order.deliveryAddress?.address || 'Not provided'}</p>
          </div>
        </div>

        <div className="track-map-section">
          <h2 className="track-section-title">Delivery Location</h2>
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={14}
            style={{ width: '100%', height: '360px', borderRadius: '12px' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hasDeliveryAddress && (
              <Marker
                position={[
                  order.deliveryAddress.lat,
                  order.deliveryAddress.lng,
                ]}
              >
                <Popup>Delivery Address</Popup>
              </Marker>
            )}
            {hasDeliveryLocation && (
              <Marker
                position={[
                  order.deliveryBoyLocation.lat,
                  order.deliveryBoyLocation.lng,
                ]}
              >
                <Popup>Delivery Partner</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;

