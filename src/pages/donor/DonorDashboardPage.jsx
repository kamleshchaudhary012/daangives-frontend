import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DonorLayout from '../../layouts/DonorLayout';
import Badge from '../../components/common/Badge';
import {
  getUserProfile,
  getPublicNgos,
  getDonorMonetaryDonations,
} from '../../services/api';

export default function DonorDashboardPage() {
  const [userProfile, setUserProfile] = useState(null);
  const [featuredNgos, setFeaturedNgos] = useState([]);
  const [monetaryDonations, setMonetaryDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [userRes, ngosRes, donationsRes] = await Promise.all([
        getUserProfile().catch(() => null),
        getPublicNgos({ page: 1, ordering: '-year_established' }).catch(() => ({ results: [] })),
        getDonorMonetaryDonations().catch(() => []),
      ]);

      if (userRes) {
        setUserProfile(userRes);
      } else {
        const localUserStr = localStorage.getItem('user');
        if (localUserStr) {
          try { setUserProfile(JSON.parse(localUserStr)); } catch (e) {}
        }
      }

      if (ngosRes.results) {
        setFeaturedNgos(ngosRes.results.slice(0, 2));
      } else if (Array.isArray(ngosRes)) {
        setFeaturedNgos(ngosRes.slice(0, 2));
      }

      const donationsList = Array.isArray(donationsRes) ? donationsRes : (donationsRes.results || []);
      setMonetaryDonations(donationsList);

    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const displayName = userProfile?.full_name || userProfile?.email || 'Donor';

  // Dynamic calculations from real SUCCESS donations
  const successfulDonations = monetaryDonations.filter((d) => d.status === 'SUCCESS');
  const totalDonatedFunds = successfulDonations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  
  const allCampaignIds = new Set(
    successfulDonations.map((d) => d.campaign).filter(Boolean)
  );

  const recentActivity = monetaryDonations.slice(0, 4);

  return (
    <DonorLayout>
      <div className="space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary to-primary-container text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs uppercase font-semibold text-primary-fixed-dim tracking-wider">Donor Portal</span>
            <h1 className="text-2xl sm:text-3xl font-bold">Welcome, {displayName}!</h1>
            <p className="text-xs sm:text-sm text-surface-container-high max-w-xl">
              Support verified local non-profits directly with complete transparency across India.
            </p>
          </div>
          <Link
            to="/ngos"
            className="px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-surface-container transition-all shadow-md shrink-0 text-sm"
          >
            Explore Verified NGOs
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between text-xs font-semibold text-red-700 dark:text-red-300">
            <span>{error}</span>
            <button onClick={fetchDashboardData} className="underline hover:text-red-800">Retry</button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 space-y-2">
            <div className="flex items-center justify-between text-on-surface-variant text-xs">
              <span>Total Donated Funds</span>
              <span className="material-symbols-outlined text-primary text-xl">payments</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-on-surface">
              {loading ? (
                <span className="text-base text-on-surface-variant animate-pulse">Calculating...</span>
              ) : (
                `₹${totalDonatedFunds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </div>
            <p className="text-[11px] text-on-surface-variant font-medium">
              {successfulDonations.length} Verified Contribution{successfulDonations.length === 1 ? '' : 's'} • 80G Eligible
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 space-y-2">
            <div className="flex items-center justify-between text-on-surface-variant text-xs">
              <span>Tax Receipts (80G)</span>
              <span className="material-symbols-outlined text-secondary text-xl">receipt_long</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-on-surface">
              {loading ? (
                <span className="text-base text-on-surface-variant animate-pulse">Loading...</span>
              ) : (
                `${successfulDonations.length} Issued`
              )}
            </div>
            <p className="text-[11px] text-on-surface-variant font-medium">
              Instant 80G Certificate Generation
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 space-y-2">
            <div className="flex items-center justify-between text-on-surface-variant text-xs">
              <span>Verified Campaigns Funded</span>
              <span className="material-symbols-outlined text-tertiary text-xl">verified</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-on-surface">
              {loading ? '-' : `${allCampaignIds.size} Campaigns`}
            </div>
            <p className="text-[11px] text-on-surface-variant font-medium">Direct Non-Profit Impact</p>
          </div>
        </div>

        {/* Recent Donation Tracking */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface">Recent Donation Activity</h2>
            <Link to="/donor/donations" className="text-xs font-semibold text-primary hover:underline">View All History</Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-on-surface-variant space-y-2">
              <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
              <p className="font-semibold">Loading donation history...</p>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-surface-container-low/50 rounded-xl border border-outline-variant/40">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">history</span>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-on-surface">No Donation Activity Recorded Yet</h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  Your monetary contributions and tax receipts will appear here as soon as you support a campaign.
                </p>
              </div>
              <Link to="/campaigns" className="inline-block mt-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-container">
                Browse Active Campaigns
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((donation) => (
                <div
                  key={donation.id}
                  className="p-4 bg-surface-container-low/60 rounded-xl border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface text-sm">
                        {donation.campaign_title || 'Community Campaign'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        donation.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                          : donation.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
                      }`}>
                        {donation.status}
                      </span>
                    </div>
                    <div className="text-on-surface-variant text-[11px] flex flex-wrap items-center gap-2">
                      <span>NGO: <strong className="text-on-surface">{donation.ngo_name || 'Verified Non-Profit'}</strong></span>
                      <span>•</span>
                      <span>Ref: <strong className="font-mono text-on-surface">{donation.receipt_number}</strong></span>
                      {donation.paid_at && (
                        <>
                          <span>•</span>
                          <span>{new Date(donation.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className="text-base font-bold text-primary">
                      ₹{parseFloat(donation.amount).toLocaleString('en-IN')}
                    </span>
                    <Link
                      to={`/donor/donations/money/step-4?donationId=${donation.id}&status=${donation.status}`}
                      className="px-3 py-1.5 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/60 rounded-lg text-on-surface font-semibold text-[11px] transition-colors"
                    >
                      View Receipt
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Featured NGOs Section */}
        {featuredNgos.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Verified Non-Profit Partners</h2>
              <Link to="/ngos" className="text-xs font-semibold text-primary hover:underline">Explore All NGOs</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuredNgos.map((ngo) => (
                <div key={ngo.id} className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/60 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-on-surface">{ngo.display_name || ngo.legal_name}</h3>
                      <p className="text-[11px] text-on-surface-variant">{ngo.city}, {ngo.state}</p>
                    </div>
                    <Badge variant="success">80G Verified</Badge>
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {ngo.description || 'Verified organization working on grassroots social impact initiatives.'}
                  </p>
                  <div className="pt-1">
                    <Link
                      to={`/ngos/${ngo.id}`}
                      className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>View Organization Profile</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </DonorLayout>
  );
}
