import React, { useEffect } from 'react';
import ImageWithFallback from '../common/ImageWithFallback';
import Badge from '../common/Badge';

export default function ProofModal({ proof, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!proof) return null;

  const lat = proof.latitude ? parseFloat(proof.latitude) : null;
  const lng = proof.longitude ? parseFloat(proof.longitude) : null;
  const hasCoordinates = !isNaN(lat) && !isNaN(lng) && lat !== null && lng !== null;
  const mapsUrl = hasCoordinates ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  const spentAmount = parseFloat(proof.spent_amount || 0);

  const formatDisplayDate = (dateStr) => {
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
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proof-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-outline-variant/40 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="verified">
              <span className="material-symbols-outlined text-xs mr-1">verified</span>
              Verified Field Evidence
            </Badge>
            {proof.distribution_date && (
              <span className="text-xs text-on-surface-variant font-medium">
                Distributed on {formatDisplayDate(proof.distribution_date)}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Proof Photo */}
          <div className="rounded-2xl overflow-hidden border border-outline-variant/40 bg-surface-container-low">
            <ImageWithFallback
              src={proof.photo_url}
              alt={proof.caption || 'Verified Distribution Proof'}
              fallbackIcon="photo_camera"
              fallbackLabel="Field Distribution Evidence"
              aspectRatio="aspect-video"
            />
          </div>

          {/* Caption */}
          {proof.caption && (
            <div className="space-y-1">
              <h4 id="proof-modal-title" className="text-base font-bold text-on-surface">
                {proof.caption}
              </h4>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Expenditure */}
            <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                Verified Expenditure
              </span>
              <span className="text-lg font-bold text-primary block">
                ₹{spentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Beneficiaries */}
            <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                Beneficiaries Reached
              </span>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-lg font-bold text-on-surface">
                  {proof.beneficiary_count || 0}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
                  {proof.beneficiary_type_display || proof.beneficiary_type || 'Beneficiaries'}
                </span>
              </div>
            </div>
          </div>

          {/* Beneficiary Notes */}
          {proof.beneficiary_notes && (
            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                Beneficiary & Distribution Notes
              </span>
              <p className="text-xs text-on-surface leading-relaxed whitespace-pre-line">
                {proof.beneficiary_notes}
              </p>
            </div>
          )}

          {/* Expense Breakdown */}
          {proof.expense_breakdown && typeof proof.expense_breakdown === 'object' && Object.keys(proof.expense_breakdown).length > 0 && (
            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                Expense Breakdown Items
              </span>
              <div className="divide-y divide-outline-variant/30 text-xs">
                {Array.isArray(proof.expense_breakdown) ? (
                  proof.expense_breakdown.map((item, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between">
                      <span className="text-on-surface-variant">{item.item || item.name || `Item ${idx + 1}`}</span>
                      <span className="font-semibold text-on-surface">
                        {item.amount || item.cost ? `₹${item.amount || item.cost}` : JSON.stringify(item)}
                      </span>
                    </div>
                  ))
                ) : (
                  Object.entries(proof.expense_breakdown).map(([k, v]) => (
                    <div key={k} className="py-1.5 flex justify-between">
                      <span className="text-on-surface-variant capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-on-surface">
                        {typeof v === 'number' ? `₹${v.toLocaleString('en-IN')}` : String(v)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Geolocation Section */}
          {(proof.location_name || hasCoordinates) && (
            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                Geotagged Distribution Location
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  {proof.location_name && (
                    <span className="font-bold text-on-surface flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-primary">pin_drop</span>
                      {proof.location_name}
                    </span>
                  )}
                  {hasCoordinates && (
                    <span className="text-[11px] font-mono text-on-surface-variant block pl-5">
                      {lat.toFixed(5)}°, {lng.toFixed(5)}°
                    </span>
                  )}
                </div>

                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant text-primary font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 self-start sm:self-center shrink-0"
                  >
                    <span>View on Google Maps</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-outline-variant/40 bg-surface-container-low/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-surface-container-highest hover:bg-surface-container text-on-surface font-semibold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
