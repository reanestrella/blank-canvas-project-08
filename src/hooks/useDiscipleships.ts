import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Discipleship {
  id: string;
  church_id: string;
  discipler_id: string | null;
  disciple_id: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDiscipleshipData {
  disciple_id: string;
  discipler_id?: string;
  start_date?: string;
  status?: string;
  notes?: string;
}

export function useDiscipleships(churchId?: string) {
  const [discipleships, setDiscipleships] = useState<Discipleship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDiscipleships = async () => {
    if (!churchId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("discipleships")
        .select("*")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDiscipleships((data as Discipleship[]) || []);
    } catch (error: any) {
      console.error("Error fetching discipleships:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDiscipleship = async (data: CreateDiscipleshipData) => {
    if (!churchId) return { data: null, error: new Error("No church") };
    try {
      const { data: newItem, error } = await supabase
        .from("discipleships")
        .insert([{ ...data, church_id: churchId }])
        .select()
        .single();
      if (error) throw error;
      setDiscipleships(prev => [newItem as Discipleship, ...prev]);
      toast({ title: "Sucesso", description: "Discipulado registrado!" });
      return { data: newItem as Discipleship, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { data: null, error };
    }
  };

  const updateDiscipleship = async (id: string, data: Partial<CreateDiscipleshipData>) => {
    try {
      const { data: updated, error } = await supabase
        .from("discipleships")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      setDiscipleships(prev => prev.map(d => d.id === id ? (updated as Discipleship) : d));
      toast({ title: "Sucesso", description: "Discipulado atualizado!" });
      return { data: updated as Discipleship, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { data: null, error };
    }
  };

  const deleteDiscipleship = async (id: string) => {
    try {
      const { error } = await supabase.from("discipleships").delete().eq("id", id);
      if (error) throw error;
      setDiscipleships(prev => prev.filter(d => d.id !== id));
      toast({ title: "Sucesso", description: "Discipulado removido!" });
      return { error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  useEffect(() => { fetchDiscipleships(); }, [churchId]);

  return { discipleships, isLoading, createDiscipleship, updateDiscipleship, deleteDiscipleship, fetchDiscipleships };
}
