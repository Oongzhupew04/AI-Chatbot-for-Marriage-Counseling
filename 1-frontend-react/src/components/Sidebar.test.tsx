import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

// Mock the CSS module
vi.mock('./Sidebar.module.css', () => ({
  default: {
    'sidebar-left': 'sidebar-left',
    'nav-item': 'nav-item',
    'active': 'active',
  }
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { success: false } }))
  }
}));

// Mock the Zustand store
vi.mock('../store/chatStore', () => ({
  useChatStore: Object.assign(
    () => ({}), 
    { getState: () => ({ clearSession: vi.fn() }) }
  )
}));

describe('Sidebar Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <Sidebar><div>Content</div></Sidebar>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Log Out')).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    render(
      <MemoryRouter>
        <Sidebar><div data-testid="child-content">Child Content</div></Sidebar>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
