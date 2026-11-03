import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CompanyLayout from '../../layouts/CompanyLayout';
import { getCsrMarketplace, getCsrRecommended } from '../../services/api';

const SCHEDULE_VII_CATEGORIES = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'ERADICATING_HUNGER', label: 'Hunger & Healthcare', icon: 'nutrition' },
  { key: 'PROMOTING_EDUCATION', label: 'Education & Skilling', icon: 'school' },
  { key: 'GENDER_EQUALITY', label: 'Gender Equality', icon: 'female' },
  { key: 'ENVIRONMENTAL_SUSTAINABILITY', label: 'Environment & Climate', icon: 'forest' },
  { key: 'NATIONAL_HERITAGE', label: 'Heritage & Art', icon: 'account_balance' },
  { key: 'ARMED_FORCES_VETERANS', label: 'Armed Forces Veterans', icon: 'military_tech' },
  { key: 'RURAL_SPORTS', label: 'Rural & Para Sports', icon: 'sports_soccer' },
  { key: 'PM_NATIONAL_RELIEF', label: 'PM National Relief', icon: 'volunteer_activism' },
  { key: 'TECHNOLOGY_INCUBATORS', label: 'Technology Incubators', icon: 'biotech' },
  { key: 'RURAL_DEVELOPMENT', label: 'Rural Development', icon: 'holiday_village' },
  { key: 'SLUM_DEVELOPMENT', label: 'Slum Development', icon: 'location_city' },
  { key: 'DISASTER_MANAGEMENT', label: 'Disaster Relief', icon: 'crisis_alert' },
];

const BENEFICIARY_DEMOGRAPHICS = [
  { key: 'ALL', label: 'All Beneficiaries' },
  { key: 'CHILDREN_EDUCATION', label: 'Children & Students' },
  { key: 'WOMEN_EMPOWERMENT', label: 'Women & SHGs' },
  { key: 'RURAL_COMMUNITIES', label: 'Rural & Tribal' },
  { key: 'YOUTH_SKILLING', label: 'Youth Skilling' },
  { key: 'HEALTHCARE_PATIENTS', label: 'Healthcare Patients' },
  { key: 'SPECIALLY_ABLED', label: 'Specially-Abled (PwD)' },
  { key: 'ELDERLY_CARE', label: 'Senior Citizens' },
  { key: 'ENVIRONMENTAL_HABITATS', label: 'Wildlife & Habitats' },
  { key: 'DISASTER_AFFECTED', label: 'Disaster-Affected' },
];

