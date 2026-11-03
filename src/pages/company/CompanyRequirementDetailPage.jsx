import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import CompanyLayout from '../../layouts/CompanyLayout';
import { getCsrRequirementDetail, createCsrSupportRequest, getCompanyProfile } from '../../services/api';

const PHONE_REGEX = /^[\+\d\s\-]{7,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export default function CompanyRequirementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [requirement, setRequirement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [is404, setIs404] = useState(false);

  // EOI Modal State
  const [eoiModalOpen, setEoiModalOpen] = useState(false);
  const [eoiForm, setEoiForm] = useState({
    proposed_funding: '',
    support_type: 'FINANCIAL_GRANT',
    spoc_name: '',
    spoc_email: '',
    spoc_phone: '',
    message: '',
  });

  const [submittingEoi, setSubmittingEoi] = useState(false);
  const [eoiSuccess, setEoiSuccess] = useState('');
  const [eoiError, setEoiError] = useState('');
  const [clientErrors, setClientErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});

  const fetchRequirement = async () => {
    setLoading(true);
    setError('');
    setIs404(false);
    try {
      const res = await getCsrRequirementDetail(id);
      setRequirement(res);
      // Pre-populate proposed funding default with required CSR funding
      if (res && res.required_csr_funding) {
        setEoiForm((prev) => ({
          ...prev,
          proposed_funding: String(res.required_csr_funding),
        }));
      }
    } catch (err) {
      if (err.status === 404 || err.message?.includes('404') || err.message?.includes('not found')) {
        setIs404(true);
      } else {
        setError(err.message || 'Failed to load requirement proposal details.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Preload company profile for SPOC info
  useEffect(() => {
    fetchRequirement();

    getCompanyProfile()
      .then((profile) => {
        if (profile) {
          setEoiForm((prev) => ({
            ...prev,
            spoc_name: prev.spoc_name || profile.contact_person_name || '',
            spoc_email: prev.spoc_email || profile.contact_email || '',
            spoc_phone: prev.spoc_phone || profile.contact_phone || '',
          }));
        }
      })
      .catch(() => {});
  }, [id]);

  const handleInputChange = (field, value) => {
    setEoiForm((prev) => ({ ...prev, [field]: value }));
    if (clientErrors[field]) {
      setClientErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverErrors[field]) {
      setServerErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateEoiForm = () => {
    const errors = {};
    const funding = Number(eoiForm.proposed_funding);

    if (!eoiForm.proposed_funding || isNaN(funding) || funding < 1000) {
      errors.proposed_funding = 'Proposed funding must be at least ₹1,000.00.';
    }

    if (!eoiForm.spoc_name.trim()) {
      errors.spoc_name = 'Corporate SPOC contact name is required.';
    }

    if (!eoiForm.spoc_email.trim() || !EMAIL_REGEX.test(eoiForm.spoc_email.trim())) {
      errors.spoc_email = 'A valid official SPOC email is required.';
    }

    if (!eoiForm.spoc_phone.trim() || !PHONE_REGEX.test(eoiForm.spoc_phone.trim())) {
      errors.spoc_phone = 'A valid contact phone number (7–20 digits) is required.';
    }

    if (!eoiForm.message.trim()) {
      errors.message = 'Expression of interest narrative note is required.';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitEoi = async (e) => {
    e.preventDefault();
    if (submittingEoi) return;

    if (!validateEoiForm()) {
      setEoiError('Please correct the validation errors before submitting.');
      return;
    }

    setSubmittingEoi(true);
    setEoiSuccess('');
    setEoiError('');
    setServerErrors({});

    const payload = {
      requirement: requirement.id,
      proposed_funding: eoiForm.proposed_funding,
      support_type: eoiForm.support_type,
      spoc_name: eoiForm.spoc_name.trim(),
      spoc_email: eoiForm.spoc_email.trim(),
      spoc_phone: eoiForm.spoc_phone.trim(),
      message: eoiForm.message.trim(),
    };

    try {
      await createCsrSupportRequest(payload);
      setEoiSuccess('Expression of Interest submitted successfully to NGO partner!');
      setTimeout(() => {
        setEoiModalOpen(false);
        setEoiSuccess('');
        navigate('/company/requests');
      }, 2000);
    } catch (err) {
      if (err.data && typeof err.data === 'object') {
        setServerErrors(err.data);
      }
      setEoiError(err.message || 'Failed to submit expression of interest.');
    } finally {
      setSubmittingEoi(false);
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

  const totalBudget = Number(requirement?.total_estimated_budget) || 0;
  const requiredCsr = Number(requirement?.required_csr_funding) || 0;
  const committed = Number(requirement?.committed_funding) || 0;
  const availableFunding = Math.max(0, requiredCsr - committed);
  const percentFunded = totalBudget > 0 ? Math.min(Math.round((committed / totalBudget) * 100), 100) : 0;

  return (
    <CompanyLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
          <Link to="/company/marketplace" className="hover:text-primary transition-colors">
            CSR Marketplace
          </Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-on-surface truncate">
            {loading ? 'Proposal Dossier' : requirement?.title || 'Proposal Details'}
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 bg-surface-container rounded-3xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-surface-container rounded-3xl"></div>
              <div className="h-96 bg-surface-container rounded-3xl"></div>
            </div>
          </div>
        )}

        {/* 404 Not Found State */}
        {!loading && is404 && (
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-container text-on-surface-variant flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">sentiment_dissatisfied</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface">CSR Proposal Not Found</h2>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              The requested proposal either does not exist, has been concluded, or is not open for corporate matching.
            </p>
            <Link
              to="/company/marketplace"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-container transition-all"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Return to CSR Marketplace
            </Link>
          </div>
        )}

        {/* Error State */}
        {!loading && !is404 && error && (
          <div className="bg-error-container/20 border border-error/30 p-8 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">error_outline</span>
            </div>
            <h3 className="text-base font-bold text-on-surface">Failed to load proposal</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchRequirement}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container transition-all"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Retry
            </button>
          </div>
        )}

        {/* Main Proposal Dossier */}
        {!loading && !is404 && !error && requirement && (
          <div className="space-y-8">
            {/* Header Hero Card */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-sm">category</span>
                    {requirement.category_display || requirement.schedule_vii_category?.replace(/_/g, ' ')}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    {requirement.status === 'OPEN_FOR_CSR' ? 'Open for CSR Matching' : requirement.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant">
                    {requirement.location_scope_display || requirement.location_scope || 'State Level'}
                  </span>
                </div>

                <span className="text-xs text-on-surface-variant">
                  Published{' '}
                  {new Date(requirement.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight leading-snug">
                {requirement.title}
              </h1>

              {/* NGO Partner Info Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface-container-low rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-xs">
                    <span className="material-symbols-outlined text-xl">volunteer_activism</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">
                      {requirement.ngo_display_name || requirement.ngo_legal_name}
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      {requirement.ngo_legal_name} • {requirement.ngo_category || 'Registered NGO'}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-on-surface-variant sm:text-right">
                  <span className="block font-medium">Implementation Territory</span>
                  <span className="font-bold text-on-surface">
                    {requirement.district ? `${requirement.district}, ${requirement.state}` : requirement.state}
                  </span>
                </div>
              </div>
            </div>

            {/* 2-Column Dossier Content & Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column (2 Cols): Project Scope & Deliverables */}
              <div className="lg:col-span-2 space-y-6">
                {/* Executive Summary */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-7 shadow-xs space-y-3">
                  <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">subject</span>
                    Executive Summary
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                    {requirement.summary || 'No executive summary provided.'}
                  </p>
                </div>

                {/* Detailed Description */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-7 shadow-xs space-y-3">
                  <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">description</span>
                    Project Scope & Ground Strategy
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                    {requirement.detailed_description || requirement.summary || 'Details forthcoming.'}
                  </p>
                </div>

                {/* Expected Outcomes */}
                {requirement.expected_outcomes && (
                  <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-7 shadow-xs space-y-3">
                    <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-xl">track_changes</span>
                      Key Impact Indicators & Expected Outcomes
                    </h3>
                    <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-2xl text-xs sm:text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                      {requirement.expected_outcomes}
                    </div>
                  </div>
                )}

                {/* Target Beneficiaries & Timeline Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-2">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      Target Demographics
                    </span>
                    <div className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-lg">groups</span>
                      {requirement.demographic_display || requirement.beneficiary_demographic?.replace(/_/g, ' ')}
                    </div>
                    {requirement.target_beneficiary_count > 0 && (
                      <div className="text-xs text-on-surface-variant">
                        Target Population: <strong>{requirement.target_beneficiary_count.toLocaleString('en-IN')} individuals</strong>
                      </div>
                    )}
                  </div>

                  <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 shadow-xs space-y-2">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      Execution Timeline
                    </span>
                    <div className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">calendar_today</span>
                      {requirement.start_date || 'Immediate'} → {requirement.expected_completion_date || 'TBD'}
                    </div>
                    <div className="text-xs text-on-surface-variant">
                      Multi-phase deliverable milestones
                    </div>
                  </div>
                </div>

                {/* Statutory Attachments Section */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">folder_shared</span>
                    Statutory Project Dossiers
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-1">
                      <span className="text-[11px] font-bold text-on-surface-variant block">Project Proposal</span>
                      <div className="text-xs font-bold text-on-surface truncate">
                        {requirement.has_proposal_document
                          ? requirement.proposal_document_name || 'Attached PDF'
                          : 'Not Provided'}
                      </div>
                      <span className={`text-[10px] font-semibold ${requirement.has_proposal_document ? 'text-emerald-700' : 'text-on-surface-variant'}`}>
                        {requirement.has_proposal_document ? 'Verified Document' : 'Pending'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-1">
                      <span className="text-[11px] font-bold text-on-surface-variant block">Itemized Budget</span>
                      <div className="text-xs font-bold text-on-surface truncate">
                        {requirement.has_detailed_budget_document
                          ? requirement.detailed_budget_document_name || 'Attached PDF'
                          : 'Not Provided'}
                      </div>
                      <span className={`text-[10px] font-semibold ${requirement.has_detailed_budget_document ? 'text-emerald-700' : 'text-on-surface-variant'}`}>
                        {requirement.has_detailed_budget_document ? 'Verified Budget' : 'Pending'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-1">
                      <span className="text-[11px] font-bold text-on-surface-variant block">Impact Assessment</span>
                      <div className="text-xs font-bold text-on-surface truncate">
                        {requirement.has_impact_assessment_report
                          ? requirement.impact_assessment_report_name || 'Attached Report'
                          : 'Optional / Not Provided'}
                      </div>
                      <span className={`text-[10px] font-semibold ${requirement.has_impact_assessment_report ? 'text-emerald-700' : 'text-on-surface-variant'}`}>
                        {requirement.has_impact_assessment_report ? 'Verified Report' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (1 Col): Financials & Expression of Interest CTA */}
              <div className="space-y-6">
                {/* Financial Summary Card */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5 sticky top-24">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      CSR Funding Requirement
                    </span>
                    <div className="text-3xl font-black text-primary tracking-tight">
                      {formatCurrency(requiredCsr)}
                    </div>
                    <div className="text-xs text-on-surface-variant">
                      Total Project Budget: {formatCurrency(totalBudget)}
                    </div>
                  </div>

                  {/* Progress towards funding */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant font-medium">Committed Capital</span>
                      <span className="font-bold text-on-surface">
                        {formatCurrency(committed)} ({percentFunded}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-secondary h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${percentFunded}%` }}
                      />
                    </div>
                  </div>

                  {/* Available Capital */}
                  <div className="p-3.5 bg-surface-container-low rounded-2xl text-xs space-y-1">
                    <span className="text-on-surface-variant block text-[11px]">Available for Corporate CSR</span>
                    <span className="text-base font-black text-on-surface">
                      {formatCurrency(availableFunding)}
                    </span>
                  </div>

                  {/* EOI Primary Action Button */}
                  {requirement.status === 'OPEN_FOR_CSR' ? (
                    <button
                      onClick={() => {
                        setEoiModalOpen(true);
                        setEoiSuccess('');
                        setEoiError('');
                      }}
                      className="w-full py-3 px-4 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">mark_email_unread</span>
                      Express Interest / Submit EOI
                    </button>
                  ) : (
                    <div className="p-3.5 bg-surface-container rounded-2xl text-center text-xs text-on-surface-variant font-bold">
                      Proposal Status: {requirement.status}
                    </div>
                  )}

                  <div className="text-[11px] text-on-surface-variant text-center space-y-1 pt-1">
                    <p>✓ Direct bilateral engagement with NGO leadership</p>
                    <p>✓ 100% off-platform corporate bank disbursements</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expression of Interest (EOI) Creation Modal */}
        {eoiModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl animate-scaleUp">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/40">
                <div>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Grant Expression of Interest (EOI)
                  </span>
                  <h2 className="text-lg font-bold text-on-surface mt-0.5 line-clamp-1">
                    {requirement.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEoiModalOpen(false)}
                  disabled={submittingEoi}
                  className="w-8 h-8 rounded-full bg-surface-container text-on-surface hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {eoiSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700">check_circle</span>
                  {eoiSuccess}
                </div>
              )}

              {eoiError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-700">error</span>
                  {eoiError}
                </div>
              )}

              <form onSubmit={handleSubmitEoi} className="space-y-4">
                {/* Proposed Funding & Support Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Proposed Funding Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      required
                      value={eoiForm.proposed_funding}
                      onChange={(e) => handleInputChange('proposed_funding', e.target.value)}
                      placeholder="e.g. 500000"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low transition-colors ${
                        getFieldError('proposed_funding')
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-outline-variant focus:border-primary'
                      }`}
                    />
                    {getFieldError('proposed_funding') && (
                      <p className="text-red-500 text-xs mt-1">{getFieldError('proposed_funding')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Support Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={eoiForm.support_type}
                      onChange={(e) => handleInputChange('support_type', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-outline-variant bg-surface-container-low focus:border-primary font-medium"
                    >
                      <option value="FINANCIAL_GRANT">Financial CSR Grant</option>
                      <option value="EQUIPMENT_SUPPORT">Equipment / Infra Support</option>
                      <option value="CO_FUNDING">Co-Funding Consortium</option>
                    </select>
                  </div>
                </div>

                {/* SPOC Contact Info */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Corporate SPOC Details
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Representative Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={eoiForm.spoc_name}
                      onChange={(e) => handleInputChange('spoc_name', e.target.value)}
                      placeholder="e.g. Ramesh Sharma"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low ${
                        getFieldError('spoc_name') ? 'border-red-500' : 'border-outline-variant focus:border-primary'
                      }`}
                    />
                    {getFieldError('spoc_name') && (
                      <p className="text-red-500 text-xs mt-1">{getFieldError('spoc_name')}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Corporate Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={eoiForm.spoc_email}
                        onChange={(e) => handleInputChange('spoc_email', e.target.value)}
                        placeholder="spoc@company.com"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low ${
                          getFieldError('spoc_email') ? 'border-red-500' : 'border-outline-variant focus:border-primary'
                        }`}
                      />
                      {getFieldError('spoc_email') && (
                        <p className="text-red-500 text-xs mt-1">{getFieldError('spoc_email')}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Contact Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={eoiForm.spoc_phone}
                        onChange={(e) => handleInputChange('spoc_phone', e.target.value)}
                        placeholder="+91 9876543210"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low ${
                          getFieldError('spoc_phone') ? 'border-red-500' : 'border-outline-variant focus:border-primary'
                        }`}
                      />
                      {getFieldError('spoc_phone') && (
                        <p className="text-red-500 text-xs mt-1">{getFieldError('spoc_phone')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expression of Interest Narrative Message */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Message / Expression of Interest Note <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={eoiForm.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Describe your corporate alignment, governance expectations, and proposed partnership terms..."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-surface-container-low ${
                      getFieldError('message') ? 'border-red-500' : 'border-outline-variant focus:border-primary'
                    }`}
                  />
                  {getFieldError('message') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('message')}</p>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => setEoiModalOpen(false)}
                    disabled={submittingEoi}
                    className="px-4 py-2.5 bg-surface-container hover:bg-slate-200 text-on-surface text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEoi}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-container disabled:opacity-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">
                      {submittingEoi ? 'sync' : 'send'}
                    </span>
                    {submittingEoi ? 'Submitting EOI...' : 'Submit Support Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
