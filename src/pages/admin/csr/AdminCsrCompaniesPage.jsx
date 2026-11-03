import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  listAdminCsrCompanies,
  getAdminCsrCompanyDetail,
  approveAdminCsrCompany,
  rejectAdminCsrCompany,
  suspendAdminCsrCompany,
  requestCorrectionAdminCsrCompany,
  recordAdminCsrCompanyGovCheck,
  getAdminCsrAnalytics,
} from '../../../services/api';

const STATUS_TABS = [
  { key: 'PENDING_VERIFICATION', label: 'Pending Verification' },
  { key: 'CORRECTION_REQUIRED', label: 'Correction Required' },
  { key: 'ALL', label: 'All Companies' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'DRAFT', label: 'Drafts' },
];

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function getCompanyStatusBadge(status) {
  switch (status) {
    case 'APPROVED':
      return {
        label: 'Approved & Verified',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'verified',
      };
    case 'PENDING_VERIFICATION':
      return {
        label: 'Pending Verification',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: 'hourglass_top',
      };
    case 'CORRECTION_REQUIRED':
      return {
        label: 'Correction Required',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
        icon: 'assignment_late',
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
        icon: 'block',
      };
    case 'DRAFT':
    default:
      return {
        label: 'Draft Profile',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: 'edit_note',
      };
  }
}

function getGovCheckBadge(status) {
  switch (status) {
    case 'VERIFIED':
      return {
        label: 'Gov Check: Verified',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'verified',
      };
    case 'FAILED':
      return {
        label: 'Gov Check: Failed',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        icon: 'gavel',
      };
    case 'MANUAL_VERIFICATION_REQUIRED':
      return {
        label: 'Gov Check: Manual Review Needed',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: 'find_in_page',
      };
    case 'PENDING':
      return {
        label: 'Gov Check: Pending',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: 'sync',
      };
    case 'NOT_STARTED':
    default:
      return {
        label: 'Gov Check: Not Started',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        icon: 'schedule',
      };
  }
}

