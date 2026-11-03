import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import Badge from '../../components/common/Badge';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import AvatarImage from '../../components/common/AvatarImage';
import CampaignTrackingSummary from '../../components/tracking/CampaignTrackingSummary';
import MilestoneTimeline from '../../components/tracking/MilestoneTimeline';
import DistributionProofCard from '../../components/tracking/DistributionProofCard';
import TrackingEmptyState from '../../components/tracking/TrackingEmptyState';
import { getPublicCampaignTracking } from '../../services/api';

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

export default function CampaignTrackingPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrackingData();
  }, [slug]);

  const fetchTrackingData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPublicCampaignTracking(slug);
      setData(res);
    } catch (err) {
      if (err.status === 404) {
        setError('This campaign tracking record does not exist or is not currently active.');
      } else {
        setError(err.message || 'Failed to load campaign verification tracking data.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="py-24 flex flex-col items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          <p className="text-sm font-semibold text-on-surface-variant mt-3">Loading Verified Campaign Tracking...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !data || !data.campaign) {
    return (
      <PublicLayout>
        <div className="py-20 bg-surface-container-low min-h-[calc(100vh-160px)] flex items-center justify-center">
          <div className="max-w-md w-full mx-4 bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-3xl mx-auto">
              <span className="material-symbols-outlined text-3xl">policy</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface">Tracking Record Not Found</h1>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {error || 'The requested campaign appeal tracking does not exist or is not available publicly.'}
            </p>
            <div className="pt-2">
              <Link
                to="/campaigns"
                className="inline-block px-6 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs"
              >
                Browse Campaign Directory →
              </Link>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const campaign = data.campaign;
  const milestones = data.milestones || [];
  const verifiedProofs = data.verified_distribution_proofs || [];
  const totalVerifiedSpent = data.total_verified_spent || '0.00';

  const locationParts = [campaign.ngo_city, campaign.ngo_state].filter(Boolean);
  const locationDisplay = locationParts.join(', ');

  return (
    <PublicLayout>
      {/* Breadcrumbs */}
      <div className="bg-surface-container-low py-4 border-b border-outline-variant/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/campaigns" className="hover:text-primary font-semibold transition-colors">Campaigns</Link>
            <span>/</span>
            <Link to={`/campaigns/${campaign.slug}`} className="hover:text-primary transition-colors truncate max-w-[200px]">
              {campaign.title}
            </Link>
            <span>/</span>
            <span className="text-on-surface font-bold">Verified Impact Tracking</span>
          </div>
        </div>
      </div>

      <div className="py-10 bg-surface-container-low min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Campaign Header Card */}
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 space-y-6">
              {/* Badges & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="verified">
                    <span className="material-symbols-outlined text-xs mr-1">verified</span>
                    Audited Public Ledger
                  </Badge>
                  <Badge variant="info">80G Tax Deductible</Badge>
                  {campaign.category && (
                    <span className="text-xs font-bold text-secondary uppercase tracking-wider pl-1">
                      {campaign.category.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <Link
                    to={`/campaigns/${campaign.slug}`}
                    className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs rounded-xl transition-colors border border-outline-variant/50"
                  >
                    View Appeal Story
                  </Link>
                  <Link
                    to={`/donor/donations/money/step-1?campaignId=${campaign.id}`}
                    className="px-5 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-xs"
                  >
                    Donate Now →
                  </Link>
                </div>
              </div>

              {/* Title & Short Description */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-on-surface leading-tight">
                  {campaign.title}
                </h1>
                {campaign.short_description && (
                  <p className="text-sm text-on-surface-variant max-w-3xl leading-relaxed">
                    {campaign.short_description}
                  </p>
                )}
              </div>

              {/* NGO Identification Card */}
              <div className="p-4 sm:p-5 bg-surface-container-low rounded-2xl border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <AvatarImage
                    src={campaign.ngo_logo}
                    name={campaign.ngo_name}
                    size="md"
                    fallbackIcon="domain"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                      Organized & Executed by
                    </span>
                    <Link
                      to={`/ngos/${campaign.ngo_slug}`}
                      className="text-sm sm:text-base font-bold text-on-surface hover:text-primary transition-colors block"
                    >
                      {campaign.ngo_name}
                    </Link>
                    {locationDisplay && (
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-primary/70">location_on</span>
                        {locationDisplay}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-on-surface-variant shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
                    <span>Started: <strong className="text-on-surface">{formatDisplayDate(campaign.start_date)}</strong></span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">event</span>
                    <span>Ends: <strong className="text-on-surface">{formatDisplayDate(campaign.end_date)}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Financial & Transparency Summary */}
          <CampaignTrackingSummary
            campaign={campaign}
            totalVerifiedSpent={totalVerifiedSpent}
            milestones={milestones}
            verifiedProofs={verifiedProofs}
          />

          {/* Section 2: Sequential Milestone Timeline */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                  Execution Milestones & Distribution Verification
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Step-by-step progress tracking backed by geotagged field evidence
                </p>
              </div>

              <span className="text-xs font-semibold text-on-surface-variant">
                {milestones.length} {milestones.length === 1 ? 'Milestone' : 'Milestones'}
              </span>
            </div>

            <MilestoneTimeline milestones={milestones} />
          </div>

          {/* Section 3: All Verified Field Distribution Evidence Gallery */}
          <div className="space-y-6 pt-4 border-t border-outline-variant/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                  All Verified Field Distribution Proofs
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Geotagged photographs, distribution receipts, and beneficiary headcounts verified by DaanGives
                </p>
              </div>

              <span className="text-xs font-semibold text-on-surface-variant">
                {verifiedProofs.length} {verifiedProofs.length === 1 ? 'Proof Published' : 'Proofs Published'}
              </span>
            </div>

            {verifiedProofs.length === 0 ? (
              <TrackingEmptyState
                icon="photo_camera"
                title="No Field Distribution Proofs Published Yet"
                description="Verified photos and distribution documentation will appear here as the field teams execute milestones."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {verifiedProofs.map((proof) => (
                  <DistributionProofCard key={proof.id} proof={proof} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
