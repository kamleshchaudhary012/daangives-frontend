import React from 'react';
import { render, screen, waitFor } from '../../test/utils';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import CompanyAnalyticsPage from './CompanyAnalyticsPage';
import { mockAuth, clearAuth } from '../../test/auth';
import { mockCompanyUser } from '../../test/mocks/fixtures';
import { server } from '../../test/mocks/server';

describe('CompanyAnalyticsPage', () => {
  beforeEach(() => {
    mockAuth(mockCompanyUser, 'COMPANY');
  });

  afterEach(() => {
    clearAuth();
  });

  it('renders company CSR metrics successfully', async () => {
    server.use(
      http.get('*/api/v1/analytics/company/me/', () => {
        return HttpResponse.json({
          total_csr_spend: 1200000,
          active_partnerships: 3,
          completed_partnerships: 2,
          compliance_status: 'Compliant'
        });
      })
    );

    render(<CompanyAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('CSR Portfolio & Impact Analytics')).toBeInTheDocument();
    });

    expect(screen.getByText('Total CSR Capital Deployed')).toBeInTheDocument();
    expect(screen.getByText('Active Partnerships')).toBeInTheDocument();
    expect(screen.getByText('MCA Compliance Status')).toBeInTheDocument();
  });
});
