import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface UserSession {
  id: string;
  user_id: string;
  session_start: string;
  session_end: string | null;
  duration_seconds: number | null;
}

interface AnalyticsData {
  totalTimeSpent: number;
  sessionsToday: number;
  averageSessionLength: number;
  topUsers: Array<{
    user_id: string;
    full_name: string;
    total_time: number;
    session_count: number;
  }>;
  timeByClass: Array<{
    class_name: string;
    total_time: number;
    student_count: number;
  }>;
}

interface AnalyticsState {
  sessions: UserSession[];
  analyticsData: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  currentSessionId: string | null;
  
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  fetchAnalytics: (startDate?: string, endDate?: string) => Promise<void>;
  fetchUserSessions: (userId?: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  sessions: [],
  analyticsData: null,
  loading: false,
  error: null,
  currentSessionId: null,

  startSession: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          session_start: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      set({ currentSessionId: data.id });
    } catch (error: any) {
      console.error('Start session error:', error);
      set({ error: error.message });
    }
  },

  endSession: async () => {
    try {
      const currentSessionId = get().currentSessionId;
      if (!currentSessionId) return;

      const sessionEnd = new Date();
      const { data: session } = await supabase
        .from('user_sessions')
        .select('session_start')
        .eq('id', currentSessionId)
        .single();

      if (session) {
        const sessionStart = new Date(session.session_start);
        const durationSeconds = Math.floor((sessionEnd.getTime() - sessionStart.getTime()) / 1000);

        await supabase
          .from('user_sessions')
          .update({
            session_end: sessionEnd.toISOString(),
            duration_seconds: durationSeconds
          })
          .eq('id', currentSessionId);
      }

      set({ currentSessionId: null });
    } catch (error: any) {
      console.error('End session error:', error);
      set({ error: error.message });
    }
  },

  fetchAnalytics: async (startDate?: string, endDate?: string) => {
    set({ loading: true, error: null });
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();

      // Fetch session data with analytics
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select(`
          *,
          profiles!user_sessions_user_id_fkey(full_name)
        `)
        .gte('session_start', start)
        .lte('session_start', end)
        .not('duration_seconds', 'is', null);

      if (sessionsError) throw sessionsError;

      // Calculate analytics
      const totalTimeSpent = sessions?.reduce((acc, session) => acc + (session.duration_seconds || 0), 0) || 0;
      const sessionsToday = sessions?.filter(session => 
        new Date(session.session_start).toDateString() === new Date().toDateString()
      ).length || 0;
      
      const averageSessionLength = sessions?.length ? totalTimeSpent / sessions.length : 0;

      // Group by user for top users
      const userMap = new Map();
      sessions?.forEach(session => {
        const userId = session.user_id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            full_name: session.profiles?.full_name || 'Onbekend',
            total_time: 0,
            session_count: 0
          });
        }
        const user = userMap.get(userId);
        user.total_time += session.duration_seconds || 0;
        user.session_count += 1;
      });

      const topUsers = Array.from(userMap.values())
        .sort((a, b) => b.total_time - a.total_time)
        .slice(0, 10);

      const analyticsData: AnalyticsData = {
        totalTimeSpent,
        sessionsToday,
        averageSessionLength,
        topUsers,
        timeByClass: [] // Would need enrollment data to calculate this properly
      };

      set({ analyticsData, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchUserSessions: async (userId?: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) throw new Error('No user ID provided');

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', targetUserId)
        .order('session_start', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      set({ sessions: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  }
}));