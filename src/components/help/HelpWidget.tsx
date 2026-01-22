import { useState, useMemo } from 'react';
import { HelpCircle, Search, Book, MessageCircle, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/contexts/TranslationContext';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface HelpArticle {
  id: string;
  titleKey: string;
  category: string;
  link?: string;
}

const HELP_ARTICLES: HelpArticle[] = [
  { id: 'enroll', titleKey: 'howToEnroll', category: 'gettingStarted', link: '/support' },
  { id: 'password', titleKey: 'passwordReset', category: 'account', link: '/auth' },
  { id: 'submit', titleKey: 'submitTask', category: 'learning', link: '/dashboard' },
  { id: 'contact', titleKey: 'contactTeacher', category: 'learning', link: '/support' },
];

/**
 * HelpWidget - Floating help button with searchable help panel
 */
export function HelpWidget() {
  const { t } = useTranslation();
  const { isRTL } = useRTLLayout();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    { id: 'gettingStarted', icon: Book, labelKey: 'categories.gettingStarted' },
    { id: 'account', icon: Book, labelKey: 'categories.account' },
    { id: 'learning', icon: Book, labelKey: 'categories.learning' },
    { id: 'contact', icon: MessageCircle, labelKey: 'categories.contact' },
  ];

  // Filter articles based on search
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return HELP_ARTICLES.filter((article) => {
      const title = t(`help.articles.${article.titleKey}`).toLowerCase();
      return title.includes(query);
    });
  }, [searchQuery, t]);

  // Group articles by category
  const articlesByCategory = useMemo(() => {
    const grouped: Record<string, HelpArticle[]> = {};
    HELP_ARTICLES.forEach((article) => {
      if (!grouped[article.category]) {
        grouped[article.category] = [];
      }
      grouped[article.category].push(article);
    });
    return grouped;
  }, []);

  return (
    <>
      {/* Floating help button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="default"
            className={cn(
              'fixed z-50 rounded-full shadow-lg h-12 w-12',
              'bg-primary hover:bg-primary/90',
              'transition-all hover:scale-110',
              isRTL ? 'left-4 bottom-4' : 'right-4 bottom-4'
            )}
            aria-label={t('help.openHelp')}
          >
            <HelpCircle className="h-6 w-6" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side={isRTL ? 'left' : 'right'}
          className="w-full sm:w-[400px] p-0"
        >
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <HelpCircle className="h-5 w-5 text-primary" />
              <span className={isRTL ? 'arabic-text' : ''}>{t('help.title')}</span>
            </SheetTitle>
          </SheetHeader>

          <div className="p-4 border-b">
            <div className="relative">
              <Search className={cn(
                "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                isRTL ? "right-3" : "left-3"
              )} />
              <Input
                placeholder={t('help.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(isRTL ? "pr-10 text-right" : "pl-10")}
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4 space-y-6">
              {/* Search results */}
              {searchQuery.trim() && (
                <div className="space-y-2">
                  {filteredArticles.length > 0 ? (
                    filteredArticles.map((article) => (
                      <Link
                        key={article.id}
                        to={article.link || '/support'}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          "bg-muted/50 hover:bg-muted transition-colors",
                          isRTL && "flex-row-reverse"
                        )}
                      >
                        <span className={cn("text-sm", isRTL && "arabic-text")}>
                          {t(`help.articles.${article.titleKey}`)}
                        </span>
                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground", isRTL && "rotate-180")} />
                      </Link>
                    ))
                  ) : (
                    <p className={cn("text-center text-sm text-muted-foreground py-4", isRTL && "arabic-text")}>
                      {t('help.noResults')}
                    </p>
                  )}
                </div>
              )}

              {/* Categories */}
              {!searchQuery.trim() && (
                <>
                  <div className="space-y-2">
                    <h3 className={cn("text-sm font-medium text-muted-foreground", isRTL && "text-right arabic-text")}>
                      Categorieën
                    </h3>
                    <div className="grid gap-2">
                      {helpCategories.map((category) => {
                        const CategoryIcon = category.icon;
                        const categoryArticles = articlesByCategory[category.id] || [];
                        
                        return (
                          <div key={category.id} className="space-y-1">
                            <button
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg",
                                "bg-muted/50 hover:bg-muted transition-colors text-left",
                                isRTL && "flex-row-reverse text-right"
                              )}
                            >
                              <CategoryIcon className="h-4 w-4 text-primary" />
                              <span className={cn("font-medium", isRTL && "arabic-text")}>
                                {t(`help.${category.labelKey}`)}
                              </span>
                            </button>
                            
                            {categoryArticles.length > 0 && (
                              <div className={cn("ps-6 space-y-1", isRTL && "pe-6 ps-0")}>
                                {categoryArticles.map((article) => (
                                  <Link
                                    key={article.id}
                                    to={article.link || '/support'}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                      "flex items-center justify-between p-2 rounded text-sm",
                                      "hover:bg-muted/50 transition-colors",
                                      isRTL && "flex-row-reverse"
                                    )}
                                  >
                                    <span className={isRTL ? 'arabic-text' : ''}>
                                      {t(`help.articles.${article.titleKey}`)}
                                    </span>
                                    <ChevronRight className={cn("h-3 w-3 text-muted-foreground", isRTL && "rotate-180")} />
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick links */}
                  <div className="space-y-2 pt-4 border-t">
                    <h3 className={cn("text-sm font-medium text-muted-foreground", isRTL && "text-right arabic-text")}>
                      Snelle links
                    </h3>
                    <div className="grid gap-2">
                      <Link
                        to="/support"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg",
                          "border border-dashed hover:border-primary hover:bg-primary/5 transition-colors",
                          isRTL && "flex-row-reverse"
                        )}
                      >
                        <MessageCircle className="h-4 w-4 text-primary" />
                        <span className={cn("text-sm", isRTL && "arabic-text")}>
                          Contact Support
                        </span>
                        <ExternalLink className={cn("h-3 w-3 text-muted-foreground ms-auto", isRTL && "me-auto ms-0")} />
                      </Link>
                      
                      <Link
                        to="/support/kb"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg",
                          "border border-dashed hover:border-primary hover:bg-primary/5 transition-colors",
                          isRTL && "flex-row-reverse"
                        )}
                      >
                        <Book className="h-4 w-4 text-primary" />
                        <span className={cn("text-sm", isRTL && "arabic-text")}>
                          Knowledge Base
                        </span>
                        <ExternalLink className={cn("h-3 w-3 text-muted-foreground ms-auto", isRTL && "me-auto ms-0")} />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default HelpWidget;
