import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import Badge from '../../components/common/Badge';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import AvatarImage from '../../components/common/AvatarImage';
import { getPublicCampaigns, getMediaUrl } from '../../services/api';
import useDebounce from '../../hooks/useDebounce';

const CATEGORIES = [
  { label: 'All Categories', value: 'All' },
  { label: 'Education & Literacy', value: 'EDUCATION' },
  { label: 'Healthcare & Relief', value: 'HEALTHCARE' },
  { label: 'Environment & Animal Care', value: 'ENVIRONMENT' },
  { label: 'Women Empowerment', value: 'WOMEN_EMPOWERMENT' },
  { label: 'Child Welfare', value: 'CHILD_WELFARE' },
  { label: 'Disaster Relief', value: 'DISASTER_RELIEF' },
  { label: 'Animal Care', value: 'ANIMAL_CARE' },
  { label: 'Livelihood & Skills', value: 'LIVELIHOOD' },
  { label: 'Social Welfare & Other', value: 'OTHER' },
];

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

function CampaignCardCover({ campaign, categoryIcon, categoryLabel }) {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = getMediaUrl(campaign?.cover_image);

  if (resolvedUrl && !imgError) {
    return (
      <>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={resolvedUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover scale-110 blur-xl opacity-60 select-none"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <img
          src={resolvedUrl}
          alt={campaign?.title || 'Campaign Banner'}
          onError={() => setImgError(true)}
          className="relative z-1 w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
        />
      </>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary/10 to-surface-container flex flex-col items-center justify-center p-4 text-center select-none">
      <span className="material-symbols-outlined text-4xl text-primary/50 mb-1">
        {categoryIcon}
      </span>
      {categoryLabel && (
        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
          {categoryLabel}
        </span>
      )}
      <span className="text-[10px] text-on-surface-variant/70 mt-0.5">
        80G Eligible Campaign
      </span>
    </div>
  );
}

export default function CampaignDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 350);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // In-flight cancellation and stale-response protection
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const lastExecutedQueryKeyRef = useRef(null);

  const fetchCampaigns = useCallback(async (overrides = null) => {
    const overrideSearch = overrides && 'search' in overrides ? overrides.search : null;
    const rawSearch = overrideSearch !== null ? overrideSearch : ((searchTerm || '').trim() === '' ? '' : debouncedSearchTerm);
    const trimmedSearch = (typeof rawSearch === 'string' ? rawSearch : '').trim();

    const effectiveCategory = (overrides && 'category' in overrides) ? overrides.category : selectedCategory;
    const effectiveOrdering = (overrides && 'ordering' in overrides) ? overrides.ordering : ordering;
    const effectivePage = (overrides && 'page' in overrides) ? overrides.page : page;

    const queryKey = JSON.stringify({
      search: trimmedSearch,
      category: effectiveCategory,
      ordering: effectiveOrdering,
      page: effectivePage,
    });

    if (queryKey === lastExecutedQueryKeyRef.current) {
      return;
    }
    lastExecutedQueryKeyRef.current = queryKey;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentRequestId = ++requestIdRef.current;

    setLoading(true);
    setError('');
    try {
      const data = await getPublicCampaigns({
        search: trimmedSearch,
        category: effectiveCategory,
        ordering: effectiveOrdering,
        page: effectivePage,
      }, { signal: controller.signal });

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (data && data.results) {
        setCampaigns(data.results);
        setTotalCount(data.count || 0);
        setHasNext(Boolean(data.next));
        setHasPrev(Boolean(data.previous));
      } else if (Array.isArray(data)) {
        setCampaigns(data);
        setTotalCount(data.length);
        setHasNext(false);
        setHasPrev(false);
      } else {
        setCampaigns([]);
        setTotalCount(0);
        setHasNext(false);
        setHasPrev(false);
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.isAborted) {
        return;
      }
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      setError(err.message || 'Unable to load public campaigns. Please try again.');
      setCampaigns([]);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [searchTerm, debouncedSearchTerm, selectedCategory, ordering, page]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    lastExecutedQueryKeyRef.current = null;
    fetchCampaigns({ search: searchTerm.trim(), page: 1 });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setOrdering('-created_at');
    setPage(1);
    lastExecutedQueryKeyRef.current = null;
    fetchCampaigns({
      search: '',
      category: 'All',
      ordering: '-created_at',
      page: 1,
    });
  };

  return (
    <PublicLayout>
      {/* Hero / Page Header */}
      <div className="bg-surface-container-low py-10 border-b border-outline-variant/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <span className="material-symbols-outlined text-sm">campaign</span>
            <span>Verified Public Appeals</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-on-surface">Campaigns</h1>
          <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            Support verified monetary fundraising campaigns from approved NGOs across India with 80G tax benefits.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Search, Filter & Ordering Controls */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search campaigns, appeals, or NGOs..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </form>

            {/* Ordering Selector */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-on-surface-variant">Sort:</span>
                <select
                  value={ordering}
                  onChange={(e) => {
                    setOrdering(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
                >
                  <option value="-created_at">Newest First</option>
                  <option value="created_at">Oldest First</option>
                  <option value="end_date">Ending Soon</option>
                  <option value="-target_amount">Highest Goal</option>
                  <option value="-raised_amount">Most Raised</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/30">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Global Error Banner */}
        {error ? (
          <div className="p-6 bg-surface-container-lowest border border-red-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-300 text-sm font-semibold">
              <span className="material-symbols-outlined text-2xl text-red-500">error</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => {
                lastExecutedQueryKeyRef.current = null;
                fetchCampaigns();
              }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-container transition-all"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 space-y-4 animate-pulse"
              >
                <div className="h-44 bg-surface-container rounded-xl w-full"></div>
                <div className="flex justify-between items-center">
                  <div className="w-20 h-5 bg-surface-container rounded-full"></div>
                  <div className="w-24 h-5 bg-surface-container rounded-full"></div>
                </div>
                <div className="h-6 bg-surface-container rounded-lg w-3/4"></div>
                <div className="h-4 bg-surface-container rounded-lg w-1/2"></div>
                <div className="h-12 bg-surface-container rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          /* Empty State */
          <div className="bg-surface-container-lowest p-12 rounded-3xl border border-outline-variant/60 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-3xl mx-auto">
              <span className="material-symbols-outlined text-3xl">search_off</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">No active campaigns found.</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              No verified campaigns match your search query or selected category filters. Try clearing your filters or check back soon.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container text-xs transition-all shadow-xs"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          /* Campaigns Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((campaign) => {
              const targetAmount = parseFloat(campaign.target_amount || 0);
              const raisedAmount = parseFloat(campaign.raised_amount || 0);
              const percentRaised = Math.min(100, Math.round((raisedAmount / (targetAmount || 1)) * 100));
              const categoryLabel = getCategoryLabel(campaign.category);
              const categoryIcon = getCategoryIcon(campaign.category);
              const locationParts = [campaign.ngo_city, campaign.ngo_state].filter(Boolean);
              const locationDisplay = locationParts.join(', ');

              return (
                <div
                  key={campaign.id}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Cover Image or Themed Neutral Fallback */}
                    <div className="relative aspect-video w-full bg-surface-container-low overflow-hidden flex items-center justify-center">
                      <CampaignCardCover
                        campaign={campaign}
                        categoryIcon={categoryIcon}
                        categoryLabel={categoryLabel}
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none z-10">
                        <Badge variant="verified">Verified Appeal</Badge>
                      </div>
                      <div className="absolute top-3 right-3 pointer-events-none z-10">
                        <Badge variant="info">80G Eligible</Badge>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 space-y-4">
                      {/* Category Label */}
                      <div className="flex items-center justify-between text-xs font-bold text-secondary uppercase tracking-wider">
                        <span>{categoryLabel}</span>
                        {campaign.end_date && (
                          <span className="text-[11px] font-semibold text-on-surface-variant normal-case">
                            {formatDisplayDate(campaign.end_date) ? `Ends ${formatDisplayDate(campaign.end_date)}` : ''}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-on-surface line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {campaign.title}
                      </h3>

                      {/* NGO Ownership Identification Box */}
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                          Organized by
                        </span>
                        <div className="flex items-center gap-2.5">
                          <AvatarImage
                            src={campaign.ngo_logo}
                            name={campaign.ngo_name}
                            size="sm"
                            fallbackIcon="domain"
                          />
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/ngos/${campaign.ngo_slug}`}
                              className="font-bold text-xs text-on-surface hover:text-primary transition-colors block truncate"
                            >
                              {campaign.ngo_name}
                            </Link>
                            {locationDisplay && (
                              <span className="text-[11px] text-on-surface-variant flex items-center gap-0.5 truncate">
                                <span className="material-symbols-outlined text-[12px] text-primary/70 shrink-0">
                                  location_on
                                </span>
                                {locationDisplay}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Campaign Description */}
                      <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                        {campaign.short_description || campaign.description}
                      </p>

                      {/* Monetary Funding Progress */}
                      {targetAmount > 0 && (
                        <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 space-y-2 text-xs">
                          <div className="flex justify-between font-semibold text-xs">
                            <span className="text-on-surface">Raised: ₹{raisedAmount.toLocaleString('en-IN')}</span>
                            <span className="text-on-surface-variant">Goal: ₹{targetAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="w-full bg-outline-variant/30 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full transition-all duration-300"
                              style={{ width: `${percentRaised}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA Footer */}
                  <div className="p-6 pt-0 flex items-center gap-2">
                    <Link
                      to={`/campaigns/${campaign.slug}`}
                      className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container transition-colors text-center text-sm block shadow-xs"
                    >
                      View Campaign
                    </Link>
                    <Link
                      to={`/campaigns/${campaign.slug}/tracking`}
                      className="py-3 px-3.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-primary font-semibold rounded-xl transition-colors text-center text-sm flex items-center justify-center"
                      title="Track Verified Field Impact & Proofs"
                    >
                      <span className="material-symbols-outlined text-base">fact_check</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalCount > 12 && (
          <div className="flex items-center justify-between pt-6 border-t border-outline-variant/40 text-xs">
            <span className="text-on-surface-variant font-medium">
              Showing page {page} of {Math.ceil(totalCount / 12)} ({totalCount} total verified campaigns)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={!hasPrev || page === 1 || loading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl font-semibold disabled:opacity-40 hover:bg-surface-container-low transition-colors"
              >
                Previous Page
              </button>
              <button
                disabled={!hasNext || loading}
                onClick={() => setPage((prev) => prev + 1)}
                className="px-4 py-2 bg-primary text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-primary-container transition-colors"
              >
                Next Page
              </button>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
