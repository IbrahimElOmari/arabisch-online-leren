import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { sanitizeInput, validatePassword, validateEmail } from '@/utils/validation';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useState } from 'react';

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
    const sanitized = sanitizeInput(email.toLowerCase().trim());
    setFormData({ ...formData, emailOrName: sanitized });
    
    if (isSignUp && email && !validateEmail(email)) {
      setEmailError('Voer een geldig e-mailadres in');
    } else {
      setEmailError('');
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
        <div className="flex items-center gap-2 p-3 text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">
            Te veel pogingen. Probeer over {Math.ceil((retryAfter - Date.now()) / 60000)} minuten opnieuw.
          </span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">Volledige naam</Label>
              <Input
                id="fullName"
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={formData.fullName}
                onChange={(e) => {
                  // Security: Sanitize input - remove potentially harmful characters
                  const sanitized = e.target.value.replace(/[<>\"'&]/g, '');
                  setFormData({...formData, fullName: sanitized});
                }}
                placeholder="Voer je volledige naam in"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leerling">Leerling</SelectItem>
                  <SelectItem value="leerkracht">Leerkracht</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="under16"
                checked={formData.isUnder16}
                onCheckedChange={(checked) => setFormData({...formData, isUnder16: checked as boolean})}
              />
              <Label htmlFor="under16" className="text-sm">
                Ik ben jonger dan 16 jaar
              </Label>
            </div>

            {formData.isUnder16 && (
              <div className="space-y-2">
                <Label htmlFor="parentEmail">E-mail ouder/verzorger</Label>
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
        
        <div className="space-y-2">
          <Label htmlFor="emailOrName">
            {isSignUp ? 'E-mail' : 'E-mail of naam'}
          </Label>
          <Input
            id="emailOrName"
            type={isSignUp ? "email" : "text"}
            required
            maxLength={100}
            value={formData.emailOrName}
                onChange={(e) => {
              if (isSignUp) {
                handleEmailChange(e.target.value);
              } else {
                const sanitized = sanitizeInput(e.target.value.trim());
                setFormData({...formData, emailOrName: sanitized});
              }
            }}
            placeholder={isSignUp ? "je@email.com" : "E-mail of volledige naam"}
            className={emailError ? "border-destructive" : ""}
          />
          {emailError && (
            <p className="text-sm text-destructive">{emailError}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Wachtwoord</Label>
          <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={isSignUp ? 12 : 8}
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={`pr-10 ${passwordErrors.length > 0 ? "border-destructive" : ""}`}
                placeholder={isSignUp ? "Minimaal 12 karakters" : "Minimaal 8 karakters"}
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
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || isBlocked || (isSignUp && (passwordErrors.length > 0 || !!emailError))}
        >
          {isLoading ? 'Bezig...' : (isSignUp ? 'Registreren' : 'Inloggen')}
        </Button>
      </form>
      
      <div className="mt-4 text-center space-y-2">
        {!isSignUp && onForgotPassword && (
          <Button
            variant="link"
            onClick={onForgotPassword}
            className="text-sm text-muted-foreground"
          >
            Wachtwoord vergeten?
          </Button>
        )}
        
        <Button
          variant="link"
          onClick={onToggleMode}
          className="text-sm"
        >
          {isSignUp 
            ? 'Heb je al een account? Log in'
            : 'Nog geen account? Registreer nu'
          }
        </Button>
      </div>
    </>
  );
};