import React from 'react';
import { render, screen, waitFor, fireEvent } from '../utils';
import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import NgoDirectoryPage from '../../pages/public/NgoDirectoryPage';
import CampaignDirectoryPage from '../../pages/public/CampaignDirectoryPage';

const mockNgo1 = {
  id: 'ngo-1',
  display_name: 'Trust seva',
  gujarati_name: 'ટ્રસ્ટ સેવા',
  category: 'EDUCATION',
  city: 'Ahmedabad',
  state: 'Gujarat',
  description: 'Education welfare organization',
  has_80g: false,
  has_fcra: false,
  has_12a: true,
  darpan_id: 'GJ/2021/001',
  year_established: 2018,
};

const mockNgo2 = {
  id: 'ngo-2',
  display_name: 'Arogya Relief Society',
  category: 'HEALTHCARE',
  city: 'Surat',
  state: 'Gujarat',
  description: 'Healthcare initiatives',
  has_80g: true,
  has_fcra: true,
  has_12a: true,
  darpan_id: 'GJ/2020/002',
  year_established: 2015,
};

const mockCampaign1 = {
  id: 'camp-1',
  title: 'Clean Water Initiative',
  category: 'ENVIRONMENT',
  ngo_name: 'Prakriti Trust',
  ngo_slug: 'prakriti-trust',
  ngo_city: 'Vadodara',
  ngo_state: 'Gujarat',
  target_amount: 100000,
  raised_amount: 45000,
  created_at: '2026-01-01T00:00:00Z',
};

const mockCampaign2 = {
  id: 'camp-2',
  title: 'Rural Education Drive',
  category: 'EDUCATION',
  ngo_name: 'Trust seva',
  ngo_slug: 'trust-seva',
  ngo_city: 'Ahmedabad',
  ngo_state: 'Gujarat',
  target_amount: 50000,
  raised_amount: 20000,
  created_at: '2026-02-01T00:00:00Z',
};

