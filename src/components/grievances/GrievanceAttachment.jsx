import React, { useState } from 'react';
import { fetchGrievanceAttachment, resolveAttachmentUrl } from '../../services/api/grievances';

/**
 * Clean, accessible attachment display component for grievance tickets and replies.
 * - Displays filename and file type badge.
 * - Clear "View Attachment" action opening authenticated document stream.
 * - Clear unavailable state when attachment is missing (no misleading active link).
 *
 * @param {{
 *   attachment: string,
 *   attachmentName?: string,
 *   attachmentAvailable?: boolean,
 *   isCompact?: boolean,
 *   className?: string
 * }} props
 */
export default function GrievanceAttachment({
  attachment,
  attachmentName,
  attachmentAvailable = true,
  isCompact = false,
  className = '',
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!attachment) return null;

  // Extract clean filename from prop or URL
  const deriveFilename = () => {
    if (attachmentName) return attachmentName;
    try {
      const parts = attachment.split('/');
      const last = parts[parts.length - 1];
      if (last && !last.includes('attachment')) {
        return decodeURIComponent(last);
      }
    } catch (e) {
      // ignore
    }
    return 'Supporting_Document.pdf';
  };

  const filename = deriveFilename();
  const fileExt = filename.includes('.') ? filename.split('.').pop().toUpperCase() : 'FILE';

  // Handle missing attachment state: render distinct warning without active clickable link
  if (attachmentAvailable === false) {
    return (
      <div
        role="alert"
        className={`flex items-center gap-2.5 p-3 rounded-xl border border-amber-200/80 bg-amber-50/70 text-amber-900 text-xs ${className}`}
      >
        <span className="material-symbols-outlined text-base text-amber-600 shrink-0">
          warning
        </span>
        <div className="min-w-0 flex-1">
          <span className="font-bold block">Attachment unavailable</span>
          <span className="text-[11px] text-amber-700 font-mono truncate block">
            {filename}
          </span>
          <span className="text-[10px] text-amber-600/80 mt-0.5 block">
            The stored document could not be located on the server.
          </span>
        </div>
      </div>
    );
  }

  const handleOpen = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      await fetchGrievanceAttachment(attachment, filename, false);
    } catch (err) {
      setError(err.message || 'Unable to open attachment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      await fetchGrievanceAttachment(attachment, filename, true);
    } catch (err) {
      setError(err.message || 'Unable to download attachment.');
    } finally {
      setLoading(false);
    }
  };

  const fullUrl = resolveAttachmentUrl(attachment);

  if (isCompact) {
    return (
      <div className={`mt-2 ${className}`}>
        <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <span className="material-symbols-outlined text-sm text-slate-500">attach_file</span>
          <span className="font-mono text-[11px] text-slate-700 max-w-[200px] truncate" title={filename}>
            {filename}
          </span>
          <span className="px-1 py-0.2 text-[9px] font-bold uppercase rounded bg-slate-200 text-slate-600">
            {fileExt}
          </span>
          <button
            type="button"
            onClick={handleOpen}
            disabled={loading}
            className="text-primary hover:underline font-bold text-[11px] flex items-center gap-1 disabled:opacity-50"
          >
            {loading ? 'Opening...' : 'View'}
          </button>
        </div>
        {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
            <span className="material-symbols-outlined text-base">
              {fileExt === 'PDF' ? 'picture_as_pdf' : 'description'}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 truncate max-w-xs" title={filename}>
                {filename}
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-extrabold tracking-wide uppercase rounded bg-slate-200 text-slate-700">
                {fileExt}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              Verified supporting document
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpen}
            disabled={loading}
            aria-label={`View attachment ${filename}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">
              {loading ? 'hourglass_top' : 'visibility'}
            </span>
            {loading ? 'Opening...' : 'View Attachment'}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            aria-label={`Download attachment ${filename}`}
            title="Download file"
            className="p-1.5 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
