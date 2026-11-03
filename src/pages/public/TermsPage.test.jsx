import React from 'react';
import { render } from '../../test/utils';
import { describe, it, expect } from 'vitest';
import TermsPage from './TermsPage';

describe('TermsPage', () => {
  it('renders without crashing', () => {
    render(<TermsPage />);
    expect(document.body).toBeInTheDocument();
  });
});
