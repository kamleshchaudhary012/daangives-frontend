import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import NgoLayout from '../../../layouts/NgoLayout';
import {
  createNgoCsrRequirement,
  getNgoCsrRequirementDetail,
  updateNgoCsrRequirement,
  submitNgoCsrRequirement,
  uploadNgoCsrRequirementDocument,
  deleteNgoCsrRequirement,
} from '../../../services/api';

const SCHEDULE_VII_CATEGORIES = [
  { key: 'ERADICATING_HUNGER', label: 'Eradicating Hunger, Poverty & Healthcare' },
  { key: 'PROMOTING_EDUCATION', label: 'Promoting Education, Skilling & Livelihood' },
  { key: 'GENDER_EQUALITY', label: 'Promoting Gender Equality & Women Empowerment' },
  { key: 'ENVIRONMENTAL_SUSTAINABILITY', label: 'Ensuring Environmental Sustainability & Ecology' },
  { key: 'NATIONAL_HERITAGE', label: 'Protection of National Heritage, Art & Culture' },
  { key: 'ARMED_FORCES_VETERANS', label: 'Measures for Armed Forces Veterans & War Widows' },
  { key: 'RURAL_SPORTS', label: 'Training to Promote Rural & Nationally Recognized Sports' },
  { key: 'PM_NATIONAL_RELIEF', label: 'Contribution to Prime Minister National Relief Fund' },
  { key: 'TECHNOLOGY_INCUBATORS', label: 'Technology Incubators within Academic Institutions' },
  { key: 'RURAL_DEVELOPMENT', label: 'Rural Development Projects' },
  { key: 'SLUM_DEVELOPMENT', label: 'Slum Area Development' },
  { key: 'DISASTER_MANAGEMENT', label: 'Disaster Management, Relief & Rehabilitation' },
];

const BENEFICIARY_DEMOGRAPHICS = [
  { key: 'CHILDREN_EDUCATION', label: 'Children & School Students' },
  { key: 'WOMEN_EMPOWERMENT', label: 'Women & Self-Help Groups (SHGs)' },
  { key: 'RURAL_COMMUNITIES', label: 'Rural & Tribal Communities' },
  { key: 'YOUTH_SKILLING', label: 'Youth & Vocational Trainees' },
  { key: 'HEALTHCARE_PATIENTS', label: 'Underprivileged Healthcare Patients' },
  { key: 'SPECIALLY_ABLED', label: 'Persons with Disabilities (PwD)' },
  { key: 'ELDERLY_CARE', label: 'Senior Citizens & Destitute Elderly' },
  { key: 'ENVIRONMENTAL_HABITATS', label: 'Ecological Habitats & Flora/Fauna' },
  { key: 'DISASTER_AFFECTED', label: 'Disaster-Affected Families' },
];

