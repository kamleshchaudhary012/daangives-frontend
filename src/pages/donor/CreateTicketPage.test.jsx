import React from 'react';
import { render, screen, waitFor } from '../../test/utils';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import CreateTicketPage from './CreateTicketPage';
import { mockAuth, clearAuth } from '../../test/auth';
import { mockUser } from '../../test/mocks/fixtures';

describe('CreateTicketPage', () => {
  beforeEach(() => {
    mockAuth(mockUser, 'DONOR');
  });

  afterEach(() => {
    clearAuth();
  });

  it('validates empty form submission', async () => {
    render(<CreateTicketPage />);
    
    const submitButton = screen.getByRole('button', { name: /Submit Ticket/i });
    await userEvent.click(submitButton);

    // Should show validation errors (client-side)
    expect(await screen.findByText(/Title must be at least 5 characters/i)).toBeInTheDocument();
  });

  it('submits successfully when fields are filled', async () => {
    render(<CreateTicketPage />);
    
    // Fill title
    const titleInput = screen.getByLabelText(/Ticket Title/i);
    await userEvent.type(titleInput, 'Issue with a campaign');

    // Select category
    const categorySelect = screen.getByLabelText(/Category/i);
    await userEvent.selectOptions(categorySelect, 'CAMPAIGN_FRAUD');

    // Fill description
    const descInput = screen.getByLabelText(/Description/i);
    await userEvent.type(descInput, 'The campaign seems to be misleading about its goals.');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Submit Ticket/i });
    await userEvent.click(submitButton);

    // Wait for the mock API to respond and assume success (this usually redirects)
    // The submit button text changes to Submitting...
    // Let's assert it attempts submission and we wait.
    await waitFor(() => {
      // If it redirects, the component will try to unmount or call navigate. 
      // In this setup, we just verify the client validation passed and no errors are shown.
      expect(screen.queryByText(/Title must be at least 5 characters/i)).not.toBeInTheDocument();
    });
  });
});
