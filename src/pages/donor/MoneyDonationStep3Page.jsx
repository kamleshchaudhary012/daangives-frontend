import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import DonorLayout from '../../layouts/DonorLayout';
import {
  validateMonetaryContribution,
  createMonetaryDonationOrder,
  verifyMonetaryDonationPayment,
} from '../../services/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function MoneyDonationStep3Page() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const rawAmount = searchParams.get('amount') || '';
  const campaignId = searchParams.get('campaignId') || undefined;
  const ngoId = searchParams.get('ngoId') || undefined;
  const rawPan = location.state?.pan || '';

  const [validating, setValidating] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [validatedData, setValidatedData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const navigate = useNavigate();

  const numericAmount = parseFloat(rawAmount);
  const isBelowMinimum = isNaN(numericAmount) || numericAmount < 10;

  useEffect(() => {
    runServerValidation();
  }, [rawAmount, campaignId, ngoId]);

  const runServerValidation = async () => {
    setValidating(true);
    setValidationError('');
    setPaymentError('');

    if (!rawAmount || isNaN(numericAmount) || numericAmount < 10) {
      setValidationError('Minimum monetary contribution amount is ₹10. URL amount is below allowable limit.');
      setValidating(false);
      return;
    }

    try {
      const res = await validateMonetaryContribution({
        amount: rawAmount,
        campaign: campaignId || null,
        ngo: ngoId || null,
      });
      setValidatedData(res);
    } catch (err) {
      const msg = err.message || (err.fieldErrors?.amount ? err.fieldErrors.amount.join(' ') : 'Invalid contribution details.');
      setValidationError(msg);
    } finally {
      setValidating(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (validationError || isBelowMinimum || processing) return;

    setProcessing(true);
    setPaymentError('');

    try {
      const effectiveCampaignId = campaignId || validatedData?.campaign_id;
      const effectiveNgoId = ngoId || validatedData?.ngo_id;

      const orderPayload = {
        campaign: effectiveCampaignId || null,
        ngo: effectiveNgoId || null,
        amount: rawAmount,
      };

      if (rawPan && rawPan !== '__USE_SAVED_PROFILE_PAN__') {
        orderPayload.pan_number = rawPan.trim().toUpperCase();
      }

      // 1. Create gateway order on backend with attached PAN
      const orderData = await createMonetaryDonationOrder(orderPayload);

      // 2. Load Razorpay Checkout SDK
      const sdkLoaded = await loadRazorpayScript();

      if (!sdkLoaded || !window.Razorpay) {
        setPaymentError('Unable to load Razorpay payment gateway SDK. Please check your network connection.');
        setProcessing(false);
        return;
      }

      // 3. Launch Razorpay Checkout modal
      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount_paise,
        currency: orderData.currency || 'INR',
        name: 'DaanGives Foundation',
        description: `Contribution for ${orderData.campaign_title || 'Community Welfare'}`,
        order_id: orderData.gateway_order_id,
        prefill: {
          name: orderData.donor_name,
          email: orderData.donor_email,
          contact: orderData.donor_phone,
        },
        theme: {
          color: '#10b981',
        },
        handler: async function (response) {
          try {
            // 4. Send response to backend for cryptographic signature & amount verification
            const verifyRes = await verifyMonetaryDonationPayment({
              donation_id: orderData.donation_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // 5. Navigate to verified summary step
            navigate(`/donor/donations/money/step-4?donationId=${orderData.donation_id}&status=SUCCESS`);
          } catch (verifyErr) {
            setPaymentError(verifyErr.message || 'Payment verification failed on server.');
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentError('Payment window was closed before completion. You may try again.');
            setProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setPaymentError(`Payment failed: ${resp.error?.description || 'Payment was unsuccessful.'}`);
        setProcessing(false);
      });
      rzp.open();

    } catch (err) {
      setPaymentError(err.message || 'Failed to initiate payment order.');
      setProcessing(false);
    }
  };

  return (
    <DonorLayout>
      <div className="max-w-3xl space-y-8">
        <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant border-b border-outline-variant/40 pb-4">
          <span className="text-secondary font-bold">Step 1: Organization</span>
          <span className="text-secondary font-bold">Step 2: Amount</span>
          <span className="text-primary font-bold">Step 3: Secure Payment</span>
          <span>Step 4: Summary</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-on-surface">Review & Secure Payment</h1>
          <p className="text-xs text-on-surface-variant mt-1">Complete your monetary contribution securely via Razorpay Payment Gateway.</p>
        </div>

        {validationError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-700 dark:text-red-300 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl shrink-0">error</span>
              <span>{validationError}</span>
            </div>
            <Link
              to="/donor/donations/money/step-2"
              className="px-3 py-1.5 bg-red-700 text-white rounded-xl text-xs shrink-0 hover:bg-red-800 transition-colors"
            >
              Update Amount
            </Link>
          </div>
        )}

        {paymentError && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <span className="material-symbols-outlined text-xl shrink-0">warning</span>
            <span>{paymentError}</span>
          </div>
        )}

        <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 space-y-6">
          <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/40 flex items-center justify-between">
            <div>
              <span className="text-xs text-on-surface-variant font-medium block">Total Contribution Amount</span>
              <span className="text-3xl font-bold text-primary">
                {isBelowMinimum ? '₹0.00 (Invalid)' : `₹${numericAmount.toLocaleString('en-IN')}`}
              </span>
              {validatedData?.campaign_title && (
                <span className="text-xs text-on-surface font-semibold block mt-1">
                  For: {validatedData.campaign_title}
                </span>
              )}
              {validatedData?.ngo_name && (
                <span className="text-[11px] text-on-surface-variant block">
                  NGO: {validatedData.ngo_name}
                </span>
              )}
              {rawPan && (
                <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 mt-2">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  <span>
                    {rawPan === '__USE_SAVED_PROFILE_PAN__'
                      ? '80G Receipt: Profile PAN Linked'
                      : `80G Receipt: PAN ******${rawPan.slice(-4)} Linked`}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right space-y-1">
              <span className="text-xs text-secondary font-bold block">Section 80G Tax Deductible</span>
              <span className="text-[10px] text-on-surface-variant block">Form 10BE Receipt Available</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="material-symbols-outlined text-xs">lock</span> 256-bit Encrypted
              </span>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-primary">
              <span className="material-symbols-outlined text-base">verified_user</span>
              <span>Direct Bank Escrow & Gateway Protection</span>
            </div>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              Your donation is processed securely through Razorpay. You can pay using UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, or Net Banking.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/donor/donations/money/step-2')}
              disabled={processing}
              className="px-6 py-3 text-on-surface-variant font-semibold text-sm hover:text-on-surface disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleInitiatePayment}
              disabled={Boolean(validationError) || isBelowMinimum || validating || processing}
              className="px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-container shadow-md transition-all text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  Opening Secure Gateway...
                </>
              ) : (
                <>
                  <span>Pay Securely ₹{isBelowMinimum ? '0' : numericAmount.toLocaleString('en-IN')}</span>
                  <span className="material-symbols-outlined text-lg">lock</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DonorLayout>
  );
}
