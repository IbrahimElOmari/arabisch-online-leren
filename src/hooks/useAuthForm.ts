import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AuthFormData } from '@/components/auth/AuthForm';
import type { RoleOption } from '@/components/auth/RoleSelection';

export const useAuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const signUp = async (formData: AuthFormData) => {
    if (formData.isUnder16 && !formData.parentEmail) {
      toast({
        title: "Fout",
        description: "E-mail van ouder/verzorger is verplicht voor gebruikers onder de 16.",
        variant: "destructive"
      });
      return false;
    }

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', formData.emailOrName)
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      const userId = existingUser[0].id;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: formData.fullName,
          role: formData.role,
          parent_email: formData.isUnder16 ? formData.parentEmail : null,
          email: formData.emailOrName
        });

      if (profileError) {
        throw new Error("Fout bij het aanmaken van profiel: " + profileError.message);
      }

      toast({
        title: "Registratie succesvol",
        description: "Nieuwe rol toegevoegd aan bestaand account.",
      });
      return true;
    } else {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: formData.emailOrName,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.fullName,
            role: formData.role,
            parent_email: formData.isUnder16 ? formData.parentEmail : null
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Registratie succesvol",
        description: "Controleer je e-mail voor verificatie.",
      });
      return true;
    }
  };

  const signIn = async (formData: AuthFormData) => {
    let loginEmail = formData.emailOrName;
    
    if (!formData.emailOrName.includes('@')) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name, role')
        .ilike('full_name', formData.emailOrName);

      if (profileError || !profiles || profiles.length === 0) {
        toast({
          title: "Fout",
          description: "Gebruiker niet gevonden. Controleer je naam of gebruik je e-mailadres.",
          variant: "destructive"
        });
        return false;
      }
      
      if (profiles.length > 1) {
        setAvailableRoles(profiles.map(p => ({ role: p.role, fullName: p.full_name })));
        setShowRoleSelection(true);
        return false;
      }
      
      loginEmail = profiles[0].email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: formData.password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast({
          title: "Fout",
          description: "Onjuiste e-mail/naam of wachtwoord.",
          variant: "destructive"
        });
      } else {
        throw error;
      }
      return false;
    } else {
      // Check if user has multiple roles
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('email', loginEmail);

      if (userProfiles && userProfiles.length > 1) {
        setAvailableRoles(userProfiles.map(p => ({ role: p.role, fullName: p.full_name })));
        setShowRoleSelection(true);
        return false;
      } else {
        // Explicit redirect to dashboard after successful login
        console.debug('🎯 useAuthForm: Login successful, navigating to dashboard');
        navigate('/dashboard', { replace: true });
        return true;
      }
    }
  };

  const handleSubmit = async (formData: AuthFormData, isSignUp: boolean) => {
    setIsLoading(true);

    try {
      const success = isSignUp ? await signUp(formData) : await signIn(formData);
      if (success && !showRoleSelection) {
        console.debug('🎯 useAuthForm: Auth successful, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelection = () => {
    if (selectedRole) {
      setShowRoleSelection(false);
      console.debug('🎯 useAuthForm: Role selected, navigating to dashboard');
      navigate('/dashboard', { replace: true });
      return true;
    }
    return false;
  };

  const resetRoleSelection = () => {
    setShowRoleSelection(false);
    setAvailableRoles([]);
    setSelectedRole(null);
  };

  return {
    isLoading,
    availableRoles,
    selectedRole,
    showRoleSelection,
    setSelectedRole,
    handleSubmit,
    handleRoleSelection,
    resetRoleSelection
  };
};
