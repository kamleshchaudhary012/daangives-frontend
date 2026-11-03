import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import { requestPasswordReset } from '../../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await requestPasswordReset(email);
      setSuccessMsg(res.detail || 'If an account exists for this email address, password reset instructions have been sent.');
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="py-16 bg-surface-container-low flex items-center justify-center min-h-[calc(100vh-160px)]">
        <div className="max-w-md w-full mx-4 bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 shadow-xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center font-bold text-2xl mx-auto">
              <span className="material-symbols-outlined text-2xl">lock_reset</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface">Reset Password</h1>
            <p className="text-xs text-on-surface-variant">Enter your registered email address to receive password reset instructions</p>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-xl">
              {errorMsg}
            </div>
          )}

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container disabled:opacity-50 shadow-md transition-all text-sm"
              >
                {loading ? 'Sending Request...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <span className="material-symbols-outlined text-emerald-600 text-3xl">check_circle</span>
              <h3 className="font-bold text-emerald-900 text-sm">Request Processed</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">{successMsg}</p>
            </div>
          )}

          <div className="text-center pt-2 border-t border-outline-variant/40">
            <Link to="/login" className="text-xs text-primary font-bold hover:underline">Return to Sign In</Link>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
