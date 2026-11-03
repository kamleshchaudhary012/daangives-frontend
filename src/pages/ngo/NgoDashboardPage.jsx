import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NgoLayout from '../../layouts/NgoLayout';
import Badge from '../../components/common/Badge';
import AvatarImage from '../../components/common/AvatarImage';
import useProfileGuard from '../../hooks/useProfileGuard';
import ProfileSetupRequired from '../../components/common/ProfileSetupRequired';
import {
  getNgoProfile,
  getNgoAddress,
  getNgoLegalInfo,
  getNgoBankInfo,
  getNgoLeadership,
  getNgoDocuments,
  downloadNgoDocumentFile,
  getNgoMonetaryDonations,
  downloadNgoReceiptPdf,
  getNgoForm10BdLedger,
  downloadNgoForm10BdCsv,
  uploadNgoForm10BeCertificate,
  downloadNgoForm10BePdf,
  uploadNgoLogo,
  removeNgoLogo,
} from '../../services/api';

const REQUIRED_DOC_TYPES = [
  { type: 'TRUST_DEED', label: 'Trust Deed / MoA / Bye-Laws' },
  { type: 'REGISTRATION_CERT', label: 'Registration Certificate' },
  { type: 'PAN_CARD', label: 'NGO PAN Card' },
  { type: 'DARPAN_CERTIFICATE', label: 'NITI Aayog Darpan Certificate' },
  { type: 'TWELVE_A_CERT', label: '12A Certificate' },
  { type: 'EIGHTY_G_CERT', label: '80G Order' },
  { type: 'AUDITED_FINANCIALS', label: 'Audited Financials' },
  { type: 'BANK_PASSBOOK', label: 'Bank Passbook / Cover' },
  { type: 'CANCELLED_CHEQUE', label: 'Cancelled Cheque' },
  { type: 'REPRESENTATIVE_ID', label: 'Representative ID' },
];

