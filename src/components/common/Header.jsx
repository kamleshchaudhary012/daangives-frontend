import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LanguageToggle from './LanguageToggle';
import AvatarImage from './AvatarImage';
import { logoutUser } from '../../services/api';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (userStr && token) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [location]);

  const role = user?.role?.toUpperCase();
  const isActive = (path) => location.pathname === path;

  const handlePortalClick = (targetPath, requiredRole) => {
    setMobileMenuOpen(false);
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(targetPath)}`);
      return;
    }
    if (role !== requiredRole) {
      if (role === 'DONOR') navigate('/donor/dashboard');
      else if (role === 'NGO') navigate('/ngo/dashboard');
      else if (role === 'ADMIN') navigate('/admin/dashboard');
      else navigate('/login');
      return;
    }
    navigate(targetPath);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/50 backdrop-blur-md bg-opacity-95 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-105 transition-transform shrink-0">
              <span className="material-symbols-outlined text-2xl">corporate_fare</span>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-1">
                CSR<span className="text-primary">Connect</span>
              </span>
              <span className="hidden sm:block text-[10px] text-on-surface-variant font-medium tracking-wide">
                Connecting Villages with Corporate CSR Partners
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <Link
              to="/"
              className={`transition-colors ${
                isActive('/') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Home
            </Link>

            <Link
              to="/campaigns"
              className={`transition-colors ${
                location.pathname.startsWith('/campaigns') || location.pathname.startsWith('/needs')
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Browse Projects
            </Link>

            <Link
              to="/ngos"
              className={`transition-colors ${
                isActive('/ngos') || (location.pathname.startsWith('/ngos/') && !location.pathname.startsWith('/ngo/'))
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Village Directory
            </Link>

            <Link
              to="/csr"
              className={`transition-colors ${
                isActive('/csr')
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              For Companies
            </Link>

            {role === 'DONOR' && (
              <Link
                to="/donor/dashboard"
                className={`transition-colors ${
                  location.pathname.startsWith('/donor') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Donor Dashboard
              </Link>
            )}

            {role === 'NGO' && (
              <Link
                to="/ngo/dashboard"
                className={`transition-colors ${
                  location.pathname.startsWith('/ngo') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Village Console
              </Link>
            )}

            {role === 'COMPANY' && (
              <Link
                to="/company/dashboard"
                className={`transition-colors ${
                  location.pathname.startsWith('/company') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                CSR Dashboard
              </Link>
            )}

            {role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                className={`transition-colors ${
                  location.pathname.startsWith('/admin') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Admin Console
              </Link>
            )}
          </nav>

          {/* Right Actions (Language Toggle, Auth State) */}
          <div className="hidden sm:flex items-center gap-4">
            <LanguageToggle />

            {!user ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-container-low rounded-lg transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-container shadow-sm transition-all"
                >
                  Register
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <AvatarImage
                  src={user.profile_image}
                  name={user.full_name || user.email}
                  size="sm"
                />
                <span className="text-xs font-semibold text-on-surface-variant max-w-36 truncate">
                  {user.full_name || user.email}
                </span>
                <button
                  onClick={() => logoutUser()}
                  className="px-3 py-1.5 text-xs font-bold text-error hover:bg-error-container/20 border border-error/30 rounded-lg transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-3">
            <LanguageToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-surface-container-lowest border-b border-outline-variant px-4 py-4 space-y-3">
          <Link to="/" className="block py-2 text-base font-medium text-on-surface" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link to="/campaigns" className="block py-2 text-base font-medium text-on-surface" onClick={() => setMobileMenuOpen(false)}>
            Browse Projects
          </Link>
          <Link to="/ngos" className="block py-2 text-base font-medium text-on-surface" onClick={() => setMobileMenuOpen(false)}>
            Village Directory
          </Link>
          <Link to="/csr" className="block py-2 text-base font-medium text-on-surface" onClick={() => setMobileMenuOpen(false)}>
            For Companies
          </Link>

          {role === 'DONOR' && (
            <Link to="/donor/dashboard" className="block py-2 text-base font-medium text-primary font-bold" onClick={() => setMobileMenuOpen(false)}>
              Donor Dashboard
            </Link>
          )}

          {role === 'NGO' && (
            <Link to="/ngo/dashboard" className="block py-2 text-base font-medium text-primary font-bold" onClick={() => setMobileMenuOpen(false)}>
              Village Console
            </Link>
          )}

          {role === 'COMPANY' && (
            <Link to="/company/dashboard" className="block py-2 text-base font-medium text-primary font-bold" onClick={() => setMobileMenuOpen(false)}>
              CSR Dashboard
            </Link>
          )}

          {role === 'ADMIN' && (
            <Link to="/admin/dashboard" className="block py-2 text-base font-medium text-primary font-bold" onClick={() => setMobileMenuOpen(false)}>
              Admin Console
            </Link>
          )}

          {!user ? (
            <div className="pt-3 border-t border-outline-variant flex flex-col gap-2">
              <Link to="/login" className="w-full text-center py-2 font-semibold text-primary" onClick={() => setMobileMenuOpen(false)}>
                Log In
              </Link>
              <Link to="/register" className="w-full text-center py-2 font-semibold bg-primary text-white rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Register
              </Link>
            </div>
          ) : (
            <div className="pt-3 border-t border-outline-variant space-y-2">
              <span className="block text-xs text-on-surface-variant">Signed in as: {user.email}</span>
              <button
                onClick={() => logoutUser()}
                className="w-full text-left py-2 font-bold text-error"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
