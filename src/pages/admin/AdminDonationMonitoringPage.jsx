import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import Badge from '../../components/common/Badge';
import {
  getAdminMonetaryDonations,
  getAdminForm10BdLedger,
  downloadAdminReceiptPdf,
  downloadAdminForm10BePdf,
  downloadAdminForm10BdCsv,
} from '../../services/api';

const FINANCIAL_YEARS = ['FY 2026-27', 'FY 2025-26', 'FY 2024-25'];

export default function AdminDonationMonitoringPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(true);

  // Tab State: 'DONATIONS' | 'COMPLIANCE'
  const [activeTab, setActiveTab] = useState('DONATIONS');

  // Monetary Donations State
  const [donations, setDonations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [donationError, setDonationError] = useState('');

  // Compliance Ledger State
  const [selectedFy, setSelectedFy] = useState('FY 2026-27');
  const [complianceData, setComplianceData] = useState(null);
  const [loadingCompliance, setLoadingCompliance] = useState(false);
  const [complianceError, setComplianceError] = useState('');

  // Action / Download States
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloading10BeId, setDownloading10BeId] = useState(null);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [actionError, setActionError] = useState('');

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
    fetchDonations();
  }, []);

  useEffect(() => {
    if (activeTab === 'COMPLIANCE') {
      fetchComplianceLedger(selectedFy);
    }
  }, [activeTab, selectedFy]);

  const fetchDonations = async () => {
    setLoadingDonations(true);
    setDonationError('');
    setActionError('');
    try {
      const res = await getAdminMonetaryDonations();
      const list = Array.isArray(res) ? res : (res.results || []);
      setDonations(list);
    } catch (err) {
      if (err.status === 401) {
        navigate('/login');
      }
      setDonationError(err.message || 'Failed to load platform donation records.');
    } finally {
      setLoadingDonations(false);
    }
  };

  const fetchComplianceLedger = async (fy) => {
    setLoadingCompliance(true);
    setComplianceError('');
    try {
      const data = await getAdminForm10BdLedger({ financial_year: fy });
      setComplianceData(data);
    } catch (err) {
      setComplianceError(err.message || 'Failed to load platform Form 10BD compliance ledger.');
    } finally {
      setLoadingCompliance(false);
    }
  };

  const handleDownloadReceipt = async (donationId) => {
    if (!donationId || downloadingId) return;
    setDownloadingId(donationId);
    setActionError('');
    try {
      await downloadAdminReceiptPdf(donationId);
    } catch (err) {
      setActionError(err.message || 'Unable to download verified donation receipt PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadForm10Be = async (donationId) => {
    if (!donationId || downloading10BeId) return;
    setDownloading10BeId(donationId);
    setActionError('');
    try {
      await downloadAdminForm10BePdf(donationId);
    } catch (err) {
      setActionError(err.message || 'Unable to download official Form 10BE certificate PDF.');
    } finally {
      setDownloading10BeId(null);
    }
  };

  const handleExportCsv = async () => {
    if (exportingCsv) return;
    setExportingCsv(true);
    setActionError('');
    try {
      await downloadAdminForm10BdCsv({ financial_year: selectedFy });
    } catch (err) {
      setActionError(err.message || 'Failed to export platform Form 10BD CSV preparation file.');
    } finally {
      setExportingCsv(false);
    }
  };

  // Calculations for Donation Overview
  const successfulDonations = donations.filter((d) => d.status === 'SUCCESS');
  const totalVolume = successfulDonations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const pendingCount = donations.filter((d) => d.status === 'PENDING').length;
  const failedCount = donations.filter((d) => d.status === 'FAILED').length;

  const filteredDonations = donations.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.receipt_number?.toLowerCase().includes(term) ||
      d.campaign_title?.toLowerCase().includes(term) ||
      d.ngo_name?.toLowerCase().includes(term) ||
      d.donor_email?.toLowerCase().includes(term) ||
      d.donor_name?.toLowerCase().includes(term) ||
      d.gateway_order_id?.toLowerCase().includes(term) ||
      d.gateway_payment_id?.toLowerCase().includes(term)
    );
  });

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="p-8 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-center font-bold text-sm">
          Access Denied. Administrative privileges required to view national monetary donation logs.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Donation Monitoring & Compliance Audit Suite</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              National monetary donation audit ledger, Section 80G tax receipts, and Form 10BD compliance preparation.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('DONATIONS')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'DONATIONS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Donation Audit Ledger
            </button>
            <button
              onClick={() => setActiveTab('COMPLIANCE')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'COMPLIANCE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Form 10BD Platform Compliance
            </button>
          </div>
        </div>

        {/* Global Action Error Alert */}
        {actionError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs font-semibold text-red-700">
            <span>{actionError}</span>
            <button onClick={() => setActionError('')} className="underline hover:text-red-900">Dismiss</button>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1: MONETARY DONATIONS AUDIT LEDGER */}
        {/* ================================================================= */}
        {activeTab === 'DONATIONS' && (
          <div className="space-y-6">
            
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Platform Volume</span>
                <span className="text-2xl font-extrabold text-emerald-600 block">
                  ₹{totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Verified Cleared Funds</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Successful Donations</span>
                <span className="text-2xl font-extrabold text-slate-900 block">{successfulDonations.length}</span>
                <span className="text-[11px] text-slate-400 font-medium">80G Receipts Generated</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Pending Transactions</span>
                <span className="text-2xl font-extrabold text-amber-600 block">{pendingCount}</span>
                <span className="text-[11px] text-slate-400 font-medium">Awaiting Gateway Callback</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Failed Orders</span>
                <span className="text-2xl font-extrabold text-red-600 block">{failedCount}</span>
                <span className="text-[11px] text-slate-400 font-medium">Declined / Expired Sessions</span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {['ALL', 'SUCCESS', 'PENDING', 'FAILED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      statusFilter === status
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'ALL' ? 'All Transactions' : status}
                  </button>
                ))}
              </div>

              <div className="relative max-w-sm w-full">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                <input
                  type="text"
                  placeholder="Search receipt, campaign, NGO, donor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 text-slate-900"
                />
              </div>
            </div>

            {/* Error Display */}
            {donationError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs font-semibold text-red-700">
                <span>{donationError}</span>
                <button onClick={fetchDonations} className="underline hover:text-red-900">Retry</button>
              </div>
            )}

            {/* Donations Table */}
            {loadingDonations ? (
              <div className="py-20 text-center text-xs text-slate-400 space-y-2 bg-white rounded-3xl border border-slate-200">
                <span className="material-symbols-outlined text-3xl text-slate-900 animate-spin">progress_activity</span>
                <p className="font-semibold text-slate-600">Loading national donation ledger...</p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-xs">
                <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">No Donations Match Filter</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchTerm ? 'No platform contributions matched your search criteria.' : 'No monetary donations have been recorded on the platform yet.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Receipt / Order Ref</th>
                        <th className="py-3.5 px-4">Campaign & Non-Profit</th>
                        <th className="py-3.5 px-4">Donor Identity</th>
                        <th className="py-3.5 px-4">Amount & Date</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Audit Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDonations.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4 font-mono">
                            <div className="font-bold text-slate-900">{d.receipt_number}</div>
                            {d.gateway_order_id && (
                              <div className="text-[10px] text-slate-400 font-mono">Order: {d.gateway_order_id}</div>
                            )}
                            {d.gateway_transaction_reference && (
                              <div className="text-[10px] text-emerald-600 font-mono">Payment: {d.gateway_transaction_reference}</div>
                            )}
                          </td>
                          <td className="py-4 px-4 max-w-xs">
                            <div className="font-bold text-slate-900 truncate">{d.campaign_title || 'Campaign'}</div>
                            <div className="text-[11px] text-slate-500 truncate">NGO: {d.ngo_name || 'Verified Non-Profit'}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-slate-900">{d.donor_name || 'Verified Donor'}</div>
                            <div className="text-[11px] text-slate-400">{d.donor_email || '—'}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900">₹{parseFloat(d.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            <div className="text-[10px] text-slate-400">
                              {d.paid_at ? new Date(d.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                d.status === 'SUCCESS'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : d.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {d.status}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1" title={d.settlement_status_display || 'Settlement information not available / pending verification'}>
                                <span className="material-symbols-outlined text-[11px] text-amber-500">schedule</span>
                                <span>Settlement: Pending</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {d.status === 'SUCCESS' && (
                                <button
                                  onClick={() => handleDownloadReceipt(d.id)}
                                  disabled={downloadingId === d.id}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 border border-slate-200 disabled:opacity-50"
                                  title="Download Official Section 80G Receipt PDF"
                                >
                                  <span className="material-symbols-outlined text-xs">download</span>
                                  <span>{downloadingId === d.id ? 'Loading...' : 'Receipt'}</span>
                                </button>
                              )}

                              {d.has_form_10be && (
                                <button
                                  onClick={() => handleDownloadForm10Be(d.id)}
                                  disabled={downloading10BeId === d.id}
                                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 border border-indigo-200 disabled:opacity-50"
                                  title={`Download Official Form 10BE (${d.form_10be_certificate_number || 'Available'})`}
                                >
                                  <span className="material-symbols-outlined text-xs">verified</span>
                                  <span>{downloading10BeId === d.id ? 'Loading...' : 'Form 10BE'}</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: FORM 10BD ANNUAL PLATFORM COMPLIANCE */}
        {/* ================================================================= */}
        {activeTab === 'COMPLIANCE' && (
          <div className="space-y-6">
            
            {/* Compliance Header & Controls */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">Form 10BD Statement Preparation Suite</h2>
                <p className="text-xs text-slate-500">
                  Annual statutory electronic filing preparation for Section 80G compliant donations across India.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedFy}
                  onChange={(e) => setSelectedFy(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-400"
                >
                  {FINANCIAL_YEARS.map((fy) => (
                    <option key={fy} value={fy}>{fy}</option>
                  ))}
                </select>

                <button
                  onClick={handleExportCsv}
                  disabled={exportingCsv || loadingCompliance}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>{exportingCsv ? 'Exporting...' : 'Export Form 10BD CSV'}</span>
                </button>
              </div>
            </div>

            {/* Compliance Error */}
            {complianceError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs font-semibold text-red-700">
                <span>{complianceError}</span>
                <button onClick={() => fetchComplianceLedger(selectedFy)} className="underline hover:text-red-900">Retry</button>
              </div>
            )}

            {/* Summary Metrics */}
            {complianceData?.summary && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">80G Eligible Total</span>
                  <span className="text-2xl font-extrabold text-emerald-600 block">
                    ₹{parseFloat(complianceData.summary.total_80g_eligible_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{complianceData.summary.total_80g_donations_count || 0} Donations in {selectedFy}</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Unique Donors</span>
                  <span className="text-2xl font-extrabold text-slate-900 block">{complianceData.summary.total_donors_count || 0}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Registered / Tax-Identified</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Ready for 10BD Filing</span>
                  <span className="text-2xl font-extrabold text-slate-900 block">{complianceData.summary.ready_for_filing_count || 0}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Complete PAN & Address</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Form 10BE Uploaded</span>
                  <span className="text-2xl font-extrabold text-indigo-600 block">{complianceData.summary.form_10be_uploaded_count || 0}</span>
                  <span className="text-[11px] text-slate-400 font-medium">{complianceData.summary.form_10be_pending_count || 0} Awaiting NGO Upload</span>
                </div>
              </div>
            )}

            {/* Compliance Table */}
            {loadingCompliance ? (
              <div className="py-20 text-center text-xs text-slate-400 space-y-2 bg-white rounded-3xl border border-slate-200">
                <span className="material-symbols-outlined text-3xl text-slate-900 animate-spin">progress_activity</span>
                <p className="font-semibold text-slate-600">Aggregating compliance records for {selectedFy}...</p>
              </div>
            ) : !complianceData || (complianceData.donations && complianceData.donations.length === 0) ? (
              <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-xs">
                <span className="material-symbols-outlined text-4xl text-slate-300">fact_check</span>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">No Form 10BD Records for {selectedFy}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No verified Section 80G monetary contributions were logged on the platform for this financial year.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Receipt Reference</th>
                        <th className="py-3.5 px-4">Donor Name</th>
                        <th className="py-3.5 px-4">PAN Masked</th>
                        <th className="py-3.5 px-4">Entity Type</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">10BD Readiness</th>
                        <th className="py-3.5 px-4 text-right">Form 10BE Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {complianceData.donations.map((row) => (
                        <tr key={row.donation_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-slate-900">{row.receipt_number}</td>
                          <td className="py-4 px-4 font-semibold text-slate-900">{row.donor_name || 'Donor'}</td>
                          <td className="py-4 px-4 font-mono text-slate-700">{row.pan_masked || <span className="text-amber-600 font-sans italic">Missing</span>}</td>
                          <td className="py-4 px-4">{row.entity_type || 'INDIVIDUAL'}</td>
                          <td className="py-4 px-4 font-bold text-slate-900">₹{parseFloat(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.is_ready_for_10bd
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {row.is_ready_for_10bd ? 'COMPLETE' : 'INCOMPLETE'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {row.has_form_10be ? (
                              <button
                                onClick={() => handleDownloadForm10Be(row.donation_id)}
                                disabled={downloading10BeId === row.donation_id}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-200 inline-flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-xs">verified</span>
                                <span>{row.form_10be_certificate_number || 'Download 10BE'}</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium italic">Pending Upload</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Statutory Compliance Information Note */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span className="material-symbols-outlined text-sm text-indigo-600">info</span>
                <span>Statutory Compliance Notice — Section 80G(5)(vi) & Form 10BD</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Form 10BD statements are filed electronically by verified non-profit partners on the Income Tax Portal. Following acceptance, the Income Tax Department issues official Form 10BE certificates which are securely uploaded by the NGO and made available to donors. DaanGives does not issue official Form 10BE certificates.
              </p>
            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
}
