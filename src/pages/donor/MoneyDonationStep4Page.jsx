import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DonorLayout from '../../layouts/DonorLayout';
import {
  getDonorMonetaryDonationDetail,
  downloadDonorReceiptPdf,
  emailDonorMonetaryReceipt,
} from '../../services/api';

export default function MoneyDonationStep4Page() {
  const [searchParams] = useSearchParams();
  const donationId = searchParams.get('donationId');
  const statusParam = searchParams.get('status');

  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(Boolean(donationId));
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [emailing, setEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (donationId) {
      fetchDonationDetails();
    }
  }, [donationId]);

  const fetchDonationDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDonorMonetaryDonationDetail(donationId);
      setDonation(data);
    } catch (err) {
      setError(err.message || 'Unable to load donation receipt details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!donation?.id || downloading) return;
    setDownloading(true);
    setDownloadError('');
    try {
      await downloadDonorReceiptPdf(donation.id);
    } catch (err) {
      setDownloadError(err.message || 'Unable to download the receipt right now. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleEmailReceipt = async () => {
    if (!donation?.id || emailing) return;
    setEmailing(true);
    setEmailSuccess('');
    setEmailError('');
    try {
      const res = await emailDonorMonetaryReceipt(donation.id);
      const recipient = res.recipient_email ? ` to ${res.recipient_email}` : '';
      setEmailSuccess(`Official receipt PDF has been emailed successfully${recipient}.`);
    } catch (err) {
      setEmailError(err.message || 'Unable to email the receipt. Please download the PDF directly.');
    } finally {
      setEmailing(false);
    }
  };

  return (
    <DonorLayout>
      <div className="max-w-2xl mx-auto space-y-8 py-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant border-b border-outline-variant/40 pb-4">
          <span className="text-secondary font-bold">Step 1: Organization</span>
          <span className="text-secondary font-bold">Step 2: Amount</span>
          <span className="text-secondary font-bold">Step 3: Payment</span>
          <span className="text-primary font-bold">Step 4: Receipt & Summary</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
            <p className="font-semibold text-sm">Verifying transaction receipt...</p>
          </div>
        ) : donation ? (
          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 space-y-6 shadow-sm">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Payment Verified & Confirmed</span>
              <h1 className="text-2xl font-bold text-on-surface">Thank You for Your Contribution!</h1>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                Your generous contribution has been securely transferred to the verified campaign fund.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                <span className="text-on-surface-variant font-medium">Donation Reference</span>
                <span className="font-mono font-bold text-on-surface text-sm">{donation.receipt_number}</span>
              </div>

              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                <span className="text-on-surface-variant font-medium">Amount Paid</span>
                <span className="text-lg font-bold text-primary">₹{Number(donation.amount).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                <span className="text-on-surface-variant font-medium">Campaign</span>
                <span className="font-semibold text-on-surface text-right max-w-xs line-clamp-1">{donation.campaign_title}</span>
              </div>

              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                <span className="text-on-surface-variant font-medium">Non-Profit Partner</span>
                <span className="font-semibold text-on-surface text-right">{donation.ngo_name}</span>
              </div>

              {donation.paid_at && (
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                  <span className="text-on-surface-variant font-medium">Date & Time</span>
                  <span className="font-medium text-on-surface">{new Date(donation.paid_at).toLocaleString()}</span>
                </div>
              )}

              {donation.pan_masked && (
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                  <span className="text-on-surface-variant font-medium">PAN Card</span>
                  <span className="font-mono font-bold text-on-surface">{donation.pan_masked}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">Payment Status</span>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg text-[11px] border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Successful
                </span>
              </div>
            </div>

            {downloadError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between text-xs font-semibold text-red-700">
                <span>{downloadError}</span>
                <button onClick={() => setDownloadError('')} className="underline cursor-pointer">Dismiss</button>
              </div>
            )}

            {emailSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs font-semibold text-emerald-800">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                  <span>{emailSuccess}</span>
                </div>
                <button onClick={() => setEmailSuccess('')} className="underline cursor-pointer">Dismiss</button>
              </div>
            )}

            {emailError && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-amber-600">warning</span>
                  <span>{emailError}</span>
                </div>
                <button onClick={() => setEmailError('')} className="underline cursor-pointer">Dismiss</button>
              </div>
            )}

            {/* Download & Email Official Receipt Actions */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex-1 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-container shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">
                    {downloading ? 'progress_activity' : 'download'}
                  </span>
                  <span>{downloading ? 'Preparing Official PDF...' : 'Download Official Receipt'}</span>
                </button>

                <button
                  onClick={handleEmailReceipt}
                  disabled={emailing}
                  className="py-3.5 px-6 bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-bold rounded-xl hover:bg-emerald-100 shadow-sm transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  title="Send official receipt to your email"
                >
                  <span className="material-symbols-outlined text-lg">
                    {emailing ? 'progress_activity' : 'mail'}
                  </span>
                  <span>{emailing ? 'Sending...' : 'Email Receipt'}</span>
                </button>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-1">
                <span className="font-bold block">Official Receipt & 80G Documentation:</span>
                <p>An official PDF receipt has been generated and emailed to your registered email address. You can also download it anytime from this page or your Donor Receipt Center.</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                to="/donor/receipts"
                className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-xl hover:bg-surface-container-high border border-outline-variant/60 transition-all text-sm text-center block"
              >
                View Receipts Center
              </Link>
              <Link
                to="/donor/dashboard"
                className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-xl hover:bg-surface-container-high border border-outline-variant/60 transition-all text-sm text-center block"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto space-y-6 text-center py-6">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto border border-primary/20">
              <span className="material-symbols-outlined text-3xl">payments</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-on-surface">Monetary Contribution Portal</h1>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-md mx-auto">
                Real payment gateway integration is active. You can browse active verified campaigns to direct financial support.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/donor/dashboard"
                className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container shadow-md transition-all text-sm block"
              >
                Go to Donor Dashboard
              </Link>
              <Link
                to="/campaigns"
                className="px-6 py-3 bg-surface-container-low text-on-surface font-semibold rounded-xl hover:bg-surface-container transition-all text-sm block"
              >
                Browse Active Campaigns
              </Link>
            </div>
          </div>
        )}
      </div>
    </DonorLayout>
  );
}
