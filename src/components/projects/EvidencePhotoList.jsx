import React, { useState } from 'react';
import { uploadProjectPhoto, deleteProjectPhoto } from '../../services/api/projects';

/**
 * EvidencePhotoList
 * Manages milestone execution and field progress evidence photos for a Village project.
 * Evidence uploads are eligible when project is in FUNDED, IN_PROGRESS, or COMPLETED status.
 */
export default function EvidencePhotoList({
  projectId,
  photos = [],
  projectStatus = 'DRAFT',
  isOwner = true,
  onPhotosUpdated,
}) {
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activePreviewPhoto, setActivePreviewPhoto] = useState(null);

  const isEligible = ['FUNDED', 'IN_PROGRESS', 'COMPLETED'].includes(projectStatus);
  const canUpload = isOwner && isEligible;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate size (max 5MB)
    if (selected.size > 5 * 1024 * 1024) {
      setError('File size must not exceed 5MB.');
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate file type
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      setError('Invalid file format. Only JPG, PNG, and WebP images are allowed.');
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setError(null);
    setFile(selected);
    const objectUrl = URL.createObjectURL(selected);
    setPreviewUrl(objectUrl);
  };

  const closeModal = () => {
    setShowModal(false);
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCaption('');
    setError(null);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      if (caption.trim()) {
        formData.append('caption', caption.trim().slice(0, 200));
      }

      await uploadProjectPhoto(projectId, formData);
      closeModal();
      if (onPhotosUpdated) onPhotosUpdated();
    } catch (err) {
      setError(err.message || 'Failed to upload evidence photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Are you sure you want to remove this evidence photo?')) {
      return;
    }

    try {
      setDeletingId(photoId);
      await deleteProjectPhoto(projectId, photoId);
      if (onPhotosUpdated) onPhotosUpdated();
    } catch (err) {
      alert(err.message || 'Failed to delete photo.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">
              photo_library
            </span>
            Milestone Evidence & Field Execution Photos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual verification and on-site progress photos for CSR milestone reviews and community auditing.
          </p>
        </div>

        {canUpload && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            data-testid="upload-evidence-photo-btn"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-all self-start sm:self-auto shrink-0"
          >
            <span className="material-symbols-outlined text-base">add_a_photo</span>
            Upload Milestone Photo
          </button>
        )}
      </div>

      {/* Info notice if project is not funded yet */}
      {!isEligible && (
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-slate-400 shrink-0">info</span>
          <span>
            Milestone evidence photo uploads become active once this project is funded and under field execution (status: <strong>Funded</strong> or <strong>In Progress</strong>).
          </span>
        </div>
      )}

      {/* Photos Grid or Empty State */}
      {photos.length === 0 ? (
        <div className="py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No milestone execution photos yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            {canUpload
              ? 'Attach site photos, civil foundation work, equipment deliveries, or Gram Sabha handover images as evidence.'
              : 'Uploaded site photos and milestone evidence will appear here.'}
          </p>
          {canUpload && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">upload</span>
              Add First Photo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="evidence-photos-grid">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all hover:shadow-md"
            >
              <div className="relative aspect-video w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <img
                  src={photo.file}
                  alt={photo.caption || 'Milestone Evidence'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => setActivePreviewPhoto(photo)}
                  className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  title="View Full Image"
                >
                  <span className="material-symbols-outlined text-3xl drop-shadow">zoom_in</span>
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                    {photo.caption || <span className="italic text-slate-400">No caption provided</span>}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">calendar_today</span>
                    {photo.uploaded_at
                      ? new Date(photo.uploaded_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Recently'}
                  </span>

                  {isOwner && (
                    <button
                      type="button"
                      disabled={deletingId === photo.id}
                      onClick={() => handleDelete(photo.id)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                      title="Delete Photo"
                    >
                      <span className="material-symbols-outlined text-base">
                        {deletingId === photo.id ? 'progress_activity' : 'delete'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 sm:p-8 shadow-xl relative animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">add_photo_alternate</span>
                Upload Milestone Evidence Photo
              </h4>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-5 space-y-4">
              {error && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* File Input & Preview */}
              <div>
                <label htmlFor="evidence-file-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Photo File (JPG, PNG, WebP — Max 5MB)
                </label>
                <input
                  id="evidence-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {previewUrl && (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Caption Input */}
              <div>
                <label htmlFor="evidence-caption-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Milestone Caption / Activity Description
                </label>
                <textarea
                  id="evidence-caption-input"
                  rows={3}
                  value={caption}
                  maxLength={200}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Borewell drilling completed at North site with village committee oversight"
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="text-[10px] text-slate-400 text-right mt-1">
                  {caption.length}/200 characters
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isUploading}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!file || isUploading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">upload</span>
                      Upload Photo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Preview Modal */}
      {activePreviewPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setActivePreviewPhoto(null)}
        >
          <div
            className="max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              <img
                src={activePreviewPhoto.file}
                alt={activePreviewPhoto.caption || 'Evidence'}
                className="max-w-full max-h-[70vh] object-contain"
              />
              <button
                type="button"
                onClick={() => setActivePreviewPhoto(null)}
                className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            {activePreviewPhoto.caption && (
              <div className="p-4 bg-slate-900 text-white text-xs leading-relaxed border-t border-slate-800">
                {activePreviewPhoto.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
