import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EvidencePhotoList from '../../components/projects/EvidencePhotoList';
import * as projectsApi from '../../services/api/projects';

vi.mock('../../services/api/projects', () => ({
  uploadProjectPhoto: vi.fn(),
  deleteProjectPhoto: vi.fn(),
}));

describe('Phase 7.2 — Village Project Milestone Evidence Photos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPhotos = [
    {
      id: 'photo-1',
      file: 'http://example.com/solar_pump_1.jpg',
      caption: 'Solar panel array installed at North borewell',
      uploaded_at: '2026-10-15T10:00:00Z',
    },
    {
      id: 'photo-2',
      file: 'http://example.com/solar_pump_2.jpg',
      caption: 'Water filtration system operational',
      uploaded_at: '2026-10-18T14:30:00Z',
    },
  ];

  it('renders notice and disables uploads when project is in DRAFT status', () => {
    render(
      <EvidencePhotoList
        projectId="proj-123"
        photos={[]}
        projectStatus="DRAFT"
        isOwner={true}
      />
    );

    expect(screen.getByText('Milestone Evidence & Field Execution Photos')).toBeInTheDocument();
    expect(
      screen.getByText(/Milestone evidence photo uploads become active once this project is funded/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('upload-evidence-photo-btn')).not.toBeInTheDocument();
  });

  it('renders upload button when project is in FUNDED status and user is owner', () => {
    render(
      <EvidencePhotoList
        projectId="proj-123"
        photos={[]}
        projectStatus="FUNDED"
        isOwner={true}
      />
    );

    const uploadBtn = screen.getByTestId('upload-evidence-photo-btn');
    expect(uploadBtn).toBeInTheDocument();
    expect(uploadBtn).toHaveTextContent('Upload Milestone Photo');
  });

  it('renders upload button when project is in IN_PROGRESS status and user is owner', () => {
    render(
      <EvidencePhotoList
        projectId="proj-123"
        photos={[]}
        projectStatus="IN_PROGRESS"
        isOwner={true}
      />
    );

    expect(screen.getByTestId('upload-evidence-photo-btn')).toBeInTheDocument();
  });

  it('renders photos grid with captions and dates when photos are present', () => {
    render(
      <EvidencePhotoList
        projectId="proj-123"
        photos={mockPhotos}
        projectStatus="FUNDED"
        isOwner={true}
      />
    );

    expect(screen.getByTestId('evidence-photos-grid')).toBeInTheDocument();
    expect(screen.getByText('Solar panel array installed at North borewell')).toBeInTheDocument();
    expect(screen.getByText('Water filtration system operational')).toBeInTheDocument();
  });

  it('opens upload modal and submits photo successfully', async () => {
    const onUpdatedMock = vi.fn();
    projectsApi.uploadProjectPhoto.mockResolvedValueOnce({
      id: 'photo-new',
      file: 'http://example.com/new.png',
      caption: 'Foundation civil work completed',
    });

    // Mock URL.createObjectURL / revokeObjectURL for file preview
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/dummy');
    global.URL.revokeObjectURL = vi.fn();

    render(
      <EvidencePhotoList
        projectId="proj-123"
        photos={mockPhotos}
        projectStatus="FUNDED"
        isOwner={true}
        onPhotosUpdated={onUpdatedMock}
      />
    );

    fireEvent.click(screen.getByTestId('upload-evidence-photo-btn'));
    expect(screen.getByText('Upload Milestone Evidence Photo')).toBeInTheDocument();

    const fileInput = screen.getByLabelText(/Select Photo File/i);
    const fakeFile = new File(['dummy-image-content'], 'test_evidence.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    const captionInput = screen.getByPlaceholderText(/Borewell drilling completed/i);
    fireEvent.change(captionInput, { target: { value: 'Foundation civil work completed' } });

    const submitBtn = screen.getByRole('button', { name: /Upload Photo/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(projectsApi.uploadProjectPhoto).toHaveBeenCalledTimes(1);
    });
    expect(projectsApi.uploadProjectPhoto).toHaveBeenCalledWith('proj-123', expect.any(FormData));
    expect(onUpdatedMock).toHaveBeenCalledTimes(1);
  });

  it('shows error if selected file exceeds 5MB limit', () => {
    render(
      <EvidencePhotoList
        projectId="proj-123"
        photos={[]}
        projectStatus="FUNDED"
        isOwner={true}
      />
    );

    fireEvent.click(screen.getByTestId('upload-evidence-photo-btn'));
    const fileInput = screen.getByLabelText(/Select Photo File/i);

    // 6MB dummy file
    const oversizedFile = new File(['a'.repeat(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(oversizedFile, 'size', { value: 6 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    expect(screen.getByText('File size must not exceed 5MB.')).toBeInTheDocument();
  });

  it('shows error if selected file has invalid extension', () => {
    render(
      <EvidencePhotoList
        projectId="proj-123"
        photos={[]}
        projectStatus="FUNDED"
        isOwner={true}
      />
    );

    fireEvent.click(screen.getByTestId('upload-evidence-photo-btn'));
    const fileInput = screen.getByLabelText(/Select Photo File/i);

    const docFile = new File(['text'], 'document.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [docFile] } });

    expect(screen.getByText('Invalid file format. Only JPG, PNG, and WebP images are allowed.')).toBeInTheDocument();
  });

  it('calls deleteProjectPhoto when delete button is confirmed', async () => {
    window.confirm = vi.fn(() => true);
    const onUpdatedMock = vi.fn();
    projectsApi.deleteProjectPhoto.mockResolvedValueOnce(null);

    render(
      <EvidencePhotoList
        projectId="proj-123"
        photos={mockPhotos}
        projectStatus="FUNDED"
        isOwner={true}
        onPhotosUpdated={onUpdatedMock}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete Photo');
    expect(deleteButtons.length).toBe(2);

    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(projectsApi.deleteProjectPhoto).toHaveBeenCalledWith('proj-123', 'photo-1');
    });
    expect(onUpdatedMock).toHaveBeenCalledTimes(1);
  });

  it('does not show upload or delete buttons when user is not owner', () => {
    render(
      <EvidencePhotoList
        projectId="proj-123"
        photos={mockPhotos}
        projectStatus="FUNDED"
        isOwner={false}
      />
    );

    expect(screen.queryByTestId('upload-evidence-photo-btn')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete Photo')).not.toBeInTheDocument();
  });
});
