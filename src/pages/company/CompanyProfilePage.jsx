import React, { useState, useEffect, useRef } from 'react';
import CompanyLayout from '../../layouts/CompanyLayout';
import {
  getCompanyProfile,
  createCompanyProfile,
  updateCompanyProfile,
  uploadCompanyVerificationDocument,
  submitCompanyVerification,
} from '../../services/api';

const CIN_REGEX = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const PINCODE_REGEX = /^\d{6}$/;
const PHONE_REGEX = /^[\+\d\s\-]{7,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export default function CompanyProfilePage() {
  const [formData, setFormData] = useState({
    company_name: '',
    legal_name: '',
    cin_number: '',
    pan_number: '',
    csr_registration_number: '',
    contact_person_name: '',
    contact_person_designation: '',
    contact_email: '',
    contact_phone: '',
    official_website: '',
    registered_address: '',
    city: '',
    state: '',
    pincode: '',
    annual_csr_budget: '',
  });

  const [initialProfile, setInitialProfile] = useState(null);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Notifications & Feedback
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [docSuccess, setDocSuccess] = useState('');
  const [docError, setDocError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [clientErrors, setClientErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});

  const fileInputRef = useRef(null);

  const fetchProfileData = async () => {
    setLoading(true);
    setSaveError('');
    try {
      const res = await getCompanyProfile();
      setInitialProfile(res);
      setIsNewProfile(false);
      setFormData({
        company_name: res.company_name || '',
        legal_name: res.legal_name || '',
        cin_number: res.cin_number || '',
        pan_number: res.pan_number || (res.has_pan ? res.pan_number_masked : ''),
        csr_registration_number: res.csr_registration_number || '',
        contact_person_name: res.contact_person_name || '',
        contact_person_designation: res.contact_person_designation || '',
        contact_email: res.contact_email || '',
        contact_phone: res.contact_phone || '',
        official_website: res.official_website || '',
        registered_address: res.registered_address || '',
        city: res.city || '',
        state: res.state || '',
        pincode: res.pincode || '',
        annual_csr_budget: res.annual_csr_budget !== null && res.annual_csr_budget !== undefined ? String(res.annual_csr_budget) : '',
      });
    } catch (err) {
      // If 404 or profile doesn't exist yet, allow initial creation in empty form mode
      if (
        err.status === 404 ||
        err.data?.code === 'NO_COMPANY_PROFILE' ||
        err.code === 'NO_COMPANY_PROFILE' ||
        err.message?.toLowerCase().includes('no company profile') ||
        err.message?.toLowerCase().includes('not found')
      ) {
        setIsNewProfile(true);
        setInitialProfile({ verification_status: 'DRAFT' });
        setSaveError('');
      } else {
        setSaveError(err.message || 'Failed to fetch corporate profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const verificationStatus = initialProfile?.verification_status || 'DRAFT';
  const isEditable = verificationStatus === 'DRAFT' || isNewProfile;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific errors
    if (clientErrors[field]) {
      setClientErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverErrors[field]) {
      setServerErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateClientForm = () => {
    const errors = {};

    if (!formData.company_name.trim()) {
      errors.company_name = 'Company name is required.';
    }
    if (!formData.legal_name.trim()) {
      errors.legal_name = 'Legal registered name is required.';
    }

    if (formData.cin_number && !CIN_REGEX.test(formData.cin_number.trim().toUpperCase())) {
      errors.cin_number = 'Invalid CIN format. Expected 21-character MCA standard (e.g. L12345MH2020PLC123456).';
    }

    // Only validate PAN if user entered a new PAN (not masked)
    if (formData.pan_number && !formData.pan_number.includes('*')) {
      if (!PAN_REGEX.test(formData.pan_number.trim().toUpperCase())) {
        errors.pan_number = 'Invalid PAN format. Expected 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).';
      }
    }

    if (formData.pincode && !PINCODE_REGEX.test(formData.pincode.trim())) {
      errors.pincode = 'Pincode must be exactly 6 numeric digits.';
    }

    if (formData.contact_phone && !PHONE_REGEX.test(formData.contact_phone.trim())) {
      errors.contact_phone = 'Enter a valid phone number (7–20 digits/characters).';
    }

    if (formData.contact_email && !EMAIL_REGEX.test(formData.contact_email.trim())) {
      errors.contact_email = 'Enter a valid email address.';
    }

    if (formData.annual_csr_budget && Number(formData.annual_csr_budget) < 0) {
      errors.annual_csr_budget = 'Annual CSR budget cannot be negative.';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!isEditable) return;

    if (!validateClientForm()) {
      setSaveError('Please correct the validation errors before saving.');
      return;
    }

    setSaving(true);
    setSaveSuccess('');
    setSaveError('');
    setServerErrors({});

    // Prepare payload
    const payload = {
      company_name: formData.company_name.trim(),
      legal_name: formData.legal_name.trim(),
      cin_number: formData.cin_number ? formData.cin_number.trim().toUpperCase() : '',
      csr_registration_number: formData.csr_registration_number ? formData.csr_registration_number.trim() : '',
      contact_person_name: formData.contact_person_name ? formData.contact_person_name.trim() : '',
      contact_person_designation: formData.contact_person_designation ? formData.contact_person_designation.trim() : '',
      contact_email: formData.contact_email ? formData.contact_email.trim() : '',
      contact_phone: formData.contact_phone ? formData.contact_phone.trim() : '',
      official_website: formData.official_website ? formData.official_website.trim() : '',
      registered_address: formData.registered_address ? formData.registered_address.trim() : '',
      city: formData.city ? formData.city.trim() : '',
      state: formData.state ? formData.state.trim() : '',
      pincode: formData.pincode ? formData.pincode.trim() : '',
    };

    // Only send pan_number if user modified it and not masked
    if (formData.pan_number && !formData.pan_number.includes('*')) {
      payload.pan_number = formData.pan_number.trim().toUpperCase();
    }

    if (formData.annual_csr_budget !== '') {
      payload.annual_csr_budget = formData.annual_csr_budget;
    }

    try {
      let result;
      const wasNew = isNewProfile;
      if (wasNew) {
        result = await createCompanyProfile(payload);
        setIsNewProfile(false);
      } else {
        result = await updateCompanyProfile(payload);
      }
      setInitialProfile(result);
      setSaveSuccess(wasNew ? 'Corporate profile created successfully.' : 'Company profile saved successfully.');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      if (err.data && typeof err.data === 'object') {
        setServerErrors(err.data);
      }
      setSaveError(err.message || 'Failed to update company profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setDocError('Only PDF documents are accepted for statutory verification.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setDocError('Document file size exceeds the 10 MB limit.');
      return;
    }

    setDocError('');
    setDocSuccess('');
    setUploadingDoc(true);

    const data = new FormData();
    data.append('verification_document', file);

    try {
      const updated = await uploadCompanyVerificationDocument(data);
      setInitialProfile(updated);
      setDocSuccess('Verification document uploaded successfully.');
      setTimeout(() => setDocSuccess(''), 4000);
    } catch (err) {
      setDocError(err.message || 'Failed to upload verification document.');
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmitVerification = async () => {
    if (!initialProfile?.has_verification_document) {
      setSubmitError('A statutory verification document (PDF) must be uploaded before submitting for verification.');
      return;
    }
    setSubmittingVerification(true);
    setSubmitSuccess('');
    setSubmitError('');
    try {
      const res = await submitCompanyVerification();
      setInitialProfile(res);
      setSubmitSuccess('Corporate profile successfully submitted for administrative verification.');
      setTimeout(() => setSubmitSuccess(''), 6000);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit profile for verification.');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const getFieldError = (field) => {
    return clientErrors[field] || (serverErrors[field] ? (Array.isArray(serverErrors[field]) ? serverErrors[field][0] : serverErrors[field]) : null);
  };

  const getInputClass = (fieldName, extraClass = '') => {
    const hasError = !!getFieldError(fieldName);
    const base = 'w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors';
    const stateClass = !isEditable
      ? 'bg-slate-50 text-slate-900 font-semibold border-slate-200 cursor-not-allowed select-text opacity-100 disabled:opacity-100 disabled:text-slate-900 disabled:bg-slate-50'
      : hasError
      ? 'bg-surface-container-low text-on-surface border-red-500 focus:ring-red-500 focus:border-red-500'
      : 'bg-surface-container-low text-on-surface border-outline-variant focus:border-primary';
    return `${base} ${stateClass} ${extraClass}`.trim();
  };

  const formatINR = (val) => {
    const num = Number(val);
    if (isNaN(num) || num <= 0) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <CompanyLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Corporate Profile & Verification
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Maintain statutory legal identity, MCA CIN/PAN credentials, and corporate verification documents.
            </p>
          </div>
        </div>

        {/* Global Loading */}
        {loading && (
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 text-center animate-pulse space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 mx-auto" />
            <div className="h-6 bg-surface-container rounded-lg max-w-sm mx-auto" />
            <div className="h-4 bg-surface-container rounded-lg max-w-md mx-auto" />
          </div>
        )}

        {!loading && (
          <>
            {/* Verification Status Card */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      verificationStatus === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-600'
                        : verificationStatus === 'PENDING_VERIFICATION'
                        ? 'bg-blue-50 text-blue-600'
                        : verificationStatus === 'REJECTED'
                        ? 'bg-red-50 text-red-600'
                        : verificationStatus === 'SUSPENDED'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {verificationStatus === 'APPROVED'
                        ? 'verified'
                        : verificationStatus === 'PENDING_VERIFICATION'
                        ? 'hourglass_top'
                        : verificationStatus === 'REJECTED'
                        ? 'error'
                        : verificationStatus === 'SUSPENDED'
                        ? 'warning'
                        : 'edit_document'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Verification Status
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <h3 className="text-lg font-bold text-on-surface">
                        {verificationStatus.replace(/_/g, ' ')}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          verificationStatus === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : verificationStatus === 'PENDING_VERIFICATION'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : verificationStatus === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : verificationStatus === 'SUSPENDED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {verificationStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {initialProfile?.verified_at && (
                  <div className="text-xs text-on-surface-variant sm:text-right">
                    <span className="block font-medium">Verified On</span>
                    <span className="font-bold text-on-surface">
                      {new Date(initialProfile.verified_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Explanation Messages */}
              {verificationStatus === 'APPROVED' && (
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-emerald-700 text-base shrink-0 mt-0.5">check_circle</span>
                  <div>
                    <strong>Corporate Entity Verified:</strong> Your legal identity and Certificate of Incorporation have been validated by platform administrators. Your profile is locked for integrity.
                  </div>
                </div>
              )}

              {verificationStatus === 'PENDING_VERIFICATION' && (
                <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-4 sm:p-5 text-xs text-blue-950 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-blue-700 text-lg shrink-0 mt-0.5">hourglass_top</span>
                    <div>
                      <h4 className="font-bold text-sm text-blue-900">
                        Verification Under Administrative Review
                      </h4>
                      <p className="mt-0.5 text-blue-800 leading-relaxed">
                        Your corporate profile and statutory incorporation documentation have been submitted to platform administrators for compliance review and MCA credential verification.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/90 border border-blue-100 rounded-xl p-3.5 space-y-2 text-[11px] text-blue-900">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-blue-600 shrink-0">lock</span>
                      <span>
                        <strong>Profile Editing Locked:</strong> To preserve compliance audit integrity, all corporate identity, statutory registration, and contact fields are locked in read-only mode while review is active.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-blue-600 shrink-0">mark_email_read</span>
                      <span>
                        <strong>Review Notification:</strong> Once verification is complete, the decision will be communicated directly to your official corporate SPOC email (<strong>{formData.contact_email || initialProfile?.contact_email || 'on file'}</strong>), and your company dashboard will immediately reflect the updated verification status.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {verificationStatus === 'REJECTED' && (
                <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-4 text-xs text-red-900 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-red-700 text-base shrink-0 mt-0.5">cancel</span>
                  <div>
                    <strong>Verification Declined:</strong> {initialProfile?.rejection_reason || 'Please contact platform administration to update statutory compliance documents.'}
                  </div>
                </div>
              )}

              {verificationStatus === 'SUSPENDED' && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-amber-700 text-base shrink-0 mt-0.5">warning</span>
                  <div>
                    <strong>Corporate Account Suspended:</strong> {initialProfile?.suspension_reason || 'Contact corporate support for reactivation assistance.'}
                  </div>
                </div>
              )}

              {verificationStatus === 'DRAFT' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-slate-700 text-base shrink-0 mt-0.5">edit_note</span>
                    <div>
                      <strong>Draft Status:</strong> Fill in all company details below and attach your Certificate of Incorporation (PDF) to submit for compliance approval.
                    </div>
                  </div>
                  {!isNewProfile && (
                    <button
                      type="button"
                      onClick={handleSubmitVerification}
                      disabled={submittingVerification || !initialProfile?.has_verification_document}
                      className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">{submittingVerification ? 'sync' : 'send'}</span>
                      {submittingVerification ? 'Submitting...' : 'Submit for Verification'}
                    </button>
                  )}
                </div>
              )}

              {submitSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {submitSuccess}
                </div>
              )}

              {submitError && (
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {submitError}
                </div>
              )}
            </div>

            {/* Statutory Document Upload Section */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/40">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">upload_file</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Statutory Verification Document</h3>
                  <p className="text-xs text-on-surface-variant">
                    Certificate of Incorporation / MCA Registration Document (PDF format only, max 10MB)
                  </p>
                </div>
              </div>

              {docSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {docSuccess}
                </div>
              )}

              {docError && (
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {docError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-on-surface">
                      {initialProfile?.has_verification_document
                        ? initialProfile.verification_document_name || 'Certificate of Incorporation'
                        : 'No document attached'}
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      {!initialProfile?.has_verification_document
                        ? 'Upload statutory incorporation certificate (PDF) to proceed'
                        : verificationStatus === 'APPROVED'
                        ? 'Statutory Certificate of Incorporation verified by platform admin'
                        : verificationStatus === 'PENDING_VERIFICATION'
                        ? 'Statutory document on file — currently under review by compliance team'
                        : verificationStatus === 'REJECTED'
                        ? 'Statutory document was not approved — please replace with valid certificate'
                        : 'Certificate attached — ready for verification submission'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {initialProfile?.has_verification_document && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        verificationStatus === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : verificationStatus === 'PENDING_VERIFICATION'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : verificationStatus === 'REJECTED'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {verificationStatus === 'APPROVED'
                        ? 'Verified Document'
                        : verificationStatus === 'PENDING_VERIFICATION'
                        ? 'Document on File (Pending Review)'
                        : verificationStatus === 'REJECTED'
                        ? 'Action Required'
                        : 'Document on File'}
                    </span>
                  )}

                  {initialProfile?.verification_document_url && (
                    <a
                      href={initialProfile.verification_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      View Document (PDF)
                    </a>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleDocumentUpload}
                    accept=".pdf,application/pdf"
                    className="hidden"
                    disabled={!isEditable || uploadingDoc}
                  />
                  {isEditable ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingDoc}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all bg-primary text-white hover:bg-primary-container shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">
                        {uploadingDoc ? 'sync' : 'upload'}
                      </span>
                      {uploadingDoc
                        ? 'Uploading...'
                        : initialProfile?.has_verification_document
                        ? 'Replace Document (PDF)'
                        : 'Upload Certificate (PDF)'}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                      <span className="material-symbols-outlined text-xs">lock</span>
                      Locked during review
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Information Form */}
            <form onSubmit={handleSaveProfile} className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">domain</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">Corporate Identity & Address</h3>
                    <p className="text-xs text-on-surface-variant">
                      {isEditable ? 'Provide accurate legal credentials for MCA statutory filing' : 'Profile is in read-only mode — saved details are displayed below'}
                    </p>
                  </div>
                </div>

                {!isEditable && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Locked for Review
                  </span>
                )}
              </div>

              {!isEditable && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-600 text-base">info</span>
                    <span>
                      <strong>Read-Only Mode:</strong> Saved company identity, registration, and address values are preserved below. Form inputs cannot be modified while under review.
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200 shrink-0">
                    Persisted Values
                  </span>
                </div>
              )}

              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {saveSuccess}
                </div>
              )}

              {saveError && (
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {saveError}
                </div>
              )}

              {/* Grid 1: Basic Company Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Company Name */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Corporate Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    disabled={!isEditable}
                    placeholder="e.g. Tata Consultancy Services"
                    className={getInputClass('company_name')}
                  />
                  {getFieldError('company_name') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('company_name')}</p>
                  )}
                </div>

                {/* Legal Name */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Registered Legal Entity Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.legal_name}
                    onChange={(e) => handleInputChange('legal_name', e.target.value)}
                    disabled={!isEditable}
                    placeholder="e.g. Tata Consultancy Services Limited"
                    className={getInputClass('legal_name')}
                  />
                  {getFieldError('legal_name') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('legal_name')}</p>
                  )}
                </div>

                {/* CIN Number */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Corporate Identification Number (CIN)
                  </label>
                  <input
                    type="text"
                    value={formData.cin_number}
                    onChange={(e) => handleInputChange('cin_number', e.target.value.toUpperCase())}
                    disabled={!isEditable}
                    placeholder="L12345MH2020PLC123456"
                    maxLength={21}
                    className={getInputClass('cin_number', 'uppercase tracking-wider font-mono')}
                  />
                  {getFieldError('cin_number') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('cin_number')}</p>
                  )}
                </div>

                {/* PAN Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-on-surface">
                      Permanent Account Number (PAN)
                    </label>
                    {formData.pan_number && formData.pan_number.includes('*') && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        Masked for Security
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.pan_number}
                    onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                    disabled={!isEditable}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className={getInputClass('pan_number', 'uppercase tracking-wider font-mono')}
                  />
                  {getFieldError('pan_number') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('pan_number')}</p>
                  )}
                </div>

                {/* CSR Registration Number */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    MCA CSR-1 Registration Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.csr_registration_number}
                    onChange={(e) => handleInputChange('csr_registration_number', e.target.value)}
                    disabled={!isEditable}
                    placeholder="CSR12345678"
                    className={getInputClass('csr_registration_number', 'font-mono')}
                  />
                  {getFieldError('csr_registration_number') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('csr_registration_number')}</p>
                  )}
                </div>

                {/* Annual CSR Budget */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-on-surface">
                      Annual CSR Budget (₹ INR)
                    </label>
                    {formatINR(formData.annual_csr_budget) && (
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {formatINR(formData.annual_csr_budget)}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.annual_csr_budget}
                    onChange={(e) => handleInputChange('annual_csr_budget', e.target.value)}
                    disabled={!isEditable}
                    placeholder="e.g. 5000000"
                    className={getInputClass('annual_csr_budget')}
                  />
                  {getFieldError('annual_csr_budget') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('annual_csr_budget')}</p>
                  )}
                </div>
              </div>

              {/* SPOC Contact Details Section */}
              <div className="pt-4 border-t border-outline-variant/40 space-y-4">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Corporate SPOC & Liaison Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Contact Name */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      value={formData.contact_person_name}
                      onChange={(e) => handleInputChange('contact_person_name', e.target.value)}
                      disabled={!isEditable}
                      placeholder="e.g. Ramesh Sharma"
                      className={getInputClass('contact_person_name')}
                    />
                    {getFieldError('contact_person_name') && (
                      <p className="text-red-500 text-xs mt-1">{getFieldError('contact_person_name')}</p>
                    )}
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Designation</label>
                    <input
                      type="text"
                      value={formData.contact_person_designation}
                      onChange={(e) => handleInputChange('contact_person_designation', e.target.value)}
                      disabled={!isEditable}
                      placeholder="e.g. Head of CSR"
                      className={getInputClass('contact_person_designation')}
                    />
                    {getFieldError('contact_person_designation') && (
                      <p className="text-red-500 text-xs mt-1">{getFieldError('contact_person_designation')}</p>
                    )}
                  </div>

                  {/* Contact Phone */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      disabled={!isEditable}
                      placeholder="+91 9876543210"
                      className={getInputClass('contact_phone')}
                    />
                    {getFieldError('contact_phone') && (
                      <p className="text-red-500 text-xs mt-1">{getFieldError('contact_phone')}</p>
                    )}
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Official Contact Email</label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      disabled={!isEditable}
                      placeholder="csr@company.com"
                      className={getInputClass('contact_email')}
                    />
                    {getFieldError('contact_email') && (
                      <p className="text-red-500 text-xs mt-1">{getFieldError('contact_email')}</p>
                    )}
                  </div>

                  {/* Official Website */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-on-surface mb-1">Official Website URL</label>
                    <input
                      type="url"
                      value={formData.official_website}
                      onChange={(e) => handleInputChange('official_website', e.target.value)}
                      disabled={!isEditable}
                      placeholder="https://www.company.com"
                      className={getInputClass('official_website')}
                    />
                    {getFieldError('official_website') && (
                      <p className="text-red-500 text-xs mt-1">{getFieldError('official_website')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Registered Address Section */}
              <div className="pt-4 border-t border-outline-variant/40 space-y-4">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Registered Corporate Office Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-on-surface mb-1">Registered Address</label>
                    <textarea
                      rows={2}
                      value={formData.registered_address}
                      onChange={(e) => handleInputChange('registered_address', e.target.value)}
                      disabled={!isEditable}
                      placeholder="Complete registered address with building, street name..."
                      className={getInputClass('registered_address')}
                    />
                    {getFieldError('registered_address') && (
                      <p className="text-red-500 text-xs mt-1">{getFieldError('registered_address')}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      disabled={!isEditable}
                      placeholder="e.g. Mumbai"
                      className={getInputClass('city')}
                    />
                    {getFieldError('city') && (
                      <p className="text-red-500 text-xs mt-1">{getFieldError('city')}</p>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">State / UT</label>
                    <select
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      disabled={!isEditable}
                      className={getInputClass('state')}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {getFieldError('state') && (
                      <p className="text-red-500 text-xs mt-1">{getFieldError('state')}</p>
                    )}
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Pincode (6 Digits)</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      disabled={!isEditable}
                      placeholder="400001"
                      className={getInputClass('pincode', 'font-mono')}
                    />
                    {getFieldError('pincode') && (
                      <p className="text-red-500 text-xs mt-1">{getFieldError('pincode')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              {isEditable && (
                <div className="pt-4 border-t border-outline-variant/40 flex items-center justify-end gap-3">
                  {!isNewProfile && (verificationStatus === 'DRAFT' || verificationStatus === 'REJECTED') && (
                    <button
                      type="button"
                      onClick={handleSubmitVerification}
                      disabled={submittingVerification || saving || !initialProfile?.has_verification_document}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">
                        {submittingVerification ? 'sync' : 'send'}
                      </span>
                      {submittingVerification ? 'Submitting for Review...' : 'Submit for Verification'}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving || submittingVerification}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-xs hover:bg-primary-container disabled:opacity-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">
                      {saving ? 'sync' : 'save'}
                    </span>
                    {saving ? 'Saving Profile...' : isNewProfile ? 'Create Corporate Profile' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </CompanyLayout>
  );
}
