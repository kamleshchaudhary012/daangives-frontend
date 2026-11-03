import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NgoLayout from '../../layouts/NgoLayout';
import AvatarImage from '../../components/common/AvatarImage';
import {
  getNgoProfile,
  getNgoAddress,
  getNgoLegalInfo,
  getNgoBankInfo,
  getNgoLeadership,
  getNgoDocuments,
  uploadNgoLogo,
  removeNgoLogo,
  downloadNgoDocumentFile,
} from '../../services/api';

const DOC_TYPE_LABELS = {
  TRUST_DEED: 'Trust Deed / MoA / Bye-Laws',
  REGISTRATION_CERT: 'Registration Certificate',
  PAN_CARD: 'NGO PAN Card',
  DARPAN_CERTIFICATE: 'NITI Aayog Darpan Certificate',
  TWELVE_A_CERT: '12A Order / Certificate',
  EIGHTY_G_CERT: '80G Approval Order',
  CSR_1_CERT: 'Form CSR-1 Registration Certificate',
  AUDITED_FINANCIALS: 'Audited Financial Statements',
  BANK_PASSBOOK: 'Bank Passbook / Statement Cover',
  CANCELLED_CHEQUE: 'Cancelled Cheque',
  REPRESENTATIVE_ID: 'Authorized Representative ID Proof',
};

