import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import NgoLayout from '../../layouts/NgoLayout';
import ProjectForm from '../../components/projects/ProjectForm';
import { getProjectDetail, updateProject } from '../../services/api/projects';

export default function EditProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      setError(err.message || 'Failed to load project.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError('');
    try {
      await updateProject(id, formData);
      navigate(`/ngo/projects/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to update project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <NgoLayout>
        <div className="max-w-4xl mx-auto px-4 py-12">
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

  if (!isEditable) {
    return (
      <NgoLayout>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Project Locked for Editing
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            This project is currently in <span className="font-semibold text-slate-700 dark:text-slate-300">{project.status}</span> status and cannot be edited. If it is submitted, you may withdraw it back to draft first.
          </p>
          <Link
            to={`/ngo/projects/${project.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            View Project Details
          </Link>
        </div>
      </NgoLayout>
    );
  }

  return (
    <NgoLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="edit-project-page">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <Link to="/ngo/projects" className="hover:text-emerald-600 transition-colors">
            My Projects
          </Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <Link to={`/ngo/projects/${project.id}`} className="hover:text-emerald-600 transition-colors truncate max-w-xs">
            {project.title}
          </Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-slate-900 dark:text-slate-100 font-semibold">
            Edit
          </span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Edit Project Proposal
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Update your project specifications, cost estimates, or location details.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-lg shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Project Form */}
        <ProjectForm
          initialValues={project}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Update Project Draft"
          cancelUrl={`/ngo/projects/${project.id}`}
        />
      </div>
    </NgoLayout>
  );
}
