import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import NgoLayout from '../../../layouts/NgoLayout';
import {
  listNgoCsrSupportRequests,
  getNgoCsrSupportRequestDetail,
  acceptNgoCsrSupportRequest,
  rejectNgoCsrSupportRequest,
} from '../../../services/api';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Inbound EOIs' },
  { key: 'PENDING_NGO_REVIEW', label: 'Pending Review' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'REJECTED', label: 'Declined' },
  { key: 'WITHDRAWN', label: 'Withdrawn' },
];

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function getRequestStatusBadge(status) {
  switch (status) {
    case 'ACCEPTED':
      return {
        label: 'Accepted',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'check_circle',
      };
    case 'PENDING_NGO_REVIEW':
      return {
        label: 'Pending Review',
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
        label: 'Withdrawn by Company',
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

export default function NgoCsrRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters from URL query params
  const statusFilter = searchParams.get('status') || 'ALL';
  const searchFilter = searchParams.get('search') || '';
  const pageFilter = parseInt(searchParams.get('page') || '1', 10);

  const [localSearch, setLocalSearch] = useState(searchFilter);

  // Data states
  const [requests, setRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Accept Modal
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [acceptNotes, setAcceptNotes] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  // Reject Modal
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState('');

  const [actionSuccess, setActionSuccess] = useState('');

  const pageSize = 12;

  useEffect(() => {
    setLocalSearch(searchFilter);
  }, [searchFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageFilter,
        ordering: '-created_at',
      };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchFilter.trim()) params.search = searchFilter.trim();

      const res = await listNgoCsrSupportRequests(params);
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
      setError(err.message || 'Failed to load inbound corporate support requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, searchFilter, pageFilter]);

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

  const openDetailModal = async (reqId) => {
    setDetailLoading(true);
    try {
      const detail = await getNgoCsrSupportRequestDetail(reqId);
      setSelectedRequest(detail);
    } catch (err) {
      setError(err.message || 'Failed to fetch support request details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAcceptSubmit = async (e) => {
    e.preventDefault();
    if (!acceptTarget || accepting) return;

    setAccepting(true);
    setAcceptError('');

    try {
      await acceptNgoCsrSupportRequest(acceptTarget.id, {
        notes: acceptNotes.trim(),
      });
      setActionSuccess('Corporate EOI accepted! Bilateral CSR Partnership created.');
      setAcceptTarget(null);
      setAcceptNotes('');
      if (selectedRequest && selectedRequest.id === acceptTarget.id) {
        setSelectedRequest(null);
      }
      fetchRequests();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setAcceptError(err.message || 'Failed to accept corporate support request.');
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectTarget || rejecting) return;

    if (!rejectReason.trim()) {
      setRejectError('A mandatory rejection reason must be provided.');
      return;
    }

    setRejecting(true);
    setRejectError('');

    try {
      await rejectNgoCsrSupportRequest(rejectTarget.id, {
        reason: rejectReason.trim(),
      });
      setActionSuccess('Corporate EOI declined.');
      setRejectTarget(null);
      setRejectReason('');
      if (selectedRequest && selectedRequest.id === rejectTarget.id) {
        setSelectedRequest(null);
      }
      fetchRequests();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setRejectError(err.message || 'Failed to decline corporate support request.');
    } finally {
      setRejecting(false);
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
              Inbound Corporate Expressions of Interest
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Review grant commitments and co-funding proposals submitted by corporate CSR committees.
            </p>
          </div>

          <Link
            to="/ngo/csr/partnerships"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container hover:bg-secondary/10 text-secondary text-xs font-bold rounded-xl border border-outline-variant transition-all"
          >
            <span className="material-symbols-outlined text-base">handshake</span>
            View Active Partnerships
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

          {/* Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-on-surface-variant text-lg">
                search
              </span>
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search by company name, SPOC representative, or proposal title..."
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-secondary transition-colors"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-secondary-container transition-all"
            >
              Search
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
            <h3 className="text-base font-bold text-on-surface">Failed to load support requests</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchRequests}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary-container transition-all"
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
              <span className="material-symbols-outlined text-3xl">inbox</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">No Inbound Corporate Interest Yet</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              When corporate CSR committees discover your requirements on the CSR Marketplace and submit Expressions of Interest, they will appear here for review.
            </p>
            <Link
              to="/ngo/csr/requirements"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-secondary-container transition-all"
            >
              <span className="material-symbols-outlined text-base">visibility</span>
              View My CSR Proposals
            </Link>
          </div>
        )}

        {/* Requests List */}
        {!loading && !error && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((req) => {
              const statusInfo = getRequestStatusBadge(req.status);
              const isPending = req.status === 'PENDING_NGO_REVIEW';

              return (
                <div
                  key={req.id}
                  className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 shadow-xs hover:border-secondary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}>
                        <span className="material-symbols-outlined text-xs">{statusInfo.icon}</span>
                        {req.status_display || statusInfo.label}
                      </span>
                      {req.support_type_display && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container text-on-surface-variant">
                          {req.support_type_display}
                        </span>
                      )}
                      <span className="text-[11px] text-on-surface-variant">
                        Received {new Date(req.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-on-surface">
                        Proposal: <span className="text-secondary">{req.requirement_title || 'CSR Proposal'}</span>
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-2">
                        <span>Corporate Entity: <strong className="text-on-surface">{req.company_name || req.company_name_snapshot || 'Corporate Partner'}</strong></span>
                        {req.spoc_name && <span>• SPOC: {req.spoc_name}</span>}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant pt-1">
                      <div>
                        Proposed Capital Commitment:{' '}
                        <strong className="text-secondary font-black">
                          {formatCurrency(req.proposed_funding)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-outline-variant/30">
                    <button
                      onClick={() => openDetailModal(req.id)}
                      className="px-4 py-2 bg-surface-container hover:bg-secondary hover:text-white text-on-surface text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      View Dossier
                    </button>

                    {isPending && (
                      <>
                        <button
                          onClick={() => {
                            setAcceptTarget(req);
                            setAcceptNotes('');
                            setAcceptError('');
                          }}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          Accept
                        </button>
                        <button
                          onClick={() => {
                            setRejectTarget(req);
                            setRejectReason('');
                            setRejectError('');
                          }}
                          className="px-3 py-2 bg-error-container/20 hover:bg-error hover:text-white text-error text-xs font-bold rounded-xl border border-error/30 transition-all inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-on-surface-variant font-medium">
                  Showing page {pageFilter} of {totalPages} ({totalCount} total inquiries)
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

        {/* Full Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl animate-scaleUp">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/40">
                <div>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Corporate EOI Dossier
                  </span>
                  <h2 className="text-xl font-bold text-on-surface mt-0.5">
                    {selectedRequest.company_name || selectedRequest.company_name_snapshot || 'Corporate Partner'}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="w-8 h-8 rounded-full bg-surface-container text-on-surface hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Status & Funding Strip */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
                <div>
                  <span className="text-xs font-medium text-on-surface-variant block">Status</span>
                  <span className="text-sm font-bold text-on-surface">
                    {selectedRequest.status_display || selectedRequest.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-on-surface-variant block">Proposed Grant Funding</span>
                  <span className="text-lg font-black text-secondary">
                    {formatCurrency(selectedRequest.proposed_funding)}
                  </span>
                </div>
              </div>

              {/* Target Requirement & SPOC Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-surface-container-low rounded-2xl space-y-1">
                  <span className="font-bold text-on-surface-variant block">Target CSR Proposal</span>
                  <div className="font-bold text-on-surface text-sm">{selectedRequest.requirement_title}</div>
                  <div className="text-on-surface-variant">{selectedRequest.requirement_category?.replace(/_/g, ' ')}</div>
                </div>

                <div className="p-3.5 bg-surface-container-low rounded-2xl space-y-1">
                  <span className="font-bold text-on-surface-variant block">Corporate SPOC Liaison</span>
                  <div className="font-bold text-on-surface text-sm">{selectedRequest.spoc_name}</div>
                  <div className="text-on-surface-variant">
                    {selectedRequest.spoc_email} • {selectedRequest.spoc_phone}
                  </div>
                </div>
              </div>

              {/* Expression of Interest Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface block">Corporate Message & Terms</label>
                <div className="p-4 bg-surface-container-low rounded-2xl text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                  {selectedRequest.message || 'No additional note provided.'}
                </div>
              </div>

              {/* Rejection / Withdrawal Reason */}
              {selectedRequest.rejection_reason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-1">
                  <strong className="block font-bold">Decline Reason:</strong>
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
                  Close
                </button>

                {selectedRequest.status === 'PENDING_NGO_REVIEW' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRejectTarget(selectedRequest);
                        setRejectReason('');
                        setRejectError('');
                      }}
                      className="px-4 py-2 bg-error-container/20 hover:bg-error hover:text-white text-error text-xs font-bold rounded-xl border border-error/30 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => {
                        setAcceptTarget(selectedRequest);
                        setAcceptNotes('');
                        setAcceptError('');
                      }}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    >
                      Accept EOI
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Accept Confirmation Modal */}
        {acceptTarget && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">handshake</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Accept Expression of Interest?</h3>
                  <p className="text-xs text-on-surface-variant">
                    This will initialize a bilateral CSR Partnership with {acceptTarget.company_name || 'Corporate Partner'}.
                  </p>
                </div>
              </div>

              {acceptError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                  {acceptError}
                </div>
              )}

              <form onSubmit={handleAcceptSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Acceptance Remarks / Alignment Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={acceptNotes}
                    onChange={(e) => setAcceptNotes(e.target.value)}
                    placeholder="Provide onboarding notes or next steps for MoU drafting..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-outline-variant bg-surface-container-low focus:border-secondary transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => setAcceptTarget(null)}
                    disabled={accepting}
                    className="px-4 py-2 bg-surface-container hover:bg-slate-200 text-on-surface text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={accepting}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {accepting ? 'sync' : 'check'}
                    </span>
                    {accepting ? 'Accepting...' : 'Confirm & Create Partnership'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectTarget && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">cancel</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Decline Support Request?</h3>
                  <p className="text-xs text-on-surface-variant">
                    The company will be notified of your decision and provided with your feedback.
                  </p>
                </div>
              </div>

              {rejectError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                  {rejectError}
                </div>
              )}

              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Reason for Declining <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please specify why this corporate support request cannot be accommodated (e.g. project fully funded, scope mismatch)..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-outline-variant bg-surface-container-low focus:border-error focus:ring-error transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => setRejectTarget(null)}
                    disabled={rejecting}
                    className="px-4 py-2 bg-surface-container hover:bg-slate-200 text-on-surface text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rejecting || !rejectReason.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-error text-white text-xs font-bold rounded-xl shadow-xs hover:bg-red-700 disabled:opacity-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {rejecting ? 'sync' : 'close'}
                    </span>
                    {rejecting ? 'Declining...' : 'Confirm Decline'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </NgoLayout>
  );
}
