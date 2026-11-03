import React, { StrictMode } from 'react';
import { render, screen, waitFor, fireEvent } from '../../../test/utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AdminCsrCompaniesPage from './AdminCsrCompaniesPage';
import * as api from '../../../services/api';

describe('AdminCsrCompaniesPage Integration Tests', () => {
  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify({ role: 'ADMIN' }));
    localStorage.setItem('accessToken', 'mock-admin-token');
    vi.restoreAllMocks();
  });

  it('renders pending verification queue by default and displays pending corporate partners', async () => {
    const mockPendingCompany = {
      id: '925f882d-747f-44e5-bddd-c34307dbb5b6',
      company_name: 'PySquad Corp',
      legal_name: 'PySquad Technologies Ltd',
      cin_number: 'L12345MH2020PLC123456',
      pan_number: 'CKUPC8425M',
      contact_person_name: 'Jane Doe',
      contact_email: 'spoc@pysquad.com',
      verification_status: 'PENDING_VERIFICATION',
      annual_csr_budget: '5000000.00',
    };

    vi.spyOn(api, 'getAdminCsrAnalytics').mockResolvedValue({
      total_companies: 12,
      approved_companies: 3,
      pending_companies: 7,
      rejected_companies: 2,
      suspended_companies: 0,
    });

    vi.spyOn(api, 'listAdminCsrCompanies').mockImplementation(async (params) => {
      // Expect default filter to be PENDING_VERIFICATION
      expect(params.status).toBe('PENDING_VERIFICATION');
      return {
        count: 1,
        results: [mockPendingCompany],
      };
    });

    render(
      <StrictMode>
        <AdminCsrCompaniesPage />
      </StrictMode>
    );

    // Verify company appears
    await waitFor(() => {
      expect(screen.getByText('PySquad Corp')).toBeInTheDocument();
    });

    // Verify KPI count matches analytics
    expect(screen.getByText('7')).toBeInTheDocument(); // pending count
  });

  it('allows inspecting pending company and shows Approve and Reject action buttons', async () => {
    const mockCompany = {
      id: '925f882d-747f-44e5-bddd-c34307dbb5b6',
      company_name: 'PySquad Corp',
      legal_name: 'PySquad Technologies Ltd',
      cin_number: 'L12345MH2020PLC123456',
      pan_number: 'CKUPC8425M',
      contact_person_name: 'Jane Doe',
      contact_person_designation: 'CSR Head',
      contact_email: 'spoc@pysquad.com',
      contact_phone: '+919876543210',
      registered_address: 'Main Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380009',
      verification_status: 'PENDING_VERIFICATION',
      annual_csr_budget: '5000000.00',
      has_verification_document: true,
      verification_document_name: 'incorporation_cert.pdf',
    };

    vi.spyOn(api, 'getAdminCsrAnalytics').mockResolvedValue({
      total_companies: 1,
      approved_companies: 0,
      pending_companies: 1,
      rejected_companies: 0,
      suspended_companies: 0,
    });

    vi.spyOn(api, 'listAdminCsrCompanies').mockResolvedValue({
      count: 1,
      results: [mockCompany],
    });

    vi.spyOn(api, 'getAdminCsrCompanyDetail').mockResolvedValue(mockCompany);

    render(
      <StrictMode>
        <AdminCsrCompaniesPage />
      </StrictMode>
    );

    await waitFor(() => {
      expect(screen.getByText('PySquad Corp')).toBeInTheDocument();
    });

    // Click inspect
    const inspectBtn = screen.getByText('Inspect');
    fireEvent.click(inspectBtn);

    // Verify modal dossier opens and action buttons exist
    await waitFor(() => {
      expect(screen.getByText('Corporate Verification Dossier')).toBeInTheDocument();
      expect(screen.getByText('Approve Corporate Partner')).toBeInTheDocument();
      expect(screen.getByText('Reject Profile')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /close dossier/i }).length).toBe(2);
      expect(screen.getByText('Document on File')).toBeInTheDocument();
    });

    // Close modal via footer Close Dossier button
    const closeButtons = screen.getAllByRole('button', { name: /close dossier/i });
    fireEvent.click(closeButtons[1]);
    await waitFor(() => {
      expect(screen.queryByText('Corporate Verification Dossier')).not.toBeInTheDocument();
    });

    // Reopen modal via inspect
    fireEvent.click(screen.getByText('Inspect'));
    await waitFor(() => {
      expect(screen.getByText('Corporate Verification Dossier')).toBeInTheDocument();
    });

    // Close modal via header X button (aria-label="Close dossier")
    fireEvent.click(screen.getByLabelText('Close dossier'));
    await waitFor(() => {
      expect(screen.queryByText('Corporate Verification Dossier')).not.toBeInTheDocument();
    });
  });

  it('shows clear draft guidance when inspecting a DRAFT company in Drafts tab', async () => {
    const mockDraftCompany = {
      id: 'draft-id-123',
      company_name: 'Draft Corp',
      legal_name: 'Draft Corp Ltd',
      cin_number: 'L12345MH2020PLC123456',
      pan_number: 'CKUPC8425M',
      contact_person_name: 'John Doe',
      contact_email: 'john@draft.com',
      verification_status: 'DRAFT',
      annual_csr_budget: '10000.00',
    };

    vi.spyOn(api, 'getAdminCsrAnalytics').mockResolvedValue({
      total_companies: 1,
      approved_companies: 0,
      pending_companies: 0,
      rejected_companies: 0,
      suspended_companies: 0,
    });

    vi.spyOn(api, 'listAdminCsrCompanies').mockResolvedValue({
      count: 1,
      results: [mockDraftCompany],
    });

    vi.spyOn(api, 'getAdminCsrCompanyDetail').mockResolvedValue(mockDraftCompany);

    render(
      <StrictMode>
        <AdminCsrCompaniesPage />
      </StrictMode>
    );

    // Switch to Drafts tab
    const draftsTab = screen.getByText('Drafts');
    fireEvent.click(draftsTab);

    await waitFor(() => {
      expect(screen.getByText('Draft Corp')).toBeInTheDocument();
    });

    // Inspect draft
    const inspectBtn = screen.getByText('Inspect');
    fireEvent.click(inspectBtn);

    await waitFor(() => {
      expect(screen.getByText('Corporate Verification Dossier')).toBeInTheDocument();
      expect(screen.getByText(/Draft Profile: Review and approval actions become available once submitted by company/i)).toBeInTheDocument();
    });
  });
});
