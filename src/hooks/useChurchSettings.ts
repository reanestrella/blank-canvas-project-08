import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface ChurchSettings {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  plan: string;
}

export interface UpdateChurchData {
  name?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  logo_url?: string;
}

export function useChurchSettings() {
  const [church, setChurch] = useState<ChurchSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const fetchChurch = async () => {
    if (!profile?.church_id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("churches")
        .select("*")
        .eq("id", profile.church_id)
        .single();

      if (error) throw error;
      setChurch(data as ChurchSettings);
    } catch (error: any) {
      console.error("Error fetching church:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateChurch = async (data: UpdateChurchData) => {
    if (!profile?.church_id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para atualizar a igreja.",
        variant: "destructive",
      });
      return { error: new Error("Not authenticated") };
    }

    try {
      setIsSaving(true);
      const { data: updatedChurch, error } = await supabase
        .from("churches")
        .update(data)
        .eq("id", profile.church_id)
        .select()
        .single();

      if (error) throw error;

      setChurch(updatedChurch as ChurchSettings);
      toast({
        title: "Sucesso",
        description: "Dados da igreja atualizados com sucesso!",
      });
      
      return { data: updatedChurch, error: null };
    } catch (error: any) {
      console.error("Error updating church:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar os dados.",
        variant: "destructive",
      });
      return { error };
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchChurch();
  }, [profile?.church_id]);

  return {
    church,
    isLoading,
    isSaving,
    fetchChurch,
    updateChurch,
  };
}
