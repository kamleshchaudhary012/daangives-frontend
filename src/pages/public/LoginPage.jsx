import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import { loginUser } from '../../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const registeredType = searchParams.get('registered');
  const nextParam = searchParams.get('next') || location.state?.from?.pathname;
  const authMessage = location.state?.message;

  useEffect(() => {
    const expiredMsg = sessionStorage.getItem('sessionExpiredMsg');
    if (expiredMsg) {
      setGeneralError(expiredMsg);
      sessionStorage.removeItem('sessionExpiredMsg');
    }
  }, []);

  const validateForm = () => {
    const errors = {};
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(email, password);
      localStorage.removeItem('companyProfile');
      sessionStorage.removeItem('companyProfile');
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Trust only authoritative role returned by authenticated backend response
      const userRole = data.user?.role?.toUpperCase();
      const nextUrl = searchParams.get('next') || location.state?.from?.pathname;

      if (userRole === 'DONOR') {
        setGeneralError(
          'Individual donor accounts have been retired as DaanGives is now a dedicated Section 135 CSR platform. Please register as a Village/Sanstha or Corporate CSR entity, or contact support.'
        );
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }

      if (
        nextUrl &&
        ((userRole === 'NGO' && nextUrl.startsWith('/ngo')) ||
          (userRole === 'ADMIN' && nextUrl.startsWith('/admin')) ||
          (userRole === 'COMPANY' && nextUrl.startsWith('/company')))
      ) {
        navigate(nextUrl, { replace: true });
      } else {
        if (userRole === 'NGO') navigate('/ngo/dashboard', { replace: true });
        else if (userRole === 'COMPANY') navigate('/company/dashboard', { replace: true });
        else if (userRole === 'ADMIN') navigate('/admin/dashboard', { replace: true });
        else navigate('/', { replace: true });
      }
    } catch (err) {
      if (err.fieldErrors) {
        const backendErrors = {};
        if (err.fieldErrors.email) {
          backendErrors.email = Array.isArray(err.fieldErrors.email)
            ? err.fieldErrors.email.join(' ')
            : err.fieldErrors.email;
        }
        if (err.fieldErrors.password) {
          backendErrors.password = Array.isArray(err.fieldErrors.password)
            ? err.fieldErrors.password.join(' ')
            : err.fieldErrors.password;
        }
        if (err.fieldErrors.detail || err.fieldErrors.non_field_errors) {
          setGeneralError(
            err.fieldErrors.detail ||
              (Array.isArray(err.fieldErrors.non_field_errors)
                ? err.fieldErrors.non_field_errors.join(' ')
                : err.fieldErrors.non_field_errors)
          );
        }
        setFieldErrors(backendErrors);
      } else {
        setGeneralError(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="py-16 bg-slate-50 flex items-center justify-center min-h-[calc(100vh-160px)] px-4">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-xs">
              <span className="material-symbols-outlined text-xl">handshake</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Sign In to CSR Connect
            </h1>
            <span className="sr-only">Sign In to DaanGives</span>
            <p className="text-xs text-slate-500">
              Access your village project proposals or corporate CSR grant portfolio
            </p>
          </div>

          {/* Registration Success Banner */}
          {registeredType === 'ngo' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5 text-emerald-600">check_circle</span>
              <div>
                <p className="font-semibold">Village / Sanstha Account Created Successfully!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Please sign in with your credentials to proceed through the NGO registration wizard.</p>
              </div>
            </div>
          )}

          {registeredType === 'company' && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5 text-blue-600">check_circle</span>
              <div>
                <p className="font-semibold">Corporate CSR Account Created Successfully!</p>
                <p className="text-[11px] text-blue-700 mt-0.5">Please sign in with your work email to access your Corporate CSR portal.</p>
              </div>
            </div>
          )}

          {/* Authentication Required Banner (Redirected from Protected Flow) */}
          {(authMessage || nextParam === '/ngo/registration-flow') && !registeredType && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5 text-amber-600">info</span>
              <div className="space-y-1">
                <p className="font-semibold">Sign In Required to Continue</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {authMessage || 'Please sign in with your Village/Sanstha account to access the NGO registration flow. Your progress will be saved.'}
                </p>
                <div className="pt-0.5">
                  <Link to="/register?role=NGO" className="text-amber-900 font-bold underline hover:text-black text-[11px]">
                    Don't have an NGO account yet? Register here →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {generalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5 text-rose-600">error</span>
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs font-medium" noValidate>
            <div className="space-y-1">
              <label className="text-slate-700 block font-medium">Official Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org or csr@company.com"
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              />
              {fieldErrors.email && <p className="text-rose-600 text-[11px] font-normal">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 block font-medium">Password</label>
                <Link to="/forgot-password" className="text-slate-600 hover:text-slate-900 hover:underline text-[11px]">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              />
              {fieldErrors.password && <p className="text-rose-600 text-[11px] font-normal">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-medium py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base" aria-hidden="true">progress_activity</span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Registration Links & Statutory Guidance */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-600 font-medium">New to CSR Connect?</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs">
                <Link to="/ngo/registration" className="text-slate-800 hover:text-slate-900 font-semibold underline underline-offset-2">
                  Register as NGO / Sanstha
                </Link>
                <span className="hidden sm:inline text-slate-300">•</span>
                <Link to="/register" className="text-slate-800 hover:text-slate-900 font-semibold underline underline-offset-2">
                  Register as Corporate CSR Partner
                </Link>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center leading-relaxed">
              <strong>Notice:</strong> NGO onboarding is a statutory compliance verification process. Creating an account submits your application for administrative review and does not constitute immediate platform approval.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
