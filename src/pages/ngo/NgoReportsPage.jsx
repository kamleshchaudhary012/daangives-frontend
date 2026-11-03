import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import NgoLayout from '../../layouts/NgoLayout';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import Badge from '../../components/common/Badge';
import { getNgoDistributionProofs } from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
import useProfileGuard from '../../hooks/useProfileGuard';
import ProfileSetupRequired from '../../components/common/ProfileSetupRequired';

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <span className="material-symbols-outlined text-[13px]">verified</span>
          Verified
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="material-symbols-outlined text-[13px]">hourglass_empty</span>
          Under Review
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <span className="material-symbols-outlined text-[13px]">schedule</span>
          Submitted
        </span>
      );
    case 'REVISION_REQUESTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
          <span className="material-symbols-outlined text-[13px]">edit_note</span>
          Revision Requested
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <span className="material-symbols-outlined text-[13px]">cancel</span>
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {status || 'Unknown'}
        </span>
      );
  }
}

export default function NgoReportsPage() {
  const { status: profileStatus, profile } = useProfileGuard('ngo');
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiProfileMissing, setApiProfileMissing] = useState(false);
  const [apiUnapprovedStatus, setApiUnapprovedStatus] = useState(null);
  const [unauthorizedRole, setUnauthorizedRole] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 350);
  const [selectedProof, setSelectedProof] = useState(null);

  const isApproved =
    profile?.status === 'APPROVED' ||
    profile?.status === 'VERIFIED';

  // In-flight cancellation and stale-response protection
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const lastExecutedQueryKeyRef = useRef(null);

  const fetchProofs = useCallback(async (searchOverride = null, forceRefresh = false) => {
    const rawSearch = typeof searchOverride === 'string' ? searchOverride : debouncedSearchTerm;
    const trimmedSearch = (typeof rawSearch === 'string' ? rawSearch : '').trim();

    const queryKey = JSON.stringify({
      status: statusFilter,
      search: trimmedSearch,
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

    setLoading(true);
    setError(null);
    setApiProfileMissing(false);
    setApiUnapprovedStatus(null);
    setUnauthorizedRole(false);

    try {
      const params = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (trimmedSearch) {
        params.search = trimmedSearch;
      }
      const data = await getNgoDistributionProofs(params, { signal: controller.signal });

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const results = Array.isArray(data) ? data : (data?.results || []);
      setProofs(results);
    } catch (err) {
      if (err.name === 'AbortError' || err.isAborted) {
        lastExecutedQueryKeyRef.current = null;
        return;
      }
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      console.error('Failed to load distribution proofs:', err);

      const errMsg = String(err?.message || err?.data?.detail || '');
      const isMissingProfile =
        err.status === 403 &&
        (errMsg.toLowerCase().includes('ngo profile does not exist') ||
         errMsg.toLowerCase().includes('profile does not exist'));
      const isUnapproved =
        err.status === 403 &&
        (errMsg.toLowerCase().includes('only approved ngos') ||
         errMsg.toLowerCase().includes('current status is'));
      const isRoleForbidden =
        err.status === 403 &&
        !isMissingProfile &&
        !isUnapproved;

      if (isMissingProfile) {
        setApiProfileMissing(true);
      } else if (isUnapproved) {
        let extracted = 'SUBMITTED';
        if (errMsg.includes('DRAFT')) extracted = 'DRAFT';
        else if (errMsg.includes('UNDER_REVIEW')) extracted = 'UNDER_REVIEW';
        else if (errMsg.includes('CORRECTION_REQUIRED')) extracted = 'CORRECTION_REQUIRED';
        else if (errMsg.includes('REJECTED')) extracted = 'REJECTED';
        else if (errMsg.includes('SUSPENDED')) extracted = 'SUSPENDED';
        setApiUnapprovedStatus(extracted);
      } else if (isRoleForbidden) {
        setUnauthorizedRole(true);
      } else {
        setError(errMsg || 'Unable to retrieve distribution proofs at this time. Please try again.');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    // Only query backend if profile guard confirms ready/approved or is still resolving
    if (profileStatus === 'ready') {
      if (isApproved) {
        fetchProofs();
      } else {
        setLoading(false);
      }
    } else if (profileStatus === 'missing') {
      setLoading(false);
    } else {
      // profileStatus === 'loading'
      fetchProofs();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      lastExecutedQueryKeyRef.current = null;
    };
  }, [profileStatus, isApproved, fetchProofs]);

  const effectiveStatus = apiUnapprovedStatus || profile?.status;

  if (profileStatus === 'missing' || apiProfileMissing) {
    return (
      <NgoLayout>
        <div className="max-w-4xl mx-auto py-12" data-testid="profile-missing-state">
          <ProfileSetupRequired
            role="NGO"
            title="NGO Profile Setup Required"
            description="Please complete your organization registration profile before accessing distribution reports and proof submissions."
            buttonText="Complete NGO Registration"
            targetPath="/ngo/registration-flow"
          />
        </div>
      </NgoLayout>
    );
  }

  if ((profileStatus === 'ready' && !isApproved) || apiUnapprovedStatus) {
    if (effectiveStatus === 'DRAFT') {
      return (
        <NgoLayout>
          <div className="max-w-4xl mx-auto py-12" data-testid="draft-profile-state">
            <ProfileSetupRequired
              role="NGO"
              title="Complete Your Registration Application"
              description="Your organization profile is currently in draft status. Please complete all required registration steps and submit your application for review."
              buttonText="Continue Registration"
              targetPath="/ngo/registration-flow"
            />
          </div>
        </NgoLayout>
      );
    }

    if (effectiveStatus === 'SUBMITTED' || effectiveStatus === 'UNDER_REVIEW') {
      return (
        <NgoLayout>
          <div className="max-w-xl mx-auto py-12" data-testid="verification-pending-state">
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-6">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-amber-500/10 text-amber-600 border border-amber-200">
                <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                  Organization Verification In Progress
                </h2>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                  Your NGO registration application is currently under review by our verification team. Field distribution reporting and proof submissions will be unlocked once your organization is verified and approved.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/ngo/registration-flow"
                  className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold rounded-xl text-white bg-secondary hover:bg-secondary-container shadow-xs transition-all"
                >
                  <span>View Application Status</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </NgoLayout>
      );
    }

    if (effectiveStatus === 'CORRECTION_REQUIRED') {
      return (
        <NgoLayout>
          <div className="max-w-xl mx-auto py-12" data-testid="correction-required-state">
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-6">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-orange-500/10 text-orange-600 border border-orange-200">
                <span className="material-symbols-outlined text-3xl">edit_note</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                  Application Revisions Required
                </h2>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                  Our verification team has requested corrections to your NGO profile details or documents. Please review the requested revisions and update your application.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/ngo/registration-flow"
                  className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold rounded-xl text-white bg-secondary hover:bg-secondary-container shadow-xs transition-all"
                >
                  <span>Update Application</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </NgoLayout>
      );
    }

    if (effectiveStatus === 'REJECTED' || effectiveStatus === 'SUSPENDED') {
      return (
        <NgoLayout>
          <div className="max-w-xl mx-auto py-12" data-testid="restricted-state">
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-6">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-rose-500/10 text-rose-600 border border-rose-200">
                <span className="material-symbols-outlined text-3xl">block</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                  Access Restricted
                </h2>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                  Your organization profile is currently {effectiveStatus.toLowerCase()}. Please contact platform support for further assistance.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/ngo/tickets"
                  className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold rounded-xl text-white bg-secondary hover:bg-secondary-container shadow-xs transition-all"
                >
                  <span>Contact Support</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </NgoLayout>
      );
    }
  }

  if (unauthorizedRole) {
    return (
      <NgoLayout>
        <div className="max-w-xl mx-auto py-12" data-testid="unauthorized-state">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-6">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-rose-500/10 text-rose-600 border border-rose-200">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                Access Denied
              </h2>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                You do not have permission to access NGO distribution reports. Please sign in with an authorized organization account.
              </p>
            </div>
          </div>
        </div>
      </NgoLayout>
    );
  }

  // Compute summary metrics across loaded proofs
  const totalProofs = proofs.length;
  const verifiedCount = proofs.filter(p => p.status === 'VERIFIED').length;
  const inReviewCount = proofs.filter(p => p.status === 'UNDER_REVIEW' || p.status === 'SUBMITTED').length;
  const revisionCount = proofs.filter(p => p.status === 'REVISION_REQUESTED').length;
  const totalBeneficiaries = proofs.reduce((sum, p) => sum + (parseInt(p.beneficiary_count, 10) || 0), 0);
  const totalSpent = proofs.reduce((sum, p) => sum + (parseFloat(p.spent_amount) || 0), 0);

  return (
    <NgoLayout>
      <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">
              Distribution & Field Impact Reports
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Field evidence, beneficiary counts, GPS coordinates, and fund utilization submitted across your campaigns.
            </p>
          </div>
          <Link
            to="/ngo/needs"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary/90 transition shadow-xs shrink-0"
          >
            <span className="material-symbols-outlined text-base">add_photo_alternate</span>
            <span>Upload Milestone Proof</span>
          </Link>
        </div>

        {/* Summary Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/60 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-medium">Total Evidence Submissions</span>
              <span className="material-symbols-outlined text-primary text-lg">receipt_long</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-on-surface">{totalProofs}</div>
            <div className="text-[11px] text-on-surface-variant">
              {verifiedCount} verified • {inReviewCount} pending
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/60 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-medium">Beneficiaries Reached</span>
              <span className="material-symbols-outlined text-emerald-600 text-lg">groups</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-on-surface">
              {totalBeneficiaries.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-on-surface-variant">Across submitted proofs</div>
          </div>

          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/60 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-medium">Total Funds Utilized</span>
              <span className="material-symbols-outlined text-secondary text-lg">payments</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-on-surface">
              ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-on-surface-variant">Reported field expenditure</div>
          </div>

          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/60 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-medium">Moderation Status</span>
              <span className="material-symbols-outlined text-blue-600 text-lg">verified</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-on-surface">
              {verifiedCount} <span className="text-xs font-normal text-on-surface-variant">/ {totalProofs} Verified</span>
            </div>
            <div className="text-[11px] text-on-surface-variant">
              {revisionCount > 0 ? (
                <span className="text-orange-600 font-semibold">{revisionCount} need revisions</span>
              ) : (
                'All submissions up to date'
              )}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { id: 'ALL', label: 'All Submissions' },
              { id: 'VERIFIED', label: 'Verified' },
              { id: 'UNDER_REVIEW', label: 'Under Review' },
              { id: 'SUBMITTED', label: 'Submitted' },
              { id: 'REVISION_REQUESTED', label: 'Needs Revision' },
              { id: 'REJECTED', label: 'Rejected' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === tab.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search caption, location..."
                className="w-full pl-9 pr-3 py-1.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>
            <button
              onClick={() => fetchProofs(null, true)}
              title="Refresh"
              className="p-2 bg-surface-container-low text-on-surface-variant hover:text-on-surface rounded-xl border border-outline-variant/60 transition"
              aria-label="Refresh reports"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
            </button>
          </div>
        </div>

        {/* Content States */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="loading-skeleton">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-4 space-y-3 animate-pulse shadow-xs"
              >
                <div className="w-full aspect-video bg-surface-container rounded-xl" />
                <div className="h-4 bg-surface-container rounded w-3/4" />
                <div className="h-3 bg-surface-container rounded w-1/2" />
                <div className="h-8 bg-surface-container rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3 shadow-xs" data-testid="error-state">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">error</span>
            </div>
            <h2 className="text-base font-bold text-rose-900">Failed to Load Reports</h2>
            <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchProofs(null, true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && proofs.length === 0 && (
          <div
            className="bg-surface-container-lowest p-8 sm:p-12 rounded-3xl border border-outline-variant/60 text-center space-y-4 shadow-xs"
            data-testid="empty-state"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl mx-auto border border-primary/20">
              <span className="material-symbols-outlined text-3xl">inventory_2</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-on-surface">No Distribution Proofs Found</h2>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                {statusFilter !== 'ALL'
                  ? `There are no distribution proof records with status "${statusFilter}". Try selecting "All Submissions".`
                  : 'Your organization has not submitted any field distribution proofs yet. Create campaign milestones and upload distribution evidence to track your social impact.'}
              </p>
            </div>
            <Link
              to="/ngo/needs"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition shadow-xs"
            >
              <span className="material-symbols-outlined text-base">campaign</span>
              <span>Go to Campaign Needs</span>
            </Link>
          </div>
        )}

        {!loading && !error && proofs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="proof-grid">
            {proofs.map(proof => {
              const lat = proof.latitude ? parseFloat(proof.latitude) : null;
              const lng = proof.longitude ? parseFloat(proof.longitude) : null;
              const hasCoordinates = !isNaN(lat) && !isNaN(lng) && lat !== null && lng !== null;
              const mapsUrl = hasCoordinates ? `https://www.google.com/maps?q=${lat},${lng}` : null;
              const spentAmount = parseFloat(proof.spent_amount || 0);

              return (
                <div
                  key={proof.id}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-xs overflow-hidden flex flex-col justify-between hover:border-outline-variant transition group"
                  data-testid={`proof-card-${proof.id}`}
                >
                  <div>
                    {/* Proof Photo Thumbnail */}
                    <div
                      className="cursor-pointer relative overflow-hidden bg-surface-container-low"
                      onClick={() => setSelectedProof(proof)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedProof(proof);
                        }
                      }}
                      aria-label={`View evidence for ${proof.caption || 'distribution proof'}`}
                    >
                      <ImageWithFallback
                        src={proof.photo_url || proof.photo}
                        alt={proof.caption || 'Distribution Proof'}
                        fallbackIcon="photo_camera"
                        fallbackLabel="Distribution Evidence"
                        aspectRatio="aspect-video"
                        className="group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 right-2.5 z-10">
                        {getStatusBadge(proof.status)}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Campaign & Milestone association */}
                      <div className="space-y-0.5">
                        {proof.campaign_title && (
                          <div className="text-[11px] font-bold text-primary truncate uppercase tracking-wider">
                            {proof.campaign_title}
                          </div>
                        )}
                        {proof.milestone_title && (
                          <div className="text-xs text-on-surface-variant truncate font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">flag</span>
                            <span>{proof.milestone_title}</span>
                          </div>
                        )}
                      </div>

                      {/* Caption */}
                      {proof.caption && (
                        <h3 className="font-bold text-on-surface text-sm line-clamp-2 leading-snug">
                          {proof.caption}
                        </h3>
                      )}

                      {/* Date & Spend row */}
                      <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-outline-variant/30">
                        {proof.distribution_date ? (
                          <span className="text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-primary">calendar_today</span>
                            {formatDisplayDate(proof.distribution_date)}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant italic">Date unrecorded</span>
                        )}

                        {spentAmount > 0 && (
                          <span className="font-bold text-primary">
                            ₹{spentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>

                      {/* Beneficiaries Pill */}
                      {(proof.beneficiary_count > 0 || proof.beneficiary_type) && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface-variant text-[11px] font-semibold border border-outline-variant/30">
                          <span className="material-symbols-outlined text-xs text-emerald-600">group</span>
                          <span>
                            {proof.beneficiary_count || 0} {proof.beneficiary_type_display || proof.beneficiary_type || 'Beneficiaries'}
                          </span>
                        </div>
                      )}

                      {/* Location & Maps Link */}
                      {(proof.location_name || hasCoordinates) && (
                        <div className="pt-2 border-t border-outline-variant/30 text-xs text-on-surface-variant space-y-1">
                          {proof.location_name && (
                            <div className="flex items-center gap-1 truncate font-medium text-on-surface">
                              <span className="material-symbols-outlined text-xs text-primary/70 shrink-0">location_on</span>
                              <span className="truncate">{proof.location_name}</span>
                            </div>
                          )}
                          {hasCoordinates && (
                            <div className="flex items-center justify-between gap-2 text-[11px] pl-4">
                              <span className="font-mono text-on-surface-variant/80">
                                {lat.toFixed(4)}°, {lng.toFixed(4)}°
                              </span>
                              {mapsUrl && (
                                <a
                                  href={mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline font-semibold flex items-center gap-0.5"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <span>View Location</span>
                                  <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Revision Feedback Notice */}
                      {proof.status === 'REVISION_REQUESTED' && proof.rejection_reason && (
                        <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-xs space-y-1">
                          <div className="font-semibold text-orange-900 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">info</span>
                            <span>Admin Revision Requested</span>
                          </div>
                          <p className="text-[11px] text-orange-800 leading-relaxed">
                            {proof.rejection_reason}
                          </p>
                        </div>
                      )}

                      {/* Rejection Notice */}
                      {proof.status === 'REJECTED' && proof.rejection_reason && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                          <div className="font-semibold text-rose-900 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">cancel</span>
                            <span>Rejection Reason</span>
                          </div>
                          <p className="text-[11px] text-rose-800 leading-relaxed">
                            {proof.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => setSelectedProof(proof)}
                      className="w-full py-2 bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs rounded-xl transition text-center border border-outline-variant/50 flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">zoom_in</span>
                      <span>Inspect Evidence</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Inspector for Proof Evidence */}
        {selectedProof && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="proof-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
            onClick={() => setSelectedProof(null)}
          >
            <div
              className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-outline-variant/40 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedProof.status)}
                  {selectedProof.distribution_date && (
                    <span className="text-xs text-on-surface-variant font-medium">
                      Distributed on {formatDisplayDate(selectedProof.distribution_date)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedProof(null)}
                  aria-label="Close dialog"
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
                {/* Photo */}
                <div className="rounded-2xl overflow-hidden border border-outline-variant/40 bg-surface-container-low">
                  <ImageWithFallback
                    src={selectedProof.photo_url || selectedProof.photo}
                    alt={selectedProof.caption || 'Field Evidence'}
                    fallbackIcon="photo_camera"
                    fallbackLabel="Distribution Evidence"
                    aspectRatio="aspect-video"
                  />
                </div>

                {/* Campaign & Milestone */}
                <div className="space-y-1">
                  {selectedProof.campaign_title && (
                    <div className="text-xs font-bold text-primary uppercase tracking-wider">
                      {selectedProof.campaign_title}
                    </div>
                  )}
                  <h3 id="proof-modal-title" className="text-base font-bold text-on-surface">
                    {selectedProof.caption || selectedProof.milestone_title || 'Field Distribution Evidence'}
                  </h3>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-1">
                    <span className="text-on-surface-variant font-medium">Spent Amount</span>
                    <div className="font-bold text-primary text-sm">
                      ₹{parseFloat(selectedProof.spent_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-1">
                    <span className="text-on-surface-variant font-medium">Beneficiaries</span>
                    <div className="font-bold text-on-surface text-sm">
                      {selectedProof.beneficiary_count || 0} {selectedProof.beneficiary_type_display || selectedProof.beneficiary_type || 'Beneficiaries'}
                    </div>
                  </div>

                  {selectedProof.location_name && (
                    <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-1 col-span-full">
                      <span className="text-on-surface-variant font-medium">Location</span>
                      <div className="font-semibold text-on-surface flex items-center justify-between gap-2">
                        <span>{selectedProof.location_name}</span>
                        {selectedProof.latitude && selectedProof.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${selectedProof.latitude},${selectedProof.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-xs flex items-center gap-0.5"
                          >
                            <span>Google Maps</span>
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedProof.beneficiary_notes && (
                    <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-1 col-span-full">
                      <span className="text-on-surface-variant font-medium">Beneficiary Notes</span>
                      <p className="text-on-surface leading-relaxed">{selectedProof.beneficiary_notes}</p>
                    </div>
                  )}

                  {selectedProof.expense_breakdown && (
                    <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-1 col-span-full">
                      <span className="text-on-surface-variant font-medium">Expense Breakdown</span>
                      <p className="text-on-surface font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                        {typeof selectedProof.expense_breakdown === 'object'
                          ? JSON.stringify(selectedProof.expense_breakdown, null, 2)
                          : selectedProof.expense_breakdown}
                      </p>
                    </div>
                  )}

                  {selectedProof.rejection_reason && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-1 col-span-full">
                      <span className="text-orange-900 font-bold">Admin Feedback</span>
                      <p className="text-orange-800 leading-relaxed text-xs">{selectedProof.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-outline-variant/40 flex justify-end">
                <button
                  onClick={() => setSelectedProof(null)}
                  className="px-5 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NgoLayout>
  );
}
