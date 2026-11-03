import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { mockAuth, clearAuth } from '../auth';

import NgoRegistrationFlowPage from '../../pages/ngo/NgoRegistrationFlowPage';
import NgoProfilePage from '../../pages/ngo/NgoProfilePage';
import AdminNgoVerificationPage from '../../pages/admin/AdminNgoVerificationPage';
import NgoPublicProfilePage from '../../pages/public/NgoPublicProfilePage';
import * as api from '../../services/api';

describe('CSR-1 / CRN Frontend Implementation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAuth();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('1. Registration Flow: renders CSR-1 checkbox and shows CRN input when checked', async () => {
    mockAuth({ id: 'ngo-user-1', email: 'ngo@example.org', role: 'NGO' }, 'NGO');

    const mockProfile = {
      id: 'ngo-1',
      legal_name: 'Test Foundation Legal Entity',
      display_name: 'Test Foundation',
      category: 'EDUCATION',
      status: 'DRAFT',
      year_established: '2020',
      official_email: 'ngo@example.org',
      official_phone: '+919876543210',
      description: 'A test foundation committed to rural education and empowerment.',
    };

    const mockAddress = {
      address_line1: '123 Village Road',
      city: 'Ahmedabad',
      district: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380001',
    };

    const mockLegal = {
      organisation_type: 'TRUST',
      registering_authority: 'Charity Commissioner',
      registration_number: 'E/12345/Ahmedabad',
      darpan_id: 'GJ/2021/0123456',
      pan_number: 'AAATT1234F',
      registration_state: 'Gujarat',
      chief_trustee_name: 'Ramesh Patel',
      chief_trustee_designation: 'Managing Trustee',
      has_12a: true,
      twelve_a_number: '12A-12345',
      has_80g: true,
      eighty_g_number: '80G-12345',
      has_fcra: false,
      has_csr_1: true,
      csr_registration_number: 'CSR00012345',
      csr_registration_date: '2023-01-15',
    };

    server.use(
      http.get('*/api/v1/ngo/profile/me/', () => HttpResponse.json(mockProfile)),
      http.get('*/api/v1/ngo/address/me/', () => HttpResponse.json(mockAddress)),
      http.get('*/api/v1/ngo/legal/me/', () => HttpResponse.json(mockLegal)),
      http.get('*/api/v1/ngo/bank/me/', () => HttpResponse.json(null)),
      http.get('*/api/v1/ngo/leadership/', () => HttpResponse.json([])),
      http.get('*/api/v1/ngo/documents/', () => HttpResponse.json([])),
      http.get('*/api/v1/ngo/history/', () => HttpResponse.json([])),
      http.get('*/api/v1/auth/me/', () => HttpResponse.json({ id: 'ngo-user-1', email: 'ngo@example.org', role: 'NGO' }))
    );

    rtlRender(
      <MemoryRouter initialEntries={['/ngo/registration-flow']}>
        <NgoRegistrationFlowPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Foundation Legal Entity')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Foundation')).toBeInTheDocument();
    });

    // Navigate to Step 3: Legal
    const step3Btn = screen.getByRole('button', { name: /3\. Legal/i });
    fireEvent.click(step3Btn);

    // Verify CSR-1 elements exist in Step 3
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /Has Form CSR-1 \/ CRN Registration/i })).toBeInTheDocument();
      expect(screen.getByText('Form CSR-1 / CRN Registration Number *')).toBeInTheDocument();
      expect(screen.getByDisplayValue('CSR00012345')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2023-01-15')).toBeInTheDocument();
    });
  });

  it('2. Registration Flow Step 6 & 7: includes CSR-1 cert in document list and displays CRN in review', async () => {
    mockAuth({ id: 'ngo-user-2', email: 'ngo2@example.org', role: 'NGO' }, 'NGO');

    const mockProfile = {
      id: 'ngo-2',
      legal_name: 'Gramin Vikas Trust',
      display_name: 'Gramin Vikas',
      category: 'RURAL_DEV',
      status: 'DRAFT',
      year_established: '2019',
      official_email: 'ngo2@example.org',
      official_phone: '+919876543210',
      description: 'Long description of rural development initiatives across Gujarat districts.',
    };

    const mockLegal = {
      organisation_type: 'TRUST',
      registering_authority: 'Charity Commissioner',
      registration_number: 'E/55555/Surat',
      darpan_id: 'GJ/2022/9999999',
      pan_number: 'BBBBB1234C',
      registration_state: 'Gujarat',
      chief_trustee_name: 'Suresh Shah',
      chief_trustee_designation: 'Trustee',
      has_csr_1: true,
      csr_registration_number: 'CSR00099999',
    };

    server.use(
      http.get('*/api/v1/ngo/profile/me/', () => HttpResponse.json(mockProfile)),
      http.get('*/api/v1/ngo/address/me/', () => HttpResponse.json(null)),
      http.get('*/api/v1/ngo/legal/me/', () => HttpResponse.json(mockLegal)),
      http.get('*/api/v1/ngo/bank/me/', () => HttpResponse.json(null)),
      http.get('*/api/v1/ngo/leadership/', () => HttpResponse.json([])),
      http.get('*/api/v1/ngo/documents/', () => HttpResponse.json([])),
      http.get('*/api/v1/ngo/history/', () => HttpResponse.json([])),
      http.get('*/api/v1/auth/me/', () => HttpResponse.json({ id: 'ngo-user-2', email: 'ngo2@example.org', role: 'NGO' }))
    );

    rtlRender(
      <MemoryRouter initialEntries={['/ngo/registration-flow']}>
        <NgoRegistrationFlowPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Gramin Vikas Trust')).toBeInTheDocument();
    });

    // Navigate to Step 6: Docs
    const step6Btn = screen.getByRole('button', { name: /6\. Docs/i });
    fireEvent.click(step6Btn);

    // Form CSR-1 Certificate should be listed because has_csr_1 is true
    await waitFor(() => {
      expect(screen.getByText('Form CSR-1 / CRN Registration Certificate')).toBeInTheDocument();
    });

    // Navigate to Step 7: Submit
    const step7Btn = screen.getByRole('button', { name: /7\. Submit/i });
    fireEvent.click(step7Btn);

    // Review card should show CSR-1 number
    await waitFor(() => {
      expect(screen.getByText(/CSR-1: CSR00099999/i)).toBeInTheDocument();
    });
  });

  it('3. NGO Profile View: renders CSR-1 status and CSR Funding Eligibility', async () => {
    const mockUser = { id: 'ngo-p-1', email: 'csrngo@example.org', role: 'NGO' };
    mockAuth(mockUser, 'NGO');

    const mockProfile = {
      id: 'p-csr-1',
      legal_name: 'Shree Hari Sanstha',
      display_name: 'Shree Hari',
      status: 'APPROVED',
      is_active: true,
      category: 'HEALTHCARE',
      official_email: 'csrngo@example.org',
      official_phone: '+919999988888',
      year_established: '2015',
      address: {
        address_line1: 'Health Complex',
        city: 'Rajkot',
        district: 'Rajkot',
        state: 'Gujarat',
        pincode: '360001',
      },
      legal_info: {
        organisation_type: 'TRUST',
        registration_number: 'E/9876/RAJKOT',
        darpan_id: 'GJ/2019/7777777',
        pan_number: 'CCCTC1234D',
        chief_trustee_name: 'Dinesh Mehta',
        chief_trustee_designation: 'Managing Trustee',
        has_12a: true,
        twelve_a_number: '12A-9876',
        has_80g: true,
        eighty_g_number: '80G-9876',
        has_csr_1: true,
        csr_registration_number: 'CSR00077777',
        csr_registration_date: '2022-05-10',
        is_csr_eligible: true,
      },
      bank_info: {
        bank_name: 'Bank of Baroda',
        masked_account_number: '••••5678',
        ifsc_code: 'BARB0RAJKOT',
      },
      leadership: [],
      documents: [
        {
          id: 'doc-csr-1',
          document_type: 'CSR_1_CERT',
          original_filename: 'csr1_certificate.pdf',
          file_size_bytes: 524288,
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
        },
      ],
    };

    server.use(
      http.get('*/api/v1/ngo/profile/me/', () => HttpResponse.json(mockProfile)),
      http.get('*/api/v1/auth/me/', () => HttpResponse.json(mockUser)),
      http.get('*/api/v1/ngo/address/me/', () => HttpResponse.json(mockProfile.address)),
      http.get('*/api/v1/ngo/legal/me/', () => HttpResponse.json(mockProfile.legal_info)),
      http.get('*/api/v1/ngo/bank/me/', () => HttpResponse.json(mockProfile.bank_info)),
      http.get('*/api/v1/ngo/leadership/', () => HttpResponse.json([])),
      http.get('*/api/v1/ngo/documents/', () => HttpResponse.json(mockProfile.documents))
    );

    rtlRender(
      <MemoryRouter initialEntries={['/ngo/profile']}>
        <NgoProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Shree Hari/i })).toBeInTheDocument();
      expect(screen.getByText(/MCA Form CSR-1 \/ CRN/i)).toBeInTheDocument();
      expect(screen.getByText(/CRN: CSR00077777/i)).toBeInTheDocument();
      expect(screen.getByText(/Reg Date: 2022-05-10/i)).toBeInTheDocument();
      expect(screen.getByText(/Eligible for Corporate CSR/i)).toBeInTheDocument();
      expect(screen.getByText('Form CSR-1 Registration Certificate')).toBeInTheDocument();
    });
  });

  it('4. Admin NGO Inspection: displays Form CSR-1 and CSR Statutory Eligibility in Tab C', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'ADMIN' }));
    localStorage.setItem('accessToken', 'mock-admin-token');

    const mockAdminNgoList = {
      count: 1,
      results: [
        {
          id: 'admin-ngo-1',
          legal_name: 'Gujarat Rural Vikas Sanstha',
          display_name: 'Gujarat Rural Vikas',
          status: 'UNDER_REVIEW',
          category: 'RURAL_DEV',
          address: { city: 'Gandhinagar', district: 'Gandhinagar' },
          legal_info: {
            darpan_id: 'GJ/2021/1111111',
            has_csr_1: true,
          },
        },
      ],
    };

    const mockDetail = {
      id: 'admin-ngo-1',
      legal_name: 'Gujarat Rural Vikas Sanstha',
      display_name: 'Gujarat Rural Vikas',
      status: 'UNDER_REVIEW',
      category: 'RURAL_DEV',
      legal_info: {
        organisation_type: 'SECTION_8',
        pan_number: 'AAACR1234E',
        darpan_id: 'GJ/2021/1111111',
        registration_number: 'U85300GJ2021NPL123456',
        chief_trustee_name: 'Ketan Parikh',
        chief_trustee_designation: 'Director',
        has_12a: true,
        twelve_a_number: '12A-11111',
        has_80g: true,
        eighty_g_number: '80G-11111',
        has_fcra: false,
        has_csr_1: true,
        csr_registration_number: 'CSR00011111',
        csr_registration_date: '2021-08-20',
        is_csr_eligible: true,
      },
      bank_info: {
        account_holder_name: 'Gujarat Rural Vikas Sanstha',
        account_number: '123456789012',
        ifsc_code: 'SBIN0000001',
        bank_name: 'SBI',
        account_type: 'CURRENT',
      },
      leadership: [],
      documents: [],
      verification: {
        resubmission_count: 0,
        resubmission_limit: 3,
      },
    };

    vi.spyOn(api, 'getAdminNgos').mockResolvedValue(mockAdminNgoList);
    vi.spyOn(api, 'getAdminNgoById').mockResolvedValue(mockDetail);
    vi.spyOn(api, 'getAdminNgoHistory').mockResolvedValue([]);

    rtlRender(
      <MemoryRouter initialEntries={['/admin/ngos']}>
        <AdminNgoVerificationPage />
      </MemoryRouter>
    );

    // Verify row with CSR-1 indicator badge
    await waitFor(() => {
      expect(screen.getByText('Gujarat Rural Vikas')).toBeInTheDocument();
      expect(screen.getByText('CSR-1')).toBeInTheDocument();
    });

    // Click Review Application
    const reviewBtn = screen.getByRole('button', { name: /Review Application/i });
    fireEvent.click(reviewBtn);

    // Switch to Tab C: Legal
    await waitFor(() => {
      const legalTabBtn = screen.getByRole('button', { name: /C\. Legal/i });
      fireEvent.click(legalTabBtn);
    });

    // Verify CSR-1 details and eligibility
    await waitFor(() => {
      expect(screen.getByText(/Yes \(CSR00011111 - 2021-08-20\)/i)).toBeInTheDocument();
      expect(screen.getByText(/✓ Eligible for Corporate CSR Funding/i)).toBeInTheDocument();
    });
  });

  it('5. Public NGO Profile: shows CSR-1 Verified badge when verified', async () => {
    const mockPublicNgo = {
      id: 'pub-ngo-1',
      slug: 'seva-foundation',
      legal_name: 'Seva Foundation',
      display_name: 'Seva Foundation',
      category: 'EDUCATION',
      darpan_id: 'GJ/2020/5555555',
      has_12a: true,
      has_80g: true,
      has_csr_1: true,
      is_csr_verified: true,
      has_fcra: false,
      year_established: 2017,
      description: 'Dedicated to education for underprivileged children.',
      address: { city: 'Vadodara', district: 'Vadodara', state: 'Gujarat' },
    };

    vi.spyOn(api, 'getPublicNgoBySlugOrId').mockResolvedValue(mockPublicNgo);
    vi.spyOn(api, 'getPublicCampaigns').mockResolvedValue([]);

    rtlRender(
      <MemoryRouter initialEntries={['/ngos/seva-foundation']}>
        <Routes>
          <Route path="/ngos/:id" element={<NgoPublicProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Seva Foundation' })).toBeInTheDocument();
      expect(screen.getByText('CSR-1 Verified')).toBeInTheDocument();
      expect(screen.getByText('80G Certified')).toBeInTheDocument();
      expect(screen.getByText('12A Registered')).toBeInTheDocument();
      expect(screen.getByText('Darpan ID: GJ/2020/5555555')).toBeInTheDocument();
    });
  });
});
