import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageToggle from '../components/common/LanguageToggle';
import AvatarImage from '../components/common/AvatarImage';
import { logoutUser, getUserProfile } from '../services/api';

function getInitials(name) {
  if (!name || typeof name !== 'string') return 'D';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'D';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function DonorLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    getUserProfile()
      .then((data) => {
        if (isMounted) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/donor/dashboard', icon: 'dashboard' },
    { label: 'Help & Support', path: '/donor/tickets', icon: 'support_agent' },
    { label: 'Profile & Settings', path: '/donor/profile', icon: 'person' },
  ];

  const displayName = loading ? 'Loading...' : user?.full_name || 'Legacy Account';

  return (
    <div className="min-h-screen bg-surface-container-low flex font-outfit text-on-surface">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-on-surface/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-64 bg-surface-container-lowest border-r border-outline-variant/60 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className="h-20 flex items-center px-6 border-b border-outline-variant/40">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-xl">corporate_fare</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-on-surface">
                CSR<span className="text-primary">Connect</span>
              </span>
            </Link>
          </div>

          {/* User Tag */}
          <div className="px-4 py-4 m-3 bg-surface-container-low rounded-xl border border-outline-variant/40 flex items-center gap-3">
            <AvatarImage
              src={user?.profile_image}
              name={displayName}
              size="md"
            />
            <div className="overflow-hidden">
              <span className="block text-sm font-semibold truncate text-on-surface">
                {displayName}
              </span>
              <span className="block text-xs text-on-surface-variant font-medium">
                Donor Account
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-white font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-outline-variant/40">
          <button
            onClick={() => logoutUser()}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-error hover:bg-error-container/20 rounded-xl transition-colors text-left"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-20 bg-surface-container-lowest border-b border-outline-variant/50 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-on-surface">Legacy Account Portal</h1>
          </div>

          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link to="/donor/tickets" title="Help & Support" className="p-2 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">support_agent</span>
            </Link>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
          <div className="animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
