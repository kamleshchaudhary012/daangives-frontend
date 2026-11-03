import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import Badge from '../../components/common/Badge';
import {
  getAdminNgos,
  getAdminNgoById,
  getAdminNgoHistory,
  downloadNgoDocumentFile,
  startAdminNgoReview,
  approveAdminNgo,
  recordAdminNgoGovCheck,
  requestAdminNgoCorrection,
  rejectAdminNgo,
  suspendAdminNgo,
  unsuspendAdminNgo,
  reopenAdminNgo,
} from '../../services/api';
import useDebounce from '../../hooks/useDebounce';

const STATUS_OPTIONS = [
  { label: 'Pending Review (Submitted & Under Review)', value: 'PENDING' },
  { label: 'All Statuses', value: 'All' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Correction Required', value: 'CORRECTION_REQUIRED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Suspended', value: 'SUSPENDED' },
];

const CATEGORY_OPTIONS = [
  { label: 'All Categories', value: 'All' },
  { label: 'Education', value: 'EDUCATION' },
  { label: 'Healthcare', value: 'HEALTHCARE' },
  { label: 'Rural Dev', value: 'RURAL_DEV' },
  { label: 'Women Empowerment', value: 'WOMEN_EMPOWERMENT' },
  { label: 'Environment Care', value: 'ENVIRONMENT' },
  { label: 'Disaster Relief', value: 'DISASTER_RELIEF' },
  { label: 'Other', value: 'OTHER' },
];

export default function AdminNgoVerificationPage() {
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
  const [ngos, setNgos] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // In-flight cancellation and stale-response protection
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const lastExecutedQueryKeyRef = useRef(null);

  // Detail / Inspection Modal state
  const [selectedNgoId, setSelectedNgoId] = useState(urlParamId || null);
  const [inspectionData, setInspectionData] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Action States & Modals (Phase 3.3.2-I-4.2)
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');
  const [actionModal, setActionModal] = useState(null); // 'correction' | 'reject' | 'suspend' | 'unsuspend'

  // Action Form Inputs
  const [correctionInstructions, setCorrectionInstructions] = useState('');
  const [bankCorrectionRequested, setBankCorrectionRequested] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [unsuspendReason, setUnsuspendReason] = useState('');
  const [verifyCsr, setVerifyCsr] = useState(false);
  const [csrReviewNotes, setCsrReviewNotes] = useState('');
  const [govCheckOutcome, setGovCheckOutcome] = useState('VERIFIED');
  const [govCheckSource, setGovCheckSource] = useState('MCA21 / NGO Darpan / IT Portal');
  const [govCheckNotes, setGovCheckNotes] = useState('');

  // Verify Admin Role on Mount
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

  // Fetch overall Pending Verification Count
  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await getAdminNgos({ status: 'PENDING', page: 1 });
      setPendingCount(res?.count || (Array.isArray(res) ? res.length : 0));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingCount();
    }
  }, [isAdmin, fetchPendingCount]);

  // Sync URL parameter with selected NGO ID
  useEffect(() => {
    if (urlParamId) {
      setSelectedNgoId(urlParamId);
    }
  }, [urlParamId]);

  // Fetch Queue Data
  const fetchQueue = useCallback(async (searchOverride = null, forceRefresh = false) => {
    if (!isAdmin) {
      console.log('[DEBUG fetchQueue] Not admin, returning');
      return;
    }

    const rawSearch = typeof searchOverride === 'string' ? searchOverride : debouncedSearchTerm;
    const trimmedSearch = (typeof rawSearch === 'string' ? rawSearch : '').trim();

    const queryKey = JSON.stringify({
      search: trimmedSearch,
      status: statusFilter,
      category: categoryFilter,
      page: page,
    });

    if (!forceRefresh && queryKey === lastExecutedQueryKeyRef.current) {
      return;
    }
    lastExecutedQueryKeyRef.current = queryKey;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentRequestId = ++requestIdRef.current;

    setLoadingQueue(true);
    setQueueError('');

    try {
      const res = await getAdminNgos({
        search: trimmedSearch,
        status: statusFilter,
        category: categoryFilter,
        page: page,
      }, { signal: controller.signal });

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (res.results) {
        setNgos(res.results);
        setTotalCount(res.count || 0);
        if (statusFilter === 'PENDING') {
          setPendingCount(res.count || 0);
        }
        setHasNext(Boolean(res.next));
        setHasPrev(Boolean(res.previous));
      } else if (Array.isArray(res)) {
        setNgos(res);
        setTotalCount(res.length);
        if (statusFilter === 'PENDING') {
          setPendingCount(res.length);
        }
        setHasNext(false);
        setHasPrev(false);
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.isAborted) {
        lastExecutedQueryKeyRef.current = null;
        return;
      }
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      if (err.status === 401) {
        navigate('/login');
      } else if (err.status === 403) {
        setQueueError('Access Denied: Admin authorization required.');
      } else {
        setQueueError(err.message || 'Failed to load NGO verification queue.');
      }
      setNgos([]);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoadingQueue(false);
      }
    }
  }, [isAdmin, debouncedSearchTerm, statusFilter, categoryFilter, page, navigate]);

  useEffect(() => {
    fetchQueue();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      lastExecutedQueryKeyRef.current = null;
    };
  }, [fetchQueue]);

  // Fetch Detail Inspection & History Data
  const refreshInspectionPayload = useCallback(async (ngoId) => {
    if (!ngoId) return;
    setLoadingDetail(true);
    setDetailError('');
    try {
      const [detailRes, historyRes] = await Promise.all([
        getAdminNgoById(ngoId),
        getAdminNgoHistory(ngoId).catch(() => []),
      ]);

      setInspectionData(detailRes);
      if (Array.isArray(historyRes)) {
        setAuditHistory(historyRes);
      }
    } catch (err) {
      setDetailError(err.message || 'Unable to load NGO inspection payload.');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedNgoId && isAdmin) {
      refreshInspectionPayload(selectedNgoId);
    } else {
      setInspectionData(null);
      setAuditHistory([]);
    }
  }, [selectedNgoId, isAdmin, refreshInspectionPayload]);

  const handleOpenInspection = (ngoId) => {
    setSelectedNgoId(ngoId);
    setActionSuccessMsg('');
    setActionErrorMsg('');
    navigate(`/admin/ngos/${ngoId}`);
  };

  const handleCloseInspection = () => {
    setSelectedNgoId(null);
    setInspectionData(null);
    setAuditHistory([]);
    setActionSuccessMsg('');
    setActionErrorMsg('');
    setActionModal(null);
    navigate('/admin/ngos');
  };

  const handleDocDownload = async (docId) => {
    try {
      await downloadNgoDocumentFile(docId);
    } catch (err) {
      alert(err.message || 'Failed to download document.');
    }
  };

  // -------------------------------------------------------------------------
  // ADMIN STATUS ACTIONS (Phase 3.3.2-I-4.2)
  // -------------------------------------------------------------------------

  const executeActionAndRefresh = async (actionFn, payload = null, successMsg = '') => {
    if (!selectedNgoId || submittingAction) return;
    setSubmittingAction(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    try {
      if (payload !== null) {
        await actionFn(selectedNgoId, payload);
      } else {
        await actionFn(selectedNgoId);
      }

      setActionSuccessMsg(successMsg || 'Action executed successfully.');
      setActionModal(null);
      
      // Reset action modal forms
      setCorrectionInstructions('');
      setBankCorrectionRequested(false);
      setRejectionReason('');
      setSuspendReason('');
      setUnsuspendReason('');

      // Refresh inspection payload & queue
      await refreshInspectionPayload(selectedNgoId);
      fetchQueue(null, true);
      fetchPendingCount();
    } catch (err) {
      setActionErrorMsg(err.message || 'Failed to execute status action.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // 1. Start Review
  const handleStartReview = () => {
    if (!window.confirm('Start Administrative Review for this NGO application? (Status will transition from SUBMITTED to UNDER_REVIEW)')) return;
    executeActionAndRefresh(startAdminNgoReview, null, 'Review started. Status updated to UNDER_REVIEW.');
  };

  // 2. Approve NGO Submit
  const handleApproveSubmit = (e) => {
    e.preventDefault();
    executeActionAndRefresh(
      approveAdminNgo,
      { verify_csr: verifyCsr, csr_notes: csrReviewNotes.trim() },
      verifyCsr
        ? 'NGO application approved with Section 135 CSR Verification.'
        : 'NGO application approved as verified non-profit (Standard Non-CSR).'
    );
  };

  // 2b. Record Gov Check Submit
  const handleRecordGovCheckSubmit = (e) => {
    e.preventDefault();
    executeActionAndRefresh(
      recordAdminNgoGovCheck,
      {
        outcome: govCheckOutcome,
        source: govCheckSource.trim(),
        notes: govCheckNotes.trim(),
      },
      'Government verification check record updated successfully.'
    );
  };

  // 3. Request Correction Submit
  const handleRequestCorrectionSubmit = (e) => {
    e.preventDefault();
    if (!correctionInstructions.trim()) {
      setActionErrorMsg('Correction instructions are required.');
      return;
    }
    executeActionAndRefresh(requestAdminNgoCorrection, {
      correction_instructions: correctionInstructions.trim(),
      bank_correction_requested: bankCorrectionRequested,
    }, 'Correction request sent to NGO owner.');
  };

  // 4. Reject NGO Submit
  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setActionErrorMsg('Rejection reason is required.');
      return;
    }
    executeActionAndRefresh(rejectAdminNgo, {
      rejection_reason: rejectionReason.trim(),
    }, 'NGO application rejected.');
  };

  // 5. Suspend NGO Submit
  const handleSuspendSubmit = (e) => {
    e.preventDefault();
    if (!suspendReason.trim()) {
      setActionErrorMsg('Suspension reason is required.');
      return;
    }
    executeActionAndRefresh(suspendAdminNgo, {
      reason: suspendReason.trim(),
    }, 'NGO profile suspended.');
  };

  // 6. Unsuspend NGO Submit
  const handleUnsuspendSubmit = (e) => {
    e.preventDefault();
    if (!unsuspendReason.trim()) {
      setActionErrorMsg('Unsuspension reason is required.');
      return;
    }
    executeActionAndRefresh(unsuspendAdminNgo, {
      reason: unsuspendReason.trim(),
    }, 'NGO profile unsuspended.');
  };

  // 7. Reopen NGO
  const handleReopen = () => {
    if (!window.confirm('Reopen this application to DRAFT status? This will allow the NGO owner to edit and resubmit their profile.')) return;
    executeActionAndRefresh(reopenAdminNgo, null, 'Application reopened to DRAFT status.');
  };

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="py-20 flex items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full p-8 bg-slate-950 border border-slate-800 rounded-3xl text-center space-y-4">
            <span className="material-symbols-outlined text-4xl text-red-400">gavel</span>
            <h1 className="text-xl font-bold text-white">Admin Access Restricted</h1>
            <p className="text-xs text-slate-400">
              Only authenticated State Administrative Inspectors may access the NGO Verification Suite.
            </p>
            <Link to="/login" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">
              Sign In as Admin
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const status = inspectionData?.status;

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">NGO Verification & Inspection Suite</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Audit registered non-profit trusts, Darpan IDs, 12A/80G compliance, and unmasked bank account proofs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-amber-600">pending_actions</span>
              Pending Approvals: <span className="font-extrabold text-amber-900">{pendingCount}</span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              Live Verification Actions Enabled
            </div>
          </div>
        </div>

        {/* Queue Error Banner */}
        {queueError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-semibold">
            <span className="material-symbols-outlined text-xl">error</span>
            {queueError}
          </div>
        )}

        {/* Controls Bar: Search & Filters */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <form onSubmit={(e) => { e.preventDefault(); setPage(1); lastExecutedQueryKeyRef.current = null; fetchQueue(searchTerm.trim()); }} className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Search by legal name, display name, Darpan ID..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
              />
            </form>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
              <div>
                <span className="text-slate-500 mr-2 font-bold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    setStatusFilter(nextStatus);
                    setPage(1);
                    if (nextStatus === 'PENDING') {
                      searchParams.delete('status');
                      setSearchParams(searchParams, { replace: true });
                    } else {
                      setSearchParams({ ...Object.fromEntries(searchParams.entries()), status: nextStatus }, { replace: true });
                    }
                  }}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-slate-500 mr-2 font-bold">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Quick Views */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Views:</span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('PENDING');
                setPage(1);
                searchParams.delete('status');
                setSearchParams(searchParams, { replace: true });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Pending Review</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'PENDING' ? 'bg-amber-800 text-amber-100' : 'bg-slate-200 text-slate-700'}`}>
                {pendingCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('UNDER_REVIEW');
                setPage(1);
                setSearchParams({ ...Object.fromEntries(searchParams.entries()), status: 'UNDER_REVIEW' }, { replace: true });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'UNDER_REVIEW'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Under Review
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('SUBMITTED');
                setPage(1);
                setSearchParams({ ...Object.fromEntries(searchParams.entries()), status: 'SUBMITTED' }, { replace: true });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'SUBMITTED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Submitted
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('APPROVED');
                setPage(1);
                setSearchParams({ ...Object.fromEntries(searchParams.entries()), status: 'APPROVED' }, { replace: true });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Approved
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('All');
                setPage(1);
                setSearchParams({ ...Object.fromEntries(searchParams.entries()), status: 'All' }, { replace: true });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'All'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Applications
            </button>
          </div>
        </div>

        {/* Queue Table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              {statusFilter === 'PENDING' ? 'Pending Applications Verification Queue' : 'NGO Applications Directory'}
            </h2>
            <span className="text-xs text-slate-500 font-medium">Total Records: {totalCount}</span>
          </div>

          {loadingQueue ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <span className="material-symbols-outlined text-3xl text-blue-600 animate-spin">progress_activity</span>
              <p className="text-xs text-slate-500 font-semibold">Loading Admin NGO Queue...</p>
            </div>
          ) : ngos.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <span className="material-symbols-outlined text-3xl block">inbox</span>
              <p className="text-xs font-semibold">No NGO applications found matching current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold">
                    <th className="py-3 px-4">NGO Name / ID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Darpan ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ngos.map((ngo) => (
                    <tr key={ngo.id} className="hover:bg-slate-50 transition-all">
                      <td className="py-4 px-4 space-y-0.5">
                        <span className="font-bold text-slate-900 block">{ngo.display_name || ngo.legal_name}</span>
                        <span className="font-mono text-[10px] text-blue-600 font-bold">{ngo.id}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-700 font-medium">{ngo.category}</td>
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {ngo.address ? `${ngo.address.city}, ${ngo.address.district}` : '—'}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-700 font-bold">
                        <div>{ngo.legal_info?.darpan_id || '—'}</div>
                        {ngo.legal_info?.has_csr_1 && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-sans font-bold rounded">
                            CSR-1
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 space-y-1">
                        <div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            ngo.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                            ngo.status === 'SUBMITTED' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                            ngo.status === 'UNDER_REVIEW' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                            ngo.status === 'CORRECTION_REQUIRED' ? 'bg-orange-950 text-orange-300 border-orange-800' :
                            ngo.status === 'REJECTED' || ngo.status === 'SUSPENDED' ? 'bg-red-950 text-red-300 border-red-800' :
                            'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {ngo.status}
                          </span>
                        </div>
                        {ngo.verification?.gov_check_status && (
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${
                              ngo.verification.gov_check_status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              ngo.verification.gov_check_status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                              ngo.verification.gov_check_status === 'MANUAL_VERIFICATION_REQUIRED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              Gov: {ngo.verification.gov_check_status}
                            </span>
                          </div>
                        )}
                        {ngo.verification?.is_csr_verified && (
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              CSR Verified
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleOpenInspection(ngo.id)}
                          className={`px-4 py-2 font-semibold rounded-xl text-xs transition-all ${
                            ngo.status === 'UNDER_REVIEW' || ngo.status === 'SUBMITTED'
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {ngo.status === 'UNDER_REVIEW' || ngo.status === 'SUBMITTED' ? 'Review Application →' : 'Inspect & Audit'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Queue Pagination */}
          {totalCount > 12 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
              <span className="text-slate-400">Page {page} of {Math.ceil(totalCount / 12)}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={!hasPrev || page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={!hasNext}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* DETAILED INSPECTION MODAL / OVERLAY */}
        {/* ----------------------------------------------------------------- */}
        {selectedNgoId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-950 border border-slate-800 max-w-4xl w-full p-6 sm:p-8 rounded-3xl space-y-6 text-slate-200 my-8 max-h-[90vh] overflow-y-auto">
              
              {/* Inspection Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-blue-400 font-bold">{inspectionData?.id || selectedNgoId}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                      STATUS: {inspectionData?.status || 'LOADING'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {inspectionData?.display_name || inspectionData?.legal_name || 'Loading NGO Inspection Payload...'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Category: {inspectionData?.category || '—'} • Registered: {inspectionData?.year_established || '—'}
                  </p>
                </div>

                <button
                  onClick={handleCloseInspection}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold"
                >
                  ✕ Close
                </button>
              </div>

              {/* Action Banners */}
              {actionSuccessMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-semibold">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  {actionSuccessMsg}
                </div>
              )}

              {actionErrorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-semibold">
                  <span className="material-symbols-outlined text-xl">error</span>
                  {actionErrorMsg}
                </div>
              )}

              {/* Inspection Tab Navigation */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs border-b border-slate-800">
                {[
                  { id: 'profile', label: 'A. Profile' },
                  { id: 'address', label: 'B. Address' },
                  { id: 'legal', label: 'C. Legal (PAN/Darpan)' },
                  { id: 'bank', label: 'D. Bank (Unmasked)' },
                  { id: 'leadership', label: 'E. Leadership' },
                  { id: 'documents', label: 'F. Documents' },
                  { id: 'verification', label: 'G. Verification Metadata' },
                  { id: 'history', label: 'H. Audit History' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Inspection Content Body */}
              {loadingDetail ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3">
                  <span className="material-symbols-outlined text-4xl text-blue-500 animate-spin">progress_activity</span>
                  <p className="text-xs text-slate-400 font-semibold">Retrieving Full Admin Inspection Payload...</p>
                </div>
              ) : detailError ? (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs">
                  {detailError}
                </div>
              ) : inspectionData && (
                <div className="space-y-6 text-xs">
                  
                  {/* TAB A: PROFILE */}
                  {activeTab === 'profile' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">A. Profile Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                        <div><span className="text-slate-400 block">Legal Name:</span><span className="font-semibold text-white">{inspectionData.legal_name}</span></div>
                        <div><span className="text-slate-400 block">Display Name:</span><span className="font-semibold text-white">{inspectionData.display_name}</span></div>
                        <div><span className="text-slate-400 block">Gujarati Name:</span><span className="font-semibold text-white">{inspectionData.gujarati_name || '—'}</span></div>
                        <div><span className="text-slate-400 block">Category:</span><span className="font-semibold text-white">{inspectionData.category}</span></div>
                        <div><span className="text-slate-400 block">Official Email:</span><span className="font-semibold text-white">{inspectionData.official_email}</span></div>
                        <div><span className="text-slate-400 block">Official Phone:</span><span className="font-semibold text-white">{inspectionData.official_phone}</span></div>
                        <div><span className="text-slate-400 block">Year Established:</span><span className="font-semibold text-white">{inspectionData.year_established || '—'}</span></div>
                        <div><span className="text-slate-400 block">Website:</span><span className="font-semibold text-blue-400">{inspectionData.website || '—'}</span></div>
                      </div>
                      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-slate-400 block font-semibold">Description:</span>
                        <p className="text-slate-200 leading-relaxed">{inspectionData.description}</p>
                      </div>
                    </div>
                  )}

                  {/* TAB B: ADDRESS */}
                  {activeTab === 'address' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">B. Registered Address</h3>
                      {inspectionData.address ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                          <div><span className="text-slate-400 block">Line 1:</span><span className="font-semibold text-white">{inspectionData.address.address_line1}</span></div>
                          <div><span className="text-slate-400 block">Line 2:</span><span className="font-semibold text-white">{inspectionData.address.address_line2 || '—'}</span></div>
                          <div><span className="text-slate-400 block">City:</span><span className="font-semibold text-white">{inspectionData.address.city}</span></div>
                          <div><span className="text-slate-400 block">District:</span><span className="font-semibold text-white">{inspectionData.address.district}</span></div>
                          <div><span className="text-slate-400 block">State:</span><span className="font-semibold text-white">{inspectionData.address.state}</span></div>
                          <div><span className="text-slate-400 block">Pincode:</span><span className="font-semibold text-white">{inspectionData.address.pincode}</span></div>
                          <div className="sm:col-span-2"><span className="text-slate-400 block">Service Areas:</span><span className="font-semibold text-white">{inspectionData.address.service_areas || '—'}</span></div>
                        </div>
                      ) : (
                        <p className="text-slate-400 p-4 bg-slate-900 rounded-2xl">No address details submitted.</p>
                      )}
                    </div>
                  )}

                  {/* TAB C: LEGAL INFORMATION */}
                  {activeTab === 'legal' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">C. Legal & Tax Information (Admin Inspection)</h3>
                      {inspectionData.legal_info ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                          <div><span className="text-slate-400 block">Organisation Type:</span><span className="font-semibold text-white">{inspectionData.legal_info.organisation_type}</span></div>
                          <div><span className="text-slate-400 block">PAN Number (Admin Only):</span><span className="font-mono font-bold text-blue-400">{inspectionData.legal_info.pan_number}</span></div>
                          <div><span className="text-slate-400 block">Darpan ID:</span><span className="font-mono font-bold text-emerald-400">{inspectionData.legal_info.darpan_id || 'N/A'}</span></div>
                          <div><span className="text-slate-400 block">Registration No:</span><span className="font-semibold text-white">{inspectionData.legal_info.registration_number || 'N/A'}</span></div>
                          <div><span className="text-slate-400 block">Chief Trustee:</span><span className="font-semibold text-white">{inspectionData.legal_info.chief_trustee_name || '—'}</span></div>
                          <div><span className="text-slate-400 block">Trustee Designation:</span><span className="font-semibold text-white">{inspectionData.legal_info.chief_trustee_designation || '—'}</span></div>
                          <div><span className="text-slate-400 block">12A Certificate:</span><span className="font-semibold text-white">{inspectionData.legal_info.has_12a ? `Yes (${inspectionData.legal_info.twelve_a_number})` : 'No'}</span></div>
                          <div><span className="text-slate-400 block">80G Approval:</span><span className="font-semibold text-white">{inspectionData.legal_info.has_80g ? `Yes (${inspectionData.legal_info.eighty_g_number})` : 'No'}</span></div>
                          <div><span className="text-slate-400 block">Section 10(23C) Exemption:</span><span className="font-semibold text-white">{inspectionData.legal_info.has_10_23c ? `Yes (Order: ${inspectionData.legal_info.ten_23c_order_number || 'N/A'}, Sub-clause: ${inspectionData.legal_info.ten_23c_subclause || 'N/A'})` : 'No'}</span></div>
                          <div><span className="text-slate-400 block">FCRA Registration:</span><span className="font-semibold text-white">{inspectionData.legal_info.has_fcra ? `Yes (${inspectionData.legal_info.fcra_number})` : 'No'}</span></div>
                          <div><span className="text-slate-400 block">Form CSR-1 / CRN:</span><span className="font-semibold text-white">{inspectionData.legal_info.has_csr_1 ? `Yes (${inspectionData.legal_info.csr_registration_number || 'Registered'}${inspectionData.legal_info.csr_registration_date ? ` - ${inspectionData.legal_info.csr_registration_date}` : ''})` : 'No'}</span></div>
                          <div className="sm:col-span-2 pt-2 border-t border-slate-800">
                            <span className="text-slate-400 block text-xs">CSR Funding Statutory Eligibility:</span>
                            <span className={`font-semibold text-sm ${inspectionData.legal_info.is_csr_eligible ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {inspectionData.legal_info.is_csr_eligible
                                ? '✓ Eligible for Corporate CSR Funding (Trust/Society/Sec8 + CSR-1 + 12A + 80G)'
                                : '⚠ Standard Donations Only (Not eligible for CSR grants until Trust/Society/Sec 8 + CSR-1 + 12A + 80G are satisfied)'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-400 p-4 bg-slate-900 rounded-2xl">No legal information submitted.</p>
                      )}
                    </div>
                  )}

                  {/* TAB D: BANK INFORMATION (UNMASKED ADMIN VIEW) */}
                  {activeTab === 'bank' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">D. Bank Account Proofs (Unmasked Admin View)</h3>
                      {inspectionData.bank_info ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                          <div><span className="text-slate-400 block">Account Holder Name:</span><span className="font-semibold text-white">{inspectionData.bank_info.account_holder_name}</span></div>
                          <div><span className="text-slate-400 block">Full Account Number (Unmasked Admin Inspection):</span><span className="font-mono font-bold text-amber-400 text-sm">{inspectionData.bank_info.account_number}</span></div>
                          <div><span className="text-slate-400 block">IFSC Code:</span><span className="font-mono font-bold text-white">{inspectionData.bank_info.ifsc_code}</span></div>
                          <div><span className="text-slate-400 block">Bank Name:</span><span className="font-semibold text-white">{inspectionData.bank_info.bank_name}</span></div>
                          <div><span className="text-slate-400 block">Branch Name:</span><span className="font-semibold text-white">{inspectionData.bank_info.branch_name || '—'}</span></div>
                          <div><span className="text-slate-400 block">Account Type:</span><span className="font-semibold text-white">{inspectionData.bank_info.account_type}</span></div>
                        </div>
                      ) : (
                        <p className="text-slate-400 p-4 bg-slate-900 rounded-2xl">No bank information submitted.</p>
                      )}
                    </div>
                  )}

                  {/* TAB E: LEADERSHIP ROSTER */}
                  {activeTab === 'leadership' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">E. Active Leadership & Trustees</h3>
                      {inspectionData.leadership && inspectionData.leadership.length > 0 ? (
                        <div className="space-y-2">
                          {inspectionData.leadership.map((l) => (
                            <div key={l.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{l.full_name}</span>
                                  {l.is_primary_contact && <span className="px-2 py-0.5 bg-blue-950 text-blue-300 font-bold text-[9px] rounded-full border border-blue-800">Primary Contact</span>}
                                </div>
                                <p className="text-slate-400">{l.designation} • Phone: {l.phone} • Email: {l.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 p-4 bg-slate-900 rounded-2xl">No leadership records available.</p>
                      )}
                    </div>
                  )}

                  {/* TAB F: DOCUMENTS */}
                  {activeTab === 'documents' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">F. Uploaded Verification Documents</h3>
                      {inspectionData.documents && inspectionData.documents.length > 0 ? (
                        <div className="space-y-2">
                          {inspectionData.documents.map((doc) => (
                            <div key={doc.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{doc.document_type}</span>
                                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${doc.is_active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`}>
                                    {doc.is_active ? 'Active Version' : 'Replaced/Inactive'}
                                  </span>
                                </div>
                                <p className="text-slate-400 font-mono text-[11px] mt-0.5">{doc.original_filename} ({Math.round(doc.file_size_bytes / 1024)} KB)</p>
                              </div>
                              <button
                                onClick={() => handleDocDownload(doc.id)}
                                className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700"
                              >
                                Download File
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 p-4 bg-slate-900 rounded-2xl">No documents uploaded.</p>
                      )}
                    </div>
                  )}

                  {/* TAB G: VERIFICATION METADATA */}
                  {activeTab === 'verification' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">G. Verification Administrative Metadata</h3>
                      {inspectionData.verification ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                          <div><span className="text-slate-400 block">Submitted At:</span><span className="font-semibold text-white">{inspectionData.verification.submitted_at ? new Date(inspectionData.verification.submitted_at).toLocaleString() : '—'}</span></div>
                          <div><span className="text-slate-400 block">Review Started At:</span><span className="font-semibold text-white">{inspectionData.verification.review_started_at ? new Date(inspectionData.verification.review_started_at).toLocaleString() : '—'}</span></div>
                          <div><span className="text-slate-400 block">Decision At:</span><span className="font-semibold text-white">{inspectionData.verification.decision_at ? new Date(inspectionData.verification.decision_at).toLocaleString() : '—'}</span></div>
                          <div><span className="text-slate-400 block">Resubmission Count:</span><span className="font-semibold text-white">{inspectionData.verification.resubmission_count} / {inspectionData.verification.resubmission_limit}</span></div>
                          <div><span className="text-slate-400 block">Initial Gov Check Status:</span><span className={`font-mono font-bold ${
                            inspectionData.verification.gov_check_status === 'VERIFIED' ? 'text-emerald-400' :
                            inspectionData.verification.gov_check_status === 'FAILED' ? 'text-red-400' :
                            inspectionData.verification.gov_check_status === 'MANUAL_VERIFICATION_REQUIRED' ? 'text-indigo-400' : 'text-slate-300'
                          }`}>{inspectionData.verification.gov_check_status || 'NOT_STARTED'}</span></div>
                          <div><span className="text-slate-400 block">Gov Check Source:</span><span className="font-semibold text-white">{inspectionData.verification.gov_check_source || '—'} {inspectionData.verification.gov_checked_at ? `(${new Date(inspectionData.verification.gov_checked_at).toLocaleString()})` : ''}</span></div>
                          <div><span className="text-slate-400 block">Section 135 CSR Verification:</span><span className={`font-bold ${inspectionData.verification.is_csr_verified ? 'text-emerald-400' : 'text-slate-400'}`}>{inspectionData.verification.is_csr_verified ? '✓ Granted (Section 135 CSR Verified)' : 'Not Granted (Standard Non-CSR Only)'}</span></div>
                          <div><span className="text-slate-400 block">CSR Verified At:</span><span className="font-semibold text-white">{inspectionData.verification.csr_verified_at ? new Date(inspectionData.verification.csr_verified_at).toLocaleString() : '—'}</span></div>
                          {inspectionData.verification.csr_review_notes && (
                            <div className="sm:col-span-2"><span className="text-slate-400 block font-semibold">CSR Review Remarks:</span><p className="text-emerald-300 font-semibold">{inspectionData.verification.csr_review_notes}</p></div>
                          )}
                          {inspectionData.verification.gov_check_details && (
                            <div className="sm:col-span-2">
                              <span className="text-slate-400 block font-semibold">Government Check Evidence Log:</span>
                              <pre className="p-3 bg-slate-950 rounded-xl text-[11px] text-slate-300 overflow-x-auto border border-slate-800">
                                {typeof inspectionData.verification.gov_check_details === 'object'
                                  ? JSON.stringify(inspectionData.verification.gov_check_details, null, 2)
                                  : String(inspectionData.verification.gov_check_details)}
                              </pre>
                            </div>
                          )}
                          {inspectionData.verification.correction_instructions && (
                            <div className="sm:col-span-2"><span className="text-slate-400 block font-semibold">Correction Instructions:</span><p className="text-orange-300 font-semibold">{inspectionData.verification.correction_instructions}</p></div>
                          )}
                          {inspectionData.verification.rejection_reason && (
                            <div className="sm:col-span-2"><span className="text-slate-400 block font-semibold">Rejection Reason:</span><p className="text-red-400 font-semibold">{inspectionData.verification.rejection_reason}</p></div>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-400 p-4 bg-slate-900 rounded-2xl">No verification metadata available.</p>
                      )}
                    </div>
                  )}

                  {/* TAB H: AUDIT HISTORY */}
                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">H. State Machine Audit History</h3>
                      {auditHistory.length > 0 ? (
                        <div className="space-y-2">
                          {auditHistory.map((h) => (
                            <div key={h.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-blue-400">{h.previous_status || 'INITIAL'} → {h.new_status}</span>
                                <span className="text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
                              </div>
                              <p className="text-slate-300">Reason: {h.reason || 'State transition'}</p>
                              <span className="text-slate-500 block text-[10px]">Actor: {h.actor_type} ({h.performed_by_email || 'System'})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 p-4 bg-slate-900 rounded-2xl">No history records logged yet.</p>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* ACTION BAR: STATE-BASED ADMIN STATUS ACTIONS (Phase 3.3.2-I-4.2) */}
              {/* ----------------------------------------------------------------- */}
              {inspectionData && (
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Available Status Actions (Current Status: {status})
                    </span>
                    {submittingAction && (
                      <span className="text-xs text-blue-400 font-semibold animate-pulse">Executing transition...</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    
                    {/* SUBMITTED -> UNDER_REVIEW */}
                    {status === 'SUBMITTED' && (
                      <button
                        onClick={handleStartReview}
                        disabled={submittingAction}
                        className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 disabled:opacity-50 transition-all"
                      >
                        Start Administrative Review
                      </button>
                    )}

                    {/* UNDER_REVIEW -> APPROVE / CORRECTION / REJECT */}
                    {status === 'UNDER_REVIEW' && (
                      <>
                        <button
                          onClick={() => {
                            setVerifyCsr(Boolean(inspectionData?.legal_info?.is_csr_eligible));
                            setCsrReviewNotes('');
                            setActionModal('approve');
                          }}
                          disabled={submittingAction}
                          className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 disabled:opacity-50 transition-all"
                        >
                          Approve NGO Application
                        </button>
                        <button
                          onClick={() => setActionModal('correction')}
                          disabled={submittingAction}
                          className="px-5 py-2.5 bg-orange-600 text-white font-bold rounded-xl text-xs hover:bg-orange-700 disabled:opacity-50 transition-all"
                        >
                          Request Correction
                        </button>
                        <button
                          onClick={() => setActionModal('reject')}
                          disabled={submittingAction}
                          className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 disabled:opacity-50 transition-all"
                        >
                          Reject NGO Application
                        </button>
                      </>
                    )}

                    {/* Government Verification Manual Recording Action */}
                    {(status === 'SUBMITTED' || status === 'UNDER_REVIEW' || status === 'APPROVED') && (
                      <button
                        onClick={() => {
                          setGovCheckOutcome(inspectionData?.verification?.gov_check_status || 'VERIFIED');
                          setGovCheckSource(inspectionData?.verification?.gov_check_source || 'MCA21 / NGO Darpan');
                          setGovCheckNotes('');
                          setActionModal('gov_check');
                        }}
                        disabled={submittingAction}
                        className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">fact_check</span>
                        Record Gov Check
                      </button>
                    )}

                    {/* APPROVED -> SUSPEND */}
                    {status === 'APPROVED' && (
                      <button
                        onClick={() => setActionModal('suspend')}
                        disabled={submittingAction}
                        className="px-5 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 disabled:opacity-50 transition-all"
                      >
                        Suspend NGO Profile
                      </button>
                    )}

                    {/* SUSPENDED -> UNSUSPEND */}
                    {status === 'SUSPENDED' && (
                      <button
                        onClick={() => setActionModal('unsuspend')}
                        disabled={submittingAction}
                        className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 disabled:opacity-50 transition-all"
                      >
                        Unsuspend NGO Profile
                      </button>
                    )}

                    {/* REJECTED / CORRECTION_REQUIRED -> REOPEN */}
                    {(status === 'REJECTED' || status === 'CORRECTION_REQUIRED') && (
                      <button
                        onClick={handleReopen}
                        disabled={submittingAction}
                        className="px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-700 disabled:opacity-50 transition-all"
                      >
                        Reopen Application to Draft
                      </button>
                    )}

                    <div className="ml-auto">
                      <button
                        onClick={handleCloseInspection}
                        className="px-6 py-2.5 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-800"
                      >
                        Close Inspection
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* ACTION MODAL DIALOGS (Phase 3.3.2-I-4.2) */}
        {/* ----------------------------------------------------------------- */}

        {/* 1. Request Correction Modal */}
        {actionModal === 'correction' && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleRequestCorrectionSubmit} className="bg-slate-950 border border-slate-800 max-w-lg w-full p-6 rounded-3xl space-y-4 text-slate-200">
              <h3 className="text-base font-bold text-white">Request NGO Application Correction</h3>
              <p className="text-xs text-slate-400">Current Status: UNDER_REVIEW → Target Status: CORRECTION_REQUIRED</p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correction Instructions *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Specify required corrections (e.g., Update 12A certificate order number...)"
                  value={correctionInstructions}
                  onChange={(e) => setCorrectionInstructions(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={bankCorrectionRequested}
                  onChange={(e) => setBankCorrectionRequested(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Allow Bank Information Modification
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 disabled:opacity-50"
                >
                  Submit Correction Request
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. Reject Modal */}
        {actionModal === 'reject' && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleRejectSubmit} className="bg-slate-950 border border-slate-800 max-w-lg w-full p-6 rounded-3xl space-y-4 text-slate-200">
              <h3 className="text-base font-bold text-white">Reject NGO Application</h3>
              <p className="text-xs text-slate-400">Current Status: UNDER_REVIEW → Target Status: REJECTED</p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rejection Reason *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide official rejection reason..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. Suspend Modal */}
        {actionModal === 'suspend' && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleSuspendSubmit} className="bg-slate-950 border border-slate-800 max-w-lg w-full p-6 rounded-3xl space-y-4 text-slate-200">
              <h3 className="text-base font-bold text-white">Suspend NGO Profile</h3>
              <p className="text-xs text-slate-400">Current Status: APPROVED → Target Status: SUSPENDED</p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Suspension Reason *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide official suspension reason..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 disabled:opacity-50"
                >
                  Confirm Suspension
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. Unsuspend Modal */}
        {actionModal === 'unsuspend' && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleUnsuspendSubmit} className="bg-slate-950 border border-slate-800 max-w-lg w-full p-6 rounded-3xl space-y-4 text-slate-200">
              <h3 className="text-base font-bold text-white">Unsuspend NGO Profile</h3>
              <p className="text-xs text-slate-400">Current Status: SUSPENDED → Target Status: APPROVED</p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Unsuspension Reason *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide official unsuspension reason..."
                  value={unsuspendReason}
                  onChange={(e) => setUnsuspendReason(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                >
                  Confirm Unsuspension
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 5. Approve Modal with CSR Checkbox */}
        {actionModal === 'approve' && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleApproveSubmit} className="bg-slate-950 border border-slate-800 max-w-lg w-full p-6 rounded-3xl space-y-4 text-slate-200">
              <h3 className="text-base font-bold text-white">Approve NGO Application</h3>
              <p className="text-xs text-slate-400">
                Current Status: UNDER_REVIEW → Target Status: APPROVED. This activates the NGO profile and grants platform access.
              </p>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-300 block">Section 135 CSR Verification Status</span>
                <label className="flex items-start gap-3 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={verifyCsr}
                    onChange={(e) => setVerifyCsr(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Grant Section 135 CSR Verification</span>
                    <span className="text-[11px] text-slate-400 leading-relaxed block">
                      Enables the NGO to receive corporate CSR grants and participate in CSR requirements.
                      {inspectionData?.legal_info?.is_csr_eligible ? (
                        <span className="text-emerald-400 block mt-1 font-semibold">
                          ✓ Statutory criteria satisfied (Form CSR-1 registered, 3+ years established track record, 12A/80G or 10(23C)).
                        </span>
                      ) : (
                        <span className="text-amber-400 block mt-1 font-semibold">
                          ⚠ Caution: NGO has not met all statutory CSR criteria (requires 12A/80G or 10(23C), 3 years established track record, and Form CSR-1). Backend will reject CSR verification if statutory criteria are missing.
                        </span>
                      )}
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Administrative / CSR Review Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Record CSR verification or approval notes..."
                  value={csrReviewNotes}
                  onChange={(e) => setCsrReviewNotes(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submittingAction ? 'Approving...' : 'Confirm Approval'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 6. Record Gov Check Modal */}
        {actionModal === 'gov_check' && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleRecordGovCheckSubmit} className="bg-slate-950 border border-slate-800 max-w-lg w-full p-6 rounded-3xl space-y-4 text-slate-200">
              <h3 className="text-base font-bold text-white">Record Government Verification Check</h3>
              <p className="text-xs text-slate-400">
                Log authenticated government/statutory verification outcome (MCA21, NGO Darpan, Income Tax Portal).
                <br /><strong className="text-amber-300">Note: Passing this check records the initial check only; admin approval remains mandatory.</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Check Outcome *</label>
                <select
                  value={govCheckOutcome}
                  onChange={(e) => setGovCheckOutcome(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="VERIFIED">VERIFIED (Statutory credentials verified with government registry)</option>
                  <option value="FAILED">FAILED (Invalid credentials or deregistered entity)</option>
                  <option value="MANUAL_VERIFICATION_REQUIRED">MANUAL_VERIFICATION_REQUIRED (Document inspection needed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Verification Source / Registry *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MCA MCA21 CSR-1 Portal, NGO Darpan Portal"
                  value={govCheckSource}
                  onChange={(e) => setGovCheckSource(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Verification Observations & Notes</label>
                <textarea
                  rows={3}
                  placeholder="Details of registry match, CRN validation, or observations..."
                  value={govCheckNotes}
                  onChange={(e) => setGovCheckNotes(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submittingAction ? 'Recording...' : 'Save Gov Check'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
