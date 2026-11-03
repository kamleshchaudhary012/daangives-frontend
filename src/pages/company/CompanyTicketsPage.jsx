import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CompanyLayout from '../../layouts/CompanyLayout';
import { listGrievanceTickets } from '../../services/api/grievances';
import StatusBadge from '../../components/grievances/StatusBadge';
import PriorityBadge from '../../components/grievances/PriorityBadge';
import CategoryLabel from '../../components/grievances/CategoryLabel';
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  CATEGORY_OPTIONS,
} from '../../constants/grievances';

export default function CompanyTicketsPage() {
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
    <CompanyLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Support Tickets (CSR)</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Track your submitted complaints, disputes, and support requests.
            </p>
          </div>
          <Link
            to="/company/tickets/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            New Ticket
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filters
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
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
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
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
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
            <div className="w-8 h-8 mx-auto border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading tickets...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && tickets.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
            <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
            <h3 className="text-base font-bold text-slate-900">
              {hasActiveFilters ? 'No tickets match your filters' : 'No tickets filed against your company yet.'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
              {hasActiveFilters
                ? 'Try adjusting your filters or clear them to see all tickets.'
                : 'You haven\'t submitted any grievance tickets yet. Click "New Ticket" to get started.'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Ticket list */}
        {!loading && tickets.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="px-5 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ticket</th>
                    <th className="px-5 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Title</th>
                    <th className="px-5 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Category</th>
                    <th className="px-5 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Priority</th>
                    <th className="px-5 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</th>
                    <th className="px-5 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date</th>
                    <th className="px-5 py-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          {ticket.ticket_number}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-bold text-slate-800 truncate block max-w-[200px]">
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
                      <td className="px-5 py-3.5 text-[11px] text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/company/tickets/${ticket.id}`}
                          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Fallback View */}
            <div className="md:hidden divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/company/tickets/${ticket.id}`}
                  className="block p-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        {ticket.ticket_number}
                      </span>
                      <span className="text-[10px] text-slate-500">{formatDate(ticket.created_at)}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{ticket.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                      <CategoryLabel category={ticket.category} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
                {totalCount} ticket{totalCount !== 1 ? 's' : ''} total
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!hasPrevious}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-slate-500">Page {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasNext}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
