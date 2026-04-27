import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" onClick={closeMenu}>FoodApp</Link>
      </div>

      <button
        className="navbar-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        <span className={`hamburger ${menuOpen ? 'open' : ''}`} />
      </button>

      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        {user ? (
          <>
            <span className="navbar-user">Hello, {user.name}</span>
            <Link to="/profile" className="navbar-link" onClick={closeMenu}>Profile</Link>
            {(user.role === 'restaurant' || user.role === 'admin') && (
              <Link to="/restaurant/dashboard" className="navbar-link" onClick={closeMenu}>Dashboard</Link>
            )}
            <Link to="/cart" className="navbar-link" onClick={closeMenu}>Cart</Link>
            <button className="navbar-button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-link" onClick={closeMenu}>Login</Link>
            <Link to="/register" className="navbar-link navbar-link-primary" onClick={closeMenu}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

