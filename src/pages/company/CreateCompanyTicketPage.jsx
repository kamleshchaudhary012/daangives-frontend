import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CompanyLayout from '../../layouts/CompanyLayout';
import { createGrievanceTicket } from '../../services/api/grievances';
import {
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
} from '../../constants/grievances';

export default function CreateCompanyTicketPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      const allowedExt = ['pdf', 'jpg', 'jpeg', 'png'];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (file.size > maxSize) {
        setError('Attachment file size cannot exceed 5 MB.');
        setAttachment(null);
        return;
      }
      if (!allowedExt.includes(ext)) {
        setError('Invalid file type. Allowed: PDF, JPG, JPEG, PNG.');
        setAttachment(null);
        return;
      }
      setError('');
    }
    setAttachment(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side validation
    if (!title.trim() || title.trim().length < 5) {
      setFieldErrors({ title: 'Title must be at least 5 characters.' });
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setFieldErrors({ description: 'Description must be at least 10 characters.' });
      return;
    }
    if (!category) {
      setFieldErrors({ category: 'Please select a category.' });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('priority', priority);
      if (attachment) {
        formData.append('attachment', attachment);
      }

      const ticket = await createGrievanceTicket(formData);
      navigate(`/company/tickets/${ticket.id}`, { state: { justCreated: true } });
    } catch (err) {
      setError(err.message || 'Failed to submit ticket. Please try again.');
      if (err.data && typeof err.data === 'object') {
        const fe = {};
        for (const [key, val] of Object.entries(err.data)) {
          if (key !== 'detail' && key !== 'code') {
            fe[key] = Array.isArray(val) ? val.join(' ') : val;
          }
        }
        if (Object.keys(fe).length > 0) setFieldErrors(fe);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CompanyLayout>
      <div className="max-w-3xl space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/company/tickets" className="hover:text-blue-600 transition-colors font-semibold">
            Support Tickets
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="font-bold text-slate-800">New Ticket</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Submit a Support Ticket</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Report non-compliance, payment issues, or general inquiries to platform investigators.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="ticket-title" className="block text-xs font-bold text-slate-700 mb-1.5">
              Ticket Title <span className="text-red-500">*</span>
            </label>
            <input
              id="ticket-title"
              type="text"
              maxLength={200}
              placeholder="Brief summary of your issue..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors ${
                fieldErrors.title ? 'border-red-400' : 'border-slate-200'
              }`}
            />
            {fieldErrors.title && (
              <p className="text-[11px] text-red-500 mt-1 font-bold">{fieldErrors.title}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Min 5 characters, max 200</p>
          </div>

          {/* Category & Priority row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ticket-category" className="block text-xs font-bold text-slate-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="ticket-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500 transition-colors ${
                  fieldErrors.category ? 'border-red-400' : 'border-slate-200'
                }`}
              >
                <option value="">Select category...</option>
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {fieldErrors.category && (
                <p className="text-[11px] text-red-500 mt-1 font-bold">{fieldErrors.category}</p>
              )}
            </div>

            <div>
              <label htmlFor="ticket-priority" className="block text-xs font-bold text-slate-700 mb-1.5">
                Priority
              </label>
              <select
                id="ticket-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="ticket-description" className="block text-xs font-bold text-slate-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="ticket-description"
              rows={6}
              placeholder="Describe your issue in detail. Include dates, transaction IDs, campaign names, or any other relevant information..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none ${
                fieldErrors.description ? 'border-red-400' : 'border-slate-200'
              }`}
            />
            {fieldErrors.description && (
              <p className="text-[11px] text-red-500 mt-1 font-bold">{fieldErrors.description}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Min 10 characters</p>
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Supporting Document
            </label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="ticket-attachment"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-sm">attach_file</span>
                {attachment ? 'Change File' : 'Choose File'}
              </label>
              <input
                id="ticket-attachment"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              {attachment && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-700 font-bold truncate max-w-[200px]">
                    {attachment.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
              Allowed: PDF, JPG, PNG. Max 5 MB.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Link
              to="/company/tickets"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all shadow-sm"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-sm">send</span>
              )}
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </CompanyLayout>
  );
}
