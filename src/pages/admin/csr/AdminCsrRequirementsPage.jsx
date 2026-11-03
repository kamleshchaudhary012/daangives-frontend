import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  listAdminCsrRequirements,
  getAdminCsrRequirementDetail,
  approveAdminCsrRequirement,
  rejectAdminCsrRequirement,
  suspendAdminCsrRequirement,
} from '../../../services/api';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Proposals' },
  { key: 'PENDING_REVIEW', label: 'Pending Review' },
  { key: 'OPEN_FOR_CSR', label: 'Open for CSR' },
  { key: 'PARTNERED', label: 'Partnered' },
  { key: 'IN_EXECUTION', label: 'In Execution' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'DRAFT', label: 'Drafts' },
];

const SCHEDULE_VII_CATEGORIES = [
  { key: 'ALL', label: 'All Schedule VII Focus Areas' },
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
        label: 'Open on Marketplace',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'storefront',
      };
    case 'PENDING_REVIEW':
      return {
        label: 'Pending Admin Review',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: 'hourglass_top',
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

export default function AdminCsrRequirementsPage() {
  const { id: routeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get('status') || 'ALL';
  const categoryFilter = searchParams.get('category') || 'ALL';
  const searchFilter = searchParams.get('search') || '';
  const orderingFilter = searchParams.get('ordering') || '-created_at';
  const pageFilter = parseInt(searchParams.get('page') || '1', 10);

  const [localSearch, setLocalSearch] = useState(searchFilter);
  const [requirements, setRequirements] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inspection Modal State
  const [selectedRequirement, setSelectedRequirement] = useState(null);
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

  const [actionSuccess, setActionSuccess] = useState('');

  const pageSize = 12;

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
      if (categoryFilter !== 'ALL') params.schedule_vii_category = categoryFilter;
      if (searchFilter.trim()) params.search = searchFilter.trim();

      const res = await listAdminCsrRequirements(params);
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
      setError(err.message || 'Failed to load CSR proposal moderation queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [statusFilter, categoryFilter, searchFilter, orderingFilter, pageFilter]);

  useEffect(() => {
    if (routeId) {
      inspectRequirement(routeId);
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

  const inspectRequirement = async (reqId) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const detail = await getAdminCsrRequirementDetail(reqId);
      setSelectedRequirement(detail);
    } catch (err) {
      setDetailError(err.message || 'Failed to load CSR proposal dossier.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle Approve
  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequirement || approving) return;

    setApproving(true);
    setApproveError('');

    try {
      const updated = await approveAdminCsrRequirement(selectedRequirement.id, {
        notes: approveNotes.trim(),
      });
      setActionSuccess(`Proposal "${updated.title}" approved and published to CSR Marketplace!`);
      setSelectedRequirement(updated);
      setApproveModalOpen(false);
      setApproveNotes('');
      fetchRequirements();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setApproveError(err.message || 'Failed to approve proposal.');
    } finally {
      setApproving(false);
    }
  };

  // Handle Reject
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequirement || rejecting) return;

    if (!rejectReason.trim()) {
      setRejectError('A mandatory rejection reason must be provided.');
      return;
    }

    setRejecting(true);
    setRejectError('');

    try {
      const updated = await rejectAdminCsrRequirement(selectedRequirement.id, {
        reason: rejectReason.trim(),
      });
      setActionSuccess(`Proposal "${updated.title}" rejected.`);
      setSelectedRequirement(updated);
      setRejectModalOpen(false);
      setRejectReason('');
      fetchRequirements();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setRejectError(err.message || 'Failed to reject proposal.');
    } finally {
      setRejecting(false);
    }
  };

  // Handle Suspend
  const handleSuspendSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequirement || suspending) return;

    if (!suspendReason.trim()) {
      setSuspendError('A mandatory suspension reason must be provided.');
      return;
    }

    setSuspending(true);
    setSuspendError('');

    try {
      const updated = await suspendAdminCsrRequirement(selectedRequirement.id, {
        reason: suspendReason.trim(),
      });
      setActionSuccess(`Proposal "${updated.title}" suspended.`);
      setSelectedRequirement(updated);
      setSuspendModalOpen(false);
      setSuspendReason('');
      fetchRequirements();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setSuspendError(err.message || 'Failed to suspend proposal.');
    } finally {
      setSuspending(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // KPI calculations
  const pendingCount = requirements.filter((r) => r.status === 'PENDING_REVIEW').length;
  const openCount = requirements.filter((r) => r.status === 'OPEN_FOR_CSR').length;
  const partneredCount = requirements.filter((r) => r.status === 'PARTNERED' || r.status === 'IN_EXECUTION').length;
  const completedCount = requirements.filter((r) => r.status === 'COMPLETED').length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Platform Moderation Queue
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              CSR Proposal Moderation Queue
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Review NGO Section 135 proposals, audit budget breakdowns, and approve initiatives for corporate matching.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/csr/companies"
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-all"
            >
              Corporate Queue →
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
              Pending Moderation
            </span>
            <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
            <div className="text-[10px] text-slate-500">Requires admin review</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Open on Marketplace
            </span>
            <div className="text-2xl font-black text-emerald-600">{openCount}</div>
            <div className="text-[10px] text-slate-500">Available for corporate matching</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Partnered / Execution
            </span>
            <div className="text-2xl font-black text-indigo-600">{partneredCount}</div>
            <div className="text-[10px] text-slate-500">Funded agreements</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Completed & Verified
            </span>
            <div className="text-2xl font-black text-blue-600">{completedCount}</div>
            <div className="text-[10px] text-slate-500">Concluded deliverables</div>
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

          {/* Search & Category Filter Bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search by proposal title, summary, or partner NGO name..."
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 transition-colors"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => updateQuery({ category: e.target.value, page: 1 })}
              className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
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
              className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="-created_at">Newest First</option>
              <option value="required_csr_funding">Funding: Low to High</option>
              <option value="-required_csr_funding">Funding: High to Low</option>
            </select>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-all"
            >
              Filter
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
            <h3 className="text-base font-bold text-slate-900">Failed to load proposals queue</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchRequirements}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && requirements.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">folder_off</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Proposals Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No CSR proposals match the current filter selection.
            </p>
          </div>
        )}

        {/* Proposals List Table */}
        {!loading && !error && requirements.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Proposal & NGO Partner</th>
                    <th className="px-4 py-3.5">Schedule VII Focus</th>
                    <th className="px-4 py-3.5">Territory</th>
                    <th className="px-4 py-3.5">Required CSR Grant</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requirements.map((r) => {
                    const statusInfo = getRequirementStatusBadge(r.status);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 text-sm line-clamp-1">{r.title}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            NGO: <strong className="text-slate-700">{r.ngo_name || r.ngo_display_name || 'NGO Partner'}</strong>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {r.category_display || r.schedule_vii_category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {r.district ? `${r.district}, ${r.state}` : r.state}
                        </td>
                        <td className="px-4 py-4 font-black text-slate-800">
                          {formatCurrency(r.required_csr_funding)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.badgeClass}`}>
                            <span className="material-symbols-outlined text-xs">{statusInfo.icon}</span>
                            {r.status_display || statusInfo.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => inspectRequirement(r.id)}
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
                  Showing page {pageFilter} of {totalPages} ({totalCount} proposals)
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
        {selectedRequirement && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl animate-scaleUp">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    CSR Proposal Review Dossier
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    {selectedRequirement.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedRequirement(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Status & Funding Bar */}
              <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Current Status</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold mt-0.5 ${
                    getRequirementStatusBadge(selectedRequirement.status).badgeClass
                  } px-2.5 py-0.5 rounded-full border`}>
                    <span className="material-symbols-outlined text-xs">
                      {getRequirementStatusBadge(selectedRequirement.status).icon}
                    </span>
                    {selectedRequirement.status_display || selectedRequirement.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Required CSR Grant</span>
                  <span className="text-lg font-black text-slate-900">
                    {formatCurrency(selectedRequirement.required_csr_funding)}
                  </span>
                </div>
              </div>

              {/* NGO & Scope Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                    NGO Implementing Partner
                  </span>
                  <div>
                    <span className="text-slate-500 block">Organization</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedRequirement.ngo_name || selectedRequirement.ngo_display_name || 'NGO Partner'}
                    </span>
                  </div>
                  {selectedRequirement.ngo_darpan_id && (
                    <div>
                      <span className="text-slate-500 block">NGO-Darpan UID</span>
                      <span className="font-mono font-bold text-slate-800">{selectedRequirement.ngo_darpan_id}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                    Target Scope & Beneficiaries
                  </span>
                  <div>
                    <span className="text-slate-500 block">Focus Category</span>
                    <span className="font-bold text-slate-800">{selectedRequirement.category_display || selectedRequirement.schedule_vii_category}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Territory & Target Demographic</span>
                    <span className="text-slate-800 font-medium">
                      {selectedRequirement.district ? `${selectedRequirement.district}, ${selectedRequirement.state}` : selectedRequirement.state} • {selectedRequirement.demographic_display || selectedRequirement.beneficiary_demographic} ({selectedRequirement.target_beneficiary_count} Individuals)
                    </span>
                  </div>
                </div>
              </div>

              {/* Executive Summary & Narrative Scope */}
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                  <span className="font-bold text-slate-700 block">Executive Summary</span>
                  <p className="text-slate-600 leading-relaxed">{selectedRequirement.summary}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                  <span className="font-bold text-slate-700 block">Detailed Implementation Strategy</span>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedRequirement.detailed_description}</p>
                </div>
              </div>

              {/* Statutory PDF Documents */}
              <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2">
                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                  Statutory Project Dossiers (PDF)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Proposal PDF</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {selectedRequirement.has_proposal_document
                        ? selectedRequirement.proposal_document_name || 'Uploaded'
                        : 'None'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Detailed Budget PDF</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {selectedRequirement.has_detailed_budget_document
                        ? selectedRequirement.detailed_budget_document_name || 'Uploaded'
                        : 'None'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Impact Assessment PDF</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {selectedRequirement.has_impact_assessment_report
                        ? selectedRequirement.impact_assessment_report_name || 'Uploaded'
                        : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Audit History (if reviewed) */}
              {selectedRequirement.reviewed_at && (
                <div className="p-4 bg-slate-100 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-slate-700 block">Prior Moderation Audit Log</span>
                  <p className="text-slate-600">
                    Reviewed on {new Date(selectedRequirement.reviewed_at).toLocaleDateString('en-IN')} by {selectedRequirement.reviewed_by_email || 'Administrator'}
                  </p>
                  {selectedRequirement.rejection_reason && (
                    <p className="text-red-700 font-medium">Rejection Rationale: "{selectedRequirement.rejection_reason}"</p>
                  )}
                  {selectedRequirement.suspension_reason && (
                    <p className="text-orange-700 font-medium">Suspension Rationale: "{selectedRequirement.suspension_reason}"</p>
                  )}
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setSelectedRequirement(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Close Dossier
                </button>

                <div className="flex items-center gap-2">
                  {selectedRequirement.status === 'PENDING_REVIEW' && (
                    <>
                      <button
                        onClick={() => {
                          setRejectModalOpen(true);
                          setRejectReason('');
                          setRejectError('');
                        }}
                        className="px-4 py-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-all"
                      >
                        Reject Proposal
                      </button>
                      <button
                        onClick={() => {
                          setApproveModalOpen(true);
                          setApproveNotes('');
                          setApproveError('');
                        }}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                      >
                        Approve & Publish to Marketplace
                      </button>
                    </>
                  )}

                  {(selectedRequirement.status === 'OPEN_FOR_CSR' || selectedRequirement.status === 'APPROVED') && (
                    <button
                      onClick={() => {
                        setSuspendModalOpen(true);
                        setSuspendReason('');
                        setSuspendError('');
                      }}
                      className="px-4 py-2 bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-600 text-xs font-bold rounded-xl border border-orange-200 transition-all"
                    >
                      Suspend Proposal
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
        {approveModalOpen && selectedRequirement && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">storefront</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Publish to CSR Marketplace?</h3>
                  <p className="text-xs text-slate-500">Proposal status will transition to OPEN_FOR_CSR</p>
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
                    Moderation Review Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    placeholder="Enter approval remarks (e.g. Schedule VII budget verified, clear milestones)..."
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
                    {approving ? 'Publishing...' : 'Confirm & Publish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* REJECT MODAL */}
        {/* ------------------------------------------------------------------- */}
        {rejectModalOpen && selectedRequirement && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">cancel</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reject CSR Proposal?</h3>
                  <p className="text-xs text-slate-500">NGO will be notified with your feedback rationale</p>
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
                    placeholder="Specify why proposal was rejected (e.g. Schedule VII misalignment, incomplete budget breakdown)..."
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
        {suspendModalOpen && selectedRequirement && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">warning</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Suspend CSR Proposal?</h3>
                  <p className="text-xs text-slate-500">Proposal will be hidden from Marketplace matching</p>
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
                    placeholder="Specify reason for suspending proposal (e.g. NGO compliance audit, legal inquiry)..."
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
      </div>
    </AdminLayout>
  );
}
