import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';

export default function NgoRegistrationPage() {
  const [isAuthenticatedNgo, setIsAuthenticatedNgo] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        if (parsed?.role?.toUpperCase() === 'NGO') {
          setIsAuthenticatedNgo(true);
        }
      }
    } catch (e) {
      setIsAuthenticatedNgo(false);
    }
  }, []);

  return (
    <PublicLayout>
      <div className="bg-slate-50 py-16 min-h-[calc(100vh-160px)] font-outfit text-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header Title & Subtitle */}
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
              NGO Onboarding Guide
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Partner With DaanGives
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Get access to transparent corporate CSR funding, bilateral partnership MoUs, and automated 80G tax receipt issuance.
            </p>
          </div>

          {/* 3 Prerequisite Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">NITI Aayog Darpan</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Must possess valid NITI Aayog Darpan ID and unique NGO registration code.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">12A & 80G Approval</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Form 10AC statutory order from Income Tax Department required for validation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Scheduled Bank Account</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dedicated Scheduled Bank current or savings account for direct wire disbursement.
              </p>
            </div>
          </div>

          {/* Action Card with Statutory & Return-to-Registration Explanation */}
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-5 shadow-xs">
            <div className="space-y-1.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Ready to Register Your Organization?
              </h2>
              <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                Complete our structured 6-step registration wizard. All applications undergo comprehensive documentary audit by platform compliance administrators before activation.
              </p>
            </div>

            {/* Documented Authentication Requirement */}
            {!isAuthenticatedNgo ? (
              <div className="max-w-xl mx-auto p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left flex items-start gap-3 text-xs text-slate-600">
                <span className="material-symbols-outlined text-base text-slate-700 shrink-0 mt-0.5" aria-hidden="true">
                  verified_user
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">Account & Security Prerequisite</p>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    To securely encrypt and save your draft application across multiple sessions, an authorized Village/Sanstha account is required. If new, create your account to begin. If already registered, sign in to continue saved progress.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left flex items-center gap-2.5 text-xs text-emerald-800">
                <span className="material-symbols-outlined text-base text-emerald-600 shrink-0" aria-hidden="true">
                  account_circle
                </span>
                <span>
                  Signed in as <strong>{user?.full_name || user?.email}</strong>. You can proceed directly to your registration wizard.
                </span>
              </div>
            )}

            {/* Primary & Secondary Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/ngo/registration-flow"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 shadow-xs transition-all text-xs"
              >
                <span>Start Secure NGO Registration Flow</span>
                <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
              </Link>

              {!isAuthenticatedNgo && (
                <Link
                  to="/register?role=NGO"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all text-xs"
                >
                  <span>Create Village/Sanstha Account First</span>
                </Link>
              )}
            </div>

            {!isAuthenticatedNgo && (
              <div className="pt-2 text-center text-xs text-slate-500">
                Already created an account?{' '}
                <Link
                  to="/login?next=%2Fngo%2Fregistration-flow"
                  className="text-slate-900 font-semibold underline underline-offset-2 hover:text-slate-700"
                >
                  Sign in to continue your saved application
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
