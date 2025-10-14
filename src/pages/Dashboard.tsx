import { useAuth } from '@/components/auth/AuthProviderQuery';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import EnhancedStudentDashboard from '@/components/student/EnhancedStudentDashboard';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FullPageEnhancedLoader } from '@/components/ui/enhanced-loading-system';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { BackendStatusBadge } from '@/components/status/BackendStatusBadge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from '@/contexts/TranslationContext';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useUserRole } from '@/hooks/useUserRole';

const Dashboard = () => {
  const { user, profile, authReady, loading, refreshProfile, isRefreshing } = useAuth();
  const { isAdmin, isTeacher, isStudent, role, isLoading: roleLoading } = useUserRole();
  const { t } = useTranslation();
  const { getTextAlign, isRTL } = useRTLLayout();

  if (import.meta.env.DEV) {
    console.debug('📊 Dashboard: user:', !!user, 'profile:', !!profile, 'role:', role);
  }

  // Early guard: if auth is ready and no user, redirect to auth
  if (authReady && !user) {
    console.debug('🚫 Dashboard: No user after auth ready, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // Show loading while auth isn't ready or role is loading
  if ((!authReady && loading) || roleLoading) {
    if (import.meta.env.DEV) {
      console.debug('⏳ Dashboard: Auth not ready yet or role loading');
    }
    return (
      <FullPageEnhancedLoader 
        text={t('status.loading')} 
        showProgress={true}
        progress={50}
        steps={[
          { label: t('auth.checking'), completed: true },
          { label: t('auth.loading_profile'), completed: false },
          { label: t('dashboard.preparing'), completed: false }
        ]}
      />
    );
  }

  // Render dashboard based on role from RBAC
  if (profile && role) {
    if (import.meta.env.DEV) {
      console.debug('✅ Dashboard: Rendering dashboard for role:', role);
    }
    
    if (isAdmin) {
      return <AdminDashboard />;
    }
    if (isTeacher) {
      return <TeacherDashboard />;
    }
    if (isStudent) {
      return <EnhancedStudentDashboard />;
    }
    
    // Unknown role fallback
    console.error('❌ Dashboard: Unknown role:', role);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className={`text-lg text-destructive ${getTextAlign('center')} ${isRTL ? 'arabic-text' : ''}`}>
          {t('error.unknown_role', 'Onbekende gebruikersrol')}: {role}
        </div>
      </div>
    );
  }

  // Fallback dashboard when profile is loading
  if (user) {
    if (import.meta.env.DEV) {
      console.debug('🔄 Dashboard: User available but no profile, showing fallback');
    }
    const fallbackRole = role || user.user_metadata?.role || 'leerling';
    
    return (
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-3xl font-bold mb-2 ${isRTL ? 'arabic-text font-amiri' : ''}`}>
                  {t('nav.dashboard')}
                </h1>
                <p className={`text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                  {t('dashboard.profile_loading', 'Welkom! Je profiel wordt geladen...')}
                </p>
              </div>
              <BackendStatusBadge compact />
            </div>
            
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className={isRTL ? 'arabic-text' : ''}>
                {t('dashboard.profile_loading_title', 'Profiel wordt geladen')}
              </AlertTitle>
              <AlertDescription className={`flex items-center gap-3 ${isRTL ? 'arabic-text' : ''}`}>
                {t('dashboard.profile_loading_desc', 'Je dashboard werkt met basis functionaliteit terwijl je profiel wordt geladen.')}
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={refreshProfile}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'} ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? t('status.loading') : t('dashboard.force_profile', 'Forceer profiel')}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
          
          {/* Basic fallback dashboard content */}
          <div className="@container">
            <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4 @md:gap-6">
              <div className="bg-card rounded-lg p-4 @md:p-6 border">
                <h3 className={`text-lg @md:text-xl font-semibold mb-2 ${isRTL ? 'arabic-text' : ''}`}>
                  {t('welcome.title', 'Welkom!')}
                </h3>
                <p className={`text-sm @md:text-base text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                  {t('dashboard.full_loading_desc', 'Je dashboard wordt volledig geladen zodra je profiel beschikbaar is.')}
                  {' '}
                  {t('dashboard.current_role', 'Momenteel werken we met rol')}: <strong>{fallbackRole}</strong>
                </p>
              </div>
              <div className="bg-card rounded-lg p-4 @md:p-6 border">
                <h3 className={`text-lg @md:text-xl font-semibold mb-2 ${isRTL ? 'arabic-text' : ''}`}>
                  {t('nav.navigation', 'Navigatie')}
                </h3>
                <p className={`text-sm @md:text-base text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                  {t('dashboard.navigation_desc', 'Je kunt al wel naar andere pagina\'s navigeren via de sidebar.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Final fallback - should rarely be reached
  if (import.meta.env.DEV) {
    console.debug('⏳ Dashboard: No user yet, showing loading');
  }
  return <FullPageEnhancedLoader text={t('status.loading')} />;
};

export default Dashboard;
