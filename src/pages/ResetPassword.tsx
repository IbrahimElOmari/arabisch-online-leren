import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveForm, ResponsiveFormField } from '@/components/forms/ResponsiveForm';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validatePassword } from '@/utils/validation';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';
import { useTranslation } from '@/contexts/TranslationContext';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isValidSession, setIsValidSession] = useState(false);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getTextAlign, getFlexDirection } = useRTLLayout();
  const { getFormAttributes, getDialogAttributes } = useAccessibilityRTL();
  const { t } = useTranslation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          throw error;
        }

        if (session?.user) {
          console.log('Valid session found for password reset');
          setIsValidSession(true);
          return;
        }

        // If no session, check URL parameters for recovery link
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');

        if (type === 'recovery' && accessToken) {
          console.log('Recovery link detected, setting session');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (sessionError) {
            console.error('Session setting error:', sessionError);
            throw sessionError;
          }
          
          setIsValidSession(true);
          return;
        }

        // No valid session or recovery parameters
        throw new Error('No valid session or recovery link');
        
      } catch (error) {
        console.error('Password reset validation failed:', error);
        toast({
          title: 'Ongeldige link',
          description: 'De reset-link is ongeldig of verlopen. Vraag een nieuwe aan.',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/auth'), 2000);
      }
    };

    checkSession();
  }, [searchParams, navigate, toast]);

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    
    if (newPassword) {
      const validation = validatePassword(newPassword);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidSession) {
      toast({
        title: 'Sessie verlopen',
        description: 'Je sessie is verlopen. Vraag een nieuwe reset-link aan.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    
    if (passwordErrors.length > 0) {
      toast({
        title: 'Wachtwoord ongeldig',
        description: 'Los eerst de wachtwoordfouten op',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Wachtwoorden komen niet overeen',
        description: 'Controleer of beide wachtwoorden hetzelfde zijn',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      toast({
        title: 'Wachtwoord bijgewerkt',
        description: 'Je wachtwoord is succesvol gewijzigd',
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 3000);

    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het bijwerken van je wachtwoord',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while validating session
  if (!isValidSession && !isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10 rtl-bg-pattern"
          style={{
            backgroundImage: "url('/src/assets/arabic-pattern-bg.png')",
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px'
          }}
        />
        <Card className="w-full max-w-md relative z-10 bg-card/95 backdrop-blur-sm shadow-xl" {...getDialogAttributes('reset-password')}>
          <CardContent className="flex items-center justify-center p-6">
            <div className={`${getTextAlign('center')}`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('resetPassword.validating') || 'Reset-link valideren...'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('/src/assets/arabic-pattern-bg.png')",
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px'
          }}
        />
        <Card className="w-full max-w-md relative z-10 bg-card/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              Wachtwoord bijgewerkt
            </CardTitle>
            <CardDescription>
              Je wachtwoord is succesvol gewijzigd. Je wordt automatisch doorgestuurd naar de loginpagina.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Nu inloggen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "url('/src/assets/arabic-pattern-bg.png')",
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px'
        }}
      />
      <Card className="w-full max-w-md relative z-10 bg-card/95 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Nieuw wachtwoord instellen
          </CardTitle>
          <CardDescription>
            Voer je nieuwe wachtwoord in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveForm layout="single" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">Nieuw wachtwoord</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={12}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`pe-10 ${passwordErrors.length > 0 ? "border-destructive" : ""}`}
                  placeholder="Minimaal 12 karakters"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {passwordErrors.length > 0 && (
                <div className="space-y-1">
                  {passwordErrors.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">{error}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={password !== confirmPassword && confirmPassword ? "border-destructive" : ""}
                  placeholder="Herhaal je nieuwe wachtwoord"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {password !== confirmPassword && confirmPassword && (
                <p className="text-sm text-destructive">Wachtwoorden komen niet overeen</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || passwordErrors.length > 0 || password !== confirmPassword}
            >
              {isLoading ? 'Bezig...' : 'Wachtwoord bijwerken'}
            </Button>
          </ResponsiveForm>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;