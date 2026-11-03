import React from 'react';
import { render } from '../../test/utils';
import { describe, it, expect } from 'vitest';
import ForgotPasswordPage from './ForgotPasswordPage';

describe('ForgotPasswordPage', () => {
  it('renders without crashing', () => {
    render(<ForgotPasswordPage />);
    expect(document.body).toBeInTheDocument();
  });
});
