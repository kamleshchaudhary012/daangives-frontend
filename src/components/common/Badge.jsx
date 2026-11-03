import React from 'react';

export default function Badge({ children, variant = 'info', className = '' }) {
  const variantStyles = {
    urgent: 'bg-red-100 text-red-800 border border-red-200',
    verified: 'bg-blue-100 text-blue-800 border border-blue-200',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    info: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    secondary: 'bg-slate-100 text-slate-700 border border-slate-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyles[variant] || variantStyles.info} ${className}`}>
      {children}
    </span>
  );
}
