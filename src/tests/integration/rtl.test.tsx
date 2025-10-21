import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { RTLProvider } from '@/contexts/RTLContext';
import '@testing-library/jest-dom';

describe('RTL Integration', () => {
  beforeEach(() => {
    // Reset document dir
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('lang');
    document.body.className = '';
  });

  it('should provide RTL context', () => {
    const { container } = render(
      <RTLProvider>
        <div>Test</div>
      </RTLProvider>
    );

    expect(container).toBeInTheDocument();
  });

  it('should render children', () => {
    const { getByText } = render(
      <RTLProvider>
        <div>Test Content</div>
      </RTLProvider>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('should set initial direction on mount', () => {
    render(
      <RTLProvider>
        <div>Test</div>
      </RTLProvider>
    );

    const dir = document.documentElement.getAttribute('dir');
    expect(dir === 'rtl' || dir === 'ltr').toBe(true);
  });

  it('should maintain consistent direction', () => {
    const { rerender } = render(
      <RTLProvider>
        <div>Test 1</div>
      </RTLProvider>
    );

    const initialDir = document.documentElement.getAttribute('dir');

    rerender(
      <RTLProvider>
        <div>Test 2</div>
      </RTLProvider>
    );

    const finalDir = document.documentElement.getAttribute('dir');
    expect(finalDir).toBe(initialDir);
  });

  it('should work with nested components', () => {
    const { getByText } = render(
      <RTLProvider>
        <div>
          <span>Nested</span>
          <span>Content</span>
        </div>
      </RTLProvider>
    );

    expect(getByText('Nested')).toBeInTheDocument();
    expect(getByText('Content')).toBeInTheDocument();
  });
});
