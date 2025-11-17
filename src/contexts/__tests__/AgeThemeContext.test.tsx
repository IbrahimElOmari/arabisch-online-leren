import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { AgeThemeProvider, useAgeTheme } from '../AgeThemeContext';
import * as AuthModule from '@/components/auth/AuthProviderQuery';

vi.mock('@/components/auth/AuthProviderQuery', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

const TestComponent = () => {
  const { themeAge, isLoading } = useAgeTheme();
  if (isLoading) return <div>Loading...</div>;
  return <div data-testid="theme">{themeAge}</div>;
};

describe('AgeThemeContext - PR11', () => {
  beforeEach(() => {
    document.body.className = '';
    vi.clearAllMocks();
  });

  it('applies playful theme for users under 16', async () => {
    vi.mocked(AuthModule.useAuth).mockReturnValue({
      profile: { id: '1', age: 12, role: 'leerling', theme_preference: 'auto' },
    } as any);

    const { container } = render(
      <AgeThemeProvider><TestComponent /></AgeThemeProvider>
    );

    await vi.waitFor(() => {
      expect(container.querySelector('[data-testid="theme"]')?.textContent).toBe('playful');
      expect(document.body.classList.contains('theme-playful')).toBe(true);
    });
  });

  it('applies professional theme for users 16+', async () => {
    vi.mocked(AuthModule.useAuth).mockReturnValue({
      profile: { id: '2', age: 17, role: 'leerling', theme_preference: 'auto' },
    } as any);

    const { container } = render(
      <AgeThemeProvider><TestComponent /></AgeThemeProvider>
    );

    await vi.waitFor(() => {
      expect(container.querySelector('[data-testid="theme"]')?.textContent).toBe('professional');
    });
  });

  it('applies professional theme for teachers regardless of age', async () => {
    vi.mocked(AuthModule.useAuth).mockReturnValue({
      profile: { id: '3', age: 15, role: 'leerkracht', theme_preference: 'auto' },
    } as any);

    const { container } = render(
      <AgeThemeProvider><TestComponent /></AgeThemeProvider>
    );

    await vi.waitFor(() => {
      expect(container.querySelector('[data-testid="theme"]')?.textContent).toBe('professional');
    });
  });

  it('respects manual theme preference', async () => {
    vi.mocked(AuthModule.useAuth).mockReturnValue({
      profile: { id: '4', age: 20, role: 'leerling', theme_preference: 'playful' },
    } as any);

    const { container } = render(
      <AgeThemeProvider><TestComponent /></AgeThemeProvider>
    );

    await vi.waitFor(() => {
      expect(container.querySelector('[data-testid="theme"]')?.textContent).toBe('playful');
    });
  });

  it('maps legacy clean preference to professional', async () => {
    vi.mocked(AuthModule.useAuth).mockReturnValue({
      profile: { id: '5', age: 18, role: 'leerling', theme_preference: 'clean' },
    } as any);

    const { container } = render(
      <AgeThemeProvider><TestComponent /></AgeThemeProvider>
    );

    await vi.waitFor(() => {
      expect(container.querySelector('[data-testid="theme"]')?.textContent).toBe('professional');
    });
  });
});
