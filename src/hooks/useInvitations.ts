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
  full_name?: string | null;
  congregation_id?: string | null;
  member_id?: string | null;
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
      // Use RPC reissue_invitation to create/reissue invitation
      const { data: newInvitation, error } = await supabase.rpc(
        "reissue_invitation" as any,
        {
          p_church_id: profile.church_id,
          p_email: data.email,
          p_full_name: data.full_name || null,
          p_role: data.role,
          p_congregation_id: (data.congregation_id && data.congregation_id !== "_all") ? data.congregation_id : null,
          p_member_id: data.member_id || null,
          p_invited_by: user.id,
        } as any
      );
      
      if (error) {
        console.error("Error in reissue_invitation RPC:", error);
        throw error;
      }
      
      const invitation = newInvitation as unknown as Invitation;
      
      // Refresh list to get updated data
      await fetchInvitations();
      
      toast({
        title: "Convite criado!",
        description: `Link de convite gerado para ${data.email}.`,
      });
      return { data: invitation, error: null };
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
      // Use validate_invitation RPC for server-side validation
      const { data, error } = await supabase.rpc("validate_invitation" as any, {
        p_token: token,
      } as any);

      if (error) {
        console.error("Error in validate_invitation RPC:", error);
        throw error;
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return { data: null, error: new Error("Convite inválido, expirado ou já utilizado.") };
      }

      const invitation = Array.isArray(data) ? data[0] : data;
      return { data: invitation, error: null };
    } catch (error: any) {
      console.error("Error fetching invitation:", error);
      return { data: null, error };
    }
  };

  const markInvitationAsUsed = async (token: string) => {
    try {
      const { error } = await supabase.rpc("mark_invitation_used" as any, {
        p_token: token,
      } as any);
      
      if (error) {
        console.error("Error in mark_invitation_used RPC:", error);
        throw error;
      }
      return { error: null };
    } catch (error: any) {
      console.error("Error marking invitation as used:", error);
      return { error };
    }
  };

  const getInviteLink = (token: string) => {
    const baseUrl = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
    return `${baseUrl}/convite/${token}`;
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
