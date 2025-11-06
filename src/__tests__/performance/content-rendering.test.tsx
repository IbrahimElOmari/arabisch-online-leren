import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ContentEditor } from '@/components/content/ContentEditor';

vi.mock('@/integrations/supabase/client');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key })
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

describe('Content Rendering Performance', () => {
  it('should render ContentEditor within performance budget', () => {
    const startTime = performance.now();
    const component = <ContentEditor />;
    render(component);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    expect(renderTime).toBeLessThan(100);
  });

  it('should handle large content data efficiently', () => {
    const largeContent = {
      title: 'Large Content',
      content_data: {
        blocks: Array(100).fill({
          type: 'paragraph',
          data: { text: 'Sample text content' }
        })
      }
    };

    const startTime = performance.now();
    const component = <ContentEditor initialContent={largeContent as any} />;
    render(component);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    expect(renderTime).toBeLessThan(200);
  });
});
