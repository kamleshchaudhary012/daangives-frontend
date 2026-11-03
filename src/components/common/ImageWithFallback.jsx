import React, { useState } from 'react';
import { getMediaUrl } from '../../services/api';

export default function ImageWithFallback({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  fallbackIcon = 'volunteer_activism',
  fallbackLabel = '',
  fallbackSubtext = '',
  aspectRatio = 'aspect-video',
}) {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = getMediaUrl(src);

  if (resolvedUrl && !imgError) {
    return (
      <div className={`relative w-full overflow-hidden bg-surface-container-low flex items-center justify-center ${aspectRatio} ${containerClassName}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={resolvedUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover scale-110 blur-xl opacity-60 select-none"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <img
          src={resolvedUrl}
          alt={alt}
          onError={() => setImgError(true)}
          className={`relative z-1 w-full h-full object-contain object-center transition-transform duration-300 ${className}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-full overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-surface-container flex flex-col items-center justify-center p-4 text-center select-none ${aspectRatio} ${containerClassName}`}
    >
      <span className="material-symbols-outlined text-4xl text-primary/50 mb-1">
        {fallbackIcon}
      </span>
      {fallbackLabel && (
        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
          {fallbackLabel}
        </span>
      )}
      {fallbackSubtext && (
        <span className="text-[10px] text-on-surface-variant/70 mt-0.5">
          {fallbackSubtext}
        </span>
      )}
    </div>
  );
}
