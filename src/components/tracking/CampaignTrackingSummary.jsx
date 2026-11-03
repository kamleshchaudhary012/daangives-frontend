import React from 'react';
import ProgressBar from '../common/ProgressBar';

export default function CampaignTrackingSummary({
  campaign,
  totalVerifiedSpent = '0.00',
  milestones = [],
  verifiedProofs = [],
}) {
  if (!campaign) return null;

  const targetAmount = parseFloat(campaign.target_amount || 0);
  const raisedAmount = parseFloat(campaign.raised_amount || 0);
  const verifiedSpent = parseFloat(totalVerifiedSpent || 0);

  const completedMilestones = milestones.filter((m) => m.status === 'COMPLETED').length;
  const totalBeneficiaries = verifiedProofs.reduce((sum, p) => sum + (parseInt(p.beneficiary_count, 10) || 0), 0);

  return (
    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/40 pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
            Impact Ledger & Financial Transparency
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
            Campaign Verification Summary
          </h2>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold self-start sm:self-auto">
          <span className="material-symbols-outlined text-sm">verified_user</span>
          <span>Public Verified Audit Trail</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Funds Raised */}
        <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
            Total Funds Raised
          </span>
          <span className="text-lg sm:text-xl font-bold text-on-surface block">
            ₹{raisedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-on-surface-variant block">
            Goal: ₹{targetAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Verified Expenditure */}
        <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
            Verified Expenditure
          </span>
          <span className="text-lg sm:text-xl font-bold text-primary block">
            ₹{verifiedSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-on-surface-variant block">
            Evidence-audited
          </span>
        </div>

        {/* Milestones Progress */}
        <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
            Milestones Completed
          </span>
          <span className="text-lg sm:text-xl font-bold text-on-surface block">
            {completedMilestones} / {milestones.length}
          </span>
          <span className="text-[11px] text-on-surface-variant block">
            Phase execution
          </span>
        </div>

        {/* Beneficiaries Reached */}
        <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
            Beneficiaries Reached
          </span>
          <span className="text-lg sm:text-xl font-bold text-secondary block">
            {totalBeneficiaries.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-on-surface-variant block">
            Directly served in field
          </span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4 pt-2">
        <ProgressBar
          current={raisedAmount}
          target={targetAmount}
          label="Donor Contributions against Campaign Goal"
          color="bg-emerald-600"
        />

        {raisedAmount > 0 && (
          <ProgressBar
            current={verifiedSpent}
            target={raisedAmount}
            label="Verified Field Distribution Spending against Raised Funds"
            color="bg-primary"
          />
        )}
      </div>

      {/* Trust Notice */}
      <div className="p-3.5 bg-surface-container-low/70 rounded-xl border border-outline-variant/30 flex items-start gap-2.5 text-xs text-on-surface-variant">
        <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">policy</span>
        <p className="leading-relaxed text-[11px]">
          Every rupee of verified spending shown above is substantiated by field receipts, geotagged distribution photos, and beneficiary headcounts verified by DaanGives administrators.
        </p>
      </div>
    </div>
  );
}
