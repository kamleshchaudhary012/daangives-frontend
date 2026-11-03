import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import NgoLayout from '../../../layouts/NgoLayout';
import {
  listNgoCsrPartnerships,
  getNgoCsrPartnershipDetail,
  uploadNgoPartnershipMou,
  createNgoCsrMilestone,
  submitNgoCsrMilestoneEvidence,
  getPartnershipFinancials,
  acknowledgeDisbursementReceipt,
  reportPartnershipExpenseWithInvoice,
} from '../../../services/api';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Partnerships' },
  { key: 'PENDING_MOU', label: 'Pending MoU' },
  { key: 'ACTIVE', label: 'Active Execution' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

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
        label: 'Active Execution',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'play_circle',
      };
    case 'PENDING_MOU':
      return {
        label: 'Pending MoU',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: 'draw',
      };
    case 'COMPLETED':
      return {
        label: 'Completed & Verified',
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

function getMilestoneStatusBadge(status) {
  switch (status) {
    case 'VERIFIED':
      return {
        label: 'Verified & Approved',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'check_circle',
      };
    case 'SUBMITTED':
      return {
        label: 'Under Review by Company',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: 'pending_actions',
      };
    case 'REVISION_REQUESTED':
      return {
        label: 'Revision Requested',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: 'assignment_return',
      };
    case 'PENDING':
    default:
      return {
        label: 'Pending Execution',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: 'schedule',
      };
  }
}

export default function NgoCsrPartnershipsPage() {
  const { id } = useParams();
  const isDetailMode = Boolean(id);

  // ---------------------------------------------------------------------------
  // LIST VIEW STATE
  // ---------------------------------------------------------------------------
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'ALL';
  const searchFilter = searchParams.get('search') || '';
  const pageFilter = parseInt(searchParams.get('page') || '1', 10);

  const [localSearch, setLocalSearch] = useState(searchFilter);
  const [partnerships, setPartnerships] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listLoading, setListLoading] = useState(!isDetailMode);
  const [listError, setListError] = useState('');

  // ---------------------------------------------------------------------------
  // DETAIL VIEW STATE
  // ---------------------------------------------------------------------------
  const [partnershipDetail, setPartnershipDetail] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [detailLoading, setDetailLoading] = useState(isDetailMode);
  const [detailError, setDetailError] = useState('');

  // MoU Upload State
  const [uploadingMou, setUploadingMou] = useState(false);
  const [mouUploadError, setMouUploadError] = useState('');
  const [mouUploadSuccess, setMouUploadSuccess] = useState('');
  const mouFileInputRef = useRef(null);

  // Create Milestone Modal State
  const [createMilestoneModalOpen, setCreateMilestoneModalOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    sequence_number: '1',
    title: '',
    description: '',
    target_completion_date: '',
    completion_percentage: '0',
  });
  const [creatingMilestone, setCreatingMilestone] = useState(false);
  const [createMilestoneError, setCreateMilestoneError] = useState('');

  // Submit Evidence Modal State
  const [selectedMilestoneForEvidence, setSelectedMilestoneForEvidence] = useState(null);
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [evidenceProgress, setEvidenceProgress] = useState('100');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [evidenceError, setEvidenceError] = useState('');

  const [actionSuccess, setActionSuccess] = useState('');
  const evidenceFileRef = useRef(null);

  // Financial Dossier State
  const [financials, setFinancials] = useState(null);

  // Disbursement Acknowledgement Modal State
  const [acknowledgingDisbursement, setAcknowledgingDisbursement] = useState(null);
  const [ackDecision, setAckDecision] = useState('ACKNOWLEDGE');
  const [ackNotes, setAckNotes] = useState('');
  const [ackFile, setAckFile] = useState(null);
  const [submittingAck, setSubmittingAck] = useState(false);
  const [ackError, setAckError] = useState('');
  const [ackSuccess, setAckSuccess] = useState('');

  // Submit Expense Modal State
  const [createExpenseModalOpen, setCreateExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('MATERIALS');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseInvoiceFile, setExpenseInvoiceFile] = useState(null);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState('');
  const [expenseSuccess, setExpenseSuccess] = useState('');

  const pageSize = 12;

  // Sync search input with URL
  useEffect(() => {
    setLocalSearch(searchFilter);
  }, [searchFilter]);

  // Fetch List
  const fetchPartnershipsList = async () => {
    setListLoading(true);
    setListError('');
    try {
      const params = {
        page: pageFilter,
        ordering: '-created_at',
      };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchFilter.trim()) params.search = searchFilter.trim();

      const res = await listNgoCsrPartnerships(params);
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
      setListError(err.message || 'Failed to load bilateral partnerships.');
    } finally {
      setListLoading(false);
    }
  };

  // Fetch Detail
  const fetchPartnershipDetail = async () => {
    if (!id) return;
    setDetailLoading(true);
    setDetailError('');
    try {
      const [res, finRes] = await Promise.all([
        getNgoCsrPartnershipDetail(id),
        getPartnershipFinancials(id, 'ngo').catch(() => null),
      ]);
      setPartnershipDetail(res);
      setMilestones(Array.isArray(res.milestones) ? res.milestones : []);
      setFinancials(finRes);
      // Suggest next sequence number
      const nextSeq = (res.milestones?.length || 0) + 1;
      setMilestoneForm((prev) => ({ ...prev, sequence_number: String(nextSeq) }));
    } catch (err) {
      setDetailError(err.message || 'Failed to load partnership workspace.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Bilateral MoU Upload Handler for NGO
  const handleNgoMouUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setMouUploadError('Only PDF documents are accepted for bilateral MoUs.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setMouUploadError('MoU file size exceeds 15 MB limit.');
      return;
    }

    setUploadingMou(true);
    setMouUploadError('');
    setMouUploadSuccess('');

    const formData = new FormData();
    formData.append('signed_mou_document', file);

    try {
      await uploadNgoPartnershipMou(partnershipDetail.id, formData);
      setMouUploadSuccess('Executed bilateral MoU uploaded successfully! Partnership is now ACTIVE.');
      fetchPartnershipDetail();
      setTimeout(() => setMouUploadSuccess(''), 5000);
    } catch (err) {
      setMouUploadError(err.message || 'Failed to upload signed MoU.');
    } finally {
      setUploadingMou(false);
      if (mouFileInputRef.current) mouFileInputRef.current.value = '';
    }
  };

  // Disbursement Acknowledgement Handler
  const handleAcknowledgeSubmit = async (e) => {
    e.preventDefault();
    if (!acknowledgingDisbursement) return;

    if (ackDecision === 'DISPUTE' && !ackNotes.trim()) {
      setAckError('Notes explaining the dispute or non-receipt are required.');
      return;
    }

    setSubmittingAck(true);
    setAckError('');
    setAckSuccess('');

    const formData = new FormData();
    formData.append('decision', ackDecision);
    if (ackNotes.trim()) formData.append('notes', ackNotes.trim());
    if (ackFile) formData.append('receipt_document', ackFile);

    try {
      await acknowledgeDisbursementReceipt(acknowledgingDisbursement.id, formData);
      setAckSuccess('Disbursement acknowledgement recorded in compliance audit ledger.');
      fetchPartnershipDetail();
      setTimeout(() => {
        setAcknowledgingDisbursement(null);
        setAckNotes('');
        setAckFile(null);
        setAckSuccess('');
      }, 1500);
    } catch (err) {
      setAckError(err.message || 'Failed to record acknowledgement.');
    } finally {
      setSubmittingAck(false);
    }
  };

  // Ground Project Expense Reporting Handler
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(expenseAmount);
    if (!expenseAmount || isNaN(amt) || amt <= 0) {
      setExpenseError('Expense amount must be a positive number.');
      return;
    }
    if (!expenseDescription.trim()) {
      setExpenseError('Expense description is required.');
      return;
    }

    setSubmittingExpense(true);
    setExpenseError('');
    setExpenseSuccess('');

    const formData = new FormData();
    formData.append('category', expenseCategory);
    formData.append('description', expenseDescription.trim());
    if (expenseVendor.trim()) formData.append('vendor_name', expenseVendor.trim());
    formData.append('amount', String(amt));
    if (expenseDate) formData.append('expense_date', expenseDate);
    if (expenseInvoiceFile) formData.append('invoice_document', expenseInvoiceFile);

    try {
      await reportPartnershipExpenseWithInvoice(partnershipDetail.id, formData);
      setExpenseSuccess('Project expense report & invoice proof submitted for corporate verification.');
      fetchPartnershipDetail();
      setTimeout(() => {
        setCreateExpenseModalOpen(false);
        setExpenseDescription('');
        setExpenseVendor('');
        setExpenseAmount('');
        setExpenseInvoiceFile(null);
        setExpenseSuccess('');
      }, 1500);
    } catch (err) {
      setExpenseError(err.message || 'Failed to submit expense report.');
    } finally {
      setSubmittingExpense(false);
    }
  };

  useEffect(() => {
    if (isDetailMode) {
      fetchPartnershipDetail();
    } else {
      fetchPartnershipsList();
    }
  }, [id, statusFilter, searchFilter, pageFilter]);

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

  // Handle Create Milestone
  const handleCreateMilestoneSubmit = async (e) => {
    e.preventDefault();
    if (creatingMilestone) return;

    const seq = parseInt(milestoneForm.sequence_number, 10);
    if (isNaN(seq) || seq < 1) {
      setCreateMilestoneError('Sequence number must be a positive integer.');
      return;
    }
    if (!milestoneForm.title.trim()) {
      setCreateMilestoneError('Milestone title is required.');
      return;
    }
    if (!milestoneForm.target_completion_date) {
      setCreateMilestoneError('Target completion date is required.');
      return;
    }

    setCreatingMilestone(true);
    setCreateMilestoneError('');

    try {
      await createNgoCsrMilestone(id, {
        sequence_number: seq,
        title: milestoneForm.title.trim(),
        description: milestoneForm.description.trim(),
        target_completion_date: milestoneForm.target_completion_date,
        completion_percentage: parseInt(milestoneForm.completion_percentage, 10) || 0,
      });

      setActionSuccess('Deliverable milestone created successfully!');
      setCreateMilestoneModalOpen(false);
      setMilestoneForm({
        sequence_number: String((milestones.length || 0) + 2),
        title: '',
        description: '',
        target_completion_date: '',
        completion_percentage: '0',
      });
      fetchPartnershipDetail();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setCreateMilestoneError(err.message || 'Failed to create deliverable milestone.');
    } finally {
      setCreatingMilestone(false);
    }
  };

  // Handle Submit Evidence
  const handleEvidenceSubmit = async (e) => {
    e.preventDefault();
    if (submittingEvidence || !selectedMilestoneForEvidence) return;

    if (!evidenceNotes.trim()) {
      setEvidenceError('Detailed execution narrative is required.');
      return;
    }
    if (!evidenceFile) {
      setEvidenceError('Ground execution evidence document (PDF or image) is required.');
      return;
    }

    setSubmittingEvidence(true);
    setEvidenceError('');

    const formData = new FormData();
    formData.append('evidence_document', evidenceFile);
    formData.append('evidence_notes', evidenceNotes.trim());
    formData.append('completion_percentage', String(parseInt(evidenceProgress, 10) || 100));

    try {
      await submitNgoCsrMilestoneEvidence(id, selectedMilestoneForEvidence.id, formData);
      setActionSuccess('Milestone deliverable evidence submitted for Corporate SPOC Review!');
      setSelectedMilestoneForEvidence(null);
      setEvidenceNotes('');
      setEvidenceFile(null);
      fetchPartnershipDetail();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setEvidenceError(err.message || 'Failed to submit milestone evidence.');
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Aggregate KPI stats for list view
  const totalAgreedCapital = partnerships.reduce(
    (sum, p) => sum + (parseFloat(p.agreed_funding_amount) || 0),
    0
  );
  const activeCount = partnerships.filter(
    (p) => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS' || p.status === 'PENDING_MOU'
  ).length;
  const completedCount = partnerships.filter((p) => p.status === 'COMPLETED').length;

  return (
    <NgoLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        {/* Global Action Toast */}
        {actionSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs sm:text-sm text-emerald-800 font-semibold flex items-center gap-2.5 shadow-xs">
            <span className="material-symbols-outlined text-emerald-700 text-lg">check_circle</span>
            {actionSuccess}
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 1: LIST VIEW */}
        {/* ------------------------------------------------------------------- */}
        {!isDetailMode && (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                  Bilateral CSR Partnerships
                </h1>
                <p className="text-sm text-on-surface-variant mt-1">
                  Manage legally executed bilateral agreements, track milestone deliverables, and report ground execution proofs.
                </p>
              </div>

              <Link
                to="/ngo/csr/requests"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container hover:bg-secondary/10 text-secondary text-xs font-bold rounded-xl border border-outline-variant transition-all"
              >
                <span className="material-symbols-outlined text-base">inbox</span>
                Review Inbound EOIs
              </Link>
            </div>

            {/* KPI Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-1">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                  Total Partnerships
                </span>
                <div className="text-2xl font-black text-on-surface">{totalCount || partnerships.length}</div>
                <div className="text-[11px] text-on-surface-variant">All contracted agreements</div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-1">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                  Active Engagements
                </span>
                <div className="text-2xl font-black text-secondary">{activeCount}</div>
                <div className="text-[11px] text-on-surface-variant">In ground execution</div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-1">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                  Completed & Verified
                </span>
                <div className="text-2xl font-black text-emerald-700">{completedCount}</div>
                <div className="text-[11px] text-on-surface-variant">Concluded CSR grants</div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-1">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                  Total Contracted Capital
                </span>
                <div className="text-2xl font-black text-on-surface">{formatCurrency(totalAgreedCapital)}</div>
                <div className="text-[11px] text-on-surface-variant">Committed grant volume</div>
              </div>
            </div>

            {/* Filter Controls & Search */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-4">
              {/* Status Filter Tabs */}
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

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-on-surface-variant text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Search by partnership code, corporate partner, or proposal title..."
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
            {listLoading && (
              <div className="space-y-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-36 bg-surface-container rounded-3xl"></div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!listLoading && listError && (
              <div className="bg-error-container/20 border border-error/30 p-8 rounded-3xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-2xl">error_outline</span>
                </div>
                <h3 className="text-base font-bold text-on-surface">Failed to load partnerships</h3>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto">{listError}</p>
                <button
                  onClick={fetchPartnershipsList}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary-container transition-all"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!listLoading && !listError && partnerships.length === 0 && (
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-container text-on-surface-variant flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">handshake</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">No Bilateral Partnerships Found</h3>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                  When you accept an incoming corporate Expression of Interest, a bilateral partnership is automatically established here for deliverable execution.
                </p>
                <Link
                  to="/ngo/csr/requests"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-secondary-container transition-all"
                >
                  <span className="material-symbols-outlined text-base">inbox</span>
                  Review Inbound EOIs
                </Link>
              </div>
            )}

            {/* Partnerships Cards List */}
            {!listLoading && !listError && partnerships.length > 0 && (
              <div className="space-y-4">
                {partnerships.map((p) => {
                  const statusInfo = getPartnershipStatusBadge(p.status);
                  const progress = Math.min(Math.round(p.progress_percentage || 0), 100);

                  return (
                    <div
                      key={p.id}
                      className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 shadow-xs hover:border-secondary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                    >
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-on-surface-variant bg-surface-container-low px-2.5 py-0.5 rounded-lg border border-outline-variant/40">
                            {p.partnership_code || `CSR-PART-${p.id.slice(0, 8)}`}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}>
                            <span className="material-symbols-outlined text-xs">{statusInfo.icon}</span>
                            {p.status_display || statusInfo.label}
                          </span>
                          {p.has_signed_mou && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <span className="material-symbols-outlined text-xs">verified</span>
                              MoU Executed
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-on-surface">
                            <Link to={`/ngo/csr/partnerships/${p.id}`} className="hover:text-secondary transition-colors">
                              {p.requirement_title || 'CSR Initiative Bilateral Agreement'}
                            </Link>
                          </h3>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Corporate Partner: <strong className="text-on-surface">{p.company_name || 'Corporate Sponsor'}</strong>
                            {p.company_city && ` • ${p.company_city}, ${p.company_state}`}
                          </p>
                        </div>

                        {/* Progress Bar & Financial Figures */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-on-surface-variant mb-1">
                              <span>Milestone Progress</span>
                              <strong>{progress}%</strong>
                            </div>
                            <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-secondary h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-on-surface-variant">Contracted Capital:</span>
                            <span className="font-black text-secondary">
                              {formatCurrency(p.agreed_funding_amount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-outline-variant/30">
                        <Link
                          to={`/ngo/csr/partnerships/${p.id}`}
                          className="w-full md:w-auto px-5 py-2.5 bg-secondary hover:bg-secondary-container text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center justify-center gap-1.5"
                        >
                          <span>Open Workspace</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-xs text-on-surface-variant font-medium">
                      Showing page {pageFilter} of {totalPages} ({totalCount} partnerships)
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
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 2: DETAIL VIEW & MILESTONE WORKSPACE */}
        {/* ------------------------------------------------------------------- */}
        {isDetailMode && (
          <div className="space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
              <Link to="/ngo/csr/partnerships" className="hover:text-secondary transition-colors">
                Bilateral Partnerships
              </Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-on-surface truncate">
                {detailLoading ? 'Partnership Workspace' : partnershipDetail?.partnership_code || 'Workspace'}
              </span>
            </div>

            {/* Detail Loading State */}
            {detailLoading && (
              <div className="space-y-6 animate-pulse">
                <div className="h-44 bg-surface-container rounded-3xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="h-28 bg-surface-container rounded-2xl"></div>
                  <div className="h-28 bg-surface-container rounded-2xl"></div>
                  <div className="h-28 bg-surface-container rounded-2xl"></div>
                </div>
                <div className="h-96 bg-surface-container rounded-3xl"></div>
              </div>
            )}

            {/* Detail Error State */}
            {!detailLoading && detailError && (
              <div className="bg-error-container/20 border border-error/30 p-8 rounded-3xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-2xl">error_outline</span>
                </div>
                <h3 className="text-base font-bold text-on-surface">Failed to load partnership workspace</h3>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto">{detailError}</p>
                <button
                  onClick={fetchPartnershipDetail}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary-container transition-all"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Retry
                </button>
              </div>
            )}

            {/* Detail Workspace Content */}
            {!detailLoading && !detailError && partnershipDetail && (
              <div className="space-y-8">
                {/* Header Hero Banner */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-xl border border-outline-variant/50">
                        {partnershipDetail.partnership_code || `CSR-PART-${partnershipDetail.id.slice(0, 8)}`}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        getPartnershipStatusBadge(partnershipDetail.status).badgeClass
                      }`}>
                        <span className="material-symbols-outlined text-sm">
                          {getPartnershipStatusBadge(partnershipDetail.status).icon}
                        </span>
                        {partnershipDetail.status_display || partnershipDetail.status}
                      </span>
                    </div>

                    <span className="text-xs text-on-surface-variant">
                      Initiated{' '}
                      {new Date(partnershipDetail.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                    {partnershipDetail.requirement_title || 'CSR Initiative Bilateral Agreement'}
                  </h1>

                  {/* Corporate Partner Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface-container-low rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center font-bold shadow-xs">
                        <span className="material-symbols-outlined text-xl">domain</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-on-surface">
                          Corporate Sponsor: {partnershipDetail.company_name || 'Corporate Partner'}
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          {partnershipDetail.company_city && `${partnershipDetail.company_city}, `}{partnershipDetail.company_state || 'India'}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-on-surface-variant sm:text-right">
                      <span className="block font-medium">Execution Horizon</span>
                      <span className="font-bold text-on-surface">
                        {partnershipDetail.execution_start_date || 'MoU Pending'} → {partnershipDetail.target_completion_date || 'TBD'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-1">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      Agreed CSR Grant Commitment
                    </span>
                    <div className="text-2xl font-black text-on-surface">
                      {formatCurrency(partnershipDetail.agreed_funding_amount)}
                    </div>
                    <div className="text-[11px] text-on-surface-variant">Total contracted funding</div>
                  </div>

                  <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-1">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      Reported Disbursed by Company
                    </span>
                    <div className="text-2xl font-black text-emerald-700">
                      {formatCurrency(partnershipDetail.disbursed_amount_reported)}
                    </div>
                    <div className="text-[11px] text-on-surface-variant">Direct corporate bank wire</div>
                  </div>

                  <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-1">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      Remaining Undisbursed
                    </span>
                    <div className="text-2xl font-black text-secondary">
                      {formatCurrency(
                        Math.max(
                          0,
                          (parseFloat(partnershipDetail.agreed_funding_amount) || 0) -
                            (parseFloat(partnershipDetail.disbursed_amount_reported) || 0)
                        )
                      )}
                    </div>
                    <div className="text-[11px] text-on-surface-variant">Tied to future milestones</div>
                  </div>
                </div>

                {/* MoU Status Card */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">draw</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-on-surface">Bilateral Memorandum of Understanding (MoU)</h3>
                      <p className="text-xs text-on-surface-variant">
                        Governing legal contract establishing project deliverables and disbursement schedule
                      </p>
                    </div>
                  </div>

                  {mouUploadSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                      {mouUploadSuccess}
                    </div>
                  )}

                  {mouUploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                      {mouUploadError}
                    </div>
                  )}

                  <div className="p-4 bg-surface-container-low rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-xl text-on-surface-variant">description</span>
                      <div>
                        <div className="text-xs font-bold text-on-surface">
                          {partnershipDetail.has_signed_mou
                            ? partnershipDetail.signed_mou_name || 'Signed_Bilateral_MoU.pdf'
                            : 'MoU Execution Pending'}
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          {partnershipDetail.has_signed_mou
                            ? 'Executed bilateral agreement on file in compliance audit ledger'
                            : 'Upload executed bilateral MoU or wait for corporate sponsor to activate'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {partnershipDetail.has_signed_mou && partnershipDetail.signed_mou_url && (
                        <a
                          href={partnershipDetail.signed_mou_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          Download MoU
                        </a>
                      )}

                      {!partnershipDetail.has_signed_mou && (
                        <div>
                          <input
                            ref={mouFileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleNgoMouUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => mouFileInputRef.current?.click()}
                            disabled={uploadingMou}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/90 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {uploadingMou ? 'sync' : 'upload_file'}
                            </span>
                            {uploadingMou ? 'Uploading...' : 'Upload Signed MoU (PDF)'}
                          </button>
                        </div>
                      )}

                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        partnershipDetail.has_signed_mou
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {partnershipDetail.has_signed_mou ? 'Active / Signed' : 'Pending MoU'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Milestones Workspace */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">fact_check</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-on-surface">Deliverable Milestones & Ground Proofs</h3>
                        <p className="text-xs text-on-surface-variant">
                          Schedule project phases and submit deliverable completion reports for corporate verification
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCreateMilestoneModalOpen(true);
                        setCreateMilestoneError('');
                      }}
                      className="px-4 py-2 bg-secondary hover:bg-secondary-container text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Add Milestone
                    </button>
                  </div>

                  {milestones.length === 0 ? (
                    <div className="p-8 bg-surface-container-low rounded-2xl text-center space-y-3">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant">post_add</span>
                      <h4 className="text-xs font-bold text-on-surface">No Milestones Scheduled Yet</h4>
                      <p className="text-[11px] text-on-surface-variant max-w-sm mx-auto">
                        Break your initiative into deliverable stages to trigger corporate grant disbursements as work progresses.
                      </p>
                      <button
                        onClick={() => setCreateMilestoneModalOpen(true)}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Schedule First Milestone
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {milestones.map((m) => {
                        const mStatus = getMilestoneStatusBadge(m.status);
                        const canSubmitEvidence = m.status === 'PENDING' || m.status === 'REVISION_REQUESTED';

                        return (
                          <div
                            key={m.id}
                            className="p-5 rounded-2xl border border-outline-variant/50 bg-surface-container-low space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-xl bg-secondary/10 text-secondary font-bold text-xs flex items-center justify-center shrink-0">
                                  #{m.sequence_number}
                                </span>
                                <h4 className="text-sm font-bold text-on-surface">{m.title}</h4>
                              </div>

                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${mStatus.badgeClass}`}>
                                <span className="material-symbols-outlined text-xs">{mStatus.icon}</span>
                                {m.status_display || mStatus.label}
                              </span>
                            </div>

                            {m.description && (
                              <p className="text-xs text-on-surface-variant leading-relaxed">
                                {m.description}
                              </p>
                            )}

                            {/* Evidence Info (if submitted) */}
                            {(m.has_evidence_document || m.evidence_notes) && (
                              <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/40 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-on-surface flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm text-secondary">attachment</span>
                                    Submitted Proof:{' '}
                                    {m.evidence_document_url ? (
                                      <a
                                        href={m.evidence_document_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-secondary underline hover:opacity-80"
                                      >
                                        {m.evidence_document_name || 'Download Report'}
                                      </a>
                                    ) : (
                                      m.evidence_document_name || 'Ground Execution Report'
                                    )}
                                  </span>
                                  <span className="text-[11px] font-bold text-secondary">
                                    Progress: {m.completion_percentage}%
                                  </span>
                                </div>

                                {m.evidence_notes && (
                                  <p className="text-xs text-on-surface-variant italic whitespace-pre-wrap">
                                    "{m.evidence_notes}"
                                  </p>
                                )}

                                {m.verified_at && (
                                  <div className="text-[11px] text-emerald-800 font-medium pt-1 border-t border-outline-variant/20">
                                    Verified on {new Date(m.verified_at).toLocaleDateString('en-IN')} by {m.verified_by_name || 'Corporate Sponsor'}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-outline-variant/20">
                              <span className="text-[11px] text-on-surface-variant">
                                Target Date: <strong className={m.is_overdue ? "text-red-600 font-bold" : ""}>{m.target_completion_date || 'Target Phase'}</strong>
                                {m.is_overdue && (
                                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                    Overdue
                                  </span>
                                )}
                              </span>

                              {canSubmitEvidence && (
                                <button
                                  onClick={() => {
                                    setSelectedMilestoneForEvidence(m);
                                    setEvidenceNotes(m.evidence_notes || '');
                                    setEvidenceProgress(String(m.completion_percentage || '100'));
                                    setEvidenceFile(null);
                                    setEvidenceError('');
                                  }}
                                  className="px-4 py-1.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-secondary-container transition-all inline-flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-sm">upload_file</span>
                                  {m.status === 'REVISION_REQUESTED' ? 'Resubmit Evidence' : 'Submit Evidence'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section: Inbound Corporate Bank Disbursements & NGO Acknowledgement */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">account_balance</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-on-surface">Corporate Bank Wire Disbursements</h3>
                        <p className="text-xs text-on-surface-variant">
                          Direct Section 135 corporate wires — Acknowledge bank receipt or report discrepancies
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-on-surface-variant">
                      Total Acknowledged: {formatCurrency(financials?.ngo_acknowledged_disbursements?.total_amount || 0)}
                    </span>
                  </div>

                  {financials?.disbursements && financials.disbursements.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-outline-variant/50">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-surface-container-low text-[10px] uppercase font-bold text-on-surface-variant border-b border-outline-variant/40">
                          <tr>
                            <th className="py-3 px-4">Date & Ref</th>
                            <th className="py-3 px-4">Originating Bank</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Bank Advice</th>
                            <th className="py-3 px-4">Verification</th>
                            <th className="py-3 px-4">Acknowledgement</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/30">
                          {financials.disbursements.map((d) => (
                            <tr key={d.id} className="hover:bg-surface-container-low/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-on-surface">{d.disbursement_date}</div>
                                <div className="font-mono text-[10px] text-on-surface-variant">{d.payment_reference || 'Ref Pending'}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-on-surface">{d.bank_name || 'Bank Wire'}</div>
                                <div className="text-[10px] text-on-surface-variant">{d.payment_mode_display || d.payment_mode}</div>
                              </td>
                              <td className="py-3 px-4 font-bold text-emerald-700">
                                {formatCurrency(d.amount)}
                              </td>
                              <td className="py-3 px-4">
                                {d.evidence_document_url ? (
                                  <a
                                    href={d.evidence_document_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                                  >
                                    <span className="material-symbols-outlined text-xs">description</span>
                                    Advice PDF
                                  </a>
                                ) : (
                                  <span className="text-on-surface-variant/60 text-[10px]">No file</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  d.review_status === 'VERIFIED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : d.review_status === 'REJECTED'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {d.review_status_display || d.review_status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  d.ngo_acknowledgement_status === 'ACKNOWLEDGED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : d.ngo_acknowledgement_status === 'DISPUTED'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  {d.ngo_acknowledgement_status_display || d.ngo_acknowledgement_status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                {d.ngo_acknowledgement_status === 'PENDING' && (
                                  <button
                                    onClick={() => {
                                      setAcknowledgingDisbursement(d);
                                      setAckDecision('ACKNOWLEDGE');
                                      setAckNotes('');
                                      setAckFile(null);
                                      setAckError('');
                                      setAckSuccess('');
                                    }}
                                    className="px-3 py-1 bg-emerald-700 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-800 transition-colors shadow-xs"
                                  >
                                    Acknowledge
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-container-low rounded-2xl text-center text-xs text-on-surface-variant">
                      No corporate bank disbursements reported yet.
                    </div>
                  )}
                </div>

                {/* Section: Ground Project Expenditures & Invoices */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">receipt_long</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-on-surface">Ground Project Expenditures</h3>
                        <p className="text-xs text-on-surface-variant">
                          Submit itemized vendor expenditures, materials procurement, and field invoices
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCreateExpenseModalOpen(true);
                        setExpenseError('');
                        setExpenseSuccess('');
                      }}
                      className="px-4 py-2 bg-secondary hover:bg-secondary-container text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Submit Project Expense
                    </button>
                  </div>

                  {financials?.expenses && financials.expenses.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-outline-variant/50">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-surface-container-low text-[10px] uppercase font-bold text-on-surface-variant border-b border-outline-variant/40">
                          <tr>
                            <th className="py-3 px-4">Date & Category</th>
                            <th className="py-3 px-4">Vendor & Description</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Invoice Voucher</th>
                            <th className="py-3 px-4">Corporate Audit Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/30">
                          {financials.expenses.map((exp) => (
                            <tr key={exp.id} className="hover:bg-surface-container-low/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-on-surface">{exp.expense_date}</div>
                                <div className="text-[10px] text-on-surface-variant">{exp.category_display || exp.category}</div>
                              </td>
                              <td className="py-3 px-4 max-w-xs">
                                <div className="font-semibold text-on-surface truncate">{exp.vendor_name || 'Direct Vendor'}</div>
                                <div className="text-[11px] text-on-surface-variant line-clamp-1">{exp.description}</div>
                              </td>
                              <td className="py-3 px-4 font-bold text-on-surface">
                                {formatCurrency(exp.amount)}
                              </td>
                              <td className="py-3 px-4">
                                {exp.invoice_document_url ? (
                                  <a
                                    href={exp.invoice_document_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                                  >
                                    <span className="material-symbols-outlined text-xs">receipt</span>
                                    View Invoice
                                  </a>
                                ) : (
                                  <span className="text-on-surface-variant/60 text-[10px]">No invoice file</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  exp.review_status === 'VERIFIED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : exp.review_status === 'REJECTED'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {exp.review_status_display || exp.review_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-container-low rounded-2xl text-center text-xs text-on-surface-variant">
                      No ground project expenditures recorded yet. Click &ldquo;Submit Project Expense&rdquo; to log field vendor vouchers.
                    </div>
                  )}
                </div>

                {/* Section: Financial Reconciliation Dossier */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">balance</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-on-surface">Financial Reconciliation Summary</h3>
                        <p className="text-xs text-on-surface-variant">
                          Audit ledger cross-referencing grant commitment, corporate wire receipts, and ground expenditure
                        </p>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      financials?.is_reconciled
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {financials?.is_reconciled
                        ? 'Fully Reconciled'
                        : (financials?.financial_status_display || financials?.financial_status?.replace(/_/g, ' ') || 'Reconciliation In Progress')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 bg-surface-container-low rounded-2xl space-y-1">
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Committed Grant</span>
                      <div className="text-base font-bold text-on-surface">{formatCurrency(financials?.commitment?.amount || partnershipDetail.agreed_funding_amount)}</div>
                    </div>
                    <div className="p-3.5 bg-surface-container-low rounded-2xl space-y-1">
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Company Reported</span>
                      <div className="text-base font-bold text-on-surface">{formatCurrency(financials?.reported_disbursements?.total_amount || 0)}</div>
                    </div>
                    <div className="p-3.5 bg-surface-container-low rounded-2xl space-y-1">
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold block">NGO Confirmed</span>
                      <div className="text-base font-bold text-emerald-700">{formatCurrency(financials?.ngo_acknowledged_disbursements?.total_amount || 0)}</div>
                    </div>
                    <div className="p-3.5 bg-surface-container-low rounded-2xl space-y-1">
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Verified Ground Expenses</span>
                      <div className="text-base font-bold text-purple-700">{formatCurrency(financials?.verified_expenses?.total_amount || 0)}</div>
                    </div>
                  </div>

                  {!financials?.is_reconciled && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-900 dark:text-amber-200">
                      <strong>Audit Note:</strong> {financials?.explanation || financials?.unreconciled_discrepancies?.explanation || 'Pending documentary verification and reconciliation.'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* ACKNOWLEDGE DISBURSEMENT MODAL */}
        {/* ------------------------------------------------------------------- */}
        {acknowledgingDisbursement && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">Acknowledge Bank Wire</h3>
                    <p className="text-xs text-on-surface-variant">Confirm receipt of corporate grant transfer</p>
                  </div>
                </div>
                <button
                  onClick={() => setAcknowledgingDisbursement(null)}
                  disabled={submittingAck}
                  className="w-8 h-8 rounded-full bg-surface-container text-on-surface hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {ackSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                  {ackSuccess}
                </div>
              )}

              {ackError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                  {ackError}
                </div>
              )}

              <form onSubmit={handleAcknowledgeSubmit} className="space-y-4">
                <div className="p-3.5 bg-surface-container-low rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Reported Amount:</span>
                    <strong className="text-emerald-700 font-bold">{formatCurrency(acknowledgingDisbursement.amount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Payment Mode & Ref:</span>
                    <span className="font-mono text-on-surface">{acknowledgingDisbursement.payment_mode} — {acknowledgingDisbursement.payment_reference || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-2">Acknowledgement Decision</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      onClick={() => setAckDecision('ACKNOWLEDGE')}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                        ackDecision === 'ACKNOWLEDGE'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-600'
                          : 'border-outline-variant hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <input
                        type="radio"
                        name="ack_decision"
                        value="ACKNOWLEDGE"
                        checked={ackDecision === 'ACKNOWLEDGE'}
                        onChange={() => {}}
                        className="rounded text-emerald-600"
                      />
                      <div className="text-xs font-bold">Confirmed Credited</div>
                    </label>

                    <label
                      onClick={() => setAckDecision('DISPUTE')}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                        ackDecision === 'DISPUTE'
                          ? 'border-red-600 bg-red-50/70 text-red-900 ring-1 ring-red-600'
                          : 'border-outline-variant hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <input
                        type="radio"
                        name="ack_decision"
                        value="DISPUTE"
                        checked={ackDecision === 'DISPUTE'}
                        onChange={() => {}}
                        className="rounded text-red-600"
                      />
                      <div className="text-xs font-bold">Dispute / Not Received</div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Receipt Acknowledgment Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={ackNotes}
                    onChange={(e) => setAckNotes(e.target.value)}
                    placeholder="Bank statement credit verified on date..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-outline-variant bg-surface-container-low focus:border-secondary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Bank Credit Advice / Receipt PDF (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setAckFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-surface-container file:text-on-surface hover:file:bg-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => setAcknowledgingDisbursement(null)}
                    disabled={submittingAck}
                    className="px-4 py-2 bg-surface-container hover:bg-slate-200 text-on-surface text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAck}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {submittingAck ? 'sync' : 'done'}
                    </span>
                    {submittingAck ? 'Saving...' : 'Submit Acknowledgement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* SUBMIT EXPENSE MODAL */}
        {/* ------------------------------------------------------------------- */}
        {createExpenseModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">receipt_long</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">Submit Ground Project Expense</h3>
                    <p className="text-xs text-on-surface-variant">Log project expenditures with commercial vendor invoices</p>
                  </div>
                </div>
                <button
                  onClick={() => setCreateExpenseModalOpen(false)}
                  disabled={submittingExpense}
                  className="w-8 h-8 rounded-full bg-surface-container text-on-surface hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {expenseSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                  {expenseSuccess}
                </div>
              )}

              {expenseError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                  {expenseError}
                </div>
              )}

              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Expense Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-xs border border-outline-variant bg-surface-container-low focus:border-secondary"
                    >
                      <option value="MATERIALS">Raw Materials & Goods</option>
                      <option value="EQUIPMENT">Equipment & Assets</option>
                      <option value="FIELD_LOGISTICS">Field Logistics & Transport</option>
                      <option value="COMMUNITY_RELIEF">Community Direct Relief</option>
                      <option value="STAFF_TRAINING">Staff & Field Training</option>
                      <option value="OTHER">Other Ground Cost</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Amount (₹ INR) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="e.g. 45000"
                      className="w-full px-3.5 py-2 rounded-xl text-xs border border-outline-variant bg-surface-container-low focus:border-secondary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Vendor / Contractor Name
                    </label>
                    <input
                      type="text"
                      value={expenseVendor}
                      onChange={(e) => setExpenseVendor(e.target.value)}
                      placeholder="e.g. ABC Solar Supplies Ltd."
                      className="w-full px-3.5 py-2 rounded-xl text-xs border border-outline-variant bg-surface-container-low focus:border-secondary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Expense Date
                    </label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-xs border border-outline-variant bg-surface-container-low focus:border-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Description & Purpose <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    placeholder="Procurement of water filtration filters for Phase 1 distribution..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-outline-variant bg-surface-container-low focus:border-secondary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Vendor Invoice / Payment Receipt (PDF/Image)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setExpenseInvoiceFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-surface-container file:text-on-surface hover:file:bg-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => setCreateExpenseModalOpen(false)}
                    disabled={submittingExpense}
                    className="px-4 py-2 bg-surface-container hover:bg-slate-200 text-on-surface text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingExpense || !expenseAmount || !expenseDescription}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-secondary hover:bg-secondary-container text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {submittingExpense ? 'sync' : 'check'}
                    </span>
                    {submittingExpense ? 'Submitting...' : 'Submit Expense Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* CREATE MILESTONE MODAL */}
        {/* ------------------------------------------------------------------- */}
        {createMilestoneModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">add_task</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">Schedule Deliverable Milestone</h3>
                    <p className="text-xs text-on-surface-variant">Add new implementation phase</p>
                  </div>
                </div>
                <button
                  onClick={() => setCreateMilestoneModalOpen(false)}
                  disabled={creatingMilestone}
                  className="w-8 h-8 rounded-full bg-surface-container text-on-surface hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {createMilestoneError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                  {createMilestoneError}
                </div>
              )}

              <form onSubmit={handleCreateMilestoneSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Sequence #</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={milestoneForm.sequence_number}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, sequence_number: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-secondary"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Target Completion Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={milestoneForm.target_completion_date}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, target_completion_date: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Milestone Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={milestoneForm.title}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                    placeholder="e.g. Phase 1: Site Survey & Procurement"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-secondary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Deliverable Scope Description</label>
                  <textarea
                    rows={3}
                    value={milestoneForm.description}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                    placeholder="Specify physical ground deliverables, beneficiary headcounts, and verified outcomes expected..."
                    className="w-full px-3.5 py-2 text-xs border border-outline-variant bg-surface-container-low focus:border-secondary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => setCreateMilestoneModalOpen(false)}
                    disabled={creatingMilestone}
                    className="px-4 py-2 bg-surface-container hover:bg-slate-200 text-on-surface text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingMilestone}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-secondary-container disabled:opacity-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {creatingMilestone ? 'sync' : 'add'}
                    </span>
                    {creatingMilestone ? 'Scheduling...' : 'Save Milestone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* SUBMIT EVIDENCE MODAL */}
        {/* ------------------------------------------------------------------- */}
        {selectedMilestoneForEvidence && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40">
                <div>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Ground Evidence Submission
                  </span>
                  <h3 className="text-base font-bold text-on-surface mt-0.5">
                    #{selectedMilestoneForEvidence.sequence_number}: {selectedMilestoneForEvidence.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedMilestoneForEvidence(null)}
                  disabled={submittingEvidence}
                  className="w-8 h-8 rounded-full bg-surface-container text-on-surface hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {evidenceError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                  {evidenceError}
                </div>
              )}

              <form onSubmit={handleEvidenceSubmit} className="space-y-4">
                {/* Progress Percentage */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Cumulative Completion Percentage (% 1–100) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={evidenceProgress}
                    onChange={(e) => setEvidenceProgress(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-secondary"
                  />
                </div>

                {/* Evidence File Picker */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Ground Evidence Document / Completion Report (PDF or Image) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    ref={evidenceFileRef}
                    required
                    accept=".pdf,application/pdf,image/*"
                    onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-secondary file:text-white hover:file:bg-secondary-container"
                  />
                  {evidenceFile && (
                    <span className="text-[11px] text-secondary font-medium mt-1 block">
                      Selected: {evidenceFile.name} ({(evidenceFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                {/* Execution Notes */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Narrative Summary of Work Completed <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={evidenceNotes}
                    onChange={(e) => setEvidenceNotes(e.target.value)}
                    placeholder="Describe field activities undertaken, deliverable counts achieved, and outcomes observed on the ground..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-secondary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => setSelectedMilestoneForEvidence(null)}
                    disabled={submittingEvidence}
                    className="px-4 py-2 bg-surface-container hover:bg-slate-200 text-on-surface text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEvidence || !evidenceFile}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-secondary-container disabled:opacity-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {submittingEvidence ? 'sync' : 'upload_file'}
                    </span>
                    {submittingEvidence ? 'Submitting Proof...' : 'Submit Evidence'}
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
