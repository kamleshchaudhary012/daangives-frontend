import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import NgoLayout from '../../../layouts/NgoLayout';
import { listNgoCsrRequirements, deleteNgoCsrRequirement } from '../../../services/api';

const SCHEDULE_VII_CATEGORIES = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'ERADICATING_HUNGER', label: 'Hunger & Healthcare' },
  { key: 'PROMOTING_EDUCATION', label: 'Education & Skilling' },
  { key: 'GENDER_EQUALITY', label: 'Gender Equality' },
  { key: 'ENVIRONMENTAL_SUSTAINABILITY', label: 'Environment & Climate' },
  { key: 'NATIONAL_HERITAGE', label: 'Heritage & Art' },
  { key: 'ARMED_FORCES_VETERANS', label: 'Armed Forces Veterans' },
  { key: 'RURAL_SPORTS', label: 'Rural & Para Sports' },
  { key: 'PM_NATIONAL_RELIEF', label: 'PM National Relief' },
  { key: 'TECHNOLOGY_INCUBATORS', label: 'Technology Incubators' },
  { key: 'RURAL_DEVELOPMENT', label: 'Rural Development' },
  { key: 'SLUM_DEVELOPMENT', label: 'Slum Development' },
  { key: 'DISASTER_MANAGEMENT', label: 'Disaster Relief' },
];

const STATUS_TABS = [
  { key: 'ALL', label: 'All Proposals' },
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'PENDING_REVIEW', label: 'Under Review' },
  { key: 'OPEN_FOR_CSR', label: 'Open for CSR' },
  { key: 'PARTNERED', label: 'Partnered' },
  { key: 'IN_EXECUTION', label: 'In Execution' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'REJECTED', label: 'Rejected' },
];

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function getRequirementStatusBadge(status) {
  switch (status) {
    case 'OPEN_FOR_CSR':
      return {
        label: 'Open for Matching',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'storefront',
      };
    case 'PARTNERED':
      return {
        label: 'Partnered / Funded',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: 'handshake',
      };
    case 'IN_EXECUTION':
      return {
        label: 'In Execution',
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
        icon: 'play_circle',
      };
    case 'COMPLETED':
      return {
        label: 'Completed & Verified',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: 'task_alt',
      };
    case 'PENDING_REVIEW':
      return {
        label: 'Pending Moderation',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: 'hourglass_top',
      };
    case 'APPROVED':
      return {
        label: 'Approved by Admin',
        badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        icon: 'verified',
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        icon: 'cancel',
      };
    case 'SUSPENDED':
      return {
        label: 'Suspended',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
        icon: 'warning',
      };
    case 'DRAFT':
    default:
      return {
        label: 'Draft',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: 'edit_note',
      };
  }
}

