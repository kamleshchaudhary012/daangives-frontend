import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="bg-surface-container-low py-12 border-b border-outline-variant/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <div className="flex items-center gap-2 text-xs text-primary font-semibold">
            <Link to="/" className="hover:underline">Home</Link> / <span>Privacy Policy</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface">Privacy Policy</h1>
          <p className="text-xs text-on-surface-variant">Last updated: August 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 space-y-6 text-xs text-on-surface-variant leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-on-surface">1. Data Privacy & Confidentiality</h2>
            <p>
              DaanGives protects user data and non-profit documentation. Unmasked bank account details, trust deeds, and internal inspection records are restricted strictly to authorized State Administrators for verification audits.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-on-surface">2. Public Information Exposure</h2>
            <p>
              Only state-approved public profile information (such as legal display name, category, mission statement, website, service areas, and 12A/80G status badges) is exposed on the public directory.
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
