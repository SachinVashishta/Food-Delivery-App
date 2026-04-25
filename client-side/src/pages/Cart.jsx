import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, updateQty, totalAmount } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <h2>Your cart is empty</h2>
          <p>Add some delicious food to get started!</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1 className="cart-title">Your Cart</h1>
      <div className="cart-items">
        {cartItems.map((item) => (
          <div key={item._id} className="cart-item">
            <div className="cart-item-image">
              {item.image ? (
                <img src={item.image} alt={item.name} />
              ) : (
                <div className="cart-placeholder">{item.name[0]}</div>
              )}
            </div>
            <div className="cart-item-details">
              <h4 className="cart-item-name">{item.name}</h4>
              <p className="cart-item-restaurant">{item.restaurantName}</p>
              <div className="cart-item-actions">
                <div className="qty-control">
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item._id, item.qty - 1)}
                  >
                    −
                  </button>
                  <span className="qty-value">{item.qty}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item._id, item.qty + 1)}
                  >
                    +
                  </button>
                </div>
                <span className="cart-item-price">
                  ₹{item.price * item.qty}
                </span>
                <button
                  className="remove-btn"
                  onClick={() => removeFromCart(item._id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <div className="cart-total-row">
          <span>Total</span>
          <span className="cart-total-amount">₹{totalAmount}</span>
        </div>
        <button
          className="btn-primary btn-full"
          onClick={() => navigate('/checkout')}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;

