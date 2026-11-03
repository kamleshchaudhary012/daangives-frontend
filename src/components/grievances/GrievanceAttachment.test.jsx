import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GrievanceAttachment from './GrievanceAttachment';
import * as grievanceApi from '../../services/api/grievances';

describe('GrievanceAttachment Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders View Attachment button, filename, and file type badge for available attachment', () => {
    render(
      <GrievanceAttachment
        attachment="/api/v1/grievances/tickets/8404b0f3-1e8e-4372-849e-ff9f3b36ea6a/attachment/"
        attachmentName="DaanGives_Receipt_bf0ff45c-ab1a-407b-a469-30e8d8fb28bf.pdf"
        attachmentAvailable={true}
      />
    );

    // Filename is visible
    expect(screen.getByText('DaanGives_Receipt_bf0ff45c-ab1a-407b-a469-30e8d8fb28bf.pdf')).toBeInTheDocument();

    // File type badge is rendered
    expect(screen.getByText('PDF')).toBeInTheDocument();

    // "View Attachment" action button is rendered
    const viewButton = screen.getByRole('button', { name: /View attachment DaanGives_Receipt_/i });
    expect(viewButton).toBeInTheDocument();
    expect(viewButton).toHaveTextContent('View Attachment');

    // Download action button is rendered
    expect(screen.getByRole('button', { name: /Download attachment/i })).toBeInTheDocument();
  });

  it('displays a clear unavailable state and avoids active link when attachment is missing', () => {
    render(
      <GrievanceAttachment
        attachment="/api/v1/grievances/tickets/missing-id/attachment/"
        attachmentName="Lost_Document.pdf"
        attachmentAvailable={false}
      />
    );

    // Warning alert is rendered
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Attachment unavailable')).toBeInTheDocument();
    expect(screen.getByText('Lost_Document.pdf')).toBeInTheDocument();
    expect(screen.getByText(/The stored document could not be located on the server/i)).toBeInTheDocument();

    // No active "View Attachment" button is rendered
    expect(screen.queryByRole('button', { name: /View attachment/i })).not.toBeInTheDocument();
  });

  it('triggers authenticated attachment fetch when "View Attachment" is clicked', async () => {
    const fetchSpy = vi.spyOn(grievanceApi, 'fetchGrievanceAttachment').mockResolvedValue({
      blobUrl: 'blob:http://localhost:5173/test-blob',
      filename: 'DaanGives_Receipt_bf0ff45c-ab1a-407b-a469-30e8d8fb28bf.pdf',
    });

    render(
      <GrievanceAttachment
        attachment="/api/v1/grievances/tickets/8404b0f3-1e8e-4372-849e-ff9f3b36ea6a/attachment/"
        attachmentName="DaanGives_Receipt_bf0ff45c-ab1a-407b-a469-30e8d8fb28bf.pdf"
        attachmentAvailable={true}
      />
    );

    const viewButton = screen.getByRole('button', { name: /View attachment DaanGives_Receipt_/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/grievances/tickets/8404b0f3-1e8e-4372-849e-ff9f3b36ea6a/attachment/',
        'DaanGives_Receipt_bf0ff45c-ab1a-407b-a469-30e8d8fb28bf.pdf',
        false
      );
    });
  });

  it('renders compact mode for message thread responses', () => {
    render(
      <GrievanceAttachment
        attachment="/api/v1/grievances/responses/resp-1/attachment/"
        attachmentName="Response_Evidence.png"
        attachmentAvailable={true}
        isCompact={true}
      />
    );

    expect(screen.getByText('Response_Evidence.png')).toBeInTheDocument();
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
  });

  it('displays inline error when attachment fetch fails', async () => {
    vi.spyOn(grievanceApi, 'fetchGrievanceAttachment').mockRejectedValue(
      new Error('Attachment file is unavailable on server.')
    );

    render(
      <GrievanceAttachment
        attachment="/api/v1/grievances/tickets/some-ticket/attachment/"
        attachmentName="Error_Document.pdf"
        attachmentAvailable={true}
      />
    );

    const viewButton = screen.getByRole('button', { name: /View attachment Error_Document/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText('Attachment file is unavailable on server.')).toBeInTheDocument();
    });
  });
});
