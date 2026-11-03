import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CompanyLayout from '../../layouts/CompanyLayout';
import { listCompanyPartnerships } from '../../services/api';
import useProfileGuard from '../../hooks/useProfileGuard';
import ProfileSetupRequired from '../../components/common/ProfileSetupRequired';

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function getPartnershipStatusBadge(status) {
  switch (status) {
    case 'ACTIVE':
    case 'IN_PROGRESS':
      return {
        label: 'Active & Executing',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'play_circle',
      };
    case 'PENDING_MOU':
      return {
        label: 'MoU Pending',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: 'draw',
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: 'task_alt',
      };
    case 'PAUSED':
      return {
        label: 'Paused',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: 'pause_circle',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: 'cancel',
      };
    default:
      return {
        label: status || 'Unknown',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: 'help',
      };
  }
}

export default function CompanyPartnershipsPage() {
  const { status: profileStatus } = useProfileGuard('company');
  const [partnerships, setPartnerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  const fetchPartnerships = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        ordering: '-created_at',
      };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await listCompanyPartnerships(params);
      if (Array.isArray(res)) {
        setPartnerships(res);
        setTotalCount(res.length);
      } else if (res && Array.isArray(res.results)) {
        setPartnerships(res.results);
        setTotalCount(res.count || res.results.length);
      } else {
        setPartnerships([]);
        setTotalCount(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch bilateral CSR partnerships.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileStatus === 'ready') {
      fetchPartnerships();
    } else if (profileStatus === 'missing') {
      setLoading(false);
    }
  }, [profileStatus, statusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPartnerships();
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Aggregate stats across fetched data
  const totalAgreed = partnerships.reduce((acc, p) => acc + (Number(p.agreed_funding_amount) || 0), 0);
  const totalDisbursed = partnerships.reduce((acc, p) => acc + (Number(p.disbursed_amount_reported) || 0), 0);
  const activeCount = partnerships.filter((p) => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS' || p.status === 'PENDING_MOU').length;

  const filterTabs = [
    { key: 'ALL', label: 'All Partnerships' },
    { key: 'PENDING_MOU', label: 'Pending MoU' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  if (profileStatus === 'missing') {
    return (
      <CompanyLayout>
        <div className="max-w-7xl mx-auto py-12">
          <ProfileSetupRequired role="COMPANY" />
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Bilateral CSR Partnerships
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage executed MoUs, milestone progress verifications, off-platform bank transfer records, and project completion dossiers.
            </p>
          </div>

          <Link
            to="/company/marketplace"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-slate-800 transition-all"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">storefront</span>
            Discover New Initiatives
          </Link>
        </div>

        {/* Aggregate Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Partnerships
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Bilateral engagements</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active Engagements
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">MoU or execution phase</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Committed Value
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalAgreed)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Contracted CSR budget</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Disbursed (Reported)
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalDisbursed)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Direct corporate bank wire</div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === tab.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg" aria-hidden="true">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search code, title, or NGO..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:outline-hidden text-slate-900 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition-all"
              >
                Filter
              </button>
            </form>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-56 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl" aria-hidden="true">error_outline</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">Failed to load partnerships</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchPartnerships}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-all"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">refresh</span>
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && partnerships.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl" aria-hidden="true">handshake</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">No Partnerships Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When an NGO accepts your Expression of Interest or an MoU is finalized, bilateral partnership workspaces will appear here for milestone tracking.
            </p>
            <Link
              to="/company/marketplace"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-slate-800 transition-all"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">storefront</span>
              Explore Proposals
            </Link>
          </div>
        )}

        {/* Partnerships Grid */}
        {!loading && !error && partnerships.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {partnerships.map((part) => {
                const statusInfo = getPartnershipStatusBadge(part.status);
                const progress = part.progress_percentage || 0;
                const totalMilestones = part.milestone_count || 0;
                const completedMilestones = part.completed_milestone_count || 0;

                return (
                  <div
                    key={part.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top Code & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                          {part.partnership_code || `CSR-PART-${part.id.slice(0, 8)}`}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}>
                          <span className="material-symbols-outlined text-xs" aria-hidden="true">{statusInfo.icon}</span>
                          {part.status_display || statusInfo.label}
                        </span>
                      </div>

                      {/* Requirement & NGO */}
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 line-clamp-1">
                          {part.requirement_title || 'CSR Initiative Requirement'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Partner NGO: <strong className="text-slate-800 font-semibold">{part.ngo_display_name || part.ngo_legal_name || 'Verified NGO'}</strong>
                        </p>
                      </div>

                      {/* Financials Breakdown */}
                      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Agreed Commitment</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {formatCurrency(part.agreed_funding_amount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Disbursed Reported</span>
                          <span className="font-bold text-emerald-700 text-sm">
                            {formatCurrency(part.disbursed_amount_reported)}
                          </span>
                        </div>
                      </div>

                      {/* Milestone Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Milestone Progress</span>
                          <span className="font-semibold text-slate-900">
                            {completedMilestones}/{totalMilestones} Verified ({progress}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-slate-900 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Started: {part.execution_start_date || 'MoU Execution'}
                      </span>

                      <Link
                        to={`/company/partnerships/${part.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-slate-800 transition-all"
                      >
                        <span>View Dossier</span>
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-slate-500 font-medium">
                  Showing page {page} of {totalPages} ({totalCount} total partnerships)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-200 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-200 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