export default function NgoCsrRequirementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters from URL query params
  const statusFilter = searchParams.get('status') || 'ALL';
  const categoryFilter = searchParams.get('category') || 'ALL';
  const searchFilter = searchParams.get('search') || '';
  const orderingFilter = searchParams.get('ordering') || '-created_at';
  const pageFilter = parseInt(searchParams.get('page') || '1', 10);

  // Local search form state
  const [localSearch, setLocalSearch] = useState(searchFilter);

  // Data states
  const [requirements, setRequirements] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const pageSize = 12;

  // Sync search input with URL
  useEffect(() => {
    setLocalSearch(searchFilter);
  }, [searchFilter]);

  const fetchRequirements = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageFilter,
        ordering: orderingFilter,
      };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (searchFilter.trim()) params.search = searchFilter.trim();

      const res = await listNgoCsrRequirements(params);
      if (Array.isArray(res)) {
        setRequirements(res);
        setTotalCount(res.length);
      } else if (res && Array.isArray(res.results)) {
        setRequirements(res.results);
        setTotalCount(res.count || res.results.length);
      } else {
        setRequirements([]);
        setTotalCount(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load NGO CSR requirements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [statusFilter, categoryFilter, searchFilter, orderingFilter, pageFilter]);

  const updateQuery = (newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const merged = { ...current, ...newParams };
    Object.keys(merged).forEach((k) => {
      if (merged[k] === '' || merged[k] === null || merged[k] === undefined || (k === 'page' && merged[k] === 1)) {
        delete merged[k];
      }
    });
    setSearchParams(merged);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateQuery({ search: localSearch.trim(), page: 1 });
  };

  const handleDeleteSubmit = async () => {
    if (!deleteTarget || deleteTarget.status !== 'DRAFT') return;

    setDeleting(true);
    setDeleteError('');

    try {
      await deleteNgoCsrRequirement(deleteTarget.id);
      setActionSuccess('Draft proposal deleted successfully.');
      setDeleteTarget(null);
      fetchRequirements();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete draft proposal.');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <NgoLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-16">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              My CSR Proposals & Requirements
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Draft statutory Schedule VII proposals, track admin moderation reviews, and manage active marketplace listings.
            </p>
          </div>

          <Link
            to="/ngo/csr/requirements/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-secondary-container transition-all"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Create New Proposal
          </Link>
        </div>

        {/* Global Action Toast */}
        {actionSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs sm:text-sm text-emerald-800 font-semibold flex items-center gap-2.5 shadow-xs">
            <span className="material-symbols-outlined text-emerald-700 text-lg">check_circle</span>
            {actionSuccess}
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-outline-variant/40">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => updateQuery({ status: tab.key, page: 1 })}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === tab.key
                    ? 'bg-secondary text-white shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Category Filter Bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-on-surface-variant text-lg">
                search
              </span>
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search proposals by title or description..."
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-secondary transition-colors"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => updateQuery({ category: e.target.value, page: 1 })}
              className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-secondary font-medium"
            >
              {SCHEDULE_VII_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={orderingFilter}
              onChange={(e) => updateQuery({ ordering: e.target.value, page: 1 })}
              className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-secondary font-medium"
            >
              <option value="-created_at">Newest First</option>
              <option value="required_csr_funding">Funding: Low to High</option>
              <option value="-required_csr_funding">Funding: High to Low</option>
            </select>

            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-secondary-container transition-all"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-surface-container rounded-3xl"></div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-error-container/20 border border-error/30 p-8 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">error_outline</span>
            </div>
            <h3 className="text-base font-bold text-on-surface">Failed to load proposals</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchRequirements}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary-container transition-all"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && requirements.length === 0 && (
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-container text-on-surface-variant flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">post_add</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">No CSR Proposals Found</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              You haven't created any CSR proposals matching this filter. Start drafting a new initiative proposal for corporate matching.
            </p>
            <Link
              to="/ngo/csr/requirements/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-secondary-container transition-all"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Draft New Proposal
            </Link>
          </div>
        )}

        {/* Requirements List */}
        {!loading && !error && requirements.length > 0 && (
          <div className="space-y-4">
            {requirements.map((req) => {
              const statusInfo = getRequirementStatusBadge(req.status);
              const isDraft = req.status === 'DRAFT';

              return (
                <div
                  key={req.id}
                  className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 shadow-xs hover:border-secondary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}>
                        <span className="material-symbols-outlined text-xs">{statusInfo.icon}</span>
                        {statusInfo.label}
                      </span>
                      {req.category_display && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container text-on-surface-variant">
                          {req.category_display}
                        </span>
                      )}
                      <span className="text-[11px] text-on-surface-variant">
                        Created {new Date(req.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-on-surface hover:text-secondary transition-colors">
                        <Link to={`/ngo/csr/requirements/${req.id}/edit`}>{req.title}</Link>
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Location: <strong>{req.district ? `${req.district}, ${req.state}` : req.state || 'Pan-India'}</strong> • Scope: {req.location_scope_display || req.location_scope || 'State'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 text-xs text-on-surface-variant pt-1">
                      <div>
                        Required CSR Capital:{' '}
                        <strong className="text-secondary font-black">
                          {formatCurrency(req.required_csr_funding)}
                        </strong>
                      </div>
                      <div>
                        Total Project Budget:{' '}
                        <strong className="text-on-surface font-bold">
                          {formatCurrency(req.total_estimated_budget)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-outline-variant/30">
                    <Link
                      to={`/ngo/csr/requirements/${req.id}/edit`}
                      className="px-4 py-2 bg-surface-container hover:bg-secondary hover:text-white text-on-surface text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isDraft ? 'edit' : 'visibility'}
                      </span>
                      {isDraft ? 'Edit Proposal' : 'View Proposal'}
                    </Link>

                    {isDraft && (
                      <button
                        onClick={() => {
                          setDeleteTarget(req);
                          setDeleteError('');
                        }}
                        className="px-3 py-2 bg-error-container/20 hover:bg-error hover:text-white text-error text-xs font-bold rounded-xl border border-error/30 transition-all inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-on-surface-variant font-medium">
                  Showing page {pageFilter} of {totalPages} ({totalCount} total proposals)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuery({ page: Math.max(1, pageFilter - 1) })}
                    disabled={pageFilter <= 1}
                    className="px-3.5 py-1.5 bg-surface-container rounded-xl text-xs font-bold text-on-surface disabled:opacity-40 hover:bg-slate-200 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => updateQuery({ page: Math.min(totalPages, pageFilter + 1) })}
                    disabled={pageFilter >= totalPages}
                    className="px-3.5 py-1.5 bg-surface-container rounded-xl text-xs font-bold text-on-surface disabled:opacity-40 hover:bg-slate-200 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">warning</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Delete Draft Proposal?</h3>
                  <p className="text-xs text-on-surface-variant">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                  {deleteError}
                </div>
              )}

              <p className="text-xs text-on-surface-variant leading-relaxed">
                Are you sure you want to permanently delete draft proposal "<strong>{deleteTarget.title}</strong>"?
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="px-4 py-2 bg-surface-container hover:bg-slate-200 text-on-surface text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-error text-white text-xs font-bold rounded-xl shadow-xs hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">
                    {deleting ? 'sync' : 'delete'}
                  </span>
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NgoLayout>
  );
}
