import React, { useState } from 'react';
import ImageWithFallback from '../common/ImageWithFallback';
import Badge from '../common/Badge';
import ProofModal from './ProofModal';

export default function DistributionProofCard({ proof }) {
  const [modalOpen, setModalOpen] = useState(false);

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
    <>
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-xs overflow-hidden flex flex-col justify-between hover:border-outline-variant transition-all group">
        <div>
          {/* Proof Photo */}
          <div
            className="cursor-pointer relative overflow-hidden bg-surface-container-low"
            onClick={() => setModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setModalOpen(true);
              }
            }}
            aria-label={`View photo evidence for ${proof.caption || 'distribution'}`}
          >
            <ImageWithFallback
              src={proof.photo_url}
              alt={proof.caption || 'Verified Field Evidence'}
              fallbackIcon="photo_camera"
              fallbackLabel="Field Distribution Evidence"
              aspectRatio="aspect-video"
              className="group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2.5 right-2.5 z-10">
              <Badge variant="verified" className="shadow-xs backdrop-blur-md bg-emerald-500/90 text-white border-0">
                <span className="material-symbols-outlined text-xs mr-1">verified</span>
                VERIFIED
              </Badge>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-4 sm:p-5 space-y-3">
            {/* Header: Date & Spending */}
            <div className="flex items-center justify-between gap-2 text-xs">
              {proof.distribution_date && (
                <span className="text-on-surface-variant font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary">calendar_today</span>
                  {formatDisplayDate(proof.distribution_date)}
                </span>
              )}

              {spentAmount > 0 && (
                <span className="font-bold text-primary text-xs">
                  ₹{spentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} spent
                </span>
              )}
            </div>

            {/* Caption */}
            {proof.caption && (
              <h4 className="font-bold text-on-surface text-sm line-clamp-2 leading-snug">
                {proof.caption}
              </h4>
            )}

            {/* Beneficiaries Pill */}
            {(proof.beneficiary_count > 0 || proof.beneficiary_type) && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface-variant text-[11px] font-semibold border border-outline-variant/30">
                <span className="material-symbols-outlined text-xs text-primary">group</span>
                <span>
                  {proof.beneficiary_count || 0} {proof.beneficiary_type_display || proof.beneficiary_type || 'Beneficiaries'}
                </span>
              </div>
            )}

            {/* Location & GPS */}
            {(proof.location_name || hasCoordinates) && (
              <div className="pt-2 border-t border-outline-variant/30 text-xs text-on-surface-variant space-y-1">
                {proof.location_name && (
                  <div className="flex items-center gap-1 truncate font-medium text-on-surface">
                    <span className="material-symbols-outlined text-xs text-primary/70 shrink-0">location_on</span>
                    <span className="truncate">{proof.location_name}</span>
                  </div>
                )}
                {hasCoordinates && (
                  <div className="flex items-center justify-between gap-2 text-[11px] pl-4">
                    <span className="font-mono text-on-surface-variant/80">
                      {lat.toFixed(4)}°, {lng.toFixed(4)}°
                    </span>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-semibold flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Maps</span>
                        <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card Footer Action */}
        <div className="p-4 pt-0">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full py-2 bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs rounded-xl transition-colors text-center border border-outline-variant/50 flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">zoom_in</span>
            <span>Inspect Evidence</span>
          </button>
        </div>
      </div>

      {modalOpen && (
        <ProofModal proof={proof} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
