import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

const API_BASE = 'http://localhost:3500/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { cartItems, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (cartItems.length === 0) {
      navigate('/');
    }
  }, [user, cartItems, navigate]);

  useEffect(() => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLocationLoading(false);
      },
      (err) => {
        setLocationError('Unable to retrieve your location: ' + err.message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const handlePay = async () => {
    if (!address.trim()) {
      setError('Please enter a delivery address');
      return;
    }

    setPaying(true);
    setError('');

    try {
      // Step 1: Create order
      const restaurantId = cartItems[0]?.restaurantId;
      const orderItems = cartItems.map((item) => ({
        foodId: item._id,
        qty: item.qty,
      }));

      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          restaurant: restaurantId,
          items: orderItems,
          deliveryAddress: {
            address,
            lat,
            lng,
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      const orderId = orderData.order._id;
      const amount = orderData.order.totalAmount;

      // Step 2: Create Razorpay order
      const paymentRes = await fetch(`${API_BASE}/payment/create-order`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount,
          receipt: `receipt_${orderId}`,
        }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) {
        throw new Error(paymentData.message || 'Failed to create payment order');
      }

      const razorpayOrderId = paymentData.order.id;
      const keyId = paymentData.key_id;

      // Step 3: Load Razorpay script and open checkout
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      const options = {
        key: keyId,
        amount: paymentData.order.amount,
        currency: paymentData.order.currency,
        name: 'FoodApp',
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          // Step 4: Verify payment
          try {
            const verifyRes = await fetch(`${API_BASE}/payment/verify`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) {
              throw new Error(verifyData.message || 'Payment verification failed');
            }

            // Step 5: Update order payment details
            const updateRes = await fetch(`${API_BASE}/orders/${orderId}/payment`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                status: 'Completed',
              }),
            });

            const updateData = await updateRes.json();
            if (!updateRes.ok) {
              throw new Error(updateData.message || 'Failed to update order payment');
            }

            clearCart();
            navigate(`/track/${orderId}`);
          } catch (err) {
            setError(err.message);
            setPaying(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#f97316',
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message);
      setPaying(false);
    }
  };

  if (!user || cartItems.length === 0) {
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        {error && <div className="checkout-error">{error}</div>}

        <div className="checkout-section">
          <h2 className="checkout-section-title">Order Summary</h2>
          <div className="checkout-items">
            {cartItems.map((item) => (
              <div key={item._id} className="checkout-item">
                <span className="checkout-item-name">
                  {item.name} x {item.qty}
                </span>
                <span className="checkout-item-price">
                  ₹{item.price * item.qty}
                </span>
              </div>
            ))}
          </div>
          <div className="checkout-total">
            <span>Total</span>
            <span>₹{totalAmount}</span>
          </div>
        </div>

        <div className="checkout-section">
          <h2 className="checkout-section-title">Delivery Address</h2>

          {locationLoading && (
            <div className="checkout-location-loading">Detecting your location...</div>
          )}
          {locationError && (
            <div className="checkout-location-error">{locationError}</div>
          )}
          {lat && lng && !locationLoading && (
            <div className="checkout-coords">
              Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
            </div>
          )}

          <textarea
            className="checkout-address-input"
            rows={4}
            placeholder="Enter your full delivery address"
            value={address}
            onChange={handleAddressChange}
            disabled={paying}
          />
        </div>

        <button
          className="checkout-pay-btn"
          onClick={handlePay}
          disabled={paying || !address.trim()}
        >
          {paying ? 'Processing...' : `Pay ₹${totalAmount}`}
        </button>
      </div>
    </div>
  );
};

export default Checkout;

