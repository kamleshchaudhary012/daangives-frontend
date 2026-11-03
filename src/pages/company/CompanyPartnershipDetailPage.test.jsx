import React from 'react';
import { render as tlRender, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import CompanyPartnershipDetailPage from './CompanyPartnershipDetailPage';
import { mockAuth, clearAuth } from '../../test/auth';
import { mockCompanyUser } from '../../test/mocks/fixtures';
import { server } from '../../test/mocks/server';

const PARTNERSHIP_ID = 'a6a3afc0-7cb2-4726-9e3a-9339dd493edd';

const basePartnership = {
  id: PARTNERSHIP_ID,
  partnership_code: 'CSR-PT-20261011-A54FEA',
  requirement_title: 'Solar Water Infrastructure Initiative',
  ngo_legal_name: 'Gram Vikas NGO',
  ngo_display_name: 'Gram Vikas',
  agreed_funding_amount: '750000.00',
  disbursed_amount_reported: '0.00',
  has_signed_mou: true,
  status: 'ACTIVE',
  status_display: 'Active & In Execution',
  created_at: '2026-10-11T10:00:00Z',
  execution_start_date: '2026-10-15',
  target_completion_date: '2027-04-15',
};

const renderPage = (partnershipId = PARTNERSHIP_ID) => {
  return tlRender(
    <MemoryRouter initialEntries={[`/company/partnerships/${partnershipId}`]}>
      <Routes>
        <Route path="/company/partnerships/:id" element={<CompanyPartnershipDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('CompanyPartnershipDetailPage — CSR Financial Integrity', () => {
  beforeEach(() => {
    mockAuth(mockCompanyUser, 'COMPANY');
  });

  afterEach(() => {
    clearAuth();
  });

  it('positive commitment with zero disbursements never displays Financially Reconciled and alerts Awaiting Disbursement', async () => {
    server.use(
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/`, () => {
        return HttpResponse.json(basePartnership);
      }),
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/milestones/`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/financials/`, () => {
        return HttpResponse.json({
          partnership_id: PARTNERSHIP_ID,
          partnership_code: 'CSR-PT-20261011-A54FEA',
          financial_status: 'NOT_DISBURSED',
          financial_status_display: 'Awaiting Initial Disbursement — Not Yet Reconciled',
          is_reconciled: false,
          explanation: 'Grant committed under bilateral MoU terms, but zero disbursements have been recorded.',
          outstanding_commitment: 750000.0,
          commitment: {
            amount: 750000.0,
            currency: 'INR',
          },
          reported_disbursements: {
            total_amount: 0.0,
            count: 0,
          },
          verified_disbursements: {
            total_amount: 0.0,
            count: 0,
          },
          ngo_acknowledged_disbursements: {
            total_amount: 0.0,
            count: 0,
          },
          verified_expenses: {
            total_amount: 0.0,
            count: 0,
          },
          is_over_commitment: false,
          has_disputes: false,
          statutory_disclosure: 'DaanGives does not hold or escrow funds.',
          disbursements: [],
          expenses: [],
          grant_change_requests: [],
          audit_history: [],
        });
      })
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Solar Water Infrastructure Initiative/i)).toBeInTheDocument();
    });

    // CRITICAL REQUIREMENT: Must NOT display "Financially Reconciled"
    expect(screen.queryByText(/^Financially Reconciled$/i)).not.toBeInTheDocument();

    // Must display "Awaiting Initial Disbursement — Not Yet Reconciled" badge
    const awaitingBadges = screen.getAllByText(/Awaiting Initial Disbursement — Not Yet Reconciled/i);
    expect(awaitingBadges.length).toBeGreaterThan(0);

    // Must display next action advice
    expect(
      screen.getByText(/Initiate off-platform bank transfer directly to the partner NGO bank account/i)
    ).toBeInTheDocument();

    // Must display statutory disclosure notice
    expect(screen.getByText(/DaanGives does not hold, escrow, or intermediate CSR funds/i)).toBeInTheDocument();
  });

  it('calculates correct outstanding commitment for partial disbursement and prevents verified claim without evidence review', async () => {
    server.use(
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/`, () => {
        return HttpResponse.json({
          ...basePartnership,
          disbursed_amount_reported: '300000.00',
        });
      }),
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/milestones/`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/financials/`, () => {
        return HttpResponse.json({
          partnership_id: PARTNERSHIP_ID,
          partnership_code: 'CSR-PT-20261011-A54FEA',
          financial_status: 'PARTIALLY_DISBURSED',
          financial_status_display: 'Partially Disbursed',
          is_reconciled: false,
          explanation: 'Partially disbursed (₹3,00,000 reported of ₹7,50,000 committed). Outstanding balance is ₹4,50,000.',
          outstanding_commitment: 450000.0,
          commitment: {
            amount: 750000.0,
            currency: 'INR',
          },
          reported_disbursements: {
            total_amount: 300000.0,
            count: 1,
          },
          verified_disbursements: {
            total_amount: 300000.0,
            count: 1,
          },
          ngo_acknowledged_disbursements: {
            total_amount: 300000.0,
            count: 1,
          },
          verified_expenses: {
            total_amount: 0.0,
            count: 0,
          },
          is_over_commitment: false,
          has_disputes: false,
          disbursements: [
            {
              id: 'disb-1',
              disbursement_date: '2026-10-10',
              payment_reference: 'UTR123456789',
              amount: 300000.0,
              payment_mode: 'NEFT',
              review_status: 'VERIFIED',
              review_status_display: 'Evidence Verified',
              ngo_acknowledgement_status: 'ACKNOWLEDGED',
              ngo_acknowledgement_status_display: 'Confirmed by NGO',
            },
          ],
          expenses: [],
          grant_change_requests: [],
          audit_history: [],
        });
      })
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Solar Water Infrastructure Initiative/i)).toBeInTheDocument();
    });

    // Check partially disbursed badge
    expect(screen.getAllByText(/Partially Disbursed/i).length).toBeGreaterThan(0);

    // Outstanding must be 4,50,000
    expect(screen.getAllByText('₹4,50,000').length).toBeGreaterThan(0);

    // Must NOT display Financially Reconciled
    expect(screen.queryByText(/^Financially Reconciled$/i)).not.toBeInTheDocument();
  });

  it('displays over-commitment alert when reported disbursements exceed approved grant commitment', async () => {
    server.use(
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/`, () => {
        return HttpResponse.json(basePartnership);
      }),
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/milestones/`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/financials/`, () => {
        return HttpResponse.json({
          partnership_id: PARTNERSHIP_ID,
          financial_status: 'PENDING_RECONCILIATION',
          is_reconciled: false,
          is_over_commitment: true,
          over_commitment_amount: 150000.0,
          outstanding_commitment: 0.0,
          commitment: { amount: 750000.0 },
          reported_disbursements: { total_amount: 900000.0, count: 2 },
          verified_disbursements: { total_amount: 750000.0, count: 1 },
          ngo_acknowledged_disbursements: { total_amount: 750000.0, count: 1 },
          verified_expenses: { total_amount: 750000.0, count: 2 },
          disbursements: [],
          expenses: [],
          grant_change_requests: [],
        });
      })
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Over-Commitment Alert:/i)).toBeInTheDocument();
    });
  });

  it('displays dispute alert when an active disbursement dispute exists', async () => {
    server.use(
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/`, () => {
        return HttpResponse.json(basePartnership);
      }),
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/milestones/`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/financials/`, () => {
        return HttpResponse.json({
          partnership_id: PARTNERSHIP_ID,
          financial_status: 'DISPUTED',
          is_reconciled: false,
          has_disputes: true,
          disputed_disbursements_count: 1,
          outstanding_commitment: 450000.0,
          commitment: { amount: 750000.0 },
          reported_disbursements: { total_amount: 300000.0, count: 1 },
          verified_disbursements: { total_amount: 0.0, count: 0 },
          ngo_acknowledged_disbursements: { total_amount: 0.0, count: 0 },
          verified_expenses: { total_amount: 0.0, count: 0 },
          disbursements: [],
          expenses: [],
          grant_change_requests: [],
        });
      })
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Dispute Alert:/i)).toBeInTheDocument();
    });
  });

  it('renders Bilateral Grant Change Requests section and corporate review action for pending company approval', async () => {
    server.use(
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/`, () => {
        return HttpResponse.json(basePartnership);
      }),
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/milestones/`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`*/api/v1/csr/partnerships/${PARTNERSHIP_ID}/financials/`, () => {
        return HttpResponse.json({
          partnership_id: PARTNERSHIP_ID,
          financial_status: 'NOT_DISBURSED',
          is_reconciled: false,
          outstanding_commitment: 750000.0,
          commitment: { amount: 750000.0 },
          reported_disbursements: { total_amount: 0.0, count: 0 },
          verified_disbursements: { total_amount: 0.0, count: 0 },
          ngo_acknowledged_disbursements: { total_amount: 0.0, count: 0 },
          verified_expenses: { total_amount: 0.0, count: 0 },
          disbursements: [],
          expenses: [],
          grant_change_requests: [
            {
              id: 'gcr-1',
              request_number: 'GCR-20261011-001',
              change_type: 'INCREASE',
              change_type_display: 'Grant Budget Increase',
              current_agreed_amount: 750000.0,
              requested_new_amount: 900000.0,
              amount_delta: 150000.0,
              justification: 'Additional solar panels required due to increased village population.',
              status: 'PENDING_COMPANY_APPROVAL',
              status_display: 'Pending Corporate Approval',
              admin_reviewed_by_name: 'CSR Admin',
              admin_review_notes: 'Eligible under Section 135 Schedule VII item (iv).',
              created_at: '2026-10-11T12:00:00Z',
            },
          ],
        });
      })
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('GCR-20261011-001')).toBeInTheDocument();
      expect(screen.getByText(/Additional solar panels required/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Review Grant Change Request/i })).toBeInTheDocument();
    });
  });
});
