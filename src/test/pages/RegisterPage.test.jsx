import React from 'react';
import { render, screen, fireEvent } from '../utils';
import { describe, it, expect } from 'vitest';
import RegisterPage from '../../pages/public/RegisterPage';

describe('RegisterPage Smoke Tests (Phase 7.1 CSR-Only)', () => {
  it('renders exactly 2 role selection cards for Village/Sanstha and CSR Donor', () => {
    render(<RegisterPage />);

    // Check heading
    expect(screen.getByText('Create CSR Connect Account')).toBeInTheDocument();

    // Check 2 cards
    expect(screen.getByText('Village / NGO / Sanstha')).toBeInTheDocument();
    expect(screen.getByText('CSR Donor / CSR Company')).toBeInTheDocument();

    // Check descriptions
    expect(
      screen.getByText('Register your village, panchayat, NGO, or community sanstha to post development projects.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Register your company to discover and fund verified CSR projects.')
    ).toBeInTheDocument();

    // Verify retail donor option is NOT present
    expect(screen.queryByText('Individual Donor')).not.toBeInTheDocument();
    expect(screen.queryByText('Donate Money Directly')).not.toBeInTheDocument();
  });

  it('switches between Village/NGO form fields and CSR Company fields upon card selection', () => {
    render(<RegisterPage />);

    // By default, NGO is selected
    expect(screen.getByPlaceholderText('e.g. Gramin Vikas Trust')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. MH/2021/0123456')).toBeInTheDocument();

    // Switch to CSR Donor card
    const companyCard = screen.getByText('CSR Donor / CSR Company').closest('button');
    fireEvent.click(companyCard);

    // Company fields must now be visible
    expect(screen.getByPlaceholderText('e.g. Tata Power Ltd')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. L28920MH1919PLC000567')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. Gramin Vikas Trust')).not.toBeInTheDocument();
  });
});
