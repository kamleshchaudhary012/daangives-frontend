/**
 * Grievance Constants — Phase 5.1.6A
 * ====================================
 * Status, priority, category labels and color maps for UI rendering.
 * Mirrors backend GrievanceCategory, GrievancePriority, GrievanceStatus TextChoices.
 */

// ─── Status ──────────────────────────────────────────────

export const GRIEVANCE_STATUS = {
  OPEN: 'OPEN',
  IN_REVIEW: 'IN_REVIEW',
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED',
};

export const GRIEVANCE_STATUS_LABELS = {
  OPEN: 'Open',
  IN_REVIEW: 'In Review',
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
};

export const GRIEVANCE_STATUS_COLORS = {
  OPEN: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' },
  IN_REVIEW: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  RESOLVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  CLOSED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

export const GRIEVANCE_STATUS_ICONS = {
  OPEN: 'radio_button_unchecked',
  IN_REVIEW: 'pending',
  PENDING: 'pending',
  IN_PROGRESS: 'sync',
  RESOLVED: 'check_circle',
  CLOSED: 'lock',
  REJECTED: 'cancel',
};

// ─── Priority ─────────────────────────────────────────────

export const GRIEVANCE_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};

export const GRIEVANCE_PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const GRIEVANCE_PRIORITY_COLORS = {
  LOW: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  MEDIUM: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-sky-500' },
  HIGH: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  URGENT: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

export const GRIEVANCE_PRIORITY_ICONS = {
  LOW: 'arrow_downward',
  MEDIUM: 'remove',
  HIGH: 'arrow_upward',
  URGENT: 'priority_high',
};

// ─── Category ─────────────────────────────────────────────

export const GRIEVANCE_CATEGORY = {
  DONATION_PAYMENT: 'DONATION_PAYMENT',
  RECEIPT_80G: 'RECEIPT_80G',
  CAMPAIGN_FRAUD: 'CAMPAIGN_FRAUD',
  CSR_PARTNERSHIP_DISPUTE: 'CSR_PARTNERSHIP_DISPUTE',
  NGO_CONDUCT: 'NGO_CONDUCT',
  TECHNICAL_SUPPORT: 'TECHNICAL_SUPPORT',
  OTHER: 'OTHER',
};

export const GRIEVANCE_CATEGORY_LABELS = {
  DONATION_PAYMENT: 'Donation & Payment',
  RECEIPT_80G: '80G Tax Receipt',
  CAMPAIGN_FRAUD: 'Campaign Fraud / Misrepresentation',
  CSR_PARTNERSHIP_DISPUTE: 'CSR Partnership Dispute',
  NGO_CONDUCT: 'NGO Conduct & Compliance',
  TECHNICAL_SUPPORT: 'Technical Support',
  OTHER: 'Other',
};

export const GRIEVANCE_CATEGORY_ICONS = {
  DONATION_PAYMENT: 'payments',
  RECEIPT_80G: 'receipt_long',
  CAMPAIGN_FRAUD: 'report',
  CSR_PARTNERSHIP_DISPUTE: 'handshake',
  NGO_CONDUCT: 'shield',
  TECHNICAL_SUPPORT: 'build',
  OTHER: 'help',
};

// ─── Options for form selects ─────────────────────────────

export const CATEGORY_OPTIONS = Object.entries(GRIEVANCE_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const PRIORITY_OPTIONS = Object.entries(GRIEVANCE_PRIORITY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const STATUS_OPTIONS = Object.entries(GRIEVANCE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));
