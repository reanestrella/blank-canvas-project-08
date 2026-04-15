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
  });

  const isSubscribed = query.data?.status === "ativo";

  return {
    ...query,
    isSubscribed,
    subscription: query.data,
  };
}
