import React from 'react';
import { render, screen, waitFor } from '../../test/utils';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import NgoAnalyticsPage from './NgoAnalyticsPage';
import { mockAuth, clearAuth } from '../../test/auth';
import { mockNgoUser } from '../../test/mocks/fixtures';
import { server } from '../../test/mocks/server';

describe('NgoAnalyticsPage', () => {
  beforeEach(() => {
    mockAuth(mockNgoUser, 'NGO');
  });

  afterEach(() => {
    clearAuth();
  });

  it('renders NGO metrics successfully', async () => {
    server.use(
      http.get('*/api/v1/analytics/ngo/me/', () => {
        return HttpResponse.json({
          total_received: 250000,
          donor_count: 42,
          campaigns_count: 4,
          by_month: [
            { month: 'Jan', amount: 100000 },
            { month: 'Feb', amount: 150000 },
          ]
        });
      })
    );

    render(<NgoAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Capital Received')).toBeInTheDocument();
    });

    expect(screen.getByText('Unique Donors')).toBeInTheDocument();
    expect(screen.getByText('Active Campaigns')).toBeInTheDocument();
  });
});