export default function AdminCsrCompaniesPage() {
  const { id: routeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get('status') || 'PENDING_VERIFICATION';
  const searchFilter = searchParams.get('search') || '';
  const orderingFilter = searchParams.get('ordering') || '-created_at';
  const pageFilter = parseInt(searchParams.get('page') || '1', 10);

  const [localSearch, setLocalSearch] = useState(searchFilter);
  const [companies, setCompanies] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);

  // Inspection Drawer / Modal State
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Action Modals
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState('');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState('');

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspending, setSuspending] = useState(false);
  const [suspendError, setSuspendError] = useState('');

  // Correction Modal
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionInstructions, setCorrectionInstructions] = useState('');
  const [correctionAdminNotes, setCorrectionAdminNotes] = useState('');
  const [requestingCorrection, setRequestingCorrection] = useState(false);
  const [correctionError, setCorrectionError] = useState('');

  // Gov Check Modal
  const [govCheckModalOpen, setGovCheckModalOpen] = useState(false);
  const [govCheckOutcome, setGovCheckOutcome] = useState('VERIFIED');
  const [govCheckSource, setGovCheckSource] = useState('MCA MCA21 Registry');
  const [govCheckNotes, setGovCheckNotes] = useState('');
  const [recordingGovCheck, setRecordingGovCheck] = useState(false);
  const [govCheckError, setGovCheckError] = useState('');

  const [actionSuccess, setActionSuccess] = useState('');

  const pageSize = 12;

  useEffect(() => {
    setLocalSearch(searchFilter);
  }, [searchFilter]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageFilter,
        ordering: orderingFilter,
      };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchFilter.trim()) params.search = searchFilter.trim();

      const res = await listAdminCsrCompanies(params);
      if (Array.isArray(res)) {
        setCompanies(res);
        setTotalCount(res.length);
      } else if (res && Array.isArray(res.results)) {
        setCompanies(res.results);
        setTotalCount(res.count || res.results.length);
      } else {
        setCompanies([]);
        setTotalCount(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load corporate verification queue.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await getAdminCsrAnalytics();
      setAnalytics(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [statusFilter, searchFilter, orderingFilter, pageFilter]);

  // If routeId is present, auto-inspect
  useEffect(() => {
    if (routeId) {
      inspectCompany(routeId);
    }
  }, [routeId]);

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

  const inspectCompany = async (companyId) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const detail = await getAdminCsrCompanyDetail(companyId);
      setSelectedCompany(detail);
    } catch (err) {
      setDetailError(err.message || 'Failed to load company dossier.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle Approve
  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany || approving) return;

    setApproving(true);
    setApproveError('');

    try {
      const updated = await approveAdminCsrCompany(selectedCompany.id, {
        notes: approveNotes.trim(),
      });
      setActionSuccess(`Corporate profile for "${updated.company_name}" approved successfully.`);
      setSelectedCompany(updated);
      setApproveModalOpen(false);
      setApproveNotes('');
      fetchCompanies();
      fetchAnalytics();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setApproveError(err.message || 'Failed to approve corporate profile.');
    } finally {
      setApproving(false);
    }
  };

  // Handle Reject
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany || rejecting) return;

    if (!rejectReason.trim()) {
      setRejectError('A mandatory rejection reason must be provided.');
      return;
    }

    setRejecting(true);
    setRejectError('');

    try {
      const updated = await rejectAdminCsrCompany(selectedCompany.id, {
        reason: rejectReason.trim(),
      });
      setActionSuccess(`Corporate profile for "${updated.company_name}" rejected.`);
      setSelectedCompany(updated);
      setRejectModalOpen(false);
      setRejectReason('');
      fetchCompanies();
      fetchAnalytics();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setRejectError(err.message || 'Failed to reject corporate profile.');
    } finally {
      setRejecting(false);
    }
  };

  // Handle Suspend
  const handleSuspendSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany || suspending) return;

    if (!suspendReason.trim()) {
      setSuspendError('A mandatory suspension reason must be provided.');
      return;
    }

    setSuspending(true);
    setSuspendError('');

    try {
      const updated = await suspendAdminCsrCompany(selectedCompany.id, {
        reason: suspendReason.trim(),
      });
      setActionSuccess(`Corporate profile for "${updated.company_name}" suspended.`);
      setSelectedCompany(updated);
      setSuspendModalOpen(false);
      setSuspendReason('');
      fetchCompanies();
      fetchAnalytics();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setSuspendError(err.message || 'Failed to suspend corporate profile.');
    } finally {
      setSuspending(false);
    }
  };

  // Handle Request Correction
  const handleRequestCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany || requestingCorrection) return;

    if (!correctionInstructions.trim()) {
      setCorrectionError('Mandatory correction instructions must be specified for the corporate user.');
      return;
    }

    setRequestingCorrection(true);
    setCorrectionError('');

    try {
      const updated = await requestCorrectionAdminCsrCompany(selectedCompany.id, {
        correction_instructions: correctionInstructions.trim(),
        admin_notes: correctionAdminNotes.trim(),
      });
      setActionSuccess(`Correction request dispatched to "${updated.company_name}".`);
      setSelectedCompany(updated);
      setCorrectionModalOpen(false);
      setCorrectionInstructions('');
      setCorrectionAdminNotes('');
      fetchCompanies();
      fetchAnalytics();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setCorrectionError(err.message || 'Failed to request corrections from company.');
    } finally {
      setRequestingCorrection(false);
    }
  };

  // Handle Record Gov Check
  const handleRecordGovCheckSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany || recordingGovCheck) return;

    setRecordingGovCheck(true);
    setGovCheckError('');

    try {
      const updated = await recordAdminCsrCompanyGovCheck(selectedCompany.id, {
        outcome: govCheckOutcome,
        source: govCheckSource.trim(),
        notes: govCheckNotes.trim(),
      });
      setActionSuccess(`Government verification outcome recorded for "${updated.company_name}".`);
      setSelectedCompany(updated);
      setGovCheckModalOpen(false);
      setGovCheckNotes('');
      fetchCompanies();
      fetchAnalytics();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setGovCheckError(err.message || 'Failed to record government verification check.');
    } finally {
      setRecordingGovCheck(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // KPI calculations
  const pendingCount = analytics ? analytics.pending_companies : companies.filter((c) => c.verification_status === 'PENDING_VERIFICATION').length;
  const approvedCount = analytics ? analytics.approved_companies : companies.filter((c) => c.verification_status === 'APPROVED').length;
  const rejectedCount = analytics ? analytics.rejected_companies : companies.filter((c) => c.verification_status === 'REJECTED').length;
  const suspendedCount = analytics ? analytics.suspended_companies : companies.filter((c) => c.verification_status === 'SUSPENDED').length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Corporate Governance Queue
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Corporate CSR Verification Queue
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Verify MCA CIN, Income Tax PAN, and statutory Section 135 budgets to authorize corporate CSR matching.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/csr/requirements"
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-all"
            >
              Proposal Queue →
            </Link>
            <Link
              to="/admin/csr/oversight"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              Portfolio Oversight →
            </Link>
          </div>
        </div>

        {/* Global Toast */}
        {actionSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs sm:text-sm text-emerald-800 font-semibold flex items-center gap-2.5 shadow-xs">
            <span className="material-symbols-outlined text-emerald-700 text-lg">check_circle</span>
            {actionSuccess}
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pending Verification
            </span>
            <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
            <div className="text-[10px] text-slate-500">Requires review</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Approved Corporates
            </span>
            <div className="text-2xl font-black text-emerald-600">{approvedCount}</div>
            <div className="text-[10px] text-slate-500">Active marketplace access</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Rejected Profiles
            </span>
            <div className="text-2xl font-black text-red-600">{rejectedCount}</div>
            <div className="text-[10px] text-slate-500">Failed verification</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Suspended
            </span>
            <div className="text-2xl font-black text-orange-600">{suspendedCount}</div>
            <div className="text-[10px] text-slate-500">Temporarily locked</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => updateQuery({ status: tab.key, page: 1 })}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === tab.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search by company name, legal name, CIN, or contact email..."
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 transition-colors"
              />
            </div>

            <select
              value={orderingFilter}
              onChange={(e) => updateQuery({ ordering: e.target.value, page: 1 })}
              className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="-created_at">Newest Registered</option>
              <option value="company_name">Company Name (A–Z)</option>
              <option value="-annual_csr_budget">CSR Budget: High to Low</option>
            </select>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-all"
            >
              Search
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl"></div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">error_outline</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Failed to load company queue</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchCompanies}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && companies.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">domain_disabled</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Corporate Profiles Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No corporate entities match the current status and search filters.
            </p>
          </div>
        )}

        {/* Companies List Table / Cards */}
        {!loading && !error && companies.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Company & Legal Identity</th>
                    <th className="px-4 py-3.5">CIN / PAN</th>
                    <th className="px-4 py-3.5">Contact Person</th>
                    <th className="px-4 py-3.5">Annual CSR Budget</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.map((c) => {
                    const statusInfo = getCompanyStatusBadge(c.verification_status);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 text-sm">{c.company_name}</div>
                          <div className="text-slate-500 text-[11px]">{c.legal_name || '—'}</div>
                        </td>
                        <td className="px-4 py-4 font-mono text-[11px]">
                          <div className="text-slate-700 font-semibold">{c.cin_number || '—'}</div>
                          <div className="text-slate-500">{c.pan_number || '—'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-800">{c.contact_person_name || '—'}</div>
                          <div className="text-slate-500 text-[11px]">{c.contact_email}</div>
                        </td>
                        <td className="px-4 py-4 font-black text-slate-800">
                          {formatCurrency(c.annual_csr_budget)}
                        </td>
                        <td className="px-4 py-4 space-y-1">
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.badgeClass}`}>
                              <span className="material-symbols-outlined text-xs">{statusInfo.icon}</span>
                              {c.verification_status_display || statusInfo.label}
                            </span>
                          </div>
                          {c.gov_check_status && (
                            <div>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${getGovCheckBadge(c.gov_check_status).badgeClass}`}>
                                <span className="material-symbols-outlined text-[11px]">{getGovCheckBadge(c.gov_check_status).icon}</span>
                                {getGovCheckBadge(c.gov_check_status).label}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => inspectCompany(c.id)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing page {pageFilter} of {totalPages} ({totalCount} companies)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuery({ page: Math.max(1, pageFilter - 1) })}
                    disabled={pageFilter <= 1}
                    className="px-3.5 py-1.5 bg-slate-100 rounded-xl font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-200 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => updateQuery({ page: Math.min(totalPages, pageFilter + 1) })}
                    disabled={pageFilter >= totalPages}
                    className="px-3.5 py-1.5 bg-slate-100 rounded-xl font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-200 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* INSPECTION DOSSIER MODAL */}
        {/* ------------------------------------------------------------------- */}
        {selectedCompany && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedCompany(null);
            }}
          >
            <div
              className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dossier-modal-title"
            >
              {/* Modal Header - Pinned at top */}
              <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Corporate Verification Dossier
                  </span>
                  <h2 id="dossier-modal-title" className="text-xl font-bold text-slate-900 mt-0.5 truncate max-w-lg">
                    {selectedCompany.company_name}
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Close dossier"
                  onClick={() => setSelectedCompany(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
                {/* Status Bar */}
                <div className="p-4 bg-slate-50 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Verification Status</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold mt-0.5 ${
                      getCompanyStatusBadge(selectedCompany.verification_status).badgeClass
                    } px-2.5 py-0.5 rounded-full border`}>
                      <span className="material-symbols-outlined text-xs">
                        {getCompanyStatusBadge(selectedCompany.verification_status).icon}
                      </span>
                      {selectedCompany.verification_status_display || selectedCompany.verification_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Government Check</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold mt-0.5 ${
                      getGovCheckBadge(selectedCompany.gov_check_status).badgeClass
                    } px-2.5 py-0.5 rounded-full border`}>
                      <span className="material-symbols-outlined text-xs">
                        {getGovCheckBadge(selectedCompany.gov_check_status).icon}
                      </span>
                      {getGovCheckBadge(selectedCompany.gov_check_status).label}
                    </span>
                    {selectedCompany.gov_check_source && (
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Source: {selectedCompany.gov_check_source}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Annual CSR Budget</span>
                    <span className="text-lg font-black text-slate-900">
                      {formatCurrency(selectedCompany.annual_csr_budget)}
                    </span>
                  </div>
                </div>

                {/* Correction Instructions Banner (if CORRECTION_REQUIRED) */}
                {selectedCompany.correction_instructions && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-orange-800">
                      <span className="material-symbols-outlined text-sm">assignment_late</span>
                      Outstanding Correction Instructions Sent to Company
                    </div>
                    <p className="text-orange-950 font-medium whitespace-pre-line leading-relaxed">
                      {selectedCompany.correction_instructions}
                    </p>
                  </div>
                )}

                {/* Legal & Registration Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                    <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                      MCA Statutory Registration
                    </span>
                    <div>
                      <span className="text-slate-500 block">Corporate Identification Number (CIN)</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">{selectedCompany.cin_number || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Income Tax PAN</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">{selectedCompany.pan_number || '—'}</span>
                    </div>
                    {selectedCompany.csr_registration_number && (
                      <div>
                        <span className="text-slate-500 block">CSR Registration #</span>
                        <span className="font-mono font-bold text-slate-800">{selectedCompany.csr_registration_number}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                    <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                      Authorized SPOC & Contact
                    </span>
                    <div>
                      <span className="text-slate-500 block">Designated Official</span>
                      <span className="font-bold text-slate-800">{selectedCompany.contact_person_name} ({selectedCompany.contact_person_designation || 'Representative'})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Contact Channels</span>
                      <span className="text-slate-800 font-medium">{selectedCompany.contact_email} • {selectedCompany.contact_phone}</span>
                    </div>
                    {selectedCompany.official_website && (
                      <div>
                        <span className="text-slate-500 block">Official Portal</span>
                        <span className="text-blue-600 font-medium">{selectedCompany.official_website}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Registered Address */}
                <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                    Registered Corporate Headquarters
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {selectedCompany.registered_address || '—'}, {selectedCompany.city}, {selectedCompany.state} - {selectedCompany.pincode}
                  </p>
                </div>

                {/* Verification Document */}
                <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                    Statutory Incorporation Dossier
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-blue-600">description</span>
                      <span className="font-bold text-slate-800">
                        {selectedCompany.has_verification_document
                          ? selectedCompany.verification_document_name || 'Certificate_of_Incorporation.pdf'
                          : 'No document attached'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        !selectedCompany.has_verification_document
                          ? 'bg-amber-100 text-amber-800'
                          : selectedCompany.verification_status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {!selectedCompany.has_verification_document
                          ? 'Pending Document'
                          : selectedCompany.verification_status === 'APPROVED'
                          ? 'Verified by Admin'
                          : 'Document on File'}
                      </span>
                      {selectedCompany.verification_document_url && (
                        <a
                          href={selectedCompany.verification_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-700 text-[11px] font-bold rounded-lg border border-slate-200 transition-colors"
                        >
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                          View PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audit Metadata (if reviewed) */}
                {selectedCompany.reviewed_at && (
                  <div className="p-4 bg-slate-100 rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-slate-700 block">Prior Audit Moderation Log</span>
                    <p className="text-slate-600">
                      Reviewed on {new Date(selectedCompany.reviewed_at).toLocaleDateString('en-IN')} by {selectedCompany.verified_by_email || 'Administrator'}
                    </p>
                    {selectedCompany.rejection_reason && (
                      <p className="text-red-700 font-medium">Rejection Rationale: "{selectedCompany.rejection_reason}"</p>
                    )}
                    {selectedCompany.suspension_reason && (
                      <p className="text-orange-700 font-medium">Suspension Rationale: "{selectedCompany.suspension_reason}"</p>
                    )}
                    {selectedCompany.review_notes && (
                      <p className="text-slate-700 italic">Notes: "{selectedCompany.review_notes}"</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons Footer - Pinned at bottom */}
              <div className="p-4 sm:p-5 border-t border-slate-200 bg-white sm:bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCompany(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close Dossier
                </button>

                <div className="flex items-center gap-2">
                  {selectedCompany.verification_status === 'DRAFT' && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                      Draft Profile: Review and approval actions become available once submitted by company.
                    </span>
                  )}

                  {(selectedCompany.verification_status === 'PENDING_VERIFICATION' || selectedCompany.verification_status === 'CORRECTION_REQUIRED') && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setGovCheckOutcome(selectedCompany.gov_check_status || 'VERIFIED');
                          setGovCheckSource(selectedCompany.gov_check_source || 'MCA MCA21 Registry');
                          setGovCheckNotes('');
                          setGovCheckError('');
                          setGovCheckModalOpen(true);
                        }}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">fact_check</span>
                        Record Gov Check
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCorrectionInstructions(selectedCompany.correction_instructions || '');
                          setCorrectionAdminNotes('');
                          setCorrectionError('');
                          setCorrectionModalOpen(true);
                        }}
                        className="px-4 py-2 bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-700 text-xs font-bold rounded-xl border border-orange-200 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">assignment_late</span>
                        Request Corrections
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectModalOpen(true);
                          setRejectReason('');
                          setRejectError('');
                        }}
                        className="px-4 py-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-all cursor-pointer"
                      >
                        Reject Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setApproveModalOpen(true);
                          setApproveNotes('');
                          setApproveError('');
                        }}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        Approve Corporate Partner
                      </button>
                    </>
                  )}

                  {selectedCompany.verification_status === 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSuspendModalOpen(true);
                        setSuspendReason('');
                        setSuspendError('');
                      }}
                      className="px-4 py-2 bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-600 text-xs font-bold rounded-xl border border-orange-200 transition-all cursor-pointer"
                    >
                      Suspend Access
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* APPROVE MODAL */}
        {/* ------------------------------------------------------------------- */}
        {approveModalOpen && selectedCompany && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">verified</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Approve Corporate Partner?</h3>
                  <p className="text-xs text-slate-500">Authorize platform CSR Marketplace access</p>
                </div>
              </div>

              {approveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                  {approveError}
                </div>
              )}

              <form onSubmit={handleApproveSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Administrative Review Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    placeholder="Enter verification remarks (e.g. MCA CIN authenticated, PAN valid)..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 bg-slate-50 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setApproveModalOpen(false)}
                    disabled={approving}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={approving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">{approving ? 'sync' : 'check'}</span>
                    {approving ? 'Approving...' : 'Confirm Approval'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* REJECT MODAL */}
        {/* ------------------------------------------------------------------- */}
        {rejectModalOpen && selectedCompany && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">cancel</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reject Corporate Profile?</h3>
                  <p className="text-xs text-slate-500">Corporate applicant will be notified with your rationale</p>
                </div>
              </div>

              {rejectError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                  {rejectError}
                </div>
              )}

              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mandatory Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Specify why verification failed (e.g. invalid CIN, signature mismatch, PAN discrepancy)..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 bg-slate-50 focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(false)}
                    disabled={rejecting}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rejecting || !rejectReason.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">{rejecting ? 'sync' : 'close'}</span>
                    {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* SUSPEND MODAL */}
        {/* ------------------------------------------------------------------- */}
        {suspendModalOpen && selectedCompany && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">block</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Suspend Corporate Account?</h3>
                  <p className="text-xs text-slate-500">Temporarily freeze corporate matching and partnerships</p>
                </div>
              </div>

              {suspendError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                  {suspendError}
                </div>
              )}

              <form onSubmit={handleSuspendSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mandatory Suspension Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Specify grounds for suspension (e.g. compliance investigation, payment default)..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 bg-slate-50 focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSuspendModalOpen(false)}
                    disabled={suspending}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={suspending || !suspendReason.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">{suspending ? 'sync' : 'block'}</span>
                    {suspending ? 'Suspending...' : 'Confirm Suspension'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* REQUEST CORRECTION MODAL */}
        {/* ------------------------------------------------------------------- */}
        {correctionModalOpen && selectedCompany && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">assignment_late</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Request Corporate Profile Correction</h3>
                  <p className="text-xs text-slate-500">Transition to CORRECTION_REQUIRED for user remediation</p>
                </div>
              </div>

              {correctionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                  {correctionError}
                </div>
              )}

              <form onSubmit={handleRequestCorrectionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mandatory Correction Instructions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={correctionInstructions}
                    onChange={(e) => setCorrectionInstructions(e.target.value)}
                    placeholder="Provide specific instructions (e.g. Upload valid Certificate of Incorporation, update PAN matching official MCA records)..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 bg-slate-50 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Internal Admin Review Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={correctionAdminNotes}
                    onChange={(e) => setCorrectionAdminNotes(e.target.value)}
                    placeholder="Internal audit notes (not displayed to company)..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 bg-slate-50 focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCorrectionModalOpen(false)}
                    disabled={requestingCorrection}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requestingCorrection || !correctionInstructions.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">{requestingCorrection ? 'sync' : 'send'}</span>
                    {requestingCorrection ? 'Dispatching...' : 'Dispatch Instructions'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* RECORD GOV CHECK MODAL */}
        {/* ------------------------------------------------------------------- */}
        {govCheckModalOpen && selectedCompany && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">fact_check</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Government Verification Check</h3>
                  <p className="text-xs text-slate-500">
                    Log initial statutory validation against MCA MCA21 / PAN Registry
                  </p>
                </div>
              </div>

              {govCheckError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                  {govCheckError}
                </div>
              )}

              <form onSubmit={handleRecordGovCheckSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Verification Outcome <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={govCheckOutcome}
                    onChange={(e) => setGovCheckOutcome(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 bg-slate-50 focus:border-indigo-500 font-medium"
                  >
                    <option value="VERIFIED">VERIFIED (CIN active on MCA21 portal, corporate identity verified)</option>
                    <option value="FAILED">FAILED (Invalid CIN/PAN or company struck off / dissolved)</option>
                    <option value="MANUAL_VERIFICATION_REQUIRED">MANUAL_VERIFICATION_REQUIRED (Document cross-check required)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registry Source / Verification Portal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={govCheckSource}
                    onChange={(e) => setGovCheckSource(e.target.value)}
                    placeholder="e.g. MCA MCA21 Company Master Data, Income Tax PAN Portal"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 bg-slate-50 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Verification Observations / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={govCheckNotes}
                    onChange={(e) => setGovCheckNotes(e.target.value)}
                    placeholder="Enter observations, registry matching details, or exceptions..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 bg-slate-50 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setGovCheckModalOpen(false)}
                    disabled={recordingGovCheck}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recordingGovCheck}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">{recordingGovCheck ? 'sync' : 'check'}</span>
                    {recordingGovCheck ? 'Saving...' : 'Save Check Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
