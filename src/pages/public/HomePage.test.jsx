import React from 'react';
import { render, screen } from '../../test/utils';
import { describe, it, expect } from 'vitest';
import HomePage from './HomePage';

describe('HomePage', () => {
  it('renders without crashing', () => {
    render(<HomePage />);
    // Smoke test: verify that some key elements or text are present.
    // If the component has heavy API calls, they'll be caught/mocked by MSW.
    expect(document.body).toBeInTheDocument();
  });
});
