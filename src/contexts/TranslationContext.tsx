import React, { createContext, useContext } from 'react';
import { useRTL } from './RTLContext';

interface TranslationContextType {
  t: (key: string, fallback?: string) => string;
  language: 'nl' | 'ar';
  setLanguage: (language: 'nl' | 'ar') => void;
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
    'nav.switch_to_dutch': 'Schakel naar Nederlands',
    'nav.switch_to_arabic': 'Schakel naar Arabisch',
    'nav.switching_language': 'Taal wordt gewisseld...',
    
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
    'status.switching_language': 'Taal wordt gewisseld...',
    'status.please_wait': 'Een moment geduld...',
    
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
    
    // Dashboard specific
    'dashboard.profile_loading': 'Welkom! Je profiel wordt geladen...',
    'dashboard.profile_loading_title': 'Profiel wordt geladen',
    'dashboard.profile_loading_desc': 'Je dashboard werkt met basis functionaliteit terwijl je profiel wordt geladen.',
    'dashboard.force_profile': 'Forceer profiel',
    'dashboard.full_loading_desc': 'Je dashboard wordt volledig geladen zodra je profiel beschikbaar is.',
    'dashboard.current_role': 'Momenteel werken we met rol',
    'dashboard.navigation_desc': 'Je kunt al wel naar andere pagina\'s navigeren via de sidebar.',
    
    // Errors specific
    'error.unknown_role': 'Onbekende gebruikersrol',
    
    // Task related
    'task.completed': 'Completed',
    'task.pending': 'Pending',
    'task.inProgress': 'In Progress',
    'task.overdue': 'Overdue',
    'task.noTasks': 'No tasks available',
    'task.loadingTasks': 'Loading tasks...',
    'task.errorLoadingTasks': 'Failed to load tasks',
    'task.createNew': 'Create New Task',
    'task.editTask': 'Edit Task',
    'task.deleteTask': 'Delete Task',
    'task.taskDetails': 'Task Details',
    'task.dueDate': 'Due Date',
    'task.priority': 'Priority',
    'task.status': 'Status',
    'task.assignedTo': 'Assigned To',

    // RTL Testing and Performance
    'rtl.testSuite': 'RTL Test Suite',
    'rtl.testing': 'Testing...',
    'rtl.runTests': 'Run RTL Tests',
    'rtl.performanceMonitor': 'Performance Monitor',
    'rtl.crossBrowser': 'Cross-Browser Testing',
    'rtl.accessibility': 'Accessibility Audit',
    'rtl.mobileTest': 'Mobile RTL Testing',

    // Common
    'common.retry': 'Retry',
    'common.pages': 'Pages',
    'common.no_results': 'No results found.',
    'common.success': 'Success!',
    'common.error': 'Error',
    'common.warning': 'Warning',
    'common.info': 'Information',
    'common.confirm_action': 'Are you sure?',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.maybe': 'Maybe',
    'common.all': 'All',
    'common.none': 'None',
    'common.other': 'Other',
    'common.progress': 'Progress',

    // Statistics
    'stats.progress': 'Voortgang',
    'stats.averageScore': 'Gemiddelde Score',
    'stats.studyTime': 'Studietijd',
    'stats.streak': 'Streak',
    'stats.completed': 'voltooid',
    'stats.thisWeek': 'Deze week',
    'stats.onStreak': '🔥 Op een rij!',
    'stats.students': 'Studenten',
    'stats.activeClasses': 'Actieve Klassen',
    'stats.lessonProgress': 'Les Voortgang',
    'stats.engagement': 'Betrokkenheid',
    'stats.active': 'Actief',
    'stats.thisSemester': 'Dit semester',
    'stats.average': 'Gemiddeld',

    // Forum additions
    'forum.noMessages': 'Nog geen berichten',
    'forum.beFirst': 'Wees de eerste om een bericht te plaatsen!',
    'forum.mustLogin': '(Je moet ingelogd zijn)',
    'forum.writePlaceholder': 'Schrijf je reactie...',
    'forum.loginPlaceholder': 'Log in om een reactie te plaatsen',
    'forum.posting': 'Bezig...',
    'forum.postReply': 'Reactie Plaatsen',
    'forum.writeReply': 'Schrijf je reactie...',
    'forum.cancel': 'Annuleren',
    'forum.send': 'Versturen',
    'forum.replyCount': 'reactie',
    'forum.repliesCount': 's',
    'forum.deleted': 'Dit bericht is verwijderd',
    'forum.confirmDelete': 'Weet je zeker dat je dit bericht wilt verwijderen?',
    'forum.reported': 'Gerapporteerd',
    'forum.reportSuccess': 'Dit bericht is gerapporteerd voor moderatie',
    'forum.newTopic': 'Nieuw Onderwerp',
    'forum.topicTitle': 'Titel van het onderwerp',
    'forum.topicDescription': 'Beschrijf je onderwerp...',
    'forum.postTopic': 'Onderwerp Plaatsen',

