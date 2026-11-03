import React from 'react';
import { render, screen, waitFor } from '../../test/utils';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import DonationTrackingPage from './DonationTrackingPage';
import { mockAuth, clearAuth } from '../../test/auth';
import { mockUser } from '../../test/mocks/fixtures';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('DonationTrackingPage', () => {
  beforeEach(() => {
    mockAuth(mockUser, 'DONOR');
  });

  afterEach(() => {
    clearAuth();
  });

  it('renders donor contributions and campaign tracking', async () => {
    render(<DonationTrackingPage />);

    expect(screen.getByText(/Loading your supported campaigns/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Geotagged Impact & Logistics Tracking')).toBeInTheDocument();
    });

    // Verifies campaign tabs or pill appears
    expect(screen.getAllByText('Clean Drinking Water for Rural Schools').length).toBeGreaterThan(0);

    // Verifies donation receipt pill appears
    expect(screen.getByText('DG-M-20261001-A1B2C3')).toBeInTheDocument();

    // Verifies tracking summary for selected campaign is displayed
    await waitFor(() => {
      expect(screen.getByText(/Campaign Verification Summary/i)).toBeInTheDocument();
      expect(screen.getAllByText('₹25,000.00').length).toBeGreaterThan(0);
    });
  });

  it('shows empty state when donor has no contributions', async () => {
    server.use(
      http.get('*/api/v1/donor/monetary-donations/', () => {
        return HttpResponse.json([]);
      })
    );

    render(<DonationTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText(/No Contributions Found Yet/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /Explore Verified Campaigns/i })).toBeInTheDocument();
  });
});
