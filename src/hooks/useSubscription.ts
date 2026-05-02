import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Subscription {
  id: string;
  church_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  price_id: string | null;
  plan: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  trial: boolean | null;
  trial_ends_at: string | null;
  is_gift?: boolean | null;
  due_date?: string | null;
  grace_period_days?: number | null;
  provider?: string | null;
}

export function useSubscription() {
  const { currentChurchId } = useAuth();

  const query = useQuery({
    queryKey: ["subscription", currentChurchId],
    queryFn: async () => {
      if (!currentChurchId) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("church_id", currentChurchId)
        .maybeSingle();
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!currentChurchId,
    refetchInterval: 1000 * 60 * 5,
  });

  const sub = query.data;
  const now = Date.now();
  const trialEndsAt = sub?.trial_ends_at ? new Date(sub.trial_ends_at).getTime() : null;

  // Gift libera acesso sem checagem de vencimento
  const isGift = sub?.is_gift === true;

  // Trial ainda válido
  const isTrial =
    !!sub &&
    sub.trial === true &&
    sub.status === "trial" &&
    trialEndsAt !== null &&
    trialEndsAt > now;

  // Pago/ativo (mantém compat com 'ativo' do webhook + 'active' do prompt)
  const isPaid = sub?.status === "ativo" || sub?.status === "active";

  // Cálculo de bloqueio por vencimento + grace period
  const grace = sub?.grace_period_days ?? 3;
  const dueDateMs = sub?.due_date ? new Date(sub.due_date + "T23:59:59").getTime() : null;
  const graceUntil = dueDateMs ? dueDateMs + grace * 24 * 60 * 60 * 1000 : null;
  const overdue = !isGift && dueDateMs !== null && now > (graceUntil ?? dueDateMs);

  // Trial expirou
  const isExpired =
    sub?.status === "expired" ||
    (sub?.trial === true &&
      sub?.status === "trial" &&
      trialEndsAt !== null &&
      trialEndsAt <= now) ||
    (overdue && !isPaid);

  // Acesso ativo final
  const isActive = isGift || (isPaid && !overdue);

  // Acesso liberado: ativo OU trial vigente
  const isSubscribed = isActive || isTrial;

  const trialDaysLeft =
    isTrial && trialEndsAt !== null
      ? Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24)))
      : 0;

  const trialHoursLeft =
    isTrial && trialEndsAt !== null
      ? Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60)))
      : 0;

  return {
    ...query,
    subscription: sub,
    isSubscribed,
    isTrial,
    isExpired,
    isActive,
    isGift,
    trialDaysLeft,
    trialHoursLeft,
    trialEndsAt: sub?.trial_ends_at ?? null,
  };
}
