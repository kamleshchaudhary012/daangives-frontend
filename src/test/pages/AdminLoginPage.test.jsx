import React from 'react';
import { render, screen } from '../utils';
import { describe, it, expect } from 'vitest';
import AdminLoginPage from '../../pages/admin/AdminLoginPage';

describe('AdminLoginPage Smoke Tests (Phase 7.1 Hidden Route)', () => {
  it('renders the hidden Admin Login portal with proper administrator branding and inputs', () => {
    render(<AdminLoginPage />);

    // Verify admin title and subtitle
    expect(screen.getByText('CSR Connect Admin Portal')).toBeInTheDocument();
    expect(screen.getByText('Authorized administrative access & platform moderation')).toBeInTheDocument();

    // Verify form fields
    expect(screen.getByPlaceholderText('admin@daangives.org')).toBeInTheDocument();

    // Verify submit button
    expect(screen.getByRole('button', { name: /Sign in to Admin Suite/i })).toBeInTheDocument();
  });
});
