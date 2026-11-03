import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NgoLayout from '../../layouts/NgoLayout';
import { getMyProjects } from '../../services/api/projects';
import ProjectCard from '../../components/projects/ProjectCard';
import EmptyProjectsState from '../../components/projects/EmptyProjectsState';
import {
  PROJECT_CATEGORY_OPTIONS,
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
} from '../../constants/projects';

export default function MyProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats state from persisted backend aggregate
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    under_review: 0,
    action_required: 0,
    verified: 0,
    funded: 0,
    completed: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchProjects();
  }, [page, statusFilter, categoryFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await getMyProjects(params);
      setProjects(data.results || []);
      setTotalCount(data.count || 0);
      if (data.stats && typeof data.stats === 'object') {
        setStats(data.stats);
      }
      setHasNext(!!data.next);
      setHasPrevious(!!data.previous);
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const clearFilters = () => {
    setStatusFilter('');
    setCategoryFilter('');
    setSearchQuery('');
    setPage(1);
  };

  const selectStatusCard = (targetStatus) => {
    setStatusFilter((prev) => (prev === targetStatus ? '' : targetStatus));
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(statusFilter) || Boolean(categoryFilter) || Boolean(searchQuery.trim());

  // KPI count mappings
  const displayTotal = stats.total ?? totalCount;
  const displayDraft = stats.draft ?? 0;
  const displaySubmitted = stats.submitted ?? 0;
  const displayUnderReview = stats.under_review ?? 0;
  const displayActionRequired = stats.action_required ?? 0;
  const displayVerified = stats.verified ?? 0;
  const displayFunded = stats.funded ?? 0;
  const displayCompleted = stats.completed ?? 0;

  return (
    <NgoLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="my-projects-page">
        {/* Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 mb-2.5">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">handshake</span>
                CSR Connect Platform
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Village & Community Projects
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
                Post village infrastructure, sanitation, school development, and ecological proposals directly for CSR corporate grant partnerships.
              </p>
            </div>

            <Link
              to="/ngo/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-colors self-start md:self-auto shrink-0"
              data-testid="create-project-btn"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                add_circle
              </span>
              Post New Project
            </Link>
          </div>
        </div>

        {/* Persisted KPI Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          {/* 1. Total */}
          <button
            type="button"
            onClick={() => selectStatusCard('')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === ''
                ? 'bg-slate-100 border-slate-900 ring-1 ring-slate-900 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-[11px] font-medium text-slate-500 block truncate">
              Total Projects
            </span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {displayTotal}
            </div>
          </button>

          {/* 2. Draft */}
          <button
            type="button"
            onClick={() => selectStatusCard('DRAFT')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'DRAFT'
                ? 'bg-slate-100 border-slate-900 ring-1 ring-slate-900 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-[11px] font-medium text-slate-500 block truncate">
              Drafts
            </span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {displayDraft}
            </div>
          </button>

          {/* 3. Submitted */}
          <button
            type="button"
            onClick={() => selectStatusCard('SUBMITTED')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'SUBMITTED'
                ? 'bg-slate-100 border-slate-900 ring-1 ring-slate-900 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-[11px] font-medium text-slate-500 block truncate">
              Submitted
            </span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {displaySubmitted}
            </div>
          </button>

          {/* 4. Under Review */}
          <button
            type="button"
            onClick={() => selectStatusCard('UNDER_REVIEW')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'UNDER_REVIEW'
                ? 'bg-slate-100 border-slate-900 ring-1 ring-slate-900 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-[11px] font-medium text-slate-500 block truncate">
              Under Review
            </span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {displayUnderReview}
            </div>
          </button>

          {/* 5. Action Required */}
          <button
            type="button"
            onClick={() => selectStatusCard('DOCS_PENDING')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'DOCS_PENDING'
                ? 'bg-slate-100 border-slate-900 ring-1 ring-slate-900 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-[11px] font-medium text-slate-500 block truncate">
              Action Req.
            </span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {displayActionRequired}
            </div>
          </button>

          {/* 6. Verified & CSR Ready */}
          <button
            type="button"
            onClick={() => selectStatusCard('VERIFIED')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'VERIFIED'
                ? 'bg-slate-100 border-slate-900 ring-1 ring-slate-900 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-[11px] font-medium text-slate-500 block truncate">
              CSR Ready (Verified)
            </span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {displayVerified}
            </div>
          </button>

          {/* 7. Funded / In Progress */}
          <button
            type="button"
            onClick={() => selectStatusCard('FUNDED_ACTIVE')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'FUNDED_ACTIVE' || statusFilter === 'FUNDED' || statusFilter === 'IN_PROGRESS'
                ? 'bg-slate-100 border-slate-900 ring-1 ring-slate-900 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-[11px] font-medium text-slate-500 block truncate">
              Funded / Active
            </span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {displayFunded}
            </div>
          </button>

          {/* 8. Completed / Closed */}
          <button
            type="button"
            onClick={() => selectStatusCard('COMPLETED_CLOSED')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'COMPLETED_CLOSED' || statusFilter === 'COMPLETED' || statusFilter === 'CLOSED'
                ? 'bg-slate-100 border-slate-900 ring-1 ring-slate-900 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-[11px] font-medium text-slate-500 block truncate">
              Completed
            </span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {displayCompleted}
            </div>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
          >
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" aria-hidden="true">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, village, district..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              >
                <option value="">All Categories</option>
                {PROJECT_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              >
                <option value="">All Statuses</option>
                {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
              >
                Search
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error}</span>
            </div>
            <button
              onClick={fetchProjects}
              className="font-semibold underline hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Projects Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyProjectsState
            hasFilter={hasActiveFilters}
            onResetFilters={clearFilters}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {/* Pagination */}
            {(hasNext || hasPrevious) && (
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200 text-xs">
                <button
                  disabled={!hasPrevious}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 bg-white rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
                  Previous
                </button>
                <span className="text-slate-500 font-medium">Page {page}</span>
                <button
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 bg-white rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-xs"
                >
                  Next
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </NgoLayout>
  );
}
