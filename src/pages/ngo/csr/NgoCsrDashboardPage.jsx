import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NgoLayout from '../../../layouts/NgoLayout';
import { getNgoCsrDashboard } from '../../../services/api';
import useProfileGuard from '../../../hooks/useProfileGuard';
import ProfileSetupRequired from '../../../components/common/ProfileSetupRequired';

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function getMilestoneStatusBadge(status) {
  switch (status) {
    case 'VERIFIED':
      return {
        label: 'Verified',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'check_circle',
      };
    case 'SUBMITTED':
      return {
        label: 'Under Review',
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
        label: 'Pending Evidence',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: 'schedule',
      };
  }
}

export default function NgoCsrDashboardPage() {
  const { status: profileStatus } = useProfileGuard('ngo');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setIsRetrying(true);
    setError('');
    setErrorStatus(null);
    setErrorCode(null);
    try {
      const res = await getNgoCsrDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load NGO CSR dashboard summary.');
      setErrorStatus(err.status || err.response?.status || 0);
      setErrorCode(err.data?.code || err.code || null);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (profileStatus === 'ready') {
      fetchDashboard();
    } else if (profileStatus === 'missing') {
      setLoading(false);
    }
  }, [profileStatus]);

  const totalPartnered = Number(data?.total_funding_partnered) || 0;
  const pendingMilestones = data?.pending_milestone_submissions || [];

  if (profileStatus === 'missing') {
    return (
      <NgoLayout>
        <div className="max-w-7xl mx-auto py-12">
          <ProfileSetupRequired role="NGO" />
        </div>
      </NgoLayout>
    );
  }

  const isCsrIneligible =
    errorCode === 'NGO_CSR_INELIGIBLE' ||
    (error && (
      error.toLowerCase().includes('statutory csr-eligible') ||
      error.toLowerCase().includes('section 135') ||
      error.toLowerCase().includes('12a/80g')
    ));

  const isCsrUnverified =
    errorCode === 'NGO_CSR_UNVERIFIED' ||
    (error && (
      error.toLowerCase().includes('pending admin verification') ||
      error.toLowerCase().includes('csr-verified ngo')
    ));

  const isNgoNotApproved =
    errorCode === 'NGO_NOT_APPROVED' ||
    (error && (
      error.toLowerCase().includes('pending review') ||
      error.toLowerCase().includes('approved ngo accounts')
    ));

  const hasNoRequirementsYet =
    data &&
    Number(data.active_proposals_count) === 0 &&
    Number(data.draft_proposals_count) === 0 &&
    Number(data.active_partnerships_count) === 0;

  return (
    <NgoLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        {/* Loading Skeleton */}
        {(loading || profileStatus === 'loading') && (
          <div className="space-y-6 animate-pulse">
            <div className="h-36 bg-surface-container rounded-3xl"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-surface-container rounded-2xl"></div>
              ))}
            </div>
            <div className="h-64 bg-surface-container rounded-3xl"></div>
          </div>
        )}

        {/* Informative Compliance State: Statutory CSR Ineligible */}
        {!loading && profileStatus === 'ready' && error && isCsrIneligible && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-500/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-3xl">gavel</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20">
                      Statutory CSR Eligibility Required
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-on-surface">CSR Connect Access Restricted</h2>
                </div>
              </div>
              <button
                onClick={fetchDashboard}
                disabled={isRetrying}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-amber-800 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-all"
              >
                <span className={`material-symbols-outlined text-base ${isRetrying ? 'animate-spin' : ''}`}>refresh</span>
                {isRetrying ? 'Checking...' : 'Re-check Status'}
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              <p>
                Under <strong>Section 135 of the Companies Act, 2013</strong> and <strong>Rule 4 of the Companies (CSR Policy) Rules</strong>, non-profit organizations must hold verified statutory credentials before participating in corporate CSR funding allocations:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <span className="material-symbols-outlined text-amber-600 text-lg">domain</span>
                    Eligible Legal Structure
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Registered Public Trust, Society, or Section 8 Company with at least <strong>3 years established operational track record</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <span className="material-symbols-outlined text-amber-600 text-lg">receipt_long</span>
                    Tax Exemption Status
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Valid registration under <strong>Section 12A/12AB AND Section 80G</strong>, OR Section 10(23C) of the Income Tax Act.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <span className="material-symbols-outlined text-amber-600 text-lg">verified</span>
                    MCA Form CSR-1
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Active 11-character <strong>CSR Registration Number (CRN)</strong> issued by the Ministry of Corporate Affairs (MCA).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-amber-950">Next Step: Update Legal & CSR Profile</h4>
                  <p className="text-[11px] text-amber-900">
                    Add your Form CSR-1 registration number and 12A/80G exemption certificates in your profile to request Admin CSR verification.
                  </p>
                </div>
                <Link
                  to="/ngo/registration-flow"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-slate-800 transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-base">edit_document</span>
                  Update Legal Credentials
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Informative Compliance State: CSR Verification Pending Admin Review */}
        {!loading && profileStatus === 'ready' && error && !isCsrIneligible && isCsrUnverified && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blue-500/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-3xl">pending_actions</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-800 border border-blue-500/20">
                      Compliance Review In Progress
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-on-surface">Admin CSR Verification Pending</h2>
                </div>
              </div>
              <button
                onClick={fetchDashboard}
                disabled={isRetrying}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-blue-800 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-all"
              >
                <span className={`material-symbols-outlined text-base ${isRetrying ? 'animate-spin' : ''}`}>refresh</span>
                {isRetrying ? 'Checking...' : 'Check Verification Status'}
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              <p>
                Your organization has submitted statutory CSR credentials including Form CSR-1 and tax exemption documentation. A Platform Compliance Officer is currently verifying your records against government registries (MCA21 and Income Tax Department).
              </p>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-blue-950">Mandatory Safeguard</h4>
                  <p className="text-[11px] text-blue-900">
                    Admin verification is mandatory under platform compliance safeguards before publishing CSR requirements or receiving corporate funds.
                  </p>
                </div>
                <Link
                  to="/ngo/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-slate-800 transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-base">dashboard</span>
                  Return to Portal
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Informative Compliance State: NGO Registration Pending Approval */}
        {!loading && profileStatus === 'ready' && error && !isCsrIneligible && !isCsrUnverified && isNgoNotApproved && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-500/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-3xl">hourglass_top</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20">
                      Application In Review
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-on-surface">NGO Registration Pending Approval</h2>
                </div>
              </div>
              <button
                onClick={fetchDashboard}
                disabled={isRetrying}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-amber-800 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-all"
              >
                <span className={`material-symbols-outlined text-base ${isRetrying ? 'animate-spin' : ''}`}>refresh</span>
                {isRetrying ? 'Checking...' : 'Refresh Status'}
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              <p>
                Access to the CSR Connect Console requires an approved NGO account. Your registration application is currently progressing through the multi-stage review workflow.
              </p>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-amber-950">Next Step: Application Flow</h4>
                  <p className="text-[11px] text-amber-900">
                    View your application status and submit any requested corrections in the Application Flow.
                  </p>
                </div>
                <Link
                  to="/ngo/registration-flow"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-slate-800 transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-base">assignment</span>
                  View Application Flow
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* General Error State (Network, Server 500, etc.) */}
        {!loading && profileStatus === 'ready' && error && !isCsrIneligible && !isCsrUnverified && !isNgoNotApproved && (
          <div className="bg-error-container/20 border border-error/30 p-8 rounded-3xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">error_outline</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">Failed to load NGO CSR Console</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchDashboard}
              disabled={isRetrying}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-secondary-container transition-all"
            >
              <span className={`material-symbols-outlined text-base ${isRetrying ? 'animate-spin' : ''}`}>refresh</span>
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && data && (
          <>
            {/* Header Hero Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-secondary to-secondary-container text-white p-6 sm:p-8 rounded-3xl shadow-lg">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs">
                      CSR Connect Console
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white text-secondary">
                      <span className="material-symbols-outlined text-sm">domain</span>
                      Verified NGO
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {data.ngo_name || 'NGO Partner'}
                  </h1>
                  <p className="text-white/80 text-xs sm:text-sm max-w-xl">
                    Publish Section 135 CSR proposals, review corporate Expressions of Interest (EOI), and report verified ground deliverables.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/ngo/csr/requirements/new"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-secondary text-xs font-bold rounded-xl shadow-xs hover:bg-slate-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    Create Proposal
                  </Link>
                  <Link
                    to="/ngo/csr/requests"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 backdrop-blur-xs transition-all"
                  >
                    <span className="material-symbols-outlined text-base">inbox</span>
                    Inbound EOIs
                    {data.incoming_requests_pending_count > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-900">
                        {data.incoming_requests_pending_count}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

              {/* Decorative Background Blob */}
              <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* KPI Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Active Proposals Card */}
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-secondary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Active Proposals
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">campaign</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-on-surface">
                    {data.active_proposals_count || 0}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-on-surface-variant">
                    <span>Open for Matching</span>
                    <Link to="/ngo/csr/requirements" className="text-secondary hover:underline font-bold">
                      View All →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Draft Proposals Card */}
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-secondary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Draft Proposals
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">edit_note</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-on-surface">
                    {data.draft_proposals_count || 0}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-on-surface-variant">
                    <span>Unsubmitted Drafts</span>
                    <Link to="/ngo/csr/requirements?status=DRAFT" className="text-secondary hover:underline font-bold">
                      Resume →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Inbound EOI Requests Card */}
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-secondary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Pending Corporate EOIs
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">mark_email_unread</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-amber-700">
                    {data.incoming_requests_pending_count || 0}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-on-surface-variant">
                    <span>Awaiting Review</span>
                    <Link to="/ngo/csr/requests?status=PENDING_NGO_REVIEW" className="text-amber-700 hover:underline font-bold">
                      Review Inbox →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Active Partnerships Card */}
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-secondary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Active Partnerships
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">handshake</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-on-surface">
                    {data.active_partnerships_count || 0}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-on-surface-variant">
                    <span>Capital: {formatCurrency(totalPartnered)}</span>
                    <Link to="/ngo/csr/partnerships" className="text-secondary hover:underline font-bold">
                      Hub →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Zero Proposals Onboarding Empty State */}
            {hasNoRequirementsYet && (
              <div className="bg-surface-container-lowest border border-dashed border-secondary/30 rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">add_business</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-on-surface">No CSR Proposals Published Yet</h3>
                  <p className="text-xs text-on-surface-variant max-w-lg mx-auto leading-relaxed">
                    Your NGO is CSR-verified and eligible to receive corporate CSR grants. Draft and publish your first Section 135 CSR proposal to get discovered by corporate CSR partners on the marketplace.
                  </p>
                </div>
                <Link
                  to="/ngo/csr/requirements/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-secondary-container transition-all"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Create Your First CSR Proposal
                </Link>
              </div>
            )}

            {/* Pending Milestone Submissions Section */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">fact_check</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">Pending Milestone Deliverables</h3>
                    <p className="text-xs text-on-surface-variant">
                      Upload ground completion reports & photo evidence for corporate milestone verification
                    </p>
                  </div>
                </div>

                <Link
                  to="/ngo/csr/partnerships"
                  className="text-xs font-bold text-secondary hover:underline inline-flex items-center gap-1"
                >
                  Manage All Partnerships
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              {pendingMilestones.length === 0 ? (
                <div className="p-8 bg-surface-container-low rounded-2xl text-center space-y-2">
                  <span className="material-symbols-outlined text-3xl text-emerald-600">task_alt</span>
                  <h4 className="text-xs font-bold text-on-surface">No Overdue Milestone Submissions</h4>
                  <p className="text-[11px] text-on-surface-variant max-w-sm mx-auto">
                    All deliverable milestones are up to date. New submission requests will appear here when ground execution progresses.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingMilestones.map((m) => {
                    const mStatus = getMilestoneStatusBadge(m.status);
                    return (
                      <div
                        key={m.id}
                        className="p-4 rounded-2xl border border-outline-variant/50 bg-surface-container-low flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                              Milestone #{m.sequence_number}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${mStatus.badgeClass}`}>
                              <span className="material-symbols-outlined text-xs">{mStatus.icon}</span>
                              {m.status_display || mStatus.label}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-on-surface line-clamp-1">{m.title}</h4>
                          <p className="text-[11px] text-on-surface-variant">
                            Target Date: <strong>{m.target_completion_date || 'Ongoing'}</strong>
                          </p>
                        </div>

                        <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-end">
                          <Link
                            to={`/ngo/csr/partnerships`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
                          >
                            <span>Submit Evidence in Hub</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/ngo/csr/requirements/new"
                className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs hover:border-secondary/40 hover:shadow-md transition-all flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">post_add</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface">Proposal Builder</h4>
                  <p className="text-[11px] text-on-surface-variant">Draft new CSR requirement</p>
                </div>
              </Link>

              <Link
                to="/ngo/csr/requirements"
                className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs hover:border-secondary/40 hover:shadow-md transition-all flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">folder_shared</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface">My Proposals</h4>
                  <p className="text-[11px] text-on-surface-variant">Manage active requirements</p>
                </div>
              </Link>

              <Link
                to="/ngo/csr/requests"
                className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs hover:border-secondary/40 hover:shadow-md transition-all flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">inbox</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface">Corporate EOIs</h4>
                  <p className="text-[11px] text-on-surface-variant">Review incoming requests</p>
                </div>
              </Link>

              <Link
                to="/ngo/csr/partnerships"
                className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs hover:border-secondary/40 hover:shadow-md transition-all flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">handshake</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface">Partnership Hub</h4>
                  <p className="text-[11px] text-on-surface-variant">MoUs & Ground Milestones</p>
                </div>
              </Link>
            </div>
          </>
        )}
      </div>
    </NgoLayout>
  );
}
