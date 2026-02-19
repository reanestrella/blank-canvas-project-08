import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PastoralVisit {
  id: string;
  church_id: string;
  member_id: string | null;
  visitor_id: string | null;
  visit_date: string;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePastoralVisitData {
  member_id?: string;
  visitor_id?: string;
  visit_date: string;
  reason?: string;
  notes?: string;
}

export function usePastoralVisits(churchId?: string) {
  const [visits, setVisits] = useState<PastoralVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchVisits = async () => {
    if (!churchId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("pastoral_visits")
        .select("*")
        .eq("church_id", churchId)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      setVisits((data as PastoralVisit[]) || []);
    } catch (error: any) {
      console.error("Error fetching pastoral visits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createVisit = async (data: CreatePastoralVisitData) => {
    if (!churchId) return { data: null, error: new Error("No church") };
    try {
      const { data: newItem, error } = await supabase
        .from("pastoral_visits")
        .insert([{ ...data, church_id: churchId }])
        .select()
        .single();
      if (error) throw error;
      setVisits(prev => [newItem as PastoralVisit, ...prev]);
      toast({ title: "Sucesso", description: "Visita registrada!" });
      return { data: newItem as PastoralVisit, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { data: null, error };
    }
  };

  const deleteVisit = async (id: string) => {
    try {
      const { error } = await supabase.from("pastoral_visits").delete().eq("id", id);
      if (error) throw error;
      setVisits(prev => prev.filter(v => v.id !== id));
      toast({ title: "Sucesso", description: "Visita removida!" });
      return { error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  useEffect(() => { fetchVisits(); }, [churchId]);

  return { visits, isLoading, createVisit, deleteVisit, fetchVisits };
}
