import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CompanyLayout from '../../layouts/CompanyLayout';
import {
  listCompanySupportRequests,
  getCompanySupportRequestDetail,
  withdrawSupportRequest,
} from '../../services/api';
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

function getStatusBadge(status) {
  switch (status) {
    case 'ACCEPTED':
      return {
        label: 'Accepted',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'check_circle',
      };
    case 'PENDING_NGO_REVIEW':
      return {
        label: 'Pending NGO Review',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: 'hourglass_top',
      };
    case 'REJECTED':
      return {
        label: 'Declined',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        icon: 'cancel',
      };
    case 'WITHDRAWN':
      return {
        label: 'Withdrawn',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: 'undo',
      };
    default:
      return {
        label: status || 'Unknown',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: 'help',
      };
  }
}

export default function CompanyRequestsPage() {
  const { status: profileStatus } = useProfileGuard('company');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  // Detail Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Withdraw Modal
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchRequests = async () => {
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

      const res = await listCompanySupportRequests(params);
      if (Array.isArray(res)) {
        setRequests(res);
        setTotalCount(res.length);
      } else if (res && Array.isArray(res.results)) {
        setRequests(res.results);
        setTotalCount(res.count || res.results.length);
      } else {
        setRequests([]);
        setTotalCount(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load corporate support requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileStatus === 'ready') {
      fetchRequests();
    } else if (profileStatus === 'missing') {
      setLoading(false);
    }
  }, [profileStatus, statusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  const openDetailModal = async (reqId) => {
    setDetailLoading(true);
    try {
      const detail = await getCompanySupportRequestDetail(reqId);
      setSelectedRequest(detail);
    } catch (err) {
      setError(err.message || 'Failed to fetch request details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawReason.trim()) {
      setWithdrawError('Withdrawal reason is mandatory.');
      return;
    }

    setWithdrawing(true);
    setWithdrawError('');

    try {
      await withdrawSupportRequest(withdrawTarget.id, {
        action: 'WITHDRAW',
        reason: withdrawReason.trim(),
      });
      setActionSuccess('Support request withdrawn successfully.');
      setWithdrawTarget(null);
      setWithdrawReason('');
      if (selectedRequest && selectedRequest.id === withdrawTarget.id) {
        setSelectedRequest(null);
      }
      fetchRequests();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setWithdrawError(err.message || 'Failed to withdraw support request.');
    } finally {
      setWithdrawing(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const filterTabs = [
    { key: 'ALL', label: 'All EOIs' },
    { key: 'PENDING_NGO_REVIEW', label: 'Pending Review' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'REJECTED', label: 'Declined' },
    { key: 'WITHDRAWN', label: 'Withdrawn' },
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Expressions of Interest (EOI Outbox)
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Track corporate support requests, proposed capital commitments, NGO review statuses, and bilateral negotiation milestones.
            </p>
          </div>

          <Link
            to="/company/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-base">storefront</span>
            Browse CSR Marketplace
          </Link>
        </div>

        {/* Global Action Success Toast */}
        {actionSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs sm:text-sm text-emerald-800 font-semibold flex items-center gap-2.5 shadow-xs">
            <span className="material-symbols-outlined text-emerald-700 text-lg">check_circle</span>
            {actionSuccess}
          </div>
        )}

        {/* Search & Status Filter Controls */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === tab.key
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search requirement or NGO..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-surface-container hover:bg-primary hover:text-white text-on-surface text-xs font-bold rounded-xl transition-all"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-surface-container rounded-2xl"></div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-error-container/20 border border-error/30 p-8 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">error_outline</span>
            </div>
            <h3 className="text-base font-bold text-on-surface">Failed to load support requests</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchRequests}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container transition-all"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && requests.length === 0 && (
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-container text-on-surface-variant flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">mark_email_unread</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">No Expressions of Interest Found</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              You haven't submitted any corporate support requests matching this filter. Explore verified NGO requirements on the marketplace to express interest.
            </p>
            <Link
              to="/company/marketplace"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-container transition-all"
            >
              <span className="material-symbols-outlined text-base">storefront</span>
              Explore CSR Marketplace
            </Link>
          </div>
        )}

        {/* Requests List */}
        {!loading && !error && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((req) => {
              const statusInfo = getStatusBadge(req.status);
              return (
                <div
                  key={req.id}
                  className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}>
                        <span className="material-symbols-outlined text-xs">{statusInfo.icon}</span>
                        {req.status_display || statusInfo.label}
                      </span>
                      {req.requirement_category && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container text-on-surface-variant">
                          {req.requirement_category.replace(/_/g, ' ')}
                        </span>
                      )}
                      <span className="text-[11px] text-on-surface-variant">
                        Submitted on{' '}
                        {new Date(req.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-on-surface hover:text-primary transition-colors">
                        {req.requirement_title || 'CSR Initiative Requirement'}
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-2">
                        <span className="font-semibold text-on-surface">
                          {req.ngo_display_name || req.ngo_legal_name || 'Verified NGO'}
                        </span>
                        {req.support_type_display && (
                          <>
                            <span>•</span>
                            <span className="text-primary font-medium">{req.support_type_display}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant pt-1">
                      <div>
                        Proposed Capital:{' '}
                        <strong className="text-on-surface font-black">
                          {formatCurrency(req.proposed_funding)}
                        </strong>
                      </div>
                      {req.spoc_name && (
                        <div>
                          SPOC: <strong className="text-on-surface">{req.spoc_name}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-outline-variant/30">
                    <button
                      onClick={() => openDetailModal(req.id)}
                      className="px-3.5 py-2 bg-surface-container hover:bg-primary hover:text-white text-on-surface text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      View Details
                    </button>

                    {req.status === 'PENDING_NGO_REVIEW' && (
                      <button
                        onClick={() => {
                          setWithdrawTarget(req);
                          setWithdrawReason('');
                          setWithdrawError('');
                        }}
                        className="px-3.5 py-2 bg-error-container/20 hover:bg-error hover:text-white text-error text-xs font-bold rounded-xl border border-error/30 transition-all inline-flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">undo</span>
                        Withdraw
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
                  Showing page {page} of {totalPages} ({totalCount} total requests)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 bg-surface-container rounded-xl text-xs font-bold text-on-surface disabled:opacity-40 hover:bg-slate-200 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 bg-surface-container rounded-xl text-xs font-bold text-on-surface disabled:opacity-40 hover:bg-slate-200 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/40">
                <div>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Support Request Dossier
                  </span>
                  <h2 className="text-xl font-bold text-on-surface mt-0.5">
                    {selectedRequest.requirement_title || 'CSR Initiative'}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="w-8 h-8 rounded-full bg-surface-container text-on-surface hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Status Banner */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
                <div>
                  <span className="text-xs font-medium text-on-surface-variant block">Current Status</span>
                  <span className="text-sm font-bold text-on-surface">
                    {selectedRequest.status_display || selectedRequest.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-on-surface-variant block">Proposed Funding</span>
                  <span className="text-base font-black text-primary">
                    {formatCurrency(selectedRequest.proposed_funding)}
                  </span>
                </div>
              </div>

              {/* NGO & Corporate Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-surface-container-low rounded-xl space-y-1">
                  <span className="font-bold text-on-surface-variant block">NGO Partner</span>
                  <div className="font-bold text-on-surface text-sm">
                    {selectedRequest.ngo_display_name || selectedRequest.ngo_legal_name}
                  </div>
                  <div className="text-on-surface-variant">{selectedRequest.ngo_legal_name}</div>
                </div>

                <div className="p-3.5 bg-surface-container-low rounded-xl space-y-1">
                  <span className="font-bold text-on-surface-variant block">Corporate SPOC Liaison</span>
                  <div className="font-bold text-on-surface text-sm">{selectedRequest.spoc_name}</div>
                  <div className="text-on-surface-variant">
                    {selectedRequest.spoc_email} • {selectedRequest.spoc_phone}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface block">Expression of Interest Note</label>
                <div className="p-4 bg-surface-container-low rounded-2xl text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                  {selectedRequest.message || 'No additional note provided.'}
                </div>
              </div>

              {/* Rejection / Withdrawal Reason */}
              {selectedRequest.rejection_reason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-1">
                  <strong className="block font-bold">NGO Decline Reason:</strong>
                  <p>{selectedRequest.rejection_reason}</p>
                </div>
              )}

              {selectedRequest.withdrawal_reason && (
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-800 space-y-1">
                  <strong className="block font-bold">Corporate Withdrawal Reason:</strong>
                  <p>{selectedRequest.withdrawal_reason}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/40">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-surface-container hover:bg-slate-200 text-on-surface text-xs font-bold rounded-xl transition-colors"
                >
                  Close Dossier
                </button>

                {selectedRequest.status === 'PENDING_NGO_REVIEW' && (
                  <button
                    onClick={() => {
                      setWithdrawTarget(selectedRequest);
                      setWithdrawReason('');
                      setWithdrawError('');
                    }}
                    className="px-4 py-2 bg-error hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    Withdraw Request
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Confirmation Modal */}
        {withdrawTarget && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">warning</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Withdraw Support Request?</h3>
                  <p className="text-xs text-on-surface-variant">
                    This will cancel your EOI for "{withdrawTarget.requirement_title}".
                  </p>
                </div>
              </div>

              {withdrawError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                  {withdrawError}
                </div>
              )}

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Reason for Withdrawal <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    placeholder="Please specify why your corporation is withdrawing this EOI (e.g. CSR budget reallocated, internal timeline shifts)..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-outline-variant bg-surface-container-low focus:border-error focus:ring-error transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawTarget(null);
                      setWithdrawReason('');
                    }}
                    disabled={withdrawing}
                    className="px-4 py-2 bg-surface-container hover:bg-slate-200 text-on-surface text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawing || !withdrawReason.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-error text-white text-xs font-bold rounded-xl shadow-xs hover:bg-red-700 disabled:opacity-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {withdrawing ? 'sync' : 'undo'}
                    </span>
                    {withdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
