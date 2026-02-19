import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Ministry {
  id: string;
  church_id: string;
  name: string;
  description: string | null;
  leader_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateMinistryData {
  name: string;
  description?: string;
  leader_id?: string;
}

export function useMinistries(churchId?: string) {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMinistries = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("ministries")
        .select("*")
        .order("name");
      
      if (churchId) {
        query = query.eq("church_id", churchId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setMinistries((data as Ministry[]) || []);
    } catch (error: any) {
      console.error("Error fetching ministries:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os ministérios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createMinistry = async (data: CreateMinistryData & { church_id: string }) => {
    try {
      const { data: newMinistry, error } = await supabase
        .from("ministries")
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      
      setMinistries((prev) => [...prev, newMinistry as Ministry]);
      toast({
        title: "Sucesso",
        description: "Ministério criado com sucesso!",
      });
      return { data: newMinistry as Ministry, error: null };
    } catch (error: any) {
      console.error("Error creating ministry:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o ministério.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateMinistry = async (id: string, data: Partial<CreateMinistryData>) => {
    try {
      const { data: updatedMinistry, error } = await supabase
        .from("ministries")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      
      setMinistries((prev) =>
        prev.map((m) => (m.id === id ? (updatedMinistry as Ministry) : m))
      );
      toast({
        title: "Sucesso",
        description: "Ministério atualizado com sucesso!",
      });
      return { data: updatedMinistry as Ministry, error: null };
    } catch (error: any) {
      console.error("Error updating ministry:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o ministério.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteMinistry = async (id: string) => {
    try {
      const { error } = await supabase.from("ministries").delete().eq("id", id);
      
      if (error) throw error;
      
      setMinistries((prev) => prev.filter((m) => m.id !== id));
      toast({
        title: "Sucesso",
        description: "Ministério removido com sucesso!",
      });
      return { error: null };
    } catch (error: any) {
      console.error("Error deleting ministry:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o ministério.",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchMinistries();
  }, [churchId]);

  return {
    ministries,
    isLoading,
    fetchMinistries,
    createMinistry,
    updateMinistry,
    deleteMinistry,
  };
}
