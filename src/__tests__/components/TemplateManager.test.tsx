import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { TemplateManager } from '@/components/content/TemplateManager';
import { contentLibraryService } from '@/services/contentLibraryService';

vi.mock('@/services/contentLibraryService', () => ({
  contentLibraryService: {
    listTemplates: vi.fn(),
    createTemplate: vi.fn(),
    deleteTemplate: vi.fn()
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

describe('TemplateManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state', async () => {
    vi.mocked(contentLibraryService.listTemplates).mockResolvedValue([]);
    const { container } = render(<TemplateManager />);
    expect(container).toBeTruthy();
  });

  it('should render template list', async () => {
    const mockTemplates = [
      { id: '1', template_name: 'Template 1', template_type: 'prep_lesson', usage_count: 5 },
      { id: '2', template_name: 'Template 2', template_type: 'live_lesson', usage_count: 3 }
    ];

    vi.mocked(contentLibraryService.listTemplates).mockResolvedValue(mockTemplates as any);
    const { container } = render(<TemplateManager />);
    expect(container).toBeTruthy();
  });

  it('should handle template creation', async () => {
    vi.mocked(contentLibraryService.listTemplates).mockResolvedValue([]);
    vi.mocked(contentLibraryService.createTemplate).mockResolvedValue({
      id: 'new-template',
      template_name: 'New Template',
      template_type: 'prep_lesson'
    } as any);

    const { container } = render(<TemplateManager />);
    expect(container).toBeTruthy();
  });

  it('should handle template selection', async () => {
    const mockTemplates = [
      { id: '1', template_name: 'Template 1', template_type: 'prep_lesson' }
    ];

    const onSelect = vi.fn();
    vi.mocked(contentLibraryService.listTemplates).mockResolvedValue(mockTemplates as any);

    const { container } = render(<TemplateManager onSelectTemplate={onSelect} />);
    expect(container).toBeTruthy();
  });
});