const LOCATION_SCOPES = [
  { key: 'SPECIFIC_DISTRICT', label: 'District / Local Block' },
  { key: 'MULTI_DISTRICT', label: 'State-Wide Initiative' },
  { key: 'ASPIRATIONAL_DISTRICT', label: 'NITI Aayog Aspirational District' },
  { key: 'NATIONWIDE', label: 'Pan-India Multi-State' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export default function NgoCsrRequirementBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    detailed_description: '',
    expected_outcomes: '',
    schedule_vii_category: 'PROMOTING_EDUCATION',
    state: 'Maharashtra',
    district: '',
    location_scope: 'MULTI_DISTRICT',
    beneficiary_demographic: 'CHILDREN_EDUCATION',
    target_beneficiary_count: '100',
    start_date: '',
    expected_completion_date: '',
    total_estimated_budget: '',
    required_csr_funding: '',
    committed_funding: '0.00',
  });

  const [requirementStatus, setRequirementStatus] = useState('DRAFT');
  const [docMetadata, setDocMetadata] = useState({
    has_proposal_document: false,
    has_detailed_budget_document: false,
    has_impact_assessment_report: false,
    proposal_document_name: '',
    detailed_budget_document_name: '',
    impact_assessment_report_name: '',
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [clientErrors, setClientErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Document Upload States
  const [uploadingDocType, setUploadingDocType] = useState(null);
  const [docUploadError, setDocUploadError] = useState('');
  const [docUploadSuccess, setDocUploadSuccess] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // File input refs
  const proposalRef = useRef(null);
  const budgetRef = useRef(null);
  const impactRef = useRef(null);

  // Fetch existing requirement data in Edit mode
  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    setLoading(true);
    setGlobalError('');

    getNgoCsrRequirementDetail(id)
      .then((res) => {
        if (!isMounted) return;
        setRequirementStatus(res.status || 'DRAFT');
        setFormData({
          title: res.title || '',
          summary: res.summary || '',
          detailed_description: res.detailed_description || '',
          expected_outcomes: res.expected_outcomes || '',
          schedule_vii_category: res.schedule_vii_category || 'PROMOTING_EDUCATION',
          state: res.state || 'Maharashtra',
          district: res.district || '',
          location_scope: res.location_scope || 'MULTI_DISTRICT',
          beneficiary_demographic: res.beneficiary_demographic || 'CHILDREN_EDUCATION',
          target_beneficiary_count: String(res.target_beneficiary_count || '100'),
          start_date: res.start_date || '',
          expected_completion_date: res.expected_completion_date || '',
          total_estimated_budget: String(res.total_estimated_budget || ''),
          required_csr_funding: String(res.required_csr_funding || ''),
          committed_funding: String(res.committed_funding || '0.00'),
        });
        setDocMetadata({
          has_proposal_document: res.has_proposal_document || false,
          has_detailed_budget_document: res.has_detailed_budget_document || false,
          has_impact_assessment_report: res.has_impact_assessment_report || false,
          proposal_document_name: res.proposal_document_name || '',
          detailed_budget_document_name: res.detailed_budget_document_name || '',
          impact_assessment_report_name: res.impact_assessment_report_name || '',
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        setGlobalError(err.message || 'Failed to load CSR proposal details.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  const isReadOnly = isEditMode && requirementStatus !== 'DRAFT';

  const handleInputChange = (field, value) => {
    if (isReadOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (clientErrors[field]) {
      setClientErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverErrors[field]) {
      setServerErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) errors.title = 'Proposal title is required.';
    if (!formData.summary.trim()) errors.summary = 'Executive summary is required.';
    if (!formData.detailed_description.trim()) {
      errors.detailed_description = 'Detailed scope and ground strategy narrative is required.';
    }
    if (!formData.district.trim()) errors.district = 'District is required.';

    const count = parseInt(formData.target_beneficiary_count, 10);
    if (isNaN(count) || count < 0) {
      errors.target_beneficiary_count = 'Target beneficiary count must be a non-negative number.';
    }

    if (!formData.start_date) errors.start_date = 'Project start date is required.';
    if (!formData.expected_completion_date) {
      errors.expected_completion_date = 'Expected completion date is required.';
    } else if (formData.start_date && formData.expected_completion_date < formData.start_date) {
      errors.expected_completion_date = 'Completion date must be on or after start date.';
    }

    const total = parseFloat(formData.total_estimated_budget);
    const req = parseFloat(formData.required_csr_funding);

    if (isNaN(total) || total < 10000) {
      errors.total_estimated_budget = 'Total budget must be at least ₹10,000.00.';
    }

    if (isNaN(req) || req < 10000) {
      errors.required_csr_funding = 'Required CSR funding must be at least ₹10,000.00.';
    } else if (!isNaN(total) && req > total) {
      errors.required_csr_funding = 'Required CSR funding cannot exceed the total estimated budget.';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getPayload = () => ({
    title: formData.title.trim(),
    summary: formData.summary.trim(),
    detailed_description: formData.detailed_description.trim(),
    expected_outcomes: formData.expected_outcomes.trim(),
    schedule_vii_category: formData.schedule_vii_category,
    state: formData.state,
    district: formData.district.trim(),
    location_scope: formData.location_scope,
    beneficiary_demographic: formData.beneficiary_demographic,
    target_beneficiary_count: parseInt(formData.target_beneficiary_count, 10) || 0,
    start_date: formData.start_date,
    expected_completion_date: formData.expected_completion_date,
    total_estimated_budget: formData.total_estimated_budget,
    required_csr_funding: formData.required_csr_funding,
    committed_funding: formData.committed_funding || '0.00',
  });

  // Save as Draft
  const handleSaveDraft = async (e) => {
    if (e) e.preventDefault();
    if (isReadOnly || saving) return;

    if (!validateForm()) {
      setGlobalError('Please fix validation errors before saving.');
      return;
    }

    setSaving(true);
    setGlobalError('');
    setSuccessMessage('');
    setServerErrors({});

    try {
      if (isEditMode) {
        const updated = await updateNgoCsrRequirement(id, getPayload());
        setSuccessMessage('Proposal draft updated successfully.');
        setRequirementStatus(updated.status || 'DRAFT');
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        const created = await createNgoCsrRequirement(getPayload());
        setSuccessMessage('Proposal draft created! You can now attach statutory documents.');
        navigate(`/ngo/csr/requirements/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      if (err.data && typeof err.data === 'object') {
        setServerErrors(err.data);
      }
      setGlobalError(err.message || 'Failed to save proposal draft.');
    } finally {
      setSaving(false);
    }
  };

  // Submit for Review
  const handleSubmitForReview = async () => {
    if (isReadOnly || submitting) return;

    if (!validateForm()) {
      setGlobalError('Please complete all required fields before submitting for review.');
      return;
    }

    setSubmitting(true);
    setGlobalError('');
    setSuccessMessage('');

    try {
      // Save any pending changes first
      if (isEditMode) {
        await updateNgoCsrRequirement(id, getPayload());
        const submitted = await submitNgoCsrRequirement(id);
        setRequirementStatus(submitted.status || 'PENDING_REVIEW');
      } else {
        const created = await createNgoCsrRequirement(getPayload());
        const submitted = await submitNgoCsrRequirement(created.id);
        setRequirementStatus(submitted.status || 'PENDING_REVIEW');
      }

      setSuccessMessage('Proposal submitted successfully for Admin Review & Platform Moderation!');
      setTimeout(() => {
        navigate('/ngo/csr/requirements');
      }, 2000);
    } catch (err) {
      if (err.data && typeof err.data === 'object') {
        setServerErrors(err.data);
      }
      setGlobalError(err.message || 'Failed to submit proposal for review.');
    } finally {
      setSubmitting(false);
    }
  };

  // Document Upload Handler
  const handleDocumentUpload = async (docType, file) => {
    if (!file || !isEditMode) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setDocUploadError('Only PDF files are permitted for statutory documents.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setDocUploadError('File size exceeds 15 MB limit.');
      return;
    }

    setUploadingDocType(docType);
    setDocUploadError('');
    setDocUploadSuccess('');

    const formDataObj = new FormData();
    formDataObj.append(docType, file);
    formDataObj.append('document_type', docType);

    try {
      const updated = await uploadNgoCsrRequirementDocument(id, formDataObj);
      setDocMetadata({
        has_proposal_document: updated.has_proposal_document,
        has_detailed_budget_document: updated.has_detailed_budget_document,
        has_impact_assessment_report: updated.has_impact_assessment_report,
        proposal_document_name: updated.proposal_document_name,
        detailed_budget_document_name: updated.detailed_budget_document_name,
        impact_assessment_report_name: updated.impact_assessment_report_name,
      });
      setDocUploadSuccess('Document uploaded and verified successfully.');
      setTimeout(() => setDocUploadSuccess(''), 4000);
    } catch (err) {
      setDocUploadError(err.message || 'Failed to upload document.');
    } finally {
      setUploadingDocType(null);
    }
  };

  // Delete Draft Handler
  const handleDeleteDraft = async () => {
    if (!isEditMode || requirementStatus !== 'DRAFT') return;

    setDeleting(true);
    setGlobalError('');

    try {
      await deleteNgoCsrRequirement(id);
      navigate('/ngo/csr/requirements');
    } catch (err) {
      setGlobalError(err.message || 'Failed to delete draft proposal.');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const getFieldError = (field) => {
    return (
      clientErrors[field] ||
      (serverErrors[field]
        ? Array.isArray(serverErrors[field])
          ? serverErrors[field][0]
          : serverErrors[field]
        : null)
    );
  };

  return (
    <NgoLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
          <Link to="/ngo/csr/requirements" className="hover:text-secondary transition-colors">
            My CSR Proposals
          </Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-on-surface truncate">
            {isEditMode ? formData.title || 'Edit Proposal' : 'New CSR Proposal'}
          </span>
        </div>

        {/* Header Title & Status Banner */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                Section 135 CSR Proposal Builder
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
                {isEditMode ? formData.title || 'Edit CSR Proposal' : 'Draft New CSR Proposal'}
              </h1>
            </div>

            {isEditMode && (
              <span className={`self-start sm:self-auto px-3.5 py-1 rounded-full text-xs font-bold border ${
                requirementStatus === 'DRAFT'
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : requirementStatus === 'PENDING_REVIEW'
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              }`}>
                {requirementStatus.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {/* Immutability Banner */}
          {isReadOnly && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium flex items-center gap-2.5">
              <span className="material-symbols-outlined text-amber-700 text-lg">lock</span>
              <span>
                This proposal is currently in <strong>{requirementStatus.replace(/_/g, ' ')}</strong> status and is locked for edits.
              </span>
            </div>
          )}
        </div>

        {/* Global Success / Error Feedback */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs sm:text-sm text-emerald-800 font-semibold flex items-center gap-2.5 shadow-xs">
            <span className="material-symbols-outlined text-emerald-700 text-lg">check_circle</span>
            {successMessage}
          </div>
        )}

        {globalError && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-xs sm:text-sm text-red-800 font-semibold flex items-center gap-2.5 shadow-xs">
            <span className="material-symbols-outlined text-red-700 text-lg">error</span>
            {globalError}
          </div>
        )}

        {/* Loading State in Edit Mode */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-64 bg-surface-container rounded-3xl"></div>
            <div className="h-64 bg-surface-container rounded-3xl"></div>
          </div>
        )}

        {/* Main Builder Form */}
        {!loading && (
          <form onSubmit={handleSaveDraft} className="space-y-8">
            {/* SECTION A: Proposal Identity */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/40">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Proposal Identity & Ground Strategy</h3>
                  <p className="text-xs text-on-surface-variant">Core title, Schedule VII statutory alignment, and narrative scope</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Proposal Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g. Digital Classrooms & STEM Labs in Rural Maharashtra"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-surface-container-low transition-colors ${
                      getFieldError('title') ? 'border-red-500' : 'border-outline-variant focus:border-secondary'
                    }`}
                  />
                  {getFieldError('title') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('title')}</p>
                  )}
                </div>

                {/* Schedule VII Category Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Statutory Schedule VII Focus Area <span className="text-red-500">*</span>
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={formData.schedule_vii_category}
                    onChange={(e) => handleInputChange('schedule_vii_category', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-outline-variant bg-surface-container-low focus:border-secondary font-medium"
                  >
                    {SCHEDULE_VII_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Executive Summary */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Executive Summary (1–2 Sentences) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    disabled={isReadOnly}
                    value={formData.summary}
                    onChange={(e) => handleInputChange('summary', e.target.value)}
                    placeholder="Concise overview summarizing the goal, geography, and expected direct impact..."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-surface-container-low ${
                      getFieldError('summary') ? 'border-red-500' : 'border-outline-variant focus:border-secondary'
                    }`}
                  />
                  {getFieldError('summary') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('summary')}</p>
                  )}
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Detailed Implementation Scope & Strategy <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    disabled={isReadOnly}
                    value={formData.detailed_description}
                    onChange={(e) => handleInputChange('detailed_description', e.target.value)}
                    placeholder="Comprehensive methodology, baseline assessment, field staffing, and delivery roadmap..."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-surface-container-low ${
                      getFieldError('detailed_description')
                        ? 'border-red-500'
                        : 'border-outline-variant focus:border-secondary'
                    }`}
                  />
                  {getFieldError('detailed_description') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('detailed_description')}</p>
                  )}
                </div>

                {/* Expected Outcomes */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Key Impact Indicators & Expected Outcomes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    value={formData.expected_outcomes}
                    onChange={(e) => handleInputChange('expected_outcomes', e.target.value)}
                    placeholder="Measurable KPI metrics (e.g. 500 children enrolled, 25 schools equipped, 85% attendance increase)..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-outline-variant bg-surface-container-low focus:border-secondary"
                  />
                </div>
              </div>
            </div>

            {/* SECTION B: Location & Beneficiaries */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/40">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Target Territory & Demographic</h3>
                  <p className="text-xs text-on-surface-variant">Geographical footprint and primary target beneficiary community</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* State */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    State / UT <span className="text-red-500">*</span>
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-outline-variant bg-surface-container-low focus:border-secondary font-medium"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Primary District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    placeholder="e.g. Pune, Kamrup, Koraput"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-surface-container-low ${
                      getFieldError('district') ? 'border-red-500' : 'border-outline-variant focus:border-secondary'
                    }`}
                  />
                  {getFieldError('district') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('district')}</p>
                  )}
                </div>

                {/* Location Scope */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Location Scope <span className="text-red-500">*</span>
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={formData.location_scope}
                    onChange={(e) => handleInputChange('location_scope', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-outline-variant bg-surface-container-low focus:border-secondary font-medium"
                  >
                    {LOCATION_SCOPES.map((l) => (
                      <option key={l.key} value={l.key}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Beneficiary Demographic */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Beneficiary Demographic <span className="text-red-500">*</span>
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={formData.beneficiary_demographic}
                    onChange={(e) => handleInputChange('beneficiary_demographic', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-outline-variant bg-surface-container-low focus:border-secondary font-medium"
                  >
                    {BENEFICIARY_DEMOGRAPHICS.map((b) => (
                      <option key={b.key} value={b.key}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Beneficiary Count */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Target Beneficiary Headcount (Direct Individuals) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    disabled={isReadOnly}
                    value={formData.target_beneficiary_count}
                    onChange={(e) => handleInputChange('target_beneficiary_count', e.target.value)}
                    placeholder="e.g. 500"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-surface-container-low ${
                      getFieldError('target_beneficiary_count')
                        ? 'border-red-500'
                        : 'border-outline-variant focus:border-secondary'
                    }`}
                  />
                  {getFieldError('target_beneficiary_count') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('target_beneficiary_count')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION C: Timeline & Financial Budget */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/40">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Execution Horizon & Financial Budget</h3>
                  <p className="text-xs text-on-surface-variant">Project implementation dates and required corporate grant capital</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Execution Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-surface-container-low ${
                      getFieldError('start_date') ? 'border-red-500' : 'border-outline-variant focus:border-secondary'
                    }`}
                  />
                  {getFieldError('start_date') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('start_date')}</p>
                  )}
                </div>

                {/* Completion Date */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Expected Completion Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={formData.expected_completion_date}
                    onChange={(e) => handleInputChange('expected_completion_date', e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-surface-container-low ${
                      getFieldError('expected_completion_date')
                        ? 'border-red-500'
                        : 'border-outline-variant focus:border-secondary'
                    }`}
                  />
                  {getFieldError('expected_completion_date') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('expected_completion_date')}</p>
                  )}
                </div>

                {/* Total Estimated Budget */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Total Estimated Project Budget (₹ INR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="10000"
                    step="10000"
                    disabled={isReadOnly}
                    value={formData.total_estimated_budget}
                    onChange={(e) => handleInputChange('total_estimated_budget', e.target.value)}
                    placeholder="e.g. 1000000"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-surface-container-low ${
                      getFieldError('total_estimated_budget')
                        ? 'border-red-500'
                        : 'border-outline-variant focus:border-secondary'
                    }`}
                  />
                  {getFieldError('total_estimated_budget') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('total_estimated_budget')}</p>
                  )}
                </div>

                {/* Required CSR Funding */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Required CSR Grant Funding (₹ INR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="10000"
                    step="10000"
                    disabled={isReadOnly}
                    value={formData.required_csr_funding}
                    onChange={(e) => handleInputChange('required_csr_funding', e.target.value)}
                    placeholder="e.g. 500000"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-surface-container-low ${
                      getFieldError('required_csr_funding')
                        ? 'border-red-500'
                        : 'border-outline-variant focus:border-secondary'
                    }`}
                  />
                  {getFieldError('required_csr_funding') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('required_csr_funding')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION D: Statutory Document Attachments */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/40">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Statutory Project Dossiers (PDF Only)</h3>
                  <p className="text-xs text-on-surface-variant">
                    {isEditMode
                      ? 'Upload supporting documents to accelerate corporate matching and admin approval'
                      : 'Save proposal draft first to enable independent document uploads'}
                  </p>
                </div>
              </div>

              {docUploadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {docUploadSuccess}
                </div>
              )}

              {docUploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {docUploadError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Proposal Document */}
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-on-surface block">Detailed Proposal PDF</span>
                    <p className="text-[11px] text-on-surface-variant">Full project concept note</p>
                    <div className="text-[11px] font-semibold text-secondary truncate">
                      {docMetadata.has_proposal_document
                        ? docMetadata.proposal_document_name || 'Uploaded Document'
                        : 'Pending Upload'}
                    </div>
                  </div>

                  {isEditMode && !isReadOnly && (
                    <div>
                      <input
                        type="file"
                        ref={proposalRef}
                        onChange={(e) => handleDocumentUpload('proposal_document', e.target.files?.[0])}
                        accept=".pdf,application/pdf"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => proposalRef.current?.click()}
                        disabled={uploadingDocType === 'proposal_document'}
                        className="w-full py-2 px-3 bg-surface-container hover:bg-secondary hover:text-white text-on-surface text-xs font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {uploadingDocType === 'proposal_document' ? 'sync' : 'upload_file'}
                        </span>
                        {docMetadata.has_proposal_document ? 'Replace PDF' : 'Upload Proposal PDF'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Budget Document */}
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-on-surface block">Itemized Budget PDF</span>
                    <p className="text-[11px] text-on-surface-variant">Line-item cost breakdown</p>
                    <div className="text-[11px] font-semibold text-secondary truncate">
                      {docMetadata.has_detailed_budget_document
                        ? docMetadata.detailed_budget_document_name || 'Uploaded Budget'
                        : 'Pending Upload'}
                    </div>
                  </div>

                  {isEditMode && !isReadOnly && (
                    <div>
                      <input
                        type="file"
                        ref={budgetRef}
                        onChange={(e) => handleDocumentUpload('detailed_budget_document', e.target.files?.[0])}
                        accept=".pdf,application/pdf"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => budgetRef.current?.click()}
                        disabled={uploadingDocType === 'detailed_budget_document'}
                        className="w-full py-2 px-3 bg-surface-container hover:bg-secondary hover:text-white text-on-surface text-xs font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {uploadingDocType === 'detailed_budget_document' ? 'sync' : 'upload_file'}
                        </span>
                        {docMetadata.has_detailed_budget_document ? 'Replace PDF' : 'Upload Budget PDF'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Impact Assessment Document */}
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-on-surface block">Impact Assessment PDF</span>
                    <p className="text-[11px] text-on-surface-variant">Baseline or past audit report</p>
                    <div className="text-[11px] font-semibold text-secondary truncate">
                      {docMetadata.has_impact_assessment_report
                        ? docMetadata.impact_assessment_report_name || 'Uploaded Report'
                        : 'Optional'}
                    </div>
                  </div>

                  {isEditMode && !isReadOnly && (
                    <div>
                      <input
                        type="file"
                        ref={impactRef}
                        onChange={(e) => handleDocumentUpload('impact_assessment_report', e.target.files?.[0])}
                        accept=".pdf,application/pdf"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => impactRef.current?.click()}
                        disabled={uploadingDocType === 'impact_assessment_report'}
                        className="w-full py-2 px-3 bg-surface-container hover:bg-secondary hover:text-white text-on-surface text-xs font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {uploadingDocType === 'impact_assessment_report' ? 'sync' : 'upload_file'}
                        </span>
                        {docMetadata.has_impact_assessment_report ? 'Replace PDF' : 'Upload Impact PDF'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky bottom-6">
              <div className="flex items-center gap-3">
                <Link
                  to="/ngo/csr/requirements"
                  className="px-4 py-2.5 bg-surface-container hover:bg-slate-200 text-on-surface text-xs font-bold rounded-xl transition-colors"
                >
                  Back to Proposals
                </Link>

                {isEditMode && requirementStatus === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(true)}
                    className="px-4 py-2.5 bg-error-container/20 hover:bg-error hover:text-white text-error text-xs font-bold rounded-xl border border-error/30 transition-colors"
                  >
                    Delete Draft
                  </button>
                )}
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving || submitting}
                    className="px-5 py-2.5 bg-surface-container hover:bg-secondary/10 text-secondary border border-secondary/30 text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving Draft...' : 'Save Draft'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitForReview}
                    disabled={saving || submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-secondary hover:bg-secondary-container text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">
                      {submitting ? 'sync' : 'send'}
                    </span>
                    {submitting ? 'Submitting...' : 'Submit for Admin Review'}
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">warning</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Delete Draft Proposal?</h3>
                  <p className="text-xs text-on-surface-variant">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant">
                Are you sure you want to permanently delete proposal "<strong>{formData.title || 'Untitled'}</strong>"?
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-surface-container hover:bg-slate-200 text-on-surface text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDraft}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-error text-white text-xs font-bold rounded-xl shadow-xs hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">{deleting ? 'sync' : 'delete'}</span>
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NgoLayout>
  );
}
