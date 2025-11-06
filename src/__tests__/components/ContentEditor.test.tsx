import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    render(<ContentEditor />);
    
    expect(screen.getByText(/Create New Content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
  });

  it('should render editor with initial content', () => {
    const initialContent = {
      title: 'Test Content',
      content_type: 'prep_lesson',
      status: 'draft'
    };

    render(<ContentEditor initialContent={initialContent} />);
    
    expect(screen.getByDisplayValue('Test Content')).toBeInTheDocument();
  });

  it('should handle save draft action', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { content: { id: 'new-id' } },
      error: null
    });

    render(<ContentEditor />);
    
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'New Content' } });
    
    const saveDraftButton = screen.getByText(/Save Draft/i);
    fireEvent.click(saveDraftButton);

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('content-save', {
        body: expect.objectContaining({
          title: 'New Content',
          status: 'draft'
        })
      });
    });
  });

  it('should handle publish action', async () => {
    const contentId = 'content-123';
    
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { content: { id: contentId, status: 'published' } },
      error: null
    });

    render(<ContentEditor contentId={contentId} />);
    
    const publishButton = screen.getByText(/Publish/i);
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('content-publish', {
        body: { content_id: contentId }
      });
    });
  });

  it('should show validation error for empty title', async () => {
    const { container } = render(<ContentEditor />);
    
    const saveDraftButton = screen.getByText(/Save Draft/i);
    fireEvent.click(saveDraftButton);

    // Should not call API without title
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });
});
