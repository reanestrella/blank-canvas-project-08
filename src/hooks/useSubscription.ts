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
    refetchInterval: 1000 * 60 * 5, // re-checa a cada 5 min para detectar expiração
  });

  const sub = query.data;
  const now = Date.now();
  const trialEndsAt = sub?.trial_ends_at ? new Date(sub.trial_ends_at).getTime() : null;

  // Trial ainda válido
  const isTrial =
    !!sub &&
    sub.trial === true &&
    sub.status === "trial" &&
    trialEndsAt !== null &&
    trialEndsAt > now;

  // Trial expirou (status pode ainda estar como 'trial' antes do cron rodar)
  const isExpired =
    sub?.status === "expired" ||
    (sub?.trial === true &&
      sub?.status === "trial" &&
      trialEndsAt !== null &&
      trialEndsAt <= now);

  // Assinatura paga ativa
  const isActive = sub?.status === "ativo";

  // Acesso liberado: pago OU trial vigente
  const isSubscribed = isActive || isTrial;

  // Dias restantes do trial (arredondado para cima)
  const trialDaysLeft =
    isTrial && trialEndsAt !== null
      ? Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24)))
      : 0;

  // Horas restantes (para alerta no último dia)
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
    trialDaysLeft,
    trialHoursLeft,
    trialEndsAt: sub?.trial_ends_at ?? null,
  };
}
