import React from 'react';
import { render, screen, waitFor, fireEvent, act } from './utils';
import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { server } from './mocks/server';
import NgoDirectoryPage from '../pages/public/NgoDirectoryPage';
import CampaignDirectoryPage from '../pages/public/CampaignDirectoryPage';

const testNgoA = {
  id: 'ngo-a',
  display_name: 'Kamlesh Welfare Foundation',
  description: 'Education and relief for underprivileged children',
  city: 'Ahmedabad',
  state: 'Gujarat',
  category: 'EDUCATION',
  is_approved: true,
};

const testNgoB = {
  id: 'ngo-b',
  display_name: 'Bharat Seva Trust',
  description: 'Healthcare and food distribution',
  city: 'Mumbai',
  state: 'Maharashtra',
  category: 'HEALTHCARE',
  is_approved: true,
};

describe('PROJECT-WIDE SEARCH REQUEST OPTIMIZATION VERIFICATION', () => {
  it('demonstrates AFTER optimization: rapid typing "kamlesh" issues exactly 1 search request instead of 7', async () => {
    const capturedSearchRequests = [];
    server.use(
      http.get('*/api/v1/public/ngos/', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');
        if (search) {
          capturedSearchRequests.push(search);
          return HttpResponse.json({ results: [testNgoA], count: 1 });
        }
        return HttpResponse.json({ results: [testNgoA, testNgoB], count: 2 });
      })
    );

    render(<NgoDirectoryPage />);

    // Wait for initial default list to load
    await waitFor(() => {
      expect(screen.getByText('Kamlesh Welfare Foundation')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search NGO by name, city, or district...');

    // Simulate user typing 7 individual keystrokes: 'k', 'ka', 'kam', 'kaml', 'kamle', 'kamles', 'kamlesh'
    // Before optimization, this triggered 7 API calls immediately.
    fireEvent.change(searchInput, { target: { value: 'k' } });
    fireEvent.change(searchInput, { target: { value: 'ka' } });
    fireEvent.change(searchInput, { target: { value: 'kam' } });
    fireEvent.change(searchInput, { target: { value: 'kaml' } });
    fireEvent.change(searchInput, { target: { value: 'kamle' } });
    fireEvent.change(searchInput, { target: { value: 'kamles' } });
    fireEvent.change(searchInput, { target: { value: 'kamlesh' } });

    // Wait for 350ms debounce timer to fire
    await waitFor(() => {
      expect(capturedSearchRequests).toContain('kamlesh');
    }, { timeout: 1500 });

    // VERIFICATION:
    // Exactly 1 search request was fired for the final query 'kamlesh'
    expect(capturedSearchRequests).toEqual(['kamlesh']);
    expect(capturedSearchRequests.length).toBe(1);

    // Intermediate queries were NEVER sent to the backend
    expect(capturedSearchRequests).not.toContain('k');
    expect(capturedSearchRequests).not.toContain('ka');
    expect(capturedSearchRequests).not.toContain('kam');
    expect(capturedSearchRequests).not.toContain('kaml');
    expect(capturedSearchRequests).not.toContain('kamle');
    expect(capturedSearchRequests).not.toContain('kamles');
  });

  it('prevents duplicate requests for queries that normalize to the same string', async () => {
    const searchCallCount = [];
    server.use(
      http.get('*/api/v1/public/ngos/', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');
        if (search) {
          searchCallCount.push(search);
        }
        return HttpResponse.json({ results: [testNgoA], count: 1 });
      })
    );

    render(<NgoDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Kamlesh Welfare Foundation')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search NGO by name, city, or district...');

    // Type 'kamlesh'
    fireEvent.change(searchInput, { target: { value: 'kamlesh' } });

    await waitFor(() => {
      expect(searchCallCount).toContain('kamlesh');
    });

    const initialCallCount = searchCallCount.length;

    // Type trailing space 'kamlesh ' which trims to the same query
    fireEvent.change(searchInput, { target: { value: 'kamlesh ' } });

    // Wait past debounce
    await new Promise((r) => setTimeout(r, 450));

    // Must NOT fire another request for identical trimmed query
    expect(searchCallCount.length).toBe(initialCallCount);
  });

  it('does NOT debounce non-search controls (sorting changes execute immediately)', async () => {
    const orderingRequests = [];
    server.use(
      http.get('*/api/v1/public/ngos/', ({ request }) => {
        const url = new URL(request.url);
        const ordering = url.searchParams.get('ordering');
        orderingRequests.push(ordering);
        return HttpResponse.json({ results: [testNgoA], count: 1 });
      })
    );

    render(<NgoDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Kamlesh Welfare Foundation')).toBeInTheDocument();
    });

    const sortSelect = screen.getByDisplayValue('Name (A-Z)');

    // Change sorting to Name (Z-A)
    fireEvent.change(sortSelect, { target: { value: '-display_name' } });

    // Sorting must update immediately without 350ms debounce
    await waitFor(() => {
      expect(orderingRequests).toContain('-display_name');
    });
  });

  it('protects against stale responses when an earlier slow request returns after a newer one', async () => {
    let slowRequestCompleted = false;

    server.use(
      http.get('*/api/v1/public/ngos/', async ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');

        if (search === 'slow_query') {
          // Artificial network delay for earlier request
          await delay(400);
          slowRequestCompleted = true;
          return HttpResponse.json({
            results: [{ ...testNgoB, display_name: 'STALE OUTDATED RESULT' }],
            count: 1,
          });
        }

        if (search === 'fast_query') {
          // Fast newer request
          return HttpResponse.json({
            results: [{ ...testNgoA, display_name: 'LATEST CORRECT RESULT' }],
            count: 1,
          });
        }

        return HttpResponse.json({ results: [testNgoA], count: 1 });
      })
    );

    render(<NgoDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Kamlesh Welfare Foundation')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search NGO by name, city, or district...');

    // Trigger slow_query via form submit
    fireEvent.change(searchInput, { target: { value: 'slow_query' } });
    fireEvent.submit(searchInput.closest('form'));

    // Immediately trigger fast_query via form submit
    fireEvent.change(searchInput, { target: { value: 'fast_query' } });
    fireEvent.submit(searchInput.closest('form'));

    // Wait for fast query to display
    await waitFor(() => {
      expect(screen.getByText('LATEST CORRECT RESULT')).toBeInTheDocument();
    });

    // Wait for slow query to finish in background
    await waitFor(() => {
      expect(slowRequestCompleted).toBe(true);
    });

    // Stale response protection must ensure the older slow query NEVER overwrote the UI
    expect(screen.getByText('LATEST CORRECT RESULT')).toBeInTheDocument();
    expect(screen.queryByText('STALE OUTDATED RESULT')).not.toBeInTheDocument();
  });
});
