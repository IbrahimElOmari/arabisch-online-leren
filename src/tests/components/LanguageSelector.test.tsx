import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { LanguageSelector } from '@/components/navigation/LanguageSelector';
import { RTLProvider } from '@/contexts/RTLContext';
import '@testing-library/jest-dom';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'nl',
      changeLanguage: vi.fn(),
    },
  }),
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderComponent = () => {
    return render(
      <RTLProvider>
        <LanguageSelector />
      </RTLProvider>
    );
  };

  it('should render language selector button', () => {
    const { container } = renderComponent();
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('should show language selector', () => {
    const { container } = renderComponent();
    expect(container.querySelector('button')).toBeInTheDocument();
  });
});