const INDIAN_STATES = [
  'All States', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export default function CompanyMarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Active view tab ('ALL' | 'RECOMMENDED')
  const activeTab = searchParams.get('tab') || 'ALL';

  // Filters State derived from URL searchParams
  const categoryFilter = searchParams.get('category') || 'ALL';
  const stateFilter = searchParams.get('state') || 'All States';
  const districtFilter = searchParams.get('district') || '';
  const demographicFilter = searchParams.get('demographic') || 'ALL';
  const minBudgetFilter = searchParams.get('min_budget') || '';
  const maxBudgetFilter = searchParams.get('max_budget') || '';
  const searchFilter = searchParams.get('search') || '';
  const orderingFilter = searchParams.get('ordering') || '-created_at';
  const pageFilter = parseInt(searchParams.get('page') || '1', 10);

  // Local form state for filter inputs
  const [localSearch, setLocalSearch] = useState(searchFilter);
  const [localDistrict, setLocalDistrict] = useState(districtFilter);
  const [localMinBudget, setLocalMinBudget] = useState(minBudgetFilter);
  const [localMaxBudget, setLocalMaxBudget] = useState(maxBudgetFilter);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Data States
  const [requirements, setRequirements] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const pageSize = 12;

  // Sync local inputs when URL parameters change
  useEffect(() => {
    setLocalSearch(searchFilter);
    setLocalDistrict(districtFilter);
    setLocalMinBudget(minBudgetFilter);
    setLocalMaxBudget(maxBudgetFilter);
  }, [searchFilter, districtFilter, minBudgetFilter, maxBudgetFilter]);

  // Fetch Data based on active tab and query params
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        if (activeTab === 'RECOMMENDED') {
          const res = await getCsrRecommended({ limit: 12, min_score: 0.0 });
          if (isMounted) {
            setRecommendations(Array.isArray(res) ? res : []);
          }
        } else {
          const params = {
            page: pageFilter,
            ordering: orderingFilter,
          };
          if (categoryFilter !== 'ALL') params.category = categoryFilter;
          if (stateFilter !== 'All States') params.state = stateFilter;
          if (districtFilter.trim()) params.district = districtFilter.trim();
          if (demographicFilter !== 'ALL') params.demographic = demographicFilter;
          if (minBudgetFilter.trim()) params.min_budget = minBudgetFilter.trim();
          if (maxBudgetFilter.trim()) params.max_budget = maxBudgetFilter.trim();
          if (searchFilter.trim()) params.search = searchFilter.trim();

          const res = await getCsrMarketplace(params);
          if (isMounted) {
            if (Array.isArray(res)) {
              setRequirements(res);
              setTotalCount(res.length);
            } else if (res && Array.isArray(res.results)) {
              setRequirements(res.results);
              setTotalCount(res.count || res.results.length);
            } else {
              setRequirements([]);
              setTotalCount(0);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load CSR marketplace proposals.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [
    activeTab,
    categoryFilter,
    stateFilter,
    districtFilter,
    demographicFilter,
    minBudgetFilter,
    maxBudgetFilter,
    searchFilter,
    orderingFilter,
    pageFilter,
  ]);

  // URL State Mutator Helper
  const updateQuery = (newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const merged = { ...current, ...newParams };
    // Remove empty keys
    Object.keys(merged).forEach((k) => {
      if (merged[k] === '' || merged[k] === null || merged[k] === undefined || (k === 'page' && merged[k] === 1)) {
        delete merged[k];
      }
    });
    setSearchParams(merged);
  };

  const handleTabChange = (tabName) => {
    updateQuery({ tab: tabName, page: 1 });
  };

  const handleFilterSubmit = (e) => {
    if (e) e.preventDefault();
    updateQuery({
      search: localSearch.trim(),
      district: localDistrict.trim(),
      min_budget: localMinBudget.trim(),
      max_budget: localMaxBudget.trim(),
      page: 1,
    });
    setFilterDrawerOpen(false);
  };

  const handleResetFilters = () => {
    setLocalSearch('');
    setLocalDistrict('');
    setLocalMinBudget('');
    setLocalMaxBudget('');
    setSearchParams(activeTab === 'RECOMMENDED' ? { tab: 'RECOMMENDED' } : {});
    setFilterDrawerOpen(false);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <CompanyLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-16">
        {/* Header Hero Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              CSR Proposal Marketplace
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Explore verified NGO development initiatives and inspect algorithmic Schedule VII match compatibility.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/company/preferences"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container hover:bg-primary/10 text-primary text-xs font-bold rounded-xl border border-outline-variant transition-all"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              Configure CSR Priorities
            </Link>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-3">
          <button
            onClick={() => handleTabChange('ALL')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">storefront</span>
            All Verified Requirements
            {activeTab === 'ALL' && !loading && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 text-white rounded-full text-[10px]">
                {totalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('RECOMMENDED')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'RECOMMENDED'
                ? 'bg-secondary text-white shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            AI Match Recommendations
          </button>
        </div>

        {/* Filters Section (Active only in ALL tab) */}
        {activeTab === 'ALL' && (
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-4">
            {/* Top Filter Bar: Search + Category + State + Filter Toggle */}
            <form onSubmit={handleFilterSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-on-surface-variant text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search requirement title, summary, or NGO name..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary transition-colors"
                />
              </div>

              {/* Category Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => updateQuery({ category: e.target.value, page: 1 })}
                className="px-3 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary transition-colors font-medium text-on-surface"
              >
                {SCHEDULE_VII_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* State Dropdown */}
              <select
                value={stateFilter}
                onChange={(e) => updateQuery({ state: e.target.value, page: 1 })}
                className="px-3 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary transition-colors font-medium text-on-surface"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* Sort Ordering */}
              <select
                value={orderingFilter}
                onChange={(e) => updateQuery({ ordering: e.target.value, page: 1 })}
                className="px-3 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary transition-colors font-medium text-on-surface"
              >
                <option value="-created_at">Newest First</option>
                <option value="required_csr_funding">Funding: Low to High</option>
                <option value="-required_csr_funding">Funding: High to Low</option>
                <option value="total_estimated_budget">Total Budget: Low to High</option>
              </select>

              {/* More Filters Toggle */}
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all inline-flex items-center justify-center gap-1.5 ${
                  filterDrawerOpen || minBudgetFilter || maxBudgetFilter || demographicFilter !== 'ALL' || districtFilter
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface-container border-outline-variant text-on-surface-variant hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-base">filter_list</span>
                More Filters
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-container transition-all"
              >
                Search
              </button>
            </form>

            {/* Expanded Filter Panel */}
            {filterDrawerOpen && (
              <div className="pt-4 border-t border-outline-variant/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
                {/* District Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1">District</label>
                  <input
                    type="text"
                    value={localDistrict}
                    onChange={(e) => setLocalDistrict(e.target.value)}
                    placeholder="e.g. Pune, Kamrup"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary"
                  />
                </div>

                {/* Demographic Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1">Target Beneficiary</label>
                  <select
                    value={demographicFilter}
                    onChange={(e) => updateQuery({ demographic: e.target.value, page: 1 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary font-medium"
                  >
                    {BENEFICIARY_DEMOGRAPHICS.map((b) => (
                      <option key={b.key} value={b.key}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Budget (INR) */}
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1">Min Required (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={localMinBudget}
                    onChange={(e) => setLocalMinBudget(e.target.value)}
                    placeholder="e.g. 100000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary"
                  />
                </div>

                {/* Max Budget (INR) */}
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1">Max Required (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={localMaxBudget}
                    onChange={(e) => setLocalMaxBudget(e.target.value)}
                    placeholder="e.g. 5000000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary"
                  />
                </div>

                {/* Action Buttons */}
                <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface hover:underline"
                  >
                    Reset All Filters
                  </button>
                  <button
                    type="button"
                    onClick={handleFilterSubmit}
                    className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-container"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 bg-surface-container rounded-3xl"></div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-error-container/20 border border-error/30 p-8 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">error_outline</span>
            </div>
            <h3 className="text-base font-bold text-on-surface">Failed to load marketplace</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">{error}</p>
            <button
              onClick={() => updateQuery({ page: pageFilter })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container transition-all"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Retry
            </button>
          </div>
        )}

        {/* TAB 1: ALL REQUIREMENTS GRID */}
        {!loading && !error && activeTab === 'ALL' && (
          <>
            {requirements.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-container text-on-surface-variant flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">search_off</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">No Requirements Found</h3>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                  No verified NGO proposals match your active filter criteria. Try expanding your location or budget parameters.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-container transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {requirements.map((req) => (
                    <div
                      key={req.id}
                      className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 shadow-xs hover:shadow-lg hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Top Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-xs">category</span>
                            {req.category_display || req.schedule_vii_category?.replace(/_/g, ' ')}
                          </span>

                          <span className="text-[11px] text-on-surface-variant font-medium">
                            {req.state || 'Pan-India'}
                          </span>
                        </div>

                        {/* Title & Summary */}
                        <div>
                          <h3 className="text-base font-bold text-on-surface line-clamp-2 hover:text-primary transition-colors">
                            <Link to={`/company/requirements/${req.id}`}>{req.title}</Link>
                          </h3>
                          <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2">
                            {req.summary || 'Verified community development and welfare program.'}
                          </p>
                        </div>

                        {/* NGO Identity */}
                        <div className="p-2.5 bg-surface-container-low rounded-xl text-xs flex items-center justify-between">
                          <div className="overflow-hidden">
                            <span className="block font-bold text-on-surface truncate">
                              {req.ngo_display_name || req.ngo_legal_name || 'Verified NGO'}
                            </span>
                            <span className="text-[11px] text-on-surface-variant">
                              {req.district ? `${req.district}, ${req.state}` : req.state || 'India'}
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
                        </div>

                        {/* Funding Figures */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/30 text-xs">
                          <div>
                            <span className="text-[11px] text-on-surface-variant block">Required CSR</span>
                            <span className="text-sm font-black text-primary">
                              {formatCurrency(req.required_csr_funding)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-on-surface-variant block">Total Budget</span>
                            <span className="text-sm font-bold text-on-surface">
                              {formatCurrency(req.total_estimated_budget)}
                            </span>
                          </div>
                        </div>

                        {/* Beneficiary & Demographic Tag */}
                        {req.demographic_display && (
                          <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs text-secondary">groups</span>
                            <span>{req.demographic_display}</span>
                            {req.target_beneficiary_count > 0 && (
                              <span className="font-bold text-on-surface">
                                ({req.target_beneficiary_count.toLocaleString('en-IN')} beneficiaries)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Action */}
                      <div className="pt-3 border-t border-outline-variant/30">
                        <Link
                          to={`/company/requirements/${req.id}`}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                        >
                          <span>Inspect Proposal Dossier</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-outline-variant/40">
                    <span className="text-xs text-on-surface-variant font-medium">
                      Showing page {pageFilter} of {totalPages} ({totalCount} proposals)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuery({ page: Math.max(1, pageFilter - 1) })}
                        disabled={pageFilter <= 1}
                        className="px-4 py-2 bg-surface-container rounded-xl text-xs font-bold text-on-surface disabled:opacity-40 hover:bg-slate-200 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => updateQuery({ page: Math.min(totalPages, pageFilter + 1) })}
                        disabled={pageFilter >= totalPages}
                        className="px-4 py-2 bg-surface-container rounded-xl text-xs font-bold text-on-surface disabled:opacity-40 hover:bg-slate-200 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* TAB 2: AI MATCH RECOMMENDATIONS */}
        {!loading && !error && activeTab === 'RECOMMENDED' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-secondary text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Deterministic CSR Match Ranking</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Scored using the statutory formula: Category (35%) + Location (25%) + Budget (20%) + Beneficiaries (10%) + Duration (10%)
                  </p>
                </div>
              </div>

              <Link
                to="/company/preferences"
                className="shrink-0 px-4 py-2 bg-white hover:bg-slate-50 text-secondary text-xs font-bold rounded-xl border border-secondary/30 shadow-xs transition-all"
              >
                Edit Match Preferences
              </Link>
            </div>

            {recommendations.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-container text-on-surface-variant flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">psychology</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">No Recommendations Found</h3>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                  To activate algorithmic matching, configure your preferred Schedule VII categories, target Indian states, and budget parameters.
                </p>
                <Link
                  to="/company/preferences"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-container transition-all"
                >
                  <span className="material-symbols-outlined text-base">tune</span>
                  Configure Preferences
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec, idx) => {
                  const score = Math.round(rec.match_score || 0);
                  const scoreColor =
                    score >= 80
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : score >= 60
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300';

                  return (
                    <div
                      key={rec.requirement_id || idx}
                      className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 shadow-xs hover:shadow-lg hover:border-secondary/50 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Match Score Badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
                            Rank #{idx + 1}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${scoreColor}`}>
                            <span className="material-symbols-outlined text-sm">verified</span>
                            {score}% Compatibility
                          </span>
                        </div>

                        {/* Breakdown Sub-scores */}
                        {rec.breakdown && (
                          <div className="p-3 bg-surface-container-low rounded-2xl space-y-2">
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                              Scoring Breakdown
                            </span>
                            <div className="grid grid-cols-3 gap-2 text-[11px]">
                              <div>
                                <span className="text-on-surface-variant block text-[10px]">Category</span>
                                <strong className="text-on-surface">{rec.breakdown.category || 0}/35</strong>
                              </div>
                              <div>
                                <span className="text-on-surface-variant block text-[10px]">Location</span>
                                <strong className="text-on-surface">{rec.breakdown.location || 0}/25</strong>
                              </div>
                              <div>
                                <span className="text-on-surface-variant block text-[10px]">Budget</span>
                                <strong className="text-on-surface">{rec.breakdown.budget || 0}/20</strong>
                              </div>
                              <div>
                                <span className="text-on-surface-variant block text-[10px]">Demographic</span>
                                <strong className="text-on-surface">{rec.breakdown.demographic || 0}/10</strong>
                              </div>
                              <div>
                                <span className="text-on-surface-variant block text-[10px]">Duration</span>
                                <strong className="text-on-surface">{rec.breakdown.duration || 0}/10</strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Explainability Bullet Points */}
                        {rec.reasons && rec.reasons.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold text-on-surface block">
                              Why this proposal matches:
                            </span>
                            <ul className="space-y-1">
                              {rec.reasons.map((reason, rIdx) => (
                                <li key={rIdx} className="text-xs text-on-surface-variant flex items-start gap-1.5">
                                  <span className="material-symbols-outlined text-xs text-secondary shrink-0 mt-0.5">
                                    check_circle
                                  </span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Card Action */}
                      <div className="pt-3 border-t border-outline-variant/30">
                        <Link
                          to={`/company/requirements/${rec.requirement_id}`}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-secondary hover:bg-secondary/90 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                        >
                          <span>Inspect Proposal Dossier</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
