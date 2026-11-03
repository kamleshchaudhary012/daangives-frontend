import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import Badge from '../../components/common/Badge';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import AvatarImage from '../../components/common/AvatarImage';
import { getPublicCampaignBySlug } from '../../services/api';

function getCategoryLabel(cat) {
  const map = {
    EDUCATION: 'Education & Literacy',
    HEALTHCARE: 'Healthcare & Relief',
    ENVIRONMENT: 'Environment & Animal Care',
    WOMEN_EMPOWERMENT: 'Women Empowerment',
    CHILD_WELFARE: 'Child Welfare',
    DISASTER_RELIEF: 'Disaster Relief',
    ANIMAL_CARE: 'Animal Care',
    LIVELIHOOD: 'Livelihood & Skills',
    OTHER: 'Social Welfare',
  };
  return map[cat] || cat || 'Social Welfare';
}

function getCategoryIcon(cat) {
  const iconMap = {
    EDUCATION: 'school',
    HEALTHCARE: 'medical_services',
    ENVIRONMENT: 'eco',
    WOMEN_EMPOWERMENT: 'diversity_1',
    CHILD_WELFARE: 'child_care',
    DISASTER_RELIEF: 'emergency',
    ANIMAL_CARE: 'pets',
    LIVELIHOOD: 'work',
    OTHER: 'volunteer_activism',
  };
  return iconMap[cat] || 'volunteer_activism';
}

function getCampaignTypeLabel(type) {
  const map = {
    MONETARY: 'Monetary Fundraiser',
  };
  return map[type] || 'Monetary Fundraiser';
}

