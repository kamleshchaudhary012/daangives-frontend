export const mockUser = {
  id: 'donor-1',
  email: 'donor1@demo.local',
  full_name: 'Donor User',
  role: 'DONOR',
};

export const mockNgoUser = {
  id: 'ngo-1',
  email: 'ngo1@demo.local',
  full_name: 'NGO User',
  role: 'NGO',
};

export const mockCompanyUser = {
  id: 'company-1',
  email: 'company1@demo.local',
  full_name: 'Company User',
  role: 'COMPANY',
};

export const mockAdminUser = {
  id: 'admin-1',
  email: 'admin1@demo.local',
  full_name: 'Admin User',
  role: 'ADMIN',
  is_staff: true,
};

export const mockTicket = {
  id: 'ticket-1',
  ticket_number: 'GRV-2026-001',
  title: 'Test Grievance',
  description: 'This is a test description.',
  category: 'OTHER',
  status: 'OPEN',
  priority: 'HIGH',
  created_at: '2026-09-27T12:00:00Z',
  updated_at: '2026-09-27T12:00:00Z',
  created_by: { id: 'donor-1', full_name: 'Donor User' },
};

export const mockTicketList = [
  mockTicket,
  {
    ...mockTicket,
    id: 'ticket-2',
    title: 'Another Issue',
    status: 'IN_PROGRESS',
  }
];

export const mockResponse = {
  id: 'response-1',
  ticket: 'ticket-1',
  message: 'Public reply here',
  is_internal_note: false,
  created_by: { id: 'admin-1', full_name: 'Admin User' },
  created_at: '2026-09-27T13:00:00Z',
};

export const mockInternalResponse = {
  ...mockResponse,
  id: 'response-2',
  message: 'Internal note here',
  is_internal_note: true,
};

export const mockCsrDashboard = {
  company_name: 'Demo Company',
  annual_csr_budget: '500000',
  committed_funding_total: '100000',
  disbursed_funding_total: '50000',
  preferences: { focus_areas: ['Education'] },
  stats: { active_partnerships: 2, pending_requests: 1 },
};

export const mockCampaign = {
  id: 'camp-1',
  title: 'Save the Earth',
  goal_amount: '10000.00',
  raised_amount: '5000.00',
  ngo: { id: 'ngo-1', name: 'Earth NGO' }
};

export const mockNgo = {
  id: 'ngo-1',
  name: 'Earth NGO',
  description: 'We save the earth.',
};

export const mockDistributionProof = {
  id: 'proof-1',
  campaign_title: 'Clean Drinking Water for Rural Schools',
  milestone_title: 'Procurement of RO Filtration Plants',
  photo_url: 'http://localhost:8000/media/distribution_proofs/sample.jpg',
  caption: 'Distributed 50 nutrition kits to primary school students',
  latitude: '18.5204',
  longitude: '73.8567',
  location_name: 'Pune Municipal School No 4',
  beneficiary_count: 50,
  beneficiary_type: 'STUDENT',
  beneficiary_type_display: 'Students',
  beneficiary_notes: 'Each kit contained pulse, oats, and multivitamin supplements.',
  spent_amount: '25000.00',
  expense_breakdown: { nutrition_kits: 20000, logistics: 5000 },
  distribution_date: '2026-10-01',
  status: 'VERIFIED',
  reviewed_at: '2026-10-02T10:00:00Z',
};

export const mockCampaignTracking = {
  campaign: {
    id: 'camp-1',
    title: 'Clean Drinking Water for Rural Schools',
    slug: 'clean-drinking-water',
    category: 'HEALTHCARE',
    short_description: 'Installing RO purification systems across 10 rural schools.',
    target_amount: '500000.00',
    raised_amount: '350000.00',
    cover_image: '/media/campaigns/water.jpg',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    status: 'ACTIVE',
    ngo_name: 'Jal Jeevan Foundation',
    ngo_slug: 'jal-jeevan',
    ngo_logo: '/media/logos/jal.jpg',
    ngo_city: 'Pune',
    ngo_state: 'Maharashtra',
  },
  total_verified_spent: '25000.00',
  milestones: [
    {
      id: 'mile-1',
      sequence_number: 1,
      title: 'Procurement of RO Filtration Plants',
      description: 'Purchased 10 high-capacity filtration units.',
      target_amount: '200000.00',
      target_completion_date: '2026-03-31',
      actual_completion_date: '2026-03-25',
      status: 'COMPLETED',
      verified_spent_amount: '25000.00',
      verified_proofs_count: 1,
      proofs: [mockDistributionProof],
    },
  ],
  verified_distribution_proofs: [mockDistributionProof],
};

export const mockDonorDonations = [
  {
    id: 'don-1',
    receipt_number: 'DG-M-20261001-A1B2C3',
    amount: '5000.00',
    status: 'SUCCESS',
    campaign: 'camp-1',
    campaign_title: 'Clean Drinking Water for Rural Schools',
    campaign_slug: 'clean-drinking-water',
    ngo_name: 'Jal Jeevan Foundation',
    created_at: '2026-10-01T10:00:00Z',
  },
];
