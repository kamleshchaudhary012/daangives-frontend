import React from 'react';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_ICONS,
} from '../../constants/projects';

/**
 * ProjectStatusBadge
 * Displays colored badge with status dot/icon for project review lifecycle.
 */
export default function ProjectStatusBadge({ status, showIcon = true, size = 'md' }) {
  const label = PROJECT_STATUS_LABELS[status] || status || 'Unknown';
  const color = PROJECT_STATUS_COLORS[status] || {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  };
  const icon = PROJECT_STATUS_ICONS[status] || 'info';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size] || 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-md border ${color.bg} ${color.text} ${color.border} ${sizeClasses} transition-colors`}
      data-testid="project-status-badge"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
      {showIcon && (
        <span className="material-symbols-outlined text-[13px] leading-none">
          {icon}
        </span>
      )}
      <span>{label}</span>
    </span>
  );
}
