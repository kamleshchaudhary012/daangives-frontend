import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getGrievanceTicketDetail,
  createTicketResponse,
  transitionTicketStatus,
  assignTicket,
} from '../../services/api/grievances';
import StatusBadge from '../../components/grievances/StatusBadge';
import PriorityBadge from '../../components/grievances/PriorityBadge';
import CategoryLabel from '../../components/grievances/CategoryLabel';
import GrievanceAttachment from '../../components/grievances/GrievanceAttachment';
import {
  GRIEVANCE_STATUS_LABELS,
  GRIEVANCE_STATUS,
} from '../../constants/grievances';

// Valid status transitions the admin can perform
const ADMIN_TRANSITIONS = {
  OPEN: [
    { value: 'IN_REVIEW', label: 'Move to In Review', icon: 'pending', color: 'bg-amber-600' },
    { value: 'REJECTED', label: 'Reject', icon: 'cancel', color: 'bg-red-600' },
  ],
  IN_REVIEW: [
    { value: 'RESOLVED', label: 'Mark Resolved', icon: 'check_circle', color: 'bg-emerald-600' },
    { value: 'CLOSED', label: 'Close', icon: 'lock', color: 'bg-slate-600' },
    { value: 'REJECTED', label: 'Reject', icon: 'cancel', color: 'bg-red-600' },
  ],
  RESOLVED: [
    { value: 'CLOSED', label: 'Close', icon: 'lock', color: 'bg-slate-600' },
  ],
  CLOSED: [],
  REJECTED: [],
};

