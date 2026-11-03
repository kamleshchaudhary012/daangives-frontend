import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { mockAuth, clearAuth } from '../auth';
import NgoCsrDashboardPage from '../../pages/ngo/csr/NgoCsrDashboardPage';
import * as api from '../../services/api';

// Mock useProfileGuard to control profile state in tests
vi.mock('../../hooks/useProfileGuard', () => ({
  default: vi.fn(() => ({ status: 'ready', profile: { id: 'ngo-1', legal_name: 'Test Foundation' } })),
}));

// Mock API service methods
vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getNgoCsrDashboard: vi.fn(),
  };
});

describe('NGO CSR Dashboard Access & Eligibility Safeguards (Bugfix Regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAuth();
    localStorage.clear();
    sessionStorage.clear();
    mockAuth({ id: 'ngo-user-1', email: 'ngo@example.org', role: 'NGO' }, 'NGO');
  });

  const renderDashboard = () =>
    render(
      <MemoryRouter initialEntries={['/ngo/csr/dashboard']}>
        <NgoCsrDashboardPage />
      </MemoryRouter>
    );

  it('1. Approved, CSR-verified NGO loads CSR Console successfully with metrics', async () => {
    api.getNgoCsrDashboard.mockResolvedValueOnce({
      ngo_name: 'Seva Shakti Trust',
      active_proposals_count: 3,
      draft_proposals_count: 4,
      incoming_requests_pending_count: 2,
      active_partnerships_count: 1,
      total_funding_partnered: '1500000.00',
      pending_milestone_submissions: [],
    });

    renderDashboard();

    // Verify loading skeleton resolves
    await waitFor(() => {
      expect(screen.getByText('Seva Shakti Trust')).toBeInTheDocument();
    });

    expect(screen.getByText('CSR Connect Console')).toBeInTheDocument();
    expect(screen.getByText('Verified NGO')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Active proposals
    expect(screen.getByText('4')).toBeInTheDocument(); // Draft proposals
    expect(screen.getByText(/Capital:/i)).toBeInTheDocument(); // Capital partnered
    expect(screen.getByText('No Overdue Milestone Submissions')).toBeInTheDocument();
  });

  it('2. Approved, CSR-verified NGO with 0 proposals receives dedicated onboarding empty state', async () => {
    api.getNgoCsrDashboard.mockResolvedValueOnce({
      ngo_name: 'Gram Vikas Sanstha',
      active_proposals_count: 0,
      draft_proposals_count: 0,
      incoming_requests_pending_count: 0,
      active_partnerships_count: 0,
      total_funding_partnered: '0.00',
      pending_milestone_submissions: [],
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Gram Vikas Sanstha')).toBeInTheDocument();
    });

    // Check onboarding empty state banner
    expect(screen.getByText('No CSR Proposals Published Yet')).toBeInTheDocument();
    expect(
      screen.getByText(/Your NGO is CSR-verified and eligible to receive corporate CSR grants/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create Your First CSR Proposal/i })).toHaveAttribute(
      'href',
      '/ngo/csr/requirements/new'
    );
  });

  it('3. Approved but CSR-ineligible NGO displays statutory Section 135 compliance guidance instead of crash error', async () => {
    const ineligibleError = new Error(
      'Access restricted to statutory CSR-eligible NGOs. Your organization must hold valid 12A/80G (or 10(23C)) tax exemptions, Form CSR-1 registration, and at least 3 years operational track record under Section 135 & MCA Rule 4.'
    );
    ineligibleError.status = 403;
    ineligibleError.data = {
      code: 'NGO_CSR_INELIGIBLE',
      detail: ineligibleError.message,
    };
    api.getNgoCsrDashboard.mockRejectedValueOnce(ineligibleError);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('CSR Connect Access Restricted')).toBeInTheDocument();
    });

    expect(screen.getByText('Statutory CSR Eligibility Required')).toBeInTheDocument();
    expect(screen.getByText(/Section 135 of the Companies Act, 2013/i)).toBeInTheDocument();
    expect(screen.getByText('Eligible Legal Structure')).toBeInTheDocument();
    expect(screen.getByText('Tax Exemption Status')).toBeInTheDocument();
    expect(screen.getByText('MCA Form CSR-1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Update Legal Credentials/i })).toHaveAttribute(
      'href',
      '/ngo/registration-flow'
    );
    expect(screen.getByRole('button', { name: /Re-check Status/i })).toBeInTheDocument();
  });

  it('4. NGO with CSR eligibility pending Admin verification displays pending compliance review card', async () => {
    const unverifiedError = new Error(
      'Access restricted to CSR-verified NGO accounts. Your CSR eligibility credentials are pending Admin verification.'
    );
    unverifiedError.status = 403;
    unverifiedError.data = {
      code: 'NGO_CSR_UNVERIFIED',
      detail: unverifiedError.message,
    };
    api.getNgoCsrDashboard.mockRejectedValueOnce(unverifiedError);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Admin CSR Verification Pending')).toBeInTheDocument();
    });

    expect(screen.getByText('Compliance Review In Progress')).toBeInTheDocument();
    expect(screen.getByText(/Platform Compliance Officer is currently verifying your records/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check Verification Status/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return to Portal/i })).toHaveAttribute(
      'href',
      '/ngo/dashboard'
    );
  });

  it('5. Unapproved NGO displays application in progress card', async () => {
    const unapprovedError = new Error(
      'Access restricted to approved NGO accounts. Your registration is currently pending review.'
    );
    unapprovedError.status = 403;
    unapprovedError.data = {
      code: 'NGO_NOT_APPROVED',
      detail: unapprovedError.message,
    };
    api.getNgoCsrDashboard.mockRejectedValueOnce(unapprovedError);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('NGO Registration Pending Approval')).toBeInTheDocument();
    });

    expect(screen.getByText('Application In Review')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Application Flow/i })).toHaveAttribute(
      'href',
      '/ngo/registration-flow'
    );
  });

  it('6. Retry button retries failed request and updates view when status resolves', async () => {
    // 1st call fails
    const initialError = new Error(
      'Access restricted to statutory CSR-eligible NGOs. Your organization must hold valid 12A/80G (or 10(23C)) tax exemptions, Form CSR-1 registration, and at least 3 years operational track record under Section 135 & MCA Rule 4.'
    );
    initialError.status = 403;
    initialError.data = { code: 'NGO_CSR_INELIGIBLE', detail: initialError.message };
    api.getNgoCsrDashboard.mockRejectedValueOnce(initialError);

    // 2nd call succeeds after user resolved credentials
    api.getNgoCsrDashboard.mockResolvedValueOnce({
      ngo_name: 'Now Verified Foundation',
      active_proposals_count: 1,
      draft_proposals_count: 0,
      incoming_requests_pending_count: 0,
      active_partnerships_count: 0,
      total_funding_partnered: '0.00',
      pending_milestone_submissions: [],
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('CSR Connect Access Restricted')).toBeInTheDocument();
    });

    // Click retry button
    const retryBtn = screen.getByRole('button', { name: /Re-check Status/i });
    fireEvent.click(retryBtn);

    // Assert that getNgoCsrDashboard was called again
    expect(api.getNgoCsrDashboard).toHaveBeenCalledTimes(2);

    // Assert that the dashboard view updated with new data
    await waitFor(() => {
      expect(screen.getByText('Now Verified Foundation')).toBeInTheDocument();
    });
    expect(screen.queryByText('CSR Connect Access Restricted')).not.toBeInTheDocument();
  });
});
