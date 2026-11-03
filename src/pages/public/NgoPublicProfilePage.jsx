import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import Badge from '../../components/common/Badge';
import AvatarImage from '../../components/common/AvatarImage';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import { getPublicNgoBySlugOrId, getPublicCampaigns } from '../../services/api';

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

export default function NgoPublicProfilePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ngo, setNgo] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  useEffect(() => {
    fetchPublicNgo();
  }, [id]);

  const fetchPublicNgo = async () => {
    setLoading(true);
    setError('');
    setNgo(null);
    setCampaigns([]);

    try {
      const data = await getPublicNgoBySlugOrId(id);
      setNgo(data);
      if (data && data.slug) {
        fetchNgoCampaigns(data.slug);
      }
    } catch (err) {
      if (err.status === 404) {
        setError('NGO not found.');
      } else {
        setError('Unable to load NGO profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNgoCampaigns = async (ngoSlug) => {
    setCampaignsLoading(true);
    try {
      const res = await getPublicCampaigns({ ngo_slug: ngoSlug });
      const list = res.results || (Array.isArray(res) ? res : []);
      setCampaigns(list);
    } catch (e) {
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const getCampaignTypeBadge = () => {
    return <Badge variant="info">Monetary Fundraiser</Badge>;
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="py-20 flex flex-col items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          <p className="text-sm font-semibold text-on-surface-variant mt-3">Loading Public NGO Profile...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !ngo) {
    return (
      <PublicLayout>
        <div className="py-20 bg-surface-container-low min-h-[calc(100vh-160px)] flex items-center justify-center">
          <div className="max-w-md w-full mx-4 bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-3xl mx-auto">
              <span className="material-symbols-outlined text-3xl">domain_disabled</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface">NGO Not Found</h1>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              The requested NGO profile does not exist or is not currently publicly available on DaanGives.
            </p>
            <Link
              to="/ngos"
              className="inline-block px-6 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-container transition-all shadow-xs"
            >
              Return to Public Directory
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const locationStr = [ngo.city, ngo.district, ngo.state].filter(Boolean).join(', ') || 'India';

  return (
    <PublicLayout>
      {/* Cover Header */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900">
        {ngo.cover_image ? (
          <img src={ngo.cover_image} alt={ngo.display_name} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-900 via-secondary to-slate-950 opacity-80"></div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-white">
            <div className="flex items-center gap-4">
              <AvatarImage
                src={ngo.logo}
                name={ngo.display_name}
                size="xl"
                shape="rounded"
                fallbackIcon="domain"
                className="border-2 border-white shadow-xl bg-white"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{ngo.display_name}</h1>
                {ngo.gujarati_name && (
                  <p className="text-sm text-secondary-container font-medium">{ngo.gujarati_name}</p>
                )}
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span> {locationStr}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {ngo.darpan_id && (
                <Badge variant="verified">Darpan ID: {ngo.darpan_id}</Badge>
              )}
              {ngo.has_80g && <Badge variant="success">80G Certified</Badge>}
              {ngo.has_12a && <Badge variant="info">12A Registered</Badge>}
              {ngo.is_csr_verified ? (
                <Badge variant="verified">CSR-1 Verified</Badge>
              ) : ngo.has_csr_1 ? (
                <Badge variant="secondary">CSR-1 Self-Declared (Unverified)</Badge>
              ) : null}
              {ngo.has_fcra && <Badge variant="warning">FCRA Approved</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: NGO Overview, Mission & Campaigns */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About & Overview */}
            <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/60 space-y-6">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">info</span>
                About the Organization
              </h2>

              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                {ngo.description || 'No detailed overview description provided.'}
              </p>
              
              {ngo.mission_statement && (
                <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-1">
                  <span className="text-xs font-bold text-primary block uppercase tracking-wider">Mission & Vision Statement</span>
                  <p className="text-sm text-on-surface font-medium leading-relaxed">{ngo.mission_statement}</p>
                </div>
              )}
            </div>

            {/* Service Areas & Operations */}
            <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/60 space-y-4">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">map</span>
                Operational Focus & Service Areas
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40">
                  <span className="text-on-surface-variant block font-medium">Primary Category</span>
                  <span className="font-bold text-on-surface text-sm">{getCategoryLabel(ngo.category)}</span>
                </div>

                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40">
                  <span className="text-on-surface-variant block font-medium">Year Established</span>
                  <span className="font-bold text-on-surface text-sm">{ngo.year_established || 'N/A'}</span>
                </div>

                {ngo.service_areas && (
                  <div className="sm:col-span-2 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40">
                    <span className="text-on-surface-variant block font-medium">Target Districts & Blocks</span>
                    <span className="font-semibold text-on-surface text-sm">{ngo.service_areas}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Active Campaigns & Drives Section */}
            <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/60 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">campaign</span>
                  Active Campaigns
                </h2>
                {campaigns.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                    {campaigns.length} {campaigns.length === 1 ? 'Appeal' : 'Appeals'}
                  </span>
                )}
              </div>

              {campaignsLoading ? (
                <div className="py-8 flex flex-col items-center justify-center text-xs text-on-surface-variant gap-2">
                  <span className="material-symbols-outlined text-2xl text-primary animate-spin">progress_activity</span>
                  <span>Loading organization campaigns...</span>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="p-8 bg-surface-container-low rounded-2xl border border-outline-variant/40 text-center space-y-2">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">campaign</span>
                  <p className="text-sm font-semibold text-on-surface">No active campaigns at the moment.</p>
                  <p className="text-xs text-on-surface-variant">
                    This organization currently has no ongoing public donation drives.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {campaigns.map((campaign) => {
                    const targetAmount = parseFloat(campaign.target_amount || 0);
                    const raisedAmount = parseFloat(campaign.raised_amount || 0);
                    const percentRaised = Math.min(100, Math.round((raisedAmount / (targetAmount || 1)) * 100));
                    const categoryLabel = getCategoryLabel(campaign.category);
                    const categoryIcon = getCategoryIcon(campaign.category);

                    return (
                      <div
                        key={campaign.id}
                        className="bg-surface-container-low rounded-2xl border border-outline-variant/60 overflow-hidden flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all group"
                      >
                        <div>
                          {/* Card Thumbnail */}
                          <div className="relative aspect-video w-full bg-surface-container overflow-hidden">
                            <ImageWithFallback
                              src={campaign.cover_image}
                              alt={campaign.title}
                              fallbackIcon={categoryIcon}
                              fallbackLabel={categoryLabel}
                              aspectRatio="aspect-video"
                              className="group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2 pointer-events-none">
                              <Badge variant="info">80G Eligible</Badge>
                            </div>
                          </div>

                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between text-[11px] font-bold text-secondary uppercase tracking-wider">
                              <span>{categoryLabel}</span>
                              {campaign.end_date && (
                                <span className="text-[10px] font-semibold text-on-surface-variant normal-case">
                                  {formatDisplayDate(campaign.end_date) ? `Ends ${formatDisplayDate(campaign.end_date)}` : ''}
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-bold text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                              {campaign.title}
                            </h3>
                            <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                              {campaign.short_description || campaign.description}
                            </p>

                            {targetAmount > 0 && (
                              <div className="space-y-1 pt-1 text-xs">
                                <div className="flex justify-between text-[11px] font-semibold text-on-surface-variant">
                                  <span>₹{raisedAmount.toLocaleString('en-IN')} raised</span>
                                  <span>Goal: ₹{targetAmount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="w-full bg-outline-variant/30 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-emerald-600 h-full transition-all" style={{ width: `${percentRaised}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 pt-0">
                          <Link
                            to={`/campaigns/${campaign.slug}`}
                            className="w-full py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-container text-center transition-colors block shadow-2xs"
                          >
                            View Campaign
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Contact & Public Roster */}
          <div className="space-y-6">
            
            {/* Contact Details */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/60 space-y-4">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">call</span>
                Official Contact
              </h3>

              <div className="space-y-3 text-xs">
                {ngo.official_email && (
                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                    <span className="material-symbols-outlined text-primary text-base">mail</span>
                    <div>
                      <span className="text-on-surface-variant block text-[10px]">Email</span>
                      <a href={`mailto:${ngo.official_email}`} className="font-semibold text-on-surface hover:underline">
                        {ngo.official_email}
                      </a>
                    </div>
                  </div>
                )}

                {ngo.official_phone && (
                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                    <span className="material-symbols-outlined text-primary text-base">phone</span>
                    <div>
                      <span className="text-on-surface-variant block text-[10px]">Phone</span>
                      <a href={`tel:${ngo.official_phone}`} className="font-semibold text-on-surface hover:underline">
                        {ngo.official_phone}
                      </a>
                    </div>
                  </div>
                )}

                {ngo.website && (
                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                    <span className="material-symbols-outlined text-primary text-base">language</span>
                    <div>
                      <span className="text-on-surface-variant block text-[10px]">Website</span>
                      <a href={ngo.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline truncate block">
                        {ngo.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Public Leadership Roster */}
            {ngo.leadership && ngo.leadership.length > 0 && (
              <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/60 space-y-4">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">badge</span>
                  Office Bearers & Trustees
                </h3>

                <div className="space-y-2.5">
                  {ngo.leadership.map((l, index) => (
                    <div key={index} className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-on-surface block">{l.full_name}</span>
                        <span className="text-on-surface-variant text-[11px]">{l.designation}</span>
                      </div>
                      {l.is_primary_contact && (
                        <Badge variant="verified">Primary Contact</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transparency Note */}
            <div className="p-5 bg-surface-container-lowest rounded-3xl border border-outline-variant/60 space-y-2 text-xs">
              <span className="font-bold text-on-surface flex items-center gap-1.5 text-emerald-600">
                <span className="material-symbols-outlined text-base">verified</span>
                Verified Organization
              </span>
              <p className="text-on-surface-variant leading-relaxed">
                This non-profit organization has completed verification on DaanGives. Registration certificates, bank accounts, and compliance filings have been reviewed by platform administrators.
              </p>
            </div>

          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
