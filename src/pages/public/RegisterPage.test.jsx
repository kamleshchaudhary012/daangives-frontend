import React from 'react';
import { render } from '../../test/utils';
import { describe, it, expect } from 'vitest';
import RegisterPage from './RegisterPage';

describe('RegisterPage', () => {
  it('renders without crashing', () => {
    render(<RegisterPage />);
    expect(document.body).toBeInTheDocument();
  });
});
