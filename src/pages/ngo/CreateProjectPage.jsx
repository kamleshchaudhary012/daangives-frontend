import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NgoLayout from '../../layouts/NgoLayout';
import ProjectForm from '../../components/projects/ProjectForm';
import { createProjectDraft } from '../../services/api/projects';
import useProfileGuard from '../../hooks/useProfileGuard';
import ProfileSetupRequired from '../../components/common/ProfileSetupRequired';

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const { status: profileStatus } = useProfileGuard('ngo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError('');
    try {
      const createdProject = await createProjectDraft(formData);
      // Navigate to project detail page to attach documents and milestones
      navigate(`/ngo/projects/${createdProject.id}?created=true`);
    } catch (err) {
      setError(err.message || 'Failed to create project draft. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileStatus === 'loading') {
    return (
      <NgoLayout>
        <div className="py-20 flex flex-col items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined text-4xl text-emerald-600 animate-spin">progress_activity</span>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-3">Verifying NGO profile...</p>
        </div>
      </NgoLayout>
    );
  }

  if (profileStatus === 'missing') {
    return (
      <NgoLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ProfileSetupRequired
            role="NGO"
            title="NGO Profile Required to Post Projects"
            description="You must complete and submit your NGO organization profile before you can post and propose village development projects."
            buttonText="Complete NGO Registration"
            targetPath="/ngo/registration-flow"
          />
        </div>
      </NgoLayout>
    );
  }

  return (
    <NgoLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="create-project-page">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <Link to="/ngo/projects" className="hover:text-emerald-600 transition-colors">
            My Projects
          </Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-slate-900 dark:text-slate-100 font-semibold">
            Post New Project
          </span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 mb-3">
            <span className="material-symbols-outlined text-sm">edit_document</span>
            Step 1 of 2: Create Proposal Draft
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Post a Village Development Project
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Fill in your village project specifications below. Once saved, you will be able to attach Gram Panchayat resolutions, technical BOQ estimates, and milestone schedules before submitting for verification.
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-lg shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Project Form */}
        <ProjectForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Save Draft & Proceed to Documents"
          cancelUrl="/ngo/projects"
        />
      </div>
    </NgoLayout>
  );
}
