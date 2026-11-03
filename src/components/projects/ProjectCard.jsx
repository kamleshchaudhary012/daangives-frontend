import React from 'react';
import { Link } from 'react-router-dom';
import ProjectStatusBadge from './ProjectStatusBadge';
import {
  PROJECT_CATEGORY_LABELS,
  PROJECT_CATEGORY_ICONS,
} from '../../constants/projects';

/**
 * Format Indian currency.
 */
function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '₹0';
  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * ProjectCard
 * Displays a summary card for a Village/Sanstha project with key metrics.
 */
export default function ProjectCard({ project }) {
  const categoryLabel =
    PROJECT_CATEGORY_LABELS[project.category] || project.category || 'General';
  const categoryIcon = PROJECT_CATEGORY_ICONS[project.category] || 'folder';
  const docCount = project.documents_count ?? (project.documents?.length || 0);
  const milestoneCount =
    project.milestones_count ?? (project.milestones?.length || 0);

  const isEditable =
    project.status === 'DRAFT' || project.status === 'DOCS_PENDING';

  return (
    <div
      className="group relative bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between overflow-hidden"
      data-testid={`project-card-${project.id}`}
    >
      {/* Top Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
              {categoryIcon}
            </span>
            <span className="truncate max-w-[180px]">{categoryLabel}</span>
          </div>
          <ProjectStatusBadge status={project.status} size="sm" />
        </div>

        <Link
          to={`/ngo/projects/${project.id}`}
          className="block group-hover:text-slate-700 transition-colors"
        >
          <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
            {project.title}
          </h3>
        </Link>

        <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
          {project.short_summary || project.description}
        </p>

        {/* Location pill */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
          <span className="material-symbols-outlined text-[16px] text-slate-400" aria-hidden="true">
            location_on
          </span>
          <span className="truncate">
            {project.location_village ? `${project.location_village}, ` : ''}
            {project.location_district}, {project.location_state}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <span className="block text-[10px] uppercase font-semibold text-slate-400">
            Est. Cost
          </span>
          <span className="font-bold text-slate-800 truncate block">
            {formatCurrency(project.estimated_cost)}
          </span>
        </div>
        <div className="border-x border-slate-200">
          <span className="block text-[10px] uppercase font-semibold text-slate-400">
            Timeline
          </span>
          <span className="font-bold text-slate-800">
            {project.timeline_months} mo
          </span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-semibold text-slate-400">
            Beneficiaries
          </span>
          <span className="font-bold text-slate-800">
            {Number(project.beneficiaries_count || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Footer / Card Actions */}
      <div className="px-5 py-3 bg-white flex items-center justify-between gap-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-3 text-slate-500">
          <span
            className="inline-flex items-center gap-1"
            title="Attached statutory documents"
          >
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
              description
            </span>
            {docCount}
          </span>
          <span
            className="inline-flex items-center gap-1"
            title="Project milestones"
          >
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
              flag
            </span>
            {milestoneCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isEditable && (
            <Link
              to={`/ngo/projects/${project.id}/edit`}
              className="px-2.5 py-1.5 font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">edit</span>
              Edit
            </Link>
          )}
          <Link
            to={`/ngo/projects/${project.id}`}
            className="px-3 py-1.5 font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1 border border-slate-200"
          >
            View
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
