import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { registerUser, loginUser } from '../../services/api';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role')?.toUpperCase() === 'COMPANY' ? 'COMPANY' : 'NGO';
  const [selectedRole, setSelectedRole] = useState(initialRole);

  const [formData, setFormData] = useState({
    fullName: '',
    organizationName: '',
    registrationNumber: '',
    email: '',
    phone: '',
    password: '',
    agreeTerms: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const roleParam = searchParams.get('role')?.toUpperCase();
    if (roleParam === 'COMPANY') {
      setSelectedRole('COMPANY');
    } else if (roleParam === 'NGO') {
      setSelectedRole('NGO');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const roleToSubmit = selectedRole === 'COMPANY' ? 'COMPANY' : 'NGO';

    try {
      await registerUser({
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        password: formData.password,
        role: roleToSubmit,
        organizationName: formData.organizationName,
        registrationNumber: formData.registrationNumber,
      });

      // Attempt automatic authentication to seamlessly transition user into intended flow
      try {
        const loginData = await loginUser(formData.email, formData.password);
        localStorage.removeItem('companyProfile');
        sessionStorage.removeItem('companyProfile');
        localStorage.setItem('accessToken', loginData.access);
        localStorage.setItem('refreshToken', loginData.refresh);
        localStorage.setItem('user', JSON.stringify(loginData.user));

        if (roleToSubmit === 'NGO') {
          navigate('/ngo/registration-flow', { replace: true });
          return;
        } else {
          navigate('/company/dashboard', { replace: true });
          return;
        }
      } catch (autoLoginErr) {
        // Fallback to login with destination preserved
        if (roleToSubmit === 'NGO') {
          navigate('/login?registered=ngo&next=%2Fngo%2Fregistration-flow', { replace: true });
        } else {
          navigate('/login?registered=company&next=%2Fcompany%2Fdashboard', { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-outfit text-slate-900">
      {/* Minimal CSR Connect Top Brand Bar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">corporate_fare</span>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-0.5">
                CSR<span className="text-slate-600">Connect</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-500 font-medium">
                Village Development & Section 135 CSR Gateway
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline">Already registered?</span>
            <Link
              to="/login"
              className="font-semibold text-slate-900 hover:text-slate-700 underline underline-offset-2"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Registration Container */}
      <main className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="max-w-xl w-full bg-white p-6 sm:p-9 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          
          <div className="text-center space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Create CSR Connect Account
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Select your role to post verified village development needs or fund impactful Section 135 CSR projects.
            </p>
          </div>

          {/* 2-Card Role Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Card 1: Village / NGO / Sanstha */}
            <button
              type="button"
              onClick={() => setSelectedRole('NGO')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedRole === 'NGO'
                  ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="space-y-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                  selectedRole === 'NGO' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">home_work</span>
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-900">Village / NGO / Sanstha</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    Register your village, panchayat, NGO, or community sanstha to post development projects.
                  </p>
                </div>
              </div>
              <div className="mt-3.5 flex items-center gap-1 text-[11px] font-semibold text-slate-900">
                <span>Post Project Needs</span>
                <span className="material-symbols-outlined text-xs" aria-hidden="true">arrow_forward</span>
              </div>
            </button>

            {/* Card 2: CSR Donor / CSR Company */}
            <button
              type="button"
              onClick={() => setSelectedRole('COMPANY')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedRole === 'COMPANY'
                  ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="space-y-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                  selectedRole === 'COMPANY' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">corporate_fare</span>
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-900">CSR Donor / CSR Company</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    Register your company to discover and fund verified CSR projects.
                  </p>
                </div>
              </div>
              <div className="mt-3.5 flex items-center gap-1 text-[11px] font-semibold text-slate-900">
                <span>Fund CSR Projects</span>
                <span className="material-symbols-outlined text-xs" aria-hidden="true">arrow_forward</span>
              </div>
            </button>
          </div>

          {/* Statutory Verification Notice */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <span className="material-symbols-outlined text-amber-700 text-base shrink-0 mt-0.5" aria-hidden="true">policy</span>
            <div className="space-y-0.5">
              <span className="font-semibold">Indian Companies Act 2013 (Section 135) Platform</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {selectedRole === 'NGO'
                  ? 'Sanstha credentials and registration (DARPAN/Trust/Society/CSR-1) will be verified by platform administrators before projects are listed for corporate grant discovery.'
                  : 'Corporate profiles and CIN will be verified before grant Expressions of Interest (EOI) and bilateral MoUs can be executed.'}
              </p>
              {selectedRole === 'NGO' && (
                <div className="pt-1">
                  <Link to="/ngo/registration" className="text-amber-900 font-semibold underline hover:text-black text-[11px]">
                    Read full NGO Onboarding & Statutory Eligibility Guide →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0 text-rose-600" aria-hidden="true">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-medium" noValidate>
            <div className="space-y-1">
              <label className="text-slate-700 block font-medium">
                {selectedRole === 'NGO' ? 'Authorized Representative Full Name' : 'Corporate Officer Full Name'} *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Rameshwar Sharma"
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 block font-medium">
                {selectedRole === 'NGO' ? 'Village / Sanstha / NGO Name' : 'Company / Foundation Legal Name'} *
              </label>
              <input
                type="text"
                required
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                placeholder={selectedRole === 'NGO' ? 'e.g. Gramin Vikas Trust' : 'e.g. Tata Power Ltd'}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-slate-700 block font-medium">Official Work Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@domain.org"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 block font-medium">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 block font-medium">
                {selectedRole === 'NGO' ? 'Registration Identifier (DARPAN / Trust / Society No.)' : 'Corporate Identification Number (CIN)'}
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder={selectedRole === 'NGO' ? 'e.g. MH/2021/0123456' : 'e.g. L28920MH1919PLC000567'}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 block font-medium">Account Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 8 characters"
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              />
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={formData.agreeTerms}
                onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer mt-0.5"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-600 cursor-pointer font-normal leading-normal">
                I agree to the <Link to="/terms" className="text-slate-900 hover:underline font-semibold">Terms of Service</Link> and <Link to="/privacy" className="text-slate-900 hover:underline font-semibold">CSR Privacy Guidelines</Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.agreeTerms}
              className="w-full font-medium py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base" aria-hidden="true">progress_activity</span>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create {selectedRole === 'NGO' ? 'Village / Sanstha' : 'CSR Donor'} Account</span>
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already registered on CSR Connect?{' '}
              <Link to="/login" className="text-slate-900 font-semibold hover:underline">
                Sign in to your portal
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-[11px] text-slate-400">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 DaanGives CSR Connect. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
