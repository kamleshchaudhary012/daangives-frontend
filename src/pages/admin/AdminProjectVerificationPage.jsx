import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge';
import {
  getAdminProjects,
  getAdminProjectDetail,
  getAdminProjectHistory,
  adminVerifyProject,
} from '../../services/api/projects';
import {
  PROJECT_CATEGORY_OPTIONS,
  PROJECT_CATEGORY_LABELS,
  PROJECT_STATUS_LABELS,
} from '../../constants/projects';
import useDebounce from '../../hooks/useDebounce';

const STATUS_FILTER_OPTIONS = [
  { label: 'Pending Review (Submitted & Under Review)', value: 'PENDING' },
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Action Required', value: 'DOCS_PENDING' },
  { label: 'Verified & CSR Ready', value: 'VERIFIED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Funded / Active', value: 'ACTIVE' },
];

export default function AdminProjectVerificationPage() {
  const { id: urlParamId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Role Authorization Check
  const [isAdmin, setIsAdmin] = useState(true);

  // Queue state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 350);
  const initialStatus = searchParams.get('status') || 'PENDING';
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [page, setPage] = useState(1);

  const [loadingQueue, setLoadingQueue] = useState(true);
  const [queueError, setQueueError] = useState('');
  const [projects, setProjects] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    under_review: 0,
    action_required: 0,
    verified: 0,
    rejected: 0,
    funded: 0,
  });
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // Stale request guard
  const requestIdRef = useRef(0);

  // Detail & Inspection Modal State
  const [selectedProjectId, setSelectedProjectId] = useState(urlParamId || null);
  const [inspectionData, setInspectionData] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Action States & Modals
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');
  const [actionModal, setActionModal] = useState(null); // 'add_to_verify' | 'approve' | 'request_changes' | 'reject'
  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Check Admin Authorization
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.role?.toUpperCase() !== 'ADMIN') {
          setIsAdmin(false);
          return;
        }
      } catch (e) {
        setIsAdmin(false);
        return;
      }
    }
  }, []);

  // Sync urlParamId with modal state
  useEffect(() => {
    if (urlParamId && urlParamId !== selectedProjectId) {
      setSelectedProjectId(urlParamId);
    }
  }, [urlParamId]);

  // Fetch Queue Data
  const fetchQueue = useCallback(async () => {
    setLoadingQueue(true);
    setQueueError('');
    const currentReqId = ++requestIdRef.current;

    try {
      const params = {
        page,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        category: categoryFilter === 'All' ? undefined : categoryFilter,
        search: debouncedSearchTerm.trim() || undefined,
      };

      const data = await getAdminProjects(params);

      // Guard against out-of-order stale responses
      if (currentReqId !== requestIdRef.current) return;

      setProjects(data.results || []);
      setTotalCount(data.count || 0);
      if (data.stats && typeof data.stats === 'object') {
        setStats(data.stats);
      }
      setHasNext(Boolean(data.next));
      setHasPrev(Boolean(data.previous));
    } catch (err) {
      if (currentReqId === requestIdRef.current) {
        setQueueError(err.message || 'Failed to load project verification queue.');
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setLoadingQueue(false);
      }
    }
  }, [page, statusFilter, categoryFilter, debouncedSearchTerm]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Fetch Inspection Detail Data
  const fetchInspectionDetail = useCallback(async (projId) => {
    if (!projId) {
      setInspectionData(null);
      setAuditHistory([]);
      return;
    }
    setLoadingDetail(true);
    setDetailError('');
    setActionSuccessMsg('');
    setActionErrorMsg('');

    try {
      const [projDetail, history] = await Promise.all([
        getAdminProjectDetail(projId),
        getAdminProjectHistory(projId).catch(() => []),
      ]);
      setInspectionData(projDetail);
      setAuditHistory(Array.isArray(history) ? history : projDetail.verification_history || []);
    } catch (err) {
      setDetailError(err.message || 'Unable to retrieve project proposal details.');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchInspectionDetail(selectedProjectId);
    }
  }, [selectedProjectId, fetchInspectionDetail]);

  const handleOpenDetailModal = (proj) => {
    setSelectedProjectId(proj.id);
    navigate(`/admin/projects/${proj.id}`, { replace: true });
  };

  const handleCloseDetailModal = () => {
    setSelectedProjectId(null);
    setInspectionData(null);
    setActionModal(null);
    setActionNotes('');
    setRejectionReason('');
    navigate('/admin/projects', { replace: true });
  };

  // Execute Review Actions
  const handleExecuteAction = async (actionType) => {
    if (!selectedProjectId) return;
    setSubmittingAction(true);
    setActionSuccessMsg('');
    setActionErrorMsg('');

    try {
      let payload = { action: actionType };
      if (actionType === 'ADD_TO_VERIFY') {
        payload.notes = actionNotes.trim() || 'Project proposal added to verification queue by Administrator.';
      } else if (actionType === 'APPROVE') {
        payload.notes = actionNotes.trim() || 'Proposal verified and approved for CSR partnerships.';
      } else if (actionType === 'REQUEST_CHANGES') {
        if (!actionNotes.trim()) {
          setActionErrorMsg('Please provide change instructions describing what the NGO must correct.');
          setSubmittingAction(false);
          return;
        }
        payload.notes = actionNotes.trim();
      } else if (actionType === 'REJECT') {
        if (!rejectionReason.trim()) {
          setActionErrorMsg('A rejection reason is required explaining why this proposal cannot be verified.');
          setSubmittingAction(false);
          return;
        }
        payload.rejection_reason = rejectionReason.trim();
        payload.notes = actionNotes.trim();
      }

      const res = await adminVerifyProject(selectedProjectId, payload);
      setActionSuccessMsg(res.detail || `Project action ${actionType} completed successfully.`);
      setActionModal(null);
      setActionNotes('');
      setRejectionReason('');

      // Refresh both modal detail and queue
      await Promise.all([
        fetchInspectionDetail(selectedProjectId),
        fetchQueue(),
      ]);
    } catch (err) {
      setActionErrorMsg(err.message || 'Action failed to execute. Please try again.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Quick Action directly from card
  const handleQuickAddToVerify = async (e, projId) => {
    e.stopPropagation();
    try {
      await adminVerifyProject(projId, {
        action: 'ADD_TO_VERIFY',
        notes: 'Project added to review queue via Quick Action.',
      });
      fetchQueue();
    } catch (err) {
      alert(`Failed to add project to review queue: ${err.message}`);
    }
  };

  const selectKpiCard = (targetStatus) => {
    setStatusFilter(targetStatus);
    setPage(1);
    setSearchParams(targetStatus === 'PENDING' ? {} : { status: targetStatus });
  };

  const KPI_CARDS = [
    { id: 'ALL', label: 'Total Proposals', count: stats.total ?? totalCount, dot: 'bg-slate-400' },
    {
      id: 'PENDING',
      label: 'Pending Review',
      count: stats.pending ?? ((stats.submitted || 0) + (stats.under_review || 0)),
      dot: 'bg-blue-500',
    },
    { id: 'UNDER_REVIEW', label: 'Under Review', count: stats.under_review ?? 0, dot: 'bg-amber-500' },
    { id: 'DOCS_PENDING', label: 'Action Required', count: stats.action_required ?? 0, dot: 'bg-orange-500' },
    { id: 'VERIFIED', label: 'Verified & CSR Ready', count: stats.verified ?? 0, dot: 'bg-emerald-500' },
    { id: 'REJECTED', label: 'Rejected', count: stats.rejected ?? 0, dot: 'bg-rose-500' },
  ];

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 m-6 shadow-xs max-w-lg mx-auto">
          <span className="material-symbols-outlined text-4xl text-slate-400 mb-3">lock</span>
          <h2 className="text-base font-bold text-slate-900 mb-1">Access Restricted</h2>
          <p className="text-slate-500 text-xs">
            Administrative privileges required to access the Project Verification Queue.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Project Proposal Verification
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Statutory verification and Section 135 compliance review queue for village development proposals.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchQueue}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 border border-slate-200 transition-colors shadow-xs"
              title="Refresh queue"
            >
              <span className="material-symbols-outlined text-base text-slate-500">refresh</span>
              Refresh
            </button>
            <Link
              to="/admin/ngos"
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 border border-slate-200 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-base text-slate-500">verified_user</span>
              NGO Approvals
            </Link>
          </div>
        </div>

        {/* KPI Metric Aggregate Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {KPI_CARDS.map((kpi) => {
            const isSelected = statusFilter === kpi.id;
            return (
              <button
                key={kpi.id}
                type="button"
                onClick={() => selectKpiCard(kpi.id)}
                className={`p-3.5 rounded-xl border text-left transition-colors relative ${
                  isSelected
                    ? 'bg-slate-50/80 border-slate-900 ring-1 ring-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-medium text-slate-500 truncate block">
                    {kpi.label}
                  </span>
                  <span className={`h-2 w-2 rounded-full shrink-0 ${kpi.dot}`} />
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {kpi.count}
                </div>
              </button>
            );
          })}
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-xs">
          <div className="flex flex-1 flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-base">
                search
              </span>
              <input
                type="text"
                placeholder="Search proposal title, NGO name, village, or district..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            >
              <option value="All">All Categories</option>
              {PROJECT_CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {(statusFilter !== 'PENDING' || categoryFilter !== 'All' || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('PENDING');
                setCategoryFilter('All');
                setSearchTerm('');
                setPage(1);
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1 self-center transition-colors"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              Reset Filters
            </button>
          )}
        </div>

        {/* Error Alert */}
        {queueError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base text-rose-600">error</span>
            <span>{queueError}</span>
          </div>
        )}

        {/* Proposal List */}
        {loadingQueue ? (
          <div className="py-16 text-center space-y-2 bg-white rounded-xl border border-slate-200">
            <span className="material-symbols-outlined text-3xl text-slate-400 animate-spin">
              progress_activity
            </span>
            <p className="text-xs text-slate-500">
              Loading project proposal verification queue...
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8 space-y-2">
            <span className="material-symbols-outlined text-4xl text-slate-300">
              inbox
            </span>
            <h3 className="text-sm font-semibold text-slate-900">No Project Proposals Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No development proposals match the current filter criteria ({statusFilter}).
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => handleOpenDetailModal(proj)}
                className="bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-colors cursor-pointer shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ProjectStatusBadge status={proj.status} size="sm" />
                    {proj.is_csr_ready ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        CSR Ready
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-500">
                        Non-CSR Only
                      </span>
                    )}
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600">
                      {proj.category_display || proj.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      • {new Date(proj.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 max-w-3xl leading-relaxed">
                    {proj.short_summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-0.5">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                      <span className="material-symbols-outlined text-sm text-slate-400">domain</span>
                      {proj.organization_name || 'Sanstha Partner'}
                      {proj.organization_darpan_id && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({proj.organization_darpan_id})
                        </span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                      {proj.location_village}, {proj.location_district}, {proj.location_state}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                      ₹{parseFloat(proj.estimated_cost).toLocaleString('en-IN')}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-slate-400">description</span>
                      {proj.document_count || 0} Docs
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-slate-400">flag</span>
                      {proj.milestone_count || 0} Milestones
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div
                  className="flex items-center gap-2 self-start md:self-center shrink-0 pt-2 md:pt-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {proj.status === 'SUBMITTED' && (
                    <button
                      type="button"
                      onClick={(e) => handleQuickAddToVerify(e, proj.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">assignment_turned_in</span>
                      Add to Verify
                    </button>
                  )}

                  {proj.status === 'UNDER_REVIEW' && (
                    <button
                      type="button"
                      onClick={() => handleOpenDetailModal(proj)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">fact_check</span>
                      Review Actions
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenDetailModal(proj)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1 border border-slate-200 shadow-xs transition-colors"
                  >
                    <span>Inspect</span>
                    <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalCount > 12 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">
              Showing {projects.length} of {totalCount} proposals
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={!hasPrev || loadingQueue}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-900 px-2">Page {page}</span>
              <button
                disabled={!hasNext || loadingQueue}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ─── Inspection & Review Modal ────────────────────────────────────── */}
        {selectedProjectId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200 shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/70">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {inspectionData && <ProjectStatusBadge status={inspectionData.status} size="sm" />}
                    {inspectionData && (
                      inspectionData.is_csr_ready ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-700 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          CSR Ready
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-500">
                          Non-CSR Only
                        </span>
                      )
                    )}
                    <span className="text-xs text-slate-500 font-medium">
                      Proposal ID: {selectedProjectId}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 leading-snug">
                    {inspectionData?.title || 'Loading Proposal...'}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span>NGO: <strong className="text-slate-800">{inspectionData?.organization_name}</strong></span>
                    {inspectionData?.organization_darpan_id && (
                      <span>• Darpan ID: {inspectionData.organization_darpan_id}</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseDetailModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Notification Banners */}
              {actionSuccessMsg && (
                <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                  {actionSuccessMsg}
                </div>
              )}
              {actionErrorMsg && (
                <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-rose-600">error</span>
                  {actionErrorMsg}
                </div>
              )}

              {/* Modal Tabs */}
              <div className="px-5 pt-3 border-b border-slate-200 flex gap-4 text-xs font-semibold">
                {[
                  { id: 'overview', label: 'Proposal Overview', icon: 'info' },
                  { id: 'documents', label: `Documents (${inspectionData?.documents?.length || 0})`, icon: 'description' },
                  { id: 'milestones', label: `Milestones (${inspectionData?.milestones?.length || 0})`, icon: 'flag' },
                  { id: 'history', label: `Audit Trail (${auditHistory.length})`, icon: 'history' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                      activeTab === tab.id
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-5 overflow-y-auto flex-1 space-y-5">
                {loadingDetail ? (
                  <div className="py-12 text-center space-y-2">
                    <span className="material-symbols-outlined text-2xl text-slate-400 animate-spin">
                      progress_activity
                    </span>
                    <p className="text-xs text-slate-500">Loading proposal documents & details...</p>
                  </div>
                ) : detailError ? (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {detailError}
                  </div>
                ) : inspectionData ? (
                  <>
                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                      <div className="space-y-5 text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-500 font-medium block">Estimated Budget</span>
                            <span className="text-sm sm:text-base font-bold text-slate-900">
                              ₹{parseFloat(inspectionData.estimated_cost).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-500 font-medium block">Execution Timeline</span>
                            <span className="text-sm sm:text-base font-bold text-slate-900">
                              {inspectionData.timeline_months} Months
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-500 font-medium block">Beneficiaries</span>
                            <span className="text-sm sm:text-base font-bold text-slate-900">
                              {inspectionData.beneficiaries_count || '—'} People
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-500 font-medium block">Location</span>
                            <span className="text-xs font-semibold text-slate-800 truncate block mt-0.5">
                              {inspectionData.location_village}, {inspectionData.location_district}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-semibold text-slate-900">Proposal Summary</h4>
                          <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                            {inspectionData.short_summary}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-semibold text-slate-900">Detailed Description</h4>
                          <div className="text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-200">
                            {inspectionData.description || 'No detailed description provided.'}
                          </div>
                        </div>

                        {inspectionData.verification_notes && (
                          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1">
                            <strong className="block text-xs font-semibold">Latest Administrator Notes:</strong>
                            <p className="text-xs">{inspectionData.verification_notes}</p>
                          </div>
                        )}

                        {inspectionData.rejection_reason && (
                          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900 space-y-1">
                            <strong className="block text-xs font-semibold">Rejection Reason:</strong>
                            <p className="text-xs">{inspectionData.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB: DOCUMENTS */}
                    {activeTab === 'documents' && (
                      <div className="space-y-2.5">
                        {inspectionData.documents?.length === 0 ? (
                          <p className="text-center py-8 text-slate-500 text-xs">
                            No verification documents attached to this project.
                          </p>
                        ) : (
                          inspectionData.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-xl text-slate-500">
                                  picture_as_pdf
                                </span>
                                <div>
                                  <strong className="block text-slate-900">
                                    {doc.document_type_display || doc.document_type}
                                  </strong>
                                  <span className="text-[11px] text-slate-500">
                                    Uploaded by {doc.uploaded_by_name || 'NGO'} on{' '}
                                    {new Date(doc.uploaded_at).toLocaleDateString()}
                                  </span>
                                  {doc.notes && (
                                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                                      Note: {doc.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {doc.file && (
                                <a
                                  href={doc.file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs flex items-center gap-1 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                                  View / Download
                                </a>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* TAB: MILESTONES */}
                    {activeTab === 'milestones' && (
                      <div className="space-y-2.5">
                        {inspectionData.milestones?.length === 0 ? (
                          <p className="text-center py-8 text-slate-500 text-xs">
                            No milestones specified for this project.
                          </p>
                        ) : (
                          inspectionData.milestones.map((m, idx) => (
                            <div
                              key={m.id || idx}
                              className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-600">#{m.order}</span>
                                  <strong className="text-slate-900">{m.title}</strong>
                                </div>
                                <p className="text-slate-500 text-[11px] mt-0.5">
                                  {m.description || 'No description'}
                                </p>
                                {m.target_date && (
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Target Date: {m.target_date}
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-slate-900 block">
                                  ₹{parseFloat(m.amount).toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {m.status_display || m.status}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* TAB: AUDIT HISTORY */}
                    {activeTab === 'history' && (
                      <div className="space-y-3">
                        {auditHistory.length === 0 ? (
                          <p className="text-center py-8 text-slate-500 text-xs">
                            No verification history entries recorded yet.
                          </p>
                        ) : (
                          <div className="relative border-l border-slate-200 ml-4 space-y-3.5">
                            {auditHistory.map((item, idx) => (
                              <div key={item.id || idx} className="pl-5 relative">
                                <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-white" />
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <strong className="text-slate-900 uppercase tracking-wider text-[11px]">
                                      {item.action} ({item.from_status} → {item.to_status})
                                    </strong>
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(item.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-600 font-medium block">
                                    Actor: {item.actor_email || item.actor_type}
                                  </span>
                                  {item.notes && (
                                    <p className="text-slate-600 pt-1 border-t border-slate-200 mt-1">
                                      {item.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Modal Admin Action Controls Footer */}
              {inspectionData && (
                <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Current Status: <strong className="text-slate-900">{PROJECT_STATUS_LABELS[inspectionData.status] || inspectionData.status}</strong>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action 1: Add to Verify (For SUBMITTED) */}
                    {inspectionData.status === 'SUBMITTED' && (
                      <button
                        type="button"
                        disabled={submittingAction}
                        onClick={() => handleExecuteAction('ADD_TO_VERIFY')}
                        className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">assignment_turned_in</span>
                        {submittingAction ? 'Updating...' : 'Add to Verify (Start Review)'}
                      </button>
                    )}

                    {/* Actions for UNDER_REVIEW */}
                    {inspectionData.status === 'UNDER_REVIEW' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActionModal('approve')}
                          className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">verified</span>
                          Approve & Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => setActionModal('request_changes')}
                          className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">edit_note</span>
                          Request Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setActionModal('reject')}
                          className="px-4 py-2 rounded-lg bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">cancel</span>
                          Reject Proposal
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-Action Prompt Overlay */}
              {actionModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50">
                  <div className="bg-white w-full max-w-lg rounded-xl border border-slate-200 p-6 space-y-4 shadow-xl">
                    <h3 className="text-sm font-bold text-slate-900">
                      {actionModal === 'approve' && 'Approve & Verify Proposal'}
                      {actionModal === 'request_changes' && 'Request Changes from NGO'}
                      {actionModal === 'reject' && 'Reject Proposal Review'}
                    </h3>

                    {actionModal === 'approve' && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        This proposal will become <strong>VERIFIED</strong>. {inspectionData?.is_csr_ready ? 'Because the implementing NGO holds verified Section 135 CSR eligibility, this proposal is also qualified as CSR READY for corporate partnerships.' : 'Because the implementing NGO does not hold verified Section 135 CSR status, this project will remain eligible for Non-CSR donations only.'}
                      </p>
                    )}

                    {actionModal === 'request_changes' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Correction Instructions (Required for NGO):
                        </label>
                        <textarea
                          rows={3}
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          placeholder="Specify missing statutory NOC, DPR clarification, or budget items..."
                          className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none"
                        />
                      </div>
                    )}

                    {actionModal === 'reject' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-rose-700 mb-1">
                            Rejection Reason (Required):
                          </label>
                          <textarea
                            rows={3}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Reason for disqualification (e.g. Schedule VII ineligibility, duplicate submission)..."
                            className="w-full p-2.5 rounded-lg border border-rose-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {actionModal === 'approve' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Approval Notes (Optional):
                        </label>
                        <input
                          type="text"
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          placeholder="e.g. Verified against District Panchayat Master Plan"
                          className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActionModal(null);
                          setActionNotes('');
                          setRejectionReason('');
                        }}
                        className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={submittingAction}
                        onClick={() => {
                          if (actionModal === 'approve') handleExecuteAction('APPROVE');
                          else if (actionModal === 'request_changes') handleExecuteAction('REQUEST_CHANGES');
                          else if (actionModal === 'reject') handleExecuteAction('REJECT');
                        }}
                        className={`px-4 py-2 rounded-lg text-white font-medium text-xs shadow-xs transition-colors ${
                          actionModal === 'approve'
                            ? 'bg-emerald-700 hover:bg-emerald-800'
                            : actionModal === 'request_changes'
                            ? 'bg-slate-900 hover:bg-slate-800'
                            : 'bg-rose-700 hover:bg-rose-800'
                        }`}
                      >
                        {submittingAction ? 'Processing...' : 'Confirm Action'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
