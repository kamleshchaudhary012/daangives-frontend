import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { mockAuth, clearAuth } from '../auth';

import RegisterPage from '../../pages/public/RegisterPage';
import NgoRegistrationPage from '../../pages/ngo/NgoRegistrationPage';
import LoginPage from '../../pages/public/LoginPage';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import NgoRegistrationFlowPage from '../../pages/ngo/NgoRegistrationFlowPage';
import NgoProfilePage from '../../pages/ngo/NgoProfilePage';

describe('NGO Registration Redirect Loop Fix and UI Polish (Phases 1-5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAuth();
    localStorage.clear();
    sessionStorage.clear();
  });

  // 1. /register renders both account-type options
  it('1. /register renders both account-type options with minimal brand header', () => {
    rtlRender(
      <MemoryRouter initialEntries={['/register']}>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Create CSR Connect Account')).toBeInTheDocument();
    expect(screen.getByText('Village / NGO / Sanstha')).toBeInTheDocument();
    expect(screen.getByText('CSR Donor / CSR Company')).toBeInTheDocument();

    // Verify minimal header brand and absence of large marketing navigation
    expect(screen.getByText('CSR')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Browse Projects$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Village Directory$/i })).not.toBeInTheDocument();
  });

  // 2. Selecting NGO registration opens the correct flow
  it('2. Selecting NGO registration presents Village/Sanstha form and preselects via query param', () => {
    rtlRender(
      <MemoryRouter initialEntries={['/register?role=NGO']}>
        <RegisterPage />
      </MemoryRouter>
    );

    // NGO-specific form inputs should be active
    expect(screen.getByPlaceholderText('e.g. Gramin Vikas Trust')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. MH/2021/0123456')).toBeInTheDocument();
    expect(screen.getByText(/Create Village \/ Sanstha Account/i)).toBeInTheDocument();
  });

  // 3. The Start Secure NGO Registration Flow button follows the intended route
  it('3. The Start Secure NGO Registration Flow button on /ngo/registration links to /ngo/registration-flow', () => {
    rtlRender(
      <MemoryRouter initialEntries={['/ngo/registration']}>
        <NgoRegistrationPage />
      </MemoryRouter>
    );

    const startBtn = screen.getByRole('link', { name: /Start Secure NGO Registration Flow/i });
    expect(startBtn).toBeInTheDocument();
    expect(startBtn).toHaveAttribute('href', '/ngo/registration-flow');
  });

  // 4. Unauthenticated users receive the correct behavior and clear guidance
  it('4. Unauthenticated users visiting /ngo/registration see account requirement guidance and /ngo/registration-flow redirects to /login?next=', async () => {
    // A: /ngo/registration guidance
    rtlRender(
      <MemoryRouter initialEntries={['/ngo/registration']}>
        <NgoRegistrationPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Account & Security Prerequisite')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create Village\/Sanstha Account First/i })).toHaveAttribute(
      'href',
      '/register?role=NGO'
    );

    // B: /ngo/registration-flow protected route redirect
    function TestApp() {
      const location = useLocation();
      return (
        <div>
          <span data-testid="current-pathname">{location.pathname}</span>
          <span data-testid="current-search">{location.search}</span>
          <Routes>
            <Route
              path="/ngo/registration-flow"
              element={
                <ProtectedRoute allowedRole="NGO">
                  <div>NGO Flow Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Target</div>} />
          </Routes>
        </div>
      );
    }

    rtlRender(
      <MemoryRouter initialEntries={['/ngo/registration-flow']}>
        <TestApp />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-pathname').textContent).toBe('/login');
      expect(screen.getByTestId('current-search').textContent).toContain('next=%2Fngo%2Fregistration-flow');
    });
  });

  // 5. Login restores the intended destination if authentication is required
  it('5. Login restores the intended destination (/ngo/registration-flow) after successful authentication', async () => {
    const mockNgoUser = {
      id: 'ngo-user-1',
      email: 'sanstha@village.org',
      full_name: 'Gram Sanstha Lead',
      role: 'NGO',
    };

    server.use(
      http.post('*/api/v1/auth/login/', () =>
        HttpResponse.json({
          access: 'mock-jwt-access',
          refresh: 'mock-jwt-refresh',
          user: mockNgoUser,
        })
      ),
      http.post('*/auth/login/', () =>
        HttpResponse.json({
          access: 'mock-jwt-access',
          refresh: 'mock-jwt-refresh',
          user: mockNgoUser,
        })
      )
    );

    function LoginApp() {
      const location = useLocation();
      return (
        <div>
          <span data-testid="active-path">{location.pathname}</span>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/ngo/registration-flow" element={<div data-testid="ngo-flow">Wizard Loaded</div>} />
            <Route path="/ngo/dashboard" element={<div data-testid="ngo-dash">Dashboard Loaded</div>} />
          </Routes>
        </div>
      );
    }

    rtlRender(
      <MemoryRouter initialEntries={['/login?next=/ngo/registration-flow']}>
        <LoginApp />
      </MemoryRouter>
    );

    // Verify explanatory notice is visible on /login
    expect(screen.getByText('Sign In Required to Continue')).toBeInTheDocument();

    // Fill credentials and log in
    fireEvent.change(screen.getByPlaceholderText('name@organization.org or csr@company.com'), {
      target: { value: 'sanstha@village.org' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'SecurePass123' },
    });

    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });
    fireEvent.click(submitBtn);

    // Verify redirected directly to /ngo/registration-flow, NOT /ngo/dashboard
    await waitFor(() => {
      expect(screen.getByTestId('active-path').textContent).toBe('/ngo/registration-flow');
      expect(screen.getByTestId('ngo-flow')).toBeInTheDocument();
      expect(screen.queryByTestId('ngo-dash')).not.toBeInTheDocument();
    });
  });

  // 6. Redirect loops are prevented
  it('6. Redirect loops are prevented across /login and /ngo/registration', () => {
    rtlRender(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    // Link to register as NGO leads to /ngo/registration
    const ngoRegLink = screen.getByRole('link', { name: /Register as NGO \/ Sanstha/i });
    expect(ngoRegLink).toHaveAttribute('href', '/ngo/registration');

    // Corporate link leads to /register
    const corpRegLink = screen.getByRole('link', { name: /Register as Corporate CSR Partner/i });
    expect(corpRegLink).toHaveAttribute('href', '/register');
  });

  // 7. Corporate CSR registration remains functional
  it('7. Corporate CSR registration remains functional and toggles correctly', () => {
    rtlRender(
      <MemoryRouter initialEntries={['/register']}>
        <RegisterPage />
      </MemoryRouter>
    );

    const companyBtn = screen.getByText('CSR Donor / CSR Company').closest('button');
    fireEvent.click(companyBtn);

    expect(screen.getByPlaceholderText('e.g. Tata Power Ltd')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. L28920MH1919PLC000567')).toBeInTheDocument();
    expect(screen.getByText(/Create CSR Donor Account/i)).toBeInTheDocument();
  });

  // 8. Existing NGO registration progress is preserved
  it('8. Existing NGO registration progress in DRAFT is loaded in /ngo/registration-flow', async () => {
    mockAuth({ id: 'ngo-draft-user', email: 'draft@sanstha.org', role: 'NGO' }, 'NGO');

    const mockDraftProfile = {
      id: 'ngo-draft-1',
      legal_name: 'Gramin Seva Samiti',
      display_name: 'Gramin Seva',
      category: 'EDUCATION',
      status: 'DRAFT',
      description: 'Initial draft for village education.',
    };

    server.use(
      http.get('*/api/v1/ngo/profile/me/', () => HttpResponse.json(mockDraftProfile)),
      http.get('*/api/v1/ngo/address/me/', () => HttpResponse.json(null)),
      http.get('*/api/v1/ngo/legal/me/', () => HttpResponse.json(null)),
      http.get('*/api/v1/ngo/bank/me/', () => HttpResponse.json(null)),
      http.get('*/api/v1/ngo/leadership/', () => HttpResponse.json([])),
      http.get('*/api/v1/ngo/documents/', () => HttpResponse.json([])),
      http.get('*/api/v1/ngo/verification/history/', () => HttpResponse.json([])),
      http.get('*/api/v1/users/profile/', () => HttpResponse.json({ role: 'NGO' }))
    );

    rtlRender(
      <MemoryRouter initialEntries={['/ngo/registration-flow']}>
        <NgoRegistrationFlowPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Gramin Seva Samiti')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Gramin Seva')).toBeInTheDocument();
    });
  });

  // 9. Duplicate registration and unauthorized access are prevented
  it('9. Unauthorized cross-role user (COMPANY) is blocked from /ngo/registration-flow', async () => {
    mockAuth({ id: 'comp-1', email: 'csr@tata.com', role: 'COMPANY' }, 'COMPANY');

    function CrossRoleApp() {
      const location = useLocation();
      return (
        <div>
          <span data-testid="cross-role-path">{location.pathname}</span>
          <Routes>
            <Route
              path="/ngo/registration-flow"
              element={
                <ProtectedRoute allowedRole="NGO">
                  <div>Protected NGO Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/company/dashboard" element={<div>Company Dashboard Target</div>} />
          </Routes>
        </div>
      );
    }

    rtlRender(
      <MemoryRouter initialEntries={['/ngo/registration-flow']}>
        <CrossRoleApp />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('cross-role-path').textContent).toBe('/company/dashboard');
    });
  });

  // 10. Existing approved NGO profile routing remains unchanged
  it('10. Approved NGO profile routing (/ngo/profile) displays verified organization view', async () => {
    const mockApprovedUser = {
      id: 'approved-ngo',
      email: 'approved@ngo.org',
      role: 'NGO',
    };
    mockAuth(mockApprovedUser, 'NGO');

    const mockProfile = {
      id: 'p-1',
      legal_name: 'Approved Sanstha Trust',
      display_name: 'Approved Sanstha',
      status: 'APPROVED',
      is_active: true,
      category: 'EDUCATION',
      official_email: 'approved@ngo.org',
      official_phone: '+91 99999 88888',
      year_established: '2018',
      address: {
        address_line1: 'Village Main St',
        city: 'Surat',
        district: 'Surat',
        state: 'Gujarat',
        pincode: '395001',
      },
      legal_info: {
        organisation_type: 'TRUST',
        registration_number: 'E/1234/SURAT',
        darpan_id: 'GJ/2020/001',
        pan_number: 'AABBT1234F',
        chief_trustee_name: 'Ramesh Patel',
      },
      bank_info: {
        bank_name: 'SBI',
        account_number_masked: '••••1234',
        ifsc_code: 'SBIN0001234',
        is_verified: true,
      },
      leadership: [],
      documents: [],
    };

    server.use(
      http.get('*/api/v1/ngo/profile/me/', () => HttpResponse.json(mockProfile)),
      http.get('*/api/v1/users/profile/', () => HttpResponse.json(mockApprovedUser)),
      http.get('*/api/v1/ngo/address/me/', () => HttpResponse.json(mockProfile.address)),
      http.get('*/api/v1/ngo/legal/me/', () => HttpResponse.json(mockProfile.legal_info)),
      http.get('*/api/v1/ngo/bank/me/', () => HttpResponse.json(mockProfile.bank_info)),
      http.get('*/api/v1/ngo/leadership/', () => HttpResponse.json([])),
      http.get('*/api/v1/ngo/documents/', () => HttpResponse.json([]))
    );

    rtlRender(
      <MemoryRouter initialEntries={['/ngo/profile']}>
        <NgoProfilePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Approved Sanstha/i })).toBeInTheDocument();
      expect(screen.getByText(/Verified & Approved/i)).toBeInTheDocument();
    });
  });
});
