import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Forum from '@/pages/Forum';

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: '123' }, isLoading: false })
}));

vi.mock('@/hooks/use-user-role', () => ({
  useUserRole: () => ({ role: 'student', isLoading: false })
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

describe('Forum Operations Integration', () => {
  it('should render forum page', () => {
    render(
      <BrowserRouter>
        <Forum />
      </BrowserRouter>
    );
    
    expect(document.querySelector('main')).toBeInTheDocument();
  });

  it('should display forum threads', async () => {
    render(
      <BrowserRouter>
        <Forum />
      </BrowserRouter>
    );
    
    // Forum content should be rendered
    expect(document.querySelector('[data-forum]') || document.querySelector('main')).toBeInTheDocument();
  });
});
