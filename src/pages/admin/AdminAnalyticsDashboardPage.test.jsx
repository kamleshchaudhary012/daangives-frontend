import React from 'react';
import { render, screen, waitFor } from '../../test/utils';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import AdminAnalyticsDashboardPage from './AdminAnalyticsDashboardPage';
import { mockAuth, clearAuth } from '../../test/auth';
import { mockAdminUser } from '../../test/mocks/fixtures';
import { server } from '../../test/mocks/server';

describe('AdminAnalyticsDashboardPage', () => {
  beforeEach(() => {
    mockAuth(mockAdminUser, 'ADMIN');
  });

  afterEach(() => {
    clearAuth();
  });

  it('renders overview KPIs and charts when data loads', async () => {
    server.use(
      http.get('*/api/v1/analytics/admin/overview/', () => {
        return HttpResponse.json({
          donations: {
            total_amount: 500000,
            total_count: 120,
            by_month: [
              { month: 'Jan', amount: 200000 },
              { month: 'Feb', amount: 300000 },
            ]
          },
          ngos: {
            total: 25,
            verified: 20,
            pending: 3,
            rejected: 2
          },
          csr: {
            total_spend: 1500000,
            active_partnerships: 8
          },
          grievances: {
            total: 10,
            open: 2
          }
        });
      })
    );

    render(<AdminAnalyticsDashboardPage />);

    // Wait for the overview data to load
    await waitFor(() => {
      expect(screen.getByText('Platform Analytics & Intelligence')).toBeInTheDocument();
    });

    // Check KPI cards
    expect(screen.getByText('Total Donations')).toBeInTheDocument();
    expect(screen.getByText('Active NGOs')).toBeInTheDocument();
    expect(screen.getByText('CSR Spend')).toBeInTheDocument();
    expect(screen.getByText('Open Grievances')).toBeInTheDocument();
  });

  it('shows error banner when overview fails', async () => {
    server.use(
      http.get('*/api/v1/analytics/admin/overview/', () => {
        return HttpResponse.json({ detail: 'Server Error' }, { status: 500 });
      })
    );

    render(<AdminAnalyticsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load analytics dashboard/i)).toBeInTheDocument();
    });
  });
});
