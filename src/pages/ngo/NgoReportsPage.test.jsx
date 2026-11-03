import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../test/utils';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import NgoReportsPage from './NgoReportsPage';
import { mockAuth, clearAuth } from '../../test/auth';
import { mockNgoUser, mockDistributionProof } from '../../test/mocks/fixtures';
import { server } from '../../test/mocks/server';

describe('NgoReportsPage', () => {
  beforeEach(() => {
    mockAuth(mockNgoUser, 'NGO');
  });

  afterEach(() => {
    clearAuth();
  });

  it('renders loading state initially', () => {
    server.use(
      http.get('*/api/v1/ngo/campaigns/distribution-proofs/', async () => {
        return new Promise(() => {}); // never resolves
      })
    );

    render(<NgoReportsPage />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders distribution proofs successfully with KPIs and details', async () => {
    render(<NgoReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Distribution & Field Impact Reports')).toBeInTheDocument();
    });

    // Check KPIs
    expect(screen.getByText('Total Evidence Submissions')).toBeInTheDocument();
    expect(screen.getByText('Beneficiaries Reached')).toBeInTheDocument();
    expect(screen.getByText('Total Funds Utilized')).toBeInTheDocument();

    // Check proof card content
    expect(screen.getByText(mockDistributionProof.caption)).toBeInTheDocument();
    expect(screen.getByText('Clean Drinking Water for Rural Schools')).toBeInTheDocument();
    expect(screen.getByText('Procurement of RO Filtration Plants')).toBeInTheDocument();
    expect(screen.getByText('Pune Municipal School No 4')).toBeInTheDocument();
    expect(screen.getByText('View Location')).toBeInTheDocument();
    expect(screen.getAllByText('Verified').length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when no distribution proofs exist', async () => {
    server.use(
      http.get('*/api/v1/ngo/campaigns/distribution-proofs/', () => {
        return HttpResponse.json({ count: 0, results: [] });
      })
    );

    render(<NgoReportsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    expect(screen.getByText('No Distribution Proofs Found')).toBeInTheDocument();
    expect(screen.getByText('Go to Campaign Needs')).toBeInTheDocument();
  });

  it('renders error state and handles retry gracefully', async () => {
    server.use(
      http.get('*/api/v1/ngo/campaigns/distribution-proofs/', () => {
        return HttpResponse.json({ detail: 'Database error' }, { status: 500 });
      })
    );

    render(<NgoReportsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to Load Reports')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    // Now mock recovery
    server.use(
      http.get('*/api/v1/ngo/campaigns/distribution-proofs/', () => {
        return HttpResponse.json({ count: 1, results: [mockDistributionProof] });
      })
    );

    fireEvent.click(screen.getByText('Try Again'));

    await waitFor(() => {
      expect(screen.getByText(mockDistributionProof.caption)).toBeInTheDocument();
    });
  });

  it('opens inspect evidence modal when Inspect Evidence button is clicked', async () => {
    render(<NgoReportsPage />);

    await waitFor(() => {
      expect(screen.getByText(mockDistributionProof.caption)).toBeInTheDocument();
    });

    const inspectBtn = screen.getByText('Inspect Evidence');
    fireEvent.click(inspectBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByText('Beneficiary Notes')).toBeInTheDocument();
    expect(screen.getByText(mockDistributionProof.beneficiary_notes)).toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('displays revision requested feedback correctly when present', async () => {
    const revisionProof = {
      ...mockDistributionProof,
      id: 'proof-rev-1',
      status: 'REVISION_REQUESTED',
      rejection_reason: 'Please upload clearer photo showing beneficiary signatures.',
    };

    server.use(
      http.get('*/api/v1/ngo/campaigns/distribution-proofs/', () => {
        return HttpResponse.json({ count: 1, results: [revisionProof] });
      })
    );

    render(<NgoReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Revision Requested')).toBeInTheDocument();
    });

    expect(screen.getByText('Admin Revision Requested')).toBeInTheDocument();
    expect(screen.getByText('Please upload clearer photo showing beneficiary signatures.')).toBeInTheDocument();
  });

  it('renders ProfileSetupRequired onboarding state when NGO profile does not exist (404 / missing)', async () => {
    server.use(
      http.get('*/api/v1/ngo/profile/me/', () => {
        return HttpResponse.json({ detail: 'NGO profile not found.' }, { status: 404 });
      })
    );

    render(<NgoReportsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-missing-state')).toBeInTheDocument();
    });

    expect(screen.getByText('NGO Profile Setup Required')).toBeInTheDocument();
    expect(screen.getByText('Complete NGO Registration')).toBeInTheDocument();
  });

  it('renders ProfileSetupRequired onboarding state when backend returns 403 NGO Profile does not exist', async () => {
    server.use(
      http.get('*/api/v1/ngo/campaigns/distribution-proofs/', () => {
        return HttpResponse.json({ detail: 'NGO Profile does not exist.' }, { status: 403 });
      })
    );

    render(<NgoReportsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-missing-state')).toBeInTheDocument();
    });

    expect(screen.getByText('NGO Profile Setup Required')).toBeInTheDocument();
    expect(screen.getByText('Complete NGO Registration')).toBeInTheDocument();
  });

  it('renders draft profile state when NGO profile is in DRAFT status', async () => {
    server.use(
      http.get('*/api/v1/ngo/profile/me/', () => {
        return HttpResponse.json({ id: 'ngo-1', name: 'Draft Foundation', status: 'DRAFT' });
      })
    );

    render(<NgoReportsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('draft-profile-state')).toBeInTheDocument();
    });

    expect(screen.getByText('Complete Your Registration Application')).toBeInTheDocument();
    expect(screen.getByText('Continue Registration')).toBeInTheDocument();
  });

  it('renders verification pending state when NGO profile is SUBMITTED or UNDER_REVIEW', async () => {
    server.use(
      http.get('*/api/v1/ngo/profile/me/', () => {
        return HttpResponse.json({ id: 'ngo-1', name: 'Pending Foundation', status: 'SUBMITTED' });
      })
    );

    render(<NgoReportsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('verification-pending-state')).toBeInTheDocument();
    });

    expect(screen.getByText('Organization Verification In Progress')).toBeInTheDocument();
    expect(screen.getByText('View Application Status')).toBeInTheDocument();
  });

  it('renders correction required state when NGO profile is CORRECTION_REQUIRED', async () => {
    server.use(
      http.get('*/api/v1/ngo/profile/me/', () => {
        return HttpResponse.json({ id: 'ngo-1', name: 'Correction Foundation', status: 'CORRECTION_REQUIRED' });
      })
    );

    render(<NgoReportsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('correction-required-state')).toBeInTheDocument();
    });

    expect(screen.getByText('Application Revisions Required')).toBeInTheDocument();
    expect(screen.getByText('Update Application')).toBeInTheDocument();
  });

  it('renders access denied state on unauthorized access / non-NGO role 403', async () => {
    server.use(
      http.get('*/api/v1/ngo/campaigns/distribution-proofs/', () => {
        return HttpResponse.json({ detail: 'You do not have permission to perform this action.' }, { status: 403 });
      })
    );

    render(<NgoReportsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('unauthorized-state')).toBeInTheDocument();
    });

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/You do not have permission to access NGO distribution reports/)).toBeInTheDocument();
  });
});
