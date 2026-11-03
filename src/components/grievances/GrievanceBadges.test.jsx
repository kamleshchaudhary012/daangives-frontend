import React from 'react';
import { render, screen } from '../../test/utils';
import { describe, it, expect } from 'vitest';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import {
  GRIEVANCE_STATUS,
  GRIEVANCE_PRIORITY,
} from '../../constants/grievances';

describe('Grievance Badges — UI Polish & Accessibility', () => {
  describe('StatusBadge', () => {
    it('renders "Open" status badge with light neutral styling and subtle indicator', () => {
      const { container } = render(<StatusBadge status={GRIEVANCE_STATUS.OPEN} />);

      const badge = screen.getByRole('status', { name: /Status: Open/i });
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Open');

      // Light neutral styling & subtle border
      expect(badge.className).toContain('bg-slate-50');
      expect(badge.className).toContain('text-slate-700');
      expect(badge.className).toContain('border-slate-200');
      expect(badge.className).toContain('rounded-md');

      // Ensure no material-symbols-outlined icon with radio_button_unchecked exists
      expect(container.querySelector('.material-symbols-outlined')).toBeNull();
      expect(container.textContent).not.toContain('radio_button_unchecked');

      // Subtle indicator dot is present
      const dot = container.querySelector('.rounded-full');
      expect(dot).toBeInTheDocument();
      expect(dot.className).toContain('bg-slate-500');
      expect(dot.className).toContain('w-1.5');
      expect(dot.className).toContain('h-1.5');
    });

    it('renders md size with scaled padding and dot', () => {
      const { container } = render(<StatusBadge status={GRIEVANCE_STATUS.OPEN} size="md" />);
      const badge = screen.getByRole('status');

      expect(badge.className).toContain('px-2.5');
      expect(badge.className).toContain('py-1');
      expect(badge.className).toContain('text-xs');

      const dot = container.querySelector('.rounded-full');
      expect(dot.className).toContain('w-2');
      expect(dot.className).toContain('h-2');
    });

    it('renders other statuses distinctly with accessible labels', () => {
      const testCases = [
        { status: GRIEVANCE_STATUS.IN_PROGRESS, label: 'In Progress', bgClass: 'bg-blue-50' },
        { status: GRIEVANCE_STATUS.RESOLVED, label: 'Resolved', bgClass: 'bg-emerald-50' },
        { status: GRIEVANCE_STATUS.CLOSED, label: 'Closed', bgClass: 'bg-slate-100' },
        { status: GRIEVANCE_STATUS.PENDING, label: 'Pending', bgClass: 'bg-amber-50' },
      ];

      testCases.forEach(({ status, label, bgClass }) => {
        const { unmount } = render(<StatusBadge status={status} />);
        const badge = screen.getByRole('status', { name: `Status: ${label}` });
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent(label);
        expect(badge.className).toContain(bgClass);
        unmount();
      });
    });
  });

  describe('PriorityBadge', () => {
    it('renders "High" priority badge with soft amber tint and subtle indicator without oversized arrow', () => {
      const { container } = render(<PriorityBadge priority={GRIEVANCE_PRIORITY.HIGH} />);

      const badge = screen.getByRole('status', { name: /Priority: High/i });
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('High');

      // Soft amber tint & subtle border
      expect(badge.className).toContain('bg-amber-50');
      expect(badge.className).toContain('text-amber-800');
      expect(badge.className).toContain('border-amber-200');
      expect(badge.className).toContain('rounded-md');

      // Ensure no material-symbols-outlined icon with arrow_upward exists
      expect(container.querySelector('.material-symbols-outlined')).toBeNull();
      expect(container.textContent).not.toContain('arrow_upward');

      // Subtle indicator dot is present
      const dot = container.querySelector('.rounded-full');
      expect(dot).toBeInTheDocument();
      expect(dot.className).toContain('bg-amber-500');
      expect(dot.className).toContain('w-1.5');
      expect(dot.className).toContain('h-1.5');
    });

    it('renders md size with scaled padding and dot', () => {
      const { container } = render(<PriorityBadge priority={GRIEVANCE_PRIORITY.HIGH} size="md" />);
      const badge = screen.getByRole('status');

      expect(badge.className).toContain('px-2.5');
      expect(badge.className).toContain('py-1');
      expect(badge.className).toContain('text-xs');

      const dot = container.querySelector('.rounded-full');
      expect(dot.className).toContain('w-2');
      expect(dot.className).toContain('h-2');
    });

    it('renders all priority levels distinctly', () => {
      const testCases = [
        { priority: GRIEVANCE_PRIORITY.LOW, label: 'Low', bgClass: 'bg-slate-50' },
        { priority: GRIEVANCE_PRIORITY.MEDIUM, label: 'Medium', bgClass: 'bg-slate-50' },
        { priority: GRIEVANCE_PRIORITY.HIGH, label: 'High', bgClass: 'bg-amber-50' },
        { priority: GRIEVANCE_PRIORITY.URGENT, label: 'Urgent', bgClass: 'bg-rose-50' },
      ];

      testCases.forEach(({ priority, label, bgClass }) => {
        const { unmount } = render(<PriorityBadge priority={priority} />);
        const badge = screen.getByRole('status', { name: `Priority: ${label}` });
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent(label);
        expect(badge.className).toContain(bgClass);
        unmount();
      });
    });
  });

  describe('Badge Consistency', () => {
    it('applies matching typography, padding, and border radius across status and priority badges', () => {
      const { container: statusContainer } = render(<StatusBadge status={GRIEVANCE_STATUS.OPEN} />);
      const { container: priorityContainer } = render(<PriorityBadge priority={GRIEVANCE_PRIORITY.HIGH} />);

      const statusBadge = statusContainer.firstChild;
      const priorityBadge = priorityContainer.firstChild;

      // Both should share rounded-md, text-[11px], font-medium, px-2, py-0.5, gap-1.5
      expect(statusBadge.className).toContain('rounded-md');
      expect(priorityBadge.className).toContain('rounded-md');

      expect(statusBadge.className).toContain('text-[11px]');
      expect(priorityBadge.className).toContain('text-[11px]');

      expect(statusBadge.className).toContain('font-medium');
      expect(priorityBadge.className).toContain('font-medium');

      expect(statusBadge.className).toContain('px-2 py-0.5');
      expect(priorityBadge.className).toContain('px-2 py-0.5');

      expect(statusBadge.className).toContain('gap-1.5');
      expect(priorityBadge.className).toContain('gap-1.5');
    });
  });
});
