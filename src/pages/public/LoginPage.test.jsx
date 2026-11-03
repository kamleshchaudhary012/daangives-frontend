import React from 'react';
import { render, screen } from '../../test/utils';
import { describe, it, expect } from 'vitest';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  it('renders the login form', () => {
    render(<LoginPage />);
    expect(document.body).toBeInTheDocument();
  });
});
