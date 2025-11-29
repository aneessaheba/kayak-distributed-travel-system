import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane,
  Hotel,
  Car,
  User,
  LogOut,
  Menu,
  X,
  MessageCircle,
  Settings,
  History,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui';
import styles from './Navbar.module.css';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, isAdmin, user, admin, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { path: '/flights', label: 'Flights', icon: Plane },
    { path: '/hotels', label: 'Hotels', icon: Hotel },
    { path: '/cars', label: 'Cars', icon: Car },
  ];

  const handleLogout = () => {
    localStorage.removeItem('kayak-token');
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Plane size={24} />
          </div>
          <span className={styles.logoText}>KAYAK</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={styles.navLinks}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`${styles.navLink} ${location.pathname === link.path ? styles.active : ''}`}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>
          {/* AI Concierge Button */}
          <Link to="/concierge" className={styles.conciergeBtn}>
            <MessageCircle size={18} />
            <span>AI Concierge</span>
          </Link>

          {isAuthenticated ? (
            <div className={styles.userMenu}>
              <button
                className={styles.userButton}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className={styles.avatar}>
                  {isAdmin
                    ? admin?.firstName?.[0]
                    : user?.firstName?.[0] || 'U'}
                </div>
                <span className={styles.userName}>
                  {isAdmin ? admin?.firstName : user?.firstName}
                </span>
                <ChevronDown
                  size={16}
                  className={`${styles.chevron} ${isUserMenuOpen ? styles.open : ''}`}
                />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    className={styles.dropdown}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    {isAdmin ? (
                      <>
                        <Link
                          to="/admin"
                          className={styles.dropdownItem}
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings size={16} />
                          Dashboard
                        </Link>
                        <Link
                          to="/admin/listings"
                          className={styles.dropdownItem}
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Hotel size={16} />
                          Manage Listings
                        </Link>
                        <Link
                          to="/admin/users"
                          className={styles.dropdownItem}
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User size={16} />
                          Manage Users
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/profile"
                          className={styles.dropdownItem}
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User size={16} />
                          Profile
                        </Link>
                        <Link
                          to="/bookings"
                          className={styles.dropdownItem}
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <History size={16} />
                          My Bookings
                        </Link>
                      </>
                    )}
                    <div className={styles.dropdownDivider} />
                    <button
                      className={styles.dropdownItem}
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className={styles.mobileToggle}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={styles.mobileLink}
                onClick={() => setIsMenuOpen(false)}
              >
                <link.icon size={20} />
                <span>{link.label}</span>
              </Link>
            ))}
            <Link
              to="/concierge"
              className={styles.mobileLink}
              onClick={() => setIsMenuOpen(false)}
            >
              <MessageCircle size={20} />
              <span>AI Concierge</span>
            </Link>
            {!isAuthenticated && (
              <>
                <div className={styles.mobileDivider} />
                <Link
                  to="/login"
                  className={styles.mobileLink}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className={styles.mobileLink}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};


