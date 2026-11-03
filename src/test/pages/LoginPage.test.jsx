import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../../pages/public/LoginPage';
import * as api from '../../services/api';

describe('LoginPage Tests — Unified Secure Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders a unified login form with work email, password, and registration guidance without role selector tabs', () => {
    render(<LoginPage />);

    // Verify unified header & input fields
    expect(screen.getByText('Sign In to CSR Connect')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@organization.org or csr@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeInTheDocument();

    // Verify Forgot Password and registration guidance links
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Register as NGO \/ Sanstha/i })).toHaveAttribute('href', '/ngo/registration');
    expect(screen.getByRole('link', { name: /Register as Corporate CSR Partner/i })).toHaveAttribute('href', '/register');

    // Verify no role tab buttons or public admin register buttons
    expect(screen.queryByRole('button', { name: /Village \/ Sanstha/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /CSR Donor/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Staff Admin/i })).not.toBeInTheDocument();
  });

  it('validates email format and password length before submission', async () => {
    render(<LoginPage />);

    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Email address is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();

    // Fill invalid email and short password
    fireEvent.change(screen.getByPlaceholderText('name@organization.org or csr@company.com'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'short' },
    });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument();
  });

  it('handles successful login and authenticates user via backend role response', async () => {
    const mockLoginResponse = {
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
      user: {
        id: 'user-1',
        email: 'ngo@sanstha.org',
        full_name: 'Gramin Sanstha Lead',
        role: 'NGO',
      },
    };
    const loginSpy = vi.spyOn(api, 'loginUser').mockResolvedValue(mockLoginResponse);

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('name@organization.org or csr@company.com'), {
      target: { value: 'ngo@sanstha.org' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith('ngo@sanstha.org', 'password123');
      expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
      expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockLoginResponse.user);
    });
  });

  it('displays retirement message when logging in with retired individual DONOR account', async () => {
    vi.spyOn(api, 'loginUser').mockResolvedValue({
      access: 'token',
      refresh: 'refresh',
      user: { id: 'd-1', email: 'donor@gmail.com', role: 'DONOR' },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('name@organization.org or csr@company.com'), {
      target: { value: 'donor@gmail.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    expect(
      await screen.findByText(/Individual donor accounts have been retired/i)
    ).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
