import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MinistryRole {
  id: string;
  church_id: string;
  ministry_id: string;
  name: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface MinistryRoleMember {
  id: string;
  church_id: string;
  ministry_role_id: string;
  member_id: string;
  is_active: boolean;
  created_at: string;
}

export function useMinistryRoles(ministryId?: string, churchId?: string) {
  const [roles, setRoles] = useState<MinistryRole[]>([]);
  const [roleMembers, setRoleMembers] = useState<MinistryRoleMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchRoles = async () => {
    if (!ministryId || !churchId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ministry_roles" as any)
        .select("*")
        .eq("ministry_id", ministryId)
        .eq("church_id", churchId)
        .order("sort_order");
      if (error) throw error;
      setRoles((data as any[] || []) as MinistryRole[]);
    } catch (e: any) {
      console.error("Error fetching ministry roles:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoleMembers = async () => {
    if (!churchId || roles.length === 0) return;
    try {
      const roleIds = roles.map(r => r.id);
      const { data, error } = await supabase
        .from("ministry_role_members" as any)
        .select("*")
        .in("ministry_role_id", roleIds)
        .eq("church_id", churchId)
        .eq("is_active", true);
      if (error) throw error;
      setRoleMembers((data as any[] || []) as MinistryRoleMember[]);
    } catch (e: any) {
      console.error("Error fetching role members:", e);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [ministryId, churchId]);

  useEffect(() => {
    if (roles.length > 0) fetchRoleMembers();
    else setRoleMembers([]);
  }, [roles]);

  const createRole = async (name: string, icon: string) => {
    if (!ministryId || !churchId) return;
    try {
      const { data, error } = await supabase
        .from("ministry_roles" as any)
        .insert([{ ministry_id: ministryId, church_id: churchId, name, icon, sort_order: roles.length }] as any)
        .select()
        .single();
      if (error) throw error;
      setRoles(prev => [...prev, data as any as MinistryRole]);
      toast({ title: "Função criada!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const updateRole = async (id: string, name: string, icon: string) => {
    try {
      const { error } = await supabase
        .from("ministry_roles" as any)
        .update({ name, icon } as any)
        .eq("id", id);
      if (error) throw error;
      setRoles(prev => prev.map(r => r.id === id ? { ...r, name, icon } : r));
      toast({ title: "Função atualizada!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const deleteRole = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ministry_roles" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      setRoles(prev => prev.filter(r => r.id !== id));
      setRoleMembers(prev => prev.filter(rm => rm.ministry_role_id !== id));
      toast({ title: "Função removida!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const addMember = async (roleId: string, memberId: string) => {
    if (!churchId) return;
    try {
      const { data, error } = await supabase
        .from("ministry_role_members" as any)
        .insert([{ ministry_role_id: roleId, member_id: memberId, church_id: churchId }] as any)
        .select()
        .single();
      if (error) throw error;
      setRoleMembers(prev => [...prev, data as any as MinistryRoleMember]);
      toast({ title: "Membro adicionado à função!" });
    } catch (e: any) {
      if (e.message?.includes("duplicate")) {
        toast({ title: "Atenção", description: "Membro já está nesta função.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: e.message, variant: "destructive" });
      }
    }
  };

  const removeMember = async (roleMemberId: string) => {
    try {
      const { error } = await supabase
        .from("ministry_role_members" as any)
        .delete()
        .eq("id", roleMemberId);
      if (error) throw error;
      setRoleMembers(prev => prev.filter(rm => rm.id !== roleMemberId));
      toast({ title: "Membro removido da função!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return {
    roles,
    roleMembers,
    isLoading,
    createRole,
    updateRole,
    deleteRole,
    addMember,
    removeMember,
    fetchRoles,
  };
}
