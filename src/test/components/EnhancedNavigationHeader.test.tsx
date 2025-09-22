import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EnhancedNavigationHeader } from '@/components/navigation/EnhancedNavigationHeader';

// Mock modules
vi.mock('@/components/auth/AuthProviderQuery', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    profile: { full_name: 'Test User', role: 'leerling' },
    signOut: vi.fn()
  })
}));

vi.mock('@/hooks/useRTLLayout', () => ({
  useRTLLayout: () => ({
    isRTL: false,
    getFlexDirection: () => 'row'
  })
}));

vi.mock('@/contexts/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback
  })
}));

vi.mock('@/components/search/GlobalSearch', () => ({
  GlobalSearch: ({ isOpen, onOpenChange, onNavigate }: any) => (
    <div data-testid="global-search" data-open={isOpen}>
      <button onClick={() => onOpenChange?.(false)}>Close</button>
      <button onClick={() => onNavigate?.('/test')}>Navigate</button>
    </div>
  )
}));

vi.mock('@/components/notifications/NotificationBell', () => ({
  NotificationBell: ({ className }: any) => (
    <div data-testid="notification-bell" className={className}>
      Notification Bell
    </div>
  )
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('EnhancedNavigationHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all navigation elements', () => {
    renderWithProviders(<EnhancedNavigationHeader />);
    
    expect(screen.getByText('Arabisch Leren')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Zoeken/)).toBeInTheDocument();
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    expect(screen.getByTestId('global-search')).toBeInTheDocument();
  });

  it('opens search dialog on Cmd+K', async () => {
    renderWithProviders(<EnhancedNavigationHeader />);
    
    // Simulate Cmd+K keypress
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    
    await waitFor(() => {
      expect(screen.getByTestId('global-search')).toHaveAttribute('data-open', 'true');
    });
  });

  it('opens search dialog on Ctrl+K', async () => {
    renderWithProviders(<EnhancedNavigationHeader />);
    
    // Simulate Ctrl+K keypress
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    
    await waitFor(() => {
      expect(screen.getByTestId('global-search')).toHaveAttribute('data-open', 'true');
    });
  });

  it('opens search when clicking search input', () => {
    renderWithProviders(<EnhancedNavigationHeader />);
    
    const searchInput = screen.getByPlaceholderText(/Zoeken/);
    fireEvent.click(searchInput);
    
    expect(screen.getByTestId('global-search')).toHaveAttribute('data-open', 'true');
  });

  it('opens search when clicking mobile search button', () => {
    // Mock mobile view
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });
    
    renderWithProviders(<EnhancedNavigationHeader />);
    
    const mobileSearchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(mobileSearchButton);
    
    expect(screen.getByTestId('global-search')).toHaveAttribute('data-open', 'true');
  });

  it('shows user information in dropdown', async () => {
    renderWithProviders(<EnhancedNavigationHeader />);
    
    const userButton = screen.getByRole('button', { name: /user/i });
    fireEvent.click(userButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Leerling')).toBeInTheDocument();
      expect(screen.getByText('Profiel')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Uitloggen')).toBeInTheDocument();
    });
  });

  it('closes search when navigation occurs', () => {
    renderWithProviders(<EnhancedNavigationHeader />);
    
    // Open search
    const searchInput = screen.getByPlaceholderText(/Zoeken/);
    fireEvent.click(searchInput);
    
    expect(screen.getByTestId('global-search')).toHaveAttribute('data-open', 'true');
    
    // Trigger navigation
    const navigateButton = screen.getByText('Navigate');
    fireEvent.click(navigateButton);
    
    expect(screen.getByTestId('global-search')).toHaveAttribute('data-open', 'false');
  });

  it('shows keyboard shortcut in search placeholder', () => {
    renderWithProviders(<EnhancedNavigationHeader />);
    
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('integrates NotificationBell component', () => {
    renderWithProviders(<EnhancedNavigationHeader />);
    
    const notificationBell = screen.getByTestId('notification-bell');
    expect(notificationBell).toBeInTheDocument();
    expect(notificationBell).toHaveClass('relative');
  });
});