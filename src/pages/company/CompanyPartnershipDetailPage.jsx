import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import CompanyLayout from '../../layouts/CompanyLayout';
import {
  getCompanyPartnershipDetail,
  uploadPartnershipMou,
  reportPartnershipDisbursement,
  recordPartnershipDisbursementWithEvidence,
  getPartnershipFinancials,
  reviewExpenseProof,
  listPartnershipMilestones,
  reviewMilestone,
  listPartnershipGrantChanges,
  reviewGrantChangeCompany,
} from '../../services/api';

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
        label: 'Active & In Execution',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'play_circle',
      };
    case 'PENDING_MOU':
      return {
        label: 'Pending MoU Execution',
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
        label: 'Submitted for Review',
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
        label: 'Pending Ground Execution',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: 'schedule',
      };
  }
}

function getFinancialStatusBadge(status) {
  switch (status) {
    case 'RECONCILED':
      return {
        label: 'Financially Reconciled',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        icon: 'verified',
      };
    case 'NOT_DISBURSED':
      return {
        label: 'Awaiting Initial Disbursement — Not Yet Reconciled',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
        icon: 'pending',
      };
    case 'PARTIALLY_DISBURSED':
      return {
        label: 'Partially Disbursed',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
        icon: 'incomplete_circle',
      };
    case 'DISBURSEMENT_REPORTED':
      return {
        label: 'Disbursement Reported (Pending Evidence Review)',
        badgeClass: 'bg-sky-50 text-sky-800 border-sky-300',
        icon: 'hourglass_top',
      };
    case 'AWAITING_EVIDENCE':
      return {
        label: 'Awaiting Payment Evidence',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
        icon: 'receipt_long',
      };
    case 'AWAITING_NGO_ACKNOWLEDGEMENT':
      return {
        label: 'Awaiting NGO Acknowledgement',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
        icon: 'mark_email_unread',
      };
    case 'DISPUTED':
      return {
        label: 'Disputed Disbursement / Mismatch',
        badgeClass: 'bg-red-50 text-red-800 border-red-300',
        icon: 'warning',
      };
    case 'OVERDUE':
      return {
        label: 'Overdue Commitment',
        badgeClass: 'bg-red-50 text-red-800 border-red-300',
        icon: 'alarm',
      };
    case 'PENDING_RECONCILIATION':
    default:
      return {
        label: 'Discrepancy Pending Reconciliation',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
        icon: 'rule',
      };
  }
}

