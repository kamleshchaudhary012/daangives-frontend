import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import NgoLayout from '../../layouts/NgoLayout';
import Badge from '../../components/common/Badge';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import {
  getNgoProfile,
  getNgoCampaigns,
  createNgoCampaign,
  updateNgoCampaign,
  deleteNgoCampaign,
  submitNgoCampaignReview,
  getMediaUrl,
} from '../../services/api';
import useDebounce from '../../hooks/useDebounce';

const CATEGORIES = [
  { label: 'Education & Child Welfare', value: 'EDUCATION' },
  { label: 'Healthcare & Relief', value: 'HEALTHCARE' },
  { label: 'Environment & Animal Care', value: 'ENVIRONMENT' },
  { label: 'Women Empowerment', value: 'WOMEN_EMPOWERMENT' },
  { label: 'Disaster Relief', value: 'DISASTER_RELIEF' },
  { label: 'Livelihood & Skill Dev', value: 'LIVELIHOOD' },
  { label: 'Other Social Work', value: 'OTHER' },
];

export default function NgoNeedManagementPage() {
  const [ngoProfile, setNgoProfile] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 350);

  // In-flight cancellation and stale-response protection
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const lastExecutedQueryKeyRef = useRef(null);
  const ngoProfileRef = useRef(null);

  // Campaign Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const coverInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'EDUCATION',
    campaign_type: 'MONETARY',
    short_description: '',
    description: '',
    target_amount: '',
    cover_image: null,
    cover_preview: null,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: 'ACTIVE',
  });

  const fetchData = useCallback(async (searchOverride = null, forceRefresh = false) => {
    const rawSearch = typeof searchOverride === 'string' ? searchOverride : debouncedSearchTerm;
    const trimmedSearch = (typeof rawSearch === 'string' ? rawSearch : '').trim();

    const queryKey = JSON.stringify({
      status: statusFilter,
      search: trimmedSearch,
    });

    if (!forceRefresh && queryKey === lastExecutedQueryKeyRef.current) {
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
      let currentProfile = ngoProfileRef.current;
      if (!currentProfile) {
        currentProfile = await getNgoProfile();
        ngoProfileRef.current = currentProfile;
        setNgoProfile(currentProfile);
      }

      if (currentProfile && currentProfile.status === 'APPROVED') {
        const cRes = await getNgoCampaigns(
          { status: statusFilter, search: trimmedSearch },
          { signal: controller.signal }
        );

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        const list = cRes.results || (Array.isArray(cRes) ? cRes : []);
        setCampaigns(list);
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.isAborted) {
        lastExecutedQueryKeyRef.current = null;
        return;
      }
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      if (err.status === 404) {
        setError('NGO Profile not found. Please complete your NGO registration first.');
      } else {
        setError(err.message || 'Failed to load campaign data.');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      lastExecutedQueryKeyRef.current = null;
    };
  }, [fetchData]);

  const handleOpenModal = (campaign = null) => {
    setFormError('');
    if (campaign) {
      setEditingId(campaign.id);
      setFormData({
        title: campaign.title || '',
        category: campaign.category || 'EDUCATION',
        campaign_type: campaign.campaign_type || 'MONETARY',
        short_description: campaign.short_description || '',
        description: campaign.description || '',
        target_amount: campaign.target_amount || '',
        cover_image: null,
        cover_preview: campaign.cover_image ? getMediaUrl(campaign.cover_image) : null,
        start_date: campaign.start_date || new Date().toISOString().split('T')[0],
        end_date: campaign.end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: campaign.status || 'ACTIVE',
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        category: 'EDUCATION',
        campaign_type: 'MONETARY',
        short_description: '',
        description: '',
        target_amount: '',
        cover_image: null,
        cover_preview: null,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'ACTIVE',
      });
    }
    setShowModal(true);
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setFormError('Unsupported banner image format. Allowed: JPG, PNG, WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Banner image size exceeds 5 MB limit.');
      return;
    }

    setFormError('');
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      cover_image: file,
      cover_preview: previewUrl,
    }));
  };

  const handleClearCoverImage = () => {
    setFormData((prev) => ({
      ...prev,
      cover_image: null,
      cover_preview: null,
    }));
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim() || !formData.short_description.trim() || !formData.description.trim()) {
      setFormError('Title, short summary, and detailed description are required.');
      return;
    }

    if (formData.description.trim().length < 30) {
      setFormError('Detailed description must be at least 30 characters.');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }

    setSubmitting(true);
    try {
      let payload;
      if (formData.cover_image instanceof File) {
        payload = new FormData();
        payload.append('title', formData.title.trim());
        payload.append('category', formData.category);
        payload.append('campaign_type', formData.campaign_type);
        payload.append('short_description', formData.short_description.trim());
        payload.append('description', formData.description.trim());
        payload.append('target_amount', formData.target_amount ? parseFloat(formData.target_amount) : 0);
        payload.append('start_date', formData.start_date);
        payload.append('end_date', formData.end_date);
        payload.append('status', formData.status);
        payload.append('cover_image', formData.cover_image);
      } else {
        const { cover_image, cover_preview, ...rest } = formData;
        payload = {
          ...rest,
          title: formData.title.trim(),
          short_description: formData.short_description.trim(),
          description: formData.description.trim(),
          target_amount: formData.target_amount ? parseFloat(formData.target_amount) : 0,
        };
      }

      if (editingId) {
        await updateNgoCampaign(editingId, payload);
      } else {
        await createNgoCampaign(payload);
      }

      setShowModal(false);
      fetchData(null, true);
    } catch (err) {
      if (err.data && typeof err.data === 'object') {
        const firstKey = Object.keys(err.data)[0];
        const val = err.data[firstKey];
        setFormError(`${firstKey}: ${Array.isArray(val) ? val.join(' ') : val}`);
      } else {
        setFormError(err.message || 'Failed to save campaign appeal.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to cancel/archive this campaign appeal?')) return;
    try {
      await deleteNgoCampaign(id);
      fetchData(null, true);
    } catch (err) {
      alert(err.message || 'Failed to delete campaign.');
    }
  };

  const handleSubmitForReview = async (campaign) => {
    if (!window.confirm(`Submit "${campaign.title}" for administrative review and approval?`)) return;

    try {
      await submitNgoCampaignReview(campaign.id);
      fetchData(null, true);
    } catch (err) {
      alert(err.message || 'Submission for review failed.');
    }
  };

  if (loading) {
    return (
      <NgoLayout>
        <div className="py-20 flex flex-col items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          <p className="text-sm font-semibold text-on-surface-variant mt-3">Loading Campaign Management Suite...</p>
        </div>
      </NgoLayout>
    );
  }

  const isApproved = ngoProfile && ngoProfile.status === 'APPROVED';

  return (
    <NgoLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Campaign Management Suite</h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Publish verified fundraising appeals with 80G tax benefits and connect with India-wide donors.
            </p>
          </div>
          {isApproved && (
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 text-sm shrink-0"
            >
              <span className="material-symbols-outlined text-xl">add_circle</span>
              Create Campaign Appeal
            </button>
          )}
        </div>

        {/* Verification Lock Banner */}
        {!isApproved && (
          <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 text-2xl font-bold shrink-0">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <div>
                <h2 className="text-base font-bold">Campaign Creation Locked — NGO Verification Required</h2>
                <p className="text-xs text-amber-800 mt-0.5">
                  Publishing fundraising appeals requires an approved NGO profile. Your current application status is <span className="font-bold underline">{ngoProfile?.status || 'UNREGISTERED'}</span>.
                </p>
              </div>
            </div>
            <div className="pt-2 flex gap-3">
              <Link
                to="/ngo/registration"
                className="px-4 py-2 bg-amber-800 text-white font-bold rounded-xl text-xs hover:bg-amber-900 transition-colors shadow-xs"
              >
                Complete NGO Verification Application →
              </Link>
            </div>
          </div>
        )}

        {/* Stats Summary Bar */}
        {isApproved && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-on-surface-variant">Total Campaigns</span>
              <div className="text-2xl font-bold text-on-surface">{campaigns.length}</div>
              <p className="text-[11px] text-primary font-semibold">Registered Appeals</p>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-on-surface-variant">Active Public Appeals</span>
              <div className="text-2xl font-bold text-emerald-600">
                {campaigns.filter((c) => c.status === 'ACTIVE').length}
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold">Live for Donors</p>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-on-surface-variant">Drafts & In-Review</span>
              <div className="text-2xl font-bold text-on-surface">
                {campaigns.filter((c) => c.status === 'DRAFT' || c.status === 'PENDING_REVIEW' || c.status === 'CHANGES_REQUESTED').length}
              </div>
              <p className="text-[11px] text-on-surface-variant">Pending Publishing</p>
            </div>
          </div>
        )}

        {/* Filters & Campaign List */}
        {isApproved && (
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/60 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
                {[
                  { label: 'All Statuses', value: 'All' },
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Pending Review', value: 'PENDING_REVIEW' },
                  { label: 'Drafts', value: 'DRAFT' },
                  { label: 'Changes Requested', value: 'CHANGES_REQUESTED' },
                  { label: 'Rejected', value: 'REJECTED' },
                  { label: 'Completed', value: 'COMPLETED' },
                  { label: 'Cancelled', value: 'CANCELLED' },
                  { label: 'Suspended', value: 'SUSPENDED' },
                ].map((st) => (
                  <button
                    key={st.value}
                    onClick={() => setStatusFilter(st.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                      statusFilter === st.value
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 px-3.5 py-2 text-xs bg-surface-container-low border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>

            {campaigns.length === 0 ? (
              <div className="p-12 text-center bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-3">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/60">campaign</span>
                <h3 className="text-base font-bold text-on-surface">No Campaign Appeals Found</h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  No campaign appeals match the selected status filter ({statusFilter}).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaigns.map((c) => (
                  <div
                    key={c.id}
                    className="bg-surface-container-low rounded-2xl border border-outline-variant/60 overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Campaign Card Cover Image */}
                      <ImageWithFallback
                        src={c.cover_image}
                        alt={c.title}
                        fallbackLabel={c.category}
                        aspectRatio="aspect-video"
                        containerClassName="h-36"
                      />

                      <div className="p-5 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant={
                              c.status === 'ACTIVE' ? 'success' :
                              c.status === 'PENDING_REVIEW' ? 'info' :
                              c.status === 'CHANGES_REQUESTED' ? 'warning' :
                              c.status === 'REJECTED' || c.status === 'SUSPENDED' ? 'danger' :
                              c.status === 'CANCELLED' ? 'neutral' : 'neutral'
                            }>
                              {c.status}
                            </Badge>
                            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">{c.category}</span>
                          </div>

                          <h3 className="text-base font-bold text-on-surface">{c.title}</h3>
                          <p className="text-xs text-on-surface-variant line-clamp-2">{c.short_description}</p>

                          {c.status === 'CANCELLED' && (
                            <div className="p-3 bg-surface-container rounded-xl text-xs text-on-surface-variant font-medium">
                              <span className="font-bold block text-on-surface">Cancelled Appeal</span>
                              This campaign appeal has been cancelled and historical record is preserved.
                            </div>
                          )}

                          {c.admin_review_note && c.status === 'CHANGES_REQUESTED' && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-900 dark:text-amber-300 font-medium">
                              <span className="font-bold block">Admin Review Note:</span>
                              {c.admin_review_note}
                            </div>
                          )}

                          {c.rejection_reason && c.status === 'REJECTED' && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-900 dark:text-red-300 font-medium">
                              <span className="font-bold block">Rejection Reason:</span>
                              {c.rejection_reason}
                            </div>
                          )}

                          {/* Monetary Campaign Financial Progress */}
                          <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/40 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-on-surface-variant flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm text-primary">payments</span>
                                Financial Progress
                              </span>
                              <span className="font-bold text-primary">
                                {Math.min(100, Math.round(((parseFloat(c.raised_amount) || 0) / (parseFloat(c.target_amount) || 1)) * 100))}%
                              </span>
                            </div>
                            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, Math.round(((parseFloat(c.raised_amount) || 0) / (parseFloat(c.target_amount) || 1)) * 100))}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                              <span>Raised: <strong className="text-on-surface font-bold">₹{parseFloat(c.raised_amount || 0).toLocaleString('en-IN')}</strong></span>
                              <span>Goal: <strong className="text-on-surface">₹{parseFloat(c.target_amount || 0).toLocaleString('en-IN')}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-outline-variant/40">
                          <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                            <span>{c.start_date} to {c.end_date}</span>
                            <div className="flex items-center gap-2">
                              {(c.status === 'DRAFT' || c.status === 'CHANGES_REQUESTED') && (
                                <>
                                  <button
                                    onClick={() => handleOpenModal(c)}
                                    className="px-2.5 py-1 bg-surface-container text-on-surface font-semibold rounded-lg hover:bg-surface-container-high text-xs"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleSubmitForReview(c)}
                                    className="px-3 py-1 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 text-xs shadow-xs"
                                  >
                                    Submit for Review →
                                  </button>
                                </>
                              )}

                              {(c.status === 'DRAFT' || c.status === 'PENDING_REVIEW' || c.status === 'CHANGES_REQUESTED' || c.status === 'ACTIVE') && (
                                <button
                                  onClick={() => handleDeleteCampaign(c.id)}
                                  className="px-2.5 py-1 bg-red-50 text-red-700 font-semibold rounded-lg hover:bg-red-100 text-xs"
                                >
                                  Cancel Appeal
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Campaign Creation / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-outline-variant/60 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
                <h2 className="text-lg font-bold text-on-surface">
                  {editingId ? 'Edit Campaign Appeal' : 'Create New Campaign Appeal'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1 text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {formError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Campaign Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Free Medical Camp & Relief Fund"
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary text-xs"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Short Summary (Card Preview) *</label>
                  <input
                    type="text"
                    required
                    maxLength={500}
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Brief 1-2 sentence summary of campaign goal"
                    className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Detailed Campaign Appeal * (Min 30 chars)</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide full context, breakdown of fund usage, beneficiary details..."
                    className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-on-surface mb-1">Target Amount (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={formData.target_amount}
                      onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                      placeholder="50000"
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Banner Image Upload */}
                <div>
                  <label className="block font-bold text-on-surface mb-1">Campaign Banner Image</label>
                  <div className="flex items-start gap-4 p-3 bg-surface-container-low border border-outline-variant/60 rounded-xl">
                    <div className="relative w-28 h-20 rounded-lg overflow-hidden shrink-0 border border-outline-variant/40 bg-surface-container flex items-center justify-center">
                      {formData.cover_preview ? (
                        <>
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <img
                              src={formData.cover_preview}
                              alt=""
                              aria-hidden="true"
                              className="w-full h-full object-cover scale-110 blur-md opacity-60 select-none"
                            />
                            <div className="absolute inset-0 bg-black/10" />
                          </div>
                          <img
                            src={formData.cover_preview}
                            alt="Banner Preview"
                            className="relative z-1 w-full h-full object-contain object-center"
                          />
                        </>
                      ) : (
                        <div className="text-center p-2 text-on-surface-variant/60">
                          <span className="material-symbols-outlined text-2xl block">photo_library</span>
                          <span className="text-[9px]">No image</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-xs">
                      <input
                        type="file"
                        ref={coverInputRef}
                        onChange={handleCoverImageChange}
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold rounded-lg text-xs border border-outline-variant/60 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">upload</span>
                          <span>{formData.cover_preview ? 'Change Banner' : 'Select Banner Image'}</span>
                        </button>

                        {formData.cover_preview && (
                          <button
                            type="button"
                            onClick={handleClearCoverImage}
                            className="px-2.5 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 border border-red-200 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant">Recommended: 16:9 ratio (JPG, PNG, WebP). Max 5 MB.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Publishing Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary"
                  >
                    <option value="ACTIVE">Active / Published (Live for Donors)</option>
                    <option value="DRAFT">Save as Draft (Private)</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-surface-container text-on-surface font-semibold rounded-xl hover:bg-surface-container-high"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50"
                  >
                    {submitting ? 'Saving Appeal...' : editingId ? 'Update Campaign' : 'Publish Campaign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </NgoLayout>
  );
}
