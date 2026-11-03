import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import Badge from '../../components/common/Badge';
import { getAdminNgos, getAdminMonetaryDonations, downloadAdminReceiptPdf } from '../../services/api';
import { getAdminProjects } from '../../services/api/projects';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(true);
  const [pendingNgos, setPendingNgos] = useState([]);
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [totalPendingProjectsCount, setTotalPendingProjectsCount] = useState(0);
  const [monetaryDonations, setMonetaryDonations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingDonationId, setDownloadingDonationId] = useState(null);
  const [downloadError, setDownloadError] = useState('');

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

    fetchAdminDashboardData();
  }, []);

  const fetchAdminDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ngosRes, donationsRes, projectsRes] = await Promise.all([
        getAdminNgos({ status: 'PENDING', page: 1 }).catch(() => ({ results: [], count: 0 })),
        getAdminMonetaryDonations().catch(() => []),
        getAdminProjects({ status: 'PENDING', page: 1 }).catch(() => ({ results: [], count: 0 })),
      ]);

      if (ngosRes.results) {
        setPendingNgos(ngosRes.results.slice(0, 5));
        setTotalPendingCount(ngosRes.count || 0);
      } else if (Array.isArray(ngosRes)) {
        setPendingNgos(ngosRes.slice(0, 5));
        setTotalPendingCount(ngosRes.length);
      }

      if (projectsRes.results) {
        setPendingProjects(projectsRes.results.slice(0, 5));
        setTotalPendingProjectsCount(projectsRes.count || 0);
      } else if (Array.isArray(projectsRes)) {
        setPendingProjects(projectsRes.slice(0, 5));
        setTotalPendingProjectsCount(projectsRes.length);
      }

      const donationsList = Array.isArray(donationsRes) ? donationsRes : (donationsRes.results || []);
      setMonetaryDonations(donationsList);

    } catch (err) {
      if (err.status === 401) {
        navigate('/login');
      }
      setError(err.message || 'Failed to load administrative overview.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (donationId) => {
    if (!donationId || downloadingDonationId) return;
    setDownloadingDonationId(donationId);
    setDownloadError('');
    try {
      await downloadAdminReceiptPdf(donationId);
    } catch (err) {
      setDownloadError(err.message || 'Unable to download the platform donation receipt.');
    } finally {
      setDownloadingDonationId(null);
    }
  };

  const successfulDonations = monetaryDonations.filter((d) => d.status === 'SUCCESS');
  const totalVolume = successfulDonations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const pendingCount = monetaryDonations.filter((d) => d.status === 'PENDING').length;

  const filteredDonations = monetaryDonations.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.receipt_number?.toLowerCase().includes(term) ||
      d.campaign_title?.toLowerCase().includes(term) ||
      d.ngo_name?.toLowerCase().includes(term) ||
      d.donor_email?.toLowerCase().includes(term) ||
      d.donor_name?.toLowerCase().includes(term)
    );
  });

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-xs">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
          <p className="text-xs text-slate-500 font-medium">Administrative authentication required.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Government Inspector & Admin Console</span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Platform Governance & Financial Oversight</h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              National Non-Profit Regulatory Suite. Real-time monitoring of registered trusts, campaign appeals, and monetary transactions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin/ngos"
              className="px-3.5 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-xs shrink-0 text-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">verified_user</span>
              Pending NGOs ({totalPendingCount})
            </Link>
            <Link
              to="/admin/projects"
              className="px-3.5 py-2 bg-white text-slate-800 font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs shrink-0 text-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base text-slate-500">assignment_turned_in</span>
              Pending Proposals ({totalPendingProjectsCount})
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchAdminDashboardData} className="underline">Retry</button>
          </div>
        )}

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-1 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Pending NGO Approvals</span>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600">{totalPendingCount} NGOs</div>
            <Link to="/admin/ngos" className="text-[11px] text-amber-600 font-bold hover:underline block">
              Inspect Organization Queue →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-1 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Pending Project Proposals</span>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{totalPendingProjectsCount} Proposals</div>
            <Link to="/admin/projects" className="text-[11px] text-blue-600 font-bold hover:underline block">
              Review Development Queue →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-1 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Total Verified Donations</span>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
              ₹{totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-700 font-bold">
              {successfulDonations.length} Successful Payment{successfulDonations.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-1 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Pending Transactions</span>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">{pendingCount} Active</div>
            <p className="text-[11px] text-slate-500 font-medium">Gateway Order State</p>
          </div>
        </div>

        {/* Platform Monetary Transactions Table */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Monetary Donations & Payment Ledger</h2>
              <p className="text-xs text-slate-500">Live platform-wide transaction records and gateway audit trails.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {['ALL', 'SUCCESS', 'PENDING', 'FAILED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      statusFilter === st ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-sm">search</span>
                <input
                  type="text"
                  placeholder="Search receipt, NGO, payment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 text-slate-800"
                />
              </div>
            </div>
          </div>

          {downloadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center justify-between">
              <span>{downloadError}</span>
              <button onClick={() => setDownloadError('')} className="underline">Dismiss</button>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <span className="material-symbols-outlined text-3xl text-blue-600 animate-spin">progress_activity</span>
              <p className="font-semibold">Loading monetary transaction ledger...</p>
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 font-medium">
              No monetary donation records found matching criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">Receipt / Ref</th>
                    <th className="pb-3 px-3">Campaign & Non-Profit</th>
                    <th className="pb-3 px-3">Donor / User</th>
                    <th className="pb-3 px-3">Amount</th>
                    <th className="pb-3 px-3">Gateway Payment ID</th>
                    <th className="pb-3 px-3">Date</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDonations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">{d.receipt_number}</td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block">{d.campaign_title}</span>
                        <span className="text-[11px] text-slate-500">{d.ngo_name}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-900 block">{d.donor_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{d.donor_email}</span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-blue-600 text-sm">
                        ₹{parseFloat(d.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                        {d.gateway_payment_id || <span className="text-slate-400 italic">Order Pending</span>}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                        {d.paid_at
                          ? new Date(d.paid_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                          : new Date(d.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          d.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : d.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {d.status === 'SUCCESS' ? (
                          <button
                            onClick={() => handleDownloadReceipt(d.id)}
                            disabled={downloadingDonationId === d.id}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs inline-flex items-center gap-1 border border-slate-300 disabled:opacity-50"
                            title="Download Official Receipt PDF"
                          >
                            <span className="material-symbols-outlined text-xs">
                              {downloadingDonationId === d.id ? 'progress_activity' : 'download'}
                            </span>
                            <span>{downloadingDonationId === d.id ? '...' : 'PDF'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* NGO Application Queue Table */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">NGO Applications Pending Audit</h2>
            <Link to="/admin/ngos" className="text-xs font-bold text-blue-600 hover:underline">
              View Full Verification Queue ({totalPendingCount})
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading pending application queue...</div>
          ) : pendingNgos.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 font-medium">
              No submitted NGO applications currently awaiting administrative review.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">NGO Name</th>
                    <th className="pb-3 px-3">Category</th>
                    <th className="pb-3 px-3">Registration No.</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingNgos.map((ngo) => (
                    <tr key={ngo.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{ngo.legal_name || ngo.display_name}</td>
                      <td className="py-3 px-3 text-slate-500 font-semibold">{ngo.category}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{ngo.registration_number || 'N/A'}</td>
                      <td className="py-3 px-3">
                        <Badge variant="warning">{ngo.status}</Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/admin/ngos/${ngo.id}`}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 text-xs transition-colors"
                        >
                          Inspect Application →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Project Proposals Pending Verification Table */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-slate-700">assignment_turned_in</span>
              <h2 className="text-base font-bold text-slate-900">Village Project Proposals Pending Verification</h2>
            </div>
            <Link to="/admin/projects" className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
              View Full Project Queue ({totalPendingProjectsCount}) →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading project queue...</div>
          ) : pendingProjects.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 font-medium">
              No village project proposals currently awaiting administrative review.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">Project Title</th>
                    <th className="pb-3 px-3">NGO Sanstha</th>
                    <th className="pb-3 px-3">Category</th>
                    <th className="pb-3 px-3">Budget (₹)</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingProjects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">{proj.title}</td>
                      <td className="py-3 px-3 text-slate-600">{proj.organization_name || 'Sanstha Partner'}</td>
                      <td className="py-3 px-3 text-slate-500 font-medium">{proj.category_display || proj.category}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        ₹{parseFloat(proj.estimated_cost).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={proj.status === 'UNDER_REVIEW' ? 'warning' : 'info'}>
                          {proj.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/admin/projects/${proj.id}`}
                          className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-medium rounded-md hover:bg-slate-50 text-xs transition-colors shadow-xs"
                        >
                          Review Proposal →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
