import React from 'react';

export default function PageLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 font-outfit text-on-surface">
      <div className="w-10 h-10 border-3 border-primary-fixed border-t-primary rounded-full animate-spin" />
      <p className="text-xs font-semibold text-on-surface-variant">Loading workspace...</p>
    </div>
  );
}
