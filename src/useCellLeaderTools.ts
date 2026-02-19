import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Types for Cell Leader Tools
export interface CellPrayerRequest {
  id: string;
  cell_id: string;
  church_id: string;
  member_id: string | null;
  request: string;
  is_answered: boolean;
  answered_at: string | null;
  leader_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member?: { full_name: string } | null;
}

export interface CellPastoralCare {
  id: string;
  cell_id: string;
  church_id: string;
  member_id: string;
  care_type: "visita" | "ligacao" | "mensagem" | "oracao" | "outro";
  notes: string | null;
  care_date: string;
  created_by: string | null;
  created_at: string;
  member?: { full_name: string } | null;
}

export interface CellVisitor {
  id: string;
  cell_id: string;
  church_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  visit_date: string;
  invited_by: string | null;
  accepted_christ: boolean;
  follow_up_status: "pendente" | "em_acompanhamento" | "integrado" | "desistente";
  notes: string | null;
  created_at: string;
  updated_at: string;
  inviter?: { full_name: string } | null;
}

export interface CellLeadershipDevelopment {
  id: string;
  cell_id: string;
  church_id: string;
  member_id: string;
  potential_level: "identificado" | "em_treinamento" | "pronto" | "lancado";
  notes: string | null;
  identified_at: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  member?: { full_name: string } | null;
}

