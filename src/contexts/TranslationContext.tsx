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
    
    // Welcome & Dashboard
    'welcome.title': 'Welkom terug',
    'welcome.greeting': 'Welkom terug',
    'dashboard.overview': 'Overzicht',
    'dashboard.progress': 'Voortgang',
    'dashboard.recent_activity': 'Recente Activiteit',
    'dashboard.statistics': 'Statistieken',
    
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
    
    // Learning & Progress
    'learning.lessons': 'Lessen',
    'learning.completed': 'Voltooid',
    'learning.in_progress': 'Bezig',
    'learning.not_started': 'Niet Begonnen',
    'learning.level': 'Niveau',
    'learning.points': 'Punten',
    'learning.streak': 'Reeks',
    'learning.achievements': 'Prestaties',
    
    // Tasks & Submissions
    'tasks.title': 'Taken',
    'tasks.new_task': 'Nieuwe Taak',
    'tasks.submit': 'Indienen',
    'tasks.submitted': 'Ingediend',
    'tasks.graded': 'Beoordeeld',
    'tasks.feedback': 'Feedback',
    'tasks.grade': 'Cijfer',
    'tasks.due_date': 'Vervaldatum',
    'tasks.no_tasks': 'Geen taken beschikbaar',
    
    // Forum & Communication
    'forum.new_post': 'Nieuw Bericht',
    'forum.reply': 'Antwoorden',
    'forum.edit': 'Bewerken',
    'forum.delete': 'Verwijderen',
    'forum.latest_posts': 'Laatste Berichten',
    'forum.popular_topics': 'Populaire Onderwerpen',
    
    // User & Profile
    'user.profile': 'Profiel',
    'user.settings': 'Instellingen',
    'user.logout': 'Uitloggen',
    'user.change_password': 'Wachtwoord Wijzigen',
    'user.full_name': 'Volledige Naam',
    'user.email': 'E-mail',
    'user.role': 'Rol',
    'user.last_login': 'Laatste Login',
    
    // Authentication
    'auth.login': 'Inloggen',
    'auth.register': 'Registreren',
    'auth.password': 'Wachtwoord',
    'auth.confirm_password': 'Bevestig Wachtwoord',
    'auth.forgot_password': 'Wachtwoord Vergeten?',
    'auth.reset_password': 'Wachtwoord Resetten',
    'auth.invalid_credentials': 'Ongeldige inloggegevens',
    'auth.account_created': 'Account succesvol aangemaakt',
    
    // Errors & Validation
    'error.required_field': 'Dit veld is verplicht',
    'error.invalid_email': 'Ongeldig e-mailadres',
    'error.password_mismatch': 'Wachtwoorden komen niet overeen',
    'error.min_length': 'Minimaal {count} karakters vereist',
    'error.network_error': 'Netwerkfout. Probeer opnieuw.',
    'error.server_error': 'Serverfout. Neem contact op met ondersteuning.',
    'error.unauthorized': 'Geen toegang tot deze bron',
    'error.not_found': 'Pagina niet gevonden',
    
    // Status & Actions
    'status.loading': 'Laden...',
    'status.saving': 'Opslaan...',
    'status.saved': 'Opgeslagen',
    'status.online': 'Online',
    'status.offline': 'Offline',
    'status.pending': 'In Behandeling',
    'status.approved': 'Goedgekeurd',
    'status.rejected': 'Afgewezen',
    
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
    'form.submit': 'Verzenden',
    'form.edit': 'Bewerken',
    'form.delete': 'Verwijderen',
    'form.confirm': 'Bevestigen',
    
    // Time & Dates
    'time.today': 'Vandaag',
    'time.yesterday': 'Gisteren',
    'time.tomorrow': 'Morgen',
    'time.this_week': 'Deze Week',
    'time.last_week': 'Vorige Week',
    'time.this_month': 'Deze Maand',
    'time.minutes_ago': '{count} minuten geleden',
    'time.hours_ago': '{count} uur geleden',
    'time.days_ago': '{count} dagen geleden',
    
    // Common
    'common.pages': 'Pagina\'s',
    'common.no_results': 'Geen resultaten gevonden.',
    'common.success': 'Succes!',
    'common.error': 'Fout',
    'common.warning': 'Waarschuwing',
    'common.info': 'Informatie',
    'common.confirm_action': 'Weet je het zeker?',
    'common.yes': 'Ja',
    'common.no': 'Nee',
    'common.maybe': 'Misschien',
    'common.all': 'Alles',
    'common.none': 'Geen',
    'common.other': 'Overig',
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
    
    // Welcome & Dashboard
    'welcome.title': 'أهلاً وسهلاً بعودتك',
    'welcome.greeting': 'أهلاً وسهلاً بعودتك',
    'dashboard.overview': 'نظرة عامة',
    'dashboard.progress': 'التقدم',
    'dashboard.recent_activity': 'النشاط الأخير',
    'dashboard.statistics': 'الإحصائيات',
    
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
    
    // Learning & Progress
    'learning.lessons': 'الدروس',
    'learning.completed': 'مكتمل',
    'learning.in_progress': 'قيد التقدم',
    'learning.not_started': 'لم يبدأ',
    'learning.level': 'المستوى',
    'learning.points': 'النقاط',
    'learning.streak': 'السلسلة',
    'learning.achievements': 'الإنجازات',
    
    // Tasks & Submissions
    'tasks.title': 'المهام',
    'tasks.new_task': 'مهمة جديدة',
    'tasks.submit': 'إرسال',
    'tasks.submitted': 'تم الإرسال',
    'tasks.graded': 'تم التقييم',
    'tasks.feedback': 'التعليقات',
    'tasks.grade': 'الدرجة',
    'tasks.due_date': 'تاريخ الاستحقاق',
    'tasks.no_tasks': 'لا توجد مهام متاحة',
    
    // Forum & Communication
    'forum.new_post': 'منشور جديد',
    'forum.reply': 'رد',
    'forum.edit': 'تعديل',
    'forum.delete': 'حذف',
    'forum.latest_posts': 'أحدث المنشورات',
    'forum.popular_topics': 'المواضيع الشائعة',
    
    // User & Profile
    'user.profile': 'الملف الشخصي',
    'user.settings': 'الإعدادات',
    'user.logout': 'تسجيل الخروج',
    'user.change_password': 'تغيير كلمة المرور',
    'user.full_name': 'الاسم الكامل',
    'user.email': 'البريد الإلكتروني',
    'user.role': 'الدور',
    'user.last_login': 'آخر تسجيل دخول',
    
    // Authentication
    'auth.login': 'تسجيل الدخول',
    'auth.register': 'التسجيل',
    'auth.password': 'كلمة المرور',
    'auth.confirm_password': 'تأكيد كلمة المرور',
    'auth.forgot_password': 'نسيت كلمة المرور؟',
    'auth.reset_password': 'إعادة تعيين كلمة المرور',
    'auth.invalid_credentials': 'بيانات اعتماد غير صحيحة',
    'auth.account_created': 'تم إنشاء الحساب بنجاح',
    
    // Errors & Validation
    'error.required_field': 'هذا الحقل مطلوب',
    'error.invalid_email': 'عنوان بريد إلكتروني غير صحيح',
    'error.password_mismatch': 'كلمات المرور غير متطابقة',
    'error.min_length': 'مطلوب حد أدنى {count} أحرف',
    'error.network_error': 'خطأ في الشبكة. حاول مرة أخرى.',
    'error.server_error': 'خطأ في الخادم. اتصل بالدعم الفني.',
    'error.unauthorized': 'لا يوجد إذن للوصول إلى هذا المورد',
    'error.not_found': 'الصفحة غير موجودة',
    
    // Status & Actions
    'status.loading': 'جارٍ التحميل...',
    'status.saving': 'جارٍ الحفظ...',
    'status.saved': 'تم الحفظ',
    'status.online': 'متصل',
    'status.offline': 'غير متصل',
    'status.pending': 'قيد الانتظار',
    'status.approved': 'تمت الموافقة',
    'status.rejected': 'مرفوض',
    
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
    'form.submit': 'إرسال',
    'form.edit': 'تعديل',
    'form.delete': 'حذف',
    'form.confirm': 'تأكيد',
    
    // Time & Dates
    'time.today': 'اليوم',
    'time.yesterday': 'أمس',
    'time.tomorrow': 'غداً',
    'time.this_week': 'هذا الأسبوع',
    'time.last_week': 'الأسبوع الماضي',
    'time.this_month': 'هذا الشهر',
    'time.minutes_ago': 'منذ {count} دقائق',
    'time.hours_ago': 'منذ {count} ساعات',
    'time.days_ago': 'منذ {count} أيام',
    
    // Common
    'common.pages': 'الصفحات',
    'common.no_results': 'لم يتم العثور على نتائج.',
    'common.success': 'نجح!',
    'common.error': 'خطأ',
    'common.warning': 'تحذير',
    'common.info': 'معلومات',
    'common.confirm_action': 'هل أنت متأكد؟',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.maybe': 'ربما',
    'common.all': 'الكل',
    'common.none': 'لا شيء',
    'common.other': 'أخرى',
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