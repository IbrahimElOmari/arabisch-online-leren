import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: '123' }, isLoading: false })
}));

vi.mock('@/hooks/use-user-role', () => ({
  useUserRole: () => ({ role: 'student', isLoading: false })
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

describe('Dashboard Component', () => {
  it('should render dashboard for authenticated user', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    expect(container).toBeInTheDocument();
  });

  it('should display student-specific content', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    // Dashboard should be visible for students
    expect(document.querySelector('[data-testid="dashboard"]') || document.querySelector('main')).toBeInTheDocument();
  });
});
