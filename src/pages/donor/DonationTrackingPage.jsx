import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import DonorLayout from '../../layouts/DonorLayout';
import Badge from '../../components/common/Badge';
import CampaignTrackingSummary from '../../components/tracking/CampaignTrackingSummary';
import MilestoneTimeline from '../../components/tracking/MilestoneTimeline';
import TrackingEmptyState from '../../components/tracking/TrackingEmptyState';
import { getDonorMonetaryDonations, getPublicCampaignTracking } from '../../services/api';

export default function DonationTrackingPage() {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const campaignParam = searchParams.get('campaign');

  // Datasets
  const [donations, setDonations] = useState([]);
  const [selectedCampaignSlug, setSelectedCampaignSlug] = useState(campaignParam || null);
  const [trackingData, setTrackingData] = useState(null);

  // UI States
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [error, setError] = useState('');
  const [trackingError, setTrackingError] = useState('');

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    if (campaignParam) {
      setSelectedCampaignSlug(campaignParam);
    }
  }, [campaignParam]);

  useEffect(() => {
    if (selectedCampaignSlug) {
      fetchTracking(selectedCampaignSlug);
    } else {
      setTrackingData(null);
    }
  }, [selectedCampaignSlug]);

  const fetchDonations = async () => {
    setLoadingDonations(true);
    setError('');
    try {
      const res = await getDonorMonetaryDonations().catch(() => []);
      const list = Array.isArray(res) ? res : (res.results || []);
      setDonations(list);

      // If route has an ID matching a donation, find its campaign
      if (routeId) {
        const matched = list.find((d) => d.id === routeId || d.receipt_number === routeId);
        if (matched && matched.campaign_slug) {
          setSelectedCampaignSlug(matched.campaign_slug);
        }
      } else if (!campaignParam && list.length > 0) {
        // Auto-select first donation with campaign slug
        const firstWithCampaign = list.find((d) => d.campaign_slug);
        if (firstWithCampaign) {
          setSelectedCampaignSlug(firstWithCampaign.campaign_slug);
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to load donation records.');
    } finally {
      setLoadingDonations(false);
    }
  };

  const fetchTracking = async (slug) => {
    setLoadingTracking(true);
    setTrackingError('');
    try {
      const res = await getPublicCampaignTracking(slug);
      setTrackingData(res);
    } catch (err) {
      setTrackingError(err.message || 'Failed to load tracking data for this campaign.');
      setTrackingData(null);
    } finally {
      setLoadingTracking(false);
    }
  };

  const campaignDonations = donations.filter((d) => d.campaign_slug);

  return (
    <DonorLayout>
      <div className="max-w-6xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {routeId && (
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-primary mb-1">
                <span>DONATION REFERENCE:</span>
                <span>{routeId}</span>
              </div>
            )}
            <h1 className="text-2xl font-bold text-on-surface">Geotagged Impact & Logistics Tracking</h1>
            <p className="text-xs text-on-surface-variant">
              Milestone verification and distribution proof for your supported campaigns.
            </p>
          </div>

          {selectedCampaignSlug && (
            <Link
              to={`/campaigns/${selectedCampaignSlug}/tracking`}
              className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Full Public Audit Ledger</span>
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </Link>
          )}
        </div>

        {/* Loading State */}
        {loadingDonations ? (
          <div className="py-20 text-center text-xs text-on-surface-variant space-y-3 bg-surface-container-lowest rounded-3xl border border-outline-variant/60">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
            <p className="font-semibold text-sm">Loading your supported campaigns...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-surface-container-lowest rounded-3xl border border-red-500/20 text-center space-y-2">
            <p className="text-xs text-red-600 font-semibold">{error}</p>
            <button
              onClick={fetchDonations}
              className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high text-xs font-semibold rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : donations.length === 0 ? (
          <TrackingEmptyState
            icon="volunteer_activism"
            title="No Contributions Found Yet"
            description="When you contribute to campaigns, verified milestones and distribution proofs will appear here."
            actionText="Explore Verified Campaigns →"
            actionLink="/campaigns"
          />
        ) : (
          <div className="space-y-8">
            {/* Campaign Selection Tabs */}
            {campaignDonations.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                  Select a Supported Campaign:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {campaignDonations.map((d) => {
                    const isSelected = selectedCampaignSlug === d.campaign_slug;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setSelectedCampaignSlug(d.campaign_slug)}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all border shrink-0 flex items-center gap-2 ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border-outline-variant/60'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">campaign</span>
                        <span className="truncate max-w-[200px]">{d.campaign_title || 'Campaign Appeal'}</span>
                        <span className="text-[10px] opacity-80">
                          (₹{parseFloat(d.amount || 0).toLocaleString('en-IN')})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tracking Inspection Section */}
            {loadingTracking ? (
              <div className="py-20 text-center text-xs text-on-surface-variant space-y-3 bg-surface-container-lowest rounded-3xl border border-outline-variant/60">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                <p className="font-semibold text-sm">Fetching verified field evidence and milestone records...</p>
              </div>
            ) : trackingError ? (
              <div className="p-8 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/60 space-y-2">
                <span className="material-symbols-outlined text-3xl text-amber-600 mb-1">warning</span>
                <h3 className="text-base font-bold text-on-surface">Tracking Unavailable</h3>
                <p className="text-xs text-on-surface-variant">{trackingError}</p>
              </div>
            ) : trackingData ? (
              <div className="space-y-8">
                {/* Summary Card */}
                <CampaignTrackingSummary
                  campaign={trackingData.campaign}
                  totalVerifiedSpent={trackingData.total_verified_spent}
                  milestones={trackingData.milestones}
                  verifiedProofs={trackingData.verified_distribution_proofs}
                />

                {/* Milestone Progress */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-on-surface">
                        Phase Milestones & Field Proofs
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Audited by DaanGives moderators before public release
                      </p>
                    </div>

                    <Link
                      to={`/campaigns/${selectedCampaignSlug}/tracking`}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Open Full Ledger</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                  </div>

                  <MilestoneTimeline milestones={trackingData.milestones} />
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/60 text-xs text-on-surface-variant">
                Please select a campaign above to inspect its verified distribution audit trail.
              </div>
            )}

            {/* Contribution Records Summary */}
            <div className="pt-6 border-t border-outline-variant/40 space-y-3">
              <h3 className="text-sm font-bold text-on-surface">Your Contribution Receipts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {donations.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/60 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-on-surface-variant text-[11px] font-bold">
                        {d.receipt_number || d.id.substring(0, 8)}
                      </span>
                      <Badge variant="success">{d.status}</Badge>
                    </div>

                    <div className="font-bold text-on-surface text-sm">
                      {d.campaign_title || 'General Contribution'}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-outline-variant/30 text-xs">
                      <span className="text-on-surface-variant font-medium">Contributed Amount:</span>
                      <span className="font-bold text-primary">
                        ₹{parseFloat(d.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {d.campaign_slug ? (
                      <div className="pt-2">
                        <Link
                          to={`/campaigns/${d.campaign_slug}/tracking`}
                          className="w-full py-2 bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs rounded-xl transition-colors text-center block border border-outline-variant/50"
                        >
                          Track Impact →
                        </Link>
                      </div>
                    ) : (
                      <span className="text-[10px] text-on-surface-variant/60 block pt-1 italic">
                        Not linked to a specific campaign
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DonorLayout>
  );
}
