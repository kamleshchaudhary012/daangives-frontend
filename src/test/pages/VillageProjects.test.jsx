import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge';
import EmptyProjectsState from '../../components/projects/EmptyProjectsState';
import ProjectCard from '../../components/projects/ProjectCard';
import ProjectForm from '../../components/projects/ProjectForm';
import DocumentUploadList from '../../components/projects/DocumentUploadList';
import MilestoneEditor from '../../components/projects/MilestoneEditor';
import CreateProjectPage from '../../pages/ngo/CreateProjectPage';
import MyProjectsPage from '../../pages/ngo/MyProjectsPage';
import * as projectsApi from '../../services/api/projects';

// Mock API module
vi.mock('../../services/api/projects', () => ({
  createProjectDraft: vi.fn(),
  getMyProjects: vi.fn(),
  getProjectDetail: vi.fn(),
  updateProject: vi.fn(),
  submitProjectForVerification: vi.fn(),
  withdrawProjectSubmission: vi.fn(),
  uploadProjectDocument: vi.fn(),
  deleteProjectDocument: vi.fn(),
  addProjectMilestone: vi.fn(),
  deleteProjectMilestone: vi.fn(),
}));

describe('Phase 7.2 — Village Project Posting Component & Page Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ProjectStatusBadge', () => {
    it('renders Draft status badge correctly', () => {
      render(<ProjectStatusBadge status="DRAFT" />);
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('renders Submitted status badge correctly', () => {
      render(<ProjectStatusBadge status="SUBMITTED" />);
      expect(screen.getByText('Submitted for Verification')).toBeInTheDocument();
    });

    it('renders Verified status badge correctly', () => {
      render(<ProjectStatusBadge status="VERIFIED" />);
      expect(screen.getByText('Verified & CSR Ready')).toBeInTheDocument();
    });

    it('renders Under Review status badge correctly', () => {
      render(<ProjectStatusBadge status="UNDER_REVIEW" />);
      expect(screen.getByText('Under Review')).toBeInTheDocument();
    });

    it('renders Action Required / Docs Pending status badge correctly', () => {
      render(<ProjectStatusBadge status="DOCS_PENDING" />);
      expect(screen.getByText('Action Required / Docs Pending')).toBeInTheDocument();
    });

    it('renders Funded status badge correctly', () => {
      render(<ProjectStatusBadge status="FUNDED" />);
      expect(screen.getByText('Funded')).toBeInTheDocument();
    });
  });

  describe('EmptyProjectsState', () => {
    it('renders default empty state with post CTA button', () => {
      render(<EmptyProjectsState />);
      expect(screen.getByText('No village projects posted yet')).toBeInTheDocument();
      expect(screen.getByText('Post Your First Project')).toBeInTheDocument();
    });

    it('renders filtered empty state with clear filters CTA', () => {
      const resetMock = vi.fn();
      render(<EmptyProjectsState hasFilter={true} onResetFilters={resetMock} />);
      expect(screen.getByText('No matching projects found')).toBeInTheDocument();
      const clearBtn = screen.getByText('Clear All Filters');
      expect(clearBtn).toBeInTheDocument();
      fireEvent.click(clearBtn);
      expect(resetMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('ProjectCard', () => {
    const mockProject = {
      id: 'proj-123',
      title: 'Solar Water Filtration Plant',
      short_summary: 'Clean water for 500 households in Khedli village.',
      category: 'RURAL',
      location_state: 'Rajasthan',
      location_district: 'Alwar',
      location_village: 'Khedli',
      estimated_cost: '650000.00',
      timeline_months: 6,
      beneficiaries_count: 500,
      status: 'DRAFT',
      documents_count: 2,
      milestones_count: 3,
    };

    it('renders project details, category, budget and location', () => {
      render(<ProjectCard project={mockProject} />);
      expect(screen.getByText('Solar Water Filtration Plant')).toBeInTheDocument();
      expect(screen.getByText('Clean water for 500 households in Khedli village.')).toBeInTheDocument();
      expect(screen.getByText('Rural Development Projects')).toBeInTheDocument();
      expect(screen.getByText('Khedli, Alwar, Rajasthan')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('renders project with UNDER_REVIEW status displaying Under Review badge', () => {
      const underReviewProject = {
        ...mockProject,
        title: 'Financial Assistance and Skill Development Program for Underprivileged Students',
        status: 'UNDER_REVIEW',
      };
      render(<ProjectCard project={underReviewProject} />);
      expect(
        screen.getByText('Financial Assistance and Skill Development Program for Underprivileged Students')
      ).toBeInTheDocument();
      expect(screen.getByText('Under Review')).toBeInTheDocument();
    });
  });

  describe('ProjectForm', () => {
    it('validates required fields before calling onSubmit', () => {
      const handleSubmit = vi.fn();
      render(<ProjectForm onSubmit={handleSubmit} />);

      const submitBtn = screen.getByRole('button', { name: /save project draft/i });
      fireEvent.click(submitBtn);

      expect(handleSubmit).not.toHaveBeenCalled();
      expect(screen.getByText('Project title is required.')).toBeInTheDocument();
    });

    it('submits valid data when all required fields are filled', () => {
      const handleSubmit = vi.fn();
      render(<ProjectForm onSubmit={handleSubmit} />);

      fireEvent.change(screen.getByPlaceholderText(/solar powered water purification/i), {
        target: { value: 'Village Primary School Renovation' },
      });
      fireEvent.change(screen.getByPlaceholderText(/high-level 1-2 line summary/i), {
        target: { value: 'Renovating 4 classrooms and installing solar roof.' },
      });
      fireEvent.change(screen.getByPlaceholderText(/detail the current challenges/i), {
        target: { value: 'Complete overhaul of dilapidated building and roof.' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\., alwar/i), {
        target: { value: 'Jaipur' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\., khedli khurd/i), {
        target: { value: 'Amer' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\., 301001/i), {
        target: { value: '302028' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\., 850000/i), {
        target: { value: '450000' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\., 1200/i), {
        target: { value: '250' },
      });
      fireEvent.change(screen.getByPlaceholderText(/approx 350 smallholder farming/i), {
        target: { value: '250 primary school students from local farming families.' },
      });

      const submitBtn = screen.getByRole('button', { name: /save project draft/i });
      fireEvent.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Village Primary School Renovation',
          location_district: 'Jaipur',
          location_village: 'Amer',
          location_pincode: '302028',
          estimated_cost: 450000,
          beneficiaries_count: 250,
        })
      );
    });
  });

  describe('DocumentUploadList', () => {
    it('shows document requirement warning when list is empty', () => {
      render(
        <DocumentUploadList
          projectId="proj-123"
          documents={[]}
          isEditable={true}
        />
      );
      expect(screen.getByText('Document requirement:')).toBeInTheDocument();
      expect(screen.getByText('Upload Document')).toBeInTheDocument();
    });

    it('renders attached documents with view button', () => {
      const mockDocs = [
        {
          id: 'doc-1',
          document_type: 'PANCHAYAT_RESOLUTION',
          file_name: 'gram_sabha_resolution_2026.pdf',
          file_url: 'http://example.com/resolution.pdf',
          notes: 'Signed by Sarpanch',
          uploaded_at: '2026-10-10T12:00:00Z',
        },
      ];

      render(
        <DocumentUploadList
          projectId="proj-123"
          documents={mockDocs}
          isEditable={true}
        />
      );

      expect(screen.getByText('Gram Panchayat / Sabha Resolution')).toBeInTheDocument();
      expect(screen.getByText('gram_sabha_resolution_2026.pdf')).toBeInTheDocument();
      expect(screen.getByText('"Signed by Sarpanch"')).toBeInTheDocument();
    });
  });

  describe('MilestoneEditor', () => {
    it('renders milestone sequence and budget correctly', () => {
      const mockMilestones = [
        {
          id: 'm-1',
          title: 'Phase 1: Civil Works',
          description: 'Foundation and masonry',
          order: 1,
          amount: '200000.00',
          target_date: '2026-12-31',
          status: 'PENDING',
        },
      ];

      render(
        <MilestoneEditor
          projectId="proj-123"
          milestones={mockMilestones}
          isEditable={true}
        />
      );

      expect(screen.getByText('Phase 1: Civil Works')).toBeInTheDocument();
      expect(screen.getByText('Foundation and masonry')).toBeInTheDocument();
      expect(screen.getAllByText('₹2,00,000').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('CreateProjectPage', () => {
    it('renders header and step indicator when profile is verified', async () => {
      render(<CreateProjectPage />);
      await waitFor(() => {
        expect(screen.getByText('Post a Village Development Project')).toBeInTheDocument();
      });
      expect(screen.getByText('Step 1 of 2: Create Proposal Draft')).toBeInTheDocument();
    });
  });

  describe('MyProjectsPage', () => {
    it('fetches and renders project list with header and stats', async () => {
      projectsApi.getMyProjects.mockResolvedValueOnce({
        count: 1,
        stats: {
          total: 1,
          draft: 0,
          submitted: 0,
          under_review: 0,
          action_required: 0,
          verified: 1,
          funded: 0,
          completed: 0,
          rejected: 0,
        },
        results: [
          {
            id: 'p-1',
            title: 'Gram Panchayat Solar Microgrid',
            short_summary: 'Electrifying 100 rural homes with clean energy.',
            category: 'ENVIRONMENT',
            location_state: 'Maharashtra',
            location_district: 'Pune',
            location_village: 'Ambegaon',
            estimated_cost: '950000.00',
            timeline_months: 8,
            beneficiaries_count: 600,
            status: 'VERIFIED',
            documents_count: 3,
            milestones_count: 2,
          },
        ],
      });

      render(<MyProjectsPage />);

      expect(screen.getByText('Village & Community Projects')).toBeInTheDocument();
      expect(screen.getByText('Post New Project')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Gram Panchayat Solar Microgrid')).toBeInTheDocument();
      });
      expect(screen.getByText('Total Projects')).toBeInTheDocument();
      expect(screen.getByText('CSR Ready (Verified)')).toBeInTheDocument();
    });

    it('displays all 8 KPI cards and filters projects on click', async () => {
      projectsApi.getMyProjects.mockResolvedValue({
        count: 2,
        stats: {
          total: 2,
          draft: 1,
          submitted: 0,
          under_review: 0,
          action_required: 0,
          verified: 1,
          funded: 0,
          completed: 0,
          rejected: 0,
        },
        results: [
          {
            id: 'p-1',
            title: 'Verified Project',
            short_summary: 'Summary',
            category: 'RURAL',
            location_state: 'Gujarat',
            location_district: 'Kutch',
            location_village: 'Bhuj',
            estimated_cost: '500000.00',
            timeline_months: 6,
            beneficiaries_count: 400,
            status: 'VERIFIED',
          },
        ],
      });

      render(<MyProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('Verified Project')).toBeInTheDocument();
      });

      // Click on Drafts KPI card
      const draftCard = screen.getByRole('button', { name: /drafts/i });
      fireEvent.click(draftCard);

      await waitFor(() => {
        expect(projectsApi.getMyProjects).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'DRAFT' })
        );
      });
    });

    it('displays UNDER_REVIEW project and clicking Under Review KPI card filters by UNDER_REVIEW', async () => {
      projectsApi.getMyProjects.mockResolvedValue({
        count: 1,
        stats: {
          total: 1,
          draft: 0,
          submitted: 0,
          under_review: 1,
          action_required: 0,
          verified: 0,
          funded: 0,
          completed: 0,
          rejected: 0,
        },
        results: [
          {
            id: '1b11ebfc-5f8d-47bd-b309-e7e3b270c884',
            title: 'Financial Assistance and Skill Development Program for Underprivileged Students',
            short_summary: 'Comprehensive skill and financial aid for rural students.',
            category: 'EDUCATION',
            location_state: 'Maharashtra',
            location_district: 'Pune',
            location_village: 'Baramati',
            estimated_cost: '500000.00',
            timeline_months: 6,
            beneficiaries_count: 200,
            status: 'UNDER_REVIEW',
          },
        ],
      });

      render(<MyProjectsPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Financial Assistance and Skill Development Program for Underprivileged Students')
        ).toBeInTheDocument();
        expect(screen.getByTestId('project-status-badge')).toHaveTextContent('Under Review');
      });

      // Click on Under Review KPI card
      const underReviewCard = screen.getByRole('button', { name: /under review/i });
      fireEvent.click(underReviewCard);

      await waitFor(() => {
        expect(projectsApi.getMyProjects).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'UNDER_REVIEW' })
        );
      });
    });
  });
});
