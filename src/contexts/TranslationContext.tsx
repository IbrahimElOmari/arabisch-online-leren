import React, { createContext, useContext } from 'react';
import { useRTL } from './RTLContext';

interface TranslationContextType {
  t: (key: string, fallback?: string) => string;
  language: 'nl' | 'ar';
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

// Translation mappings
const translations = {
  nl: {
    // Navigation
    'nav.home': 'Home',
    'nav.calendar': 'Kalender',
    'nav.vision': 'Visie',
    'nav.dashboard': 'Dashboard',
    'nav.forum': 'Forum',
    'nav.forum_moderation': 'Forum Moderatie',
    'nav.security': 'Beveiliging',
    'nav.navigation': 'Navigatie',
    'nav.platform': 'Leerplatform',
    'nav.management': 'Beheer',
    'nav.login': 'Inloggen',
    'nav.register': 'Registreren',
    'nav.search': 'Zoeken...',
    'nav.search_placeholder': 'Zoek naar pagina\'s, functies...',
    
    // Welcome
    'welcome.title': 'Welkom terug',
    'welcome.greeting': 'Welkom terug',
    
    // Quick Actions
    'actions.quick_actions': 'Snelle Acties',
    'actions.continue_learning': 'Verder Leren',
    'actions.continue_learning_desc': 'Ga verder waar je gebleven was',
    'actions.watch_video': 'Video Bekijken',
    'actions.watch_video_desc': 'Bekijk de laatste les',
    'actions.forum': 'Forum',
    'actions.forum_desc': 'Stel een vraag',
    'actions.schedule': 'Planning',
    'actions.schedule_desc': 'Bekijk je planning',
    'actions.assignments': 'Opdrachten',
    'actions.assignments_desc': 'Bekijk openstaande taken',
    'actions.library': 'Bibliotheek',
    'actions.library_desc': 'Bekijk alle materialen',
    
    // Badges
    'badges.level': 'Niveau',
    'badges.earned': 'Behaalde Badges',
    'badges.available': 'Beschikbare Badges',
    'badges.xp_to_next': 'XP tot niveau',
    
    // Forms
    'form.title': 'Titel',
    'form.description': 'Beschrijving',
    'form.save': 'Opslaan',
    'form.cancel': 'Annuleren',
    'form.close': 'Sluiten',
    'form.loading': 'Bezig...',
    
    // Common
    'common.pages': 'Pagina\'s',
    'common.no_results': 'Geen resultaten gevonden.',
    'common.success': 'Succes!',
    'common.error': 'Fout',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.calendar': 'التقويم',
    'nav.vision': 'الرؤية',
    'nav.dashboard': 'لوحة التحكم',
    'nav.forum': 'المنتدى',
    'nav.forum_moderation': 'إدارة المنتدى',
    'nav.security': 'الأمان',
    'nav.navigation': 'التنقل',
    'nav.platform': 'منصة التعلم',
    'nav.management': 'الإدارة',
    'nav.login': 'تسجيل الدخول',
    'nav.register': 'التسجيل',
    'nav.search': 'البحث...',
    'nav.search_placeholder': 'ابحث عن الصفحات والوظائف...',
    
    // Welcome
    'welcome.title': 'أهلاً وسهلاً بعودتك',
    'welcome.greeting': 'أهلاً وسهلاً بعودتك',
    
    // Quick Actions
    'actions.quick_actions': 'الإجراءات السريعة',
    'actions.continue_learning': 'متابعة التعلم',
    'actions.continue_learning_desc': 'تابع من حيث توقفت',
    'actions.watch_video': 'مشاهدة الفيديو',
    'actions.watch_video_desc': 'شاهد آخر درس',
    'actions.forum': 'المنتدى',
    'actions.forum_desc': 'اطرح سؤالاً',
    'actions.schedule': 'الجدولة',
    'actions.schedule_desc': 'اعرض جدولك',
    'actions.assignments': 'المهام',
    'actions.assignments_desc': 'اعرض المهام المعلقة',
    'actions.library': 'المكتبة',
    'actions.library_desc': 'اعرض جميع المواد',
    
    // Badges
    'badges.level': 'المستوى',
    'badges.earned': 'الشارات المكتسبة',
    'badges.available': 'الشارات المتاحة',
    'badges.xp_to_next': 'نقاط الخبرة للمستوى التالي',
    
    // Forms
    'form.title': 'العنوان',
    'form.description': 'الوصف',
    'form.save': 'حفظ',
    'form.cancel': 'إلغاء',
    'form.close': 'إغلاق',
    'form.loading': 'جارٍ التحميل...',
    
    // Common
    'common.pages': 'الصفحات',
    'common.no_results': 'لم يتم العثور على نتائج.',
    'common.success': 'نجح!',
    'common.error': 'خطأ',
  }
};

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const { isRTL } = useRTL();
  const language = isRTL ? 'ar' : 'nl';
  
  const t = (key: string, fallback?: string): string => {
    const translation = translations[language]?.[key as keyof typeof translations.nl];
    return translation || fallback || key;
  };

  return (
    <TranslationContext.Provider value={{ t, language }}>
      {children}
    </TranslationContext.Provider>
  );
};