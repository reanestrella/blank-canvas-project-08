import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CellMemberWithDetails {
  id: string;
  cell_id: string;
  member_id: string;
  joined_at: string;
  member: {
    id: string;
    full_name: string;
    phone: string | null;
  } | null;
}

// Tipo "cru" que pode vir do Supabase (às vezes member vem como array)
type RawCellMemberRow = {
  id: string;
  cell_id: string;
  member_id: string;
  joined_at: string;
  member:
    | { id: string; full_name: string; phone: string | null }
    | { id: string; full_name: string; phone: string | null }[]
    | null;
};

export function useCellMembers(cellId?: string) {
  const [cellMembers, setCellMembers] = useState<CellMemberWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCellMembers = async () => {
    if (!cellId) {
      setCellMembers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("cell_members")
        .select(
          `
          id,
          cell_id,
          member_id,
          joined_at,
          member:members(id, full_name, phone)
        `,
        )
        .eq("cell_id", cellId);

      if (error) throw error;

      const rows = (data ?? []) as RawCellMemberRow[];

      // Normaliza: se member vier como array, pega o primeiro item
      const normalized: CellMemberWithDetails[] = rows.map((row) => ({
        id: row.id,
        cell_id: row.cell_id,
        member_id: row.member_id,
        joined_at: row.joined_at,
        member: Array.isArray(row.member) ? (row.member[0] ?? null) : row.member,
      }));

      setCellMembers(normalized);
    } catch (error: any) {
      console.error("Error fetching cell members:", error);
      setCellMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCellMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellId]);

  return {
    cellMembers,
    isLoading,
    refetch: fetchCellMembers,
  };
}