function getInitials(name) {
  if (!name) return 'NGO';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
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

export default function NeedRequestDetailsPage() {
  const { id: slug } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCampaignDetails();
  }, [slug]);

  const fetchCampaignDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPublicCampaignBySlug(slug);
      setCampaign(data);
    } catch (err) {
      if (err.status === 404) {
        setError('The requested campaign appeal does not exist or is not currently active.');
      } else {
        setError('Failed to load campaign appeal details.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="py-20 flex flex-col items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          <p className="text-sm font-semibold text-on-surface-variant mt-3">Loading Campaign Appeal...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !campaign) {
    return (
      <PublicLayout>
        <div className="py-20 bg-surface-container-low min-h-[calc(100vh-160px)] flex items-center justify-center">
          <div className="max-w-md w-full mx-4 bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-3xl mx-auto">
              <span className="material-symbols-outlined text-3xl">campaign</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface">Campaign Not Found</h1>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {error || 'The requested campaign appeal does not exist or is not currently publicly available.'}
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

  const targetAmount = parseFloat(campaign.target_amount || 0);
  const raisedAmount = parseFloat(campaign.raised_amount || 0);
  const percentRaised = Math.min(100, Math.round((raisedAmount / (targetAmount || 1)) * 100));

  const categoryLabel = getCategoryLabel(campaign.category);
  const categoryIcon = getCategoryIcon(campaign.category);
  const locationParts = [campaign.ngo_city, campaign.ngo_state].filter(Boolean);
  const locationDisplay = locationParts.join(', ');

  return (
    <PublicLayout>
      {/* Breadcrumbs */}
      <div className="bg-surface-container-low py-6 border-b border-outline-variant/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/campaigns" className="hover:text-primary font-semibold transition-colors">Campaigns</Link>
            <span>/</span>
            <Link to={`/ngos/${campaign.ngo_slug}`} className="hover:text-primary font-semibold transition-colors">
              {campaign.ngo_name}
            </Link>
            <span>/</span>
            <span className="text-on-surface font-medium truncate max-w-xs">{campaign.title}</span>
          </div>
        </div>
      </div>

      <div className="py-12 bg-surface-container-low min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 shadow-xl overflow-hidden">
            {/* Campaign Cover Image or Fallback Banner */}
            <ImageWithFallback
              src={campaign.cover_image}
              alt={campaign.title}
              fallbackIcon={categoryIcon}
              fallbackLabel={`${categoryLabel} • Verified Appeal`}
              aspectRatio="aspect-video sm:aspect-21/9"
            />

            <div className="p-6 sm:p-8 space-y-6">
              {/* Header Badges & Title */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="verified">Verified Appeal</Badge>
                    <Badge variant="info">80G Eligible</Badge>
                  </div>
                  <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                    {categoryLabel}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-on-surface leading-tight">
                  {campaign.title}
                </h1>
              </div>

              {/* NGO Identity & Organizer Card */}
              <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <AvatarImage
                    src={campaign.ngo_logo}
                    name={campaign.ngo_name}
                    size="lg"
                    fallbackIcon="domain"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                      Organized by
                    </span>
                    <Link
                      to={`/ngos/${campaign.ngo_slug}`}
                      className="text-base font-bold text-on-surface hover:text-primary transition-colors block truncate"
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

                <Link
                  to={`/ngos/${campaign.ngo_slug}`}
                  className="px-4 py-2 bg-surface-container-lowest border border-outline-variant text-primary hover:bg-surface-container font-semibold text-xs rounded-xl transition-colors text-center shrink-0 self-start sm:self-center"
                >
                  View NGO Profile →
                </Link>
              </div>

              {/* Campaign Timeline Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-base">calendar_today</span>
                  <div>
                    <span className="text-on-surface-variant block text-[10px]">Start Date</span>
                    <span className="font-semibold text-on-surface">{formatDisplayDate(campaign.start_date)}</span>
                  </div>
                </div>

                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-base">event</span>
                  <div>
                    <span className="text-on-surface-variant block text-[10px]">End Date</span>
                    <span className="font-semibold text-on-surface">{formatDisplayDate(campaign.end_date)}</span>
                  </div>
                </div>
              </div>

              {/* Funding Progress Box */}
              {targetAmount > 0 && (
                <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-4">
                  <div className="flex items-center justify-between text-sm font-bold text-on-surface">
                    <span>Raised: ₹{raisedAmount.toLocaleString('en-IN')}</span>
                    <span className="text-on-surface-variant">
                      Goal: ₹{targetAmount.toLocaleString('en-IN')} ({percentRaised}%)
                    </span>
                  </div>

                  <div className="w-full bg-outline-variant/30 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${percentRaised}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Campaign Summary & Description */}
              <div className="space-y-4 pt-4 border-t border-outline-variant/40">
                <h2 className="text-base font-bold text-on-surface">About This Appeal</h2>
                {campaign.short_description && (
                  <p className="text-sm text-on-surface leading-relaxed font-medium bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant/30">
                    {campaign.short_description}
                  </p>
                )}
                <div className="text-xs sm:text-sm text-on-surface-variant leading-relaxed whitespace-pre-line space-y-2">
                  {campaign.description}
                </div>
              </div>

              {/* Transparency & Field Distribution Tracking Section */}
              <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <span className="material-symbols-outlined text-base">policy</span>
                    <span>Audited Execution & Field Transparency</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    View verified milestones, geotagged distribution photographs, expenditure records, and beneficiary headcounts.
                  </p>
                </div>
                <Link
                  to={`/campaigns/${campaign.slug}/tracking`}
                  className="px-5 py-2.5 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant text-primary font-bold text-xs rounded-xl transition-all shadow-xs text-center shrink-0 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">fact_check</span>
                  <span>Track Verified Impact →</span>
                </Link>
              </div>

              {/* Monetary Donation CTA */}
              <div className="pt-6 border-t border-outline-variant/40">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="block text-xs font-bold text-on-surface">Financial Contribution</span>
                    <span className="block text-[11px] text-on-surface-variant">
                      Support {campaign.ngo_name} financially with 80G tax benefit and verified transparency.
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <Link
                      to={`/campaigns/${campaign.slug}/tracking`}
                      className="w-full sm:w-auto px-5 py-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-primary font-semibold text-sm rounded-xl transition-colors text-center"
                    >
                      Track Impact
                    </Link>
                    <Link
                      to={(campaign.ngo || campaign.ngo_id) ? `/donor/donations/money/step-2?campaignId=${campaign.id}&ngoId=${campaign.ngo || campaign.ngo_id}` : `/donor/donations/money/step-1?campaignId=${campaign.id}`}
                      className="w-full sm:w-auto px-8 py-3 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md text-center"
                    >
                      Donate Money →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
