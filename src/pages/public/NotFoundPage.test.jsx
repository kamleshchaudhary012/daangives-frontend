import React from 'react';
import { render } from '../../test/utils';
import { describe, it, expect } from 'vitest';
import NotFoundPage from './NotFoundPage';

describe('NotFoundPage', () => {
  it('renders without crashing', () => {
    render(<NotFoundPage />);
    expect(document.body).toBeInTheDocument();
  });
});
