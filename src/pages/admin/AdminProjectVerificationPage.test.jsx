import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../test/utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AdminProjectVerificationPage from './AdminProjectVerificationPage';
import * as projectsApi from '../../services/api/projects';

describe('AdminProjectVerificationPage Component Tests', () => {
  const mockProject = {
    id: '1b11ebfc-5f8d-47bd-b309-e7e3b270c884',
    title: 'Financial Assistance and Skill Development Program for Underprivileged Students',
    short_summary: 'Comprehensive skill and financial aid for rural students.',
    category: 'EDUCATION',
    category_display: 'Education & Skill Development',
    location_state: 'Maharashtra',
    location_district: 'Pune',
    location_village: 'Baramati',
    location_pincode: '413102',
    estimated_cost: '500000.00',
    timeline_months: 6,
    beneficiaries_count: 200,
    status: 'SUBMITTED',
    organization_name: 'Gramin Vikas Sanstha',
    organization_darpan_id: 'MH/2021/0291823',
    document_count: 2,
    milestone_count: 3,
    created_at: '2026-10-11T10:00:00Z',
  };

  const mockStats = {
    total: 3,
    pending: 2,
    submitted: 1,
    under_review: 1,
    action_required: 0,
    verified: 1,
    rejected: 0,
    funded: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify({ role: 'ADMIN', full_name: 'Desk Officer' }));
    localStorage.setItem('accessToken', 'mock-admin-token');
  });

  it('renders project verification queue with KPI cards and project proposal list', async () => {
    vi.spyOn(projectsApi, 'getAdminProjects').mockResolvedValue({
      count: 1,
      results: [mockProject],
      stats: mockStats,
    });

    render(<AdminProjectVerificationPage />);

    expect(screen.getByText('Project Proposal Verification')).toBeInTheDocument();
    expect(screen.getByText('Total Proposals')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText('Financial Assistance and Skill Development Program for Underprivileged Students')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Gramin Vikas Sanstha')).toBeInTheDocument();
    expect(screen.getByText('Submitted for Verification')).toBeInTheDocument();
    expect(screen.getByText('Add to Verify')).toBeInTheDocument();
  });

  it('triggers Add to Verify action when clicking quick action button', async () => {
    vi.spyOn(projectsApi, 'getAdminProjects').mockResolvedValue({
      count: 1,
      results: [mockProject],
      stats: mockStats,
    });
    const verifySpy = vi.spyOn(projectsApi, 'adminVerifyProject').mockResolvedValue({
      detail: 'Project status updated to UNDER_REVIEW.',
      project: { ...mockProject, status: 'UNDER_REVIEW' },
    });

    render(<AdminProjectVerificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Add to Verify')).toBeInTheDocument();
    });

    const addBtn = screen.getByText('Add to Verify');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(verifySpy).toHaveBeenCalledWith(
        mockProject.id,
        expect.objectContaining({ action: 'ADD_TO_VERIFY' })
      );
    });
  });

  it('opens proposal inspection modal when clicking Inspect button', async () => {
    vi.spyOn(projectsApi, 'getAdminProjects').mockResolvedValue({
      count: 1,
      results: [mockProject],
      stats: mockStats,
    });
    vi.spyOn(projectsApi, 'getAdminProjectDetail').mockResolvedValue({
      ...mockProject,
      description: 'Detailed description of rural skill center.',
      documents: [
        {
          id: 'doc-1',
          document_type: 'PANCHAYAT_RESOLUTION',
          document_type_display: 'Gram Panchayat Resolution',
          uploaded_by_name: 'NGO Lead',
          uploaded_at: '2026-10-11T10:00:00Z',
          file: 'http://example.com/res.pdf',
        },
      ],
      milestones: [
        {
          id: 'm-1',
          order: 1,
          title: 'Infrastructure Setup',
          amount: '200000.00',
          status: 'PENDING',
        },
      ],
      verification_history: [
        {
          id: 'h-1',
          action: 'SUBMITTED',
          from_status: 'DRAFT',
          to_status: 'SUBMITTED',
          actor_type: 'NGO',
          actor_email: 'ngo@example.com',
          created_at: '2026-10-11T10:00:00Z',
        },
      ],
    });
    vi.spyOn(projectsApi, 'getAdminProjectHistory').mockResolvedValue([]);

    render(<AdminProjectVerificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Inspect')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Inspect'));

    await waitFor(() => {
      expect(screen.getByText('Proposal Overview')).toBeInTheDocument();
      expect(screen.getByText('Execution Timeline')).toBeInTheDocument();
    });
  });
});
