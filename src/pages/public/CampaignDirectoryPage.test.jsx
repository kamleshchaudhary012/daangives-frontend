import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../test/utils';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { mockCampaign } from '../../test/mocks/fixtures';
import CampaignDirectoryPage from './CampaignDirectoryPage';

describe('CampaignDirectoryPage', () => {
  it('renders without crashing', () => {
    render(<CampaignDirectoryPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('loads campaigns on initial render', async () => {
    render(<CampaignDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Campaigns/i })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(mockCampaign.title)).toBeInTheDocument();
    });
  });

  it('debounces keystrokes and only requests the final search term', async () => {
    const requestedQueries = [];
    server.use(
      http.get('*/api/v1/public/campaigns/', ({ request }) => {
        const url = new URL(request.url);
        requestedQueries.push(url.searchParams.get('search'));
        return HttpResponse.json({ results: [mockCampaign], count: 1 });
      })
    );

    render(<CampaignDirectoryPage />);

    await waitFor(() => {
      expect(screen.getByText(mockCampaign.title)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search campaigns, appeals, or NGOs...');

    // Rapid keystroke simulation
    fireEvent.change(searchInput, { target: { value: 'w' } });
    fireEvent.change(searchInput, { target: { value: 'wa' } });
    fireEvent.change(searchInput, { target: { value: 'wat' } });
    fireEvent.change(searchInput, { target: { value: 'water' } });

    await waitFor(() => {
      expect(requestedQueries).toContain('water');
    }, { timeout: 1500 });

    expect(requestedQueries).not.toContain('w');
    expect(requestedQueries).not.toContain('wa');
    expect(requestedQueries).not.toContain('wat');
  });
});
