import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageToggle from '../components/common/LanguageToggle';
import AvatarImage from '../components/common/AvatarImage';
import { logoutUser, getCompanyProfile, getUserProfile } from '../services/api';

function getInitials(name) {
  if (!name || typeof name !== 'string') return 'CO';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CO';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'PENDING_VERIFICATION':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'REJECTED':
    case 'SUSPENDED':
      return 'bg-red-50 text-red-700 border border-red-200';
    case 'DRAFT':
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

export default function CompanyLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getCompanyProfile().catch(() => null),
      getUserProfile().catch(() => null),
    ]).then(([company, user]) => {
      if (isMounted) {
        setCompanyProfile(company);
        setUserProfile(user);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/company/dashboard', icon: 'dashboard' },
    { label: 'Company Profile', path: '/company/profile', icon: 'verified_user' },
    { label: 'Match Preferences', path: '/company/preferences', icon: 'tune' },
    { label: 'CSR Marketplace', path: '/company/marketplace', icon: 'storefront' },
    { label: 'Support Requests', path: '/company/requests', icon: 'mark_email_unread' },
    { label: 'Partnerships', path: '/company/partnerships', icon: 'handshake' },
    { label: 'CSR Analytics', path: '/company/analytics', icon: 'analytics' },
    { label: 'Help & Support', path: '/company/tickets', icon: 'support_agent' },
  ];

  const companyName = loading
    ? 'Loading...'
    : companyProfile?.company_name || companyProfile?.legal_name || userProfile?.full_name || 'CSR Donor';
  const verificationStatus = companyProfile?.verification_status || 'DRAFT';

  return (
    <div className="min-h-screen bg-slate-50 flex font-outfit text-slate-900">
      {/* Sidebar Overlay for Mobile */}
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
          {/* Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-200">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
                <span className="material-symbols-outlined text-lg" aria-hidden="true">corporate_fare</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                CSR<span className="text-slate-500 font-normal">Connect</span>
              </span>
            </Link>
          </div>

          {/* Company Profile Tag */}
          <div className="px-3.5 py-2.5 mx-3 my-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center gap-2.5">
            <AvatarImage
              name={companyName}
              size="sm"
              shape="rounded"
              fallbackIcon="corporate_fare"
            />
            <div className="overflow-hidden flex-1">
              <span className="block text-xs font-semibold text-slate-900 truncate">{companyName}</span>
              <span className="block text-[10px] text-slate-500 font-medium">CSR Corporate Partner</span>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${getStatusBadgeClass(verificationStatus)}`}>
                {verificationStatus.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const active =
                location.pathname === item.path ||
                (item.path !== '/company/dashboard' && location.pathname.startsWith(item.path));
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
            <h1 className="text-base sm:text-lg font-bold text-slate-900">CSR Donor Portal</h1>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              to="/company/profile"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">verified_user</span>
              Verification Status
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
