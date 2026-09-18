import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  ADHDAnswer,
  ADHDProfile,
  ADHDProfileScores,
  QUESTIONNAIRE_VERSION,
  calculateProfileScores,
} from '@/lib/adhdProfile';

function scoresToRow(scores: ADHDProfileScores) {
  return {
    attention_score: scores.attention,
    executive_function_score: scores.executive_function,
    task_management_score: scores.task_management,
    hyperactivity_score: scores.hyperactivity,
    impulsivity_score: scores.impulsivity,
    emotional_regulation_score: scores.emotional_regulation,
  };
}

function rowToScores(row: {
  attention_score: number;
  executive_function_score: number;
  task_management_score: number;
  hyperactivity_score: number;
  impulsivity_score: number;
  emotional_regulation_score: number;
}): ADHDProfileScores {
  return {
    attention: row.attention_score,
    executive_function: row.executive_function_score,
    task_management: row.task_management_score,
    hyperactivity: row.hyperactivity_score,
    impulsivity: row.impulsivity_score,
    emotional_regulation: row.emotional_regulation_score,
  };
}

/**
 * Fetches and submits the current user's ADHD Profile.
 *
 * The Journey's "has this user already completed it?" check is sourced
 * from Supabase (a real row in user_adhd_profiles), never from
 * localStorage — so it correctly survives refresh, logout/login, and a
 * different device, per the product requirement.
 */
export function useADHDProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ADHDProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('user_adhd_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile({
      answers: [
        data.question_1, data.question_2, data.question_3, data.question_4, data.question_5,
        data.question_6, data.question_7, data.question_8, data.question_9, data.question_10,
      ] as ADHDAnswer[],
      scores: rowToScores(data),
      questionnaireVersion: data.questionnaire_version as 'v1',
      completedAt: data.completed_at,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const submitProfile = useCallback(
    async (answers: ADHDAnswer[]): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!user) return { ok: false, error: 'Not signed in' };
      if (answers.length !== 10) return { ok: false, error: 'Incomplete questionnaire' };

      const scores = calculateProfileScores(answers);
      const { error } = await supabase.from('user_adhd_profiles').upsert(
        {
          user_id: user.id,
          questionnaire_version: QUESTIONNAIRE_VERSION,
          completed_at: new Date().toISOString(),
          question_1: answers[0], question_2: answers[1], question_3: answers[2],
          question_4: answers[3], question_5: answers[4], question_6: answers[5],
          question_7: answers[6], question_8: answers[7], question_9: answers[8],
          question_10: answers[9],
          ...scoresToRow(scores),
        },
        { onConflict: 'user_id' },
      );

      if (error) return { ok: false, error: error.message };
      await fetchProfile();
      return { ok: true };
    },
    [user, fetchProfile],
  );

  return {
    profile,
    loading,
    hasCompletedProfile: profile !== null,
    submitProfile,
    refresh: fetchProfile,
  };
}
