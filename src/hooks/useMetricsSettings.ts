import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Reads/writes the church-level "ignore imported members in metrics" flag.
 * Default: true (imported members do NOT count as visitors).
 */
export function useMetricsSettings() {
  const { currentChurchId } = useAuth();
  const [ignoreImported, setIgnoreImported] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetch = useCallback(async () => {
    if (!currentChurchId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data } = await supabase
      .from("church_settings")
      .select("ignore_imported_in_metrics")
      .eq("church_id", currentChurchId)
      .maybeSingle();
    if (data && typeof (data as any).ignore_imported_in_metrics === "boolean") {
      setIgnoreImported((data as any).ignore_imported_in_metrics);
    }
    setIsLoading(false);
  }, [currentChurchId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const update = useCallback(
    async (next: boolean) => {
      if (!currentChurchId) return;
      setIsSaving(true);
      // Upsert by church_id
      const { data: existing } = await supabase
        .from("church_settings")
        .select("id")
        .eq("church_id", currentChurchId)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from("church_settings")
          .update({ ignore_imported_in_metrics: next } as any)
          .eq("id", existing.id);
      } else {
        await supabase
          .from("church_settings")
          .insert({ church_id: currentChurchId, ignore_imported_in_metrics: next } as any);
      }
      setIgnoreImported(next);
      setIsSaving(false);
    },
    [currentChurchId],
  );

  return { ignoreImported, isLoading, isSaving, update };
}
