import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render as rtlRender, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { render } from '../utils';
import { mockAuth, clearAuth } from '../auth';

import NgoProfilePage from '../../pages/ngo/NgoProfilePage';
import NgoRegistrationFlowPage from '../../pages/ngo/NgoRegistrationFlowPage';
import NgoRegistrationPage from '../../pages/ngo/NgoRegistrationPage';
import NgoDashboardPage from '../../pages/ngo/NgoDashboardPage';

const mockApprovedNgoUser = {
  id: 'user-ngo-1',
  email: 'seva@trustseva.org',
  full_name: 'Trust seva Admin',
  role: 'NGO',
  is_verified: true,
};

const mockApprovedProfile = {
  id: 'ngo-101',
  display_name: 'Trust seva',
  legal_name: 'Trust Seva Public Charitable Trust',
  gujarati_name: 'ટ્રસ્ટ સેવા ચેરિટેબલ ટ્રસ્ટ',
  status: 'APPROVED',
  is_active: true,
  is_public: true,
  category: 'EDUCATION',
  year_established: '2015',
  verified_at: '2025-01-15T10:00:00Z',
  official_email: 'contact@trustseva.org',
  official_phone: '+91 98765 43210',
  website: 'https://trustseva.org',
  description: 'Empowering village schools with digital learning and infrastructure.',
  mission_statement: 'Quality education access for every rural student in Gujarat.',
  address: {
    address_line1: '101 Seva Bhavan, Station Road',
    address_line2: 'Near Post Office',
    city: 'Bhavnagar',
    district: 'Bhavnagar',
    state: 'Gujarat',
    pincode: '364001',
    service_areas: 'Bhavnagar, Amreli, Rajkot',
  },
  legal_info: {
    organisation_type: 'TRUST',
    registering_authority: 'Charity Commissioner Bhavnagar',
    registration_number: 'E/9876/BVN',
    registration_state: 'Gujarat',
    darpan_id: 'GJ/2023/0246810',
    pan_number: 'AAATT1234F',
    has_12a: true,
    twelve_a_number: 'CIT/EXEMP/12A/2018/55',
    has_80g: true,
    eighty_g_number: 'CIT/EXEMP/80G/2018/99',
    chief_trustee_name: 'Rameshbhai Patel',
    chief_trustee_designation: 'Managing Trustee',
  },
  bank_info: {
    bank_name: 'State Bank of India',
    account_number_masked: '••••••••4321',
    ifsc_code: 'SBIN0001234',
    account_type: 'CURRENT',
    branch_name: 'Station Road Branch, Bhavnagar',
    is_verified: true,
  },
  leadership: [
    {
      id: 1,
      full_name: 'Rameshbhai Patel',
      designation: 'Managing Trustee',
      email: 'ramesh@trustseva.org',
      phone: '+91 98765 11111',
      is_primary_contact: true,
    },
    {
      id: 2,
      full_name: 'Anitaben Shah',
      designation: 'Treasurer & Trustee',
      email: 'anita@trustseva.org',
      phone: '+91 98765 22222',
      is_primary_contact: false,
    },
  ],
  documents: [
    {
      id: 201,
      document_type: 'TRUST_DEED',
      original_filename: 'Trust_Deed_Registered_Copy.pdf',
    },
    {
      id: 202,
      document_type: 'DARPAN_CERTIFICATE',
      original_filename: 'NITI_Aayog_Darpan_GJ2023.pdf',
    },
    {
      id: 203,
      document_type: 'EIGHTY_G_CERT',
      original_filename: 'Form_10AC_80G_Approval.pdf',
    },
  ],
};

