
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'leerkracht' | 'leerling';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  parent_email?: string;
}

export const useUserProfile = (user: User | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileSyncing, setProfileSyncing] = useState(false);
  const { toast } = useToast();

  const createFallbackProfile = (userId: string, userData?: User): UserProfile => {
    console.debug('🔄 useUserProfile: Creating fallback profile');
    return {
      id: userId,
      full_name: userData?.user_metadata?.full_name || 'Gebruiker',
      role: (userData?.user_metadata?.role || 'leerling') as UserRole,
      parent_email: userData?.user_metadata?.parent_email
    };
  };

  const fetchProfile = async (userId: string, retryCount = 0): Promise<UserProfile | null> => {
    console.debug('🔍 useUserProfile: Fetching profile, retry:', retryCount);
    setProfileSyncing(true);
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .single();

      clearTimeout(timeout);

      if (error) {
        console.error('❌ useUserProfile: Profile fetch error:', error);
        
        if (retryCount < 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfile(userId, retryCount + 1);
        }
        
        // Use fallback
        const { data: userData } = await supabase.auth.getUser();
        const fallbackProfile = createFallbackProfile(userId, userData.user || undefined);
        setProfile(fallbackProfile);
        setProfileSyncing(false);
        return fallbackProfile;
      }

      console.debug('✅ useUserProfile: Profile fetched successfully');
      setProfile(data);
      setProfileSyncing(false);
      return data;
      
    } catch (error) {
      console.error('❌ useUserProfile: Profile fetch exception:', error);
      
      if (retryCount < 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchProfile(userId, retryCount + 1);
      }
      
      const { data: userData } = await supabase.auth.getUser();
      const fallbackProfile = createFallbackProfile(userId, userData.user || undefined);
      setProfile(fallbackProfile);
      setProfileSyncing(false);
      return fallbackProfile;
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      toast({
        title: "Geen gebruiker",
        description: "Kan profiel niet herladen - geen gebruiker ingelogd",
        variant: "destructive"
      });
      return;
    }
    
    console.debug('🔄 useUserProfile: Manual refresh requested');
    setProfile(null);
    await fetchProfile(user.id);
  };

  useEffect(() => {
    if (user?.id) {
      console.debug('👤 useUserProfile: User available, fetching profile');
      fetchProfile(user.id);
    } else {
      console.debug('🚫 useUserProfile: No user, clearing profile');
      setProfile(null);
      setProfileSyncing(false);
    }
  }, [user?.id]);

  return {
    profile,
    profileSyncing,
    refreshProfile
  };
};