export function useCellLeaderTools(cellId?: string, churchId?: string) {
  const [prayerRequests, setPrayerRequests] = useState<CellPrayerRequest[]>([]);
  const [pastoralCare, setPastoralCare] = useState<CellPastoralCare[]>([]);
  const [visitors, setVisitors] = useState<CellVisitor[]>([]);
  const [leadershipDev, setLeadershipDev] = useState<CellLeadershipDevelopment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch Prayer Requests
  const fetchPrayerRequests = async () => {
    if (!cellId) return;
    try {
      const { data, error } = await supabase
        .from("cell_prayer_requests")
        .select("*, member:members(full_name)")
        .eq("cell_id", cellId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPrayerRequests((data as CellPrayerRequest[]) || []);
    } catch (error) {
      console.error("Error fetching prayer requests:", error);
    }
  };

  // Fetch Pastoral Care
  const fetchPastoralCare = async () => {
    if (!cellId) return;
    try {
      const { data, error } = await supabase
        .from("cell_pastoral_care")
        .select("*, member:members(full_name)")
        .eq("cell_id", cellId)
        .order("care_date", { ascending: false });
      if (error) throw error;
      setPastoralCare((data as CellPastoralCare[]) || []);
    } catch (error) {
      console.error("Error fetching pastoral care:", error);
    }
  };

  // Fetch Visitors
  const fetchVisitors = async () => {
    if (!cellId) return;
    try {
      const { data, error } = await supabase
        .from("cell_visitors")
        .select("*, inviter:members!cell_visitors_invited_by_fkey(full_name)")
        .eq("cell_id", cellId)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      setVisitors((data as CellVisitor[]) || []);
    } catch (error) {
      console.error("Error fetching visitors:", error);
    }
  };

  // Fetch Leadership Development
  const fetchLeadershipDev = async () => {
    if (!cellId) return;
    try {
      const { data, error } = await supabase
        .from("cell_leadership_development")
        .select("*, member:members(full_name)")
        .eq("cell_id", cellId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLeadershipDev((data as CellLeadershipDevelopment[]) || []);
    } catch (error) {
      console.error("Error fetching leadership development:", error);
    }
  };

  // Create Prayer Request
  const createPrayerRequest = async (data: { request: string; member_id?: string }) => {
    if (!cellId || !churchId) return { error: new Error("Missing cell or church") };
    try {
      const { data: newRequest, error } = await supabase
        .from("cell_prayer_requests")
        .insert([{ ...data, cell_id: cellId, church_id: churchId }])
        .select("*, member:members(full_name)")
        .single();
      if (error) throw error;
      setPrayerRequests((prev) => [newRequest as CellPrayerRequest, ...prev]);
      toast({ title: "Pedido de oração registrado!" });
      return { data: newRequest, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  // Toggle Prayer Answered
  const togglePrayerAnswered = async (id: string, isAnswered: boolean) => {
    try {
      const { error } = await supabase
        .from("cell_prayer_requests")
        .update({
          is_answered: isAnswered,
          answered_at: isAnswered ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
      setPrayerRequests((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, is_answered: isAnswered, answered_at: isAnswered ? new Date().toISOString() : null }
            : p
        )
      );
      toast({ title: isAnswered ? "Oração respondida! 🙏" : "Marcado como pendente" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  // Create Pastoral Care
  const createPastoralCare = async (data: { member_id: string; care_type: CellPastoralCare["care_type"]; notes?: string }) => {
    if (!cellId || !churchId) return { error: new Error("Missing cell or church") };
    try {
      const { data: newCare, error } = await supabase
        .from("cell_pastoral_care")
        .insert([{ ...data, cell_id: cellId, church_id: churchId }])
        .select("*, member:members(full_name)")
        .single();
      if (error) throw error;
      setPastoralCare((prev) => [newCare as CellPastoralCare, ...prev]);
      toast({ title: "Cuidado pastoral registrado!" });
      return { data: newCare, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  // Create Visitor
  const createVisitor = async (data: { full_name: string; phone?: string; email?: string; visit_date?: string; invited_by?: string; accepted_christ?: boolean; notes?: string }) => {
    if (!cellId || !churchId) return { error: new Error("Missing cell or church") };
    try {
      const { data: newVisitor, error } = await supabase
        .from("cell_visitors")
        .insert([{ ...data, cell_id: cellId, church_id: churchId }])
        .select()
        .single();
      if (error) throw error;
      setVisitors((prev) => [newVisitor as CellVisitor, ...prev]);
      toast({ title: "Visitante registrado!" });
      return { data: newVisitor, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  // Update Visitor Status
  const updateVisitorStatus = async (id: string, status: CellVisitor["follow_up_status"]) => {
    try {
      const { error } = await supabase
        .from("cell_visitors")
        .update({ follow_up_status: status })
        .eq("id", id);
      if (error) throw error;
      setVisitors((prev) => prev.map((v) => (v.id === id ? { ...v, follow_up_status: status } : v)));
      toast({ title: "Status atualizado!" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  // Create Leadership Development
  const createLeadershipDev = async (data: { member_id: string; potential_level?: CellLeadershipDevelopment["potential_level"]; notes?: string }) => {
    if (!cellId || !churchId) return { error: new Error("Missing cell or church") };
    try {
      const { data: newDev, error } = await supabase
        .from("cell_leadership_development")
        .insert([{ ...data, cell_id: cellId, church_id: churchId }])
        .select("*, member:members(full_name)")
        .single();
      if (error) throw error;
      setLeadershipDev((prev) => [newDev as CellLeadershipDevelopment, ...prev]);
      toast({ title: "Líder em potencial identificado!" });
      return { data: newDev, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  // Update Leadership Level
  const updateLeadershipLevel = async (id: string, level: CellLeadershipDevelopment["potential_level"]) => {
    try {
      const { error } = await supabase
        .from("cell_leadership_development")
        .update({ potential_level: level })
        .eq("id", id);
      if (error) throw error;
      setLeadershipDev((prev) => prev.map((l) => (l.id === id ? { ...l, potential_level: level } : l)));
      toast({ title: "Nível atualizado!" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (cellId) {
      setIsLoading(true);
      Promise.all([fetchPrayerRequests(), fetchPastoralCare(), fetchVisitors(), fetchLeadershipDev()]).finally(() =>
        setIsLoading(false)
      );
    }
  }, [cellId]);

  return {
    prayerRequests,
    pastoralCare,
    visitors,
    leadershipDev,
    isLoading,
    createPrayerRequest,
    togglePrayerAnswered,
    createPastoralCare,
    createVisitor,
    updateVisitorStatus,
    createLeadershipDev,
    updateLeadershipLevel,
    refetch: () => {
      fetchPrayerRequests();
      fetchPastoralCare();
      fetchVisitors();
      fetchLeadershipDev();
    },
  };
}
