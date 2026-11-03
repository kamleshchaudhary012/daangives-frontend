import React from 'react';
import {
  GRIEVANCE_CATEGORY_LABELS,
  GRIEVANCE_CATEGORY_ICONS,
} from '../../constants/grievances';

/**
 * Category label with icon.
 * @param {{ category: string }} props
 */
export default function CategoryLabel({ category }) {
  const label = GRIEVANCE_CATEGORY_LABELS[category] || category;
  const icon = GRIEVANCE_CATEGORY_ICONS[category] || 'help';

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
      <span className="material-symbols-outlined text-xs">{icon}</span>
      {label}
    </span>
  );
}
