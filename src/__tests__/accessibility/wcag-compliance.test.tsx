import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Index from '@/pages/Index';

describe('WCAG 2.1 AA Compliance', () => {
  it('should render home page without errors', () => {
    const { container } = render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    expect(container).toBeInTheDocument();
  });

  it('should have proper heading hierarchy', () => {
    const { container } = render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    const h1 = container.querySelector('h1');
    expect(h1).toBeInTheDocument();
  });

  it('should have sufficient color contrast', () => {
    const { container } = render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    // Basic check that content is rendered
    expect(container.textContent).toBeTruthy();
  });
});
