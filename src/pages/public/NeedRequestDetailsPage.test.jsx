import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import NeedRequestDetailsPage from './NeedRequestDetailsPage';

const mockCampaignWithNgo = {
  id: 'camp-1234-uuid',
  slug: 'clean-drinking-water',
  title: 'Clean Drinking Water for Rural Schools',
  category: 'HEALTHCARE',
  target_amount: '500000.00',
  raised_amount: '350000.00',
  ngo: '406d4371-aa9b-1234-5678-123456789abc',
  ngo_id: '406d4371-aa9b-1234-5678-123456789abc',
  ngo_name: 'Jal Jeevan Foundation',
  ngo_slug: 'jal-jeevan',
  ngo_city: 'Pune',
  ngo_state: 'Maharashtra',
  status: 'ACTIVE',
};

const mockCampaignWithoutNgo = {
  id: 'camp-5678-uuid',
  slug: 'emergency-relief',
  title: 'Emergency Flood Relief',
  category: 'DISASTER_RELIEF',
  target_amount: '200000.00',
  raised_amount: '50000.00',
  ngo: null,
  ngo_id: null,
  ngo_name: 'Relief India',
  ngo_slug: 'relief-india',
  status: 'ACTIVE',
};

describe('NeedRequestDetailsPage - NGO Identifier & Direct Donation Navigation (Finding #2)', () => {
  it('directs user directly to Step 2 with campaignId and ngoId when NGO identifier is present', async () => {
    server.use(
      http.get('*/api/v1/public/campaigns/:slug/', () => {
        return HttpResponse.json(mockCampaignWithNgo);
      })
    );

    render(
      <MemoryRouter initialEntries={['/campaigns/clean-drinking-water']}>
        <Routes>
          <Route path="/campaigns/:id" element={<NeedRequestDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Clean Drinking Water for Rural Schools' })).toBeInTheDocument();
    });

    const donateLink = screen.getByRole('link', { name: /Donate Money →/i });
    expect(donateLink).toBeInTheDocument();

    // Verify it links straight to Step 2 with the campaign ID and exact NGO UUID
    expect(donateLink).toHaveAttribute(
      'href',
      '/donor/donations/money/step-2?campaignId=camp-1234-uuid&ngoId=406d4371-aa9b-1234-5678-123456789abc'
    );

    // Verify it does NOT force the donor back to Step 1
    expect(donateLink.getAttribute('href')).not.toContain('step-1');
  });

  it('safely falls back to Step 1 when NGO identifier is null or omitted', async () => {
    server.use(
      http.get('*/api/v1/public/campaigns/:slug/', () => {
        return HttpResponse.json(mockCampaignWithoutNgo);
      })
    );

    render(
      <MemoryRouter initialEntries={['/campaigns/emergency-relief']}>
        <Routes>
          <Route path="/campaigns/:id" element={<NeedRequestDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Emergency Flood Relief' })).toBeInTheDocument();
    });

    const donateLink = screen.getByRole('link', { name: /Donate Money →/i });
    expect(donateLink).toBeInTheDocument();

    // Verify fallback directs to Step 1 without broken undefined/null query params
    expect(donateLink).toHaveAttribute(
      'href',
      '/donor/donations/money/step-1?campaignId=camp-5678-uuid'
    );
    expect(donateLink.getAttribute('href')).not.toContain('undefined');
    expect(donateLink.getAttribute('href')).not.toContain('null');
  });

  it('handles 404 campaign appeal error gracefully', async () => {
    server.use(
      http.get('*/api/v1/public/campaigns/:slug/', () => {
        return HttpResponse.json({ detail: 'Not found.' }, { status: 404 });
      })
    );

    render(
      <MemoryRouter initialEntries={['/campaigns/non-existent-campaign']}>
        <Routes>
          <Route path="/campaigns/:id" element={<NeedRequestDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Campaign Not Found/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /Browse Campaign Directory →/i })).toBeInTheDocument();
  });
});
