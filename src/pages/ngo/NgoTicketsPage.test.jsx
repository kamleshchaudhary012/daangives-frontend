import React from 'react';
import { render, screen, waitFor } from '../../test/utils';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import NgoTicketsPage from './NgoTicketsPage';
import { mockAuth, clearAuth } from '../../test/auth';
import { mockNgoUser } from '../../test/mocks/fixtures';

describe('NgoTicketsPage — Support Ticket Card and Badges', () => {
  beforeEach(() => {
    mockAuth(mockNgoUser, 'NGO');
  });

  afterEach(() => {
    clearAuth();
  });

  it('renders ticket cards with polished status and priority badges', async () => {
    const { container } = render(<NgoTicketsPage />);

    // Wait for tickets to load
    await waitFor(() => {
      expect(screen.getByText('Support Tickets (NGO)')).toBeInTheDocument();
      expect(screen.getByText('Test Grievance')).toBeInTheDocument();
    });

    // Verify ticket number and title
    expect(screen.getAllByText('GRV-2026-001')[0]).toBeInTheDocument();
    expect(screen.getByText('Test Grievance')).toBeInTheDocument();

    // Verify StatusBadge renders Open with subtle styling and no empty circle icon
    const openBadge = screen.getByRole('status', { name: /Status: Open/i });
    expect(openBadge).toBeInTheDocument();
    expect(openBadge).toHaveTextContent('Open');
    expect(openBadge.className).toContain('bg-slate-50');
    expect(openBadge.className).toContain('text-slate-700');
    expect(openBadge.className).toContain('border-slate-200');
    expect(openBadge.className).toContain('rounded-md');

    // Verify PriorityBadge renders High with soft amber tint and no oversized upward arrow
    const highBadge = screen.getAllByRole('status', { name: /Priority: High/i })[0];
    expect(highBadge).toBeInTheDocument();
    expect(highBadge).toHaveTextContent('High');
    expect(highBadge.className).toContain('bg-amber-50');
    expect(highBadge.className).toContain('text-amber-800');
    expect(highBadge.className).toContain('border-amber-200');
    expect(highBadge.className).toContain('rounded-md');

    // Ensure neither radio_button_unchecked nor arrow_upward are rendered
    expect(container.textContent).not.toContain('radio_button_unchecked');
    expect(container.textContent).not.toContain('arrow_upward');

    // Verify indicator dots are present on the badges
    const dots = container.querySelectorAll('.rounded-full.shrink-0');
    expect(dots.length).toBeGreaterThanOrEqual(2);
  });
});
