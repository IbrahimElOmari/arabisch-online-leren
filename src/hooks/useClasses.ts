import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from './useUserProfile';

interface EnrolledClass {
  id: string;
  class_id: string;
  payment_status: string;
  klassen: {
    id: string;
    name: string;
    description: string;
  };
}

export const useClasses = (profile: UserProfile | null, userId?: string) => {
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);

  // Cache keys
  const cacheKey = (profile?.id || userId) ? `classes_${profile?.id || userId}` : null;
  const selectedKey = (profile?.id || userId) ? `selected_class_${profile?.id || userId}` : null;

  const loadFromCache = () => {
    if (!cacheKey || !selectedKey) return false;
    
    try {
      const cached = localStorage.getItem(cacheKey);
      const cachedSelected = localStorage.getItem(selectedKey);
      
      if (cached) {
        const parsed = JSON.parse(cached) as EnrolledClass[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.debug('💾 useClasses: Using cached classes');
          setEnrolledClasses(parsed);
          setSelectedClass(cachedSelected || parsed[0].class_id);
          return true;
        }
      }
    } catch (e) {
      console.warn('useClasses: Failed to read cache', e);
    }
    return false;
  };

  const saveToCache = (classes: EnrolledClass[], selected: string) => {
    if (!cacheKey || !selectedKey) return;
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify(classes));
      localStorage.setItem(selectedKey, selected);
      console.debug('💾 useClasses: Cached classes and selection');
    } catch (e) {
      console.warn('useClasses: Failed to write cache', e);
    }
  };

  const fetchClasses = async () => {
    const effectiveUserId = profile?.id || userId;
    const effectiveRole = profile?.role || 'leerling';
    
    if (!effectiveUserId) {
      console.debug('⚠️ useClasses: No user ID available');
      setClassesLoading(false);
      return;
    }

    try {
      setClassesLoading(true);
      setClassesError(null);
      console.debug('🔄 useClasses: Fetching classes for role:', effectiveRole);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      let formattedClasses: EnrolledClass[] = [];

      if (effectiveRole === 'admin') {
        const { data, error } = await supabase
          .from('klassen')
          .select('id, name, description')
          .order('created_at', { ascending: false })
          .abortSignal(controller.signal);
        
        clearTimeout(timeout);
        if (error) throw error;
        
        formattedClasses = data?.map(klas => ({
          id: `admin-${klas.id}`,
          class_id: klas.id,
          payment_status: 'paid',
          klassen: {
            id: klas.id,
            name: klas.name,
            description: klas.description || ''
          }
        })) || [];
      } else if (effectiveRole === 'leerkracht') {
        const { data, error } = await supabase
          .from('klassen')
          .select('id, name, description')
          .eq('teacher_id', effectiveUserId)
          .abortSignal(controller.signal);
        
        clearTimeout(timeout);
        if (error) throw error;
        
        formattedClasses = data?.map(klas => ({
          id: `teacher-${klas.id}`,
          class_id: klas.id,
          payment_status: 'paid',
          klassen: {
            id: klas.id,
            name: klas.name,
            description: klas.description || ''
          }
        })) || [];
      } else {
        const { data, error } = await supabase
          .from('inschrijvingen')
          .select(`
            id,
            class_id,
            payment_status,
            klassen:class_id (
              id,
              name,
              description
            )
          `)
          .eq('student_id', effectiveUserId)
          .eq('payment_status', 'paid')
          .abortSignal(controller.signal);

        clearTimeout(timeout);
        if (error) throw error;
        
        formattedClasses = data || [];
      }

      setEnrolledClasses(formattedClasses);
      const newSelected = formattedClasses.length > 0 ? formattedClasses[0].class_id : '';
      setSelectedClass(newSelected);
      saveToCache(formattedClasses, newSelected);
      
    } catch (error: any) {
      console.error('❌ useClasses: Error fetching classes:', error);
      setClassesError(error.name === 'AbortError' ? 'Timeout' : 'Fetch error');
      
      // Keep cached data if available
      if (enrolledClasses.length === 0) {
        loadFromCache();
      }
    } finally {
      setClassesLoading(false);
    }
  };

  const updateSelectedClass = (classId: string) => {
    setSelectedClass(classId);
    saveToCache(enrolledClasses, classId);
  };

  useEffect(() => {
    // Load from cache immediately
    const hasCache = loadFromCache();
    
    // Always fetch fresh data, but don't block UI if we have cache
    if (profile?.id || userId) {
      fetchClasses();
    } else if (!hasCache) {
      setClassesLoading(false);
    }
  }, [profile?.id, userId]);

  return {
    enrolledClasses,
    selectedClass,
    classesLoading,
    classesError,
    updateSelectedClass,
    refetchClasses: fetchClasses
  };
};
