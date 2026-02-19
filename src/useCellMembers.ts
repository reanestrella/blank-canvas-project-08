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
        .select(`
          id,
          cell_id,
          member_id,
          joined_at,
          member:members(id, full_name, phone)
        `)
        .eq("cell_id", cellId);

      if (error) throw error;
      setCellMembers((data as CellMemberWithDetails[]) || []);
    } catch (error: any) {
      console.error("Error fetching cell members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCellMembers();
  }, [cellId]);

  return {
    cellMembers,
    isLoading,
    refetch: fetchCellMembers,
  };
}
