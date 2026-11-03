import React, { useState } from 'react';
import { addProjectMilestone, deleteProjectMilestone } from '../../services/api/projects';
import { MILESTONE_STATUS_COLORS, MILESTONE_STATUS_LABELS } from '../../constants/projects';

function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/**
 * MilestoneEditor
 * Manages project milestone breakdowns, timelines, and budget allotments.
 */
export default function MilestoneEditor({
  projectId,
  milestones = [],
  isEditable = true,
  onMilestonesUpdated,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
    order: (milestones.length + 1).toString(),
    amount: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.target_date || !formData.amount) {
      setError('Please fill in milestone title, target date, and budget amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await addProjectMilestone(projectId, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        target_date: formData.target_date,
        order: parseInt(formData.order, 10) || 1,
        amount: parseFloat(formData.amount) || 0,
      });

      setFormData({
        title: '',
        description: '',
        target_date: '',
        order: (milestones.length + 2).toString(),
        amount: '',
      });
      setShowAddForm(false);
      if (onMilestonesUpdated) onMilestonesUpdated();
    } catch (err) {
      setError(err.message || 'Failed to add milestone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to remove this milestone?')) return;
    try {
      setDeletingId(milestoneId);
      await deleteProjectMilestone(projectId, milestoneId);
      if (onMilestonesUpdated) onMilestonesUpdated();
    } catch (err) {
      alert(err.message || 'Failed to delete milestone.');
    } finally {
      setDeletingId(null);
    }
  };

  const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order);
  const totalMilestoneBudget = sortedMilestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">
              timeline
            </span>
            Project Milestones & Deliverables
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sequential stages for monitoring execution, fund utilization, and progress verification.
          </p>
        </div>

        {isEditable && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setFormData((prev) => ({
                ...prev,
                order: (milestones.length + 1).toString(),
              }));
              setShowAddForm(!showAddForm);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-200 dark:border-emerald-800/60 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-base">
              {showAddForm ? 'close' : 'add_task'}
            </span>
            {showAddForm ? 'Cancel' : 'Add Milestone'}
          </button>
        )}
      </div>

      {/* Add Milestone Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs animate-in fade-in duration-150"
        >
          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-emerald-600 text-sm">
              add_circle
            </span>
            New Milestone
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Sequence #
              </label>
              <input
                type="number"
                min="1"
                name="order"
                value={formData.order}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Milestone Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Phase 1: Land preparation & borewell drilling"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Completion Date *
              </label>
              <input
                type="date"
                name="target_date"
                value={formData.target_date}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Milestone Budget (INR ₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g., 150000"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description / Deliverables Summary
            </label>
            <textarea
              rows={2}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What specific tasks, materials, or civil works are covered in this milestone..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSubmitting ? 'Saving...' : 'Save Milestone'}
            </button>
          </div>
        </form>
      )}

      {/* Milestone List */}
      {sortedMilestones.length > 0 ? (
        <div className="space-y-3">
          {sortedMilestones.map((m) => {
            const statusLabel =
              MILESTONE_STATUS_LABELS[m.status] || m.status || 'Pending';
            const statusColor =
              MILESTONE_STATUS_COLORS[m.status] ||
              'bg-slate-100 text-slate-700 border-slate-200';
            const formattedDate = m.target_date
              ? new Date(m.target_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'TBD';

            return (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                    {m.order}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-bold text-slate-900 dark:text-slate-100">
                        {m.title}
                      </h5>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {m.description && (
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                        {m.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">
                          event
                        </span>
                        Target: {formattedDate}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <span className="material-symbols-outlined text-[14px] text-emerald-600">
                          payments
                        </span>
                        {formatCurrency(m.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {isEditable && (
                  <button
                    type="button"
                    disabled={deletingId === m.id}
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                    title="Delete milestone"
                  >
                    <span className="material-symbols-outlined text-base">
                      delete
                    </span>
                  </button>
                )}
              </div>
            );
          })}

          {/* Milestone Budget Summary */}
          <div className="pt-2 text-right text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total Milestone Budget:{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(totalMilestoneBudget)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          No milestones defined yet. Break down your project deliverables above.
        </div>
      )}
    </div>
  );
}
