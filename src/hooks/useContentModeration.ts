import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface ContentModerationResult {
  flagged: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
  autoAction?: 'none' | 'flag' | 'hide' | 'delete';
}

const PROFANITY_WORDS = ['spam', 'inappropriate']; // Configurable list
const MAX_LINKS = 3;
const SPAM_THRESHOLD = 5; // Same content posted X times

export const useContentModeration = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isChecking, setIsChecking] = useState(false);

  const checkProfanity = (content: string): boolean => {
    const lowerContent = content.toLowerCase();
    return PROFANITY_WORDS.some(word => lowerContent.includes(word));
  };

  const checkAllCaps = (content: string): boolean => {
    const letters = content.replace(/[^a-zA-Z]/g, '');
    if (letters.length < 10) return false;
    const upperCount = letters.replace(/[^A-Z]/g, '').length;
    return (upperCount / letters.length) > 0.8;
  };

  const checkLinkSpam = (content: string): boolean => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = content.match(urlRegex);
    return links ? links.length > MAX_LINKS : false;
  };

  const checkSpamPattern = async (userId: string, content: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('body')
        .eq('author_id', userId)
        .gte('created_at', new Date(Date.now() - 60000).toISOString())
        .limit(10);

      if (error) throw error;

      const identicalPosts = data?.filter(post => post.body === content).length || 0;
      return identicalPosts >= SPAM_THRESHOLD;
    } catch (error) {
      console.error('Spam pattern check failed:', error);
      return false;
    }
  };

  const moderateContent = useCallback(async (
    content: string,
    userId: string,
    contentType: 'forum_post' | 'forum_thread' | 'message' = 'forum_post'
  ): Promise<ContentModerationResult> => {
    setIsChecking(true);

    try {
      const result: ContentModerationResult = {
        flagged: false,
        severity: 'low',
        autoAction: 'none'
      };

      // Check profanity
      if (checkProfanity(content)) {
        result.flagged = true;
        result.reason = t('moderation.reasons.profanity');
        result.severity = 'high';
        result.autoAction = 'flag';
      }

      // Check ALL CAPS
      if (!result.flagged && checkAllCaps(content)) {
        result.flagged = true;
        result.reason = t('moderation.reasons.allCaps');
        result.severity = 'low';
        result.autoAction = 'flag';
      }

      // Check link spam
      if (!result.flagged && checkLinkSpam(content)) {
        result.flagged = true;
        result.reason = t('moderation.reasons.linkSpam');
        result.severity = 'medium';
        result.autoAction = 'flag';
      }

      // Check spam patterns
      if (!result.flagged && await checkSpamPattern(userId, content)) {
        result.flagged = true;
        result.reason = t('moderation.reasons.spamPattern');
        result.severity = 'high';
        result.autoAction = 'hide';
      }

      // Log moderation event if flagged
      if (result.flagged) {
        await supabase.from('content_moderation').insert({
          content_id: userId,
          content_type: contentType,
          user_id: userId,
          moderation_action: result.autoAction || 'flag',
          reason: result.reason
        });

        toast({
          title: t('moderation.contentFlagged'),
          description: result.reason,
          variant: 'destructive'
        });
      }

      return result;
    } catch (error) {
      console.error('Content moderation error:', error);
      return { flagged: false };
    } finally {
      setIsChecking(false);
    }
  }, [t, toast]);

  const appealModeration = useCallback(async (
    moderationId: string,
    appealReason: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('content_moderation')
        .update({
          reason: appealReason
        })
        .eq('id', moderationId);

      if (error) throw error;

      toast({
        title: t('moderation.appealSubmitted'),
        description: t('moderation.appealMessage')
      });

      return true;
    } catch (error) {
      console.error('Appeal submission error:', error);
      toast({
        title: t('error.title'),
        description: t('moderation.appealFailed'),
        variant: 'destructive'
      });
      return false;
    }
  }, [t, toast]);

  return {
    moderateContent,
    appealModeration,
    isChecking
  };
};
