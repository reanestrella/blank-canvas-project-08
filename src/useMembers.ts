import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Member {
  id: string;
  church_id: string;
  congregation_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  gender: "M" | "F" | null;
  marital_status: string | null;
  spiritual_status: "visitante" | "novo_convertido" | "membro" | "lider" | "discipulador";
  baptism_date: string | null;
  baptism_location: string | null;
  conversion_date: string | null;
  notes: string | null;
  photo_url: string | null;
  is_active: boolean;
  network: string | null;
  age_group: string | null;
  wedding_date: string | null;
  pastoral_notes: string | null;
  last_attendance_date: string | null;
  inactivity_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMemberData {
  full_name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  city?: string;
  state?: string;
  gender?: "M" | "F";
  marital_status?: string;
  spiritual_status?: Member["spiritual_status"];
  baptism_date?: string;
  baptism_location?: string;
  conversion_date?: string;
  notes?: string;
  congregation_id?: string;
  network?: string;
  age_group?: string;
  wedding_date?: string;
  pastoral_notes?: string;
  is_active?: boolean;
}

export function useMembers(churchId?: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("members")
        .select("*")
        .order("full_name");
      
      if (churchId) {
        query = query.eq("church_id", churchId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setMembers((data as Member[]) || []);
    } catch (error: any) {
      console.error("Error fetching members:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os membros.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createMember = async (data: CreateMemberData & { church_id: string }) => {
    try {
      const { data: newMember, error } = await supabase
        .from("members")
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      
      setMembers((prev) => [...prev, newMember as Member]);
      toast({
        title: "Sucesso",
        description: "Membro cadastrado com sucesso!",
      });
      return { data: newMember as Member, error: null };
    } catch (error: any) {
      console.error("Error creating member:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cadastrar o membro.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateMember = async (id: string, data: Partial<CreateMemberData>) => {
    try {
      const { data: updatedMember, error } = await supabase
        .from("members")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? (updatedMember as Member) : m))
      );
      toast({
        title: "Sucesso",
        description: "Membro atualizado com sucesso!",
      });
      return { data: updatedMember as Member, error: null };
    } catch (error: any) {
      console.error("Error updating member:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o membro.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const { error } = await supabase.from("members").delete().eq("id", id);
      
      if (error) throw error;
      
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast({
        title: "Sucesso",
        description: "Membro removido com sucesso!",
      });
      return { error: null };
    } catch (error: any) {
      console.error("Error deleting member:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o membro.",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [churchId]);

  return {
    members,
    isLoading,
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
  };
}
