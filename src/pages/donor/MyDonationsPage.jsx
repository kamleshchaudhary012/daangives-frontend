import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DonorLayout from '../../layouts/DonorLayout';
import {
  getDonorMonetaryDonations,
  downloadDonorReceiptPdf,
  emailDonorMonetaryReceipt,
  downloadDonorForm10BePdf,
  notifyDonorForm10Be,
} from '../../services/api';

export default function MyDonationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState(currentTab);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Datasets
  const [monetaryDonations, setMonetaryDonations] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Action states
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null);
  const [emailingReceiptId, setEmailingReceiptId] = useState(null);
  const [downloading10BeId, setDownloading10BeId] = useState(null);
  const [notifying10BeId, setNotifying10BeId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams(tabKey === 'all' ? {} : { tab: tabKey });
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    setLoading(true);
    setError('');
    setActionSuccess('');
    setActionError('');
    try {
      const monetaryRes = await getDonorMonetaryDonations().catch(() => []);
      const mList = Array.isArray(monetaryRes) ? monetaryRes : (monetaryRes.results || []);
      setMonetaryDonations(mList);
    } catch (err) {
      setError(err.message || 'Failed to load contribution history.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (donationId) => {
    if (!donationId || downloadingReceiptId) return;
    setDownloadingReceiptId(donationId);
    setActionError('');
    setActionSuccess('');
    try {
      await downloadDonorReceiptPdf(donationId);
      setActionSuccess('Tax receipt downloaded successfully.');
    } catch (err) {
      setActionError(err.message || 'Unable to download the receipt right now. Please try again.');
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const handleEmailReceipt = async (donationId) => {
    if (!donationId || emailingReceiptId) return;
    setEmailingReceiptId(donationId);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await emailDonorMonetaryReceipt(donationId);
      setActionSuccess(res?.message || 'Receipt email dispatched successfully.');
    } catch (err) {
      setActionError(err.message || 'Failed to dispatch receipt email.');
    } finally {
      setEmailingReceiptId(null);
    }
  };

  const handleDownloadForm10Be = async (donationId) => {
    if (!donationId || downloading10BeId) return;
    setDownloading10BeId(donationId);
    setActionError('');
    setActionSuccess('');
    try {
      await downloadDonorForm10BePdf(donationId);
      setActionSuccess('Form 10BE certificate downloaded successfully.');
    } catch (err) {
      setActionError(err.message || 'Unable to download the Form 10BE certificate.');
    } finally {
      setDownloading10BeId(null);
    }
  };

  const handleNotify10Be = async (donationId) => {
    if (!donationId || notifying10BeId) return;
    setNotifying10BeId(donationId);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await notifyDonorForm10Be(donationId);
      setActionSuccess(res?.message || 'Notification request for Form 10BE registered successfully.');
    } catch (err) {
      setActionError(err.message || 'Unable to register Form 10BE notification request.');
    } finally {
      setNotifying10BeId(null);
    }
  };

  // Format for display
  const items = monetaryDonations.map((m) => ({
    id: m.id,
    sortDate: new Date(m.paid_at || m.created_at || Date.now()).getTime(),
    date: m.paid_at || m.created_at,
    receiptNumber: m.receipt_number,
    title: m.campaign_title || 'Financial Contribution',
    ngoName: m.ngo_name || 'Verified Non-Profit',
    amount: parseFloat(m.amount) || 0,
    status: m.status,
    hasForm10Be: m.has_form_10be,
    form10BeNumber: m.form_10be_certificate_number,
    campaignSlug: m.campaign_slug,
    gatewayRef: m.gateway_transaction_reference || m.gateway_payment_id || null,
    gatewayOrder: m.gateway_order_reference || m.gateway_order_id || null,
    taxReceiptStatus: m.tax_receipt_status || (m.status === 'SUCCESS' ? 'ISSUED' : 'PENDING'),
    taxReceiptHash: m.tax_receipt_sha256 || null,
    verificationSource: m.verification_source || (m.status === 'SUCCESS' ? 'RAZORPAY_HMAC_SHA256' : 'UNVERIFIED'),
    settlementStatusDisplay: m.settlement_status_display || 'Settlement information not available / pending verification with payment gateway and NGO bank account',
    fundUtilizationNotice: m.fund_utilization_notice || 'Payment verified via payment gateway. NGO fund disbursement is tracked via campaign milestones; gateway success does not constitute immediate ground expenditure.',
    raw: m,
  }));

  // Sort items descending by date
  items.sort((a, b) => b.sortDate - a.sortDate);

  // Tab filtering
  const tabFilteredItems = items.filter((item) => {
    if (activeTab === 'receipts') {
      return item.status === 'SUCCESS';
    }
    if (activeTab === '10be') {
      return item.status === 'SUCCESS';
    }
    return true;
  });

  // Search filtering
  const filteredItems = tabFilteredItems.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.receiptNumber?.toLowerCase().includes(term) ||
      item.title?.toLowerCase().includes(term) ||
      item.ngoName?.toLowerCase().includes(term)
    );
  });

  const successfulDonations = monetaryDonations.filter((d) => d.status === 'SUCCESS');
  const totalSuccessfulFunds = successfulDonations
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  return (
    <DonorLayout>
      <div className="space-y-8">
        
        {/* Header with Summary Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Contributions & Tax Documents</h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Full transparent record of verified monetary donations, tax-exempt 80G receipts, and Form 10BE filing certificates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant/60 text-right">
              <span className="text-[10px] text-on-surface-variant font-semibold uppercase block">Verified Funds</span>
              <span className="text-sm font-bold text-primary">
                ₹{totalSuccessfulFunds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant/60 text-right">
              <span className="text-[10px] text-on-surface-variant font-semibold uppercase block">80G Receipts</span>
              <span className="text-sm font-bold text-secondary">
                {successfulDonations.length} Issued
              </span>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-outline-variant/60 gap-4 text-xs font-semibold">
          <button
            onClick={() => handleTabChange('all')}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">receipt_long</span>
            <span>All Contributions ({items.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('receipts')}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'receipts'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">verified</span>
            <span>80G Tax Receipts ({successfulDonations.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('10be')}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === '10be'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">description</span>
            <span>Form 10BE ({items.filter(i => i.hasForm10Be).length})</span>
          </button>
        </div>

        {/* Global Feedback Notifications */}
        {actionSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess('')} className="underline hover:text-emerald-800">Dismiss</button>
          </div>
        )}

        {actionError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between text-xs font-semibold text-red-700 dark:text-red-300">
            <span>{actionError}</span>
            <button onClick={() => setActionError('')} className="underline hover:text-red-800">Dismiss</button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between text-xs font-semibold text-red-700 dark:text-red-300">
            <span>{error}</span>
            <button onClick={fetchDonations} className="underline hover:text-red-800">Retry</button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="text-xs font-semibold text-on-surface-variant">
            Showing {filteredItems.length} {filteredItems.length === 1 ? 'donation' : 'donations'}
          </div>

          <div className="relative max-w-xs w-full">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-sm">search</span>
            <input
              type="text"
              placeholder="Search contributions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-xs focus:outline-none focus:border-primary text-on-surface"
            />
          </div>
        </div>

        {/* Contributions List */}
        {loading ? (
          <div className="py-20 text-center text-xs text-on-surface-variant space-y-3 bg-surface-container-lowest rounded-3xl border border-outline-variant/60">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
            <p className="font-semibold text-sm">Loading contribution history...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-surface-container-lowest p-8 sm:p-12 rounded-3xl border border-outline-variant/60 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl mx-auto border border-primary/20">
              <span className="material-symbols-outlined text-3xl">receipt_long</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-on-surface">No Contributions Found</h2>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                {searchTerm
                  ? 'No contributions matched your search keyword.'
                  : 'You have not made monetary donations yet. Explore verified appeals to direct your financial support.'}
              </p>
            </div>
            <Link
              to="/campaigns"
              className="inline-block px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-container transition-all"
            >
              Explore Active Campaigns
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={`monetary-${item.id}`}
                className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-outline-variant"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                      MONETARY
                    </span>
                    <span className="font-bold text-on-surface text-base">
                      {item.title}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                      item.status === 'SUCCESS'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : item.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="text-xs text-on-surface-variant flex flex-wrap items-center gap-2 sm:gap-3">
                    <span>NGO: <strong className="text-on-surface">{item.ngoName}</strong></span>
                    <span>•</span>
                    <span>Receipt: <strong className="font-mono text-on-surface">{item.receiptNumber}</strong></span>
                    {item.gatewayRef && (
                      <>
                        <span>•</span>
                        <span>Gateway Ref: <strong className="font-mono text-on-surface text-[11px]">{item.gatewayRef}</strong></span>
                      </>
                    )}
                    {item.date && (
                      <>
                        <span>•</span>
                        <span>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </>
                    )}
                  </div>

                  {/* Financial & Settlement Transparency Banner */}
                  <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-1 text-[11px]">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs text-emerald-600">verified</span>
                        <span>Tax Receipt: <strong className="text-on-surface font-semibold">{item.taxReceiptStatus}</strong></span>
                        {item.taxReceiptHash && (
                          <span className="font-mono text-[10px] text-on-surface-variant/80 hidden sm:inline">
                            (SHA-256: {item.taxReceiptHash.substring(0, 12)}...)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-amber-600">schedule</span>
                        <span className="text-on-surface-variant">Settlement: <strong className="text-on-surface font-medium">Pending Gateway Verification</strong></span>
                      </div>
                    </div>
                    <p className="text-[10px] text-on-surface-variant/75 leading-tight italic">
                      Notice: Payment gateway success is verified cryptographically. NGO field fund disbursement follows campaign milestone progress.
                    </p>
                  </div>

                  {item.hasForm10Be && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-[11px] font-semibold">
                      <span className="material-symbols-outlined text-xs">verified</span>
                      <span>Form 10BE Available: {item.form10BeNumber || 'Official Certificate'}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-outline-variant/30">
                  <div className="text-left md:text-right">
                    <span className="text-lg font-bold text-primary block">
                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold block">
                      {item.status === 'SUCCESS' ? '80G Tax Deductible' : 'Monetary Intent'}
                    </span>
                  </div>

                  {item.status === 'SUCCESS' && (
                    <div className="flex flex-wrap items-center gap-2">
                      {item.campaignSlug && (
                        <Link
                          to={`/campaigns/${item.campaignSlug}/tracking`}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs rounded-xl transition-colors border border-primary/20 flex items-center gap-1"
                          title="Track Verified Campaign Impact & Field Proofs"
                        >
                          <span className="material-symbols-outlined text-xs">fact_check</span>
                          <span>Track Impact</span>
                        </Link>
                      )}

                      <button
                        onClick={() => handleDownloadReceipt(item.id)}
                        disabled={downloadingReceiptId === item.id}
                        className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs rounded-xl transition-colors border border-outline-variant/60 flex items-center gap-1 disabled:opacity-50"
                        title="Download Verified Tax Receipt PDF"
                      >
                        <span className="material-symbols-outlined text-xs">download</span>
                        <span>{downloadingReceiptId === item.id ? '...' : 'Receipt'}</span>
                      </button>

                      <button
                        onClick={() => handleEmailReceipt(item.id)}
                        disabled={emailingReceiptId === item.id}
                        className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs rounded-xl transition-colors border border-outline-variant/60 flex items-center gap-1 disabled:opacity-50"
                        title="Resend Tax Receipt to Registered Email"
                      >
                        <span className="material-symbols-outlined text-xs">mail</span>
                        <span>{emailingReceiptId === item.id ? '...' : 'Email'}</span>
                      </button>

                      {item.hasForm10Be ? (
                        <button
                          onClick={() => handleDownloadForm10Be(item.id)}
                          disabled={downloading10BeId === item.id}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1 disabled:opacity-50 shadow-xs"
                          title="Download Official Income Tax Form 10BE Certificate"
                        >
                          <span className="material-symbols-outlined text-xs">verified</span>
                          <span>{downloading10BeId === item.id ? '...' : 'Form 10BE'}</span>
                        </button>
                      ) : (
                        activeTab === '10be' && (
                          <button
                            onClick={() => handleNotify10Be(item.id)}
                            disabled={notifying10BeId === item.id}
                            className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-indigo-700 dark:text-indigo-300 font-semibold text-xs rounded-xl transition-colors border border-indigo-500/30 flex items-center gap-1 disabled:opacity-50"
                            title="Request Notification When Form 10BE is Filed by NGO"
                          >
                            <span className="material-symbols-outlined text-xs">notifications</span>
                            <span>{notifying10BeId === item.id ? '...' : 'Request 10BE'}</span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </DonorLayout>
  );
}
