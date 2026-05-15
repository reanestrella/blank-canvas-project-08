import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Assignee {
  id: string;
  consolidation_id: string;
  consolidator_member_id: string;
  church_id: string;
  assigned_at: string;
  consolidator?: { full_name: string } | null;
}

/** Lista, adiciona e remove consolidadores de uma ficha de consolidação. */
export function useConsolidationAssignees(churchId?: string) {
  const [byRecord, setByRecord] = useState<Record<string, Assignee[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    if (!churchId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("consolidation_assignees" as any)
        .select(`
          id, consolidation_id, consolidator_member_id, church_id, assigned_at,
          consolidator:members!consolidation_assignees_consolidator_member_id_fkey(full_name)
        `)
        .eq("church_id", churchId);
      if (error) throw error;
      const grouped: Record<string, Assignee[]> = {};
      ((data as any[]) || []).forEach((row) => {
        (grouped[row.consolidation_id] ||= []).push(row as Assignee);
      });
      setByRecord(grouped);
    } catch (e) {
      console.error("[assignees] fetch", e);
    } finally {
      setIsLoading(false);
    }
  }, [churchId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const setAssignees = async (
    consolidationId: string,
    consolidatorMemberIds: string[],
  ) => {
    if (!churchId) return { error: new Error("no_church") };
    try {
      const current = byRecord[consolidationId] || [];
      const currentIds = new Set(current.map((a) => a.consolidator_member_id));
      const targetIds = new Set(consolidatorMemberIds);

      const toAdd = consolidatorMemberIds.filter((id) => !currentIds.has(id));
      const toRemove = current.filter((a) => !targetIds.has(a.consolidator_member_id));

      if (toRemove.length) {
        const { error } = await supabase
          .from("consolidation_assignees" as any)
          .delete()
          .in("id", toRemove.map((r) => r.id));
        if (error) throw error;
      }
      if (toAdd.length) {
        const rows = toAdd.map((mid) => ({
          consolidation_id: consolidationId,
          consolidator_member_id: mid,
          church_id: churchId,
        }));
        const { error } = await supabase.from("consolidation_assignees" as any).insert(rows);
        if (error) throw error;
      }
      await fetchAll();
      return { error: null };
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
      return { error: e };
    }
  };

  return { byRecord, isLoading, fetchAll, setAssignees };
}