export default function NgoDashboardPage() {
  const navigate = useNavigate();
  const { status: profileStatus } = useProfileGuard('ngo');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Backend Data States
  const [profile, setProfile] = useState(null);
  const [address, setAddress] = useState(null);
  const [legal, setLegal] = useState(null);
  const [bank, setBank] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [monetaryDonations, setMonetaryDonations] = useState([]);
  const [downloadingDonationId, setDownloadingDonationId] = useState(null);
  const [donationDownloadError, setDonationDownloadError] = useState('');

  // NGO Logo Branding States
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoMsg, setLogoMsg] = useState('');
  const [logoError, setLogoError] = useState('');
  const logoInputRef = useRef(null);

  // Form 10BD Compliance States
  const [complianceFy, setComplianceFy] = useState('FY 2026-27');
  const [complianceData, setComplianceData] = useState(null);
  const [loadingCompliance, setLoadingCompliance] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [complianceError, setComplianceError] = useState('');

  useEffect(() => {
    // 1. Role Protection Check
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        const role = storedUser?.role?.toUpperCase();
        if (role === 'DONOR') {
          navigate('/donor/dashboard');
          return;
        } else if (role === 'ADMIN') {
          navigate('/admin/dashboard');
          return;
        }
      } catch (e) {
        // Fallthrough if parsing fails
      }
    }

    if (profileStatus === 'ready') {
      fetchDashboardData();
    } else if (profileStatus === 'missing') {
      setLoading(false);
    }
  }, [navigate, profileStatus]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // Use Promise.all for independent backend GET requests
      const [
        profRes,
        addrRes,
        legRes,
        bankRes,
        leaderRes,
        docRes,
        donationsRes,
      ] = await Promise.all([
        getNgoProfile(),
        getNgoAddress(),
        getNgoLegalInfo(),
        getNgoBankInfo(),
        getNgoLeadership().catch(() => []),
        getNgoDocuments().catch(() => []),
        getNgoMonetaryDonations().catch(() => []),
      ]);

      setProfile(profRes);
      setAddress(addrRes);
      setLegal(legRes);
      setBank(bankRes);
      if (Array.isArray(leaderRes)) setLeaders(leaderRes);
      if (Array.isArray(docRes)) setDocuments(docRes);

      const dList = Array.isArray(donationsRes) ? donationsRes : (donationsRes.results || []);
      setMonetaryDonations(dList);

    } catch (err) {
      if (err.status === 401) {
        navigate('/login');
      } else {
        setError(err.message || 'Unable to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDoc = async (docId) => {
    try {
      await downloadNgoDocumentFile(docId);
    } catch (e) {
      alert(e.message || 'Unable to download document.');
    }
  };

  const handleDownloadReceipt = async (donationId) => {
    if (!donationId || downloadingDonationId) return;
    setDownloadingDonationId(donationId);
    setDonationDownloadError('');
    try {
      await downloadNgoReceiptPdf(donationId);
    } catch (e) {
      setDonationDownloadError(e.message || 'Unable to download donation receipt.');
    } finally {
      setDownloadingDonationId(null);
    }
  };

  const fetchComplianceLedger = async (fy) => {
    setLoadingCompliance(true);
    setComplianceError('');
    try {
      const res = await getNgoForm10BdLedger({ financial_year: fy });
      setComplianceData(res);
    } catch (err) {
      setComplianceError(err.message || 'Unable to load compliance ledger data.');
    } finally {
      setLoadingCompliance(false);
    }
  };

  useEffect(() => {
    if (profile?.status === 'APPROVED') {
      fetchComplianceLedger(complianceFy);
    }
  }, [complianceFy, profile?.status]);

  const handleExportForm10BdCsv = async () => {
    if (exportingCsv) return;
    setExportingCsv(true);
    setComplianceError('');
    try {
      await downloadNgoForm10BdCsv(complianceFy);
    } catch (err) {
      setComplianceError(err.message || 'Failed to export Form 10BD Preparation CSV.');
    } finally {
      setExportingCsv(false);
    }
  };

  // Form 10BE Certificate Upload & Management State (Phase 4.3.8)
  const [selected10BeDonation, setSelected10BeDonation] = useState(null);
  const [certNumberInput, setCertNumberInput] = useState('');
  const [certFileInput, setCertFileInput] = useState(null);
  const [uploading10Be, setUploading10Be] = useState(false);
  const [upload10BeError, setUpload10BeError] = useState('');
  const [upload10BeSuccess, setUpload10BeSuccess] = useState('');
  const [downloading10BeDonationId, setDownloading10BeDonationId] = useState(null);

  const open10BeModal = (record) => {
    setSelected10BeDonation(record);
    setCertNumberInput(record.form_10be_certificate_number || '');
    setCertFileInput(null);
    setUpload10BeError('');
    setUpload10BeSuccess('');
  };

  const close10BeModal = () => {
    setSelected10BeDonation(null);
    setCertNumberInput('');
    setCertFileInput(null);
    setUpload10BeError('');
    setUpload10BeSuccess('');
  };

  const handleUpload10BeSubmit = async (e) => {
    e.preventDefault();
    if (!selected10BeDonation) return;

    if (!certNumberInput.trim()) {
      setUpload10BeError('Please enter the official Form 10BE Certificate / Acknowledgement Number.');
      return;
    }

    if (!certFileInput) {
      setUpload10BeError('Please select the official Form 10BE PDF file.');
      return;
    }

    if (certFileInput.size > 5 * 1024 * 1024) {
      setUpload10BeError('Form 10BE certificate PDF cannot exceed 5 MB.');
      return;
    }

    setUploading10Be(true);
    setUpload10BeError('');
    setUpload10BeSuccess('');

    try {
      const formData = new FormData();
      formData.append('certificate_number', certNumberInput.trim());
      formData.append('file', certFileInput);

      await uploadNgoForm10BeCertificate(selected10BeDonation.donation_id, formData);
      setUpload10BeSuccess('Official Form 10BE certificate uploaded successfully.');
      await fetchComplianceLedger(complianceFy);
      setTimeout(() => {
        close10BeModal();
      }, 1200);
    } catch (err) {
      setUpload10BeError(err.message || 'Failed to upload Form 10BE certificate.');
    } finally {
      setUploading10Be(false);
    }
  };

  const handleDownloadNgo10Be = async (donationId) => {
    if (!donationId || downloading10BeDonationId) return;
    setDownloading10BeDonationId(donationId);
    setComplianceError('');
    try {
      await downloadNgoForm10BePdf(donationId);
    } catch (err) {
      setComplianceError(err.message || 'Unable to download Form 10BE certificate.');
    } finally {
      setDownloading10BeDonationId(null);
    }
  };

  const handleLogoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError('');
    setLogoMsg('');

    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Logo file size exceeds 5 MB limit.');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setLogoError('Unsupported image format. Allowed formats: JPG, PNG, WebP.');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    setUploadingLogo(true);
    try {
      const res = await uploadNgoLogo(file);
      if (res?.profile) {
        setProfile(prev => ({ ...prev, logo: res.profile.logo }));
        setLogoMsg('Organization logo updated successfully.');
      } else {
        setLogoMsg('Logo uploaded successfully.');
        const freshProfile = await getNgoProfile().catch(() => null);
        if (freshProfile) setProfile(freshProfile);
      }
    } catch (err) {
      setLogoError(err.message || 'Failed to upload organization logo.');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove the organization logo?')) {
      return;
    }

    setLogoError('');
    setLogoMsg('');
    setUploadingLogo(true);

    try {
      await removeNgoLogo();
      setProfile(prev => ({ ...prev, logo: null }));
      setLogoMsg('Organization logo removed successfully.');
    } catch (err) {
      setLogoError(err.message || 'Failed to remove organization logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (profileStatus === 'missing') {
    return (
      <NgoLayout>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <ProfileSetupRequired
            role="NGO"
            title="NGO Profile Setup Required"
            description="You need to complete your NGO organization registration profile before accessing the NGO Owner Console."
            buttonText="Start NGO Registration"
            targetPath="/ngo/registration-flow"
          />
        </div>
      </NgoLayout>
    );
  }

  if (profileStatus === 'loading' || loading) {
    return (
      <NgoLayout>
        <div className="py-20 flex flex-col items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          <p className="text-sm font-semibold text-on-surface-variant mt-3">Loading NGO Owner Console...</p>
        </div>
      </NgoLayout>
    );
  }

  // Derived backend status & locking
  const status = profile?.status || 'DRAFT';
  const isActive = profile?.is_active || false;
  const isPublic = profile?.is_public || false;
  const isEditable = status === 'DRAFT' || status === 'CORRECTION_REQUIRED';

  // Section completeness calculations for display
  const docList = Array.isArray(documents) ? documents : (documents?.results || []);
  const leaderList = Array.isArray(leaders) ? leaders : (leaders?.results || []);

  const profileComplete = Boolean(profile && profile.legal_name && profile.display_name && profile.description && profile.year_established);
  const addressComplete = Boolean(address && address.address_line1 && address.city && address.district && address.state && address.pincode);
  const legalComplete = Boolean(legal && legal.organisation_type && legal.pan_number);
  const bankComplete = Boolean(bank && bank.account_holder_name && bank.bank_name && bank.ifsc_code);
  const leadershipComplete = Boolean(leaderList && leaderList.length > 0 && leaderList.some(l => l.is_primary_contact && l.is_active));

  const activeDocs = docList.filter(d => d.is_active);
  const activeDocTypes = new Set(activeDocs.map(d => d.document_type));
  const uploadedDocCount = REQUIRED_DOC_TYPES.filter(rt => activeDocTypes.has(rt.type)).length;
  const docsComplete = uploadedDocCount >= REQUIRED_DOC_TYPES.length;

  const totalSections = 6;
  const completedSections = [profileComplete, addressComplete, legalComplete, bankComplete, leadershipComplete, docsComplete].filter(Boolean).length;
  const completionPercentage = Math.round((completedSections / totalSections) * 100);

  // Status Banners config
  const STATUS_CONFIGS = {
    DRAFT: {
      badge: 'DRAFT',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      title: 'Complete Your NGO Application',
      message: 'Fill out all 6 registration sections and submit your application for verification.',
      actionText: 'Continue Registration Flow',
      actionUrl: '/ngo/registration-flow',
    },
    SUBMITTED: {
      badge: 'SUBMITTED',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      title: 'Application Submitted & Waiting for Review',
      message: 'Your application has been received and is queued for state administrative review.',
      actionText: 'View Submitted Application',
      actionUrl: '/ngo/registration-flow',
    },
    PENDING_REVIEW: {
      badge: 'UNDER ADMIN REVIEW',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Verification In Review',
      message: 'Your registration is currently under review by the DaanGives compliance team.',
      actionText: 'View Submission',
      actionUrl: '/ngo/registration-flow',
    },
    CORRECTION_REQUIRED: {
      badge: 'CHANGES REQUESTED',
      badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
      title: 'Action Required',
      message: 'The compliance reviewer requested changes on your registration submission.',
      actionText: 'Review Notes & Fix',
      actionUrl: '/ngo/registration-flow',
    },
    APPROVED: {
      badge: 'VERIFIED & APPROVED',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'NGO Verification Approved',
      message: 'Your NGO application has been approved. Registration details are locked while your verified profile is active.',
      actionText: 'View Verified Profile',
      actionUrl: '/ngo/profile',
    },
    REJECTED: {
      badge: 'APPLICATION REJECTED',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      title: 'Application Rejected',
      message: 'Your NGO application was rejected during administrative verification.',
      actionText: 'View Audit Status',
      actionUrl: '/ngo/registration-flow',
    },
    SUSPENDED: {
      badge: 'ACCOUNT SUSPENDED',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      title: 'NGO Account Suspended',
      message: 'Your NGO profile is currently suspended. Platform operations are paused.',
      actionText: 'View Status Details',
      actionUrl: '/ngo/registration-flow',
    },
  };


  const statusConfig = STATUS_CONFIGS[status] || STATUS_CONFIGS.DRAFT;

  return (
    <NgoLayout>
      <div className="space-y-6">

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-rose-800 text-xs font-medium">
            <span className="material-symbols-outlined text-lg text-rose-600" aria-hidden="true">error</span>
            {error}
          </div>
        )}

        {logoMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-medium">
            <span className="material-symbols-outlined text-base text-emerald-600" aria-hidden="true">check_circle</span>
            {logoMsg}
          </div>
        )}

        {logoError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-medium">
            <span className="material-symbols-outlined text-base text-rose-600" aria-hidden="true">error</span>
            {logoError}
          </div>
        )}

        {/* Header / NGO Profile Banner with Logo Management */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <AvatarImage
                src={profile?.logo}
                name={profile?.display_name || profile?.legal_name}
                size="lg"
                shape="rounded"
                fallbackIcon="domain"
                className="bg-slate-100 text-slate-700 border border-slate-200 shadow-xs"
              />
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute inset-0 bg-slate-900/60 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-medium cursor-pointer"
                title="Change Logo"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">photo_camera</span>
                <span>{uploadingLogo ? '...' : 'Change'}</span>
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${statusConfig.badgeClass}`}>
                  {statusConfig.badge}
                </span>

                {isPublic && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs" aria-hidden="true">public</span> Publicly Listed
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {profile?.display_name || profile?.legal_name || 'NGO Console'}
              </h1>

              <p className="text-xs text-slate-500">
                Category: <strong className="text-slate-700 font-semibold">{profile?.category || 'EDUCATION'}</strong>
                {legal?.darpan_id && ` • Darpan ID: ${legal.darpan_id}`}
                {profile?.year_established && ` • Established: ${profile.year_established}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoSelect}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                {uploadingLogo ? 'progress_activity' : 'add_photo_alternate'}
              </span>
              <span>{uploadingLogo ? 'Uploading...' : profile?.logo ? 'Change Logo' : 'Upload Logo'}</span>
            </button>

            {profile?.logo && (
              <button
                onClick={handleRemoveLogo}
                disabled={uploadingLogo}
                className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50 border border-rose-200"
                title="Remove Logo"
              >
                Remove
              </button>
            )}

            <Link
              to={statusConfig.actionUrl}
              className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-xs text-xs flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">assignment</span>
              {statusConfig.actionText}
            </Link>
          </div>
        </div>

        {/* Lifecycle Status Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base ${
                status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                status === 'CORRECTION_REQUIRED' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                status === 'REJECTED' || status === 'SUSPENDED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  {status === 'APPROVED' ? 'verified' : status === 'CORRECTION_REQUIRED' ? 'edit_note' : 'info'}
                </span>
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">{statusConfig.title}</h2>
                <p className="text-xs text-slate-500">{statusConfig.message}</p>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-500 block">Access Level</span>
              <span className="font-semibold text-slate-800">
                {status === 'APPROVED' ? 'Verified (Compliance Locked)' : isEditable ? 'Editable' : 'Read-Only (Locked)'}
              </span>
            </div>
          </div>

          {/* Reviewer Feedback Notes for CORRECTION_REQUIRED / REJECTED */}
          {status === 'CORRECTION_REQUIRED' && profile?.verification?.correction_instructions && (
            <div className="p-3.5 bg-orange-50/60 rounded-lg border border-orange-200 text-xs space-y-1">
              <span className="font-semibold text-orange-800 block text-[11px] uppercase tracking-wider">
                Reviewer Instructions & Required Corrections:
              </span>
              <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                {profile.verification.correction_instructions}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-orange-700 font-medium pt-1 border-t border-orange-200/50">
                <span>Attempt: {profile.verification.resubmission_count ?? 0} of {profile.verification.resubmission_limit ?? 3}</span>
                {profile.verification.resubmission_deadline && <span>• Deadline: {profile.verification.resubmission_deadline}</span>}
              </div>
            </div>
          )}

          {status === 'REJECTED' && profile?.verification?.rejection_reason && (
            <div className="p-3.5 bg-rose-50/60 rounded-lg border border-rose-200 text-xs space-y-1">
              <span className="font-semibold text-rose-800 block text-[11px] uppercase tracking-wider">
                Rejection Grounds:
              </span>
              <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                {profile.verification.rejection_reason}
              </p>
            </div>
          )}
        </div>

        {/* Village & Community Development Projects Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg" aria-hidden="true">handshake</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Village & Community Projects</h2>
              <p className="text-xs text-slate-500">Post infrastructure, education, and rural development proposals for CSR partnerships.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/ngo/projects"
              className="px-3.5 py-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 font-medium text-xs rounded-lg transition-colors"
            >
              View Projects Portal →
            </Link>
            <Link
              to="/ngo/projects/new"
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">add_circle</span>
              Post Project
            </Link>
          </div>
        </div>

        {/* Dedicated NGO Visual Branding & Logo Management Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-900 text-xl" aria-hidden="true">palette</span>
                <h2 className="text-base font-bold text-slate-900">Organization Visual Branding & Logo</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official logo displayed across the public NGO directory, active campaigns, donation checkout, and receipts.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-600 self-start sm:self-auto">
              <span className="material-symbols-outlined text-xs text-slate-700" aria-hidden="true">verified_user</span>
              {profile?.logo ? 'Custom Logo Active' : 'Default Identity Fallback'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-4">
              <AvatarImage
                src={profile?.logo}
                name={profile?.display_name || profile?.legal_name}
                size="lg"
                shape="rounded"
                fallbackIcon="domain"
                className="bg-white border border-slate-200 shadow-xs shrink-0"
              />
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">
                  {profile?.display_name || profile?.legal_name || 'Organization Identity'}
                </h3>
                <p className="text-xs text-slate-500">
                  {profile?.logo ? 'Official logo is uploaded and active platform-wide.' : 'No custom logo uploaded yet. Public pages currently display your verified organization initials.'}
                </p>
                <p className="text-[11px] text-slate-400 font-normal">
                  Allowed formats: <strong>JPG, JPEG, PNG, WebP</strong> (Max 5 MB)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="px-3.5 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">
                  {uploadingLogo ? 'progress_activity' : profile?.logo ? 'change_circle' : 'upload'}
                </span>
                <span>{uploadingLogo ? 'Processing...' : profile?.logo ? 'Change Logo' : 'Upload NGO Logo'}</span>
              </button>

              {profile?.logo && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={uploadingLogo}
                  className="px-3 py-2 bg-rose-50 text-rose-700 text-xs font-medium rounded-lg hover:bg-rose-100 border border-rose-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Remove Logo"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">delete</span>
                  <span>Remove Logo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Financial Overview for Approved NGOs */}
        {status === 'APPROVED' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Financial Overview & Campaign Funding</h2>
                <p className="text-xs text-slate-500">Real-time monetary contributions received across verified campaigns.</p>
              </div>
              <Link to="/ngo/needs" className="text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline">
                Manage Campaigns →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-medium text-slate-500 block">Total Received Funds</span>
                <div className="text-2xl font-bold text-slate-900">
                  ₹{monetaryDonations.filter(d => d.status === 'SUCCESS').reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold block">Direct Gateway Verified</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-medium text-slate-500 block">Successful Contributions</span>
                <div className="text-2xl font-bold text-slate-900">
                  {monetaryDonations.filter(d => d.status === 'SUCCESS').length}
                </div>
                <span className="text-[10px] text-slate-500 block">Individual Contributions</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-medium text-slate-500 block">Recent Activity</span>
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {monetaryDonations.length > 0 ? monetaryDonations[0].campaign_title : 'No donations yet'}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {monetaryDonations.length > 0 ? `Latest: ₹${parseFloat(monetaryDonations[0].amount).toLocaleString('en-IN')}` : 'Awaiting first contribution'}
                </span>
              </div>
            </div>

            {donationDownloadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-800 flex items-center justify-between">
                <span>{donationDownloadError}</span>
                <button onClick={() => setDonationDownloadError('')} className="underline">Dismiss</button>
              </div>
            )}

            {/* Campaign Contributions & Receipt Ledger Table */}
            {monetaryDonations.length > 0 && (
              <div className="pt-2 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Campaign Contributions Ledger ({monetaryDonations.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                        <th className="pb-2 px-3">Receipt Ref</th>
                        <th className="pb-2 px-3">Campaign</th>
                        <th className="pb-2 px-3">Donor</th>
                        <th className="pb-2 px-3">Amount</th>
                        <th className="pb-2 px-3">Date</th>
                        <th className="pb-2 px-3">Status</th>
                        <th className="pb-2 px-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monetaryDonations.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{d.receipt_number}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[180px] truncate">{d.campaign_title}</td>
                          <td className="py-2.5 px-3 text-slate-600">{d.donor_name}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">₹{parseFloat(d.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {d.paid_at ? new Date(d.paid_at).toLocaleDateString('en-IN') : new Date(d.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${d.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {d.status === 'SUCCESS' ? (
                              <button
                                onClick={() => handleDownloadReceipt(d.id)}
                                disabled={downloadingDonationId === d.id}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-xs inline-flex items-center gap-1 border border-slate-200 disabled:opacity-50"
                                title="Download Official Receipt PDF"
                              >
                                <span className="material-symbols-outlined text-xs" aria-hidden="true">
                                  {downloadingDonationId === d.id ? 'progress_activity' : 'download'}
                                </span>
                                <span>{downloadingDonationId === d.id ? '...' : 'PDF'}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form 10BD Annual Donation Compliance & Preparation Section */}
        {status === 'APPROVED' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-900 text-xl" aria-hidden="true">account_balance</span>
                  <h2 className="text-base font-bold text-slate-900">Annual Compliance & Form 10BD Statement</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authoritative donation statement and Form 10BD preparation ledger for statutory Income Tax reporting.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Financial Year:</label>
                <select
                  value={complianceFy}
                  onChange={(e) => setComplianceFy(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                >
                  <option value="FY 2026-27">FY 2026-27 (Current)</option>
                  <option value="FY 2025-26">FY 2025-26</option>
                  <option value="FY 2024-25">FY 2024-25</option>
                </select>

                <button
                  onClick={handleExportForm10BdCsv}
                  disabled={exportingCsv || !complianceData?.records?.length}
                  className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 shadow-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Download Form 10BD Preparation CSV"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">
                    {exportingCsv ? 'progress_activity' : 'download'}
                  </span>
                  <span>{exportingCsv ? 'Exporting...' : 'Export CSV'}</span>
                </button>
              </div>
            </div>

            {complianceError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-800 flex items-center justify-between">
                <span>{complianceError}</span>
                <button onClick={() => setComplianceError('')} className="underline">Dismiss</button>
              </div>
            )}

            {/* Compliance Metric Cards */}
            {complianceData?.summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium uppercase block">Total Verified Donations</span>
                  <div className="text-xl font-bold text-slate-900">{complianceData.summary.total_donated_amount_display}</div>
                  <span className="text-[10px] text-slate-500 block">{complianceData.summary.total_donations_count} verified contributions</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] text-emerald-700 font-semibold uppercase block">80G Tax Deductible</span>
                  <div className="text-xl font-bold text-emerald-700">{complianceData.summary.eighty_g_donated_amount_display}</div>
                  <span className="text-[10px] text-emerald-700 block">{complianceData.summary.eighty_g_donations_count} eligible donations</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium uppercase block">Standard Receipts</span>
                  <div className="text-xl font-bold text-slate-900">{complianceData.summary.standard_donated_amount_display}</div>
                  <span className="text-[10px] text-slate-500 block">{complianceData.summary.standard_donations_count} standard receipts</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium uppercase block">Unique Donors</span>
                  <div className="text-xl font-bold text-slate-900">{complianceData.summary.unique_donors_count}</div>
                  <span className="text-[10px] text-slate-500 block">Distinct contributors</span>
                </div>
              </div>
            )}

            {/* Compliance Table / Empty State */}
            {loadingCompliance ? (
              <div className="py-10 text-center text-xs text-slate-500 space-y-2">
                <span className="material-symbols-outlined text-3xl text-slate-900 animate-spin" aria-hidden="true">progress_activity</span>
                <p className="font-medium">Loading Form 10BD compliance ledger for {complianceFy}...</p>
              </div>
            ) : !complianceData?.records?.length ? (
              <div className="p-6 text-center bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 font-medium">
                No successful donations found for this financial year.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                      <th className="pb-2 px-3">Serial</th>
                      <th className="pb-2 px-3">Receipt / Ref</th>
                      <th className="pb-2 px-3">Date</th>
                      <th className="pb-2 px-3">Donor Name</th>
                      <th className="pb-2 px-3">PAN Status</th>
                      <th className="pb-2 px-3">Amount</th>
                      <th className="pb-2 px-3">Receipt Type</th>
                      <th className="pb-2 px-3">Form 10BE Certificate</th>
                      <th className="pb-2 px-3">Campaign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {complianceData.records.map((r) => (
                      <tr key={r.donation_id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{r.serial_no}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{r.receipt_number}</td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">{r.donation_date}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{r.donor_name}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{r.donor_pan_masked}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{r.amount_display}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${r.receipt_type === 'EIGHTY_G'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                            {r.receipt_type === 'EIGHTY_G' ? '80G Tax Exemption' : 'Standard'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {r.has_form_10be ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleDownloadNgo10Be(r.donation_id)}
                                disabled={downloading10BeDonationId === r.donation_id}
                                className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-medium hover:bg-emerald-100 flex items-center gap-1 transition-colors cursor-pointer"
                                title={`Download Form 10BE (${r.form_10be_certificate_number})`}
                              >
                                <span className="material-symbols-outlined text-[12px]" aria-hidden="true">
                                  {downloading10BeDonationId === r.donation_id ? 'progress_activity' : 'verified_user'}
                                </span>
                                <span>{r.form_10be_certificate_number ? `${r.form_10be_certificate_number.slice(0, 8)}...` : 'Cert'}</span>
                              </button>
                              <button
                                onClick={() => open10BeModal(r)}
                                className="text-[10px] text-slate-600 hover:text-slate-900 hover:underline font-medium cursor-pointer"
                                title="Replace or re-upload corrected Form 10BE"
                              >
                                Replace
                              </button>
                            </div>
                          ) : r.receipt_type === 'EIGHTY_G' ? (
                            <button
                              onClick={() => open10BeModal(r)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-md text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[12px]" aria-hidden="true">upload_file</span>
                              <span>Upload 10BE</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">N/A</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[150px] truncate">{r.campaign_title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Statutory Notice */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <span className="material-symbols-outlined text-slate-500 text-base shrink-0 mt-0.5" aria-hidden="true">info</span>
              <p className="leading-relaxed">
                <strong className="text-slate-900">Statutory Compliance Notice:</strong> DaanGives provides this annual statement to assist non-profit organisations in statutory donor reconciliation and Form 10BD preparation. It does not replace official Form 10BD electronic filing on the Income Tax Department portal. Upload official Form 10BE certificate PDFs issued by the Income Tax Department to deliver them to verified donors.
              </p>
            </div>

            {/* Form 10BE Upload Modal */}
            {selected10BeDonation && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-900 text-xl" aria-hidden="true">verified_user</span>
                      <h3 className="text-sm font-bold text-slate-900">Upload Official Form 10BE Certificate</h3>
                    </div>
                    <button
                      onClick={close10BeModal}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                      aria-label="Close dialog"
                    >
                      <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Receipt Ref:</span>
                      <span className="font-mono font-semibold text-slate-900">{selected10BeDonation.receipt_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Donor:</span>
                      <span className="font-medium text-slate-900">{selected10BeDonation.donor_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Financial Year:</span>
                      <span className="font-semibold text-slate-900">{selected10BeDonation.financial_year}</span>
                    </div>
                  </div>

                  {upload10BeError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-800">
                      {upload10BeError}
                    </div>
                  )}

                  {upload10BeSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-emerald-600" aria-hidden="true">check_circle</span>
                      <span>{upload10BeSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpload10BeSubmit} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-medium text-slate-700 block">
                        Official Form 10BE Certificate / Acknowledgement Number <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={certNumberInput}
                        onChange={(e) => setCertNumberInput(e.target.value)}
                        placeholder="e.g. 10BE/2026-27/00145"
                        required
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-slate-700 block">
                        Official Form 10BE PDF Document <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(e) => setCertFileInput(e.target.files?.[0] || null)}
                        required
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50 file:text-slate-800 hover:file:bg-slate-100"
                      />
                      <p className="text-[10px] text-slate-400">PDF format only. Maximum file size 5 MB.</p>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={close10BeModal}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={uploading10Be}
                        className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 shadow-xs flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">
                          {uploading10Be ? 'progress_activity' : 'cloud_upload'}
                        </span>
                        <span>{uploading10Be ? 'Uploading...' : 'Save Certificate'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section Completion Grid */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Application Registration Completeness</h2>
              <p className="text-xs text-slate-500">{completedSections} of {totalSections} sections completed ({completionPercentage}%)</p>
            </div>

            <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div className="bg-slate-900 h-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">

            {/* 1. Profile */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 block">1. Profile Info</span>
                <span className="text-slate-500">{profileComplete ? (profile?.display_name || 'Saved') : 'Missing details'}</span>
              </div>
              <Badge variant={profileComplete ? 'success' : 'warning'}>
                {profileComplete ? 'Complete' : 'Incomplete'}
              </Badge>
            </div>

            {/* 2. Address */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 block">2. Address</span>
                <span className="text-slate-500">{addressComplete ? `${address.city}, ${address.district}` : 'Missing location'}</span>
              </div>
              <Badge variant={addressComplete ? 'success' : 'warning'}>
                {addressComplete ? 'Complete' : 'Incomplete'}
              </Badge>
            </div>

            {/* 3. Legal */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 block">3. Legal & PAN</span>
                <span className="text-slate-500">{legalComplete ? `${legal.organisation_type}` : 'Missing legal info'}</span>
              </div>
              <Badge variant={legalComplete ? 'success' : 'warning'}>
                {legalComplete ? 'Complete' : 'Incomplete'}
              </Badge>
            </div>

            {/* 4. Bank */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 block">4. Bank Account</span>
                <span className="text-slate-500">{bankComplete ? `${bank.bank_name} (${bank.masked_account_number || 'Masked'})` : 'Missing bank details'}</span>
              </div>
              <Badge variant={bankComplete ? 'success' : 'warning'}>
                {bankComplete ? 'Complete' : 'Incomplete'}
              </Badge>
            </div>

            {/* 5. Leadership */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 block">5. Leadership Roster</span>
                <span className="text-slate-500">{leadershipComplete ? `${leaders.length} Active Leader(s)` : 'No leaders added'}</span>
              </div>
              <Badge variant={leadershipComplete ? 'success' : 'warning'}>
                {leadershipComplete ? 'Complete' : 'Incomplete'}
              </Badge>
            </div>

            {/* 6. Documents */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 block">6. Uploaded Documents</span>
                <span className="text-slate-500">{uploadedDocCount} of {REQUIRED_DOC_TYPES.length} required</span>
              </div>
              <Badge variant={docsComplete ? 'success' : 'warning'}>
                {docsComplete ? 'Complete' : 'Incomplete'}
              </Badge>
            </div>

          </div>
        </div>

        {/* Verification Document Summary */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Required Verification Documents Status</h2>
            <span className="text-xs font-medium text-slate-500">{uploadedDocCount} / {REQUIRED_DOC_TYPES.length} Uploaded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Document Type</th>
                  <th className="py-2.5 px-3">Original Filename</th>
                  <th className="py-2.5 px-3">Upload Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {REQUIRED_DOC_TYPES.map(({ type, label }) => {
                  const activeDoc = activeDocs.find(d => d.document_type === type);
                  return (
                    <tr key={type} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-900">{label}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{activeDoc ? activeDoc.original_filename : '—'}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={activeDoc ? 'success' : 'warning'}>
                          {activeDoc ? 'Uploaded' : 'Missing'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {activeDoc ? (
                          <button
                            onClick={() => handleDownloadDoc(activeDoc.id)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-800 hover:bg-slate-200 font-medium rounded-lg text-xs border border-slate-200 transition-colors"
                          >
                            Download
                          </button>
                        ) : (
                          <Link to="/ngo/registration-flow" className="text-slate-900 font-medium hover:underline">
                            Upload
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </NgoLayout>
  );
}
