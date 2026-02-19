import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MinistryVolunteer {
  id: string;
  ministry_id: string;
  member_id: string;
  joined_at: string;
  member?: {
    id: string;
    full_name: string;
    phone: string | null;
  };
}

export function useMinistryVolunteers(ministryId?: string) {
  const [volunteers, setVolunteers] = useState<MinistryVolunteer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchVolunteers = async () => {
    if (!ministryId) {
      setVolunteers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("ministry_volunteers")
        .select(`
          *,
          member:members(id, full_name, phone)
        `)
        .eq("ministry_id", ministryId)
        .order("joined_at", { ascending: false });

      if (error) throw error;
      setVolunteers(data || []);
    } catch (error: any) {
      console.error("Error fetching volunteers:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os voluntários.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addVolunteer = async (memberId: string) => {
    if (!ministryId) return { error: new Error("Ministry ID required") };

    try {
      const { data, error } = await supabase
        .from("ministry_volunteers")
        .insert([{ ministry_id: ministryId, member_id: memberId }])
        .select(`
          *,
          member:members(id, full_name, phone)
        `)
        .single();

      if (error) throw error;

      setVolunteers((prev) => [data, ...prev]);
      toast({
        title: "Sucesso",
        description: "Voluntário adicionado com sucesso!",
      });
      return { data, error: null };
    } catch (error: any) {
      console.error("Error adding volunteer:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar o voluntário.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const removeVolunteer = async (volunteerId: string) => {
    try {
      const { error } = await supabase
        .from("ministry_volunteers")
        .delete()
        .eq("id", volunteerId);

      if (error) throw error;

      setVolunteers((prev) => prev.filter((v) => v.id !== volunteerId));
      toast({
        title: "Sucesso",
        description: "Voluntário removido com sucesso!",
      });
      return { error: null };
    } catch (error: any) {
      console.error("Error removing volunteer:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o voluntário.",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, [ministryId]);

  return {
    volunteers,
    isLoading,
    fetchVolunteers,
    addVolunteer,
    removeVolunteer,
  };
}
