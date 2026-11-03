import React, { StrictMode } from 'react';
import { render, screen, waitFor } from '../../test/utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AdminNgoVerificationPage from './AdminNgoVerificationPage';
import * as api from '../../services/api';

describe('AdminNgoVerificationPage Initial Load Bug Reproduction', () => {
  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify({ role: 'ADMIN' }));
    localStorage.setItem('accessToken', 'mock-admin-token');
  });

  it('renders NGO queue on initial load inside StrictMode', async () => {
    const mockNgo = {
      id: 'e5bccfb2-60e0-4d42-8c70-b830924d1267',
      legal_name: 'KAmlesh Trust seva',
      display_name: 'Trust seva',
      status: 'UNDER_REVIEW',
      category: 'EDUCATION',
    };

    const getAdminNgosSpy = vi.spyOn(api, 'getAdminNgos').mockImplementation(async (params, options) => {
      // Simulate real network delay
      await new Promise((resolve) => setTimeout(resolve, 20));
      // If signal is already aborted, throw AbortError like fetch does
      if (options?.signal?.aborted) {
        const err = new Error('The user aborted a request.');
        err.name = 'AbortError';
        throw err;
      }
      return {
        count: 1,
        results: [mockNgo],
      };
    });

    render(
      <StrictMode>
        <AdminNgoVerificationPage />
      </StrictMode>
    );

    // Check if the NGO appears
    await waitFor(() => {
      expect(screen.getByText('Trust seva')).toBeInTheDocument();
    });

    getAdminNgosSpy.mockRestore();
  });
});
