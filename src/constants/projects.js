/**
 * Project Constants — Phase 7.2 Village Project Posting
 * =======================================================
 * Schedule VII categories, project workflow statuses, statutory document types,
 * and milestone statuses with associated UI colors and icons.
 */

// ─── Categories (Schedule VII Aligned) ───────────────────────────────────

export const PROJECT_CATEGORIES = {
  POVERTY: 'POVERTY',
  HEALTH: 'HEALTH',
  EDUCATION: 'EDUCATION',
  GENDER: 'GENDER',
  ENVIRONMENT: 'ENVIRONMENT',
  HERITAGE: 'HERITAGE',
  ARMED_FORCES: 'ARMED_FORCES',
  RURAL: 'RURAL',
  DISASTER: 'DISASTER',
};

export const PROJECT_CATEGORY_LABELS = {
  POVERTY: 'Hunger, Poverty & Malnutrition',
  HEALTH: 'Healthcare & Sanitation',
  EDUCATION: 'Education & Skill Development',
  GENDER: 'Gender Equality & Women Empowerment',
  ENVIRONMENT: 'Environmental Sustainability',
  HERITAGE: 'Heritage, Art & Culture',
  ARMED_FORCES: 'Armed Forces Veterans & Dependents',
  RURAL: 'Rural Development Projects',
  DISASTER: 'Disaster Relief & Rehabilitation',
};

export const PROJECT_CATEGORY_ICONS = {
  POVERTY: 'nutrition',
  HEALTH: 'medical_services',
  EDUCATION: 'school',
  GENDER: 'wc',
  ENVIRONMENT: 'eco',
  HERITAGE: 'account_balance',
  ARMED_FORCES: 'military_tech',
  RURAL: 'agriculture',
  DISASTER: 'emergency',
};

export const PROJECT_CATEGORY_OPTIONS = Object.entries(PROJECT_CATEGORY_LABELS).map(
  ([value, label]) => ({
    value,
    label,
    icon: PROJECT_CATEGORY_ICONS[value],
  })
);

// ─── Statuses ────────────────────────────────────────────────────────────

export const PROJECT_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  DOCS_PENDING: 'DOCS_PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  FUNDED: 'FUNDED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
};

export const PROJECT_STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted for Verification',
  UNDER_REVIEW: 'Under Review',
  DOCS_PENDING: 'Action Required / Docs Pending',
  VERIFIED: 'Verified & CSR Ready',
  REJECTED: 'Review Rejected',
  FUNDED: 'Funded',
  IN_PROGRESS: 'Implementation In Progress',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
};

export const PROJECT_STATUS_COLORS = {
  DRAFT: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  SUBMITTED: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  UNDER_REVIEW: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  DOCS_PENDING: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
    badge: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  VERIFIED: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  REJECTED: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  FUNDED: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  IN_PROGRESS: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
    dot: 'bg-cyan-500',
    badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  },
  COMPLETED: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    dot: 'bg-teal-500',
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  CLOSED: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

export const PROJECT_STATUS_ICONS = {
  DRAFT: 'edit_note',
  SUBMITTED: 'send',
  UNDER_REVIEW: 'hourglass_top',
  DOCS_PENDING: 'warning',
  VERIFIED: 'verified',
  REJECTED: 'cancel',
  FUNDED: 'monetization_on',
  IN_PROGRESS: 'engineering',
  COMPLETED: 'task_alt',
  CLOSED: 'lock',
};

// ─── Document Types ──────────────────────────────────────────────────────

export const PROJECT_DOCUMENT_TYPE = {
  PANCHAYAT_RESOLUTION: 'PANCHAYAT_RESOLUTION',
  LAND_PERMISSION: 'LAND_PERMISSION',
  TECHNICAL_ESTIMATE: 'TECHNICAL_ESTIMATE',
  MAINTENANCE_PLAN: 'MAINTENANCE_PLAN',
  BUDGET_BREAKDOWN: 'BUDGET_BREAKDOWN',
  NGO_REGISTRATION: 'NGO_REGISTRATION',
  OTHER: 'OTHER',
};

export const PROJECT_DOCUMENT_TYPE_LABELS = {
  PANCHAYAT_RESOLUTION: 'Gram Panchayat / Sabha Resolution',
  LAND_PERMISSION: 'Land Possession / NOC Certificate',
  TECHNICAL_ESTIMATE: 'Technical Cost Estimate (BOQ)',
  MAINTENANCE_PLAN: 'Operations & Maintenance Plan',
  BUDGET_BREAKDOWN: 'Detailed Line-Item Budget',
  NGO_REGISTRATION: 'NGO Statutory (12A/80G/CSR-1) Doc',
  OTHER: 'Other Supporting Document',
};

export const PROJECT_DOCUMENT_TYPE_OPTIONS = Object.entries(PROJECT_DOCUMENT_TYPE_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  })
);

// ─── Milestone Statuses ──────────────────────────────────────────────────

export const MILESTONE_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  VERIFIED: 'VERIFIED',
};

export const MILESTONE_STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  VERIFIED: 'Verified',
};

export const MILESTONE_STATUS_COLORS = {
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-amber-50 text-amber-700 border-amber-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};
