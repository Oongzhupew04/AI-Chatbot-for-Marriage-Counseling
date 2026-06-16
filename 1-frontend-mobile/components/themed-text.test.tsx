import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { ThemedText } from './themed-text';

// Mock the hook so we don't depend on the theme context
jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: jest.fn().mockReturnValue('#000000')
}));

describe('ThemedText Component', () => {
  it('renders correctly with default type', async () => {
    const { getByText } = await render(<ThemedText>Test Default Text</ThemedText>);
    const textElement = getByText('Test Default Text');
    
    expect(textElement).toBeTruthy();
    // Assuming default style has fontSize 16 based on the component code
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#000000' }),
        expect.objectContaining({ fontSize: 16 })
      ])
    );
  });

  it('applies title style correctly', async () => {
    const { getByText } = await render(<ThemedText type="title">Test Title Text</ThemedText>);
    const textElement = getByText('Test Title Text');
    
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontSize: 32, fontWeight: 'bold' })
      ])
    );
  });
});