describe('NGO Profile Routing and Layout Consistency', () => {
  beforeEach(() => {
    clearAuth();
    server.use(
      http.get('*/api/v1/ngo/history/', () => HttpResponse.json([]))
    );
  });

  afterEach(() => {
    clearAuth();
    vi.restoreAllMocks();
  });

  describe('Phase 1 & 2: NGO Profile Destination for Approved NGO', () => {
    it('Approved and complete NGO renders dedicated NgoProfilePage with verified credentials instead of restarting the registration wizard', async () => {
      mockAuth(mockApprovedNgoUser, 'NGO');

      server.use(
        http.get('*/api/v1/ngo/profile/me/', () => {
          return HttpResponse.json(mockApprovedProfile);
        }),
        http.get('*/api/v1/users/profile/', () => {
          return HttpResponse.json(mockApprovedNgoUser);
        })
      );

      render(<NgoProfilePage />);

      // Organization identity header rendered
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Trust seva/i })).toBeInTheDocument();
      });

      // Verification badge and status
      expect(screen.getByText(/Verified & Approved/i)).toBeInTheDocument();
      expect(screen.getByText(/Darpan: GJ\/2023\/0246810/i)).toBeInTheDocument();

      // Statutory & Legal credentials locked
      expect(screen.getByText('Statutory & Legal Credentials')).toBeInTheDocument();
      expect(screen.getByText('E/9876/BVN')).toBeInTheDocument();
      expect(screen.getByText('AAATT1234F')).toBeInTheDocument();
      expect(screen.getByText(/CIT\/EXEMP\/12A\/2018\/55/i)).toBeInTheDocument();
      expect(screen.getByText(/CIT\/EXEMP\/80G\/2018\/99/i)).toBeInTheDocument();

      // Disbursement Bank details locked
      expect(screen.getByText('Disbursement Bank Account')).toBeInTheDocument();
      expect(screen.getByText('State Bank of India')).toBeInTheDocument();
      expect(screen.getByText('••••••••4321')).toBeInTheDocument();
      expect(screen.getByText('SBIN0001234')).toBeInTheDocument();

      // Registered office & operations
      expect(screen.getByText('Registered Office & Service Area')).toBeInTheDocument();
      expect(screen.getAllByText('Bhavnagar').length).toBeGreaterThanOrEqual(1);

      // Governing board
      expect(screen.getByText('Rameshbhai Patel')).toBeInTheDocument();
      expect(screen.getByText('Anitaben Shah')).toBeInTheDocument();

      // Verified statutory documents
      expect(screen.getByText('Trust Deed / MoA / Bye-Laws')).toBeInTheDocument();
      expect(screen.getByText('Trust_Deed_Registered_Copy.pdf')).toBeInTheDocument();

      // Registration wizard step indicators should NOT be rendered
      expect(screen.queryByText('Step 1: NGO Profile Information')).not.toBeInTheDocument();
      expect(screen.queryByText('Save & Continue')).not.toBeInTheDocument();
    });

    it('Incomplete NGO in DRAFT status is redirected from /ngo/profile to /ngo/registration-flow to continue saved progress', async () => {
      mockAuth(mockApprovedNgoUser, 'NGO');

      const draftProfile = {
        ...mockApprovedProfile,
        status: 'DRAFT',
      };

      server.use(
        http.get('*/api/v1/ngo/profile/me/', () => {
          return HttpResponse.json(draftProfile);
        }),
        http.get('*/api/v1/users/profile/', () => {
          return HttpResponse.json(mockApprovedNgoUser);
        }),
        http.get('*/api/v1/ngo/address/me/', () => HttpResponse.json(null, { status: 404 })),
        http.get('*/api/v1/ngo/legal/me/', () => HttpResponse.json(null, { status: 404 })),
        http.get('*/api/v1/ngo/bank/me/', () => HttpResponse.json(null, { status: 404 })),
        http.get('*/api/v1/ngo/leadership/', () => HttpResponse.json([])),
        http.get('*/api/v1/ngo/documents/', () => HttpResponse.json([]))
      );

      rtlRender(
        <MemoryRouter initialEntries={['/ngo/profile']}>
          <Routes>
            <Route path="/ngo/profile" element={<NgoProfilePage />} />
            <Route path="/ngo/registration-flow" element={<NgoRegistrationFlowPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should automatically navigate to /ngo/registration-flow step 1
      await waitFor(() => {
        expect(screen.getByText('Step 1: NGO Profile Information')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /Save & Continue/i })).toBeInTheDocument();
    });

    it('Pending review NGO shows Application Pending State Administrative Verification banner with locked edits', async () => {
      mockAuth(mockApprovedNgoUser, 'NGO');

      const reviewProfile = {
        ...mockApprovedProfile,
        status: 'UNDER_REVIEW',
      };

      server.use(
        http.get('*/api/v1/ngo/profile/me/', () => HttpResponse.json(reviewProfile)),
        http.get('*/api/v1/users/profile/', () => HttpResponse.json(mockApprovedNgoUser))
      );

      render(<NgoProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/Application Pending State Administrative Verification/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Active Review/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /View Submission Wizard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Contact Support/i })).toBeInTheDocument();
    });

    it('Correction required NGO shows reviewer feedback and link to make corrections in wizard', async () => {
      mockAuth(mockApprovedNgoUser, 'NGO');

      const correctionProfile = {
        ...mockApprovedProfile,
        status: 'CORRECTION_REQUIRED',
        verification: {
          correction_instructions: 'Please re-upload a clear copy of the 80G certificate with visible stamp and valid registration order.',
        },
      };

      server.use(
        http.get('*/api/v1/ngo/profile/me/', () => HttpResponse.json(correctionProfile)),
        http.get('*/api/v1/users/profile/', () => HttpResponse.json(mockApprovedNgoUser))
      );

      render(<NgoProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/Reviewer Corrections Requested/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Please re-upload a clear copy of the 80G certificate/i)
      ).toBeInTheDocument();

      const editBtn = screen.getByRole('link', { name: /Make Corrections & Resubmit/i });
      expect(editBtn).toBeInTheDocument();
      expect(editBtn).toHaveAttribute('href', '/ngo/registration-flow');
    });

    it('Approved but genuinely incomplete NGO shows explanation warning and permitted actions', async () => {
      mockAuth(mockApprovedNgoUser, 'NGO');

      const incompleteApprovedProfile = {
        id: 'ngo-999',
        display_name: 'Approved Incomplete NGO',
        legal_name: '',
        status: 'APPROVED',
        category: 'HEALTHCARE',
        address: null, // missing address
        legal_info: null, // missing legal info
        bank_info: null, // missing bank info
      };

      server.use(
        http.get('*/api/v1/ngo/profile/me/', () => HttpResponse.json(incompleteApprovedProfile)),
        http.get('*/api/v1/users/profile/', () => HttpResponse.json(mockApprovedNgoUser))
      );

      render(<NgoProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/Approved — Incomplete Profile Information/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Registered Office Address/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Disbursement Bank Account/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('link', { name: /Complete Missing Sections/i })).toBeInTheDocument();
    });
  });

  describe('Phase 3: Consistent Authenticated Workspace Layout vs Public Site Layout', () => {
    it('NgoProfilePage renders inside NgoLayout (Village / Sanstha sidebar and header) without public marketing navigation', async () => {
      mockAuth(mockApprovedNgoUser, 'NGO');

      server.use(
        http.get('*/api/v1/ngo/profile/me/', () => HttpResponse.json(mockApprovedProfile)),
        http.get('*/api/v1/users/profile/', () => HttpResponse.json(mockApprovedNgoUser))
      );

      render(<NgoProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Village / Sanstha Portal')).toBeInTheDocument();
      });

      // Authenticated sidebar links are present
      expect(screen.getByRole('link', { name: /NGO Dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /NGO Profile/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /My Projects/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Campaigns/i })).toBeInTheDocument();

      // Public marketing navbar items must NOT be present
      expect(screen.queryByRole('link', { name: /Browse Projects/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Village Directory/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Village Console/i })).not.toBeInTheDocument();
    });

    it('NgoRegistrationFlowPage renders inside NgoLayout without public marketing navbar', async () => {
      mockAuth(mockApprovedNgoUser, 'NGO');

      server.use(
        http.get('*/api/v1/ngo/profile/me/', () => HttpResponse.json(mockApprovedProfile)),
        http.get('*/api/v1/users/profile/', () => HttpResponse.json(mockApprovedNgoUser)),
        http.get('*/api/v1/ngo/address/me/', () => HttpResponse.json(mockApprovedProfile.address)),
        http.get('*/api/v1/ngo/legal/me/', () => HttpResponse.json(mockApprovedProfile.legal_info)),
        http.get('*/api/v1/ngo/bank/me/', () => HttpResponse.json(mockApprovedProfile.bank_info)),
        http.get('*/api/v1/ngo/leadership/', () => HttpResponse.json(mockApprovedProfile.leadership)),
        http.get('*/api/v1/ngo/documents/', () => HttpResponse.json(mockApprovedProfile.documents))
      );

      render(<NgoRegistrationFlowPage />);

      await waitFor(() => {
        expect(screen.getByText('Village / Sanstha Portal')).toBeInTheDocument();
      });

      // Authenticated sidebar is present
      expect(screen.getByRole('link', { name: /NGO Dashboard/i })).toBeInTheDocument();

      // Public marketing items must NOT be present
      expect(screen.queryByRole('link', { name: /Browse Projects/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Village Directory/i })).not.toBeInTheDocument();

      // Quick action to view verified profile exists
      expect(screen.getByRole('button', { name: /View NGO Profile/i })).toBeInTheDocument();
    });

    it('Public pages like NgoRegistrationPage retain PublicLayout with marketing navigation', async () => {
      render(<NgoRegistrationPage />);

      // Public guide content
      expect(screen.getByRole('heading', { name: /Partner With DaanGives/i })).toBeInTheDocument();

      // Public navbar is present on public pages
      expect(screen.getAllByRole('link', { name: /Browse Projects/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('link', { name: /Village Directory/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('link', { name: /(For Companies|CSR Portal)/i }).length).toBeGreaterThanOrEqual(1);
    });

    it('NGO Dashboard banner for APPROVED status links directly to /ngo/profile', async () => {
      mockAuth(mockApprovedNgoUser, 'NGO');

      server.use(
        http.get('*/api/v1/ngo/profile/me/', () => HttpResponse.json(mockApprovedProfile)),
        http.get('*/api/v1/users/profile/', () => HttpResponse.json(mockApprovedNgoUser)),
        http.get('*/api/v1/ngo/address/me/', () => HttpResponse.json(mockApprovedProfile.address)),
        http.get('*/api/v1/ngo/legal/me/', () => HttpResponse.json(mockApprovedProfile.legal_info)),
        http.get('*/api/v1/ngo/bank/me/', () => HttpResponse.json(mockApprovedProfile.bank_info)),
        http.get('*/api/v1/ngo/leadership/', () => HttpResponse.json([])),
        http.get('*/api/v1/ngo/documents/', () => HttpResponse.json([])),
        http.get('*/api/v1/ngo/donations/monetary/', () => HttpResponse.json([])),
        http.get('*/api/v1/projects/', () => HttpResponse.json({ results: [] })),
        http.get('*/api/v1/campaigns/needs/', () => HttpResponse.json({ results: [] })),
        http.get('*/api/v1/ngo/reports/', () => HttpResponse.json({ results: [] })),
        http.get('*/api/v1/ngo/tickets/', () => HttpResponse.json({ results: [] }))
      );

      render(<NgoDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('NGO Verification Approved')).toBeInTheDocument();
      });

      const profileLink = screen.getByRole('link', { name: /View Verified Profile/i });
      expect(profileLink).toBeInTheDocument();
      expect(profileLink).toHaveAttribute('href', '/ngo/profile');
    });
  });
});
