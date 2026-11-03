import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import DonorLayout from '../../layouts/DonorLayout';
import {
  getGrievanceTicketDetail,
  createTicketResponse,
} from '../../services/api/grievances';
import StatusBadge from '../../components/grievances/StatusBadge';
import PriorityBadge from '../../components/grievances/PriorityBadge';
import CategoryLabel from '../../components/grievances/CategoryLabel';
import GrievanceAttachment from '../../components/grievances/GrievanceAttachment';
import {
  GRIEVANCE_STATUS_LABELS,
  GRIEVANCE_CATEGORY_LABELS,
} from '../../constants/grievances';

export default function TicketDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Response form
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [replySuccess, setReplySuccess] = useState('');

  // Just-created banner
  const [showCreatedBanner, setShowCreatedBanner] = useState(
    location.state?.justCreated === true
  );

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
      setError(err.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setReplying(true);
    setReplyError('');
    setReplySuccess('');

    try {
      const formData = new FormData();
      formData.append('message', replyMessage.trim());
      if (replyAttachment) {
        formData.append('attachment', replyAttachment);
      }

      await createTicketResponse(id, formData);
      setReplyMessage('');
      setReplyAttachment(null);
      setReplySuccess('Reply sent successfully.');
      await fetchTicket(); // Refresh to show new message
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

  const isTerminal = ticket && ['RESOLVED', 'CLOSED', 'REJECTED'].includes(ticket.status);

  if (loading) {
    return (
      <DonorLayout>
        <div className="max-w-4xl">
          <div className="bg-surface-container-lowest p-12 rounded-3xl border border-outline-variant/60 text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-on-surface-variant font-medium">Loading ticket...</p>
          </div>
        </div>
      </DonorLayout>
    );
  }

  if (error || !ticket) {
    return (
      <DonorLayout>
        <div className="max-w-4xl space-y-4">
          <Link to="/donor/tickets" className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Tickets
          </Link>
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            {error || 'Ticket not found.'}
          </div>
        </div>
      </DonorLayout>
    );
  }

  return (
    <DonorLayout>
      <div className="max-w-4xl space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <Link to="/donor/tickets" className="hover:text-primary transition-colors font-semibold">
            My Tickets
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="font-bold text-on-surface font-mono">{ticket.ticket_number}</span>
        </div>

        {/* Created Banner */}
        {showCreatedBanner && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Ticket submitted successfully! A platform investigator will review your grievance shortly.
            </div>
            <button onClick={() => setShowCreatedBanner(false)} className="text-emerald-500 hover:text-emerald-700">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Ticket Header Card */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold text-on-surface-variant/60">
                  {ticket.ticket_number}
                </span>
                <StatusBadge status={ticket.status} size="md" />
                <PriorityBadge priority={ticket.priority} size="md" />
              </div>
              <h1 className="text-xl font-bold text-on-surface">{ticket.title}</h1>
              <CategoryLabel category={ticket.category} />
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 pt-3 border-t border-outline-variant/30">
            <div className="text-xs text-on-surface-variant">
              <span className="font-bold text-on-surface">Submitted:</span> {formatDate(ticket.created_at)}
            </div>
            {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
              <div className="text-xs text-on-surface-variant">
                <span className="font-bold text-on-surface">Updated:</span> {formatDate(ticket.updated_at)}
              </div>
            )}
            {ticket.resolved_at && (
              <div className="text-xs text-on-surface-variant">
                <span className="font-bold text-on-surface">Resolved:</span> {formatDate(ticket.resolved_at)}
              </div>
            )}
            {ticket.assigned_to && (
              <div className="text-xs text-on-surface-variant">
                <span className="font-bold text-on-surface">Investigator:</span>{' '}
                {ticket.assigned_to.email || 'Assigned'}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="pt-3 border-t border-outline-variant/30">
            <h3 className="text-xs font-bold text-on-surface mb-2">Description</h3>
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Attachment */}
          {ticket.attachment && (
            <div className="pt-3 border-t border-outline-variant/30">
              <h3 className="text-xs font-bold text-on-surface mb-2">Attachment</h3>
              <GrievanceAttachment
                attachment={ticket.attachment}
                attachmentName={ticket.attachment_name}
                attachmentAvailable={ticket.attachment_available}
              />
            </div>
          )}

          {/* Resolution Summary */}
          {ticket.resolution_summary && (
            <div className="pt-3 border-t border-outline-variant/30">
              <h3 className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-600">task_alt</span>
                Resolution Summary
              </h3>
              <div className="p-4 bg-emerald-50/50 border border-emerald-200/50 rounded-xl">
                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                  {ticket.resolution_summary}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Response Thread */}
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low/50">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-base">forum</span>
              Conversation Thread
              {ticket.responses && (
                <span className="text-[11px] font-medium text-on-surface-variant">
                  ({ticket.responses.length} message{ticket.responses.length !== 1 ? 's' : ''})
                </span>
              )}
            </h2>
          </div>

          <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
            {(!ticket.responses || ticket.responses.length === 0) && (
              <div className="text-center py-8 space-y-2">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">chat_bubble_outline</span>
                <p className="text-xs text-on-surface-variant font-medium">
                  No replies yet. A platform investigator will respond to your ticket soon.
                </p>
              </div>
            )}

            {ticket.responses?.map((resp) => {
              const isOwnMessage = ticket.user?.id === resp.author || 
                (typeof ticket.user === 'object' && ticket.user?.id === resp.author);
              
              return (
                <div
                  key={resp.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl space-y-2 ${
                      isOwnMessage
                        ? 'bg-primary/10 border border-primary/20 rounded-br-sm'
                        : 'bg-surface-container-low border border-outline-variant/40 rounded-bl-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-[11px] font-bold ${isOwnMessage ? 'text-primary' : 'text-on-surface'}`}>
                        {isOwnMessage ? 'You' : 'Platform Officer'}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        {formatDate(resp.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                      {resp.message}
                    </p>
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
          {!isTerminal ? (
            <div className="px-6 py-4 border-t border-outline-variant/40 bg-surface-container-low/30">
              {replySuccess && (
                <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {replySuccess}
                </div>
              )}
              {replyError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {replyError}
                </div>
              )}
              <form onSubmit={handleReplySubmit} className="space-y-3">
                <textarea
                  rows={3}
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors resize-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="reply-attachment"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">attach_file</span>
                      {replyAttachment ? replyAttachment.name : 'Attach'}
                    </label>
                    <input
                      id="reply-attachment"
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {replying ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-sm">send</span>
                    )}
                    {replying ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="px-6 py-4 border-t border-outline-variant/40 bg-surface-container-low/30 text-center">
              <p className="text-xs text-on-surface-variant font-medium flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-sm">lock</span>
                This ticket is <strong>{GRIEVANCE_STATUS_LABELS[ticket.status]?.toLowerCase()}</strong>. Replies are disabled.
              </p>
            </div>
          )}
        </div>
      </div>
    </DonorLayout>
  );
}