export default function AdminTicketDetailPage() {
  const { id } = useParams();
  const messagesEndRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Response form
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [replySuccess, setReplySuccess] = useState('');

  // Transition
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [showResolutionInput, setShowResolutionInput] = useState(false);
  const [pendingTransition, setPendingTransition] = useState('');

  // Assignment
  const [assignUserId, setAssignUserId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Action success
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.responses]);

  const fetchTicket = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getGrievanceTicketDetail(id);
      setTicket(data);
    } catch (err) {
      setError(err.message || 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Status Transition ────────────────────────────────

  const handleTransition = async (newStatus) => {
    if (['RESOLVED', 'CLOSED'].includes(newStatus)) {
      setPendingTransition(newStatus);
      setShowResolutionInput(true);
      return;
    }
    await executeTransition(newStatus, '');
  };

  const executeTransition = async (newStatus, summary) => {
    setTransitioning(true);
    setTransitionError('');
    try {
      const updated = await transitionTicketStatus(id, newStatus, summary);
      setTicket(updated);
      setActionSuccess(`Ticket status updated to ${GRIEVANCE_STATUS_LABELS[newStatus]}.`);
      setShowResolutionInput(false);
      setResolutionSummary('');
      setPendingTransition('');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setTransitionError(err.message || 'Failed to transition status.');
    } finally {
      setTransitioning(false);
    }
  };

  // ─── Assignment ────────────────────────────────────────

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignUserId.trim()) return;

    setAssigning(true);
    setAssignError('');
    try {
      const updated = await assignTicket(id, assignUserId.trim());
      setTicket(updated);
      setAssignUserId('');
      setActionSuccess('Investigator assigned successfully.');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setAssignError(err.message || 'Failed to assign investigator.');
    } finally {
      setAssigning(false);
    }
  };

  // ─── Reply ─────────────────────────────────────────────

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setReplying(true);
    setReplyError('');
    setReplySuccess('');

    try {
      const formData = new FormData();
      formData.append('message', replyMessage.trim());
      formData.append('is_internal_note', isInternalNote);
      if (replyAttachment) {
        formData.append('attachment', replyAttachment);
      }

      await createTicketResponse(id, formData);
      setReplyMessage('');
      setReplyAttachment(null);
      setIsInternalNote(false);
      setReplySuccess('Reply sent.');
      await fetchTicket();
      setTimeout(() => setReplySuccess(''), 3000);
    } catch (err) {
      setReplyError(err.message || 'Failed to send reply.');
    } finally {
      setReplying(false);
    }
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setReplyError('File size cannot exceed 5 MB.');
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
        setReplyError('Allowed: PDF, JPG, PNG.');
        return;
      }
      setReplyError('');
    }
    setReplyAttachment(file);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isTerminal = ticket && ['CLOSED', 'REJECTED'].includes(ticket.status);
  const availableTransitions = ticket ? (ADMIN_TRANSITIONS[ticket.status] || []) : [];

  // ─── Render ────────────────────────────────────────────

  if (loading) {
    return (
      <AdminLayout>
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-8 h-8 mx-auto border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading ticket...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !ticket) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Link to="/admin/complaints" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Complaints Center
          </Link>
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            {error || 'Ticket not found.'}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/admin/complaints" className="hover:text-blue-600 transition-colors font-semibold">
            Complaints Center
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="font-bold text-slate-800 font-mono">{ticket.ticket_number}</span>
        </div>

        {/* Action Success */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {actionSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content — Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Info Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold text-slate-400">{ticket.ticket_number}</span>
                    <StatusBadge status={ticket.status} size="md" />
                    <PriorityBadge priority={ticket.priority} size="md" />
                  </div>
                  <h1 className="text-xl font-bold text-slate-900">{ticket.title}</h1>
                  <CategoryLabel category={ticket.category} />
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  <span className="font-bold text-slate-700">Submitted by:</span>{' '}
                  {ticket.user?.email || ticket.user?.first_name || 'Unknown'}
                </div>
                <div className="text-xs text-slate-500">
                  <span className="font-bold text-slate-700">Date:</span> {formatDate(ticket.created_at)}
                </div>
                {ticket.assigned_to && (
                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-slate-700">Assigned to:</span>{' '}
                    {ticket.assigned_to.email || 'Staff'}
                  </div>
                )}
                {ticket.resolved_at && (
                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-slate-700">Resolved:</span> {formatDate(ticket.resolved_at)}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 mb-2">Description</h3>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {/* Attachment */}
              {ticket.attachment && (
                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-700 mb-2">Attachment</h3>
                  <GrievanceAttachment
                    attachment={ticket.attachment}
                    attachmentName={ticket.attachment_name}
                    attachmentAvailable={ticket.attachment_available}
                  />
                </div>
              )}

              {/* Resolution */}
              {ticket.resolution_summary && (
                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-emerald-600">task_alt</span>
                    Resolution Summary
                  </h3>
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200/50 rounded-xl">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{ticket.resolution_summary}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Response Thread */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">forum</span>
                  Investigation Thread
                  {ticket.responses && (
                    <span className="text-[11px] font-medium text-slate-500">
                      ({ticket.responses.length})
                    </span>
                  )}
                </h2>
              </div>

              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                {(!ticket.responses || ticket.responses.length === 0) && (
                  <div className="text-center py-8 space-y-2">
                    <span className="material-symbols-outlined text-3xl text-slate-300">chat_bubble_outline</span>
                    <p className="text-xs text-slate-500 font-medium">No messages in this thread yet.</p>
                  </div>
                )}

                {ticket.responses?.map((resp) => {
                  const isInternal = resp.is_internal_note;
                  const isUser = ticket.user?.id === resp.author ||
                    (typeof ticket.user === 'object' && ticket.user?.id === resp.author);

                  return (
                    <div key={resp.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl space-y-2 ${
                          isInternal
                            ? 'bg-yellow-50 border border-yellow-200 rounded-br-sm'
                            : isUser
                              ? 'bg-slate-50 border border-slate-200 rounded-bl-sm'
                              : 'bg-blue-50 border border-blue-200 rounded-br-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[11px] font-bold ${
                              isInternal ? 'text-yellow-700' : isUser ? 'text-slate-600' : 'text-blue-700'
                            }`}>
                              {isUser ? (ticket.user?.email || 'User') : 'Admin'}
                            </span>
                            {isInternal && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-bold rounded-full border border-yellow-200">
                                <span className="material-symbols-outlined text-[10px]">visibility_off</span>
                                Internal
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{formatDate(resp.created_at)}</span>
                        </div>
                        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{resp.message}</p>
                        {resp.attachment && (
                          <GrievanceAttachment
                            attachment={resp.attachment}
                            attachmentName={resp.attachment_name}
                            attachmentAvailable={resp.attachment_available}
                            isCompact={true}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              {!isTerminal && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                  {replySuccess && (
                    <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      {replySuccess}
                    </div>
                  )}
                  {replyError && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {replyError}
                    </div>
                  )}
                  <form onSubmit={handleReplySubmit} className="space-y-3">
                    <textarea
                      rows={3}
                      placeholder="Type your response..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Internal note toggle */}
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInternalNote}
                            onChange={(e) => setIsInternalNote(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-yellow-600 focus:ring-yellow-500"
                          />
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">visibility_off</span>
                            Internal Note
                          </span>
                        </label>

                        {/* Attachment */}
                        <label
                          htmlFor="admin-reply-attachment"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-500 hover:text-blue-600 cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">attach_file</span>
                          {replyAttachment ? replyAttachment.name : 'Attach'}
                        </label>
                        <input
                          id="admin-reply-attachment"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleAttachmentChange}
                          className="hidden"
                        />
                        {replyAttachment && (
                          <button type="button" onClick={() => setReplyAttachment(null)} className="text-red-500 hover:text-red-700">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={replying || !replyMessage.trim()}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        {replying ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-sm">send</span>
                        )}
                        {replying ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar — Right */}
          <div className="space-y-5">
            {/* Status Transitions */}
            {availableTransitions.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  Status Actions
                </h3>

                {transitionError && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[11px] font-bold">
                    {transitionError}
                  </div>
                )}

                {/* Resolution Summary Input (shown for RESOLVED/CLOSED) */}
                {showResolutionInput && (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      placeholder="Resolution summary (optional)..."
                      value={resolutionSummary}
                      onChange={(e) => setResolutionSummary(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => executeTransition(pendingTransition, resolutionSummary)}
                        disabled={transitioning}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                      >
                        {transitioning ? 'Updating...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => { setShowResolutionInput(false); setPendingTransition(''); setResolutionSummary(''); }}
                        className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {!showResolutionInput && availableTransitions.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => handleTransition(t.value)}
                    disabled={transitioning}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 ${t.color} text-white text-xs font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all`}
                  >
                    <span className="material-symbols-outlined text-sm">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Assign Investigator */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">person_add</span>
                Assign Investigator
              </h3>
              {ticket.assigned_to && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    {ticket.assigned_to.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <span className="text-xs font-bold text-blue-800 truncate">{ticket.assigned_to.email}</span>
                </div>
              )}
              {assignError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[11px] font-bold">
                  {assignError}
                </div>
              )}
              <form onSubmit={handleAssign} className="flex gap-2">
                <input
                  type="text"
                  placeholder="User ID"
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
                />
                <button
                  type="submit"
                  disabled={assigning || !assignUserId.trim()}
                  className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all"
                >
                  {assigning ? '...' : 'Assign'}
                </button>
              </form>
            </div>

            {/* Ticket Info Summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">info</span>
                Ticket Details
              </h3>
              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</p>
                  <div className="mt-1"><StatusBadge status={ticket.status} /></div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Priority</p>
                  <div className="mt-1"><PriorityBadge priority={ticket.priority} /></div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Category</p>
                  <div className="mt-1"><CategoryLabel category={ticket.category} /></div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Submitted</p>
                  <p className="text-xs font-medium text-slate-700 mt-0.5">{formatDate(ticket.created_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Last Updated</p>
                  <p className="text-xs font-medium text-slate-700 mt-0.5">{formatDate(ticket.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
