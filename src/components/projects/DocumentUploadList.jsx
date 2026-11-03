import React, { useState } from 'react';
import {
  PROJECT_DOCUMENT_TYPE_OPTIONS,
  PROJECT_DOCUMENT_TYPE_LABELS,
} from '../../constants/projects';
import { uploadProjectDocument, deleteProjectDocument } from '../../services/api/projects';

/**
 * DocumentUploadList
 * Manages statutory & technical documents attached to a Village development project.
 */
export default function DocumentUploadList({
  projectId,
  documents = [],
  isEditable = true,
  onDocumentsUpdated,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docType, setDocType] = useState('PANCHAYAT_RESOLUTION');
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // 5MB limit
    if (selected.size > 5 * 1024 * 1024) {
      setError('File size must not exceed 5MB.');
      setFile(null);
      return;
    }

    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      setError('Invalid file format. Only PDF, JPG, and PNG are supported.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('document_type', docType);
      formData.append('file', file);
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      await uploadProjectDocument(projectId, formData);
      setShowUploadModal(false);
      setFile(null);
      setNotes('');
      if (onDocumentsUpdated) onDocumentsUpdated();
    } catch (err) {
      setError(err.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to remove this document?')) return;
    try {
      setDeletingId(docId);
      await deleteProjectDocument(projectId, docId);
      if (onDocumentsUpdated) onDocumentsUpdated();
    } catch (err) {
      alert(err.message || 'Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">
              verified_user
            </span>
            Statutory & Verification Documents
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Attach Gram Panchayat resolutions, land NOCs, BOQ estimates, and NGO certificates.
          </p>
        </div>

        {isEditable && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setShowUploadModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-200 dark:border-emerald-800/60 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            Upload Document
          </button>
        )}
      </div>

      {/* Warning if no docs */}
      {documents.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3 my-3">
          <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">
            warning
          </span>
          <div>
            <span className="font-semibold block">Document requirement:</span>
            At least one statutory verification document (e.g. Gram Panchayat resolution or BOQ cost estimate) must be attached before submitting the project for CSR verification.
          </div>
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {documents.map((doc) => {
            const label =
              PROJECT_DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type;
            const uploadDate = doc.uploaded_at
              ? new Date(doc.uploaded_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '';

            return (
              <div
                key={doc.id}
                className="py-3.5 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
                    <span className="material-symbols-outlined text-lg">
                      description
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {label}
                      </span>
                      {uploadDate && (
                        <span className="text-[11px] text-slate-400">
                          • {uploadDate}
                        </span>
                      )}
                    </div>
                    {doc.file_name && (
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate mt-0.5 font-mono">
                        {doc.file_name}
                      </p>
                    )}
                    {doc.notes && (
                      <p className="text-slate-600 dark:text-slate-300 text-xs mt-1 italic">
                        "{doc.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        open_in_new
                      </span>
                      View
                    </a>
                  )}

                  {isEditable && (
                    <button
                      type="button"
                      disabled={deletingId === doc.id}
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete document"
                    >
                      <span className="material-symbols-outlined text-base">
                        delete
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          No verification documents attached yet.
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">
                  upload_file
                </span>
                Upload Verification Document
              </h4>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Document Type *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  {PROJECT_DOCUMENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select File (PDF, JPG, PNG &le; 5MB) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-950/60 dark:file:text-emerald-300 cursor-pointer border border-slate-300 dark:border-slate-700 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-800/50"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Gram Sabha resolution signed on 15 Aug 2026..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !file}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow transition-all disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">
                        progress_activity
                      </span>
                      Uploading...
                    </>
                  ) : (
                    'Upload & Attach'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
