import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DonorLayout from '../../layouts/DonorLayout';
import {
  getUserProfile,
  getDonorMonetaryDonations,
  downloadDonorReceiptPdf,
  emailDonorMonetaryReceipt,
  downloadDonorForm10BePdf,
  notifyDonorForm10Be,
} from '../../services/api';

export default function ReceiptsReportsPage() {
  const [userProfile, setUserProfile] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloading10BeId, setDownloading10BeId] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  const [emailingId, setEmailingId] = useState(null);
  const [notifying10BeId, setNotifying10BeId] = useState(null);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState('');
  const [emailErrorMsg, setEmailErrorMsg] = useState('');

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, donationsRes] = await Promise.all([
        getUserProfile().catch(() => null),
        getDonorMonetaryDonations().catch(() => []),
      ]);

      setUserProfile(profileRes);
      const list = Array.isArray(donationsRes) ? donationsRes : (donationsRes.results || []);
      const successful = list.filter((d) => d.status === 'SUCCESS');
      setReceipts(successful);
    } catch (err) {
      setError(err.message || 'Failed to load donation receipts.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (donationId) => {
    if (!donationId || downloadingId) return;
    setDownloadingId(donationId);
    setDownloadError('');
    try {
      await downloadDonorReceiptPdf(donationId);
    } catch (err) {
      setDownloadError(err.message || 'Unable to download the receipt right now. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownload10Be = async (donationId) => {
    if (!donationId || downloading10BeId) return;
    setDownloading10BeId(donationId);
    setDownloadError('');
    try {
      await downloadDonorForm10BePdf(donationId);
    } catch (err) {
      setDownloadError(err.message || 'Unable to download the official Form 10BE certificate right now.');
    } finally {
      setDownloading10BeId(null);
    }
  };

  const handleEmailReceipt = async (donationId) => {
    if (!donationId || emailingId) return;
    setEmailingId(donationId);
    setEmailSuccessMsg('');
    setEmailErrorMsg('');

    try {
      const res = await emailDonorMonetaryReceipt(donationId);
      const recipient = res.recipient_email ? ` to ${res.recipient_email}` : '';
      setEmailSuccessMsg(`Tax receipt PDF has been emailed successfully${recipient}.`);
    } catch (err) {
      setEmailErrorMsg(err.message || 'Unable to email the receipt. Please try downloading the PDF directly.');
    } finally {
      setEmailingId(null);
    }
  };

  const handleNotify10Be = async (donationId) => {
    if (!donationId || notifying10BeId) return;
    setNotifying10BeId(donationId);
    setEmailSuccessMsg('');
    setEmailErrorMsg('');

    try {
      const res = await notifyDonorForm10Be(donationId);
      const recipient = res.recipient_email ? ` to ${res.recipient_email}` : '';
      setEmailSuccessMsg(`Official Form 10BE availability notification emailed successfully${recipient}.`);
    } catch (err) {
      setEmailErrorMsg(err.message || 'Unable to send Form 10BE notification email. You can download the certificate directly.');
    } finally {
      setNotifying10BeId(null);
    }
  };

  const totalReceiptsAmount = receipts.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  return (
    <DonorLayout>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Receipts & 80G Document Center</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Access transparent payment receipts and 80G tax-deductible contribution summaries for Income Tax filing.
          </p>
        </div>

        {/* User & Tax Summary Header */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/60 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/40 pb-4">
            <div>
              <span className="text-xs text-on-surface-variant block">Donor Account</span>
              <span className="text-sm font-bold text-on-surface">
                {userProfile?.full_name || userProfile?.email || 'Authenticated Donor'}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-on-surface-variant block">Total Eligible Deductions</span>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                ₹{totalReceiptsAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
              <span className="material-symbols-outlined text-base">verified</span>
              <span>Section 80G Tax Exemption & Receipts</span>
            </div>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              All verified donations include permanently stored 80G tax receipts. Form 10BE certificates uploaded by partner NGOs will appear here following their annual Form 10BD electronic filing.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between text-xs font-semibold text-red-700">
              <span>{error}</span>
              <button onClick={fetchReceipts} className="underline">Retry</button>
            </div>
          )}

          {downloadError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between text-xs font-semibold text-red-700">
              <span>{downloadError}</span>
              <button onClick={() => setDownloadError('')} className="underline">Dismiss</button>
            </div>
          )}

          {emailSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs font-semibold text-emerald-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                <span>{emailSuccessMsg}</span>
              </div>
              <button onClick={() => setEmailSuccessMsg('')} className="underline cursor-pointer">Dismiss</button>
            </div>
          )}

          {emailErrorMsg && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-amber-600">warning</span>
                <span>{emailErrorMsg}</span>
              </div>
              <button onClick={() => setEmailErrorMsg('')} className="underline cursor-pointer">Dismiss</button>
            </div>
          )}

          {/* Verified Receipts List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                Verified Monetary Donation Receipts ({receipts.length})
              </h2>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-on-surface-variant space-y-2">
                <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
                <p className="font-semibold">Loading verified receipts...</p>
              </div>
            ) : receipts.length === 0 ? (
              <div className="py-10 text-center space-y-2 bg-surface-container-low/50 rounded-2xl border border-outline-variant/40">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">description</span>
                <p className="text-xs font-bold text-on-surface">No Verified Receipts Available Yet</p>
                <p className="text-[11px] text-on-surface-variant max-w-sm mx-auto">
                  Receipts generate automatically upon successful payment completion.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-primary text-sm">{receipt.receipt_number}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          Verified & Confirmed
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                          {receipt.pan_masked ? '80G Tax Receipt' : 'Standard Donation Receipt'}
                        </span>
                        {receipt.has_form_10be ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            Form 10BE Available
                          </span>
                        ) : receipt.pan_masked ? (
                          <span className="text-[10px] text-on-surface-variant italic">
                            Form 10BE: Pending NGO Filing
                          </span>
                        ) : null}
                      </div>
                      <div className="text-on-surface-variant text-[11px] flex flex-wrap items-center gap-3">
                        <span>Campaign: <strong className="text-on-surface">{receipt.campaign_title}</strong></span>
                        <span>•</span>
                        <span>NGO: <strong className="text-on-surface">{receipt.ngo_name}</strong></span>
                        {receipt.paid_at && (
                          <>
                            <span>•</span>
                            <span>{new Date(receipt.paid_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 shrink-0">
                      <div className="text-left sm:text-right pr-2">
                        <span className="text-[10px] text-on-surface-variant block">Amount</span>
                        <span className="text-base font-bold text-on-surface">
                          ₹{parseFloat(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDownload(receipt.id)}
                        disabled={downloadingId === receipt.id}
                        className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-container shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        title="Download Verified PDF Receipt"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {downloadingId === receipt.id ? 'progress_activity' : 'download'}
                        </span>
                        <span>{downloadingId === receipt.id ? 'Preparing...' : 'PDF'}</span>
                      </button>

                      <button
                        onClick={() => handleEmailReceipt(receipt.id)}
                        disabled={emailingId === receipt.id}
                        className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        title="Email Tax Receipt PDF to Registered Address"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {emailingId === receipt.id ? 'progress_activity' : 'mail'}
                        </span>
                        <span>{emailingId === receipt.id ? 'Sending...' : 'Email'}</span>
                      </button>

                      {receipt.has_form_10be && (
                        <button
                          onClick={() => handleDownload10Be(receipt.id)}
                          disabled={downloading10BeId === receipt.id}
                          className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                          title={`Download Official Form 10BE Certificate (${receipt.form_10be_certificate_number || 'Official'})`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {downloading10BeId === receipt.id ? 'progress_activity' : 'verified_user'}
                          </span>
                          <span>{downloading10BeId === receipt.id ? 'Loading...' : 'Form 10BE'}</span>
                        </button>
                      )}

                      <Link
                        to={`/donor/donations/money/step-4?donationId=${receipt.id}&status=SUCCESS`}
                        className="px-3 py-2 bg-surface-container-high text-on-surface rounded-xl text-xs font-semibold hover:bg-surface-container-highest border border-outline-variant/60 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Summary
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DonorLayout>
  );
}
