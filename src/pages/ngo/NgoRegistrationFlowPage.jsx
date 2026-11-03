import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NgoLayout from '../../layouts/NgoLayout';
import {
  getNgoProfile,
  createNgoProfile,
  updateNgoProfile,
  getNgoAddress,
  saveNgoAddress,
  getNgoLegalInfo,
  saveNgoLegalInfo,
  getNgoBankInfo,
  saveNgoBankInfo,
  getNgoLeadership,
  createNgoLeader,
  updateNgoLeader,
  deleteNgoLeader,
  getNgoDocuments,
  uploadNgoDocument,
  deleteNgoDocument,
  getNgoDocumentDownloadUrl,
  submitNgoApplication,
  getNgoVerificationHistory,
} from '../../services/api';

const BASE_REQUIRED_DOC_TYPES = [
  { type: 'TRUST_DEED', label: 'Trust Deed / MoA / Bye-Laws' },
  { type: 'REGISTRATION_CERT', label: 'Registration Certificate' },
  { type: 'PAN_CARD', label: 'NGO PAN Card' },
  { type: 'DARPAN_CERTIFICATE', label: 'NITI Aayog Darpan Certificate' },
  { type: 'AUDITED_FINANCIALS', label: 'Audited Financial Statements (FY24-25)' },
  { type: 'BANK_PASSBOOK', label: 'Bank Passbook / Statement Cover' },
  { type: 'CANCELLED_CHEQUE', label: 'Cancelled Cheque' },
  { type: 'REPRESENTATIVE_ID', label: 'Authorized Representative ID Proof' },
];

