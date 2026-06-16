import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('Mobile App', () => {
  it('renders dummy component', async () => {
    const { getByText } = await render(<Text>Hello Mobile</Text>);
    expect(getByText('Hello Mobile')).toBeTruthy();
  });
});
