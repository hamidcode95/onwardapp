import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PlanId = 'monthly' | 'yearly' | 'lifetime';

interface VerifyCryptoResult {
  result: {
    plan: PlanId;
    currentPeriodEnd: string | null;
  };
}

export function useCryptoPayment() {
  const [isVerifying, setIsVerifying] = useState(false);

  const verify = useCallback(
    async (txHash: string, plan: PlanId): Promise<{ ok: true } | { ok: false; error: string }> => {
      setIsVerifying(true);
      try {
        const { data, error } = await supabase.functions.invoke<VerifyCryptoResult>('crypto-verify', {
          body: { txHash, plan },
        });

        if (error) {
          // FunctionsHttpError's `context` is the raw fetch Response object
          // (not pre-parsed JSON) — read the Edge Function's own
          // { error: "..." } body out of it so the user sees the specific
          // reason (wrong network, already used, amount too low, etc.)
          // instead of a generic failure message.
          const context = (error as { context?: Response }).context;
          if (context && typeof context.json === 'function') {
            try {
              const body = await context.json();
              if (typeof body?.error === 'string') return { ok: false, error: body.error };
            } catch {
              // Response body wasn't JSON (or already consumed) — fall
              // through to the generic message below.
            }
          }
          return { ok: false, error: error.message ?? 'Something went wrong. Please try again.' };
        }
        if (!data?.result) {
          return { ok: false, error: 'Something went wrong. Please try again.' };
        }
        return { ok: true };
      } catch {
        return { ok: false, error: 'Something went wrong. Please try again.' };
      } finally {
        setIsVerifying(false);
      }
    },
    [],
  );

  return { verify, isVerifying };
}
