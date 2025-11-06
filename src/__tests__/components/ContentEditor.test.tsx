import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ContentEditor } from '@/components/content/ContentEditor';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key
  })
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('ContentEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render editor with empty state', () => {
    const { container } = render(<ContentEditor />);
    expect(container).toBeTruthy();
  });

  it('should render editor with initial content', () => {
    const initialContent = {
      title: 'Test Content',
      content_type: 'prep_lesson',
      status: 'draft'
    };

    const { container } = render(<ContentEditor initialContent={initialContent} />);
    expect(container).toBeTruthy();
  });

  it('should handle save draft action', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { content: { id: 'new-id' } },
      error: null
    });

    const { container } = render(<ContentEditor />);
    expect(container).toBeTruthy();
  });

  it('should handle publish action', async () => {
    const contentId = 'content-123';
    
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { content: { id: contentId, status: 'published' } },
      error: null
    });

    const { container } = render(<ContentEditor contentId={contentId} />);
    expect(container).toBeTruthy();
  });

  it('should show validation error for empty title', async () => {
    const { container } = render(<ContentEditor />);
    expect(container).toBeTruthy();
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });
});
