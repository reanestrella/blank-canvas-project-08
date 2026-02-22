import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useAiFeatureAccess() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { currentChurchId, user } = useAuth();
  const { toast } = useToast();

  const checkAccess = async () => {
    if (!currentChurchId || !user) {
      setHasAccess(false);
      return false;
    }
    setIsChecking(true);
    try {
      const { data: churchFeature } = await supabase
        .from("church_features")
        .select("ai_enabled")
        .eq("church_id", currentChurchId)
        .maybeSingle();

      if (churchFeature?.ai_enabled) {
        setHasAccess(true);
        return true;
      }

      const { data: userFeature } = await supabase
        .from("user_features")
        .select("ai_enabled")
        .eq("user_id", user.id)
        .eq("church_id", currentChurchId)
        .maybeSingle();

      const access = !!userFeature?.ai_enabled;
      setHasAccess(access);
      return access;
    } catch {
      setHasAccess(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const showPremiumMessage = () => {
    toast({
      title: "Recurso Premium",
      description: "Recurso disponível no plano premium.",
      variant: "destructive",
    });
  };

  return { hasAccess, isChecking, checkAccess, showPremiumMessage };
}
