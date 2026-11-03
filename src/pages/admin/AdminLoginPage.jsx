import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/api';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      const userRole = data.user?.role?.toUpperCase();

      if (userRole !== 'ADMIN') {
        setGeneralError('Access restricted to platform administrators.');
        setLoading(false);
        return;
      }

      localStorage.removeItem('companyProfile');
      sessionStorage.removeItem('companyProfile');
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/admin/dashboard');
    } catch (err) {
      if (err.fieldErrors) {
        const backendErrors = {};
        if (err.fieldErrors.email) {
          backendErrors.email = Array.isArray(err.fieldErrors.email) ? err.fieldErrors.email.join(' ') : err.fieldErrors.email;
        }
        if (err.fieldErrors.password) {
          backendErrors.password = Array.isArray(err.fieldErrors.password) ? err.fieldErrors.password.join(' ') : err.fieldErrors.password;
        }
        if (err.fieldErrors.detail || err.fieldErrors.non_field_errors) {
          setGeneralError(err.fieldErrors.detail || (Array.isArray(err.fieldErrors.non_field_errors) ? err.fieldErrors.non_field_errors.join(' ') : err.fieldErrors.non_field_errors));
        }
        setFieldErrors(backendErrors);
      } else {
        setGeneralError(err.message || 'Invalid administrator credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-outfit text-slate-100">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-lg">
            <span className="material-symbols-outlined text-3xl">shield_person</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">CSR Connect Admin Portal</h1>
          <p className="text-xs text-slate-400 font-medium">
            Authorized administrative access & platform moderation
          </p>
        </div>

        {generalError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs font-semibold" noValidate>
          <div className="space-y-1">
            <label className="text-slate-300 block">Administrator Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@daangives.org"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {fieldErrors.email && <p className="text-rose-400 text-[11px] font-normal">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {fieldErrors.password && <p className="text-rose-400 text-[11px] font-normal">{fieldErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">sync</span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">lock_open</span>
                <span>Sign in to Admin Suite</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-700/50">
          <p className="text-[11px] text-slate-500">
            Internal Platform Governance • Restricted System
          </p>
        </div>
      </div>
    </div>
  );
}