export default function NgoProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [address, setAddress] = useState(null);
  const [legal, setLegal] = useState(null);
  const [bank, setBank] = useState(null);
  const [leadership, setLeadership] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const logoInputRef = useRef(null);

  // Document download state
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const profData = await getNgoProfile();

        if (!isMounted) return;

        // If no profile exists or status is DRAFT (incomplete registration):
        // Open the existing registration wizard to continue saved progress
        if (!profData || profData.status === 'DRAFT') {
          navigate('/ngo/registration-flow', { replace: true });
          return;
        }

        setProfile(profData);
        setAddress(profData.address || null);
        setLegal(profData.legal_info || null);
        setBank(profData.bank_info || null);
        setLeadership(Array.isArray(profData.leadership) ? profData.leadership : []);
        setDocuments(Array.isArray(profData.documents) ? profData.documents : []);
      } catch (err) {
        if (!isMounted) return;
        if (err?.status === 404) {
          navigate('/ngo/registration-flow', { replace: true });
          return;
        }
        setError(err?.message || 'Failed to load NGO profile data. Please refresh and try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setLogoError('');
    setSuccessMsg('');

    try {
      const res = await uploadNgoLogo(file);
      const updatedProfile = res?.profile || res;
      setProfile((prev) => ({
        ...prev,
        logo: updatedProfile?.logo || URL.createObjectURL(file),
      }));
      setSuccessMsg('Organization logo updated successfully.');
    } catch (err) {
      setLogoError(err?.data?.logo?.[0] || err?.message || 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!profile?.logo) return;
    setUploadingLogo(true);
    setLogoError('');
    setSuccessMsg('');

    try {
      await removeNgoLogo();
      setProfile((prev) => ({ ...prev, logo: null }));
      setSuccessMsg('Organization logo removed successfully.');
    } catch (err) {
      setLogoError(err?.message || 'Failed to remove logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDownloadDoc = async (docId, fileName) => {
    setDownloadingDocId(docId);
    try {
      await downloadNgoDocumentFile(docId);
    } catch (err) {
      setError(`Failed to download ${fileName || 'document'}: ${err?.message || 'Network error'}`);
    } finally {
      setDownloadingDocId(null);
    }
  };

  if (loading) {
    return (
      <NgoLayout>
        <div className="py-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-slate-900 animate-spin" aria-hidden="true">
              progress_activity
            </span>
            <p className="text-sm font-semibold text-slate-600">Loading organization profile...</p>
          </div>
        </div>
      </NgoLayout>
    );
  }

  if (!profile) {
    return null;
  }

  const status = profile.status || 'DRAFT';
  const isApproved = status === 'APPROVED';
  const isPendingReview = status === 'SUBMITTED' || status === 'UNDER_REVIEW';
  const isCorrectionRequired = status === 'CORRECTION_REQUIRED';
  const isRejected = status === 'REJECTED';
  const isSuspended = status === 'SUSPENDED';

  // Check profile completeness for approved organizations
  const hasBasic = Boolean(profile.legal_name || profile.display_name);
  const hasAddr = Boolean(address?.city && address?.state);
  const hasLeg = Boolean(legal?.registration_number && legal?.darpan_id);
  const hasBnk = Boolean(bank?.bank_name || bank?.account_number_masked);
  const isGenuinelyIncomplete = isApproved && (!hasBasic || !hasAddr || !hasLeg || !hasBnk);

  const missingSections = [];
  if (!hasBasic) missingSections.push('Basic Organization Information');
  if (!hasAddr) missingSections.push('Registered Office Address');
  if (!hasLeg) missingSections.push('Statutory Registration & Darpan ID');
  if (!hasBnk) missingSections.push('Disbursement Bank Account');

  return (
    <NgoLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Error / Success Notifications */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-rose-800 text-xs font-medium">
            <span className="material-symbols-outlined text-lg text-rose-600" aria-hidden="true">error</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-medium">
            <span className="material-symbols-outlined text-base text-emerald-600" aria-hidden="true">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {logoError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-medium">
            <span className="material-symbols-outlined text-base text-rose-600" aria-hidden="true">error</span>
            <span>{logoError}</span>
          </div>
        )}

        {/* STATUS BANNERS */}

        {/* 1. Pending Review Banner */}
        {isPendingReview && (
          <div className="p-5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-purple-700 text-2xl shrink-0 mt-0.5">
                  find_in_page
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300">
                      {status === 'UNDER_REVIEW' ? 'Active Review' : 'Submitted & Queued'}
                    </span>
                    <h2 className="text-sm font-bold text-purple-900">
                      Application Pending State Administrative Verification
                    </h2>
                  </div>
                  <p className="text-xs text-purple-800 mt-1 leading-relaxed">
                    State compliance administrators are currently auditing your registered trust deeds, 12A/80G tax exemptions, and bank account credentials. All submitted data is locked from direct edits during this audit.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/ngo/registration-flow"
                  className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                >
                  View Submission Wizard
                </Link>
                <Link
                  to="/ngo/tickets"
                  className="px-3 py-2 bg-white text-purple-900 border border-purple-200 hover:bg-purple-50 rounded-lg text-xs font-medium transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 2. Correction Required Banner */}
        {isCorrectionRequired && (
          <div className="p-5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-orange-700 text-2xl shrink-0 mt-0.5">
                  edit_note
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-300">
                      Action Required
                    </span>
                    <h2 className="text-sm font-bold text-orange-900">
                      Reviewer Corrections Requested
                    </h2>
                  </div>
                  <p className="text-xs text-orange-800 mt-1 leading-relaxed">
                    The platform verification inspector requested updates on your application before approval can be granted.
                  </p>
                  {profile.verification?.correction_instructions && (
                    <div className="mt-2.5 p-3 bg-white rounded-lg border border-orange-200 text-xs text-slate-800 font-medium">
                      <span className="font-bold text-orange-800 block text-[11px] uppercase tracking-wider mb-1">
                        Reviewer Notes:
                      </span>
                      <p className="whitespace-pre-line leading-relaxed">{profile.verification.correction_instructions}</p>
                    </div>
                  )}
                </div>
              </div>

              <Link
                to="/ngo/registration-flow"
                className="px-4 py-2.5 bg-orange-700 hover:bg-orange-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs shrink-0 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Make Corrections & Resubmit
              </Link>
            </div>
          </div>
        )}

        {/* 3. Approved & Incomplete Warning Banner */}
        {isGenuinelyIncomplete && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-700 text-xl shrink-0 mt-0.5">warning</span>
              <div>
                <h3 className="font-bold text-sm text-amber-900">Approved — Incomplete Profile Information</h3>
                <p className="mt-1 text-slate-700 leading-relaxed">
                  Your organization account is approved, but the following required sections are incomplete:{' '}
                  <strong>{missingSections.join(', ')}</strong>. Under platform governance policy, fundraising campaigns and disbursements are restricted until these sections are completed.
                </p>
              </div>
            </div>
            <Link
              to="/ngo/registration-flow"
              className="px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
            >
              Complete Missing Sections
            </Link>
          </div>
        )}

        {/* 4. Rejection or Suspension Banner */}
        {isRejected && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-rose-700 text-xl shrink-0">cancel</span>
              <div>
                <h3 className="font-bold text-sm text-rose-900">Application Decision: Verification Rejected</h3>
                <p className="text-rose-800 mt-0.5">Your NGO application was not approved during compliance review. Contact support to request re-examination.</p>
              </div>
            </div>
            <Link
              to="/ngo/tickets"
              className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        )}

        {isSuspended && (
          <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-slate-900 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-700 text-xl shrink-0">block</span>
              <div>
                <h3 className="font-bold text-sm text-slate-900">NGO Profile Suspended</h3>
                <p className="text-slate-600 mt-0.5">Your organization operations are currently paused by administrative inspectors.</p>
              </div>
            </div>
            <Link
              to="/ngo/tickets"
              className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold shrink-0"
            >
              Submit Appeal Ticket
            </Link>
          </div>
        )}

        {/* MAIN PROFILE HERO / IDENTITY CARD */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Logo with Upload Trigger */}
            <div className="relative group shrink-0">
              <AvatarImage
                src={profile.logo}
                name={profile.display_name || profile.legal_name}
                size="lg"
                shape="rounded"
                fallbackIcon="domain"
                className="bg-slate-100 text-slate-700 border border-slate-200 shadow-xs"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute inset-0 bg-slate-900/60 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-medium cursor-pointer"
                title="Change Organization Logo"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">photo_camera</span>
                <span>{uploadingLogo ? '...' : 'Change'}</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${
                    isApproved
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isPendingReview
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : isCorrectionRequired
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isApproved ? 'Verified & Approved' : status}
                </span>

                {legal?.darpan_id && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs" aria-hidden="true">badge</span>
                    Darpan: {legal.darpan_id}
                  </span>
                )}

                {profile.category && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                    {profile.category}
                  </span>
                )}

                {profile.is_public && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs" aria-hidden="true">public</span> Publicly Listed
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {profile.display_name || profile.legal_name || 'Village / Sanstha Profile'}
              </h1>

              {profile.gujarati_name && (
                <p className="text-xs text-slate-600 font-medium">{profile.gujarati_name}</p>
              )}

              <p className="text-xs text-slate-500">
                Legal Entity: <strong className="text-slate-700 font-semibold">{profile.legal_name || '—'}</strong>
                {profile.year_established && ` • Est. ${profile.year_established}`}
                {profile.verified_at && ` • Verified: ${new Date(profile.verified_at).toLocaleDateString()}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoSelect}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                {uploadingLogo ? 'progress_activity' : 'add_photo_alternate'}
              </span>
              <span>{uploadingLogo ? 'Uploading...' : profile.logo ? 'Change Logo' : 'Upload Logo'}</span>
            </button>

            {profile.logo && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                disabled={uploadingLogo}
                className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50 border border-rose-200"
                title="Remove Logo"
              >
                Remove
              </button>
            )}

            {profile.is_public && (
              <Link
                to={`/ngos/${profile.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">open_in_new</span>
                <span>Public View</span>
              </Link>
            )}

            <Link
              to="/ngo/tickets/new"
              className="px-3.5 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-xs text-xs flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">edit_document</span>
              <span>Request Amendments</span>
            </Link>
          </div>
        </div>

        {/* COMPLIANCE LOCK NOTICE */}
        <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
          <span className="material-symbols-outlined text-slate-700 text-lg shrink-0 mt-0.5" aria-hidden="true">
            lock
          </span>
          <div className="leading-relaxed">
            <span className="font-semibold text-slate-900">Statutory Compliance Protection: </span>
            Legal registration numbers, Darpan ID, PAN, tax exemption statuses (12A/80G), and Scheduled Bank details are state-verified credentials locked in accordance with regulatory governance. To update or correct verified statutory credentials, please initiate an administrative change request via a support ticket.
          </div>
        </div>

        {/* 2-COLUMN GRID: STATUTORY & LEGAL + BANKING */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 1. STATUTORY & REGULATORY CREDENTIALS (LOCKED) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-700 text-lg" aria-hidden="true">
                  verified_user
                </span>
                <h2 className="text-sm font-bold text-slate-900">Statutory & Legal Credentials</h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs" aria-hidden="true">lock</span>
                Verified & Locked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-slate-400 font-medium text-[11px]">Entity Structure</span>
                <span className="font-semibold text-slate-800">{legal?.organisation_type || '—'}</span>
              </div>

              <div>
                <span className="block text-slate-400 font-medium text-[11px]">Registering Authority</span>
                <span className="font-semibold text-slate-800">{legal?.registering_authority || 'Charity Commissioner'}</span>
              </div>

              <div>
                <span className="block text-slate-400 font-medium text-[11px]">Registration Number</span>
                <span className="font-mono font-semibold text-slate-800">{legal?.registration_number || '—'}</span>
              </div>

              <div>
                <span className="block text-slate-400 font-medium text-[11px]">Registration State</span>
                <span className="font-semibold text-slate-800">{legal?.registration_state || address?.state || 'Gujarat'}</span>
              </div>

              <div>
                <span className="block text-slate-400 font-medium text-[11px]">NITI Aayog Darpan ID</span>
                <span className="font-mono font-bold text-slate-900">{legal?.darpan_id || '—'}</span>
              </div>

              <div>
                <span className="block text-slate-400 font-medium text-[11px]">Organization PAN</span>
                <span className="font-mono font-bold text-slate-900">{legal?.pan_number || '—'}</span>
              </div>

              <div>
                <span className="block text-slate-400 font-medium text-[11px]">Section 12A Exemption</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${legal?.has_12a ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="font-medium text-slate-800">
                    {legal?.has_12a ? (legal.twelve_a_number ? `Order: ${legal.twelve_a_number}` : 'Approved') : 'Not Claimed'}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-slate-400 font-medium text-[11px]">Section 80G Exemption</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${legal?.has_80g ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="font-medium text-slate-800">
                    {legal?.has_80g ? (legal.eighty_g_number ? `Order: ${legal.eighty_g_number}` : 'Approved') : 'Not Claimed'}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-slate-400 font-medium text-[11px]">MCA Form CSR-1 / CRN</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${legal?.has_csr_1 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="font-medium text-slate-800">
                    {legal?.has_csr_1 ? (legal.csr_registration_number ? `CRN: ${legal.csr_registration_number}` : 'Registered') : 'Not Registered'}
                  </span>
                </div>
                {legal?.has_csr_1 && legal?.csr_registration_date && (
                  <span className="block text-[10px] text-slate-500 mt-0.5">
                    Reg Date: {legal.csr_registration_date}
                  </span>
                )}
              </div>

              <div>
                <span className="block text-slate-400 font-medium text-[11px]">CSR Funding Eligibility</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${legal?.is_csr_eligible ? 'bg-indigo-500' : 'bg-amber-400'}`} />
                  <span className="font-medium text-slate-800">
                    {legal?.is_csr_eligible ? 'Eligible for Corporate CSR' : 'Standard Donations Only'}
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <span className="block text-slate-400 font-medium text-[11px]">Chief Trustee / Authorized Representative</span>
                <span className="font-semibold text-slate-900">
                  {legal?.chief_trustee_name || '—'}
                  {legal?.chief_trustee_designation && ` (${legal.chief_trustee_designation})`}
                </span>
              </div>
            </div>
          </div>

          {/* 2. DISBURSEMENT BANK DETAILS (AUDIT-LOCKED) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-700 text-lg" aria-hidden="true">
                  account_balance
                </span>
                <h2 className="text-sm font-bold text-slate-900">Disbursement Bank Account</h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs" aria-hidden="true">lock</span>
                Audited & Locked
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">Direct Wire Protocol</span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                All platform disbursements, corporate CSR grants, and bilateral project allocations are wired directly to this audited Scheduled Bank account.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <span className="block text-slate-400 font-medium text-[11px]">Bank Name</span>
                <span className="font-semibold text-slate-800">{bank?.bank_name || '—'}</span>
              </div>

              <div>
                <span className="block text-slate-400 font-medium text-[11px]">Account Type</span>
                <span className="font-semibold text-slate-800">{bank?.account_type || 'CURRENT'}</span>
              </div>

              <div>
                <span className="block text-slate-400 font-medium text-[11px]">Account Number</span>
                <span className="font-mono font-bold text-slate-900">
                  {bank?.account_number_masked || (bank?.account_number ? `••••••••${bank.account_number.slice(-4)}` : '••••••••••••')}
                </span>
              </div>

              <div>
                <span className="block text-slate-400 font-medium text-[11px]">IFSC Code</span>
                <span className="font-mono font-bold text-slate-900">{bank?.ifsc_code || '—'}</span>
              </div>

              <div className="sm:col-span-2">
                <span className="block text-slate-400 font-medium text-[11px]">Branch Name</span>
                <span className="font-medium text-slate-800">{bank?.branch_name || '—'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* 2-COLUMN GRID: ADDRESS & OPERATIONS + GENERAL OVERVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 3. REGISTERED OFFICE & OPERATIONS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-700 text-lg" aria-hidden="true">
                  location_on
                </span>
                <h2 className="text-sm font-bold text-slate-900">Registered Office & Service Area</h2>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="block text-slate-400 font-medium text-[11px]">Registered Address</span>
                <p className="font-medium text-slate-800 leading-relaxed">
                  {address?.address_line1 || '—'}
                  {address?.address_line2 && <>, {address.address_line2}</>}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="block text-slate-400 font-medium text-[11px]">City / Village</span>
                  <span className="font-semibold text-slate-800">{address?.city || '—'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium text-[11px]">District</span>
                  <span className="font-semibold text-slate-800">{address?.district || '—'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium text-[11px]">PIN Code</span>
                  <span className="font-mono font-semibold text-slate-800">{address?.pincode || '—'}</span>
                </div>
              </div>

              <div>
                <span className="block text-slate-400 font-medium text-[11px]">State</span>
                <span className="font-semibold text-slate-800">{address?.state || 'Gujarat'}</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="block text-slate-400 font-medium text-[11px]">Operational Districts / Service Areas</span>
                <span className="font-medium text-slate-700">{address?.service_areas || 'Statewide Gujarat'}</span>
              </div>
            </div>
          </div>

          {/* 4. ORGANIZATION MISSION & OFFICIAL CONTACT */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-700 text-lg" aria-hidden="true">
                  info
                </span>
                <h2 className="text-sm font-bold text-slate-900">Overview & Official Contact</h2>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {profile.description && (
                <div>
                  <span className="block text-slate-400 font-medium text-[11px]">About Organization</span>
                  <p className="text-slate-700 leading-relaxed">{profile.description}</p>
                </div>
              )}

              {profile.mission_statement && (
                <div>
                  <span className="block text-slate-400 font-medium text-[11px]">Mission Statement</span>
                  <p className="text-slate-700 leading-relaxed italic">{profile.mission_statement}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="block text-slate-400 font-medium text-[11px]">Official Email</span>
                  <span className="font-medium text-slate-800">{profile.official_email || '—'}</span>
                </div>

                <div>
                  <span className="block text-slate-400 font-medium text-[11px]">Official Phone</span>
                  <span className="font-medium text-slate-800">{profile.official_phone || '—'}</span>
                </div>

                {profile.website && (
                  <div className="sm:col-span-2">
                    <span className="block text-slate-400 font-medium text-[11px]">Official Website</span>
                    <a
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-slate-900 hover:underline flex items-center gap-1"
                    >
                      <span>{profile.website}</span>
                      <span className="material-symbols-outlined text-xs" aria-hidden="true">open_in_new</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 5. GOVERNING BOARD & LEADERSHIP */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-700 text-lg" aria-hidden="true">
                groups
              </span>
              <h2 className="text-sm font-bold text-slate-900">Governing Board & Trustees</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {leadership.length} {leadership.length === 1 ? 'Leader' : 'Leaders'} Registered
            </span>
          </div>

          {leadership.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">No board members recorded.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leadership.map((leader, idx) => (
                <div
                  key={leader.id || idx}
                  className="p-4 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{leader.full_name}</h3>
                      <p className="text-slate-500 font-medium text-[11px]">{leader.designation}</p>
                    </div>
                    {leader.is_primary_contact && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                        Primary Contact
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 pt-1 text-[11px] text-slate-600">
                    {leader.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="material-symbols-outlined text-xs text-slate-400" aria-hidden="true">mail</span>
                        <span>{leader.email}</span>
                      </div>
                    )}
                    {leader.phone && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs text-slate-400" aria-hidden="true">phone</span>
                        <span>{leader.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. STATUTORY COMPLIANCE DOCUMENTS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-700 text-lg" aria-hidden="true">
                folder_shared
              </span>
              <h2 className="text-sm font-bold text-slate-900">Verified Statutory Documents</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {documents.length} {documents.length === 1 ? 'Document' : 'Documents'} on File
            </span>
          </div>

          {documents.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">No statutory documents uploaded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 font-semibold">Document Type</th>
                    <th className="py-2.5 font-semibold">Filename</th>
                    <th className="py-2.5 font-semibold">Audit Status</th>
                    <th className="py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => {
                    const label = DOC_TYPE_LABELS[doc.document_type] || doc.document_type;
                    const isDownloading = downloadingDocId === doc.id;
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 font-semibold text-slate-900 flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-slate-400" aria-hidden="true">
                            description
                          </span>
                          <span>{label}</span>
                        </td>
                        <td className="py-3 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                          {doc.original_filename || 'document.pdf'}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Verified
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(doc.id, doc.original_filename)}
                            disabled={isDownloading}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-xs transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-xs" aria-hidden="true">
                              {isDownloading ? 'progress_activity' : 'download'}
                            </span>
                            <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </NgoLayout>
  );
}
