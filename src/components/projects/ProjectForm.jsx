import React, { useState } from 'react';
import {
  PROJECT_CATEGORY_OPTIONS,
  PROJECT_CATEGORY_LABELS,
} from '../../constants/projects';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

/**
 * ProjectForm
 * Reusable form for creating and editing Village/Sanstha development projects.
 */
export default function ProjectForm({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
  submitButtonText = 'Save Project Draft',
  cancelUrl = '/ngo/projects',
}) {
  const [formData, setFormData] = useState({
    title: initialValues.title || '',
    category: initialValues.category || 'RURAL',
    short_summary: initialValues.short_summary || '',
    description: initialValues.description || '',
    location_state: initialValues.location_state || 'Rajasthan',
    location_district: initialValues.location_district || '',
    location_village: initialValues.location_village || '',
    location_pincode: initialValues.location_pincode || '',
    estimated_cost: initialValues.estimated_cost || '',
    timeline_months: initialValues.timeline_months || '6',
    beneficiaries_count: initialValues.beneficiaries_count || '',
    beneficiaries_description: initialValues.beneficiaries_description || '',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Project title is required.';
    else if (formData.title.length > 200) newErrors.title = 'Title cannot exceed 200 characters.';

    if (!formData.category) newErrors.category = 'Schedule VII Category is required.';

    if (!formData.short_summary.trim()) newErrors.short_summary = 'Short summary is required.';
    else if (formData.short_summary.length > 300) newErrors.short_summary = 'Short summary cannot exceed 300 characters.';

    if (!formData.description.trim()) newErrors.description = 'Detailed description is required.';

    if (!formData.location_state.trim()) newErrors.location_state = 'State is required.';
    if (!formData.location_district.trim()) newErrors.location_district = 'District is required.';
    if (!formData.location_village.trim()) newErrors.location_village = 'Village / Gram Panchayat is required.';
    if (!formData.location_pincode.trim()) {
      newErrors.location_pincode = 'Pincode is required.';
    } else if (!/^\d{6}$/.test(formData.location_pincode.trim())) {
      newErrors.location_pincode = 'Pincode must be a 6-digit number.';
    }

    const cost = parseFloat(formData.estimated_cost);
    if (!formData.estimated_cost || isNaN(cost) || cost <= 0) {
      newErrors.estimated_cost = 'Estimated cost must be greater than 0.';
    }

    const timeline = parseInt(formData.timeline_months, 10);
    if (!formData.timeline_months || isNaN(timeline) || timeline <= 0) {
      newErrors.timeline_months = 'Timeline must be at least 1 month.';
    }

    const beneficiaries = parseInt(formData.beneficiaries_count, 10);
    if (!formData.beneficiaries_count || isNaN(beneficiaries) || beneficiaries < 0) {
      newErrors.beneficiaries_count = 'Beneficiaries count must be 0 or higher.';
    }

    if (!formData.beneficiaries_description.trim()) {
      newErrors.beneficiaries_description = 'Target beneficiaries description is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      estimated_cost: parseFloat(formData.estimated_cost),
      timeline_months: parseInt(formData.timeline_months, 10),
      beneficiaries_count: parseInt(formData.beneficiaries_count, 10),
      location_pincode: formData.location_pincode.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" data-testid="project-form">
      {/* ── Section 1: Overview ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-emerald-600">article</span>
          Project Overview
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Provide a clear, descriptive title and Schedule VII category for your village project.
        </p>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Project Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Solar Powered Water Purification Plant in Gram Panchayat Khedli"
              className={`w-full px-3.5 py-2.5 rounded-xl border ${
                errors.title
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
              } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 outline-none`}
            />
            {errors.title && (
              <p className="text-rose-600 dark:text-rose-400 text-[11px] mt-1">
                {errors.title}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                CSR Schedule VII Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {PROJECT_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-rose-600 text-[11px] mt-1">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Short Summary (Card View) *
                <span className="text-[10px] text-slate-400 font-normal ml-2">
                  ({formData.short_summary.length}/300)
                </span>
              </label>
              <input
                type="text"
                name="short_summary"
                value={formData.short_summary}
                onChange={handleChange}
                maxLength={300}
                placeholder="High-level 1-2 line summary of the village need and proposed intervention..."
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  errors.short_summary
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 outline-none`}
              />
              {errors.short_summary && (
                <p className="text-rose-600 text-[11px] mt-1">{errors.short_summary}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Comprehensive Project Description & Problem Statement *
            </label>
            <textarea
              rows={5}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detail the current challenges faced by the community, proposed technical solution, infrastructure plan, and long-term sustainability..."
              className={`w-full px-3.5 py-2.5 rounded-xl border ${
                errors.description
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
              } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 outline-none`}
            />
            {errors.description && (
              <p className="text-rose-600 text-[11px] mt-1">{errors.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Location ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-emerald-600">location_on</span>
          Project Location
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Specify the target village and administrative jurisdiction for CSR geo-tagging.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              State *
            </label>
            <select
              name="location_state"
              value={formData.location_state}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              District *
            </label>
            <input
              type="text"
              name="location_district"
              value={formData.location_district}
              onChange={handleChange}
              placeholder="e.g., Alwar"
              className={`w-full px-3.5 py-2.5 rounded-xl border ${
                errors.location_district
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
              } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 outline-none`}
            />
            {errors.location_district && (
              <p className="text-rose-600 text-[11px] mt-1">
                {errors.location_district}
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Village / Gram Panchayat *
            </label>
            <input
              type="text"
              name="location_village"
              value={formData.location_village}
              onChange={handleChange}
              placeholder="e.g., Khedli Khurd"
              className={`w-full px-3.5 py-2.5 rounded-xl border ${
                errors.location_village
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
              } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 outline-none`}
            />
            {errors.location_village && (
              <p className="text-rose-600 text-[11px] mt-1">
                {errors.location_village}
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Pincode (6-digit) *
            </label>
            <input
              type="text"
              name="location_pincode"
              maxLength={6}
              value={formData.location_pincode}
              onChange={handleChange}
              placeholder="e.g., 301001"
              className={`w-full px-3.5 py-2.5 rounded-xl border ${
                errors.location_pincode
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
              } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 outline-none font-mono`}
            />
            {errors.location_pincode && (
              <p className="text-rose-600 text-[11px] mt-1">
                {errors.location_pincode}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3: Budget & Beneficiaries ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-emerald-600">payments</span>
          Budget & Impact Assessment
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Quantify the required CSR funding, execution timeline, and target community demographic.
        </p>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Total Estimated Cost (INR ₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                name="estimated_cost"
                value={formData.estimated_cost}
                onChange={handleChange}
                placeholder="e.g., 850000"
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  errors.estimated_cost
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 outline-none font-semibold`}
              />
              {errors.estimated_cost && (
                <p className="text-rose-600 text-[11px] mt-1">
                  {errors.estimated_cost}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Estimated Timeline (Months) *
              </label>
              <input
                type="number"
                min="1"
                max="60"
                name="timeline_months"
                value={formData.timeline_months}
                onChange={handleChange}
                placeholder="e.g., 6"
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  errors.timeline_months
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 outline-none`}
              />
              {errors.timeline_months && (
                <p className="text-rose-600 text-[11px] mt-1">
                  {errors.timeline_months}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Direct Beneficiaries Count *
              </label>
              <input
                type="number"
                min="0"
                name="beneficiaries_count"
                value={formData.beneficiaries_count}
                onChange={handleChange}
                placeholder="e.g., 1200"
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  errors.beneficiaries_count
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 outline-none`}
              />
              {errors.beneficiaries_count && (
                <p className="text-rose-600 text-[11px] mt-1">
                  {errors.beneficiaries_count}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Beneficiaries Breakdown & Demographic Impact *
            </label>
            <textarea
              rows={3}
              name="beneficiaries_description"
              value={formData.beneficiaries_description}
              onChange={handleChange}
              placeholder="e.g., Approx 350 smallholder farming households, 400 school-going children, SC/ST community members in Ward 3 and 4..."
              className={`w-full px-3.5 py-2.5 rounded-xl border ${
                errors.beneficiaries_description
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
              } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 outline-none`}
            />
            {errors.beneficiaries_description && (
              <p className="text-rose-600 text-[11px] mt-1">
                {errors.beneficiaries_description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Form Actions ── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <a
          href={cancelUrl}
          className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-300 dark:border-slate-700"
        >
          Cancel
        </a>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">
                progress_activity
              </span>
              Saving Project...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">save</span>
              {submitButtonText}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
