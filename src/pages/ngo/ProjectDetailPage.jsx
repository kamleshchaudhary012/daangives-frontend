import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import NgoLayout from '../../layouts/NgoLayout';
import {
  getProjectDetail,
  submitProjectForVerification,
  withdrawProjectSubmission,
  adminVerifyProject,
} from '../../services/api/projects';
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge';
import DocumentUploadList from '../../components/projects/DocumentUploadList';
import MilestoneEditor from '../../components/projects/MilestoneEditor';
import EvidencePhotoList from '../../components/projects/EvidencePhotoList';
import {
  PROJECT_CATEGORY_LABELS,
  PROJECT_CATEGORY_ICONS,
} from '../../constants/projects';

function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justCreated = searchParams.get('created') === 'true';

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Check admin role
  const userStr = localStorage.getItem('user');
  let currentUser = null;
  try {
    currentUser = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    currentUser = null;
  }
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN' || currentUser?.is_staff;

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProjectDetail(id);
      setProject(data);
    } catch (err) {
      setError(err.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (action, defaultNotes = '') => {
    let notes = defaultNotes;
    let rejectionReason = '';

    if (action === 'REJECT') {
      const input = window.prompt('Enter mandatory rejection reason:');
      if (!input || !input.trim()) {
        alert('Rejection reason is required.');
        return;
      }
      rejectionReason = input.trim();
    } else if (action === 'REQUEST_CHANGES') {
      const input = window.prompt('Specify required corrections or missing documents:');
      if (!input || !input.trim()) {
        alert('Correction instructions are required.');
        return;
      }
      notes = input.trim();
    } else if (action === 'ADD_TO_VERIFY') {
      if (!window.confirm('Add this project to the Under Review verification queue?')) {
        return;
      }
      notes = notes || 'Project added to verification queue by Administrator.';
    } else if (action === 'VERIFY') {
      if (!window.confirm('Approve and verify this project as CSR Ready?')) {
        return;
      }
      notes = notes || 'All technical and panchayat sanctions verified.';
    }

    try {
      setActionLoading(true);
      setError('');
      const res = await adminVerifyProject(id, {
        action,
        notes,
        rejection_reason: rejectionReason,
      });
      const updatedProject = res?.project || res;
      setProject(updatedProject);
      setActionSuccess(`Project successfully updated to status: ${updatedProject.status}.`);
      await fetchProject();
    } catch (err) {
      setError(err.message || 'Failed to execute administrative verification action.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForVerification = async () => {
    const docCount = project.documents?.length || 0;
    if (docCount === 0) {
      alert('You must attach at least one statutory verification document before submitting for verification.');
      return;
    }

    if (!window.confirm('Submit this project to the Admin team for statutory verification?')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      const updated = await submitProjectForVerification(id);
      setProject(updated);
      setActionSuccess('Project submitted successfully for CSR verification.');
    } catch (err) {
      setError(err.message || 'Failed to submit project for verification.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawSubmission = async () => {
    if (!window.confirm('Withdraw this submission? The project will return to DRAFT status.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      const updated = await withdrawProjectSubmission(id);
      setProject(updated);
      setActionSuccess('Project submission withdrawn. Status returned to DRAFT.');
    } catch (err) {
      setError(err.message || 'Failed to withdraw project.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <NgoLayout>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700" />
        </div>
      </NgoLayout>
    );
  }

  if (error && !project) {
    return (
      <NgoLayout>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-2xl">error</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Unable to Load Project
          </h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <Link
            to="/ngo/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to My Projects
          </Link>
        </div>
      </NgoLayout>
    );
  }

  if (!project) return null;

  const isEditable = project.status === 'DRAFT' || project.status === 'DOCS_PENDING';
  const categoryLabel =
    PROJECT_CATEGORY_LABELS[project.category] || project.category;
  const categoryIcon = PROJECT_CATEGORY_ICONS[project.category] || 'folder';
  const docCount = project.documents?.length || 0;

  return (
    <NgoLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="project-detail-page">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <Link to="/ngo/projects" className="hover:text-emerald-600 transition-colors">
            My Projects
          </Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-sm">
            {project.title}
          </span>
        </nav>

        {/* Just Created Banner */}
        {justCreated && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-xl">
                check_circle
              </span>
              <div>
                <span className="font-bold block">Project Draft Saved!</span>
                Please attach at least one statutory document (e.g. Gram Panchayat resolution) and add milestone deliverables below before submitting for verification.
              </div>
            </div>
          </div>
        )}

        {/* Action Success Alert */}
        {actionSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-emerald-600 text-lg">
              check_circle
            </span>
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Action Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Status Alerts */}
        {project.status === 'DOCS_PENDING' && (
          <div className="mb-6 p-5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-200 text-xs shadow-sm">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-orange-600 text-2xl shrink-0">
                warning
              </span>
              <div className="flex-1">
                <span className="font-extrabold text-sm block mb-1">Action Required — Changes or Documents Requested</span>
                <p className="leading-relaxed mb-2">
                  The Admin compliance reviewer has requested revisions or additional statutory documentation for this project proposal. Please inspect the reviewer instructions below, update documents or project parameters, and resubmit for verification.
                </p>
                {project.verification_notes && (
                  <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-orange-200 dark:border-orange-800 text-xs font-medium text-slate-800 dark:text-slate-200">
                    <span className="font-bold text-orange-700 dark:text-orange-400 block mb-0.5">Reviewer Feedback:</span>
                    {project.verification_notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {project.status === 'REJECTED' && project.rejection_reason && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-3">
            <span className="material-symbols-outlined text-rose-600 text-lg shrink-0">
              cancel
            </span>
            <div>
              <span className="font-bold block">Verification Rejection Reason:</span>
              <p className="mt-1 leading-relaxed">{project.rejection_reason}</p>
            </div>
          </div>
        )}

        {project.status !== 'DOCS_PENDING' && project.verification_notes && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">
              info
            </span>
            <div>
              <span className="font-bold block">Admin Review Notes:</span>
              <p className="mt-1 leading-relaxed">{project.verification_notes}</p>
            </div>
          </div>
        )}

        {/* Main Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                  <span className="material-symbols-outlined text-[15px]">
                    {categoryIcon}
                  </span>
                  <span>{categoryLabel}</span>
                </div>
                <ProjectStatusBadge status={project.status} size="md" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                {project.title}
              </h1>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-emerald-600">
                    location_on
                  </span>
                  {project.location_village ? `${project.location_village}, ` : ''}
                  {project.location_district}, {project.location_state} ({project.location_pincode})
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-slate-400">
                    apartment
                  </span>
                  {project.organization_name || 'Village Council'}
                </span>
                <span>•</span>
                <span>
                  Created:{' '}
                  {new Date(project.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {/* Admin Actions */}
              {isAdmin && (
                <div className="flex items-center gap-2 flex-wrap p-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase px-2 tracking-wider">
                    Admin Actions:
                  </span>

                  {project.status === 'SUBMITTED' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleAdminAction('ADD_TO_VERIFY')}
                      data-testid="admin-add-to-verify-btn"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all disabled:opacity-50"
                      title="Move project to Under Review queue"
                    >
                      <span className="material-symbols-outlined text-base">hourglass_top</span>
                      {actionLoading ? 'Processing...' : 'Add to Verify'}
                    </button>
                  )}

                  {project.status === 'UNDER_REVIEW' && (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleAdminAction('VERIFY')}
                        className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Approve & Verify
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleAdminAction('REQUEST_CHANGES')}
                        className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">edit_note</span>
                        Request Changes
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleAdminAction('REJECT')}
                        className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span>
                        Reject
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* NGO Actions */}
              {!isAdmin && isEditable && (
                <>
                  <Link
                    to={`/ngo/projects/${project.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                    Edit Project
                  </Link>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleSubmitForVerification}
                    className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow transition-all ${
                      docCount > 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                        : 'bg-slate-400 cursor-not-allowed opacity-75'
                    }`}
                    title={
                      docCount === 0
                        ? 'Upload at least 1 document below to enable verification submission'
                        : 'Submit project for Admin verification'
                    }
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                    {actionLoading ? 'Submitting...' : 'Submit for Verification'}
                  </button>
                </>
              )}

              {!isAdmin && project.status === 'SUBMITTED' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleWithdrawSubmission}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl transition-colors border border-amber-200 dark:border-amber-800"
                >
                  <span className="material-symbols-outlined text-base">undo</span>
                  Withdraw to Draft
                </button>
              )}
            </div>
          </div>

          {/* Metric Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Budget
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {formatCurrency(project.estimated_cost)}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Execution Timeline
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {project.timeline_months} Months
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Beneficiaries
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {Number(project.beneficiaries_count || 0).toLocaleString()} people
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Attached Documents
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {docCount} files
              </div>
            </div>
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="space-y-8">
          {/* Detailed Narrative */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-emerald-600">
                description
              </span>
              Project Proposal & Community Need
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-4 leading-relaxed p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Executive Summary:
              </span>
              {project.short_summary}
            </p>

            <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {project.description}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm">
                  groups
                </span>
                Target Demographic & Beneficiary Details
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {project.beneficiaries_description}
              </p>
            </div>
          </div>

          {/* Verification Documents Component */}
          <DocumentUploadList
            projectId={project.id}
            documents={project.documents || []}
            isEditable={isEditable}
            onDocumentsUpdated={fetchProject}
          />

          {/* Milestones Component */}
          <MilestoneEditor
            projectId={project.id}
            milestones={project.milestones || []}
            isEditable={isEditable}
            onMilestonesUpdated={fetchProject}
          />

          {/* Milestone Evidence & Execution Photos */}
          <EvidencePhotoList
            projectId={project.id}
            photos={project.photos || []}
            projectStatus={project.status}
            isOwner={!isAdmin}
            onPhotosUpdated={fetchProject}
          />

          {/* Funded Partnership & CSR Obligations Component */}
          {['FUNDED', 'IN_PROGRESS', 'COMPLETED'].includes(project.status) && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-200 dark:border-purple-800 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/40 pb-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600">
                      handshake
                    </span>
                    CSR Funded Partnership & Execution Status
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Formal grant agreement, milestone disbursements, and statutory reporting under Section 135.
                  </p>
                </div>
                <Link
                  to="/ngo/csr/partnerships"
                  className="px-4 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 rounded-xl hover:bg-purple-100 border border-purple-200 dark:border-purple-800 transition-colors"
                >
                  View All Partnerships →
                </Link>
              </div>

              {project.funded_details ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                    <span className="text-[10px] uppercase font-bold text-purple-500 tracking-wider">
                      Partnership Code
                    </span>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {project.funded_details.partnership_code}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                    <span className="text-[10px] uppercase font-bold text-purple-500 tracking-wider">
                      Corporate Partner
                    </span>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {project.funded_details.company_name}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                    <span className="text-[10px] uppercase font-bold text-purple-500 tracking-wider">
                      Agreed CSR Grant
                    </span>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {formatCurrency(project.funded_details.agreed_funding)}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                    <span className="text-[10px] uppercase font-bold text-purple-500 tracking-wider">
                      Disbursements Reported
                    </span>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {formatCurrency(project.funded_details.disbursed_amount)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs">
                  This project has been approved for CSR funding. Partnership agreement and disbursement tracking are linked to your organization's CSR partnerships console.
                </div>
              )}
            </div>
          )}

          {/* Verification & Submission History Timeline */}
          {project.verification_history && project.verification_history.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-slate-600">
                  history
                </span>
                Submission & Verification Review Timeline
              </h3>

              <div className="space-y-4">
                {project.verification_history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-sm">
                        {entry.action === 'SUBMITTED' ? 'send' : entry.action === 'VERIFIED' ? 'verified' : entry.action === 'REJECTED' ? 'cancel' : 'edit_note'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {entry.action} {entry.to_status ? `(Status: ${entry.to_status})` : ''}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(entry.created_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5">
                        By: <span className="font-semibold">{entry.actor_email}</span> ({entry.actor_type})
                      </div>

                      {entry.notes && (
                        <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </NgoLayout>
  );
}
