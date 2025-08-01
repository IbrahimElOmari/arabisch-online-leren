import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthForm, type AuthFormData } from '@/components/auth/AuthForm';
import { RoleSelection } from '@/components/auth/RoleSelection';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { useAuth } from '@/hooks/useAuth';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>({
    emailOrName: '',
    password: '',
    fullName: '',
    role: 'leerling',
    parentEmail: '',
    isUnder16: false
  });

  const {
    isLoading,
    availableRoles,
    selectedRole,
    showRoleSelection,
    setSelectedRole,
    handleSubmit,
    handleRoleSelection,
    resetRoleSelection
  } = useAuth();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(formData, isSignUp);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

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
            {showRoleSelection ? 'Kies je rol' : (isSignUp ? 'Registreren' : 'Inloggen')}
          </CardTitle>
          <CardDescription>
            {showRoleSelection 
              ? 'Selecteer de rol waarmee je wilt inloggen'
              : (isSignUp 
                ? 'Maak een account aan om te beginnen met leren'
                : 'Log in op je account'
              )
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showRoleSelection ? (
            <RoleSelection
              availableRoles={availableRoles}
              selectedRole={selectedRole}
              onRoleChange={setSelectedRole}
              onContinue={handleRoleSelection}
              onBack={resetRoleSelection}
            />
          ) : (
            <AuthForm
              isSignUp={isSignUp}
              formData={formData}
              setFormData={setFormData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              isLoading={isLoading}
              onSubmit={onSubmit}
              onToggleMode={toggleMode}
              onForgotPassword={() => setShowForgotPassword(true)}
            />
          )}
        </CardContent>
      </Card>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default Auth;