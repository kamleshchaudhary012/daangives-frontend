import React from 'react';
import { render, screen, waitFor } from '../../test/utils';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import DonorAnalyticsPage from './DonorAnalyticsPage';
import { mockAuth, clearAuth } from '../../test/auth';
import { mockUser } from '../../test/mocks/fixtures';
import { server } from '../../test/mocks/server';

describe('DonorAnalyticsPage', () => {
  beforeEach(() => {
    mockAuth(mockUser, 'DONOR');
  });

  afterEach(() => {
    clearAuth();
  });

  it('renders donor metrics successfully', async () => {
    server.use(
      http.get('*/api/v1/analytics/donor/me/', () => {
        return HttpResponse.json({
          total_donated: 15000,
          donation_count: 5,
          tax_savings_estimate: 7500,
          campaigns_supported: 3,
          by_month: [
            { month: 'Jan', amount: 5000 },
            { month: 'Feb', amount: 10000 },
          ]
        });
      })
    );

    render(<DonorAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('My Giving Impact Analytics')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Donated')).toBeInTheDocument();
    expect(screen.getByText('Est. Tax Savings (80G)')).toBeInTheDocument();
    expect(screen.getByText('Campaigns Supported')).toBeInTheDocument();
  });
});
