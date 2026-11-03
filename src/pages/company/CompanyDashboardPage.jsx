import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CompanyLayout from '../../layouts/CompanyLayout';
import { getCompanyDashboard } from '../../services/api';
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
    case 'APPROVED':
      return {
        label: 'Approved & Verified',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'verified',
      };
    case 'PENDING_VERIFICATION':
      return {
        label: 'Under Verification',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: 'pending_actions',
      };
    case 'REJECTED':
      return {
        label: 'Verification Rejected',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        icon: 'cancel',
      };
    case 'SUSPENDED':
      return {
        label: 'Account Suspended',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: 'warning',
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

export default function CompanyDashboardPage() {
  const { status: profileStatus } = useProfileGuard('company');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    setErrorCode('');
    try {
      const res = await getCompanyDashboard();
      setData(res);
    } catch (err) {
      const code = err.data?.code || (err.message && err.message.includes('No company profile found') ? 'NO_COMPANY_PROFILE' : '');
      setErrorCode(code);
      setError(err.message || 'Failed to load company CSR dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileStatus === 'ready') {
      fetchDashboard();
    } else if (profileStatus === 'missing') {
      setLoading(false);
    }
  }, [profileStatus]);

  if (profileStatus === 'missing') {
    return (
      <CompanyLayout>
        <div className="max-w-7xl mx-auto py-12">
          <ProfileSetupRequired role="COMPANY" title="Corporate Profile Setup Required" />
        </div>
      </CompanyLayout>
    );
  }

  const statusInfo = getStatusBadge(data?.verification_status);

  // Financial calculations
  const budget = Number(data?.annual_csr_budget) || 0;
  const committed = Number(data?.committed_funding_total) || 0;
  const disbursed = Number(data?.disbursed_funding_total) || 0;
  const committedPercent = budget > 0 ? Math.min(Math.round((committed / budget) * 100), 100) : 0;
  const disbursedPercent = committed > 0 ? Math.min(Math.round((disbursed / committed) * 100), 100) : 0;

  return (
    <CompanyLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-32 bg-surface-container rounded-2xl"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-surface-container rounded-2xl"></div>
              ))}
            </div>
            <div className="h-64 bg-surface-container rounded-2xl"></div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="max-w-xl mx-auto">
            {errorCode === 'NO_COMPANY_PROFILE' ? (
              <ProfileSetupRequired role="COMPANY" title="Corporate Profile Setup Required" />
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant/60 p-8 rounded-3xl text-center space-y-4 max-w-lg mx-auto shadow-xs">
                {errorCode === 'PROFILE_INACTIVE' ? (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-3xl">pause_circle</span>
                    </div>
                    <h3 className="text-xl font-bold text-on-surface">Profile Inactive or Under Review</h3>
                    <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                      Your corporate profile is currently inactive or under administrative review. Please review your profile status or contact platform administration.
                    </p>
                    <div className="pt-2">
                      <Link
                        to="/company/profile"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-all shadow-xs"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span>
                        Review Profile Status
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-2xl">error_outline</span>
                    </div>
                    <h3 className="text-lg font-bold text-on-surface">Failed to load CSR Dashboard</h3>
                    <p className="text-sm text-on-surface-variant max-w-md mx-auto">{error}</p>
                    <button
                      onClick={fetchDashboard}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container transition-all"
                    >
                      <span className="material-symbols-outlined text-base">refresh</span>
                      Retry
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && data && (
          <>
            {/* Header Hero Banner */}
            <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-xl shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                      Corporate CSR Portal
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${statusInfo.badgeClass}`}>
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">{statusInfo.icon}</span>
                      {statusInfo.label}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    {data.company_name || 'Corporate Entity'}
                  </h1>
                  <p className="text-slate-500 text-xs sm:text-sm max-w-xl leading-relaxed">
                    Manage Section 135 statutory compliance, algorithmic NGO discovery, bilateral agreements, and verified milestone disbursements.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    to="/company/marketplace"
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">storefront</span>
                    Explore Marketplace
                  </Link>
                  <Link
                    to="/company/preferences"
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg border border-slate-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">tune</span>
                    Match Preferences
                  </Link>
                </div>
              </div>
            </div>

            {/* Verification Notice Banner if not approved */}
            {data.verification_status !== 'APPROVED' && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">verified_user</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                      {data.verification_status === 'DRAFT'
                        ? 'Profile Verification Required'
                        : data.verification_status === 'PENDING_VERIFICATION'
                        ? 'Verification in Progress'
                        : 'Action Required on Corporate Profile'}
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                      {data.verification_status === 'DRAFT'
                        ? 'Please complete your corporate profile and upload your Certificate of Incorporation to begin submitting Expressions of Interest.'
                        : data.verification_status === 'PENDING_VERIFICATION'
                        ? 'Your documents have been submitted and are currently undergoing compliance review.'
                        : 'Please review your corporate profile information to ensure statutory compliance.'}
                    </p>
                  </div>
                </div>
                <Link
                  to="/company/profile"
                  className="shrink-0 px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
                >
                  Manage Profile & Documents
                </Link>
              </div>
            )}

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Annual Budget Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Annual CSR Budget
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-base" aria-hidden="true">account_balance_wallet</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">
                    {budget > 0 ? formatCurrency(budget) : 'Not Configured'}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>Allocated Capital</span>
                    <Link to="/company/profile" className="text-slate-800 hover:underline font-medium">
                      Edit
                    </Link>
                  </div>
                </div>
              </div>

              {/* Committed Funding Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Committed Funding
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-base" aria-hidden="true">handshake</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">
                    {formatCurrency(committed)}
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden border border-slate-200/60">
                    <div
                      className="bg-slate-800 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${committedPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                    <span>{committedPercent}% of budget</span>
                    <Link to="/company/partnerships" className="text-slate-800 hover:underline font-medium">
                      View
                    </Link>
                  </div>
                </div>
              </div>

              {/* Disbursed Funding Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Reported Disbursed
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-base" aria-hidden="true">payments</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">
                    {formatCurrency(disbursed)}
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden border border-slate-200/60">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${disbursedPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                    <span>{disbursedPercent}% of committed</span>
                    <span className="text-slate-600 font-medium">Off-platform</span>
                  </div>
                </div>
              </div>

              {/* Active Partnerships & Requests Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Active Engagements
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-base" aria-hidden="true">hub</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
                  <Link to="/company/partnerships" className="text-center p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="text-xl font-bold text-slate-900">{data.active_partnerships_count || 0}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Partnerships</div>
                  </Link>
                  <Link to="/company/requests" className="text-center p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="text-xl font-bold text-slate-900">{data.pending_requests_count || 0}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Pending Requests</div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Recommended Proposals Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Top Compatibility Recommendations</h2>
                  <p className="text-xs text-slate-500">
                    Verified NGO requirements algorithmically matched against your Schedule VII & geographic preferences
                  </p>
                </div>
                <Link
                  to="/company/marketplace"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline"
                >
                  View All in Marketplace
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
                </Link>
              </div>

              {(!data.recommended_proposals || data.recommended_proposals.length === 0) ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">match_case</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">No Recommendations Generated Yet</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Configure your Schedule VII category filters, preferred Indian states, and budget parameters to activate the matchmaking engine.
                  </p>
                  <Link
                    to="/company/preferences"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xs hover:bg-slate-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">tune</span>
                    Configure Match Preferences
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.recommended_proposals.slice(0, 3).map((match, idx) => (
                    <div
                      key={match.requirement_id || idx}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Proposal #{idx + 1}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="material-symbols-outlined text-xs" aria-hidden="true">verified</span>
                            {match.match_score ? `${Math.round(match.match_score)}% Match` : 'Recommended'}
                          </span>
                        </div>

                        {/* Breakdown Sub-scores */}
                        {match.breakdown && (
                          <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <div>
                              <span className="block font-medium">Category</span>
                              <span className="font-bold text-slate-900">{match.breakdown.category || 0}/35</span>
                            </div>
                            <div>
                              <span className="block font-medium">Location</span>
                              <span className="font-bold text-slate-900">{match.breakdown.location || 0}/25</span>
                            </div>
                            <div>
                              <span className="block font-medium">Budget</span>
                              <span className="font-bold text-slate-900">{match.breakdown.budget || 0}/20</span>
                            </div>
                          </div>
                        )}

                        {/* Reasons */}
                        {match.reasons && match.reasons.length > 0 && (
                          <ul className="space-y-1">
                            {match.reasons.slice(0, 2).map((reason, rIdx) => (
                              <li key={rIdx} className="text-xs text-slate-600 flex items-start gap-1.5">
                                <span className="material-symbols-outlined text-xs text-slate-400 mt-0.5" aria-hidden="true">check_circle</span>
                                <span className="line-clamp-2">{reason}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="pt-3 mt-4 border-t border-slate-100">
                        <Link
                          to="/company/marketplace"
                          className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg border border-slate-200 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm" aria-hidden="true">visibility</span>
                          Inspect Proposal
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions & Compliance Guide Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Portal Quick Links */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">explore</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Corporate Quick Actions</h3>
                    <p className="text-xs text-slate-500">Fast access to key CSR Connect workflows</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Link
                    to="/company/marketplace"
                    className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2.5"
                  >
                    <span className="material-symbols-outlined text-slate-700 text-lg" aria-hidden="true">storefront</span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">CSR Marketplace</div>
                      <div className="text-[11px] text-slate-500">Discover NGO projects</div>
                    </div>
                  </Link>

                  <Link
                    to="/company/requests"
                    className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2.5"
                  >
                    <span className="material-symbols-outlined text-slate-700 text-lg" aria-hidden="true">mark_email_unread</span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Support Outbox</div>
                      <div className="text-[11px] text-slate-500">Track submitted EOIs</div>
                    </div>
                  </Link>

                  <Link
                    to="/company/partnerships"
                    className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2.5"
                  >
                    <span className="material-symbols-outlined text-slate-700 text-lg" aria-hidden="true">handshake</span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Partnerships</div>
                      <div className="text-[11px] text-slate-500">MoUs & Milestones</div>
                    </div>
                  </Link>

                  <Link
                    to="/company/preferences"
                    className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2.5"
                  >
                    <span className="material-symbols-outlined text-slate-700 text-lg" aria-hidden="true">tune</span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">CSR Priorities</div>
                      <div className="text-[11px] text-slate-500">Schedule VII filters</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Statutory Compliance Note */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">policy</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Statutory Compliance Framework</h3>
                    <p className="text-xs text-slate-500">MCA Section 135 & CSR Rules Governance</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5" aria-hidden="true">check_circle</span>
                    <span><strong className="text-slate-800">Bilateral MoUs:</strong> Corporate & NGO sign bilateral MoUs before project execution begins.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5" aria-hidden="true">check_circle</span>
                    <span><strong className="text-slate-800">100% Direct Bank Transfer:</strong> Corporate disbursements remain strictly off-platform directly to NGO verified bank accounts.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5" aria-hidden="true">check_circle</span>
                    <span><strong className="text-slate-800">Milestone Evidence:</strong> Verified photo & document proof submitted by NGOs for each project phase.</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </CompanyLayout>
  );
}