describe('Directory Clear All Filters Regression Tests', () => {
  // =========================================================================
  // 1. NGO DIRECTORY TESTS
  // =========================================================================

  it('NGO Directory: shows results before filtering, empty state when filtered, and recovers records after Clear All Filters', async () => {
    server.use(
      http.get('*/api/v1/public/ngos/', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');
        const category = url.searchParams.get('category');
        const has80g = url.searchParams.get('has_80g');

        if (category === 'HEALTHCARE' && has80g === 'true') {
          return HttpResponse.json({ results: [mockNgo2], count: 1 });
        }
        if (search === 'NonExistent' || category === 'DISASTER_RELIEF') {
          return HttpResponse.json({ results: [], count: 0 });
        }
        return HttpResponse.json({ results: [mockNgo1, mockNgo2], count: 2 });
      })
    );

    render(<NgoDirectoryPage />);

    // 1. Unfiltered page shows all records
    await waitFor(() => {
      expect(screen.getByText('Trust seva')).toBeInTheDocument();
      expect(screen.getByText('Arogya Relief Society')).toBeInTheDocument();
    });

    // 2. Filter to non-matching category
    const disasterBtn = screen.getByRole('button', { name: 'Disaster Relief' });
    fireEvent.click(disasterBtn);

    await waitFor(() => {
      expect(screen.getByText('No Verified NGOs Found')).toBeInTheDocument();
    });
    expect(screen.queryByText('Trust seva')).not.toBeInTheDocument();

    // 3. Click Clear All Filters
    const clearBtn = screen.getByRole('button', { name: 'Clear All Filters' });
    fireEvent.click(clearBtn);

    // 4. All eligible records are visible again
    await waitFor(() => {
      expect(screen.getByText('Trust seva')).toBeInTheDocument();
      expect(screen.getByText('Arogya Relief Society')).toBeInTheDocument();
    });
  });

  it('NGO Directory: clearing multiple active filters together resets inputs, checkboxes, ordering and query params', async () => {
    let capturedParams = null;
    server.use(
      http.get('*/api/v1/public/ngos/', ({ request }) => {
        const url = new URL(request.url);
        capturedParams = Object.fromEntries(url.searchParams.entries());

        if (url.searchParams.get('search') === 'Arogya' && url.searchParams.get('has_80g') === 'true') {
          return HttpResponse.json({ results: [mockNgo2], count: 1 });
        }
        return HttpResponse.json({ results: [mockNgo1, mockNgo2], count: 2 });
      })
    );

    render(<NgoDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Trust seva')).toBeInTheDocument();
    });

    // Apply search, 80G checkbox, and FCRA checkbox
    const searchInput = screen.getByPlaceholderText('Search NGO by name, city, or district...');
    fireEvent.change(searchInput, { target: { value: 'Arogya' } });

    const checkbox80g = screen.getByLabelText(/80G Approved Only/i);
    fireEvent.click(checkbox80g);

    const checkboxFcra = screen.getByLabelText(/FCRA Reg. Only/i);
    fireEvent.click(checkboxFcra);

    // Wait for search/filters to trigger
    await waitFor(() => {
      expect(capturedParams?.has_80g).toBe('true');
      expect(capturedParams?.has_fcra).toBe('true');
    });

    // Trigger clear filters via Clear All Filters in empty state if zero results or clear manually
    // Let's filter to empty
    server.use(
      http.get('*/api/v1/public/ngos/', () => HttpResponse.json({ results: [], count: 0 }))
    );
    fireEvent.change(searchInput, { target: { value: 'nomatch' } });

    await waitFor(() => {
      expect(screen.getByText('No Verified NGOs Found')).toBeInTheDocument();
    });

    // Restore server handler
    server.use(
      http.get('*/api/v1/public/ngos/', ({ request }) => {
        const url = new URL(request.url);
        capturedParams = Object.fromEntries(url.searchParams.entries());
        return HttpResponse.json({ results: [mockNgo1, mockNgo2], count: 2 });
      })
    );

    const clearBtn = screen.getByRole('button', { name: 'Clear All Filters' });
    fireEvent.click(clearBtn);

    // Assert inputs and checkboxes are reset
    await waitFor(() => {
      expect(searchInput.value).toBe('');
      expect(checkbox80g.checked).toBe(false);
      expect(checkboxFcra.checked).toBe(false);
      expect(screen.getByText('Trust seva')).toBeInTheDocument();
    });

    // Assert stale parameters are not sent in query
    expect(capturedParams.has_80g).toBeUndefined();
    expect(capturedParams.has_fcra).toBeUndefined();
    expect(capturedParams.search).toBeUndefined();
    expect(capturedParams.category).toBeUndefined();
  });

  it('NGO Directory: resets pagination when filters are cleared', async () => {
    let capturedPage = null;
    server.use(
      http.get('*/api/v1/public/ngos/', ({ request }) => {
        const url = new URL(request.url);
        capturedPage = url.searchParams.get('page');

        // Fake 25 items so pagination bar appears
        return HttpResponse.json({
          count: 25,
          next: capturedPage === '2' ? null : 'http://localhost:8000/api/v1/public/ngos/?page=2',
          previous: capturedPage === '2' ? 'http://localhost:8000/api/v1/public/ngos/?page=1' : null,
          results: [mockNgo1],
        });
      })
    );

    render(<NgoDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Trust seva')).toBeInTheDocument();
    });

    // Click Next Page
    const nextBtn = screen.getByRole('button', { name: 'Next Page' });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(capturedPage).toBe('2');
    });

    // Now filter to 0 items
    server.use(
      http.get('*/api/v1/public/ngos/', () => HttpResponse.json({ results: [], count: 0 }))
    );
    const searchInput = screen.getByPlaceholderText('Search NGO by name, city, or district...');
    fireEvent.change(searchInput, { target: { value: 'none' } });

    await waitFor(() => {
      expect(screen.getByText('No Verified NGOs Found')).toBeInTheDocument();
    });

    // Restore server handler
    server.use(
      http.get('*/api/v1/public/ngos/', ({ request }) => {
        const url = new URL(request.url);
        capturedPage = url.searchParams.get('page');
        return HttpResponse.json({ results: [mockNgo1], count: 1 });
      })
    );

    const clearBtn = screen.getByRole('button', { name: 'Clear All Filters' });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(screen.getByText('Trust seva')).toBeInTheDocument();
      expect(capturedPage).toBe('1');
    });
  });

  it('NGO Directory: API errors remain distinct from empty results and display a retry button', async () => {
    server.use(
      http.get('*/api/v1/public/ngos/', () => HttpResponse.json({ detail: 'Database unreachable' }, { status: 500 }))
    );

    render(<NgoDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Database unreachable')).toBeInTheDocument();
    });

    // "No Verified NGOs Found" should NOT be shown on API failure
    expect(screen.queryByText('No Verified NGOs Found')).not.toBeInTheDocument();

    // Retry button is available
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('NGO Directory: repeated filter changes and clear operations remain fully functional', async () => {
    server.use(
      http.get('*/api/v1/public/ngos/', ({ request }) => {
        const url = new URL(request.url);
        const cat = url.searchParams.get('category');
        if (cat === 'DISASTER_RELIEF') {
          return HttpResponse.json({ results: [], count: 0 });
        }
        return HttpResponse.json({ results: [mockNgo1], count: 1 });
      })
    );

    render(<NgoDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Trust seva')).toBeInTheDocument();
    });

    // Cycle 1: Filter -> Empty -> Clear -> Restored
    fireEvent.click(screen.getByRole('button', { name: 'Disaster Relief' }));
    await waitFor(() => {
      expect(screen.getByText('No Verified NGOs Found')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Clear All Filters' }));
    await waitFor(() => {
      expect(screen.getByText('Trust seva')).toBeInTheDocument();
    });

    // Cycle 2: Filter -> Empty -> Clear -> Restored again
    fireEvent.click(screen.getByRole('button', { name: 'Disaster Relief' }));
    await waitFor(() => {
      expect(screen.getByText('No Verified NGOs Found')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Clear All Filters' }));
    await waitFor(() => {
      expect(screen.getByText('Trust seva')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. CAMPAIGN DIRECTORY TESTS
  // =========================================================================

  it('Campaign Directory: shows results before filtering, empty state when filtered, and recovers records after Clear All Filters', async () => {
    server.use(
      http.get('*/api/v1/public/campaigns/', ({ request }) => {
        const url = new URL(request.url);
        const category = url.searchParams.get('category');
        const search = url.searchParams.get('search');

        if (category === 'DISASTER_RELIEF' || search === 'NonExistent') {
          return HttpResponse.json({ results: [], count: 0 });
        }
        return HttpResponse.json({ results: [mockCampaign1, mockCampaign2], count: 2 });
      })
    );

    render(<CampaignDirectoryPage />);

    // 1. Initial load
    await waitFor(() => {
      expect(screen.getByText('Clean Water Initiative')).toBeInTheDocument();
      expect(screen.getByText('Rural Education Drive')).toBeInTheDocument();
    });

    // 2. Select non-matching category
    fireEvent.click(screen.getByRole('button', { name: /Disaster Relief/i }));

    await waitFor(() => {
      expect(screen.getByText('No active campaigns found.')).toBeInTheDocument();
    });
    expect(screen.queryByText('Clean Water Initiative')).not.toBeInTheDocument();

    // 3. Clear All Filters
    fireEvent.click(screen.getByRole('button', { name: 'Clear All Filters' }));

    // 4. Records restored
    await waitFor(() => {
      expect(screen.getByText('Clean Water Initiative')).toBeInTheDocument();
      expect(screen.getByText('Rural Education Drive')).toBeInTheDocument();
    });
  });

  it('Campaign Directory: clearing multiple active filters together resets search, category, ordering, and pagination', async () => {
    let capturedParams = null;
    server.use(
      http.get('*/api/v1/public/campaigns/', ({ request }) => {
        const url = new URL(request.url);
        capturedParams = Object.fromEntries(url.searchParams.entries());

        if (url.searchParams.get('search') === 'Nomatch') {
          return HttpResponse.json({ results: [], count: 0 });
        }
        return HttpResponse.json({ results: [mockCampaign1], count: 1 });
      })
    );

    render(<CampaignDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Clean Water Initiative')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search campaigns, appeals, or NGOs...');
    fireEvent.change(searchInput, { target: { value: 'Nomatch' } });

    await waitFor(() => {
      expect(screen.getByText('No active campaigns found.')).toBeInTheDocument();
    });

    // Clear filters
    fireEvent.click(screen.getByRole('button', { name: 'Clear All Filters' }));

    await waitFor(() => {
      expect(screen.getByText('Clean Water Initiative')).toBeInTheDocument();
      expect(searchInput.value).toBe('');
    });

    expect(capturedParams.search).toBeUndefined();
    expect(capturedParams.category).toBeUndefined();
    expect(capturedParams.ordering).toBe('-created_at');
    expect(capturedParams.page).toBe('1');
  });

  it('Campaign Directory: resets pagination when filters are cleared', async () => {
    let capturedPage = null;
    server.use(
      http.get('*/api/v1/public/campaigns/', ({ request }) => {
        const url = new URL(request.url);
        capturedPage = url.searchParams.get('page');

        return HttpResponse.json({
          count: 25,
          next: capturedPage === '2' ? null : 'http://localhost:8000/api/v1/public/campaigns/?page=2',
          previous: capturedPage === '2' ? 'http://localhost:8000/api/v1/public/campaigns/?page=1' : null,
          results: [mockCampaign1],
        });
      })
    );

    render(<CampaignDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Clean Water Initiative')).toBeInTheDocument();
    });

    // Navigate to page 2
    fireEvent.click(screen.getByRole('button', { name: 'Next Page' }));

    await waitFor(() => {
      expect(capturedPage).toBe('2');
    });

    // Filter to empty
    server.use(
      http.get('*/api/v1/public/campaigns/', () => HttpResponse.json({ results: [], count: 0 }))
    );
    const searchInput = screen.getByPlaceholderText('Search campaigns, appeals, or NGOs...');
    fireEvent.change(searchInput, { target: { value: 'none' } });

    await waitFor(() => {
      expect(screen.getByText('No active campaigns found.')).toBeInTheDocument();
    });

    // Restore results
    server.use(
      http.get('*/api/v1/public/campaigns/', ({ request }) => {
        const url = new URL(request.url);
        capturedPage = url.searchParams.get('page');
        return HttpResponse.json({ results: [mockCampaign1], count: 1 });
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear All Filters' }));

    await waitFor(() => {
      expect(screen.getByText('Clean Water Initiative')).toBeInTheDocument();
      expect(capturedPage).toBe('1');
    });
  });

  it('Campaign Directory: API errors remain distinct from empty results and display retry button', async () => {
    server.use(
      http.get('*/api/v1/public/campaigns/', () => HttpResponse.json({ detail: 'Service unavailable' }, { status: 503 }))
    );

    render(<CampaignDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Service unavailable')).toBeInTheDocument();
    });

    // Empty state card must not appear on API error
    expect(screen.queryByText('No active campaigns found.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('Campaign Directory: repeated filter changes and clear operations remain fully functional', async () => {
    server.use(
      http.get('*/api/v1/public/campaigns/', ({ request }) => {
        const url = new URL(request.url);
        const cat = url.searchParams.get('category');
        if (cat === 'DISASTER_RELIEF') {
          return HttpResponse.json({ results: [], count: 0 });
        }
        return HttpResponse.json({ results: [mockCampaign1], count: 1 });
      })
    );

    render(<CampaignDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Clean Water Initiative')).toBeInTheDocument();
    });

    // Cycle 1: Filter -> Empty -> Clear -> Restored
    fireEvent.click(screen.getByRole('button', { name: /Disaster Relief/i }));
    await waitFor(() => {
      expect(screen.getByText('No active campaigns found.')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Clear All Filters' }));
    await waitFor(() => {
      expect(screen.getByText('Clean Water Initiative')).toBeInTheDocument();
    });

    // Cycle 2: Filter -> Empty -> Clear -> Restored again
    fireEvent.click(screen.getByRole('button', { name: /Disaster Relief/i }));
    await waitFor(() => {
      expect(screen.getByText('No active campaigns found.')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Clear All Filters' }));
    await waitFor(() => {
      expect(screen.getByText('Clean Water Initiative')).toBeInTheDocument();
    });
  });
});