export default function NgoRegistrationFlowPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submissionErrors, setSubmissionErrors] = useState(null);

  // Status & locking
  const [ngoStatus, setNgoStatus] = useState('DRAFT');
  const [isLocked, setIsLocked] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Exists flags for PUT/PATCH vs POST
  const [hasProfile, setHasProfile] = useState(false);
  const [hasAddress, setHasAddress] = useState(false);
  const [hasLegal, setHasLegal] = useState(false);
  const [hasBank, setHasBank] = useState(false);

  // 1. Profile State
  const [profile, setProfile] = useState({
    legal_name: '',
    display_name: '',
    gujarati_name: '',
    category: 'EDUCATION',
    description: '',
    mission_statement: '',
    year_established: '',
    website: '',
    official_email: '',
    official_phone: '',
  });

  // 2. Address State
  const [address, setAddress] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    district: '',
    state: 'Gujarat',
    pincode: '',
    service_areas: '',
  });

  // 3. Legal Info State
  const [legal, setLegal] = useState({
    organisation_type: 'TRUST',
    registering_authority: '',
    registration_number: '',
    darpan_id: '',
    pan_number: '',
    registration_state: 'Gujarat',
    chief_trustee_name: '',
    chief_trustee_designation: '',
    has_10_23c: false,
    ten_23c_subclause: '',
    ten_23c_order_number: '',
    ten_23c_validity: '',
    has_12a: false,
    twelve_a_number: '',
    has_80g: false,
    eighty_g_number: '',
    has_fcra: false,
    fcra_number: '',
    has_csr_1: false,
    csr_registration_number: '',
    csr_registration_date: '',
  });

  // 4. Bank Info State
  const [bank, setBank] = useState({
    account_holder_name: '',
    account_number: '',
    masked_account_number: '',
    ifsc_code: '',
    bank_name: '',
    branch_name: '',
    account_type: 'SAVINGS',
  });

  // 5. Leadership State
  const [leaders, setLeaders] = useState([]);
  const [leaderForm, setLeaderForm] = useState({
    full_name: '',
    designation: '',
    phone: '',
    email: '',
    is_primary_contact: false,
  });
  const [editingLeaderId, setEditingLeaderId] = useState(null);

  // 6. Documents State
  const [documents, setDocuments] = useState([]);
  const [uploadingDocType, setUploadingDocType] = useState('');

  // -------------------------------------------------------------------------
  // INITIAL DATA LOAD
  // -------------------------------------------------------------------------
  useEffect(() => {
    loadAllApplicationData();
  }, []);

  const loadAllApplicationData = async () => {
    setLoading(true);
    setGlobalError('');
    try {
      // 1. Profile
      try {
        const profData = await getNgoProfile();
        if (profData) {
          setHasProfile(true);
          setProfile({
            legal_name: profData.legal_name || '',
            display_name: profData.display_name || '',
            gujarati_name: profData.gujarati_name || '',
            category: profData.category || 'EDUCATION',
            description: profData.description || '',
            mission_statement: profData.mission_statement || '',
            year_established: profData.year_established || '',
            website: profData.website || '',
            official_email: profData.official_email || '',
            official_phone: profData.official_phone || '',
          });
          setNgoStatus(profData.status || 'DRAFT');
          if (profData.verification) {
            setVerificationData(profData.verification);
          }
          if (['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(profData.status)) {
            setIsLocked(true);
          }
        }
      } catch (err) {
        if (err.status === 401) throw err;
        // If 404 / not found, user is in initial creation mode (Step 1)
        setHasProfile(false);
      }

      // 2. Address
      try {
        const addrData = await getNgoAddress();
        if (addrData) {
          setHasAddress(true);
          setAddress({
            address_line1: addrData.address_line1 || '',
            address_line2: addrData.address_line2 || '',
            city: addrData.city || '',
            district: addrData.district || '',
            state: addrData.state || 'Gujarat',
            pincode: addrData.pincode || '',
            service_areas: addrData.service_areas || '',
          });
        }
      } catch (err) {
        if (err.status === 401) throw err;
        setHasAddress(false);
      }

      // 3. Legal
      try {
        const legData = await getNgoLegalInfo();
        if (legData) {
          setHasLegal(true);
          setLegal({
            organisation_type: legData.organisation_type || 'TRUST',
            registering_authority: legData.registering_authority || '',
            registration_number: legData.registration_number || '',
            darpan_id: legData.darpan_id || '',
            pan_number: legData.pan_number || '',
            registration_state: legData.registration_state || 'Gujarat',
            chief_trustee_name: legData.chief_trustee_name || '',
            chief_trustee_designation: legData.chief_trustee_designation || '',
            has_10_23c: legData.has_10_23c || false,
            ten_23c_subclause: legData.ten_23c_subclause || '',
            ten_23c_order_number: legData.ten_23c_order_number || '',
            ten_23c_validity: legData.ten_23c_validity || '',
            has_12a: legData.has_12a || false,
            twelve_a_number: legData.twelve_a_number || '',
            has_80g: legData.has_80g || false,
            eighty_g_number: legData.eighty_g_number || '',
            has_fcra: legData.has_fcra || false,
            fcra_number: legData.fcra_number || '',
            has_csr_1: legData.has_csr_1 || false,
            csr_registration_number: legData.csr_registration_number || '',
            csr_registration_date: legData.csr_registration_date || '',
          });
        }
      } catch (err) {
        if (err.status === 401) throw err;
        setHasLegal(false);
      }

      // 4. Bank
      try {
        const bnkData = await getNgoBankInfo();
        if (bnkData) {
          setHasBank(true);
          setBank({
            account_holder_name: bnkData.account_holder_name || '',
            account_number: '', // Never populate plaintext from GET
            masked_account_number: bnkData.masked_account_number || '',
            ifsc_code: bnkData.ifsc_code || '',
            bank_name: bnkData.bank_name || '',
            branch_name: bnkData.branch_name || '',
            account_type: bnkData.account_type || 'SAVINGS',
          });
        }
      } catch (err) {
        if (err.status === 401) throw err;
        setHasBank(false);
      }

      // 5. Leadership
      try {
        const leaderList = await getNgoLeadership();
        if (Array.isArray(leaderList)) {
          setLeaders(leaderList);
        }
      } catch (err) {
        if (err.status === 401) throw err;
      }

      // 6. Documents
      try {
        const docList = await getNgoDocuments();
        if (Array.isArray(docList)) {
          setDocuments(docList);
        }
      } catch (err) {
        if (err.status === 401) throw err;
      }

      // 7. Verification History
      try {
        const hist = await getNgoVerificationHistory();
        if (Array.isArray(hist)) {
          setVerificationHistory(hist);
        }
      } catch (err) {
        // non-blocking
      }

    } catch (err) {
      if (err.status === 401) {
        setGlobalError('Authentication session expired. Please log in again.');
        setTimeout(() => navigate('/login?next=%2Fngo%2Fregistration-flow', { replace: true }), 1500);
      } else {
        setGlobalError(err.message || 'Unable to connect to server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // STEP SAVE HANDLERS
  // -------------------------------------------------------------------------

  // Save Step 1 (Profile)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    setSaving(true);
    setFieldErrors({});
    setGlobalError('');

    try {
      let result;
      const payload = {
        legal_name: profile.legal_name,
        display_name: profile.display_name,
        gujarati_name: profile.gujarati_name,
        category: profile.category,
        description: profile.description,
        mission_statement: profile.mission_statement,
        year_established: parseInt(profile.year_established) || null,
        website: profile.website,
        official_email: profile.official_email,
        official_phone: profile.official_phone,
      };

      if (hasProfile) {
        result = await updateNgoProfile(payload);
      } else {
        result = await createNgoProfile(payload);
        setHasProfile(true);
      }

      setStep(2);
    } catch (err) {
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setGlobalError(err.message || 'Failed to save profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Save Step 2 (Address)
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    setSaving(true);
    setFieldErrors({});
    setGlobalError('');

    try {
      await saveNgoAddress(address, hasAddress);
      setHasAddress(true);
      setStep(3);
    } catch (err) {
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setGlobalError(err.message || 'Failed to save address.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Save Step 3 (Legal Info)
  const handleSaveLegal = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    setFieldErrors({});
    setGlobalError('');

    const errors = {};
    if (!legal.registering_authority?.trim()) {
      errors.registering_authority = 'Registering Authority is required.';
    }
    if (!legal.chief_trustee_name?.trim()) {
      errors.chief_trustee_name = 'Chief Trustee / Authorized Head Name is required.';
    }
    if (!legal.chief_trustee_designation?.trim()) {
      errors.chief_trustee_designation = 'Chief Trustee / Authorized Head Designation is required.';
    }
    if (!legal.registration_number?.trim()) {
      errors.registration_number = 'Registration Number is required.';
    }
    if (!legal.darpan_id?.trim()) {
      errors.darpan_id = 'NITI Aayog Darpan ID is required.';
    }
    if (!legal.pan_number?.trim()) {
      errors.pan_number = 'NGO PAN Card Number is required.';
    }
    if (legal.has_10_23c && !legal.ten_23c_order_number?.trim()) {
      errors.ten_23c_order_number = 'Section 10(23C) approval order number is required.';
    }
    if (legal.has_12a && !legal.twelve_a_number?.trim()) {
      errors.twelve_a_number = '12A Certificate number is required when claimed.';
    }
    if (legal.has_80g && !legal.eighty_g_number?.trim()) {
      errors.eighty_g_number = '80G Approval order number is required when claimed.';
    }
    if (legal.has_csr_1 && !legal.csr_registration_number?.trim()) {
      errors.csr_registration_number = 'Form CSR-1 registration number is required when registered.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...legal,
        organisation_type: legal.organisation_type,
        registering_authority: legal.registering_authority.trim(),
        registration_number: legal.registration_number.trim(),
        darpan_id: legal.darpan_id.trim(),
        pan_number: legal.pan_number.toUpperCase().trim(),
        registration_state: legal.registration_state?.trim() || 'Gujarat',
        chief_trustee_name: legal.chief_trustee_name.trim(),
        chief_trustee_designation: legal.chief_trustee_designation.trim(),
        has_10_23c: Boolean(legal.has_10_23c),
        ten_23c_subclause: legal.ten_23c_subclause?.trim() || '',
        ten_23c_order_number: legal.ten_23c_order_number?.trim() || '',
        has_12a: Boolean(legal.has_12a),
        twelve_a_number: legal.twelve_a_number?.trim() || '',
        has_80g: Boolean(legal.has_80g),
        eighty_g_number: legal.eighty_g_number?.trim() || '',
        has_fcra: Boolean(legal.has_fcra),
        fcra_number: legal.fcra_number?.trim() || '',
        has_csr_1: Boolean(legal.has_csr_1),
        csr_registration_number: legal.csr_registration_number ? legal.csr_registration_number.toUpperCase().trim() : '',
        csr_registration_date: legal.csr_registration_date || null,
      };
      await saveNgoLegalInfo(payload, hasLegal);
      setHasLegal(true);
      setStep(4);
    } catch (err) {
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setGlobalError(err.message || 'Failed to save legal information.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Save Step 4 (Bank Info)
  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    setSaving(true);
    setFieldErrors({});
    setGlobalError('');

    try {
      const payload = {
        account_holder_name: bank.account_holder_name,
        ifsc_code: bank.ifsc_code.toUpperCase().trim(),
        bank_name: bank.bank_name,
        branch_name: bank.branch_name,
        account_type: bank.account_type,
      };

      // Only send account_number if entered by user
      if (bank.account_number.trim()) {
        payload.account_number = bank.account_number.trim();
      }

      const res = await saveNgoBankInfo(payload, hasBank);
      setHasBank(true);
      setBank(prev => ({
        ...prev,
        account_number: '',
        masked_account_number: res.account_number || prev.masked_account_number,
      }));
      setStep(5);
    } catch (err) {
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setGlobalError(err.message || 'Failed to save bank information.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Save Leader (Step 5)
  const handleSaveLeader = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    setSaving(true);
    setFieldErrors({});
    setGlobalError('');

    try {
      if (editingLeaderId) {
        await updateNgoLeader(editingLeaderId, leaderForm);
      } else {
        await createNgoLeader(leaderForm);
      }

      setLeaderForm({
        full_name: '',
        designation: '',
        phone: '',
        email: '',
        is_primary_contact: false,
      });
      setEditingLeaderId(null);

      // Refresh leader list
      const list = await getNgoLeadership();
      setLeaders(list);
    } catch (err) {
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setGlobalError(err.message || 'Failed to save leader.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Deactivate Leader (Step 5)
  const handleDeleteLeader = async (id) => {
    if (isLocked) return;
    if (!window.confirm('Are you sure you want to deactivate this leader record?')) return;
    setSaving(true);
    try {
      await deleteNgoLeader(id);
      const list = await getNgoLeadership();
      setLeaders(list);
    } catch (err) {
      setGlobalError(err.message || 'Failed to deactivate leader.');
    } finally {
      setSaving(false);
    }
  };

  // Upload Document (Step 6)
  const handleFileUpload = async (docType, file) => {
    if (isLocked || !file) return;
    setUploadingDocType(docType);
    setGlobalError('');
    setFieldErrors({});

    try {
      const formData = new FormData();
      formData.append('document_type', docType);
      formData.append('file', file);

      await uploadNgoDocument(formData);
      const docList = await getNgoDocuments();
      setDocuments(docList);
    } catch (err) {
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setGlobalError(err.message || `Failed to upload ${docType} document.`);
      }
    } finally {
      setUploadingDocType('');
    }
  };

  // Deactivate Document (Step 6)
  const handleDeleteDoc = async (id) => {
    if (isLocked) return;
    if (!window.confirm('Deactivate this document version?')) return;
    try {
      await deleteNgoDocument(id);
      const docList = await getNgoDocuments();
      setDocuments(docList);
    } catch (err) {
      setGlobalError(err.message || 'Failed to deactivate document.');
    }
  };

  // Download Document (Step 6)
  const handleDownloadDoc = async (id) => {
    try {
      await downloadNgoDocumentFile(id);
    } catch (err) {
      setGlobalError(err.message || 'Failed to download document.');
    }
  };

  // Final Submit Application
  const handleSubmitApplication = async () => {
    if (isLocked) return;
    setSaving(true);
    setGlobalError('');
    setSubmissionErrors(null);

    try {
      const response = await submitNgoApplication();
      setNgoStatus(response.status || 'SUBMITTED');
      setIsLocked(true);
      setSubmittedSuccess(true);
    } catch (err) {
      if (err.status === 400 && err.data?.errors) {
        setSubmissionErrors(err.data.errors);
      } else if (err.status === 409) {
        setGlobalError('Application has already been submitted or is currently under review.');
        setIsLocked(true);
      } else {
        setGlobalError(err.message || 'Submission failed. Please verify all sections.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Helper render for error messages
  const renderFieldError = (field) => {
    if (!fieldErrors[field]) return null;
    const msg = Array.isArray(fieldErrors[field]) ? fieldErrors[field].join(' ') : fieldErrors[field];
    return <p className="text-xs text-red-500 mt-1 font-medium">{msg}</p>;
  };

  if (loading) {
    return (
      <NgoLayout>
        <div className="py-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-slate-900 animate-spin">progress_activity</span>
            <p className="text-sm font-semibold text-slate-600">Loading NGO Application Data from Server...</p>
          </div>
        </div>
      </NgoLayout>
    );
  }

  if (submittedSuccess || (isLocked && step === 7)) {
    const isApprovedState = ngoStatus === 'APPROVED';
    const isUnderReviewState = ngoStatus === 'UNDER_REVIEW';
    const isRejectedState = ngoStatus === 'REJECTED';
    const isSuspendedState = ngoStatus === 'SUSPENDED';

    return (
      <NgoLayout>
        <div className="py-8 flex items-center justify-center">
          <div className="max-w-xl w-full mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto shadow-sm ${
              isApprovedState ? 'bg-emerald-100 text-emerald-700' :
              isUnderReviewState ? 'bg-purple-100 text-purple-700' :
              isRejectedState || isSuspendedState ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              <span className="material-symbols-outlined text-3xl">
                {isApprovedState ? 'verified' : isUnderReviewState ? 'find_in_page' : isRejectedState || isSuspendedState ? 'error' : 'task_alt'}
              </span>
            </div>

            <div className="space-y-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                isApprovedState ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                isUnderReviewState ? 'bg-purple-50 text-purple-800 border-purple-300' :
                isRejectedState || isSuspendedState ? 'bg-red-50 text-red-800 border-red-300' :
                'bg-blue-50 text-blue-800 border-blue-300'
              }`}>
                {isApprovedState ? 'VERIFICATION COMPLETE' : `STATUS: ${ngoStatus}`}
              </span>

              <h1 className="text-2xl font-bold text-slate-900">
                {isApprovedState ? 'Verification Complete' :
                 isUnderReviewState ? 'Application Under Active Audit' :
                 isRejectedState ? 'Application Review Decision: Rejected' :
                 isSuspendedState ? 'NGO Account Suspended' :
                 'Application Submitted Successfully'}
              </h1>

              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
                {isApprovedState ? 'Your NGO application has been reviewed and approved by state administrators.' :
                 isUnderReviewState ? 'State administrators are currently auditing your legal certificates, registration details, and bank records.' :
                 isRejectedState ? 'Your NGO application was not approved during administrative verification.' :
                 isSuspendedState ? 'Your NGO profile is currently suspended by state inspectors.' :
                 'Your NGO application is locked and awaiting administrative audit by state inspectors.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Organization:</span>
                <span className="font-bold text-slate-900">{profile.display_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Darpan ID:</span>
                <span className="font-mono text-slate-900">{legal.darpan_id || (isApprovedState ? 'Verified' : 'Submitted')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Compliance Notice:</span>
                <span className={`font-semibold ${isApprovedState ? 'text-emerald-700 font-bold' : 'text-amber-700'}`}>
                  {isApprovedState
                    ? 'Verified & Locked while active'
                    : isUnderReviewState
                    ? 'Form edits disabled during audit'
                    : 'Form edits read-only'}
                </span>
              </div>
              {isApprovedState && (
                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 leading-relaxed font-medium">
                  Your verified registration and compliance information is locked while your NGO remains active. If any verified information needs to change, it must go through the appropriate administrative correction/reopen process.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {isApprovedState && (
                <button
                  type="button"
                  onClick={() => navigate('/ngo/profile')}
                  className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-sm shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">domain</span>
                  View NGO Profile
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/ngo/dashboard')}
                className={`w-full py-3 font-bold rounded-xl transition-all text-sm shadow-xs ${
                  isApprovedState
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                Go to NGO Dashboard
              </button>
            </div>
          </div>
        </div>
      </NgoLayout>
    );
  }


  return (
    <NgoLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Locked Status Banner */}
        {isLocked && (
          <div className={`p-4 rounded-xl flex items-center justify-between gap-3 border ${
            ngoStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            ngoStatus === 'UNDER_REVIEW' ? 'bg-purple-50 border-purple-200 text-purple-800' :
            ngoStatus === 'REJECTED' || ngoStatus === 'SUSPENDED' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">
                {ngoStatus === 'APPROVED' ? 'verified' : ngoStatus === 'UNDER_REVIEW' ? 'find_in_page' : 'lock'}
              </span>
              <div className="text-xs">
                <span className="font-bold block">
                  {ngoStatus === 'APPROVED' ? 'NGO Verified & Approved' :
                   ngoStatus === 'UNDER_REVIEW' ? 'Application Under Active Review' :
                   ngoStatus === 'REJECTED' ? 'Application Rejected' :
                   ngoStatus === 'SUSPENDED' ? 'Account Suspended' :
                   `Application Submitted & Locked (${ngoStatus})`}
                </span>
                {ngoStatus === 'APPROVED'
                  ? 'Your NGO application has been approved and verified. Compliance registration details are locked while your profile is active.'
                  : ngoStatus === 'UNDER_REVIEW'
                  ? 'State administrators are currently auditing your legal certificates and bank records. Form editing is currently disabled.'
                  : ngoStatus === 'REJECTED'
                  ? 'Your NGO application was rejected during administrative verification. Form editing is read-only.'
                  : ngoStatus === 'SUSPENDED'
                  ? 'Your NGO profile is currently suspended. Registration details and platform operations are locked.'
                  : 'Your application has been submitted and is queued for administrative review. Form editing is currently disabled.'}
              </div>
            </div>

            {ngoStatus === 'APPROVED' && (
              <button
                type="button"
                onClick={() => navigate('/ngo/profile')}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">domain</span>
                View NGO Profile
              </button>
            )}
          </div>
        )}

          {/* Action Required / Corrections Requested Banner */}
          {ngoStatus === 'CORRECTION_REQUIRED' && (
            <div className="p-5 rounded-3xl bg-orange-50/90 dark:bg-orange-950/40 border-2 border-orange-300 dark:border-orange-800 text-orange-950 dark:text-orange-200 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-orange-600 text-2xl shrink-0 mt-0.5">
                    edit_note
                  </span>
                  <div>
                    <h2 className="text-sm font-extrabold text-orange-900 dark:text-orange-100">
                      Action Required: Corrections Requested by Reviewer
                    </h2>
                    <p className="text-xs text-orange-800 dark:text-orange-300 mt-0.5 leading-relaxed">
                      Your application was returned for updates. You may edit permitted registration sections, upload revised certificates, and resubmit.
                    </p>
                  </div>
                </div>

                {verificationHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 rounded-xl text-xs font-bold border border-orange-200 dark:border-orange-700 hover:bg-orange-200 transition-colors shrink-0"
                  >
                    View History ({verificationHistory.length})
                  </button>
                )}
              </div>

              {verificationData?.correction_instructions && (
                <div className="p-3.5 bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-orange-200 dark:border-orange-800 text-xs font-medium space-y-1">
                  <span className="font-bold text-orange-800 dark:text-orange-400 block text-[11px] uppercase tracking-wider">
                    Official Reviewer Instructions:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {verificationData.correction_instructions}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-orange-800 dark:text-orange-300 font-semibold pt-1 border-t border-orange-200/60 dark:border-orange-800/60">
                <span>
                  Resubmission Cycle: <strong>{verificationData?.resubmission_count ?? 0} of {verificationData?.resubmission_limit ?? 3}</strong> attempts
                </span>
                {verificationData?.resubmission_deadline && (
                  <span>
                    • Deadline: <strong>{verificationData.resubmission_deadline}</strong>
                  </span>
                )}
                {verificationData?.bank_correction_requested && (
                  <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-bold">
                    ✓ Bank Info Modification Permitted
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Rejection Decision Banner */}
          {ngoStatus === 'REJECTED' && (
            <div className="p-5 rounded-3xl bg-rose-50/90 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-rose-600 text-2xl shrink-0 mt-0.5">
                    cancel
                  </span>
                  <div>
                    <h2 className="text-sm font-extrabold text-rose-900 dark:text-rose-100">
                      Application Decision: Verification Rejected
                    </h2>
                    <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5 leading-relaxed">
                      Your organization application was not approved during statutory compliance review.
                    </p>
                  </div>
                </div>

                {verificationHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="px-3 py-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-700 hover:bg-rose-200 transition-colors shrink-0"
                  >
                    View History ({verificationHistory.length})
                  </button>
                )}
              </div>

              {verificationData?.rejection_reason && (
                <div className="p-3.5 bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-rose-200 dark:border-rose-800 text-xs font-medium space-y-1">
                  <span className="font-bold text-rose-800 dark:text-rose-400 block text-[11px] uppercase tracking-wider">
                    Rejection Grounds:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {verificationData.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Verification History Modal */}
          {showHistoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-surface-container-lowest max-w-lg w-full rounded-3xl border border-outline-variant/60 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">history</span>
                    <h3 className="text-base font-bold text-on-surface">Verification Review History</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(false)}
                    className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>

                <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                  {verificationHistory.length === 0 ? (
                    <p className="text-xs text-on-surface-variant text-center py-6">No prior review history recorded.</p>
                  ) : (
                    verificationHistory.map((item) => (
                      <div key={item.id} className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-on-surface">
                          <span>{item.previous_status} → {item.new_status}</span>
                          <span className="text-[10px] text-on-surface-variant font-normal">
                            {new Date(item.timestamp).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          By: <strong className="text-on-surface">{item.performed_by_email || 'Compliance Officer'}</strong> ({item.actor_type})
                        </div>
                        {item.reason && (
                          <div className="p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-on-surface font-medium whitespace-pre-line text-[11px] leading-relaxed">
                            {item.reason}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="w-full py-2.5 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-container transition-all cursor-pointer"
                >
                  Close History
                </button>
              </div>
            </div>
          )}

          {/* Global Error Banner */}
          {globalError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-300">
              <span className="material-symbols-outlined text-xl">error</span>
              <p className="text-xs font-semibold">{globalError}</p>
            </div>
          )}

          {/* Wizard Header / Navigation Stepper */}
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-2 min-w-max text-xs font-semibold text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              {[
                { s: 1, label: '1. Profile' },
                { s: 2, label: '2. Address' },
                { s: 3, label: '3. Legal' },
                { s: 4, label: '4. Bank' },
                { s: 5, label: '5. Leaders' },
                { s: 6, label: '6. Docs' },
                { s: 7, label: '7. Submit' },
              ].map(({ s, label }) => (
                <button
                  key={s}
                  onClick={() => setStep(s)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    step === s
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : step > s
                      ? 'text-emerald-700 bg-emerald-50 font-semibold border border-emerald-200'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* STEP 1: NGO PROFILE */}
          {/* ----------------------------------------------------------------- */}
          {step === 1 && (
            <form onSubmit={handleSaveProfile} className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 space-y-6">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">domain</span>
                Step 1: NGO Profile Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Legal Registered Name *</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    placeholder="e.g. Shree Seva Educational Trust"
                    value={profile.legal_name}
                    onChange={(e) => setProfile({ ...profile, legal_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('legal_name')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Display Name *</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    placeholder="e.g. Shree Seva Foundation"
                    value={profile.display_name}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('display_name')}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Gujarati Name (for local transparency)</label>
                  <input
                    type="text"
                    disabled={isLocked}
                    placeholder="શ્રી સેવા ફાઉન્ડેશન"
                    value={profile.gujarati_name}
                    onChange={(e) => setProfile({ ...profile, gujarati_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('gujarati_name')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Primary Category *</label>
                  <select
                    required
                    disabled={isLocked}
                    value={profile.category}
                    onChange={(e) => setProfile({ ...profile, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  >
                    <option value="EDUCATION">Education & Literacy</option>
                    <option value="HEALTHCARE">Healthcare & Medical Relief</option>
                    <option value="RURAL_DEV">Rural Development</option>
                    <option value="WOMEN_EMPOWERMENT">Women Empowerment</option>
                    <option value="ENVIRONMENT">Environment & Animal Care</option>
                    <option value="DISASTER_RELIEF">Disaster Relief</option>
                    <option value="OTHER">Other Social Welfare</option>
                  </select>
                  {renderFieldError('category')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Organization Overview / Description (min 50 characters) *</label>
                <textarea
                  required
                  rows={4}
                  disabled={isLocked}
                  placeholder="Detailed description of your NGO's initiatives, target demographics, and impact..."
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                />
                {renderFieldError('description')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Year Established *</label>
                  <input
                    type="number"
                    required
                    disabled={isLocked}
                    placeholder="e.g. 2012"
                    value={profile.year_established}
                    onChange={(e) => setProfile({ ...profile, year_established: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('year_established')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    disabled={isLocked}
                    placeholder="contact@ngotrust.org"
                    value={profile.official_email}
                    onChange={(e) => setProfile({ ...profile, official_email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('official_email')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Official Phone *</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    placeholder="+919876543210"
                    value={profile.official_phone}
                    onChange={(e) => setProfile({ ...profile, official_phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('official_phone')}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-outline-variant/40">
                <button
                  type="submit"
                  disabled={saving || isLocked}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container transition-all text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving Profile...' : 'Save & Continue to Address'}
                </button>
              </div>
            </form>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* STEP 2: NGO ADDRESS */}
          {/* ----------------------------------------------------------------- */}
          {step === 2 && (
            <form onSubmit={handleSaveAddress} className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 space-y-6">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                Step 2: Registered Address & Location
              </h2>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  required
                  disabled={isLocked}
                  placeholder="Building / Street Address"
                  value={address.address_line1}
                  onChange={(e) => setAddress({ ...address, address_line1: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                />
                {renderFieldError('address_line1')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">City / Taluka *</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    placeholder="e.g. Ahmedabad"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('city')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">District *</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    placeholder="e.g. Ahmedabad District"
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('district')}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">State *</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('state')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    placeholder="380001"
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('pincode')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Operational Service Areas (Districts / Blocks)</label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="e.g. Sanand, Dholka, Viramgam"
                  value={address.service_areas}
                  onChange={(e) => setAddress({ ...address, service_areas: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                />
                {renderFieldError('service_areas')}
              </div>

              <div className="flex justify-between pt-4 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-on-surface-variant font-semibold text-sm hover:text-on-surface"
                >
                  Previous Step
                </button>

                <button
                  type="submit"
                  disabled={saving || isLocked}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container transition-all text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving Address...' : 'Save & Continue to Legal Info'}
                </button>
              </div>
            </form>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* STEP 3: LEGAL INFORMATION */}
          {/* ----------------------------------------------------------------- */}
          {step === 3 && (
            <form onSubmit={handleSaveLegal} className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 space-y-6">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">gavel</span>
                Step 3: Legal & Registration Compliance
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Organisation Type *</label>
                  <select
                    required
                    disabled={isLocked}
                    value={legal.organisation_type}
                    onChange={(e) => setLegal({ ...legal, organisation_type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  >
                    <option value="TRUST">Public Charitable Trust</option>
                    <option value="SOCIETY">Registered Society</option>
                    <option value="SECTION_8">Section 8 Non-Profit Company</option>
                    <option value="NPO">Not For Profit Organisation</option>
                    <option value="OTHER">Other Registered Non-Profit</option>
                  </select>
                  {renderFieldError('organisation_type')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">NGO Trust PAN Card Number *</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    placeholder="AAATT1234F"
                    value={legal.pan_number}
                    onChange={(e) => setLegal({ ...legal, pan_number: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-mono uppercase focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('pan_number')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Registering Authority *</label>
                <input
                  type="text"
                  required
                  disabled={isLocked}
                  placeholder="e.g. Charity Commissioner, Gujarat"
                  value={legal.registering_authority}
                  onChange={(e) => setLegal({ ...legal, registering_authority: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                />
                {renderFieldError('registering_authority')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Registration Number *</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    placeholder="e.g. E/12345/Ahmedabad"
                    value={legal.registration_number}
                    onChange={(e) => setLegal({ ...legal, registration_number: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('registration_number')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">NITI Aayog Darpan ID *</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    placeholder="e.g. GJ/2018/0091234"
                    value={legal.darpan_id}
                    onChange={(e) => setLegal({ ...legal, darpan_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('darpan_id')}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Chief Trustee / Authorized Head Name *</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    placeholder="e.g. Rameshchandra M. Patel"
                    value={legal.chief_trustee_name}
                    onChange={(e) => setLegal({ ...legal, chief_trustee_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('chief_trustee_name')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Chief Trustee / Authorized Head Designation *</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    placeholder="e.g. Managing Trustee / President / Secretary"
                    value={legal.chief_trustee_designation}
                    onChange={(e) => setLegal({ ...legal, chief_trustee_designation: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('chief_trustee_designation')}
                </div>
              </div>

              {/* Tax Exemption Checks */}
              <div className="p-4 bg-surface-container-low rounded-2xl space-y-4 border border-outline-variant/40">
                <span className="text-xs font-bold text-on-surface block uppercase tracking-wider">Tax Exemption Certificates</span>

                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isLocked}
                      checked={legal.has_10_23c}
                      onChange={(e) => setLegal({ ...legal, has_10_23c: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    Has Section 10(23C) Exemption
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isLocked}
                      checked={legal.has_12a}
                      onChange={(e) => setLegal({ ...legal, has_12a: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    Has 12A Certificate
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isLocked}
                      checked={legal.has_80g}
                      onChange={(e) => setLegal({ ...legal, has_80g: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    Has 80G Tax Exemption
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isLocked}
                      checked={legal.has_fcra}
                      onChange={(e) => setLegal({ ...legal, has_fcra: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    Has FCRA Registration
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isLocked}
                      checked={legal.has_csr_1}
                      onChange={(e) => setLegal({ ...legal, has_csr_1: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    Has Form CSR-1 / CRN Registration
                  </label>
                </div>

                {legal.has_10_23c && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">Section 10(23C) Approval Order Number *</label>
                      <input
                        type="text"
                        required
                        disabled={isLocked}
                        placeholder="e.g. 10(23C)/AHM/2021-22/123"
                        value={legal.ten_23c_order_number}
                        onChange={(e) => setLegal({ ...legal, ten_23c_order_number: e.target.value })}
                        className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                      />
                      {renderFieldError('ten_23c_order_number')}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">Subclause (e.g. iv, v, vi, via)</label>
                      <input
                        type="text"
                        disabled={isLocked}
                        placeholder="e.g. iv or vi"
                        value={legal.ten_23c_subclause}
                        onChange={(e) => setLegal({ ...legal, ten_23c_subclause: e.target.value })}
                        className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                      />
                    </div>
                  </div>
                )}

                {legal.has_12a && (
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">12A Order Number *</label>
                    <input
                      type="text"
                      required
                      disabled={isLocked}
                      placeholder="12A Order / Registration No"
                      value={legal.twelve_a_number}
                      onChange={(e) => setLegal({ ...legal, twelve_a_number: e.target.value })}
                      className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-xs"
                    />
                    {renderFieldError('twelve_a_number')}
                  </div>
                )}

                {legal.has_80g && (
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">80G Order Number *</label>
                    <input
                      type="text"
                      required
                      disabled={isLocked}
                      placeholder="80G Approval Order No"
                      value={legal.eighty_g_number}
                      onChange={(e) => setLegal({ ...legal, eighty_g_number: e.target.value })}
                      className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-xs"
                    />
                    {renderFieldError('eighty_g_number')}
                  </div>
                )}

                {legal.has_fcra && (
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">FCRA Registration Number *</label>
                    <input
                      type="text"
                      required
                      disabled={isLocked}
                      placeholder="FCRA Reg No"
                      value={legal.fcra_number}
                      onChange={(e) => setLegal({ ...legal, fcra_number: e.target.value })}
                      className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-xs"
                    />
                    {renderFieldError('fcra_number')}
                  </div>
                )}

                {legal.has_csr_1 && (
                  <div className="space-y-3 pt-2 border-t border-outline-variant/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">Form CSR-1 / CRN Registration Number *</label>
                        <input
                          type="text"
                          required
                          disabled={isLocked}
                          placeholder="e.g. CSR00012345"
                          value={legal.csr_registration_number}
                          onChange={(e) => setLegal({ ...legal, csr_registration_number: e.target.value })}
                          className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-xs font-mono uppercase"
                        />
                        {renderFieldError('csr_registration_number')}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-1">CSR-1 Registration Date (Optional)</label>
                        <input
                          type="date"
                          disabled={isLocked}
                          value={legal.csr_registration_date || ''}
                          onChange={(e) => setLegal({ ...legal, csr_registration_date: e.target.value })}
                          className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-xs"
                        />
                        {renderFieldError('csr_registration_date')}
                      </div>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      Ministry of Corporate Affairs (MCA) registration number required for corporate CSR funding and CSR Connect participation under Section 135.
                    </p>
                    {legal.organisation_type === 'OTHER' && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        Note: Under MCA Rules, Form CSR-1 is applicable to Registered Public Trusts, Registered Societies, and Section 8 Companies possessing valid 12A and 80G registrations.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 text-on-surface-variant font-semibold text-sm hover:text-on-surface"
                >
                  Previous Step
                </button>

                <button
                  type="submit"
                  disabled={saving || isLocked}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container transition-all text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving Legal Info...' : 'Save & Continue to Bank Info'}
                </button>
              </div>
            </form>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* STEP 4: BANK INFORMATION */}
          {/* ----------------------------------------------------------------- */}
          {step === 4 && (
            <form onSubmit={handleSaveBank} className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 space-y-6">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">account_balance</span>
                Step 4: Bank Account Information
              </h2>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                Bank information is strictly encrypted and used for administrative donation disbursement verification. Full account numbers are never exposed in responses.
              </p>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  disabled={isLocked}
                  placeholder="Account holder name (must match NGO legal name)"
                  value={bank.account_holder_name}
                  onChange={(e) => setBank({ ...bank, account_holder_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                />
                {renderFieldError('account_holder_name')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Bank Account Number {hasBank ? '(Leave blank to keep existing)' : '*'}
                  </label>
                  <input
                    type="password"
                    required={!hasBank}
                    disabled={isLocked}
                    placeholder={bank.masked_account_number ? `Existing: ${bank.masked_account_number}` : 'Enter 9-20 digit account number'}
                    value={bank.account_number}
                    onChange={(e) => setBank({ ...bank, account_number: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-mono focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {bank.masked_account_number && (
                    <span className="text-xs text-on-surface-variant mt-1 block">Current: {bank.masked_account_number}</span>
                  )}
                  {renderFieldError('account_number')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    placeholder="SBIN0001234"
                    value={bank.ifsc_code}
                    onChange={(e) => setBank({ ...bank, ifsc_code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-mono uppercase focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('ifsc_code')}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    placeholder="e.g. State Bank of India"
                    value={bank.bank_name}
                    onChange={(e) => setBank({ ...bank, bank_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('bank_name')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Branch Name</label>
                  <input
                    type="text"
                    disabled={isLocked}
                    placeholder="Branch name"
                    value={bank.branch_name}
                    onChange={(e) => setBank({ ...bank, branch_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                  {renderFieldError('branch_name')}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Account Type *</label>
                  <select
                    required
                    disabled={isLocked}
                    value={bank.account_type}
                    onChange={(e) => setBank({ ...bank, account_type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                  >
                    <option value="SAVINGS">Savings Account</option>
                    <option value="CURRENT">Current Account</option>
                    <option value="ESCROW">Escrow Account</option>
                  </select>
                  {renderFieldError('account_type')}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 text-on-surface-variant font-semibold text-sm hover:text-on-surface"
                >
                  Previous Step
                </button>

                <button
                  type="submit"
                  disabled={saving || isLocked}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container transition-all text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving Bank Details...' : 'Save & Continue to Leadership'}
                </button>
              </div>
            </form>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* STEP 5: LEADERSHIP & TRUSTEES */}
          {/* ----------------------------------------------------------------- */}
          {step === 5 && (
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 space-y-6">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">groups</span>
                Step 5: Leadership & Trustees Roster
              </h2>

              {/* Leader List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-on-surface block uppercase tracking-wider">Active Trustees & Leaders ({leaders.length})</span>

                {leaders.length === 0 ? (
                  <p className="text-xs text-on-surface-variant p-4 bg-surface-container-low rounded-2xl text-center">
                    No active leadership records added yet. At least 1 leader and 1 primary contact required.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {leaders.map((leader) => (
                      <div key={leader.id} className="p-4 bg-surface-container-low rounded-2xl flex items-center justify-between border border-outline-variant/40">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-on-surface">{leader.full_name}</span>
                            {leader.is_primary_contact && (
                              <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-[10px] rounded-full border border-primary/30">
                                Primary Contact
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant">{leader.designation} • {leader.phone}</p>
                        </div>

                        {!isLocked && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLeaderId(leader.id);
                                setLeaderForm({
                                  full_name: leader.full_name,
                                  designation: leader.designation,
                                  phone: leader.phone,
                                  email: leader.email,
                                  is_primary_contact: leader.is_primary_contact,
                                });
                              }}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-lg text-xs font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLeader(leader.id)}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-semibold"
                            >
                              Deactivate
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leader Form */}
              {!isLocked && (
                <form onSubmit={handleSaveLeader} className="p-6 bg-surface-container-low rounded-2xl space-y-4 border border-outline-variant/40">
                  <h3 className="text-sm font-bold text-on-surface">
                    {editingLeaderId ? 'Edit Trustee / Leader' : 'Add New Trustee / Leader'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Trustee full name"
                        value={leaderForm.full_name}
                        onChange={(e) => setLeaderForm({ ...leaderForm, full_name: e.target.value })}
                        className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-xs"
                      />
                      {renderFieldError('full_name')}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">Designation *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Managing Trustee / Secretary"
                        value={leaderForm.designation}
                        onChange={(e) => setLeaderForm({ ...leaderForm, designation: e.target.value })}
                        className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-xs"
                      />
                      {renderFieldError('designation')}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="+919876543210"
                        value={leaderForm.phone}
                        onChange={(e) => setLeaderForm({ ...leaderForm, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-xs"
                      />
                      {renderFieldError('phone')}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="leader@ngotrust.org"
                        value={leaderForm.email}
                        onChange={(e) => setLeaderForm({ ...leaderForm, email: e.target.value })}
                        className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-xs"
                      />
                      {renderFieldError('email')}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={leaderForm.is_primary_contact}
                      onChange={(e) => setLeaderForm({ ...leaderForm, is_primary_contact: e.target.checked })}
                      className="rounded text-primary"
                    />
                    Designate as Primary Contact for Admin Communication
                  </label>

                  <div className="flex justify-end gap-2 pt-2">
                    {editingLeaderId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLeaderId(null);
                          setLeaderForm({ full_name: '', designation: '', phone: '', email: '', is_primary_contact: false });
                        }}
                        className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 bg-primary text-white font-semibold rounded-xl text-xs hover:bg-primary-container"
                    >
                      {saving ? 'Saving Leader...' : editingLeaderId ? 'Update Leader' : 'Add Leader to Roster'}
                    </button>
                  </div>
                </form>
              )}

              <div className="flex justify-between pt-4 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-3 text-on-surface-variant font-semibold text-sm hover:text-on-surface"
                >
                  Previous Step
                </button>

                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container transition-all text-sm"
                >
                  Continue to Documents
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* STEP 6: DOCUMENTS */}
          {/* ----------------------------------------------------------------- */}
          {step === 6 && (
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 space-y-6">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">upload_file</span>
                Step 6: Upload Verification Documents
              </h2>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                Upload clear PDF or Image (JPEG/PNG) proof files. Uploading a document type again replaces the previous active version automatically.
              </p>

              <div className="space-y-4">
                {[
                  ...BASE_REQUIRED_DOC_TYPES,
                  ...(legal.has_10_23c || documents.some(d => d.document_type === 'TEN_23C_CERT' && d.is_active)
                    ? [{ type: 'TEN_23C_CERT', label: 'Section 10(23C) Order / Notification' }]
                    : []),
                  ...(legal.has_12a || documents.some(d => d.document_type === 'TWELVE_A_CERT' && d.is_active)
                    ? [{ type: 'TWELVE_A_CERT', label: '12A Order / Certificate' }]
                    : []),
                  ...(legal.has_80g || documents.some(d => d.document_type === 'EIGHTY_G_CERT' && d.is_active)
                    ? [{ type: 'EIGHTY_G_CERT', label: '80G Approval Order' }]
                    : []),
                  ...(legal.has_fcra || documents.some(d => d.document_type === 'FCRA_CERT' && d.is_active)
                    ? [{ type: 'FCRA_CERT', label: 'FCRA Registration Certificate' }]
                    : []),
                  ...(legal.has_csr_1 || documents.some(d => d.document_type === 'CSR_1_CERT' && d.is_active)
                    ? [{ type: 'CSR_1_CERT', label: 'Form CSR-1 / CRN Registration Certificate' }]
                    : []),
                ].map(({ type, label }) => {
                  const activeDoc = documents.find(d => d.document_type === type && d.is_active);
                  const isUploading = uploadingDocType === type;
                  const isConditional = ['TEN_23C_CERT', 'TWELVE_A_CERT', 'EIGHTY_G_CERT', 'FCRA_CERT', 'CSR_1_CERT'].includes(type);
                  const isClaimed = (
                    (type === 'TEN_23C_CERT' && legal.has_10_23c) ||
                    (type === 'TWELVE_A_CERT' && legal.has_12a) ||
                    (type === 'EIGHTY_G_CERT' && legal.has_80g) ||
                    (type === 'FCRA_CERT' && legal.has_fcra) ||
                    (type === 'CSR_1_CERT' && legal.has_csr_1)
                  );

                  return (
                    <div key={type} className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-on-surface">{label}</span>
                          {activeDoc ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                              Uploaded ({activeDoc.original_filename})
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${isConditional && !isClaimed ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                              {isConditional && !isClaimed ? 'Optional' : 'Required'}
                            </span>
                          )}
                        </div>
                        {activeDoc && (
                          <p className="text-[11px] text-on-surface-variant">
                            Uploaded: {new Date(activeDoc.created_at).toLocaleDateString()} • Size: {Math.round(activeDoc.file_size_bytes / 1024)} KB
                          </p>
                        )}
                      </div>

                      {!isLocked && (
                        <div className="flex items-center gap-2">
                          {activeDoc && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDownloadDoc(activeDoc.id)}
                                className="px-3 py-1.5 bg-surface-container text-primary font-semibold text-xs rounded-xl hover:bg-surface-container-high"
                              >
                                Download
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDoc(activeDoc.id)}
                                className="px-3 py-1.5 text-red-500 font-semibold text-xs hover:bg-red-500/10 rounded-xl"
                              >
                                Remove
                              </button>
                            </>
                          )}

                          <label className={`px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl cursor-pointer hover:bg-primary-container ${isUploading ? 'opacity-50' : ''}`}>
                            {isUploading ? 'Uploading...' : activeDoc ? 'Replace File' : 'Upload File'}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              disabled={isUploading || isLocked}
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleFileUpload(type, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-6 py-3 text-on-surface-variant font-semibold text-sm hover:text-on-surface"
                >
                  Previous Step
                </button>

                <button
                  type="button"
                  onClick={() => setStep(7)}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container transition-all text-sm"
                >
                  Review & Final Submission
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* STEP 7: REVIEW & SUBMIT */}
          {/* ----------------------------------------------------------------- */}
          {step === 7 && (
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/60 space-y-6">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">fact_check</span>
                Step 7: Application Completeness Review
              </h2>

              {/* Submission Errors */}
              {submissionErrors && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-2 text-red-700 dark:text-red-300 text-xs">
                  <span className="font-bold block text-sm">Application Incomplete — Please Fix Required Sections:</span>
                  {Object.entries(submissionErrors).map(([section, errList]) => (
                    <div key={section}>
                      <span className="font-bold uppercase tracking-wider">{section}:</span>
                      <ul className="list-disc list-inside pl-2">
                        {Array.isArray(errList) && errList.map((msg, i) => <li key={i}>{msg}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-1">
                  <span className="font-bold text-primary uppercase tracking-wider block">1. Profile</span>
                  <p className="font-semibold text-on-surface">{profile.display_name || 'Incomplete'}</p>
                  <p className="text-on-surface-variant">{profile.category} • Estd: {profile.year_established}</p>
                </div>

                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-1">
                  <span className="font-bold text-primary uppercase tracking-wider block">2. Address</span>
                  <p className="font-semibold text-on-surface">{address.city}, {address.district}</p>
                  <p className="text-on-surface-variant">{address.state} - {address.pincode}</p>
                </div>

                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-1">
                  <span className="font-bold text-primary uppercase tracking-wider block">3. Legal</span>
                  <p className="font-semibold text-on-surface">PAN: {legal.pan_number || 'Missing'}</p>
                  <p className="text-on-surface-variant">Darpan: {legal.darpan_id || 'N/A'}</p>
                  <p className="text-on-surface-variant">
                    CSR-1: {legal.has_csr_1 ? (legal.csr_registration_number || 'Registered') : 'Not Registered'}
                  </p>
                </div>

                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-1">
                  <span className="font-bold text-primary uppercase tracking-wider block">4. Bank</span>
                  <p className="font-semibold text-on-surface">{bank.bank_name || 'Incomplete'}</p>
                  <p className="text-on-surface-variant">IFSC: {bank.ifsc_code} • {bank.masked_account_number}</p>
                </div>

                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-1">
                  <span className="font-bold text-primary uppercase tracking-wider block">5. Leadership</span>
                  <p className="font-semibold text-on-surface">{leaders.length} Active Leader(s)</p>
                  <p className="text-on-surface-variant">Primary: {leaders.find(l => l.is_primary_contact)?.full_name || 'None'}</p>
                </div>

                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-1">
                  <span className="font-bold text-primary uppercase tracking-wider block">6. Documents</span>
                  <p className="font-semibold text-on-surface">{documents.filter(d => d.is_active).length} Active File(s)</p>
                </div>
              </div>

              <div className={`p-4 rounded-2xl text-xs space-y-1 border ${
                ngoStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                ngoStatus === 'UNDER_REVIEW' ? 'bg-purple-50 border-purple-200 text-purple-900' :
                ngoStatus === 'SUBMITTED' ? 'bg-blue-50 border-blue-200 text-blue-900' :
                'bg-primary/10 border-primary/30 text-on-surface'
              }`}>
                <span className="font-bold block">
                  {ngoStatus === 'APPROVED' ? 'Verification Status & Compliance:' :
                   ngoStatus === 'UNDER_REVIEW' ? 'Audit In Progress:' :
                   ngoStatus === 'SUBMITTED' ? 'Application Submitted:' :
                   'Submission Commitment:'}
                </span>
                <p className="text-on-surface-variant leading-relaxed font-medium">
                  {ngoStatus === 'APPROVED'
                    ? 'Your verified registration and compliance information is locked while your NGO remains active. If any verified information needs to change, it must go through the appropriate administrative correction/reopen process.'
                    : ngoStatus === 'UNDER_REVIEW'
                    ? 'State inspectors are actively auditing your uploaded trust deeds, legal certificates, and bank account proofs.'
                    : ngoStatus === 'SUBMITTED'
                    ? 'Your application has been submitted and is locked while awaiting state administrative review.'
                    : 'By clicking Submit, your application will transition to SUBMITTED and will be locked from further edits while state admin inspectors verify your documents.'}
                </p>
              </div>

              <div className="flex justify-between pt-4 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="px-6 py-3 text-on-surface-variant font-semibold text-sm hover:text-on-surface"
                >
                  Previous Step
                </button>

                {isLocked ? (
                  <button
                    type="button"
                    onClick={() => navigate('/ngo/dashboard')}
                    className="px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-all text-sm shadow-md"
                  >
                    Return to NGO Portal Dashboard
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitApplication}
                    disabled={saving}
                    className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-sm shadow-md disabled:opacity-50"
                  >
                    {saving ? 'Submitting Application...' : 'Submit Application for Admin Audit'}
                  </button>
                )}
              </div>

            </div>
          )}

        </div>
      </NgoLayout>
    );
  }

