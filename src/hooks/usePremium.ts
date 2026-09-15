import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SubscriptionInfo {
  plan: 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'expired';
  currentPeriodEnd: string | null;
}

export function usePremium() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();

    setSubscription(
      data
        ? {
            plan: data.plan as 'monthly' | 'yearly' | 'lifetime',
            status: data.status as 'active' | 'expired',
            currentPeriodEnd: data.current_period_end,
          }
        : null,
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPremium = Boolean(
    subscription &&
      subscription.status === 'active' &&
      (subscription.plan === 'lifetime' ||
        (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > new Date())),
  );

  return { subscription, isPremium, loading, refresh };
}
