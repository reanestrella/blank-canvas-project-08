import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Congregation {
  id: string;
  church_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  is_main: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCongregationData {
  church_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  is_main?: boolean;
}

export function useCongregations(churchId?: string) {
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [selectedCongregation, setSelectedCongregation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCongregations = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("congregations")
        .select("*")
        .eq("is_active", true)
        .order("is_main", { ascending: false })
        .order("name");
      
      if (churchId) {
        query = query.eq("church_id", churchId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setCongregations((data as Congregation[]) || []);
      
      // Set main congregation as default if none selected
      if (!selectedCongregation && data && data.length > 0) {
        const main = data.find((c: any) => c.is_main);
        setSelectedCongregation(main?.id || data[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching congregations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createCongregation = async (data: CreateCongregationData) => {
    try {
      const { data: newCongregation, error } = await supabase
        .from("congregations")
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      
      setCongregations((prev) => [...prev, newCongregation as Congregation]);
      toast({
        title: "Sucesso",
        description: "Congregação cadastrada com sucesso!",
      });
      return { data: newCongregation as Congregation, error: null };
    } catch (error: any) {
      console.error("Error creating congregation:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cadastrar a congregação.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateCongregation = async (id: string, data: Partial<CreateCongregationData>) => {
    try {
      const { data: updatedCongregation, error } = await supabase
        .from("congregations")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      
      setCongregations((prev) =>
        prev.map((c) => (c.id === id ? (updatedCongregation as Congregation) : c))
      );
      toast({
        title: "Sucesso",
        description: "Congregação atualizada com sucesso!",
      });
      return { data: updatedCongregation as Congregation, error: null };
    } catch (error: any) {
      console.error("Error updating congregation:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a congregação.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  useEffect(() => {
    fetchCongregations();
  }, [churchId]);

  return {
    congregations,
    selectedCongregation,
    setSelectedCongregation,
    isLoading,
    fetchCongregations,
    createCongregation,
    updateCongregation,
  };
}
