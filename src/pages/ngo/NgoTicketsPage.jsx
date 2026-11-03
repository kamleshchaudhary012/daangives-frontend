import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NgoLayout from '../../layouts/NgoLayout';
import { listGrievanceTickets } from '../../services/api/grievances';
import StatusBadge from '../../components/grievances/StatusBadge';
import PriorityBadge from '../../components/grievances/PriorityBadge';
import CategoryLabel from '../../components/grievances/CategoryLabel';
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  CATEGORY_OPTIONS,
} from '../../constants/grievances';

export default function NgoTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, priorityFilter, categoryFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;

      const data = await listGrievanceTickets(params);
      setTickets(data.results || []);
      setTotalCount(data.count || 0);
      setHasNext(!!data.next);
      setHasPrevious(!!data.previous);
    } catch (err) {
      setError(err.message || 'Failed to load tickets.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setPage(1);
  };

  const hasActiveFilters = statusFilter || priorityFilter || categoryFilter;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <NgoLayout>
      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Support Tickets (NGO)</h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Track your submitted complaints, disputes, and support requests.
            </p>
          </div>
          <Link
            to="/ngo/tickets/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            New Ticket
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/50 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filters
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">All Priority</option>
              {PRIORITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs font-semibold text-error hover:bg-error/5 rounded-xl transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-surface-container-lowest p-12 rounded-3xl border border-outline-variant/60 text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-on-surface-variant font-medium">Loading tickets...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && tickets.length === 0 && (
          <div className="bg-surface-container-lowest p-12 rounded-3xl border border-outline-variant/60 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">inbox</span>
            <h3 className="text-base font-bold text-on-surface">
              {hasActiveFilters ? 'No tickets match your filters' : 'No tickets filed against your NGO yet.'}
            </h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your filters or clear them to see all tickets.'
                : 'You haven\'t submitted any grievance tickets yet. Click "New Ticket" to get started.'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Ticket list */}
        {!loading && tickets.length > 0 && (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/ngo/tickets/${ticket.id}`}
                className="block bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/50 hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-bold text-on-surface-variant/60">
                        {ticket.ticket_number}
                      </span>
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <h3 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                      {ticket.title}
                    </h3>
                    <CategoryLabel category={ticket.category} />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant shrink-0">
                    <span className="material-symbols-outlined text-xs">calendar_today</span>
                    {formatDate(ticket.created_at)}
                    <span className="material-symbols-outlined text-sm text-on-surface-variant/40 group-hover:text-primary transition-colors">
                      chevron_right
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-on-surface-variant font-medium">
                {totalCount} ticket{totalCount !== 1 ? 's' : ''} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!hasPrevious}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-outline-variant/50 text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-on-surface-variant">
                  Page {page}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasNext}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-outline-variant/50 text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NgoLayout>
  );
}
