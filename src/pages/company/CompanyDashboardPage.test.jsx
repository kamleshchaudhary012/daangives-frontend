import React from 'react';
import { render, screen, waitFor } from '../../test/utils';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import CompanyDashboardPage from './CompanyDashboardPage';
import { mockAuth, clearAuth } from '../../test/auth';
import { mockCompanyUser } from '../../test/mocks/fixtures';
import { server } from '../../test/mocks/server';

describe('CompanyDashboardPage', () => {
  beforeEach(() => {
    mockAuth(mockCompanyUser, 'COMPANY');
  });

  afterEach(() => {
    clearAuth();
  });

  it('renders dashboard correctly when profile exists', async () => {
    render(<CompanyDashboardPage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Explore Marketplace/i)).toBeInTheDocument();
    });
  });

  it('shows NO_COMPANY_PROFILE state when backend returns 404', async () => {
    // Override the handler for this specific test
    server.use(
      http.get('*/api/v1/csr/dashboard/', () => {
        return HttpResponse.json({ code: 'NO_COMPANY_PROFILE', detail: 'No company profile found' }, { status: 404 });
      })
    );

    render(<CompanyDashboardPage />);
    
    // Should display the setup prompt
    await waitFor(() => {
      expect(screen.getByText(/Corporate Profile Setup Required/i)).toBeInTheDocument();
    });
    
    expect(screen.getByRole('link', { name: /Create Company Profile/i })).toBeInTheDocument();
  });
});
