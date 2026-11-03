import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../test/utils';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { mockNgo } from '../../test/mocks/fixtures';
import NgoDirectoryPage from './NgoDirectoryPage';

const testNgo = {
  ...mockNgo,
  display_name: 'Earth NGO Foundation',
};

describe('NgoDirectoryPage', () => {
  it('renders without crashing', () => {
    render(<NgoDirectoryPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('loads default NGO list on initial render', async () => {
    server.use(
      http.get('*/api/v1/public/ngos/', () => {
        return HttpResponse.json({ results: [testNgo], count: 1 });
      })
    );

    render(<NgoDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Verified NGO Directory/i })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Earth NGO Foundation')).toBeInTheDocument();
    });
  });

  it('debounces rapid typing and fires single request for final search query', async () => {
    const requestedQueries = [];
    server.use(
      http.get('*/api/v1/public/ngos/', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');
        requestedQueries.push(search);
        return HttpResponse.json({ results: [testNgo], count: 1 });
      })
    );

    render(<NgoDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Earth NGO Foundation')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search NGO by name, city, or district...');
    expect(searchInput).toBeInTheDocument();

    // Fast typing simulation: 'k', 'ka', 'kam', 'kamlesh'
    fireEvent.change(searchInput, { target: { value: 'k' } });
    fireEvent.change(searchInput, { target: { value: 'ka' } });
    fireEvent.change(searchInput, { target: { value: 'kam' } });
    fireEvent.change(searchInput, { target: { value: 'kamlesh' } });

    // Wait for debounce period (350ms) to trigger network request
    await waitFor(() => {
      expect(requestedQueries).toContain('kamlesh');
    }, { timeout: 1500 });

    // Verify intermediate 'k', 'ka', 'kam' did NOT trigger server calls
    expect(requestedQueries).not.toContain('k');
    expect(requestedQueries).not.toContain('ka');
    expect(requestedQueries).not.toContain('kam');
  });

  it('immediately triggers search when form is submitted (Enter pressed)', async () => {
    const requestedQueries = [];
    server.use(
      http.get('*/api/v1/public/ngos/', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');
        requestedQueries.push(search);
        return HttpResponse.json({ results: [testNgo], count: 1 });
      })
    );

    render(<NgoDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Earth NGO Foundation')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search NGO by name, city, or district...');
    fireEvent.change(searchInput, { target: { value: 'immediate_query' } });

    const form = searchInput.closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(requestedQueries).toContain('immediate_query');
    });
  });

  it('resets query and reloads default list when filters are cleared', async () => {
    server.use(
      http.get('*/api/v1/public/ngos/', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');
        if (search === 'no_match') {
          return HttpResponse.json({ results: [], count: 0 });
        }
        return HttpResponse.json({ results: [testNgo], count: 1 });
      })
    );

    render(<NgoDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Earth NGO Foundation')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search NGO by name, city, or district...');
    fireEvent.change(searchInput, { target: { value: 'no_match' } });

    await waitFor(() => {
      expect(screen.getByText('No Verified NGOs Found')).toBeInTheDocument();
    });

    const clearBtn = screen.getByRole('button', { name: /Clear All Filters/i });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(screen.getByText('Earth NGO Foundation')).toBeInTheDocument();
    });
    expect(searchInput.value).toBe('');
  });
});
