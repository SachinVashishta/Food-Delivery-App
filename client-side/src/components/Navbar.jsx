import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">FoodApp</Link>
      </div>
      <div className="navbar-links">
        {user ? (
          <>
            <span className="navbar-user">Hello, {user.name}</span>
            <Link to="/profile" className="navbar-link">Profile</Link>
            {(user.role === 'restaurant' || user.role === 'admin') && (
              <Link to="/restaurant/dashboard" className="navbar-link">Dashboard</Link>
            )}
            <Link to="/cart" className="navbar-link">Cart</Link>
            <button className="navbar-button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-link">Login</Link>
            <Link to="/register" className="navbar-link navbar-link-primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

