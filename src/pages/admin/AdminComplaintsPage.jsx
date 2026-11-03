import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { listGrievanceTickets } from '../../services/api/grievances';
import StatusBadge from '../../components/grievances/StatusBadge';
import PriorityBadge from '../../components/grievances/PriorityBadge';
import CategoryLabel from '../../components/grievances/CategoryLabel';
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  CATEGORY_OPTIONS,
  GRIEVANCE_STATUS,
} from '../../constants/grievances';

export default function AdminComplaintsPage() {
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

  // Compute summary stats (client-side from current page)
  const openCount = tickets.filter(t => t.status === GRIEVANCE_STATUS.OPEN).length;
  const reviewCount = tickets.filter(t => t.status === GRIEVANCE_STATUS.IN_REVIEW).length;
  const urgentCount = tickets.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Support & Grievances Center</h1>
          <p className="text-xs text-on-surface-variant mt-1 font-medium">
            Investigate donor inquiries, NGO reporting questions, and platform grievances.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-outline tracking-wider">Total Tickets</p>
                <p className="text-2xl font-bold text-on-surface mt-1">{totalCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-fixed/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-primary">confirmation_number</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-outline tracking-wider">Open</p>
                <p className="text-2xl font-bold text-primary mt-1">{openCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-fixed/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-primary">radio_button_unchecked</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-outline tracking-wider">In Review</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{reviewCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-amber-600">pending</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-outline tracking-wider">High/Urgent</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{urgentCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-red-600">priority_high</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filters
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              id="admin-status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              id="admin-priority-filter"
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">All Priority</option>
              {PRIORITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              id="admin-category-filter"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs font-semibold text-error hover:bg-error-container/20 rounded-xl transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-error-container/20 border border-error/20 rounded-2xl text-error text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-surface-container-lowest p-12 rounded-3xl border border-outline-variant/60 text-center space-y-3 shadow-xs">
            <div className="w-8 h-8 mx-auto border-3 border-primary-fixed border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-on-surface-variant font-medium">Loading tickets...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && tickets.length === 0 && (
          <div className="bg-surface-container-lowest p-12 rounded-3xl border border-outline-variant/60 text-center space-y-3 shadow-xs">
            <span className="material-symbols-outlined text-4xl text-outline-variant">inbox</span>
            <h2 className="text-lg font-bold text-on-surface">
              {hasActiveFilters ? 'No tickets match filters' : 'No Active Grievance Tickets'}
            </h2>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto font-medium">
              {hasActiveFilters
                ? 'Adjust your filters to see more results.'
                : 'No grievance tickets have been submitted yet. They will appear here when donors or users file inquiries.'
              }
            </p>
          </div>
        )}

        {/* Ticket Table */}
        {!loading && tickets.length > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/60">
                    <th className="px-5 py-3 text-[10px] uppercase font-bold text-outline tracking-wider">Ticket</th>
                    <th className="px-5 py-3 text-[10px] uppercase font-bold text-outline tracking-wider">Title</th>
                    <th className="px-5 py-3 text-[10px] uppercase font-bold text-outline tracking-wider">Category</th>
                    <th className="px-5 py-3 text-[10px] uppercase font-bold text-outline tracking-wider">Priority</th>
                    <th className="px-5 py-3 text-[10px] uppercase font-bold text-outline tracking-wider">Status</th>
                    <th className="px-5 py-3 text-[10px] uppercase font-bold text-outline tracking-wider">Date</th>
                    <th className="px-5 py-3 text-[10px] uppercase font-bold text-outline tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-mono font-bold text-outline">
                          {ticket.ticket_number}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-bold text-on-surface truncate block max-w-[250px]">
                          {ticket.title}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <CategoryLabel category={ticket.category} />
                      </td>
                      <td className="px-5 py-3.5">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-5 py-3.5 text-[11px] text-on-surface-variant font-medium whitespace-nowrap">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/admin/complaints/${ticket.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-primary-fixed/30 rounded-lg transition-colors"
                        >
                          Investigate
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-outline-variant/60 flex items-center justify-between">
              <p className="text-xs text-on-surface-variant font-medium">
                {totalCount} ticket{totalCount !== 1 ? 's' : ''} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!hasPrevious}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-outline-variant/60 text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-on-surface-variant">Page {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasNext}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-outline-variant/60 text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
