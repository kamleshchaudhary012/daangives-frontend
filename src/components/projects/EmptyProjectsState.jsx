import React from 'react';
import { Link } from 'react-router-dom';

/**
 * EmptyProjectsState
 * Illustrated empty state when village/NGO has not posted any projects or when filters return nothing.
 */
export default function EmptyProjectsState({ hasFilter = false, onResetFilters }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 my-6 shadow-sm">
      <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-50/50 dark:ring-emerald-950/20">
        <span className="material-symbols-outlined text-3xl">
          {hasFilter ? 'filter_alt_off' : 'add_location_alt'}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        {hasFilter ? 'No matching projects found' : 'No village projects posted yet'}
      </h3>

      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
        {hasFilter
          ? 'Try adjusting your search criteria or clear your active filters to see all your posted projects.'
          : 'Post your village or community development project to connect directly with CSR donors and corporates for targeted funding.'}
      </p>

      {hasFilter ? (
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-all border border-emerald-200 dark:border-emerald-800"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Clear All Filters
        </button>
      ) : (
        <Link
          to="/ngo/projects/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          Post Your First Project
        </Link>
      )}
    </div>
  );
}
