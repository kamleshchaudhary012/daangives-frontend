import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { mockAuth, clearAuth } from '../auth';
import { mockCompanyUser, mockNgoUser } from '../mocks/fixtures';
import CompanyProfilePage from '../../pages/company/CompanyProfilePage';
import NgoProfilePage from '../../pages/ngo/NgoProfilePage';
import NgoRegistrationFlowPage from '../../pages/ngo/NgoRegistrationFlowPage';
import CompanyPreferencesPage from '../../pages/company/CompanyPreferencesPage';
import CompanyRequestsPage from '../../pages/company/CompanyRequestsPage';
import CompanyPartnershipsPage from '../../pages/company/CompanyPartnershipsPage';
import CompanyDashboardPage from '../../pages/company/CompanyDashboardPage';
import NgoCsrDashboardPage from '../../pages/ngo/csr/NgoCsrDashboardPage';
import NgoAnalyticsPage from '../../pages/ngo/NgoAnalyticsPage';
import NgoDashboardPage from '../../pages/ngo/NgoDashboardPage';
import CreateProjectPage from '../../pages/ngo/CreateProjectPage';

describe('Profile Pages 404 Empty Form Creation & Dependent Guards Fix', () => {
  afterEach(() => {
    clearAuth();
  });

  describe('CompanyProfilePage', () => {
    it('renders empty form without error when GET /csr/profile/me/ returns 404 NO_COMPANY_PROFILE', async () => {
      mockAuth(mockCompanyUser, 'COMPANY');

      server.use(
        http.get('*/api/v1/csr/profile/me/', () => {
          return HttpResponse.json(
            { code: 'NO_COMPANY_PROFILE', detail: 'No company profile found for this user account.' },
            { status: 404 }
          );
        })
      );

      render(<CompanyProfilePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create corporate profile/i })).toBeInTheDocument();
      });

      // Verification status should show DRAFT (not an error alert)
      expect(screen.queryByText('Failed to fetch corporate profile.')).not.toBeInTheDocument();
      expect(screen.queryByText('No company profile found for this user account.')).not.toBeInTheDocument();

      // Submit button should read "Create Corporate Profile"
      const submitBtn = screen.getByRole('button', { name: /create corporate profile/i });
      expect(submitBtn).toBeInTheDocument();

      // Form inputs should be blank
      const companyInput = screen.getByPlaceholderText('e.g. Tata Consultancy Services');
      expect(companyInput).toHaveValue('');
    });

    it('submits POST /csr/profile/me/ when creating a new corporate profile', async () => {
      mockAuth(mockCompanyUser, 'COMPANY');

      let postReceived = null;

      server.use(
        http.get('*/api/v1/csr/profile/me/', () => {
          return HttpResponse.json(
            { code: 'NO_COMPANY_PROFILE', detail: 'No company profile found for this user account.' },
            { status: 404 }
          );
        }),
        http.post('*/api/v1/csr/profile/me/', async ({ request }) => {
          postReceived = await request.json();
          return HttpResponse.json(
            {
              id: 'comp-1',
              company_name: postReceived.company_name,
              legal_name: postReceived.legal_name,
              verification_status: 'DRAFT',
            },
            { status: 201 }
          );
        })
      );

      render(<CompanyProfilePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create corporate profile/i })).toBeInTheDocument();
      });

      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText('e.g. Tata Consultancy Services'), {
        target: { value: 'Reliance Industries' },
      });
      fireEvent.change(screen.getByPlaceholderText('e.g. Tata Consultancy Services Limited'), {
        target: { value: 'Reliance Industries Limited' },
      });

      const submitBtn = screen.getByRole('button', { name: /create corporate profile/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(postReceived).not.toBeNull();
        expect(postReceived.company_name).toBe('Reliance Industries');
        expect(postReceived.legal_name).toBe('Reliance Industries Limited');
      });
    });

    it('renders populated form with "Save Changes" when existing profile returns 200', async () => {
      mockAuth(mockCompanyUser, 'COMPANY');

      server.use(
        http.get('*/api/v1/csr/profile/me/', () => {
          return HttpResponse.json({
            id: 'comp-100',
            company_name: 'Infosys Foundation',
            legal_name: 'Infosys Limited',
            cin_number: 'L85110KA1981PLC013115',
            verification_status: 'DRAFT',
          });
        })
      );

      render(<CompanyProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Infosys Foundation')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      });
    });

    it('renders PENDING_VERIFICATION profile in read-only mode with clear values, locked message, and on-file document status', async () => {
      mockAuth(mockCompanyUser, 'COMPANY');

      server.use(
        http.get('*/api/v1/csr/profile/me/', () => {
          return HttpResponse.json({
            id: 'comp-200',
            company_name: 'PySquad Corp',
            legal_name: 'PySquad Technologies Ltd',
            cin_number: 'L12345MH2020PLC123456',
            pan_number_masked: '******8425M',
            has_pan: true,
            csr_registration_number: 'CSR999999',
            contact_person_name: 'Jane Doe',
            contact_person_designation: 'Head of CSR',
            contact_email: 'spoc@pysquad.com',
            contact_phone: '+919876543210',
            official_website: 'https://pysquad.com',
            registered_address: 'Tech Park, SG Highway',
            city: 'Ahmedabad',
            state: 'Gujarat',
            pincode: '380015',
            annual_csr_budget: '5000000.00',
            verification_status: 'PENDING_VERIFICATION',
            has_verification_document: true,
            verification_document_name: 'Incorporation_Cert.pdf',
            verification_document_url: 'http://localhost:8000/media/Incorporation_Cert.pdf',
          });
        })
      );

      render(<CompanyProfilePage />);

      await waitFor(() => {
        expect(screen.getAllByText('PENDING VERIFICATION').length).toBeGreaterThan(0);
      });

      // Verification review banner & notifications
      expect(screen.getByText('Verification Under Administrative Review')).toBeInTheDocument();
      expect(screen.getByText(/Profile Editing Locked:/i)).toBeInTheDocument();
      expect(screen.getByText(/Review Notification:/i)).toBeInTheDocument();
      expect(screen.getByText('spoc@pysquad.com')).toBeInTheDocument();

      // Statutory document card
      expect(screen.getByText('Incorporation_Cert.pdf')).toBeInTheDocument();
      expect(screen.getByText('Document on File (Pending Review)')).toBeInTheDocument();
      expect(screen.queryByText('Verified Document')).not.toBeInTheDocument();
      const docLink = screen.getByRole('link', { name: /view document \(pdf\)/i });
      expect(docLink).toHaveAttribute('href', 'http://localhost:8000/media/Incorporation_Cert.pdf');

      // Read-only indicator and disabled inputs with preserved values
      expect(screen.getByText(/Read-Only Mode:/i)).toBeInTheDocument();
      const companyInput = screen.getByDisplayValue('PySquad Corp');
      expect(companyInput).toBeDisabled();
      expect(screen.getByDisplayValue('PySquad Technologies Ltd')).toBeDisabled();
      expect(screen.getByDisplayValue('L12345MH2020PLC123456')).toBeDisabled();
      expect(screen.getByDisplayValue('******8425M')).toBeDisabled();
      expect(screen.getByDisplayValue('5000000.00')).toBeDisabled();
      expect(screen.getByDisplayValue('Jane Doe')).toBeDisabled();
      expect(screen.getByDisplayValue('Ahmedabad')).toBeDisabled();
      expect(screen.getByDisplayValue('380015')).toBeDisabled();

      // Form save buttons should not be present
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /submit for verification/i })).not.toBeInTheDocument();
    });
  });

  describe('NgoRegistrationFlowPage & NgoProfilePage', () => {
    it('NgoRegistrationFlowPage renders Step 1 without error banner when GET /ngo/profile/me/ returns 404', async () => {
      mockAuth(mockNgoUser, 'NGO');

      server.use(
        http.get('*/api/v1/ngo/profile/me/', () => {
          return HttpResponse.json({ detail: 'NGO profile not found.' }, { status: 404 });
        }),
        http.get('*/api/v1/ngo/address/me/', () => {
          return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
        }),
        http.get('*/api/v1/ngo/legal/me/', () => {
          return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
        }),
        http.get('*/api/v1/ngo/bank/me/', () => {
          return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
        }),
        http.get('*/api/v1/ngo/leadership/', () => {
          return HttpResponse.json([]);
        }),
        http.get('*/api/v1/ngo/documents/', () => {
          return HttpResponse.json([]);
        })
      );

      render(<NgoRegistrationFlowPage />);

      await waitFor(() => {
        expect(screen.getByText('Step 1: NGO Profile Information')).toBeInTheDocument();
      });

      // Crucial: No error banner shown
      expect(screen.queryByText('NGO profile not found.')).not.toBeInTheDocument();
      expect(screen.queryByText(/Unable to connect to server/i)).not.toBeInTheDocument();

      // Submit button for step 1 should be present
      expect(screen.getByRole('button', { name: /Save & Continue/i })).toBeInTheDocument();
    });

    it('NgoProfilePage renders organization profile view for verified/approved NGO', async () => {
      mockAuth(mockNgoUser, 'NGO');
      server.use(
        http.get('*/api/v1/ngo/profile/me/', () => {
          return HttpResponse.json({
            id: 'ngo-1',
            display_name: 'Trust seva',
            legal_name: 'Trust Seva Charitable Trust',
            status: 'APPROVED',
            category: 'EDUCATION',
            address: { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat' },
            legal_info: { darpan_id: 'GJ/2023/0123456', registration_number: 'E/12345/AHM' },
            bank_info: { bank_name: 'State Bank of India', account_number_masked: '••••••••1234' },
          });
        })
      );
      render(<NgoProfilePage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Trust seva/i })).toBeInTheDocument();
      });
      expect(screen.getByText(/Verified & Approved/i)).toBeInTheDocument();
      expect(screen.getByText(/Statutory & Legal Credentials/i)).toBeInTheDocument();
    });
  });

  describe('Dependent Pages Profile Guards', () => {
    it('CompanyPreferencesPage renders ProfileSetupRequired when profile is missing', async () => {
      mockAuth(mockCompanyUser, 'COMPANY');
      server.use(
        http.get('*/api/v1/csr/profile/me/', () => {
          return HttpResponse.json(
            { code: 'NO_COMPANY_PROFILE', detail: 'No company profile found for this user account.' },
            { status: 404 }
          );
        })
      );

      render(<CompanyPreferencesPage />);

      await waitFor(() => {
        expect(screen.getByText('Profile Setup Required')).toBeInTheDocument();
      });

      expect(screen.getByRole('link', { name: /Create Company Profile/i })).toHaveAttribute('href', '/company/profile');
    });

    it('CompanyRequestsPage renders ProfileSetupRequired when profile is missing', async () => {
      mockAuth(mockCompanyUser, 'COMPANY');
      server.use(
        http.get('*/api/v1/csr/profile/me/', () => {
          return HttpResponse.json(
            { code: 'NO_COMPANY_PROFILE', detail: 'No company profile found for this user account.' },
            { status: 404 }
          );
        })
      );

      render(<CompanyRequestsPage />);

      await waitFor(() => {
        expect(screen.getByText('Profile Setup Required')).toBeInTheDocument();
      });

      expect(screen.getByRole('link', { name: /Create Company Profile/i })).toHaveAttribute('href', '/company/profile');
    });

    it('CompanyPartnershipsPage renders ProfileSetupRequired when profile is missing', async () => {
      mockAuth(mockCompanyUser, 'COMPANY');
      server.use(
        http.get('*/api/v1/csr/profile/me/', () => {
          return HttpResponse.json(
            { code: 'NO_COMPANY_PROFILE', detail: 'No company profile found for this user account.' },
            { status: 404 }
          );
        })
      );

      render(<CompanyPartnershipsPage />);

      await waitFor(() => {
        expect(screen.getByText('Profile Setup Required')).toBeInTheDocument();
      });

      expect(screen.getByRole('link', { name: /Create Company Profile/i })).toHaveAttribute('href', '/company/profile');
    });

    it('CompanyDashboardPage renders ProfileSetupRequired when profile is missing', async () => {
      mockAuth(mockCompanyUser, 'COMPANY');
      server.use(
        http.get('*/api/v1/csr/dashboard/', () => {
          return HttpResponse.json(
            { code: 'NO_COMPANY_PROFILE', detail: 'No company profile found for this user account.' },
            { status: 404 }
          );
        })
      );

      render(<CompanyDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Profile Setup Required/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('link', { name: /Create Company Profile/i })).toHaveAttribute('href', '/company/profile');
    });

    it('NgoCsrDashboardPage renders ProfileSetupRequired when profile is missing', async () => {
      mockAuth(mockNgoUser, 'NGO');
      server.use(
        http.get('*/api/v1/ngo/profile/me/', () => {
          return HttpResponse.json({ detail: 'NGO profile not found.' }, { status: 404 });
        })
      );

      render(<NgoCsrDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Profile Setup Required')).toBeInTheDocument();
      });

      expect(screen.getByRole('link', { name: /Create NGO Profile/i })).toHaveAttribute('href', '/ngo/registration-flow');
    });

    it('NgoAnalyticsPage renders ProfileSetupRequired when profile is missing', async () => {
      mockAuth(mockNgoUser, 'NGO');
      server.use(
        http.get('*/api/v1/ngo/profile/me/', () => {
          return HttpResponse.json({ detail: 'NGO profile not found.' }, { status: 404 });
        })
      );

      render(<NgoAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Profile Setup Required')).toBeInTheDocument();
      });

      expect(screen.getByRole('link', { name: /Create NGO Profile/i })).toHaveAttribute('href', '/ngo/registration-flow');
    });

    it('NgoDashboardPage renders ProfileSetupRequired when profile is missing', async () => {
      mockAuth(mockNgoUser, 'NGO');
      server.use(
        http.get('*/api/v1/ngo/profile/me/', () => {
          return HttpResponse.json({ detail: 'NGO profile not found.' }, { status: 404 });
        })
      );

      render(<NgoDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('NGO Profile Setup Required')).toBeInTheDocument();
      });

      expect(screen.getByRole('link', { name: /Start NGO Registration/i })).toHaveAttribute('href', '/ngo/registration-flow');
    });

    it('CreateProjectPage renders ProfileSetupRequired when profile is missing', async () => {
      mockAuth(mockNgoUser, 'NGO');
      server.use(
        http.get('*/api/v1/ngo/profile/me/', () => {
          return HttpResponse.json({ detail: 'NGO profile not found.' }, { status: 404 });
        })
      );

      render(<CreateProjectPage />);

      await waitFor(() => {
        expect(screen.getByText('NGO Profile Required to Post Projects')).toBeInTheDocument();
      });

      expect(screen.getByRole('link', { name: /Complete NGO Registration/i })).toHaveAttribute('href', '/ngo/registration-flow');
    });
  });
});
