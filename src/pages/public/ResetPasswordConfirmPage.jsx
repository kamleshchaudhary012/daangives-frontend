import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import { confirmPasswordReset } from '../../services/api';

export default function ResetPasswordConfirmPage() {
  const { uid, token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset({
        uid,
        token,
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired reset link.');
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
              <span className="material-symbols-outlined text-2xl">key</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface">Set New Password</h1>
            <p className="text-xs text-on-surface-variant">Enter a new secure password for your DaanGives account</p>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-xl space-y-2">
              <p>{errorMsg}</p>
              {errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('expired') ? (
                <div className="pt-1">
                  <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                    Request a New Reset Link →
                  </Link>
                </div>
              ) : null}
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Re-enter new password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container disabled:opacity-50 shadow-md transition-all text-sm"
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <span className="material-symbols-outlined text-emerald-600 text-4xl">check_circle</span>
              <h3 className="font-bold text-emerald-900 text-base">Password Reset Successful</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-block px-6 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-container transition-all shadow-xs"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </PublicLayout>
  );
}
