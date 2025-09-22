import React from 'react';
import { render } from '@testing-library/react';
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

  it('renders without crashing', () => {
    const { container } = renderWithProviders(<EnhancedNavigationHeader />);
    expect(container).toBeTruthy();
  });

  it('integrates GlobalSearch component', () => {
    const { getByTestId } = renderWithProviders(<EnhancedNavigationHeader />);
    expect(getByTestId('global-search')).toBeTruthy();
  });

  it('integrates NotificationBell component', () => {
    const { getByTestId } = renderWithProviders(<EnhancedNavigationHeader />);
    expect(getByTestId('notification-bell')).toBeTruthy();
  });
});