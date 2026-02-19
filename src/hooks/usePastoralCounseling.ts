import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PastoralCounseling {
  id: string;
  church_id: string;
  member_id: string | null;
  counselor_id: string | null;
  session_date: string;
  session_type: string;
  notes: string | null;
  is_private: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCounselingData {
  member_id?: string;
  counselor_id?: string;
  session_date: string;
  session_type: string;
  notes?: string;
  is_private?: boolean;
}

export function usePastoralCounseling(churchId?: string) {
  const [sessions, setSessions] = useState<PastoralCounseling[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = async () => {
    if (!churchId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("pastoral_counseling")
        .select("*")
        .eq("church_id", churchId)
        .order("session_date", { ascending: false });
      if (error) throw error;
      setSessions((data as PastoralCounseling[]) || []);
    } catch (error: any) {
      console.error("Error fetching counseling sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (data: CreateCounselingData) => {
    if (!churchId) return { data: null, error: new Error("No church") };
    try {
      const { data: newItem, error } = await supabase
        .from("pastoral_counseling")
        .insert([{ ...data, church_id: churchId }])
        .select()
        .single();
      if (error) throw error;
      setSessions(prev => [newItem as PastoralCounseling, ...prev]);
      toast({ title: "Sucesso", description: "Atendimento registrado!" });
      return { data: newItem as PastoralCounseling, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { data: null, error };
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const { error } = await supabase.from("pastoral_counseling").delete().eq("id", id);
      if (error) throw error;
      setSessions(prev => prev.filter(s => s.id !== id));
      toast({ title: "Sucesso", description: "Atendimento removido!" });
      return { error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  useEffect(() => { fetchSessions(); }, [churchId]);

  return { sessions, isLoading, createSession, deleteSession, fetchSessions };
}
