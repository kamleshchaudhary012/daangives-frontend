import React from 'react';
import { render, screen, fireEvent } from '../../test/utils';
import { describe, it, expect } from 'vitest';
import DistributionProofCard from './DistributionProofCard';

const mockProof = {
  id: 'proof-uuid-1',
  photo_url: 'http://localhost:8000/media/proofs/test.jpg',
  caption: 'Distributed 50 nutrition kits to primary school students',
  latitude: '18.5204',
  longitude: '73.8567',
  location_name: 'Pune Municipal School No 4',
  beneficiary_count: 50,
  beneficiary_type: 'STUDENT',
  beneficiary_type_display: 'Students',
  beneficiary_notes: 'Each kit contained pulse, oats, and multivitamin supplements.',
  spent_amount: '25000.00',
  expense_breakdown: { nutrition_kits: 20000, logistics: 5000 },
  distribution_date: '2026-10-01',
  status: 'VERIFIED',
  reviewed_at: '2026-10-02T10:00:00Z',
  // Defensive check: ensure private fields if present are never rendered
  admin_notes: 'INTERNAL_SECRET_ADMIN_NOTE',
  rejection_reason: 'INTERNAL_SECRET_REJECTION',
};

describe('DistributionProofCard', () => {
  it('renders verified distribution proof details accurately', () => {
    render(<DistributionProofCard proof={mockProof} />);

    expect(screen.getByText('VERIFIED')).toBeInTheDocument();
    expect(screen.getByText(/Distributed 50 nutrition kits/i)).toBeInTheDocument();
    expect(screen.getByText(/Pune Municipal School No 4/i)).toBeInTheDocument();
    expect(screen.getByText(/50 Students/i)).toBeInTheDocument();
    expect(screen.getByText(/₹25,000.00 spent/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Maps/i })).toHaveAttribute(
      'href',
      'https://www.google.com/maps?q=18.5204,73.8567'
    );
  });

  it('never leaks internal administrative or moderation fields', () => {
    render(<DistributionProofCard proof={mockProof} />);

    expect(screen.queryByText(/INTERNAL_SECRET_ADMIN_NOTE/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/INTERNAL_SECRET_REJECTION/i)).not.toBeInTheDocument();
  });

  it('opens and closes proof detail modal on user interaction', () => {
    render(<DistributionProofCard proof={mockProof} />);

    // Click "Inspect Evidence"
    const inspectBtn = screen.getByRole('button', { name: /Inspect Evidence/i });
    fireEvent.click(inspectBtn);

    // Modal should now be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Beneficiary & Distribution Notes/i)).toBeInTheDocument();
    expect(screen.getByText(/Each kit contained pulse/i)).toBeInTheDocument();

    // Close modal via close button
    const closeBtn = screen.getByRole('button', { name: /Close dialog/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
