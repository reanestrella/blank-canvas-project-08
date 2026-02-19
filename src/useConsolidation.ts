import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ConsolidationRecord {
  id: string;
  church_id: string;
  member_id: string;
  consolidator_id: string | null;
  status: "contato" | "acompanhamento" | "integracao" | "concluido" | "desistente";
  contact_date: string | null;
  first_visit_date: string | null;
  cell_integration_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  member?: { full_name: string; phone?: string; email?: string } | null;
  consolidator?: { full_name: string } | null;
}

export interface CreateConsolidationData {
  member_id: string;
  consolidator_id?: string;
  status?: ConsolidationRecord["status"];
  contact_date?: string;
  notes?: string;
}

export function useConsolidation(churchId?: string) {
  const [records, setRecords] = useState<ConsolidationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRecords = async () => {
    if (!churchId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("consolidation_records")
        .select(`
          *,
          member:members!consolidation_records_member_id_fkey(full_name, phone, email),
          consolidator:members!consolidation_records_consolidator_id_fkey(full_name)
        `)
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRecords((data as ConsolidationRecord[]) || []);
    } catch (error) {
      console.error("Error fetching consolidation records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createRecord = async (data: CreateConsolidationData) => {
    if (!churchId) return { error: new Error("Igreja não identificada") };
    try {
      const { data: newRecord, error } = await supabase
        .from("consolidation_records")
        .insert([{ ...data, church_id: churchId }])
        .select(`
          *,
          member:members!consolidation_records_member_id_fkey(full_name, phone, email),
          consolidator:members!consolidation_records_consolidator_id_fkey(full_name)
        `)
        .single();
      if (error) throw error;
      setRecords((prev) => [newRecord as ConsolidationRecord, ...prev]);
      toast({ title: "Consolidação iniciada!" });
      return { data: newRecord, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  const updateRecord = async (id: string, data: Partial<CreateConsolidationData>) => {
    try {
      const { data: updated, error } = await supabase
        .from("consolidation_records")
        .update(data)
        .eq("id", id)
        .select(`
          *,
          member:members!consolidation_records_member_id_fkey(full_name, phone, email),
          consolidator:members!consolidation_records_consolidator_id_fkey(full_name)
        `)
        .single();
      if (error) throw error;
      setRecords((prev) => prev.map((r) => (r.id === id ? (updated as ConsolidationRecord) : r)));
      toast({ title: "Consolidação atualizada!" });
      return { data: updated, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  const updateStatus = async (id: string, status: ConsolidationRecord["status"]) => {
    const updates: Partial<ConsolidationRecord> = { status };
    if (status === "integracao") {
      updates.cell_integration_date = new Date().toISOString().split("T")[0];
    }
    return updateRecord(id, updates);
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase.from("consolidation_records").delete().eq("id", id);
      if (error) throw error;
      setRecords((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Registro removido!" });
      return { error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [churchId]);

  // Stats
  const stats = {
    total: records.length,
    contato: records.filter((r) => r.status === "contato").length,
    acompanhamento: records.filter((r) => r.status === "acompanhamento").length,
    integracao: records.filter((r) => r.status === "integracao").length,
    concluido: records.filter((r) => r.status === "concluido").length,
    desistente: records.filter((r) => r.status === "desistente").length,
  };

  return {
    records,
    isLoading,
    stats,
    fetchRecords,
    createRecord,
    updateRecord,
    updateStatus,
    deleteRecord,
  };
}
