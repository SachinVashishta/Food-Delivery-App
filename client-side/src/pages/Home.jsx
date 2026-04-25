import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Home.css';
const API = import.meta.env.VITE_API;
const API_BASE = API || 'http://localhost:3500/api';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${API_BASE}/restaurants/home`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch restaurants');
        }
        setRestaurants(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const handleAddToCart = (food, restaurant, e) => {
    e.stopPropagation();
    addToCart({
      _id: food._id,
      name: food.name,
      price: food.price,
      image: food.image,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
    });
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="restaurants-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="restaurant-card skeleton">
              <div className="restaurant-header">
                <div className="skeleton-img" />
                <div className="restaurant-info">
                  <div className="skeleton-text title" />
                  <div className="skeleton-text small" />
                </div>
              </div>
              <div className="food-scroll">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="skeleton-food" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="home-error">{error}</div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="home-container">
        <div className="home-empty">No restaurants available</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <h1 className="home-title">Restaurants Near You</h1>
      <div className="restaurants-grid">
        {restaurants.map(({ restaurant, popularFoods }) => (
          <div
            key={restaurant._id}
            className="restaurant-card"
            onClick={() => navigate(`/restaurant/${restaurant._id}`)}
          >
            <div className="restaurant-header">
              <img
                src={restaurant.image || '/icons.svg'}
                alt={restaurant.name}
                className="restaurant-img"
                onError={(e) => {
                  e.target.src = '/icons.svg';
                }}
              />
              <div className="restaurant-info">
                <h2 className="restaurant-name">{restaurant.name}</h2>
                <div className="restaurant-meta">
                  <span className="restaurant-rating">
                    ⭐ {restaurant.rating || '0'}
                  </span>
                  <span className="restaurant-cuisine">
                    {restaurant.cuisine?.join(', ') || 'Various'}
                  </span>
                  <span className="restaurant-time">
                    🕒 {restaurant.deliveryTime || 30} min
                  </span>
                </div>
              </div>
            </div>

            <div className="food-scroll">
              {popularFoods.map((food) => (
                <div
                  key={food._id}
                  className="food-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={food.image || '/icons.svg'}
                    alt={food.name}
                    className="food-img"
                    onError={(e) => {
                      e.target.src = '/icons.svg';
                    }}
                  />
                  <div className="food-details">
                    <p className="food-name">{food.name}</p>
                    <p className="food-price">₹{food.price}</p>
                    <button
                      className="add-btn"
                      onClick={(e) =>
                        handleAddToCart(food, restaurant, e)
                      }
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;

