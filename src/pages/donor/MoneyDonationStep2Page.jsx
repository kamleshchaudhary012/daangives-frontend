import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DonorLayout from '../../layouts/DonorLayout';
import { getUserProfile } from '../../services/api';

export default function MoneyDonationStep2Page() {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const ngoId = searchParams.get('ngoId');

  const [amount, setAmount] = useState('2500');
  const [savedMaskedPan, setSavedMaskedPan] = useState('');
  const [hasSavedPan, setHasSavedPan] = useState(false);
  const [customPan, setCustomPan] = useState('');
  const [useCustomPan, setUseCustomPan] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const presets = ['1000', '2500', '5000', '10000'];

  useEffect(() => {
    fetchSavedProfilePan();
  }, []);

  const fetchSavedProfilePan = async () => {
    try {
      const data = await getUserProfile();
      if (data?.donor_profile?.has_pan && data?.donor_profile?.pan_number_masked) {
        setSavedMaskedPan(data.donor_profile.pan_number_masked);
        setHasSavedPan(true);
      }
    } catch (err) {
      // Gracefully continue without prefill
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount < 10) {
      setErrorMessage('Minimum monetary contribution amount is ₹10.');
      return;
    }

    let effectivePan = '';
    if (useCustomPan || !hasSavedPan) {
      if (customPan.trim()) {
        const panClean = customPan.trim().toUpperCase();
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(panClean)) {
          setErrorMessage('Please enter a valid 10-character PAN format (e.g. ABCDE1234F).');
          return;
        }
        effectivePan = panClean;
      }
    } else if (hasSavedPan) {
      effectivePan = '__USE_SAVED_PROFILE_PAN__';
    }

    const params = new URLSearchParams();
    params.append('amount', numericAmount.toString());
    if (campaignId) params.append('campaignId', campaignId);
    if (ngoId) params.append('ngoId', ngoId);

    // Pass PAN strictly via in-memory React Router navigation state — never in query params
    navigate(`/donor/donations/money/step-3?${params.toString()}`, {
      state: { pan: effectivePan },
    });
  };

  return (
    <DonorLayout>
      <div className="max-w-3xl space-y-8">
        <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant border-b border-outline-variant/40 pb-4">
          <span className="text-secondary font-bold">Step 1: Need Selected</span>
          <span className="text-primary font-bold">Step 2: Amount & Tax 80G</span>
          <span>Step 3: Review & Escrow</span>
          <span>Step 4: Receipt</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-on-surface">Enter Contribution Amount</h1>
          <p className="text-xs text-on-surface-variant mt-1">Select or enter custom monetary contribution amount.</p>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-300 text-xs font-semibold">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleNext} className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 space-y-6">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-2">Preset Amounts (INR ₹)</label>
            <div className="grid grid-cols-4 gap-3">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setAmount(p);
                    setErrorMessage('');
                  }}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${
                    amount === p
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  ₹{Number(p).toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-on-surface">Custom Amount (₹)</label>
              <span className="text-[11px] font-semibold text-primary">Minimum contribution: ₹10</span>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3 text-lg font-bold text-on-surface-variant">₹</span>
              <input
                type="number"
                min="10"
                step="any"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (parseFloat(e.target.value) >= 10) {
                    setErrorMessage('');
                  }
                }}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-lg font-bold text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1 text-xs text-emerald-800">
            <span className="font-bold block">80G Tax Savings Benefit:</span>
            <p>You save approximately 50% tax under Section 80G (₹{(Number(amount) * 0.5 || 0).toLocaleString('en-IN')} deductible).</p>
          </div>

          {/* PAN Card Section */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-on-surface">
              PAN Card Number (For 80G Official Tax Receipt)
            </label>

            {hasSavedPan && !useCustomPan ? (
              <div className="p-4 bg-surface-container-low border border-outline-variant/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-600">verified_user</span>
                  <div>
                    <span className="text-xs text-on-surface font-semibold block">Using saved profile PAN:</span>
                    <span className="font-mono text-sm font-bold text-on-surface tracking-wider">{savedMaskedPan}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomPan(true);
                    setCustomPan('');
                  }}
                  className="text-xs text-primary font-bold hover:underline self-start sm:self-auto cursor-pointer"
                >
                  Use a different PAN for this donation
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customPan}
                    onChange={(e) => {
                      setCustomPan(e.target.value.toUpperCase());
                      setErrorMessage('');
                    }}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm uppercase font-mono tracking-wider focus:outline-none focus:border-primary"
                  />
                  {hasSavedPan && (
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomPan(false);
                        setCustomPan('');
                      }}
                      className="px-3 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                    >
                      Use Saved PAN
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Optional for standard donations. Required for Section 80G tax exemption certificates.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate('/donor/donations/money/step-1')}
              className="px-6 py-3 text-on-surface-variant font-semibold text-sm hover:text-on-surface"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container shadow-md transition-all text-sm flex items-center gap-2 cursor-pointer"
            >
              Review Payment Details
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>
    </DonorLayout>
  );
}

