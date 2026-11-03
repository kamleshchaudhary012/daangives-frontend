import React from 'react';
import { Link } from 'react-router-dom';

export default function TrackingEmptyState({
  icon = 'fact_check',
  title = 'No Verified Distribution Proofs Yet',
  description = 'Field distributions are audited and verified by administrators before being published here.',
  actionText = '',
  actionLink = '',
}) {
  return (
    <div className="bg-surface-container-lowest p-8 sm:p-12 rounded-3xl border border-outline-variant/60 text-center space-y-4 shadow-xs">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl mx-auto border border-primary/20">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-lg font-bold text-on-surface">{title}</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">{description}</p>
      </div>

      {actionText && actionLink && (
        <div className="pt-2">
          <Link
            to={actionLink}
            className="inline-block px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs"
          >
            {actionText}
          </Link>
        </div>
      )}
    </div>
  );
}
