import React from 'react';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';
import DistributionProofCard from './DistributionProofCard';

function getMilestoneStatusBadge(status) {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="success">Completed</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="verified">In Progress</Badge>;
    case 'REVISION_REQUESTED':
      return <Badge variant="warning">Revision Requested</Badge>;
    case 'PENDING':
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function MilestoneTimeline({ milestones = [] }) {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="p-8 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/60">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant/60 mb-2">timeline</span>
        <h4 className="text-base font-bold text-on-surface">No Milestones Defined</h4>
        <p className="text-xs text-on-surface-variant mt-1">
          This campaign has not defined discrete phase milestones yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {milestones.map((m, index) => {
        const targetAmount = parseFloat(m.target_amount || 0);
        const verifiedSpent = parseFloat(m.verified_spent_amount || 0);
        const proofs = m.proofs || [];
        const isCompleted = m.status === 'COMPLETED';

        return (
          <div
            key={m.id || index}
            className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 shadow-xs overflow-hidden transition-all"
          >
            {/* Milestone Header */}
            <div className="p-6 sm:p-7 border-b border-outline-variant/40 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}>
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-sm">check</span>
                    ) : (
                      `#${m.sequence_number || index + 1}`
                    )}
                  </span>
                  <h3 className="text-lg font-bold text-on-surface">
                    {m.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {getMilestoneStatusBadge(m.status)}
                </div>
              </div>

              {/* Description */}
              {m.description && (
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {m.description}
                </p>
              )}

              {/* Financial & Schedule Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
                {/* Target Allocation */}
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                    Target Allocation
                  </span>
                  <span className="font-bold text-on-surface text-sm">
                    ₹{targetAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Verified Spending */}
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                    Verified Spending
                  </span>
                  <span className="font-bold text-primary text-sm">
                    ₹{verifiedSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Target Completion */}
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                    Target Completion
                  </span>
                  <span className="font-semibold text-on-surface text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary/70">event</span>
                    {formatDisplayDate(m.target_completion_date) || 'Open schedule'}
                  </span>
                </div>

                {/* Actual Completion or Status */}
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                    {isCompleted ? 'Completed On' : 'Verified Evidence'}
                  </span>
                  <span className="font-semibold text-on-surface text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary/70">
                      {isCompleted ? 'task_alt' : 'inventory_2'}
                    </span>
                    {isCompleted
                      ? (formatDisplayDate(m.actual_completion_date) || 'Completed')
                      : `${m.verified_proofs_count || proofs.length} Verified Evidence`}
                  </span>
                </div>
              </div>

              {/* Spending vs Target Progress */}
              {targetAmount > 0 && (
                <div className="pt-2">
                  <ProgressBar
                    current={verifiedSpent}
                    target={targetAmount}
                    label="Verified Expenditure against Target Allocation"
                    color={isCompleted ? 'bg-emerald-600' : 'bg-primary'}
                  />
                </div>
              )}
            </div>

            {/* Nested Verified Distribution Proofs */}
            <div className="p-6 sm:p-7 bg-surface-container-low/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">verified</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface">
                    Verified Field Proofs ({proofs.length})
                  </h4>
                </div>
                <span className="text-[11px] text-on-surface-variant">
                  Audited by DaanGives Moderation
                </span>
              </div>

              {proofs.length === 0 ? (
                <div className="p-5 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-xs text-on-surface-variant">
                  <p className="font-medium">No verified field distribution evidence uploaded for this phase yet.</p>
                  <p className="text-[11px] text-on-surface-variant/70 mt-0.5">
                    Field distribution teams upload geotagged photos and beneficiary receipts during execution.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {proofs.map((proof) => (
                    <DistributionProofCard key={proof.id} proof={proof} />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