    // RTL Testing and Development  
    'rtl.test': 'RTL Test',
    'rtl.performance': 'RTL Performance',
    'rtl.dashboard': 'RTL Dashboard',
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
    'nav.switch_to_dutch': 'التبديل إلى الهولندية',
    'nav.switch_to_arabic': 'التبديل إلى العربية',  
    'nav.switching_language': 'جارٍ تغيير اللغة...',
    
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
    'status.switching_language': 'جارٍ تغيير اللغة...',
    'status.please_wait': 'يرجى الانتظار...',
    
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
    
    // Dashboard specific
    'dashboard.profile_loading': 'أهلاً وسهلاً! يتم تحميل ملفك الشخصي...',
    'dashboard.profile_loading_title': 'يتم تحميل الملف الشخصي',
    'dashboard.profile_loading_desc': 'لوحة التحكم تعمل بالوظائف الأساسية أثناء تحميل ملفك الشخصي.',
    'dashboard.force_profile': 'فرض تحميل الملف الشخصي',
    'dashboard.full_loading_desc': 'سيتم تحميل لوحة التحكم بالكامل بمجرد توفر ملفك الشخصي.',
    'dashboard.current_role': 'نعمل حالياً بالدور',
    'dashboard.navigation_desc': 'يمكنك التنقل إلى صفحات أخرى عبر الشريط الجانبي.',
    
    // Errors specific
    'error.unknown_role': 'دور مستخدم غير معروف',
    
    // Task related
    'task.completed': 'مكتمل',
    'task.pending': 'في الانتظار',
    'task.inProgress': 'قيد التنفيذ',
    'task.overdue': 'متأخر',
    'task.noTasks': 'لا توجد مهام متاحة',
    'task.loadingTasks': 'جاري تحميل المهام...',
    'task.errorLoadingTasks': 'فشل في تحميل المهام',
    'task.createNew': 'إنشاء مهمة جديدة',
    'task.editTask': 'تعديل المهمة',
    'task.deleteTask': 'حذف المهمة',
    'task.taskDetails': 'تفاصيل المهمة',
    'task.dueDate': 'تاريخ الاستحقاق',
    'task.priority': 'الأولوية',
    'task.status': 'الحالة',
    'task.assignedTo': 'مُعيَّن إلى',

    // RTL Testing and Performance
    'rtl.testSuite': 'مجموعة اختبارات RTL',
    'rtl.testing': 'جاري الاختبار...',
    'rtl.runTests': 'تشغيل اختبارات RTL',
    'rtl.performanceMonitor': 'مراقب الأداء',
    'rtl.crossBrowser': 'اختبار متعدد المتصفحات',
    'rtl.accessibility': 'تدقيق إمكانية الوصول',
    'rtl.mobileTest': 'اختبار RTL للجوال',

    // Common
    'common.retry': 'إعادة المحاولة',
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
    'common.progress': 'التقدم',

    // Statistics  
    'stats.progress': 'التقدم',
    'stats.averageScore': 'المتوسط',
    'stats.studyTime': 'وقت الدراسة',
    'stats.streak': 'السلسلة',
    'stats.completed': 'مكتمل',
    'stats.thisWeek': 'هذا الأسبوع',
    'stats.onStreak': '🔥 متواصل!',
    'stats.students': 'الطلاب',
    'stats.activeClasses': 'الفصول النشطة',
    'stats.lessonProgress': 'تقدم الدرس',
    'stats.engagement': 'المشاركة',
    'stats.active': 'نشط',
    'stats.thisSemester': 'هذا الفصل',
    'stats.average': 'متوسط',

    // Forum additions
    'forum.noMessages': 'لا توجد رسائل',
    'forum.beFirst': 'كن أول من ينشر رسالة!',
    'forum.mustLogin': '(يجب تسجيل الدخول)',
    'forum.writePlaceholder': 'اكتب ردك...',
    'forum.loginPlaceholder': 'سجل الدخول لكتابة رد',
    'forum.posting': 'جاري النشر...',
    'forum.postReply': 'نشر الرد',
    'forum.writeReply': 'اكتب ردك...',
    'forum.cancel': 'إلغاء',
    'forum.send': 'إرسال',
    'forum.replyCount': 'رد',
    'forum.repliesCount': 'ردود',
    'forum.deleted': 'تم حذف هذه الرسالة',
    'forum.confirmDelete': 'هل أنت متأكد من حذف هذه الرسالة؟',
    'forum.reported': 'تم الإبلاغ',
    'forum.reportSuccess': 'تم الإبلاغ عن هذه الرسالة للمراجعة',
    'forum.newTopic': 'موضوع جديد',
    'forum.topicTitle': 'عنوان الموضوع',
    'forum.topicDescription': 'اوصف موضوعك...',
    'forum.postTopic': 'نشر الموضوع',

    // RTL Testing and Development
    'rtl.test': 'اختبار RTL',
    'rtl.performance': 'أداء RTL',
    'rtl.dashboard': 'لوحة RTL',
  }
};

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const { isRTL, setRTL } = useRTL();
  const language = isRTL ? 'ar' : 'nl';
  
  const setLanguage = (newLanguage: 'nl' | 'ar') => {
    setRTL(newLanguage === 'ar');
  };
  
  const t = (key: string, fallback?: string): string => {
    const translation = translations[language]?.[key as keyof typeof translations.nl];
    return translation || fallback || key;
  };

  return (
    <TranslationContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};