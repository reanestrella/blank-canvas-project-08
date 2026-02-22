import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AiAlert {
  id: string;
  member_id: string;
  risk_level: string;
  message: string | null;
  last_attendance_date: string | null;
  days_absent: number | null;
  created_at: string;
  resolved: boolean;
  member?: { full_name: string };
}

export function useAiAlerts() {
  const [alerts, setAlerts] = useState<AiAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const { currentChurchId, session } = useAuth();
  const { toast } = useToast();

  const fetchAlerts = async () => {
    if (!currentChurchId) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("ai_member_alerts")
        .select("*, member:members(full_name)")
        .eq("church_id", currentChurchId)
        .eq("resolved", false)
        .order("days_absent", { ascending: false });
      setAlerts((data as any[]) || []);
    } catch (e) {
      console.error("Error fetching AI alerts:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const detectAbsent = async () => {
    if (!currentChurchId || !session?.access_token) return;
    setIsDetecting(true);
    try {
      const resp = await supabase.functions.invoke("ai-detect-absent", {
        body: { church_id: currentChurchId },
      });

      if (resp.error) {
        const errBody = typeof resp.error === "object" ? resp.error : { message: String(resp.error) };
        if ((errBody as any).context?.status === 403) {
          toast({ title: "Recurso Premium", description: "Recurso disponível no plano premium.", variant: "destructive" });
          return;
        }
        if ((errBody as any).context?.status === 429) {
          toast({ title: "Limite atingido", description: "Limite diário de uso do assistente atingido.", variant: "destructive" });
          return;
        }
        throw resp.error;
      }

      await fetchAlerts();
      const total = resp.data?.total || 0;
      toast({ title: "Análise concluída", description: `${total} alerta(s) detectado(s).` });
    } catch (e: any) {
      console.error("Error detecting absent members:", e);
      toast({ title: "Erro", description: "Não foi possível executar a análise no momento.", variant: "destructive" });
    } finally {
      setIsDetecting(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    await supabase.from("ai_member_alerts").update({ resolved: true }).eq("id", alertId);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  return { alerts, isLoading, isDetecting, fetchAlerts, detectAbsent, resolveAlert };
}
