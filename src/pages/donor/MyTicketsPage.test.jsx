import React from 'react';
import { render, screen, waitFor } from '../../test/utils';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import MyTicketsPage from './MyTicketsPage';
import { mockAuth, clearAuth } from '../../test/auth';
import { mockUser } from '../../test/mocks/fixtures';

describe('MyTicketsPage', () => {
  beforeEach(() => {
    mockAuth(mockUser, 'DONOR');
  });

  afterEach(() => {
    clearAuth();
  });

  it('shows a loading state then renders the ticket list', async () => {
    render(<MyTicketsPage />);
    
    // Assert loading state
    expect(screen.getByText(/Loading tickets.../i)).toBeInTheDocument();

    // Wait for the API call to resolve and display the tickets
    await waitFor(() => {
      expect(screen.queryByText(/Loading tickets.../i)).not.toBeInTheDocument();
    });

    // Assert actual tickets from mockTicketList
    expect(screen.getByText('Test Grievance')).toBeInTheDocument();
    expect(screen.getByText('Another Issue')).toBeInTheDocument();
    
  });
});
