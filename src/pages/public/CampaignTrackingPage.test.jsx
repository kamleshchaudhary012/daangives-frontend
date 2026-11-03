import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CampaignTrackingPage from './CampaignTrackingPage';

describe('CampaignTrackingPage', () => {
  it('renders campaign tracking data accurately via MSW', async () => {
    render(
      <MemoryRouter initialEntries={['/campaigns/clean-drinking-water/tracking']}>
        <Routes>
          <Route path="/campaigns/:slug/tracking" element={<CampaignTrackingPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial loading state
    expect(screen.getByText(/Loading Verified Campaign Tracking/i)).toBeInTheDocument();

    // After MSW resolves, campaign data appears
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Clean Drinking Water for Rural Schools' })).toBeInTheDocument();
    });

    // Verification summary metrics
    expect(screen.getByText('Jal Jeevan Foundation')).toBeInTheDocument();
    expect(screen.getByText(/Campaign Verification Summary/i)).toBeInTheDocument();
    expect(screen.getAllByText('₹25,000.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1 / 1')).toBeInTheDocument(); // Milestones completed

    // Milestones section
    expect(screen.getByText('Procurement of RO Filtration Plants')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();

    // Verified proof cards
    expect(screen.getAllByText(/Distributed 50 nutrition kits/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pune Municipal School No 4/i).length).toBeGreaterThan(0);
  });

  it('handles 404 not found error gracefully', async () => {
    render(
      <MemoryRouter initialEntries={['/campaigns/not-found-slug/tracking']}>
        <Routes>
          <Route path="/campaigns/:slug/tracking" element={<CampaignTrackingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Tracking Record Not Found/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /Browse Campaign Directory/i })).toBeInTheDocument();
  });
});
