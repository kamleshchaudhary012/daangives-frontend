import React from 'react';
import {
  GRIEVANCE_STATUS_LABELS,
  GRIEVANCE_STATUS_COLORS,
} from '../../constants/grievances';

/**
 * Status badge with subtle indicator dot.
 * @param {{ status: string, size?: 'sm'|'md', className?: string }} props
 */
export default function StatusBadge({ status, size = 'sm', className = '' }) {
  const label = GRIEVANCE_STATUS_LABELS[status] || status;
  const colors = GRIEVANCE_STATUS_COLORS[status] || GRIEVANCE_STATUS_COLORS.OPEN;

  const sizeClasses = size === 'md'
    ? 'px-2.5 py-1 text-xs gap-1.5'
    : 'px-2 py-0.5 text-[11px] gap-1.5';

  const dotSize = size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5';

  return (
    <span
      role="status"
      aria-label={`Status: ${label}`}
      className={`inline-flex items-center font-medium rounded-md border select-none ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses} ${className}`.trim()}
    >
      <span
        className={`${dotSize} rounded-full shrink-0 ${colors.dot || 'bg-current'}`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}
