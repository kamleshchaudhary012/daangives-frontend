import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';

export default function VerificationConfirmationPage() {
  return (
    <PublicLayout>
      <div className="py-16 bg-surface-container-low flex items-center justify-center min-h-[calc(100vh-160px)]">
        <div className="max-w-md w-full mx-4 bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 shadow-xl text-center space-y-6">
          
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-3xl">verified</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">Account Verified Successfully!</h1>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Welcome to the DaanGives impact community. Your email and identity verification have been confirmed.
            </p>
          </div>

          <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-on-surface-variant">Status:</span>
              <span className="font-semibold text-emerald-700">Verified Donor</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-on-surface-variant">Tax Exemption Eligibility:</span>
              <span className="font-semibold text-primary">80G Form 10BE Active</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/donor/dashboard"
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container shadow-md transition-all text-sm block"
            >
              Go to Donor Dashboard
            </Link>
            <Link
              to="/"
              className="w-full py-3 bg-surface-container-low text-on-surface font-semibold rounded-xl hover:bg-surface-container transition-all text-sm block"
            >
              Back to Home
            </Link>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
