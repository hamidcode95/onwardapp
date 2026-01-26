import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ShredTaskResult {
  result: string[];
}

interface SuggestActivityResult {
  result: {
    suggestion: string;
    reason: string;
    emoji: string;
  };
}

interface ChatResult {
  result: {
    message: string;
  };
}

interface DecideResult {
  result: {
    choice: string;
    reason: string;
  };
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);

  const shredTask = useCallback(async (task: string): Promise<string[] | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<ShredTaskResult>('ai-assistant', {
        body: { type: 'shred_task', payload: { task } },
      });

      if (error) throw error;
      
      if (Array.isArray(data?.result)) {
        return data.result;
      }
      
      toast({
        title: 'Error',
        description: 'Could not parse AI response',
        variant: 'destructive',
      });
      return null;
    } catch (error) {
      console.error('AI shred error:', error);
      toast({
        title: 'AI Error',
        description: error instanceof Error ? error.message : 'Failed to get AI suggestions',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const suggestActivity = useCallback(async (energyLevel: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<SuggestActivityResult>('ai-assistant', {
        body: { type: 'suggest_activity', payload: { energyLevel } },
      });

      if (error) throw error;
      return data?.result || null;
    } catch (error) {
      console.error('AI suggest error:', error);
      toast({
        title: 'AI Error',
        description: error instanceof Error ? error.message : 'Failed to get suggestion',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const chatWithOly = useCallback(async (message: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<ChatResult>('ai-assistant', {
        body: { type: 'chat', payload: { message } },
      });

      if (error) throw error;
      return data?.result?.message || null;
    } catch (error) {
      console.error('AI chat error:', error);
      toast({
        title: 'AI Error',
        description: error instanceof Error ? error.message : 'Failed to chat',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const decideForMe = useCallback(async (options: { text: string; priority: number }[]) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<DecideResult>('ai-assistant', {
        body: { type: 'decide', payload: { options } },
      });

      if (error) throw error;
      return data?.result || null;
    } catch (error) {
      console.error('AI decide error:', error);
      toast({
        title: 'AI Error',
        description: error instanceof Error ? error.message : 'Failed to decide',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    shredTask,
    suggestActivity,
    chatWithOly,
    decideForMe,
  };
}