export default function CompanyPartnershipDetailPage() {
  const { id } = useParams();

  const [partnership, setPartnership] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [is404, setIs404] = useState(false);

  // MoU Upload State
  const [uploadingMou, setUploadingMou] = useState(false);
  const [mouSuccess, setMouSuccess] = useState('');
  const [mouError, setMouError] = useState('');
  const mouInputRef = useRef(null);

  // Financial Dossier State
  const [financials, setFinancials] = useState(null);

  // Disbursement Modal State
  const [disbursementModalOpen, setDisbursementModalOpen] = useState(false);
  const [disbursementAmount, setDisbursementAmount] = useState('');
  const [disbursementRef, setDisbursementRef] = useState('');
  const [disbursementBank, setDisbursementBank] = useState('');
  const [disbursementMode, setDisbursementMode] = useState('NEFT');
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().slice(0, 10));
  const [disbursementNotes, setDisbursementNotes] = useState('');
  const [disbursementFile, setDisbursementFile] = useState(null);
  const [submittingDisbursement, setSubmittingDisbursement] = useState(false);
  const [disbursementSuccess, setDisbursementSuccess] = useState('');
  const [disbursementError, setDisbursementError] = useState('');

  // Milestone Review Modal State
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('VERIFY');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Expense Review Modal State
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseDecision, setExpenseDecision] = useState('VERIFY');
  const [expenseReviewNotes, setExpenseReviewNotes] = useState('');
  const [submittingExpenseReview, setSubmittingExpenseReview] = useState(false);
  const [expenseReviewSuccess, setExpenseReviewSuccess] = useState('');
  const [expenseReviewError, setExpenseReviewError] = useState('');

  // Bilateral Grant Change Review Modal State
  const [selectedGrantChange, setSelectedGrantChange] = useState(null);
  const [grantChangeDecision, setGrantChangeDecision] = useState('APPROVE');
  const [grantChangeReviewNotes, setGrantChangeReviewNotes] = useState('');
  const [submittingGrantChangeReview, setSubmittingGrantChangeReview] = useState(false);
  const [grantChangeReviewSuccess, setGrantChangeReviewSuccess] = useState('');
  const [grantChangeReviewError, setGrantChangeReviewError] = useState('');

  const fetchPartnershipDossier = async () => {
    setLoading(true);
    setError('');
    setIs404(false);
    try {
      const [partRes, mileRes, finRes] = await Promise.all([
        getCompanyPartnershipDetail(id),
        listPartnershipMilestones(id).catch(() => []),
        getPartnershipFinancials(id).catch(() => null),
      ]);
      setPartnership(partRes);
      setMilestones(Array.isArray(mileRes) ? mileRes : []);
      setFinancials(finRes);
    } catch (err) {
      if (err.status === 404 || err.message?.includes('404') || err.message?.includes('not found')) {
        setIs404(true);
      } else {
        setError(err.message || 'Failed to load bilateral CSR partnership dossier.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnershipDossier();
  }, [id]);

  // MoU Upload Handler
  const handleMouUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setMouError('Only PDF documents are accepted for bilateral MoUs.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setMouError('MoU file size exceeds 15 MB limit.');
      return;
    }

    setMouError('');
    setMouSuccess('');
    setUploadingMou(true);

    const formData = new FormData();
    formData.append('signed_mou_document', file);

    try {
      const updated = await uploadPartnershipMou(id, formData);
      setPartnership(updated);
      setMouSuccess('Bilateral MoU uploaded successfully! Partnership is now ACTIVE.');
      fetchPartnershipDossier();
      setTimeout(() => setMouSuccess(''), 5000);
    } catch (err) {
      setMouError(err.message || 'Failed to upload signed MoU document.');
    } finally {
      setUploadingMou(false);
      if (mouInputRef.current) mouInputRef.current.value = '';
    }
  };

  // Disbursement Reporting Handler with Bank Transfer Proof
  const handleReportDisbursement = async (e) => {
    e.preventDefault();
    const amount = Number(disbursementAmount);
    if (!disbursementAmount || isNaN(amount) || amount <= 0) {
      setDisbursementError('Disbursed amount must be a positive number.');
      return;
    }

    setSubmittingDisbursement(true);
    setDisbursementError('');
    setDisbursementSuccess('');

    const formData = new FormData();
    formData.append('amount', String(amount));
    if (disbursementRef.trim()) formData.append('payment_reference', disbursementRef.trim());
    if (disbursementBank.trim()) formData.append('bank_name', disbursementBank.trim());
    formData.append('payment_mode', disbursementMode);
    if (disbursementDate) formData.append('disbursement_date', disbursementDate);
    if (disbursementNotes.trim()) formData.append('disbursement_notes', disbursementNotes.trim());
    if (disbursementFile) formData.append('evidence_document', disbursementFile);

    try {
      await recordPartnershipDisbursementWithEvidence(id, formData);
      setDisbursementSuccess('Bank wire disbursement & transfer evidence recorded in audit ledger.');
      fetchPartnershipDossier();
      setTimeout(() => {
        setDisbursementModalOpen(false);
        setDisbursementAmount('');
        setDisbursementRef('');
        setDisbursementBank('');
        setDisbursementNotes('');
        setDisbursementFile(null);
        setDisbursementSuccess('');
      }, 2000);
    } catch (err) {
      setDisbursementError(err.message || 'Failed to record bank disbursement.');
    } finally {
      setSubmittingDisbursement(false);
    }
  };

  // Expense Review Decision Handler
  const handleExpenseReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExpense) return;
    setSubmittingExpenseReview(true);
    setExpenseReviewError('');
    setExpenseReviewSuccess('');

    try {
      await reviewExpenseProof(selectedExpense.id, {
        decision: expenseDecision,
        review_notes: expenseReviewNotes.trim(),
      });
      setExpenseReviewSuccess('Ground project expense decision recorded.');
      fetchPartnershipDossier();
      setTimeout(() => {
        setSelectedExpense(null);
        setExpenseReviewNotes('');
        setExpenseReviewSuccess('');
      }, 1500);
    } catch (err) {
      setExpenseReviewError(err.message || 'Failed to record expense review decision.');
    } finally {
      setSubmittingExpenseReview(false);
    }
  };

  // Milestone Review Decision Handler
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewDecision === 'REQUEST_REVISION' && !reviewNotes.trim()) {
      setReviewError('Revision feedback notes are required when requesting revisions.');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      await reviewMilestone(id, selectedMilestone.id, {
        decision: reviewDecision,
        notes: reviewNotes.trim(),
      });
      setReviewSuccess(`Milestone successfully ${reviewDecision === 'VERIFY' ? 'verified' : 'marked for revision'}!`);
      setTimeout(() => {
        setSelectedMilestone(null);
        setReviewNotes('');
        setReviewSuccess('');
        fetchPartnershipDossier();
      }, 1500);
    } catch (err) {
      setReviewError(err.message || 'Failed to submit milestone review decision.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Bilateral Grant Change Corporate Review Decision Handler
  const handleGrantChangeReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGrantChange) return;
    setSubmittingGrantChangeReview(true);
    setGrantChangeReviewError('');
    setGrantChangeReviewSuccess('');

    try {
      await reviewGrantChangeCompany(id, selectedGrantChange.id, {
        decision: grantChangeDecision,
        review_notes: grantChangeReviewNotes.trim(),
      });
      setGrantChangeReviewSuccess(
        `Grant change request ${grantChangeDecision === 'APPROVE' ? 'approved' : 'rejected'} successfully.`
      );
      setTimeout(() => {
        setSelectedGrantChange(null);
        setGrantChangeReviewNotes('');
        setGrantChangeReviewSuccess('');
        fetchPartnershipDossier();
      }, 1500);
    } catch (err) {
      setGrantChangeReviewError(err.message || 'Failed to record grant change decision.');
    } finally {
      setSubmittingGrantChangeReview(false);
    }
  };

  const agreed = Number(financials?.commitment?.amount || partnership?.agreed_funding_amount) || 0;
  const disbursed = Number(financials?.reported_disbursements?.total_amount || partnership?.disbursed_amount_reported) || 0;
  const verifiedDisbursed = Number(financials?.verified_disbursements?.total_amount) || 0;
  const ngoAcknowledged = Number(financials?.ngo_acknowledged_disbursements?.total_amount) || 0;
  const verifiedExpenses = Number(financials?.verified_expenses?.total_amount) || 0;
  const remaining = financials?.outstanding_commitment !== undefined
    ? Number(financials.outstanding_commitment)
    : Math.max(0, agreed - disbursed);
  const statusInfo = getPartnershipStatusBadge(partnership?.status);
  const finStatusInfo = getFinancialStatusBadge(
    financials?.financial_status || (financials?.is_reconciled ? 'RECONCILED' : 'NOT_DISBURSED')
  );

  return (
    <CompanyLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
          <Link to="/company/partnerships" className="hover:text-primary transition-colors">
            Bilateral Partnerships
          </Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-on-surface truncate">
            {loading ? 'Partnership Dossier' : partnership?.partnership_code || 'Dossier'}
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 bg-surface-container rounded-3xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="h-28 bg-surface-container rounded-2xl"></div>
              <div className="h-28 bg-surface-container rounded-2xl"></div>
              <div className="h-28 bg-surface-container rounded-2xl"></div>
            </div>
            <div className="h-80 bg-surface-container rounded-3xl"></div>
          </div>
        )}

        {/* 404 Not Found State */}
        {!loading && is404 && (
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-container text-on-surface-variant flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">handshake</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface">Partnership Dossier Not Found</h2>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              The requested partnership either does not exist or your corporate account is not an authorized bilateral participant.
            </p>
            <Link
              to="/company/partnerships"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-container transition-all"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Partnerships
            </Link>
          </div>
        )}

        {/* Error State */}
        {!loading && !is404 && error && (
          <div className="bg-error-container/20 border border-error/30 p-8 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">error_outline</span>
            </div>
            <h3 className="text-base font-bold text-on-surface">Failed to load partnership</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchPartnershipDossier}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container transition-all"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Retry
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !is404 && !error && partnership && (
          <div className="space-y-8">
            {/* Header Hero Banner */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    {partnership.partnership_code || `CSR-PART-${partnership.id.slice(0, 8)}`}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${statusInfo.badgeClass}`}>
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">{statusInfo.icon}</span>
                    {partnership.status_display || statusInfo.label}
                  </span>
                </div>

                <span className="text-xs text-slate-500">
                  Initiated{' '}
                  {new Date(partnership.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {partnership.requirement_title || 'CSR Initiative Bilateral Agreement'}
              </h1>

              {/* NGO Partner Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-base" aria-hidden="true">handshake</span>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      Partner NGO: {partnership.ngo_display_name || partnership.ngo_legal_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {partnership.ngo_legal_name}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-500 sm:text-right">
                  <span className="block font-medium">Execution Horizon</span>
                  <span className="font-semibold text-slate-800">
                    {partnership.execution_start_date || 'MoU Pending'} → {partnership.target_completion_date || 'TBD'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                  Approved Capital Commitment
                </span>
                <div className="text-2xl font-bold text-slate-900">{formatCurrency(agreed)}</div>
                <div className="text-[11px] text-slate-500">Contracted bilateral grant</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                  Reported Disbursed
                </span>
                <div className="text-2xl font-bold text-emerald-700">{formatCurrency(disbursed)}</div>
                <div className="text-[11px] text-slate-500">
                  Evidence Reviewed: <strong className="text-emerald-700 font-semibold">{formatCurrency(verifiedDisbursed)}</strong>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                    Outstanding Commitment
                  </span>
                  <span className={`inline-flex items-center gap-1 font-semibold ${finStatusInfo.badgeClass} px-2 py-0.5 rounded text-[10px]`}>
                    <span className="material-symbols-outlined text-[11px]" aria-hidden="true">{finStatusInfo.icon}</span>
                    {finStatusInfo.label.split('—')[0].trim()}
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{formatCurrency(remaining)}</div>
                <div className="text-[11px] text-slate-500">
                  NGO Acknowledged: <strong className="text-slate-800 font-semibold">{formatCurrency(ngoAcknowledged)}</strong>
                </div>
              </div>
            </div>

            {/* Section C: Bilateral MoU Governance */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">draw</span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Bilateral Memorandum of Understanding (MoU)</h3>
                    <p className="text-xs text-slate-500">
                      Statutory Section 135 bilateral contract governing project deliverables and disbursement schedule
                    </p>
                  </div>
                </div>

                {partnership.has_signed_mou && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">check_circle</span>
                    MoU Executed
                  </span>
                )}
              </div>

              {mouSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-600" aria-hidden="true">check_circle</span>
                  {mouSuccess}
                </div>
              )}

              {mouError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-rose-600" aria-hidden="true">error</span>
                  {mouError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">picture_as_pdf</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {partnership.has_signed_mou
                        ? partnership.signed_mou_name || 'Signed_Bilateral_MoU.pdf'
                        : 'No signed MoU uploaded yet'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {partnership.has_signed_mou
                        ? 'Legally executed bilateral contract on file'
                        : 'Upload bilateral PDF to transition partnership to ACTIVE'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {partnership.has_signed_mou && partnership.signed_mou_url && (
                    <a
                      href={partnership.signed_mou_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">download</span>
                      Download MoU (PDF)
                    </a>
                  )}

                  {partnership.status === 'PENDING_MOU' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={mouInputRef}
                        onChange={handleMouUpload}
                        accept=".pdf,application/pdf"
                        className="hidden"
                        disabled={uploadingMou}
                      />
                      <button
                        type="button"
                        onClick={() => mouInputRef.current?.click()}
                        disabled={uploadingMou}
                        className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">
                          {uploadingMou ? 'sync' : 'upload'}
                        </span>
                        {uploadingMou ? 'Uploading MoU...' : 'Upload Signed MoU (PDF)'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section D: Off-Platform Bank Disbursements Ledger */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">account_balance</span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Corporate Bank Wire Disbursements</h3>
                    <p className="text-xs text-slate-500">
                      Section 135 Compliance: 100% of corporate CSR funds are disbursed directly via bank transfer
                    </p>
                  </div>
                </div>

                {(partnership.status === 'ACTIVE' || partnership.status === 'IN_PROGRESS') && (
                  <button
                    onClick={() => {
                      setDisbursementModalOpen(true);
                      setDisbursementSuccess('');
                      setDisbursementError('');
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">payments</span>
                    Record Bank Disbursement
                  </button>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 block font-medium">Total Cumulative Disbursed</span>
                  <span className="text-xl font-bold text-slate-900">
                    {formatCurrency(disbursed)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 max-w-sm">
                  Off-platform payment workflow: corporate grants are wired directly via bank transfer. DaanGives does not hold or escrow funds.
                </div>
              </div>

              {/* Disbursements Itemized Table */}
              {financials?.disbursements && financials.disbursements.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date & Ref</th>
                        <th className="py-2.5 px-3">Bank / Mode</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Evidence Document</th>
                        <th className="py-2.5 px-3">Evidence Verification</th>
                        <th className="py-2.5 px-3">NGO Acknowledgement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {financials.disbursements.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{d.disbursement_date}</div>
                            <div className="font-mono text-[10px] text-slate-500">{d.payment_reference || 'Ref Pending'}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-900">{d.bank_name || 'Bank Wire'}</div>
                            <div className="text-[10px] text-slate-500">{d.payment_mode_display || d.payment_mode}</div>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {formatCurrency(d.amount)}
                          </td>
                          <td className="py-2.5 px-3">
                            {d.evidence_document_url ? (
                              <a
                                href={d.evidence_document_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-900 underline hover:text-slate-700"
                              >
                                <span className="material-symbols-outlined text-xs" aria-hidden="true">description</span>
                                View Bank Advice
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No file attached</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              d.review_status === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : d.review_status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {d.review_status_display || d.review_status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              d.ngo_acknowledgement_status === 'ACKNOWLEDGED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : d.ngo_acknowledgement_status === 'DISPUTED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {d.ngo_acknowledgement_status_display || d.ngo_acknowledgement_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500 font-medium">
                  No itemized bank wire disbursements recorded yet.
                </div>
              )}
            </div>

            {/* Section E: Deliverable Milestones Verification Workspace */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">fact_check</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Deliverable Milestones & Evidence</h3>
                    <p className="text-xs text-slate-500">
                      Track ground completion evidence submitted by NGO and verify progress
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  {milestones.filter((m) => m.status === 'VERIFIED').length} of {milestones.length} Verified
                </span>
              </div>

              {milestones.length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-500">
                  No deliverable milestones scheduled for this partnership yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {milestones.map((m) => {
                    const mStatus = getMilestoneStatusBadge(m.status);
                    return (
                      <div
                        key={m.id}
                        className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-md bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                              #{m.sequence_number}
                            </span>
                            <h4 className="text-sm font-semibold text-slate-900">{m.title}</h4>
                          </div>

                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${mStatus.badgeClass}`}>
                            <span className="material-symbols-outlined text-xs" aria-hidden="true">{mStatus.icon}</span>
                            {m.status_display || mStatus.label}
                          </span>
                        </div>

                        {m.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {m.description}
                          </p>
                        )}

                        {/* Evidence Block (if submitted or verified) */}
                        {(m.has_evidence_document || m.evidence_notes) && (
                          <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm text-slate-600" aria-hidden="true">attachment</span>
                                Submitted Evidence:{' '}
                                {m.evidence_document_url ? (
                                  <a
                                    href={m.evidence_document_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-slate-900 underline hover:text-slate-700 font-semibold"
                                  >
                                    {m.evidence_document_name || 'Download Deliverable Report'}
                                  </a>
                                ) : (
                                  m.evidence_document_name || 'Ground Execution Report'
                                )}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-700">
                                Progress: {m.completion_percentage}%
                              </span>
                            </div>

                            {m.evidence_notes && (
                              <p className="text-xs text-slate-600 italic whitespace-pre-wrap">
                                "{m.evidence_notes}"
                              </p>
                            )}

                            {m.verified_at && (
                              <div className="text-[11px] text-emerald-800 font-medium pt-1 border-t border-slate-100">
                                Verified on {new Date(m.verified_at).toLocaleDateString('en-IN')} by {m.verified_by_name || 'Corporate Reviewer'}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
                          <span className="text-[11px] text-slate-500">
                            Target Date: <strong className={m.is_overdue ? "text-red-600 font-bold" : "text-slate-700"}>{m.target_completion_date || 'Phase Target'}</strong>
                            {m.is_overdue && (
                              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                Overdue
                              </span>
                            )}
                          </span>

                          {m.status === 'SUBMITTED' && (
                            <button
                              onClick={() => {
                                setSelectedMilestone(m);
                                setReviewDecision('VERIFY');
                                setReviewNotes('');
                                setReviewSuccess('');
                                setReviewError('');
                              }}
                              className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-slate-800 transition-all inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm" aria-hidden="true">rate_review</span>
                              Review Milestone Evidence
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section F: Ground Project Expenditures & Invoices */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">receipt_long</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Ground Project Expenditures (Invoices & Vouchers)</h3>
                    <p className="text-xs text-slate-500">
                      Itemized project expense reports submitted by NGO backed by commercial vendor invoices
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                  Total Verified Expenses: {formatCurrency(financials?.verified_expenses?.total_amount || 0)}
                </span>
              </div>

              {financials?.expenses && financials.expenses.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date & Category</th>
                        <th className="py-2.5 px-3">Vendor & Description</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Invoice Proof</th>
                        <th className="py-2.5 px-3">Audit Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {financials.expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{exp.expense_date}</div>
                            <div className="text-[10px] text-slate-500">{exp.category_display || exp.category}</div>
                          </td>
                          <td className="py-2.5 px-3 max-w-xs">
                            <div className="font-semibold text-slate-900 truncate">{exp.vendor_name || 'Direct Vendor'}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">{exp.description}</div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="py-2.5 px-3">
                            {exp.invoice_document_url ? (
                              <a
                                href={exp.invoice_document_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900 hover:underline"
                              >
                                <span className="material-symbols-outlined text-xs" aria-hidden="true">receipt</span>
                                View Invoice
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No invoice</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              exp.review_status === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : exp.review_status === 'REJECTED'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {exp.review_status_display || exp.review_status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {exp.review_status === 'PENDING' && (
                              <button
                                onClick={() => {
                                  setSelectedExpense(exp);
                                  setExpenseDecision('VERIFY');
                                  setExpenseReviewNotes('');
                                  setExpenseReviewError('');
                                  setExpenseReviewSuccess('');
                                }}
                                className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-md hover:bg-slate-800 transition-colors"
                              >
                                Verify Proof
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center text-xs text-slate-500">
                  No ground project expenditures submitted by NGO yet.
                </div>
              )}
            </div>

            {/* Section G: Bilateral Financial Reconciliation Dossier */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">balance</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Multi-Dimensional Financial Reconciliation</h3>
                    <p className="text-xs text-slate-500">
                      Cross-checks committed budget vs reported wires vs verified proofs vs ground expenditures
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${finStatusInfo.badgeClass}`}>
                  {finStatusInfo.label}
                </span>
              </div>

              {/* Multi-Dimensional Comparison Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">1. Committed</span>
                  <div className="text-base font-semibold text-slate-900">{formatCurrency(agreed)}</div>
                  <div className="text-[10px] text-slate-500">MoU Agreed Grant</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">2. Reported Wires</span>
                  <div className="text-base font-semibold text-slate-900">{formatCurrency(disbursed)}</div>
                  <div className="text-[10px] text-slate-500">Reported by Company</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">3. Verified Evidence</span>
                  <div className="text-base font-semibold text-emerald-700">{formatCurrency(verifiedDisbursed)}</div>
                  <div className="text-[10px] text-slate-500">Bank Transfer Proof</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">4. NGO Acknowledged</span>
                  <div className="text-base font-semibold text-blue-700">{formatCurrency(ngoAcknowledged)}</div>
                  <div className="text-[10px] text-slate-500">Bank Credit Confirmed</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">5. Ground Expenses</span>
                  <div className="text-base font-semibold text-purple-700">{formatCurrency(verifiedExpenses)}</div>
                  <div className="text-[10px] text-slate-500">Invoices Audited</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">6. Outstanding</span>
                  <div className="text-base font-semibold text-slate-900">{formatCurrency(remaining)}</div>
                  <div className="text-[10px] text-slate-500">Pending Milestone Wire</div>
                </div>
              </div>

              {/* Over-Commitment Warning */}
              {financials?.is_over_commitment && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-xs text-red-800">
                  <span className="material-symbols-outlined text-lg text-red-600" aria-hidden="true">warning</span>
                  <div>
                    <span className="font-semibold">Over-Commitment Alert:</span> Total reported disbursements ({formatCurrency(disbursed)}) exceed approved MoU grant commitment ({formatCurrency(agreed)}) by {formatCurrency(financials.over_commitment_amount)}. A Bilateral Grant Change Request is required to revise the approved grant ceiling.
                  </div>
                </div>
              )}

              {/* Disputes Warning */}
              {financials?.has_disputes && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-xs text-red-800">
                  <span className="material-symbols-outlined text-lg text-red-600" aria-hidden="true">report_problem</span>
                  <div>
                    <span className="font-semibold">Dispute Alert:</span> One or more bank transfers have been disputed or flagged with a mismatch by NGO ({financials.disputed_disbursements_count} active dispute(s)). Unresolved disputes prevent financial reconciliation.
                  </div>
                </div>
              )}

              {/* Reconciliation Status Banners */}
              {financials?.financial_status === 'NOT_DISBURSED' ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <span className="material-symbols-outlined text-base text-amber-600" aria-hidden="true">pending</span>
                    <span>Awaiting Disbursement — Not Yet Reconciled</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    The approved bilateral grant commitment is <strong>{formatCurrency(agreed)}</strong>, but no bank wire transfers have been reported yet. Zero payments against an approved positive commitment cannot produce a reconciled status.
                  </p>
                  <div className="pt-1 flex items-start gap-2">
                    <span className="text-[11px] font-semibold text-amber-900 shrink-0">Next Action:</span>
                    <span className="text-[11px] text-amber-800">
                      Initiate off-platform bank transfer directly to the partner NGO bank account, then click &ldquo;Record Bank Disbursement&rdquo; above to attach the bank reference / UTR number and transfer advice.
                    </span>
                  </div>
                </div>
              ) : financials?.is_reconciled ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <span className="material-symbols-outlined text-base" aria-hidden="true">check_circle</span>
                  <span>{financials?.explanation || 'All reported bank disbursements and audited project vouchers are completely reconciled.'}</span>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <span className="material-symbols-outlined text-base text-amber-600" aria-hidden="true">{finStatusInfo.icon}</span>
                    <span>Reconciliation State: {finStatusInfo.label}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    {financials?.explanation || financials?.unreconciled_discrepancies?.explanation || 'Reconciliation is pending verification of payment evidence and receipts.'}
                  </p>
                  {remaining > 0 && (
                    <p className="text-[11px] text-amber-800">
                      Outstanding commitment remaining: <strong>{formatCurrency(remaining)}</strong>.
                    </p>
                  )}
                </div>
              )}

              {/* Statutory Disclosure Notice */}
              <div className="p-3.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 leading-relaxed border border-slate-200 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-slate-500 shrink-0 mt-0.5" aria-hidden="true">policy</span>
                <div>
                  <strong className="text-slate-800">Statutory Notice & Direct Wire Model:</strong> DaanGives does not hold, escrow, or intermediate CSR funds. All disbursements are made off-platform directly between corporate and NGO bank accounts per Section 135 regulations. System status of &ldquo;Evidence Reviewed&rdquo; reflects documentary audit of bank advice counterfoils on file, not automated bank API rail confirmation.
                </div>
              </div>

              {/* Audit Timeline */}
              {financials?.audit_history && financials.audit_history.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Statutory Compliance Audit Log ({financials.audit_history.length} Events)
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {financials.audit_history.map((a) => (
                      <div key={a.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs flex items-center justify-between gap-3">
                        <div>
                          <span className="font-semibold text-slate-900">{a.action}</span>
                          <span className="text-[10px] text-slate-500 ml-2">by {a.actor_name || 'Authorized Actor'} ({a.actor_role})</span>
                          {a.notes && <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{a.notes}</p>}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {new Date(a.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section H: Bilateral Grant Change Requests & MoU Amendments */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">edit_document</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Bilateral Grant Change Requests</h3>
                    <p className="text-xs text-slate-500">
                      Controlled workflow for grant increases, budget revisions, and bilateral MoU amendments
                    </p>
                  </div>
                </div>
              </div>

              {financials?.grant_change_requests && financials.grant_change_requests.length > 0 ? (
                <div className="space-y-3">
                  {financials.grant_change_requests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded">
                            {req.request_number}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">
                            {req.change_type_display || req.change_type}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : req.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : req.status === 'PENDING_COMPANY_APPROVAL'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {req.status_display || req.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Current Commitment</span>
                          <div className="font-semibold text-slate-900">{formatCurrency(req.current_agreed_amount)}</div>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Requested New Grant</span>
                          <div className="font-semibold text-slate-900">{formatCurrency(req.requested_new_amount)}</div>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Budget Delta</span>
                          <div className={`font-semibold ${Number(req.amount_delta) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {Number(req.amount_delta) >= 0 ? `+${formatCurrency(req.amount_delta)}` : formatCurrency(req.amount_delta)}
                          </div>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Requested Date</span>
                          <div className="font-semibold text-slate-900">
                            {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      {req.justification && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <strong className="text-slate-900">Justification:</strong> {req.justification}
                        </p>
                      )}

                      {req.supporting_document_url && (
                        <div>
                          <a
                            href={req.supporting_document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:underline"
                          >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">attachment</span>
                            View Revised Budget / Supporting Document
                          </a>
                        </div>
                      )}

                      {req.admin_review_notes && (
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-600">
                          <span className="font-semibold text-slate-900">Admin Eligibility Review:</span> {req.admin_review_notes}
                        </div>
                      )}

                      {req.company_review_notes && (
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-600">
                          <span className="font-semibold text-slate-900">Corporate Review Notes:</span> {req.company_review_notes}
                        </div>
                      )}

                      {req.status === 'PENDING_COMPANY_APPROVAL' && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => {
                              setSelectedGrantChange(req);
                              setGrantChangeDecision('APPROVE');
                              setGrantChangeReviewNotes('');
                              setGrantChangeReviewError('');
                              setGrantChangeReviewSuccess('');
                            }}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">rate_review</span>
                            Review Grant Change Request
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center text-xs text-slate-500">
                  No bilateral grant change requests submitted for this partnership.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Record Bank Disbursement Modal */}
        {disbursementModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">payments</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Record Bank Transfer</h3>
                    <p className="text-xs text-slate-500">Section 135 direct off-platform wire with evidence</p>
                  </div>
                </div>
                <button
                  onClick={() => setDisbursementModalOpen(false)}
                  disabled={submittingDisbursement}
                  className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
                </button>
              </div>

              {disbursementSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">check_circle</span>
                  {disbursementSuccess}
                </div>
              )}

              {disbursementError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">error</span>
                  {disbursementError}
                </div>
              )}

              <form onSubmit={handleReportDisbursement} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      Disbursed Amount (₹ INR) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={disbursementAmount}
                      onChange={(e) => setDisbursementAmount(e.target.value)}
                      placeholder="e.g. 250000"
                      className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:outline-hidden text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={disbursementMode}
                      onChange={(e) => setDisbursementMode(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:outline-hidden text-slate-900"
                    >
                      <option value="NEFT">NEFT Wire</option>
                      <option value="RTGS">RTGS Wire</option>
                      <option value="IMPS">IMPS Instant</option>
                      <option value="BANK_TRANSFER">Direct Account Transfer</option>
                      <option value="CHEQUE">Cheque / Demand Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      Bank Reference / UTR
                    </label>
                    <input
                      type="text"
                      value={disbursementRef}
                      onChange={(e) => setDisbursementRef(e.target.value)}
                      placeholder="e.g. UTR123456789"
                      className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:outline-hidden text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">
                      Originating Bank Name
                    </label>
                    <input
                      type="text"
                      value={disbursementBank}
                      onChange={(e) => setDisbursementBank(e.target.value)}
                      placeholder="e.g. HDFC Bank, ICICI Bank"
                      className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Transfer Date
                  </label>
                  <input
                    type="date"
                    value={disbursementDate}
                    onChange={(e) => setDisbursementDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:outline-hidden text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Supporting Bank Transfer Advice / Counterfoil (PDF/Image)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setDisbursementFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Compliance Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={disbursementNotes}
                    onChange={(e) => setDisbursementNotes(e.target.value)}
                    placeholder="Milestone advance transfer per Schedule III..."
                    className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:outline-hidden text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDisbursementModalOpen(false)}
                    disabled={submittingDisbursement}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDisbursement || !disbursementAmount}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">
                      {submittingDisbursement ? 'sync' : 'check'}
                    </span>
                    {submittingDisbursement ? 'Recording...' : 'Confirm Bank Disbursement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Milestone Review Modal */}
        {selectedMilestone && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Milestone Evidence Review
                  </span>
                  <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                    #{selectedMilestone.sequence_number}: {selectedMilestone.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedMilestone(null)}
                  disabled={submittingReview}
                  className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
                </button>
              </div>

              {reviewSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">check_circle</span>
                  {reviewSuccess}
                </div>
              )}

              {reviewError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">error</span>
                  {reviewError}
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Decision Radio Options */}
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-2">Review Decision</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      onClick={() => setReviewDecision('VERIFY')}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-all ${
                        reviewDecision === 'VERIFY'
                          ? 'border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="review_decision"
                        value="VERIFY"
                        checked={reviewDecision === 'VERIFY'}
                        onChange={() => {}}
                        className="rounded text-slate-900 focus:ring-slate-900"
                      />
                      <div>
                        <div className="text-xs font-semibold">Approve & Verify</div>
                        <div className="text-[10px] text-slate-500">Deliverable accepted</div>
                      </div>
                    </label>

                    <label
                      onClick={() => setReviewDecision('REQUEST_REVISION')}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-all ${
                        reviewDecision === 'REQUEST_REVISION'
                          ? 'border-amber-700 bg-amber-50 text-amber-900 ring-1 ring-amber-700'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="review_decision"
                        value="REQUEST_REVISION"
                        checked={reviewDecision === 'REQUEST_REVISION'}
                        onChange={() => {}}
                        className="rounded text-amber-700 focus:ring-amber-700"
                      />
                      <div>
                        <div className="text-xs font-semibold">Request Revision</div>
                        <div className="text-[10px] text-slate-500">Need clarification</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Review Feedback Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Feedback Notes {reviewDecision === 'REQUEST_REVISION' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    required={reviewDecision === 'REQUEST_REVISION'}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={
                      reviewDecision === 'REQUEST_REVISION'
                        ? 'Explain what additional documentation or deliverable evidence is needed...'
                        : 'Optional confirmation note for NGO partner...'
                    }
                    className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:outline-hidden text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedMilestone(null)}
                    disabled={submittingReview}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">
                      {submittingReview ? 'sync' : 'done_all'}
                    </span>
                    {submittingReview ? 'Submitting...' : 'Submit Decision'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Expense Review Modal */}
        {selectedExpense && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Auditing Project Expense
                  </span>
                  <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                    {formatCurrency(selectedExpense.amount)} — {selectedExpense.vendor_name || 'Vendor Expense'}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedExpense(null)}
                  disabled={submittingExpenseReview}
                  className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
                </button>
              </div>

              {expenseReviewSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">check_circle</span>
                  {expenseReviewSuccess}
                </div>
              )}

              {expenseReviewError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">error</span>
                  {expenseReviewError}
                </div>
              )}

              <form onSubmit={handleExpenseReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-2">Audit Decision</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      onClick={() => setExpenseDecision('VERIFY')}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-all ${
                        expenseDecision === 'VERIFY'
                          ? 'border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="expense_decision"
                        value="VERIFY"
                        checked={expenseDecision === 'VERIFY'}
                        onChange={() => {}}
                        className="rounded text-slate-900 focus:ring-slate-900"
                      />
                      <div>
                        <div className="text-xs font-semibold">Approve & Verify</div>
                        <div className="text-[10px] text-slate-500">Invoice verified</div>
                      </div>
                    </label>

                    <label
                      onClick={() => setExpenseDecision('REQUEST_REVISION')}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-all ${
                        expenseDecision === 'REQUEST_REVISION'
                          ? 'border-amber-700 bg-amber-50 text-amber-900 ring-1 ring-amber-700'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="expense_decision"
                        value="REQUEST_REVISION"
                        checked={expenseDecision === 'REQUEST_REVISION'}
                        onChange={() => {}}
                        className="rounded text-amber-700 focus:ring-amber-700"
                      />
                      <div>
                        <div className="text-xs font-semibold">Request Clarification</div>
                        <div className="text-[10px] text-slate-500">Revision required</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Auditor Review Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={expenseReviewNotes}
                    onChange={(e) => setExpenseReviewNotes(e.target.value)}
                    placeholder="Invoice number and vendor GST verified against deliverable..."
                    className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:outline-hidden text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedExpense(null)}
                    disabled={submittingExpenseReview}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingExpenseReview}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 transition-all hover:bg-slate-800"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">
                      {submittingExpenseReview ? 'sync' : 'check'}
                    </span>
                    {submittingExpenseReview ? 'Submitting...' : 'Record Audit Decision'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Grant Change Corporate Review Modal */}
        {selectedGrantChange && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    MoU Amendment Review
                  </span>
                  <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                    {selectedGrantChange.request_number} — Grant Change
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedGrantChange(null)}
                  disabled={submittingGrantChangeReview}
                  className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Grant:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(selectedGrantChange.current_agreed_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested New Grant:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(selectedGrantChange.requested_new_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grant Delta:</span>
                  <span className="font-semibold text-emerald-700">+{formatCurrency(selectedGrantChange.amount_delta)}</span>
                </div>
                {selectedGrantChange.admin_review_notes && (
                  <div className="pt-2 border-t border-slate-200 text-slate-600">
                    <strong className="text-slate-900">Admin Recommendation:</strong> {selectedGrantChange.admin_review_notes}
                  </div>
                )}
              </div>

              {grantChangeReviewSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">check_circle</span>
                  {grantChangeReviewSuccess}
                </div>
              )}

              {grantChangeReviewError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">error</span>
                  {grantChangeReviewError}
                </div>
              )}

              <form onSubmit={handleGrantChangeReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-2">Corporate Decision</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      onClick={() => setGrantChangeDecision('APPROVE')}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-all ${
                        grantChangeDecision === 'APPROVE'
                          ? 'border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="grant_decision"
                        value="APPROVE"
                        checked={grantChangeDecision === 'APPROVE'}
                        onChange={() => {}}
                        className="rounded text-slate-900 focus:ring-slate-900"
                      />
                      <div>
                        <div className="text-xs font-semibold">Approve Amendment</div>
                        <div className="text-[10px] text-slate-500">Revise commitment</div>
                      </div>
                    </label>

                    <label
                      onClick={() => setGrantChangeDecision('REJECT')}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-all ${
                        grantChangeDecision === 'REJECT'
                          ? 'border-red-700 bg-red-50 text-red-900 ring-1 ring-red-700'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="grant_decision"
                        value="REJECT"
                        checked={grantChangeDecision === 'REJECT'}
                        onChange={() => {}}
                        className="rounded text-red-700 focus:ring-red-700"
                      />
                      <div>
                        <div className="text-xs font-semibold">Reject Request</div>
                        <div className="text-[10px] text-slate-500">Maintain existing grant</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Review Notes / MoU Amendment Terms
                  </label>
                  <textarea
                    rows={3}
                    value={grantChangeReviewNotes}
                    onChange={(e) => setGrantChangeReviewNotes(e.target.value)}
                    placeholder="Board CSR committee approved additional funding per revised Q3 budget..."
                    className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:outline-hidden text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedGrantChange(null)}
                    disabled={submittingGrantChangeReview}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingGrantChangeReview}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 transition-all hover:bg-slate-800"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">
                      {submittingGrantChangeReview ? 'sync' : 'done_all'}
                    </span>
                    {submittingGrantChangeReview ? 'Submitting...' : 'Record Decision'}
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
