import React, { useState, useEffect } from 'react';
import { getMediaUrl } from '../../services/api';

function getInitials(name) {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AvatarImage({
  src,
  name = '',
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  className = '',
  fallbackIcon = 'person',
  shape = 'circle', // 'circle' | 'rounded'
  objectFit = 'contain', // 'contain' | 'cover'
}) {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = getMediaUrl(src);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  }[size] || 'w-10 h-10 text-sm';

  const shapeClasses = shape === 'rounded' ? 'rounded-2xl' : 'rounded-full';
  const fitClass = objectFit === 'cover' ? 'object-cover' : 'object-contain';
  const initials = getInitials(name);

  if (resolvedUrl && !imgError) {
    return (
      <img
        src={resolvedUrl}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        className={`${sizeClasses} ${shapeClasses} ${fitClass} bg-white border border-outline-variant/60 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} ${shapeClasses} bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/20 shrink-0 select-none ${className}`}
      title={name}
      data-testid="avatar-fallback"
    >
      {initials ? (
        <span>{initials}</span>
      ) : (
        <span className="material-symbols-outlined text-[1.2em]">{fallbackIcon}</span>
      )}
    </div>
  );
}
