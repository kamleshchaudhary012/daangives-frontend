import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';

export default function NotFoundPage() {
  return (
    <PublicLayout>
      <div className="py-20 bg-surface-container-low min-h-[calc(100vh-160px)] flex items-center justify-center">
        <div className="max-w-md w-full mx-4 bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center text-3xl mx-auto font-bold">
            404
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Page Not Found</h1>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-block px-6 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-container transition-all shadow-xs"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
