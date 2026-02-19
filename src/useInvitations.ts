import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Invitation {
  id: string;
  church_id: string;
  email: string;
  role: "pastor" | "tesoureiro" | "secretario" | "lider_celula" | "lider_ministerio" | "consolidacao" | "membro";
  token: string;
  invited_by: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface CreateInvitationData {
  email: string;
  role: Invitation["role"];
  full_name?: string;
  congregation_id?: string;
  member_id?: string;
}

export function useInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const fetchInvitations = async () => {
    if (!profile?.church_id) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await (supabase
        .from("invitations" as any)
        .select("*")
        .eq("church_id", profile.church_id)
        .order("created_at", { ascending: false }) as any);
      
      if (error) throw error;
      setInvitations((data as Invitation[]) || []);
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createInvitation = async (data: CreateInvitationData) => {
    if (!profile?.church_id || !user?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para enviar convites.",
        variant: "destructive",
      });
      return { data: null, error: new Error("Not authenticated") };
    }

    try {
      // Build invitation data with optional fields
      const invitationData: Record<string, any> = {
        email: data.email,
        role: data.role,
        church_id: profile.church_id,
        invited_by: user.id,
      };
      
      // Add optional fields if provided
      if (data.full_name) {
        invitationData.full_name = data.full_name;
      }
      if (data.congregation_id && data.congregation_id !== "_all") {
        invitationData.congregation_id = data.congregation_id;
      }
      if (data.member_id) {
        invitationData.member_id = data.member_id;
      }

      const { data: newInvitation, error } = await (supabase
        .from("invitations" as any)
        .insert([invitationData])
        .select()
        .single() as any);
      
      if (error) throw error;
      
      setInvitations((prev) => [newInvitation as Invitation, ...prev]);
      toast({
        title: "Convite criado!",
        description: `Link de convite gerado para ${data.email}.`,
      });
      return { data: newInvitation as Invitation, error: null };
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o convite.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteInvitation = async (id: string) => {
    try {
      const { error } = await (supabase
        .from("invitations" as any)
        .delete()
        .eq("id", id) as any);
      
      if (error) throw error;
      
      setInvitations((prev) => prev.filter((i) => i.id !== id));
      toast({
        title: "Convite cancelado",
        description: "O convite foi removido com sucesso.",
      });
      return { error: null };
    } catch (error: any) {
      console.error("Error deleting invitation:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cancelar o convite.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const getInvitationByToken = async (token: string) => {
    try {
      const { data, error } = await (supabase
        .from("invitations" as any)
        .select("*, churches(name)")
        .eq("token", token)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .single() as any);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Error fetching invitation:", error);
      return { data: null, error };
    }
  };

  const markInvitationAsUsed = async (token: string) => {
    try {
      const { error } = await (supabase
        .from("invitations" as any)
        .update({ used_at: new Date().toISOString() })
        .eq("token", token) as any);
      
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error("Error marking invitation as used:", error);
      return { error };
    }
  };

  const getInviteLink = (token: string) => {
    return `${window.location.origin}/convite/${token}`;
  };

  useEffect(() => {
    if (profile?.church_id) {
      fetchInvitations();
    }
  }, [profile?.church_id]);

  return {
    invitations,
    isLoading,
    fetchInvitations,
    createInvitation,
    deleteInvitation,
    getInvitationByToken,
    markInvitationAsUsed,
    getInviteLink,
  };
}
