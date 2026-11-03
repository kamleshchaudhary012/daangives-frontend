import React from 'react';
import { render } from '../../test/utils';
import { describe, it, expect } from 'vitest';
import PrivacyPage from './PrivacyPage';

describe('PrivacyPage', () => {
  it('renders without crashing', () => {
    render(<PrivacyPage />);
    expect(document.body).toBeInTheDocument();
  });
});
