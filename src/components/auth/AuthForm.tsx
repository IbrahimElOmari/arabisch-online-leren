import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ResponsiveForm, ResponsiveFormField } from '@/components/forms/ResponsiveForm';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { validatePassword } from '@/utils/validation';
import { emailSchema } from '@/lib/schemas';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useState } from 'react';
import { useRTLLayout } from '@/hooks/useRTLLayout';

export interface AuthFormData {
  emailOrName: string;
  password: string;
  fullName: string;
  role: 'admin' | 'leerkracht' | 'leerling';
  parentEmail: string;
  isUnder16: boolean;
}

interface AuthFormProps {
  isSignUp: boolean;
  formData: AuthFormData;
  setFormData: (data: AuthFormData) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onToggleMode: () => void;
  onForgotPassword?: () => void;
}

export const AuthForm = ({ 
  isSignUp, 
  formData, 
  setFormData, 
  showPassword, 
  setShowPassword, 
  isLoading, 
  onSubmit, 
  onToggleMode,
  onForgotPassword 
}: AuthFormProps) => {
  const { checkRateLimit, isBlocked, retryAfter } = useRateLimit({ 
    action: isSignUp ? 'SIGNUP' : 'LOGIN' 
  });
  
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [emailError, setEmailError] = useState<string>('');
  const { getFlexDirection, getTextAlign, getPaddingEnd, isRTL } = useRTLLayout();

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    
    if (isSignUp && password) {
      const validation = validatePassword(password);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleEmailChange = (email: string) => {
    // Use Zod schema for validation and sanitization
    const result = emailSchema.safeParse(email);
    if (result.success) {
      setFormData({ ...formData, emailOrName: result.data });
      setEmailError('');
    } else {
      // Still update the field but show error
      setFormData({ ...formData, emailOrName: email.toLowerCase().trim() });
      if (isSignUp && email) {
        setEmailError(result.error.errors[0]?.message || 'Ongeldig e-mailadres');
      } else {
        setEmailError('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      return;
    }

    // Additional validation for sign up
    if (isSignUp) {
      if (passwordErrors.length > 0) {
        return;
      }
      if (emailError) {
        return;
      }
    }

    const isAllowed = await checkRateLimit();
    if (!isAllowed) {
      return;
    }

    onSubmit(e);
  };
  return (
    <>
      {isBlocked && retryAfter && (
        <div className={`${getFlexDirection()} items-center gap-2 p-3 text-destructive bg-destructive/10 border border-destructive/20 rounded-md`}>
          <AlertTriangle className="h-4 w-4" />
          <span className={`text-sm ${getTextAlign('left')} ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL 
              ? `محاولات كثيرة جداً. جرب بعد ${Math.ceil((retryAfter - Date.now()) / 60000)} دقائق.`
              : `Te veel pogingen. Probeer over ${Math.ceil((retryAfter - Date.now()) / 60000)} minuten opnieuw.`
            }
          </span>
        </div>
      )}
      
      <ResponsiveForm layout="single" onSubmit={handleSubmit}>
        {isSignUp && (
          <>
            <ResponsiveFormField
              label={isRTL ? 'الاسم الكامل' : 'Volledige naam'}
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={(value) => {
                // Security: Sanitize input - remove potentially harmful characters
                const sanitized = value.replace(/[<>\"'&]/g, '');
                setFormData({...formData, fullName: sanitized});
              }}
              placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Voer je volledige naam in'}
            />
            
            <div className="space-y-2">
              <Label htmlFor="role" className={isRTL ? 'arabic-text' : ''}>
                {isRTL ? 'الدور' : 'Rol'}
              </Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leerling" className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? 'طالب' : 'Leerling'}
                  </SelectItem>
                  <SelectItem value="leerkracht" className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? 'معلم' : 'Leerkracht'}
                  </SelectItem>
                  <SelectItem value="admin" className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? 'مدير' : 'Administrator'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={`${getFlexDirection()} items-center gap-2`}>
              <Checkbox
                id="under16"
                checked={formData.isUnder16}
                onCheckedChange={(checked) => setFormData({...formData, isUnder16: checked as boolean})}
              />
              <Label htmlFor="under16" className={`text-sm ${getTextAlign('left')} ${isRTL ? 'arabic-text' : ''}`}>
                {isRTL ? 'أنا أصغر من 16 سنة' : 'Ik ben jonger dan 16 jaar'}
              </Label>
            </div>

            {formData.isUnder16 && (
              <div className="space-y-2">
                <Label htmlFor="parentEmail" className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'بريد إلكتروني للوالد/الوصي' : 'E-mail ouder/verzorger'}
                </Label>
                <Input
                  id="parentEmail"
                  type="email"
                  required
                  maxLength={100}
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({...formData, parentEmail: e.target.value.toLowerCase().trim()})}
                  placeholder="ouder@email.com"
                />
              </div>
            )}
          </>
        )}
        
        <ResponsiveFormField
          label={isSignUp 
            ? (isRTL ? 'البريد الإلكتروني' : 'E-mail')
            : (isRTL ? 'البريد الإلكتروني أو الاسم' : 'E-mail of naam')
          }
          name="emailOrName"
          type={isSignUp ? "email" : "text"}
          required
          value={formData.emailOrName}
          onChange={(value) => {
            if (isSignUp) {
              handleEmailChange(value);
            } else {
              // For login, just trim - no need for aggressive sanitization
              setFormData({...formData, emailOrName: value.trim()});
            }
          }}
          placeholder={isSignUp ? "je@email.com" : "E-mail of volledige naam"}
          error={emailError}
        />
        
        <div className="space-y-2">
          <Label htmlFor="password" className={isRTL ? 'arabic-text' : ''}>
            {isRTL ? 'كلمة المرور' : 'Wachtwoord'}
          </Label>
          <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={isSignUp ? 12 : 8}
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={`pe-10 ${passwordErrors.length > 0 ? "border-destructive" : ""}`}
                placeholder={isSignUp 
                  ? (isRTL ? 'حد أدنى 12 حرفاً' : 'Minimaal 12 karakters')
                  : (isRTL ? 'حد أدنى 8 أحرف' : 'Minimaal 8 karakters')
                }
              />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`absolute ${getPaddingEnd('0')} top-0 h-full px-3 py-2 hover:bg-transparent`}
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
                <p key={index} className={`text-sm text-destructive ${getTextAlign('left')}`}>{error}</p>
              ))}
            </div>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || isBlocked || (isSignUp && (passwordErrors.length > 0 || !!emailError))}
        >
          <span className={isRTL ? 'arabic-text' : ''}>
            {isLoading 
              ? (isRTL ? 'جاري التحميل...' : 'Bezig...')
              : isSignUp 
                ? (isRTL ? 'التسجيل' : 'Registreren')
                : (isRTL ? 'تسجيل الدخول' : 'Inloggen')
            }
          </span>
        </Button>
      </ResponsiveForm>
      
      <div className="mt-4 text-center space-y-2">
        {!isSignUp && onForgotPassword && (
          <Button
            variant="link"
            onClick={onForgotPassword}
            className={`text-sm text-muted-foreground ${getTextAlign('center')} ${isRTL ? 'arabic-text' : ''}`}
          >
            {isRTL ? 'نسيت كلمة المرور؟' : 'Wachtwoord vergeten?'}
          </Button>
        )}
        
        <Button
          variant="link"
          onClick={onToggleMode}
          className={`text-sm ${getTextAlign('center')} ${isRTL ? 'arabic-text' : ''}`}
        >
          {isSignUp 
            ? (isRTL ? 'هل لديك حساب بالفعل؟ سجل الدخول' : 'Heb je al een account? Log in')
            : (isRTL ? 'لا يوجد حساب؟ سجل الآن' : 'Nog geen account? Registreer nu')
          }
        </Button>
      </div>
    </>
  );
};