/**
 * Marketing Service
 * Handles testimonials, lead magnets, and referral program
 */

import { supabase } from '@/integrations/supabase/client';

// ==================== TYPES ====================

export interface Testimonial {
  id: string;
  user_id: string | null;
  name: string;
  role: string | null;
  content: string;
  rating: number | null;
  avatar_url: string | null;
  is_featured: boolean | null;
  is_approved: boolean | null;
  source: string | null;
  created_at: string | null;
}

export interface TestimonialInput {
  name: string;
  role?: string;
  content: string;
  rating: number;
  avatar_url?: string;
  is_featured?: boolean;
}

export interface LeadMagnet {
  id: string;
  title: string;
  description: string | null;
  type: string;
  file_url: string | null;
  thumbnail_url: string | null;
  download_count: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface LeadCaptureInput {
  email: string;
  name?: string;
  lead_magnet_id: string;
  utm_source?: string;
  utm_campaign?: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string | null;
  referral_code: string;
  status: string | null;
  reward_type: string | null;
  reward_amount: number | null;
  referee_email: string | null;
  created_at: string | null;
  converted_at: string | null;
  rewarded_at: string | null;
}

export interface ReferralReward {
  id: string;
  tier: string;
  min_referrals: number;
  reward_type: string;
  reward_value: number;
  description: string | null;
  is_active: boolean | null;
}

// ==================== TESTIMONIALS ====================

export const getApprovedTestimonials = async (): Promise<Testimonial[]> => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getFeaturedTestimonials = async (limit = 3): Promise<Testimonial[]> => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_approved', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const submitTestimonial = async (input: TestimonialInput): Promise<Testimonial> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('testimonials')
    .insert({
      ...input,
      user_id: user?.id || null,
      is_approved: false,
      source: 'form',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ==================== LEAD MAGNETS ====================

export const getActiveLeadMagnets = async (): Promise<LeadMagnet[]> => {
  const { data, error } = await supabase
    .from('lead_magnets')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getLeadMagnetById = async (id: string): Promise<LeadMagnet | null> => {
  const { data, error } = await supabase
    .from('lead_magnets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const downloadLeadMagnet = async (input: LeadCaptureInput): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Log the download
  const { error: logError } = await supabase
    .from('lead_magnet_downloads')
    .insert({
      lead_magnet_id: input.lead_magnet_id,
      email: input.email,
      name: input.name || null,
      user_id: user?.id || null,
      utm_source: input.utm_source || null,
      utm_campaign: input.utm_campaign || null,
    });

  if (logError) throw logError;

  // Get the file URL
  const { data: leadMagnet, error } = await supabase
    .from('lead_magnets')
    .select('file_url')
    .eq('id', input.lead_magnet_id)
    .single();

  if (error) throw error;
  return leadMagnet?.file_url || '';
};

// ==================== REFERRALS ====================

export const getUserReferralCode = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if user already has a referral code
  const { data: existing } = await supabase
    .from('referrals')
    .select('referral_code')
    .eq('referrer_id', user.id)
    .limit(1)
    .maybeSingle();

  if (existing?.referral_code) return existing.referral_code;

  // Generate new code using the database function
  const { data: newCode } = await supabase.rpc('generate_referral_code');

  // Create initial referral record
  const { data: newReferral, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: user.id,
      referral_code: newCode || generateLocalCode(),
      status: 'pending',
    })
    .select('referral_code')
    .single();

  if (error) throw error;
  return newReferral?.referral_code || null;
};

// Fallback code generator
const generateLocalCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const getUserReferrals = async (): Promise<Referral[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getReferralStats = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total: 0, registered: 0, enrolled: 0, rewarded: 0 };

  const { data, error } = await supabase
    .from('referrals')
    .select('status')
    .eq('referrer_id', user.id);

  if (error) throw error;

  const stats = {
    total: data?.length || 0,
    registered: data?.filter(r => r.status === 'registered').length || 0,
    enrolled: data?.filter(r => r.status === 'enrolled').length || 0,
    rewarded: data?.filter(r => r.status === 'rewarded').length || 0,
  };

  return stats;
};

export const getReferralRewards = async (): Promise<ReferralReward[]> => {
  const { data, error } = await supabase
    .from('referral_rewards')
    .select('*')
    .eq('is_active', true)
    .order('min_referrals', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const validateReferralCode = async (code: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('referrals')
    .select('id')
    .eq('referral_code', code.toUpperCase())
    .maybeSingle();

  if (error) return false;
  return !!data;
};

export const applyReferralCode = async (code: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: referral, error: findError } = await supabase
    .from('referrals')
    .select('*')
    .eq('referral_code', code.toUpperCase())
    .maybeSingle();

  if (findError || !referral) return false;
  if (referral.referrer_id === user.id) return false; // Can't refer yourself

  const { error: updateError } = await supabase
    .from('referrals')
    .update({
      referee_id: user.id,
      status: 'registered',
      converted_at: new Date().toISOString(),
    })
    .eq('id', referral.id);

  return !updateError;
};

// ==================== ADMIN FUNCTIONS ====================

export const approveTestimonial = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('testimonials')
    .update({ is_approved: true })
    .eq('id', id);

  if (error) throw error;
};

export const featureTestimonial = async (id: string, featured: boolean): Promise<void> => {
  const { error } = await supabase
    .from('testimonials')
    .update({ is_featured: featured })
    .eq('id', id);

  if (error) throw error;
};
