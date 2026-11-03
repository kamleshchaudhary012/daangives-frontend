import React from 'react';
import { render } from '../../test/utils';
import { describe, it, expect } from 'vitest';
import CsrLandingPage from './CsrLandingPage';

describe('CsrLandingPage', () => {
  it('renders without crashing', () => {
    render(<CsrLandingPage />);
    expect(document.body).toBeInTheDocument();
  });
});
