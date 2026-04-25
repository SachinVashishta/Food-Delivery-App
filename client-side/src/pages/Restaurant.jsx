import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Restaurant.css';

const API = import.meta.env.VITE_API;
const API_BASE = API || 'http://localhost:3500/api';

const Restaurant = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [groupedFoods, setGroupedFoods] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(`${API_BASE}/restaurants/${id}`);
        if (!res.ok) throw new Error('Failed to fetch restaurant');
        const data = await res.json();
        setRestaurant(data.restaurant);
        setFoods(data.foods || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [id]);

  useEffect(() => {
    const groups = {};
    foods.forEach((food) => {
      const cat = food.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(food);
    });
    setGroupedFoods(groups);
  }, [foods]);

  const handleAdd = (food) => {
    addToCart({
      _id: food._id,
      name: food.name,
      price: food.price,
      image: food.image,
      restaurantId: restaurant?._id,
      restaurantName: restaurant?.name,
    });
  };

  if (loading) return <div className="restaurant-loading">Loading...</div>;
  if (error) return <div className="restaurant-error">{error}</div>;
  if (!restaurant) return <div className="restaurant-error">Restaurant not found</div>;

  const categories = Object.keys(groupedFoods);

  return (
    <div className="restaurant-page">
      <div className="restaurant-hero">
        <h1>{restaurant.name}</h1>
        <p className="restaurant-address">{restaurant.address}</p>
        <div className="restaurant-tags">
          <span>⭐ {restaurant.rating || 0}</span>
          <span>🕒 {restaurant.deliveryTime || 30} min</span>
          <span>{restaurant.cuisine?.join(', ') || 'Various'}</span>
        </div>
      </div>

      <div className="menu-section">
        {categories.length === 0 ? (
          <p className="no-menu">No menu items available.</p>
        ) : (
          categories.map((cat) => (
            <div key={cat} className="menu-category">
              <h2>{cat}</h2>
              <div className="menu-grid">
                {groupedFoods[cat].map((food) => (
                  <div key={food._id} className="menu-item">
                    <div className="menu-item-image">
                      {food.image ? (
                        <img src={food.image} alt={food.name} />
                      ) : (
                        <div className="menu-placeholder">{food.name[0]}</div>
                      )}
                    </div>
                    <div className="menu-item-info">
                      <h4>{food.name}</h4>
                      <p className="menu-item-desc">{food.description}</p>
                      <div className="menu-item-footer">
                        <span className="menu-item-price">₹{food.price}</span>
                        <button className="add-btn" onClick={() => handleAdd(food)}>
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Restaurant;

