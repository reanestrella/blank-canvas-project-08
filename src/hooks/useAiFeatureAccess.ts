import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Single source of truth for AI access checking.
 * canUseAI logic:
 *   church_features.ai_enabled = true
 *   OR (church_features.ai_trial_enabled = true AND now() <= ai_trial_end)
 *   OR user_features.ai_enabled = true
 */
export function useAiFeatureAccess() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);
  const [isTrial, setIsTrial] = useState(false);
  const { currentChurchId, user } = useAuth();
  const { toast } = useToast();

  const checkAccess = useCallback(async () => {
    if (!currentChurchId || !user) {
      setHasAccess(false);
      setIsTrial(false);
      setTrialEnd(null);
      return false;
    }
    setIsChecking(true);
    try {
      const { data: churchFeature } = await supabase
        .from("church_features")
        .select("ai_enabled, ai_trial_enabled, ai_trial_end")
        .eq("church_id", currentChurchId)
        .maybeSingle();

      // Check direct enable
      if (churchFeature?.ai_enabled) {
        setHasAccess(true);
        setIsTrial(false);
        setTrialEnd(null);
        return true;
      }

      // Check active trial
      if (churchFeature?.ai_trial_enabled && churchFeature?.ai_trial_end) {
        const end = new Date(churchFeature.ai_trial_end);
        if (new Date() <= end) {
          setHasAccess(true);
          setIsTrial(true);
          setTrialEnd(churchFeature.ai_trial_end);
          return true;
        }
      }

      // Check user-level feature
      const { data: userFeature } = await supabase
        .from("user_features")
        .select("ai_enabled")
        .eq("user_id", user.id)
        .eq("church_id", currentChurchId)
        .maybeSingle();

      if (userFeature?.ai_enabled) {
        setHasAccess(true);
        setIsTrial(false);
        setTrialEnd(null);
        return true;
      }

      setHasAccess(false);
      setIsTrial(false);
      setTrialEnd(null);
      return false;
    } catch {
      setHasAccess(false);
      setIsTrial(false);
      setTrialEnd(null);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [currentChurchId, user]);

  const showPremiumMessage = () => {
    toast({
      title: "Disponível no Plano Premium",
      description: "Este recurso requer ativação. Fale com o suporte para liberar.",
    });
  };

  return { hasAccess, isChecking, isTrial, trialEnd, checkAccess, showPremiumMessage };
}
