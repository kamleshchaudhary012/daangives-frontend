import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageToggle from '../components/common/LanguageToggle';
import { logoutUser, getUserProfile } from '../services/api';

function getInitials(name) {
  if (!name || typeof name !== 'string') return 'A';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminLayout({ children }) {
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
    { label: 'Admin Overview', path: '/admin/dashboard', icon: 'admin_panel_settings' },
    { label: 'NGO Approvals', path: '/admin/ngos', icon: 'verified_user' },
    { label: 'Project Proposals', path: '/admin/projects', icon: 'assignment_turned_in' },
    { label: 'CSR Companies', path: '/admin/csr/companies', icon: 'domain' },
    { label: 'CSR Requirements', path: '/admin/csr/requirements', icon: 'assignment' },
    { label: 'CSR Oversight', path: '/admin/csr/oversight', icon: 'corporate_fare' },
    { label: 'Support & Grievances', path: '/admin/complaints', icon: 'support_agent' },
    { label: 'Analytics Dashboard', path: '/admin/analytics', icon: 'insights' },
  ];

  const displayName = loading ? 'Loading...' : user?.full_name || 'Administrator';
  const initials = loading ? '—' : getInitials(user?.full_name);

  return (
    <div className="min-h-screen bg-slate-50 flex font-outfit text-slate-900">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-200">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-lg">shield_person</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Admin<span className="text-slate-500 font-normal">Suite</span>
              </span>
            </Link>
          </div>

          <div className="px-3.5 py-2.5 mx-3 my-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-semibold flex items-center justify-center text-[11px] shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <span className="block text-xs font-semibold text-slate-900 truncate">{displayName}</span>
              <span className="block text-[10px] text-slate-500 font-medium">State Administrator</span>
            </div>
          </div>

          <nav className="px-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const isCsrOversightMatch =
                item.path === '/admin/csr/oversight' &&
                (location.pathname.startsWith('/admin/csr/oversight') ||
                  location.pathname === '/admin/csr/partnerships' ||
                  location.pathname === '/admin/csr/audit-history' ||
                  location.pathname === '/admin/csr/analytics');
              const active =
                location.pathname === item.path ||
                (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path)) ||
                isCsrOversightMatch;
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
                  <span className={`material-symbols-outlined text-xl ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-200">
          <button
            onClick={() => logoutUser()}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors text-left"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Exit Admin Console
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg"
              aria-label="Open sidebar"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-slate-900">Platform Governance Suite</h1>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <div className="flex items-center gap-1.5 bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> System Live
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden text-slate-900">
          <div className="animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
