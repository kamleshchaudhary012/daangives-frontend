import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { mockAuth, clearAuth } from '../../test/auth';
import { mockUser } from '../../test/mocks/fixtures';
import MoneyDonationStep1Page from './MoneyDonationStep1Page';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}{location.search}</div>;
}

const mockNgoDigitUuid = {
  id: '406d4371-aa9b-1234-5678-123456789abc',
  display_name: 'Water Relief Foundation',
  legal_name: 'Water Relief Foundation Legal',
  category: 'HEALTHCARE',
  description: 'Providing clean drinking water to underserved schools.',
};

const mockNgoLetterUuid = {
  id: 'bbd9d153-b849-473f-b66e-e738d525a411',
  display_name: 'Forest Conservation Trust',
  legal_name: 'Forest Conservation Trust Legal',
  category: 'ENVIRONMENT',
  description: 'Preserving biodiversity and restoring green cover.',
};

describe('MoneyDonationStep1Page - UUID State Preservation (Finding #3)', () => {
  beforeEach(() => {
    mockAuth(mockUser, 'DONOR');
    server.use(
      http.get('*/api/v1/public/ngos/', () => {
        return HttpResponse.json({
          results: [mockNgoDigitUuid, mockNgoLetterUuid],
          count: 2,
        });
      })
    );
  });

  afterEach(() => {
    clearAuth();
  });

  it('preserves UUID beginning with digits without truncating via parseInt', async () => {
    const digitUuid = '406d4371-aa9b-1234-5678-123456789abc';

    render(
      <MemoryRouter initialEntries={[`/donor/donations/money/step-1?campaignId=camp-101&ngoId=${digitUuid}`]}>
        <Routes>
          <Route path="/donor/donations/money/step-1" element={<MoneyDonationStep1Page />} />
          <Route path="/donor/donations/money/step-2" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Water Relief Foundation')).toBeInTheDocument();
    });

    const continueBtn = screen.getByRole('button', { name: /Continue to Amount Entry/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      const locText = screen.getByTestId('location-display').textContent;
      expect(locText).toBe(`/donor/donations/money/step-2?campaignId=camp-101&ngoId=${digitUuid}`);
      
      const searchParams = new URLSearchParams(locText.split('?')[1]);
      // Verify exact full UUID is retained
      expect(searchParams.get('ngoId')).toBe(digitUuid);
      // Explicit negative assertion: must NOT truncate to '406'
      expect(searchParams.get('ngoId')).not.toBe('406');
      expect(searchParams.get('ngoId')).not.toBe(406);
    });
  });

  it('preserves UUID beginning with letters and containing hyphens', async () => {
    const letterUuid = 'bbd9d153-b849-473f-b66e-e738d525a411';

    render(
      <MemoryRouter initialEntries={[`/donor/donations/money/step-1?campaignId=camp-102&ngoId=${letterUuid}`]}>
        <Routes>
          <Route path="/donor/donations/money/step-1" element={<MoneyDonationStep1Page />} />
          <Route path="/donor/donations/money/step-2" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Forest Conservation Trust')).toBeInTheDocument();
    });

    const continueBtn = screen.getByRole('button', { name: /Continue to Amount Entry/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      const locText = screen.getByTestId('location-display').textContent;
      expect(locText).toBe(`/donor/donations/money/step-2?campaignId=camp-102&ngoId=${letterUuid}`);
    });
  });

  it('safely handles null/undefined initial NGO ID by selecting the first available partner', async () => {
    render(
      <MemoryRouter initialEntries={['/donor/donations/money/step-1?campaignId=camp-103']}>
        <Routes>
          <Route path="/donor/donations/money/step-1" element={<MoneyDonationStep1Page />} />
          <Route path="/donor/donations/money/step-2" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Water Relief Foundation')).toBeInTheDocument();
    });

    const continueBtn = screen.getByRole('button', { name: /Continue to Amount Entry/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      const locText = screen.getByTestId('location-display').textContent;
      expect(locText).toBe(`/donor/donations/money/step-2?campaignId=camp-103&ngoId=${mockNgoDigitUuid.id}`);
    });
  });

  it('safely handles empty string initial NGO ID without NaN or parse failure', async () => {
    render(
      <MemoryRouter initialEntries={['/donor/donations/money/step-1?campaignId=camp-104&ngoId=']}>
        <Routes>
          <Route path="/donor/donations/money/step-1" element={<MoneyDonationStep1Page />} />
          <Route path="/donor/donations/money/step-2" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Water Relief Foundation')).toBeInTheDocument();
    });

    const continueBtn = screen.getByRole('button', { name: /Continue to Amount Entry/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      const locText = screen.getByTestId('location-display').textContent;
      expect(locText).toBe(`/donor/donations/money/step-2?campaignId=camp-104&ngoId=${mockNgoDigitUuid.id}`);
    });
  });

  it('allows user to manually switch selection between UUID non-profits', async () => {
    render(
      <MemoryRouter initialEntries={[`/donor/donations/money/step-1?campaignId=camp-105&ngoId=${mockNgoDigitUuid.id}`]}>
        <Routes>
          <Route path="/donor/donations/money/step-1" element={<MoneyDonationStep1Page />} />
          <Route path="/donor/donations/money/step-2" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Forest Conservation Trust')).toBeInTheDocument();
    });

    // Click second NGO card
    const secondNgo = screen.getByText('Forest Conservation Trust');
    fireEvent.click(secondNgo);

    const continueBtn = screen.getByRole('button', { name: /Continue to Amount Entry/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      const locText = screen.getByTestId('location-display').textContent;
      expect(locText).toBe(`/donor/donations/money/step-2?campaignId=camp-105&ngoId=${mockNgoLetterUuid.id}`);
    });
  });

  it('displays empty state gracefully when no verified NGOs are available', async () => {
    server.use(
      http.get('*/api/v1/public/ngos/', () => {
        return HttpResponse.json({ results: [], count: 0 });
      })
    );

    render(
      <MemoryRouter initialEntries={['/donor/donations/money/step-1']}>
        <Routes>
          <Route path="/donor/donations/money/step-1" element={<MoneyDonationStep1Page />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No verified NGO partners currently available/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Continue to Amount Entry/i })).not.toBeInTheDocument();
  });
});
