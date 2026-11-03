import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import Badge from '../../components/common/Badge';
import AvatarImage from '../../components/common/AvatarImage';
import { getPublicNgos } from '../../services/api';
import useDebounce from '../../hooks/useDebounce';

const CATEGORIES = [
  { label: 'All Categories', value: 'All' },
  { label: 'Education', value: 'EDUCATION' },
  { label: 'Healthcare', value: 'HEALTHCARE' },
  { label: 'Rural Development', value: 'RURAL_DEV' },
  { label: 'Women Empowerment', value: 'WOMEN_EMPOWERMENT' },
  { label: 'Environment Care', value: 'ENVIRONMENT' },
  { label: 'Disaster Relief', value: 'DISASTER_RELIEF' },
  { label: 'Other Social Work', value: 'OTHER' },
];

export default function NgoDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 350);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [ordering, setOrdering] = useState('display_name');
  const [has80gFilter, setHas80gFilter] = useState(false);
  const [hasFcraFilter, setHasFcraFilter] = useState(false);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ngos, setNgos] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // In-flight cancellation and stale-response protection
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const lastExecutedQueryKeyRef = useRef(null);

  const fetchNgos = useCallback(async (overrides = null) => {
    const overrideSearch = overrides && 'search' in overrides ? overrides.search : null;
    const rawSearch = overrideSearch !== null ? overrideSearch : ((searchTerm || '').trim() === '' ? '' : debouncedSearchTerm);
    const trimmedSearch = (typeof rawSearch === 'string' ? rawSearch : '').trim();

    const effectiveCategory = (overrides && 'category' in overrides) ? overrides.category : selectedCategory;
    const effective80g = (overrides && 'has_80g' in overrides) ? overrides.has_80g : has80gFilter;
    const effectiveFcra = (overrides && 'has_fcra' in overrides) ? overrides.has_fcra : hasFcraFilter;
    const effectiveOrdering = (overrides && 'ordering' in overrides) ? overrides.ordering : ordering;
    const effectivePage = (overrides && 'page' in overrides) ? overrides.page : page;

    const queryKey = JSON.stringify({
      search: trimmedSearch,
      category: effectiveCategory,
      has_80g: Boolean(effective80g),
      has_fcra: Boolean(effectiveFcra),
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
      const data = await getPublicNgos({
        search: trimmedSearch,
        category: effectiveCategory,
        has_80g: effective80g ? 'true' : '',
        has_fcra: effectiveFcra ? 'true' : '',
        ordering: effectiveOrdering,
        page: effectivePage,
      }, { signal: controller.signal });

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (data.results) {
        setNgos(data.results);
        setTotalCount(data.count || 0);
        setHasNext(Boolean(data.next));
        setHasPrev(Boolean(data.previous));
      } else if (Array.isArray(data)) {
        setNgos(data);
        setTotalCount(data.length);
        setHasNext(false);
        setHasPrev(false);
      } else {
        setNgos([]);
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
      setError(err.message || 'Unable to load NGO directory. Please try again.');
      setNgos([]);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [searchTerm, debouncedSearchTerm, selectedCategory, has80gFilter, hasFcraFilter, ordering, page]);

  useEffect(() => {
    fetchNgos();
  }, [fetchNgos]);

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
    fetchNgos({ search: searchTerm.trim(), page: 1 });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setOrdering('display_name');
    setHas80gFilter(false);
    setHasFcraFilter(false);
    setPage(1);
    lastExecutedQueryKeyRef.current = null;
    fetchNgos({
      search: '',
      category: 'All',
      has_80g: false,
      has_fcra: false,
      ordering: 'display_name',
      page: 1,
    });
  };

  return (
    <PublicLayout>
      <div className="bg-surface-container-low py-10 border-b border-outline-variant/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">

          <h1 className="text-3xl sm:text-4xl font-bold text-on-surface">Verified NGO Directory</h1>
          <p className="text-sm text-on-surface-variant max-w-2xl">
            Browse fully transparent, Darpan ID registered, and audited non-profit organizations.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Search, Filters & Ordering Controls */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 space-y-4">

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-lg">search</span>
              <input
                type="text"
                placeholder="Search NGO by name, city, or district..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </form>

            {/* Ordering & Filter Toggles */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={has80gFilter}
                  onChange={(e) => { setHas80gFilter(e.target.checked); setPage(1); }}
                  className="rounded text-primary focus:ring-primary"
                />
                80G Approved Only
              </label>

              <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasFcraFilter}
                  onChange={(e) => { setHasFcraFilter(e.target.checked); setPage(1); }}
                  className="rounded text-primary focus:ring-primary"
                />
                FCRA Reg. Only
              </label>

              <select
                value={ordering}
                onChange={(e) => { setOrdering(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
              >
                <option value="display_name">Name (A-Z)</option>
                <option value="-display_name">Name (Z-A)</option>
                <option value="-year_established">Newest Established</option>
                <option value="year_established">Oldest Established</option>
              </select>
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${selectedCategory === cat.value
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error ? (
          <div className="p-6 bg-surface-container-lowest border border-red-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-300 text-sm font-semibold">
              <span className="material-symbols-outlined text-2xl text-red-500">error</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => {
                lastExecutedQueryKeyRef.current = null;
                fetchNgos();
              }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-container transition-all"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="w-16 h-16 bg-surface-container rounded-xl"></div>
                  <div className="w-24 h-6 bg-surface-container rounded-full"></div>
                </div>
                <div className="h-6 bg-surface-container rounded-lg w-3/4"></div>
                <div className="h-4 bg-surface-container rounded-lg w-1/2"></div>
                <div className="h-16 bg-surface-container rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : ngos.length === 0 ? (
          /* Empty State */
          <div className="bg-surface-container-lowest p-12 rounded-3xl border border-outline-variant/60 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-3xl mx-auto">
              <span className="material-symbols-outlined text-3xl">search_off</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">No Verified NGOs Found</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              No verified organizations matched your search query or selected category filters. Try clearing your filters.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container text-xs transition-all shadow-xs"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          /* Directory Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ngos.map((ngo) => (
              <div
                key={ngo.id}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <AvatarImage
                      src={ngo.logo}
                      name={ngo.display_name}
                      size="lg"
                      shape="rounded"
                      fallbackIcon="domain"
                    />
                    <Badge variant="verified">
                      {ngo.darpan_id ? `Darpan: ${ngo.darpan_id}` : 'Verified NGO'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-on-surface line-clamp-1">{ngo.display_name}</h3>
                    {ngo.gujarati_name && (
                      <p className="text-xs text-secondary font-medium mt-0.5">{ngo.gujarati_name}</p>
                    )}
                    <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      {[ngo.city, ngo.district, ngo.state].filter(Boolean).join(', ') || 'India'}
                    </p>
                  </div>

                  <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                    {ngo.description || ngo.mission_statement || 'Dedicated to transparent community welfare initiatives.'}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-outline-variant/40 text-xs">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Category:</span>
                      <span className="font-medium text-on-surface">{ngo.category}</span>
                    </div>
                    {ngo.year_established && (
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Established:</span>
                        <span className="font-medium text-on-surface">{ngo.year_established}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Compliance & Exemptions:</span>
                      <span className="font-semibold text-emerald-700">
                        {[
                          ngo.has_80g && '80G',
                          ngo.has_12a && '12A',
                          ngo.is_csr_verified ? 'CSR-1 Verified' : (ngo.has_csr_1 && 'CSR-1 (Unverified)'),
                          ngo.has_fcra && 'FCRA',
                        ].filter(Boolean).join(' • ') || 'Verified Non-Profit'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    to={`/ngos/${ngo.slug || ngo.id}`}
                    className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container transition-colors text-center text-sm block"
                  >
                    View Public Profile & Audits
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalCount > 12 && (
          <div className="flex items-center justify-between pt-6 border-t border-outline-variant/40 text-xs">
            <span className="text-on-surface-variant font-medium">
              Showing page {page} of {Math.ceil(totalCount / 12)} ({totalCount} total verified NGOs)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={!hasPrev || page === 1 || loading}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl font-semibold disabled:opacity-40 hover:bg-surface-container-low"
              >
                Previous Page
              </button>
              <button
                disabled={!hasNext || loading}
                onClick={() => setPage(prev => prev + 1)}
                className="px-4 py-2 bg-primary text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-primary-container"
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
