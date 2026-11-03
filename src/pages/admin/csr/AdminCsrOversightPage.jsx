import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  listAdminCsrPartnerships,
  listAdminCsrAuditHistory,
  getAdminCsrAnalytics,
  getPartnershipFinancials,
  listPartnershipDisbursements,
  listPartnershipExpenses,
} from '../../../services/api';

const PARTNERSHIP_STATUS_TABS = [
  { key: 'ALL', label: 'All Partnerships' },
  { key: 'PENDING_MOU', label: 'Pending MoU' },
  { key: 'ACTIVE', label: 'Active Execution' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const AUDIT_ENTITY_TYPES = [
  { key: 'ALL', label: 'All Entities' },
  { key: 'COMPANY', label: 'Corporate Profiles' },
  { key: 'REQUIREMENT', label: 'CSR Proposals' },
  { key: 'PARTNERSHIP', label: 'Partnerships' },
  { key: 'MILESTONE', label: 'Milestones' },
  { key: 'DISBURSEMENT', label: 'Disbursements' },
  { key: 'EXPENSE', label: 'Ground Expenses' },
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

export default function AdminCsrOversightPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine active tab from route pathname or query param
  let activeTab = 'partnerships';
  if (location.pathname.includes('/audit-history')) {
    activeTab = 'audit';
  } else if (location.pathname.includes('/analytics')) {
    activeTab = 'analytics';
  } else if (searchParams.get('tab')) {
    activeTab = searchParams.get('tab');
  }

  // ---------------------------------------------------------------------------
  // TAB 1: PARTNERSHIPS STATE
  // ---------------------------------------------------------------------------
  const pStatusFilter = searchParams.get('p_status') || 'ALL';
  const pSearchFilter = searchParams.get('p_search') || '';
  const pPageFilter = parseInt(searchParams.get('p_page') || '1', 10);

  const [pLocalSearch, setPLocalSearch] = useState(pSearchFilter);
  const [partnerships, setPartnerships] = useState([]);
  const [pTotalCount, setPTotalCount] = useState(0);
  const [pLoading, setPLoading] = useState(false);
  const [pError, setPError] = useState('');

  // ---------------------------------------------------------------------------
  // TAB 2: AUDIT HISTORY STATE
  // ---------------------------------------------------------------------------
  const aEntityFilter = searchParams.get('a_entity') || 'ALL';
  const aIdFilter = searchParams.get('a_id') || '';
  const aPageFilter = parseInt(searchParams.get('a_page') || '1', 10);

  const [aLocalId, setALocalId] = useState(aIdFilter);
  const [auditLogs, setAuditLogs] = useState([]);
  const [aTotalCount, setATotalCount] = useState(0);
  const [aLoading, setALoading] = useState(false);
  const [aError, setAError] = useState('');

  // ---------------------------------------------------------------------------
  // TAB 3: ANALYTICS STATE
  // ---------------------------------------------------------------------------
  const [analyticsData, setAnalyticsData] = useState(null);
  const [anLoading, setAnLoading] = useState(false);
  const [anError, setAnError] = useState('');

  // ---------------------------------------------------------------------------
  // FINANCIAL AUDIT MODAL STATE
  // ---------------------------------------------------------------------------
  const [selectedFinancialPartnership, setSelectedFinancialPartnership] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState('');

  const handleOpenFinancialAudit = async (partnership) => {
    setSelectedFinancialPartnership(partnership);
    setFinancialLoading(true);
    setFinancialError('');
    try {
      const [dossier, disbList, expList] = await Promise.all([
        getPartnershipFinancials(partnership.id, 'admin'),
        listPartnershipDisbursements(partnership.id, 'admin').catch(() => []),
        listPartnershipExpenses(partnership.id, 'admin').catch(() => []),
      ]);
      setFinancialData({
        ...dossier,
        disbursements: disbList || [],
        expenses: expList || [],
      });
    } catch (err) {
      setFinancialError(err?.response?.data?.detail || err?.message || 'Failed to fetch financial audit dossier.');
    } finally {
      setFinancialLoading(false);
    }
  };

  const handleCloseFinancialAudit = () => {
    setSelectedFinancialPartnership(null);
    setFinancialData(null);
    setFinancialError('');
  };

  const pageSize = 12;

  // Sync inputs with URL
  useEffect(() => {
    setPLocalSearch(pSearchFilter);
  }, [pSearchFilter]);

  useEffect(() => {
    setALocalId(aIdFilter);
  }, [aIdFilter]);

  // Tab 1 Fetcher
  const fetchPartnerships = async () => {
    setPLoading(true);
    setPError('');
    try {
      const params = {
        page: pPageFilter,
        ordering: '-created_at',
      };
      if (pStatusFilter !== 'ALL') params.status = pStatusFilter;
      if (pSearchFilter.trim()) params.search = pSearchFilter.trim();

      const res = await listAdminCsrPartnerships(params);
      if (Array.isArray(res)) {
        setPartnerships(res);
        setPTotalCount(res.length);
      } else if (res && Array.isArray(res.results)) {
        setPartnerships(res.results);
        setPTotalCount(res.count || res.results.length);
      } else {
        setPartnerships([]);
        setPTotalCount(0);
      }
    } catch (err) {
      setPError(err.message || 'Failed to load platform CSR partnerships.');
    } finally {
      setPLoading(false);
    }
  };

  // Tab 2 Fetcher
  const fetchAuditHistory = async () => {
    setALoading(true);
    setAError('');
    try {
      const params = {
        page: aPageFilter,
        ordering: '-created_at',
      };
      if (aEntityFilter !== 'ALL') params.entity_type = aEntityFilter;
      if (aIdFilter.trim()) params.entity_id = aIdFilter.trim();

      const res = await listAdminCsrAuditHistory(params);
      if (Array.isArray(res)) {
        setAuditLogs(res);
        setATotalCount(res.length);
      } else if (res && Array.isArray(res.results)) {
        setAuditLogs(res.results);
        setATotalCount(res.count || res.results.length);
      } else {
        setAuditLogs([]);
        setATotalCount(0);
      }
    } catch (err) {
      setAError(err.message || 'Failed to load CSR verification audit history.');
    } finally {
      setALoading(false);
    }
  };

  // Tab 3 Fetcher
  const fetchAnalytics = async () => {
    setAnLoading(true);
    setAnError('');
    try {
      const res = await getAdminCsrAnalytics();
      setAnalyticsData(res);
    } catch (err) {
      setAnError(err.message || 'Failed to load national CSR portfolio analytics.');
    } finally {
      setAnLoading(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'partnerships') {
      fetchPartnerships();
    } else if (activeTab === 'audit') {
      fetchAuditHistory();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, pStatusFilter, pSearchFilter, pPageFilter, aEntityFilter, aIdFilter, aPageFilter]);

  const updateQuery = (newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const merged = { ...current, ...newParams };
    Object.keys(merged).forEach((k) => {
      if (merged[k] === '' || merged[k] === null || merged[k] === undefined) {
        delete merged[k];
      }
    });
    setSearchParams(merged);
  };

  const handleTabChange = (newTab) => {
    if (newTab === 'partnerships') navigate('/admin/csr/partnerships');
    else if (newTab === 'audit') navigate('/admin/csr/audit-history');
    else if (newTab === 'analytics') navigate('/admin/csr/analytics');
  };

  const pTotalPages = Math.ceil(pTotalCount / pageSize) || 1;
  const aTotalPages = Math.ceil(aTotalCount / pageSize) || 1;

  // Realization ratio calculation for Analytics
  const committedVal = parseFloat(analyticsData?.total_committed_funding) || 0;
  const disbursedVal = parseFloat(analyticsData?.total_disbursed_reported) || 0;
  const realizationRatio = committedVal > 0 ? Math.min(100, Math.round((disbursedVal / committedVal) * 100)) : 0;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              National Portfolio Oversight
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              National CSR Portfolio Oversight & Audit Ledger
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Cross-platform bilateral partnership tracking, statutory audit history verification, and nationwide Section 135 analytics.
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
              to="/admin/csr/requirements"
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-all"
            >
              Proposal Queue →
            </Link>
          </div>
        </div>

        {/* Top Tab Navigation Strip */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs flex flex-wrap gap-2">
          <button
            onClick={() => handleTabChange('partnerships')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'partnerships'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">handshake</span>
            Partnerships Oversight
          </button>

          <button
            onClick={() => handleTabChange('audit')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">history_edu</span>
            Verification Audit Ledger
          </button>

          <button
            onClick={() => handleTabChange('analytics')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">analytics</span>
            National CSR Analytics
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: PARTNERSHIPS OVERSIGHT */}
        {/* =================================================================== */}
        {activeTab === 'partnerships' && (
          <div className="space-y-5">
            {/* Filter Controls */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
                {PARTNERSHIP_STATUS_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => updateQuery({ p_status: tab.key, p_page: 1 })}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      pStatusFilter === tab.key
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateQuery({ p_search: pLocalSearch.trim(), p_page: 1 });
                }}
                className="flex items-center gap-3"
              >
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={pLocalSearch}
                    onChange={(e) => setPLocalSearch(e.target.value)}
                    placeholder="Search by partnership code, corporate sponsor, or NGO name..."
                    className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-all"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Loading */}
            {pLoading && (
              <div className="space-y-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 bg-slate-100 rounded-2xl"></div>
                ))}
              </div>
            )}

            {/* Error */}
            {!pLoading && pError && (
              <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-2xl">error_outline</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Failed to load platform partnerships</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">{pError}</p>
                <button
                  onClick={fetchPartnerships}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!pLoading && !pError && partnerships.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">handshake</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Bilateral Partnerships Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No platform partnerships match the specified status or search filter.
                </p>
              </div>
            )}

            {/* Table */}
            {!pLoading && !pError && partnerships.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Partnership Code</th>
                        <th className="px-4 py-3.5">Parties (Company & NGO)</th>
                        <th className="px-4 py-3.5">Proposal Title</th>
                        <th className="px-4 py-3.5">Agreed Capital</th>
                        <th className="px-4 py-3.5">Disbursed (Reported)</th>
                        <th className="px-4 py-3.5">Status & Progress</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {partnerships.map((p) => {
                        const statusInfo = getPartnershipStatusBadge(p.status);
                        const progress = Math.min(Math.round(p.progress_percentage || 0), 100);

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-4 font-mono font-bold text-slate-800">
                              {p.partnership_code || `CSR-PART-${p.id.slice(0, 8)}`}
                            </td>
                            <td className="px-4 py-4 space-y-0.5">
                              <div className="font-bold text-slate-900">
                                Corporate: {p.company_name || 'Corporate Partner'}
                              </div>
                              <div className="text-slate-500 text-[11px]">
                                NGO: {p.ngo_name || p.ngo_display_name || 'NGO Partner'}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-700 max-w-xs truncate font-medium">
                              {p.requirement_title || 'CSR Initiative'}
                            </td>
                            <td className="px-4 py-4 font-black text-slate-900">
                              {formatCurrency(p.agreed_funding_amount)}
                            </td>
                            <td className="px-4 py-4 font-bold text-emerald-700">
                              {formatCurrency(p.disbursed_amount_reported)}
                            </td>
                            <td className="px-4 py-4 space-y-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}>
                                <span className="material-symbols-outlined text-xs">{statusInfo.icon}</span>
                                {p.status_display || statusInfo.label}
                              </span>
                              <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button
                                onClick={() => handleOpenFinancialAudit(p)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 transition-colors shadow-2xs cursor-pointer"
                                title="Audit Bilateral Disbursements & Ground Invoices"
                              >
                                <span className="material-symbols-outlined text-sm">account_balance</span>
                                <span>Audit Financials</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pTotalPages > 1 && (
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Showing page {pPageFilter} of {pTotalPages} ({pTotalCount} partnerships)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuery({ p_page: Math.max(1, pPageFilter - 1) })}
                        disabled={pPageFilter <= 1}
                        className="px-3.5 py-1.5 bg-slate-100 rounded-xl font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-200"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => updateQuery({ p_page: Math.min(pTotalPages, pPageFilter + 1) })}
                        disabled={pPageFilter >= pTotalPages}
                        className="px-3.5 py-1.5 bg-slate-100 rounded-xl font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-200"
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

        {/* =================================================================== */}
        {/* TAB 2: AUDIT HISTORY LEDGER */}
        {/* =================================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-5">
            {/* Filter Controls */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
                {AUDIT_ENTITY_TYPES.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => updateQuery({ a_entity: type.key, a_page: 1 })}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      aEntityFilter === type.key
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Entity ID Search */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateQuery({ a_id: aLocalId.trim(), a_page: 1 });
                }}
                className="flex items-center gap-3"
              >
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-lg">
                    filter_alt
                  </span>
                  <input
                    type="text"
                    value={aLocalId}
                    onChange={(e) => setALocalId(e.target.value)}
                    placeholder="Filter by Entity UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)..."
                    className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-all"
                >
                  Filter Audit
                </button>
              </form>
            </div>

            {/* Loading */}
            {aLoading && (
              <div className="space-y-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>
                ))}
              </div>
            )}

            {/* Error */}
            {!aLoading && aError && (
              <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-2xl">error_outline</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Failed to load audit history</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">{aError}</p>
                <button
                  onClick={fetchAuditHistory}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Retry
                </button>
              </div>
            )}

            {/* Empty */}
            {!aLoading && !aError && auditLogs.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">history_toggle_off</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Audit Records Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No moderation status transitions recorded matching this query.
                </p>
              </div>
            )}

            {/* Audit Log Table */}
            {!aLoading && !aError && auditLogs.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Entity Type & ID</th>
                        <th className="px-4 py-3.5">Status Transition</th>
                        <th className="px-4 py-3.5">Moderator</th>
                        <th className="px-4 py-3.5">Review Notes / Remarks</th>
                        <th className="px-5 py-3.5 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4 space-y-1">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                              {log.entity_type}
                            </span>
                            <div className="font-mono text-[11px] text-slate-500 truncate max-w-[140px]">
                              {log.entity_id}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                              <span className="text-slate-500">{log.old_status || 'INIT'}</span>
                              <span className="material-symbols-outlined text-sm text-slate-400">arrow_forward</span>
                              <span className="text-blue-700 font-bold">{log.new_status}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-medium text-slate-700">
                            {log.reviewed_by_email || 'Administrator'}
                          </td>
                          <td className="px-4 py-4 text-slate-600 max-w-sm truncate italic">
                            {log.review_notes || '—'}
                          </td>
                          <td className="px-5 py-4 text-right text-slate-500 font-mono text-[11px]">
                            {new Date(log.created_at).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {aTotalPages > 1 && (
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Showing page {aPageFilter} of {aTotalPages} ({aTotalCount} audit events)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuery({ a_page: Math.max(1, aPageFilter - 1) })}
                        disabled={aPageFilter <= 1}
                        className="px-3.5 py-1.5 bg-slate-100 rounded-xl font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-200"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => updateQuery({ a_page: Math.min(aTotalPages, aPageFilter + 1) })}
                        disabled={aPageFilter >= aTotalPages}
                        className="px-3.5 py-1.5 bg-slate-100 rounded-xl font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-200"
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

        {/* =================================================================== */}
        {/* TAB 3: NATIONAL CSR ANALYTICS */}
        {/* =================================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Loading */}
            {anLoading && (
              <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-28 bg-slate-100 rounded-2xl"></div>
                  ))}
                </div>
                <div className="h-64 bg-slate-100 rounded-3xl"></div>
              </div>
            )}

            {/* Error */}
            {!anLoading && anError && (
              <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-2xl">error_outline</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Failed to load platform analytics</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">{anError}</p>
                <button
                  onClick={fetchAnalytics}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Retry
                </button>
              </div>
            )}

            {/* Analytics Dashboard Grid */}
            {!anLoading && !anError && analyticsData && (
              <div className="space-y-6">
                {/* 1. Financial Capital Flow Overview */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        National Capital Realization
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                        Statutory CSR Financial Capital Flow
                      </h2>
                    </div>

                    <button
                      onClick={fetchAnalytics}
                      className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      Refresh Analytics
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="p-5 bg-slate-50 rounded-2xl space-y-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Total Contracted Capital
                      </span>
                      <div className="text-2xl font-black text-slate-900">
                        {formatCurrency(analyticsData.total_committed_funding)}
                      </div>
                      <div className="text-[11px] text-slate-500">Committed bilateral volume</div>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-2xl space-y-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Total Reported Disbursed
                      </span>
                      <div className="text-2xl font-black text-emerald-600">
                        {formatCurrency(analyticsData.total_disbursed_reported)}
                      </div>
                      <div className="text-[11px] text-slate-500">Transferred corporate capital</div>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-2xl space-y-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Disbursement Realization
                      </span>
                      <div className="text-2xl font-black text-blue-600">
                        {realizationRatio}%
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${realizationRatio}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Platform Entities Tri-Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Corporate Ecosystem */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                      <span className="material-symbols-outlined text-blue-600">domain</span>
                      <h3 className="text-base font-bold text-slate-900">Corporate Donors</h3>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <span className="text-slate-600">Total Registered</span>
                        <strong className="font-bold text-slate-900 text-sm">{analyticsData.total_companies}</strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                        <span className="font-semibold">Verified & Approved</span>
                        <strong className="font-bold text-sm">{analyticsData.approved_companies}</strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-amber-50 text-amber-800 rounded-xl">
                        <span className="font-semibold">Pending Verification</span>
                        <strong className="font-bold text-sm">{analyticsData.pending_companies}</strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-red-50 text-red-800 rounded-xl">
                        <span className="font-semibold">Rejected / Incomplete</span>
                        <strong className="font-bold text-sm">{analyticsData.rejected_companies}</strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-orange-50 text-orange-800 rounded-xl">
                        <span className="font-semibold">Suspended Accounts</span>
                        <strong className="font-bold text-sm">{analyticsData.suspended_companies}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Proposal Pipeline */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                      <span className="material-symbols-outlined text-emerald-600">post_add</span>
                      <h3 className="text-base font-bold text-slate-900">CSR Proposals</h3>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <span className="text-slate-600">Total Submissions</span>
                        <strong className="font-bold text-slate-900 text-sm">{analyticsData.total_requirements}</strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                        <span className="font-semibold">Open on Marketplace</span>
                        <strong className="font-bold text-sm">{analyticsData.open_requirements}</strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-amber-50 text-amber-800 rounded-xl">
                        <span className="font-semibold">Pending Moderation</span>
                        <strong className="font-bold text-sm">{analyticsData.pending_requirements}</strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-blue-50 text-blue-800 rounded-xl">
                        <span className="font-semibold">Funded / Concluded</span>
                        <strong className="font-bold text-sm">{analyticsData.closed_requirements}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Bilateral Partnerships */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                      <span className="material-symbols-outlined text-indigo-600">handshake</span>
                      <h3 className="text-base font-bold text-slate-900">Active Partnerships</h3>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <span className="text-slate-600">Total Agreements</span>
                        <strong className="font-bold text-slate-900 text-sm">{analyticsData.total_partnerships}</strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                        <span className="font-semibold">Active in Execution</span>
                        <strong className="font-bold text-sm">{analyticsData.active_partnerships}</strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-blue-50 text-blue-800 rounded-xl">
                        <span className="font-semibold">Fully Completed</span>
                        <strong className="font-bold text-sm">{analyticsData.completed_partnerships}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Financial Audit Modal */}
      {selectedFinancialPartnership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  CSR Statutory Financial Audit Dossier
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  {selectedFinancialPartnership.partnership_code || `CSR-PART-${selectedFinancialPartnership.id.slice(0, 8)}`}
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Corporate: <strong className="text-slate-900">{selectedFinancialPartnership.company_name}</strong> | NGO: <strong className="text-slate-900">{selectedFinancialPartnership.ngo_name || selectedFinancialPartnership.ngo_display_name}</strong>
                </p>
              </div>
              <button
                onClick={handleCloseFinancialAudit}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Mandatory Statutory Off-Platform Notice */}
            <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-700 mt-0.5">policy</span>
              <div className="text-xs text-amber-900 space-y-1">
                <div className="font-bold">Indian CSR Statutory Framework (Companies Act 2013, Section 135)</div>
                <div className="text-amber-800 leading-relaxed">
                  100% of CSR grant capital moves directly and bilaterally via corporate bank wire (NEFT/RTGS) to the NGO bank account. DaanGives does not collect, hold, or escrow CSR funds. Platform records reflect corporate bank transfer advice, NGO bank receipt acknowledgements, and ground vendor expenditure invoices.
                </div>
              </div>
            </div>

            {financialLoading && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <span className="material-symbols-outlined animate-spin text-3xl text-blue-600">sync</span>
                <p className="text-sm font-semibold text-slate-600">Compiling financial reconciliation ledger...</p>
              </div>
            )}

            {financialError && (
              <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-xs font-semibold">
                {financialError}
              </div>
            )}

            {!financialLoading && financialData && (
              <div className="space-y-6">
                {/* 4 Multi-dimensional Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Agreed Capital</span>
                    <p className="text-base font-black text-slate-900 mt-0.5">
                      {formatCurrency(financialData.financials?.agreed_funding_amount || financialData.agreed_funding_amount)}
                    </p>
                  </div>
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Bank Wires Disbursed</span>
                    <p className="text-base font-black text-blue-900 mt-0.5">
                      {formatCurrency(financialData.financials?.total_disbursed_reported || financialData.total_disbursed_amount)}
                    </p>
                    <span className="text-[10px] text-blue-700 font-medium">
                      Verified: {formatCurrency(financialData.financials?.total_disbursed_verified || financialData.total_verified_disbursed_amount)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Ground Utilised</span>
                    <p className="text-base font-black text-emerald-900 mt-0.5">
                      {formatCurrency(financialData.financials?.total_expenses_reported || financialData.total_expenses_amount)}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      Verified: {formatCurrency(financialData.financials?.total_expenses_verified || financialData.total_verified_expenses_amount)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Discrepancy / Unspent</span>
                    <p className="text-base font-black text-amber-900 mt-0.5">
                      {formatCurrency(financialData.financials?.unspent_acknowledged_funds || financialData.unspent_disbursed_amount)}
                    </p>
                    <span className="text-[10px] text-amber-700 font-medium">
                      {Number(financialData.financials?.unspent_acknowledged_funds || 0) < 0 ? 'Overspent' : 'Pending Deployment'}
                    </span>
                  </div>
                </div>

                {/* Statutory Reconciliation Status Banner */}
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-emerald-400">verified_user</span>
                    <div>
                      <div className="text-xs font-bold">
                        Reconciliation State:{' '}
                        <span className="text-amber-300 font-mono">
                          {financialData.financial_status || (financialData.financials?.needs_reconciliation ? 'REQUIRES_RECONCILIATION' : 'RECONCILED')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        {financialData.statutory_disclosure || financialData.reconciliation_notice}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-slate-400">Total Disbursements</div>
                    <div className="font-mono font-bold text-white">{financialData.disbursements?.length || 0} Records</div>
                  </div>
                </div>

                {/* Section 1: Itemized Direct Bank Wire Disbursements */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-sm">payments</span>
                    <span>Itemized Direct Bank Wire Disbursements</span>
                  </h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="px-3.5 py-2.5">UTR / Txn Ref</th>
                          <th className="px-3.5 py-2.5">Mode & Bank</th>
                          <th className="px-3.5 py-2.5">Date</th>
                          <th className="px-3.5 py-2.5">Amount</th>
                          <th className="px-3.5 py-2.5">Evidence Status</th>
                          <th className="px-3.5 py-2.5">NGO Ack</th>
                          <th className="px-3.5 py-2.5 text-right">Proof</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(!financialData.disbursements || financialData.disbursements.length === 0) ? (
                          <tr>
                            <td colSpan="7" className="px-4 py-4 text-center text-slate-400">
                              No bank wire disbursements recorded yet.
                            </td>
                          </tr>
                        ) : (
                          financialData.disbursements.map((d) => (
                            <tr key={d.id} className="hover:bg-slate-50/50">
                              <td className="px-3.5 py-3 font-mono font-bold text-slate-800">{d.transaction_reference}</td>
                              <td className="px-3.5 py-3 text-slate-600">{d.payment_mode} ({d.bank_name || 'Direct Wire'})</td>
                              <td className="px-3.5 py-3 text-slate-500">{d.payment_date}</td>
                              <td className="px-3.5 py-3 font-bold text-slate-900">{formatCurrency(d.amount)}</td>
                              <td className="px-3.5 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  d.review_status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                                  d.review_status === 'FLAGGED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {d.review_status}
                                </span>
                              </td>
                              <td className="px-3.5 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  d.ngo_acknowledgement_status === 'ACKNOWLEDGED' ? 'bg-emerald-100 text-emerald-800' :
                                  d.ngo_acknowledgement_status === 'DISPUTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {d.ngo_acknowledgement_status}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 text-right">
                                {d.disbursement_evidence_doc_path ? (
                                  <a
                                    href={d.disbursement_evidence_doc_path}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-sm">attachment</span>
                                    <span>Advice</span>
                                  </a>
                                ) : (
                                  <span className="text-slate-400">None</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 2: Ground Project Expenditures & Invoices */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-sm">receipt_long</span>
                    <span>Itemized Ground Project Invoices & Expenditures</span>
                  </h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="px-3.5 py-2.5">Category</th>
                          <th className="px-3.5 py-2.5">Vendor / Payee</th>
                          <th className="px-3.5 py-2.5">Date</th>
                          <th className="px-3.5 py-2.5">Amount</th>
                          <th className="px-3.5 py-2.5">Review Status</th>
                          <th className="px-3.5 py-2.5 text-right">Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(!financialData.expenses || financialData.expenses.length === 0) ? (
                          <tr>
                            <td colSpan="6" className="px-4 py-4 text-center text-slate-400">
                              No ground project expenditures reported yet.
                            </td>
                          </tr>
                        ) : (
                          financialData.expenses.map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50/50">
                              <td className="px-3.5 py-3 font-semibold text-slate-800">{e.category}</td>
                              <td className="px-3.5 py-3 text-slate-700">{e.vendor_name || 'Vendor'}</td>
                              <td className="px-3.5 py-3 text-slate-500">{e.expense_date}</td>
                              <td className="px-3.5 py-3 font-bold text-slate-900">{formatCurrency(e.amount)}</td>
                              <td className="px-3.5 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  e.review_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                  e.review_status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {e.review_status}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 text-right">
                                {e.expense_invoice_doc_path ? (
                                  <a
                                    href={e.expense_invoice_doc_path}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-sm">receipt</span>
                                    <span>Invoice</span>
                                  </a>
                                ) : (
                                  <span className="text-slate-400">None</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleCloseFinancialAudit}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Audit Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
