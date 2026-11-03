import { http, HttpResponse } from 'msw';

import {
  mockTicketList,
  mockTicket,
  mockResponse,
  mockInternalResponse,
  mockCsrDashboard,
  mockCampaign,
  mockNgo,
  mockCampaignTracking,
  mockDistributionProof,
  mockDonorDonations,
} from './fixtures';

export const handlers = [
  http.post('*/api/v1/auth/login/', () => {
    return HttpResponse.json({
      access: 'fake-jwt-token',
      refresh: 'fake-refresh-token',
      user: { id: 'test-user', email: 'test@demo.local', role: 'DONOR', full_name: 'Test User' }
    });
  }),
  http.get('*/api/v1/auth/me/', () => {
    return HttpResponse.json({
      id: 'test-user',
      email: 'test@demo.local',
      role: 'DONOR',
      full_name: 'Test User'
    });
  }),
  http.get('*/api/v1/public/ngos/', () => {
    return HttpResponse.json({ results: [mockNgo], count: 1 });
  }),
  http.get('*/api/v1/public/campaigns/', () => {
    return HttpResponse.json({ results: [mockCampaign], count: 1 });
  }),
  // Grievances
  http.get('*/api/v1/grievances/tickets/', () => {
    return HttpResponse.json({ results: mockTicketList, count: mockTicketList.length, next: null, previous: null });
  }),
  http.get('*/api/v1/grievances/tickets/:id/', () => {
    return HttpResponse.json(mockTicket);
  }),
  http.post('*/api/v1/grievances/tickets/', () => {
    return HttpResponse.json(mockTicket, { status: 201 });
  }),
  http.post('*/api/v1/grievances/tickets/:id/transition/', () => {
    return HttpResponse.json({ status: 'IN_PROGRESS' });
  }),
  http.post('*/api/v1/grievances/tickets/:id/assign/', () => {
    return HttpResponse.json({ assigned_to: 'admin-1' });
  }),
  http.get('*/api/v1/grievances/tickets/:id/responses/', () => {
    return HttpResponse.json([mockResponse, mockInternalResponse]);
  }),
  http.post('*/api/v1/grievances/tickets/:id/responses/', () => {
    return HttpResponse.json(mockResponse, { status: 201 });
  }),
  http.patch('*/api/v1/grievances/responses/:id/', () => {
    return HttpResponse.json(mockResponse);
  }),
  // CSR
  http.get('*/api/v1/csr/dashboard/', () => {
    return HttpResponse.json(mockCsrDashboard);
  }),
  http.get('*/api/v1/csr/profile/me/', () => {
    return HttpResponse.json({ id: 'company-profile-1', company_name: 'Demo Company' });
  }),
  // Donations
  http.post('*/api/v1/campaigns/donations/', () => {
    return HttpResponse.json({ id: 'donation-1', status: 'PENDING' }, { status: 201 });
  }),
  http.get('*/api/v1/donor/monetary-donations/', () => {
    return HttpResponse.json(mockDonorDonations);
  }),
  // Tracking & Distribution Proofs (Phase 5.2.6)
  http.get('*/api/v1/public/campaigns/:slug/tracking/', ({ params }) => {
    if (params.slug === 'not-found-slug') {
      return HttpResponse.json({ detail: 'Campaign not found or is not currently active.' }, { status: 404 });
    }
    return HttpResponse.json(mockCampaignTracking);
  }),
  http.get('*/api/v1/public/campaigns/:id/distribution-proofs/', () => {
    return HttpResponse.json({
      count: 1,
      next: null,
      previous: null,
      results: [mockDistributionProof],
    });
  }),
  http.get('*/api/v1/public/campaigns/distribution-proofs/:id/', () => {
    return HttpResponse.json(mockDistributionProof);
  }),
  // NGO Profile & Distribution Proofs
  http.get('*/api/v1/ngo/profile/me/', () => {
    return HttpResponse.json({ id: 'ngo-profile-1', name: 'Jal Jeevan Foundation', status: 'VERIFIED' });
  }),
  http.get('*/api/v1/ngo/campaigns/distribution-proofs/', () => {
    return HttpResponse.json({
      count: 1,
      next: null,
      previous: null,
      results: [mockDistributionProof],
    });
  }),
  // Admin Analytics Overview
  http.get('*/api/v1/analytics/admin/overview/', () => {
    return HttpResponse.json({
      donations: { total_amount: 500000, total_count: 120, by_month: [] },
      ngos: { total: 25, verified: 20, pending: 3, rejected: 2 },
      csr: { total_spend: 1500000, active_partnerships: 8 },
      grievances: { total: 10, open: 2 },
    });
  }),
];
