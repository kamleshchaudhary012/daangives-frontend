import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="bg-surface-container-low py-12 border-b border-outline-variant/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <div className="flex items-center gap-2 text-xs text-primary font-semibold">
            <Link to="/" className="hover:underline">Home</Link> / <span>Terms of Service</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface">Terms of Service</h1>
          <p className="text-xs text-on-surface-variant">Last updated: August 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 space-y-6 text-xs text-on-surface-variant leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-on-surface">1. Acceptance of Terms</h2>
            <p>
              By accessing and registering on DaanGives, you agree to comply with all platform governance rules, NITI Aayog Darpan standards, and Income Tax Department Section 80G guidelines.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-on-surface">2. NGO Representative Accounts</h2>
            <p>
              Creating an NGO Representative Account allows authorized personnel to submit registration details. Account registration does not constitute platform verification, 12A/80G validation, or public listing approval.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-on-surface">3. Verification & Compliance</h2>
            <p>
              DaanGives State Administrators reserve the right to audit, request corrections, approve, reject, or suspend NGO profiles based on compliance verification of submitted legal documents and bank account proofs.
            </p>
          </section>

          <div className="pt-4 border-t border-outline-variant/40">
            <Link to="/register" className="text-primary font-bold hover:underline">
              ← Return to Registration
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
