import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { EnhancedNavigationHeader } from '@/components/navigation/EnhancedNavigationHeader';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('@/components/auth/AuthProviderQuery', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    profile: { full_name: 'Test User' },
    signOut: vi.fn(),
  }),
}));

vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({
    isAdmin: false,
    isTeacher: false,
    role: 'leerling',
  }),
}));

vi.mock('@/hooks/useRTLLayout', () => ({
  useRTLLayout: () => ({
    isRTL: false,
    getFlexDirection: () => 'flex',
  }),
}));

vi.mock('@/contexts/TranslationContext', () => ({
  useTranslation: () => ({
    t: (_fallback: string, fallback: string) => fallback,
    language: 'nl',
    setLanguage: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'nl',
      changeLanguage: vi.fn(),
    },
  }),
}));

vi.mock('@/contexts/RTLContext', () => ({
  useRTL: () => ({
    isRTL: false,
    setRTL: vi.fn(),
  }),
}));

describe('EnhancedNavigationHeader', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <EnhancedNavigationHeader />
      </BrowserRouter>
    );
  };

  it('should render navigation header', () => {
    const { container } = renderComponent();
    expect(container.querySelector('header')).toBeInTheDocument();
  });

  it('should display brand name', () => {
    const { container } = renderComponent();
    expect(container.textContent).toContain('Arabisch Leren');
  });

  it('should render search input', () => {
    const { container } = renderComponent();
    const searchInput = container.querySelector('input[placeholder*="Zoeken"]');
    expect(searchInput).toBeInTheDocument();
  });

  it('should render action buttons', () => {
    const { container } = renderComponent();
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
