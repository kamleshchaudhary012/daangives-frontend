import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageToggle from '../components/common/LanguageToggle';
import AvatarImage from '../components/common/AvatarImage';
import { logoutUser, getNgoProfile, getUserProfile } from '../services/api';

function getInitials(name) {
  if (!name || typeof name !== 'string') return 'NGO';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NGO';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function NgoLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ngoProfile, setNgoProfile] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getNgoProfile().catch(() => null),
      getUserProfile().catch(() => null),
    ]).then(([ngo, user]) => {
      if (isMounted) {
        setNgoProfile(ngo);
        setUserProfile(user);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const isApproved = ngoProfile?.status === 'APPROVED';

  const navItems = [
    { label: 'NGO Dashboard', path: '/ngo/dashboard', icon: 'dashboard' },
    { label: 'NGO Profile', path: '/ngo/profile', icon: 'domain' },
    { label: 'My Projects', path: '/ngo/projects', icon: 'architecture' },
    { label: 'Campaigns', path: '/ngo/needs', icon: 'campaign' },
    { label: 'Distribution Proofs', path: '/ngo/reports', icon: 'fact_check' },
    { label: 'CSR Connect', path: '/ngo/csr/dashboard', icon: 'handshake' },
    { label: 'Fundraising Analytics', path: '/ngo/analytics', icon: 'analytics' },
    { label: 'Help & Support', path: '/ngo/tickets', icon: 'support_agent' },
  ];

  if (!isApproved) {
    navItems.push(
      { label: 'Registration Status', path: '/ngo/registration-flow', icon: 'assignment' }
    );
  }

  const orgName = loading
    ? 'Loading...'
    : ngoProfile?.display_name || ngoProfile?.name || userProfile?.full_name || 'Village / Sanstha';
  const initials = loading ? '—' : getInitials(orgName);
  const statusLabel = ngoProfile
    ? `${ngoProfile.darpan_id ? ngoProfile.darpan_id + ' • ' : ''}${ngoProfile.status}`
    : 'Village / Sanstha Account';

  return (
    <div className="min-h-screen bg-slate-50 flex font-outfit text-slate-900">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-200">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-lg" aria-hidden="true">home_work</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Village<span className="text-slate-500 font-normal">Sanstha</span>
              </span>
            </Link>
          </div>

          {/* Organization Badge */}
          <div className="px-3.5 py-2.5 mx-3 my-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center gap-2.5">
            <AvatarImage
              src={ngoProfile?.logo}
              name={orgName}
              size="sm"
              shape="rounded"
              fallbackIcon="home_work"
            />
            <div className="overflow-hidden">
              <span className="block text-xs font-semibold text-slate-900 truncate">{orgName}</span>
              <span className="block text-[10px] text-slate-500 font-medium truncate uppercase">{statusLabel}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const active =
                location.pathname === item.path ||
                (item.path !== '/ngo/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-slate-900 pl-2.5'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-xl ${
                      active ? 'text-slate-900' : 'text-slate-400'
                    }`}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={() => logoutUser()}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors text-left"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900"
              aria-label="Open sidebar navigation"
            >
              <span className="material-symbols-outlined" aria-hidden="true">menu</span>
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">Village / Sanstha Portal</h1>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            {!isApproved ? (
              <Link
                to="/ngo/registration-flow"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">assignment</span>
                Application Flow
              </Link>
            ) : (
              <Link
                to="/ngo/needs"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">add_circle</span>
                New Campaign
              </Link>
            )}
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
