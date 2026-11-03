import React from 'react';
import { render, screen, waitFor } from '../test/utils';
import { describe, it, expect, afterEach } from 'vitest';
import AppRoutes from './AppRoutes';
import { mockAuth, clearAuth } from '../test/auth';
import { mockAdminUser } from '../test/mocks/fixtures';
import { API_BASE_URL, getNgoDistributionProofs } from '../services/api';

describe('AppRoutes Route and Auth Access Controls', () => {
  afterEach(() => {
    clearAuth();
  });

  it('allows unauthenticated guests to access /ngo/registration without redirection', async () => {
    window.history.pushState({}, 'Test', '/ngo/registration');
    render(<AppRoutes />);

    await waitFor(() => {
      expect(screen.getByText('Partner With DaanGives')).toBeInTheDocument();
    });

    expect(screen.getByText('NGO Onboarding Guide')).toBeInTheDocument();
  });

  it('redirects unauthenticated users trying to access /admin/reports to /login', async () => {
    window.history.pushState({}, 'Test', '/admin/reports');
    render(<AppRoutes />);

    await waitFor(() => {
      expect(screen.getByText('Sign In to DaanGives')).toBeInTheDocument();
    });
  });

  it('consolidates /admin/reports by redirecting authenticated ADMIN to /admin/analytics', async () => {
    mockAuth(mockAdminUser, 'ADMIN');
    window.history.pushState({}, 'Test', '/admin/reports');
    render(<AppRoutes />);

    await waitFor(() => {
      expect(screen.getByText('Platform Analytics & Intelligence')).toBeInTheDocument();
    });
  });

  it('renders AdminDashboardPage within AdminLayout when authenticated ADMIN visits /admin/dashboard', async () => {
    mockAuth(mockAdminUser, 'ADMIN');
    window.history.pushState({}, 'Test', '/admin/dashboard');
    render(<AppRoutes />);

    await waitFor(() => {
      expect(screen.getByText('Platform Governance & Financial Oversight')).toBeInTheDocument();
    });
    expect(screen.getByText('State Administrator')).toBeInTheDocument();
  });

  it('renders AdminCsrOversightPage within AdminLayout when authenticated ADMIN visits /admin/csr/oversight', async () => {
    mockAuth(mockAdminUser, 'ADMIN');
    window.history.pushState({}, 'Test', '/admin/csr/oversight');
    render(<AppRoutes />);

    await waitFor(() => {
      expect(screen.getByText('National CSR Portfolio Oversight & Audit Ledger')).toBeInTheDocument();
    });
    expect(screen.getByText('State Administrator')).toBeInTheDocument();
  });

  it('redirects authenticated ADMIN accessing /admin to /admin/dashboard', async () => {
    mockAuth(mockAdminUser, 'ADMIN');
    window.history.pushState({}, 'Test', '/admin');
    render(<AppRoutes />);

    await waitFor(() => {
      expect(screen.getByText('Platform Governance & Financial Oversight')).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated users trying to access /admin/dashboard to /login', async () => {
    window.history.pushState({}, 'Test', '/admin/dashboard');
    render(<AppRoutes />);

    await waitFor(() => {
      expect(screen.getByText('Sign In to DaanGives')).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated users trying to access /admin/csr/oversight to /login', async () => {
    window.history.pushState({}, 'Test', '/admin/csr/oversight');
    render(<AppRoutes />);

    await waitFor(() => {
      expect(screen.getByText('Sign In to DaanGives')).toBeInTheDocument();
    });
  });

  it('redirects non-admin roles (DONOR) trying to access /admin/dashboard to /donor/dashboard', async () => {
    mockAuth({ id: 'donor-1', email: 'donor@demo.local', full_name: 'Donor User', role: 'DONOR' }, 'DONOR');
    window.history.pushState({}, 'Test', '/admin/dashboard');
    render(<AppRoutes />);

    await waitFor(() => {
      expect(screen.getByText('Donor Account')).toBeInTheDocument();
    });
  });

  it('verifies API_BASE_URL is parameterized and getNgoDistributionProofs helper exists', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe('string');
    expect(API_BASE_URL.endsWith('/api/v1')).toBe(true);
    expect(typeof getNgoDistributionProofs).toBe('function');
  });
});
