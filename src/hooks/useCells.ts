import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Cell {
  id: string;
  church_id: string;
  name: string;
  leader_id: string | null;
  supervisor_id: string | null;
  network: string | null;
  address: string | null;
  day_of_week: string | null;
  time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CellReport {
  id: string;
  cell_id: string;
  report_date: string;
  attendance: number;
  visitors: number;
  conversions: number;
  offering: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateCellData {
  name: string;
  leader_id?: string;
  supervisor_id?: string;
  network?: string;
  address?: string;
  day_of_week?: string;
  time?: string;
}

export interface CreateCellReportData {
  cell_id: string;
  report_date: string;
  attendance: number;
  visitors: number;
  conversions: number;
  offering?: number;
  notes?: string;
  decided?: string[];
  visitor_names?: string[];
}

export function useCells(churchId?: string, leaderUserId?: string | null) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [reports, setReports] = useState<CellReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCells = async () => {
    if (!churchId) {
      setCells([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);

      if (leaderUserId) {
        // Cell leader: filter by leader_user_id (auth uid)
        const { data, error } = await supabase
          .from("cells")
          .select("*")
          .eq("church_id", churchId)
          .eq("leader_user_id", leaderUserId)
          .order("name");
        if (error) throw error;
        setCells((data as Cell[]) || []);
      } else if (leaderUserId === null) {
        // Explicitly null = cell leader but no user id — show nothing
        setCells([]);
      } else {
        // undefined means "no filter" (pastor/admin) — show all
        const { data, error } = await supabase
          .from("cells")
          .select("*")
          .eq("church_id", churchId)
          .order("name");
        if (error) throw error;
        setCells((data as Cell[]) || []);
      }
    } catch (error: any) {
      console.error("Error fetching cells:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as células.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReports = async (cellId?: string) => {
    if (!churchId) {
      setReports([]);
      return;
    }
    try {
      let query = supabase
        .from("cell_reports")
        .select("*, cell:cells!inner(church_id, leader_user_id)")
        .eq("cell.church_id", churchId)
        .order("report_date", { ascending: false });
      
      if (cellId) {
        query = query.eq("cell_id", cellId);
      }

      // Cell leader: only show reports for their own cells
      if (leaderUserId) {
        query = query.eq("cell.leader_user_id", leaderUserId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setReports((data as CellReport[]) || []);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      setReports([]);
    }
  };

  const createCell = async (data: CreateCellData & { church_id: string }) => {
    try {
      const { data: newCell, error } = await supabase
        .from("cells")
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      
      setCells((prev) => [...prev, newCell as Cell]);
      toast({
        title: "Sucesso",
        description: "Célula criada com sucesso!",
      });
      return { data: newCell as Cell, error: null };
    } catch (error: any) {
      console.error("Error creating cell:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a célula.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateCell = async (id: string, data: Partial<CreateCellData>) => {
    try {
      const { data: updatedCell, error } = await supabase
        .from("cells")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      
      setCells((prev) =>
        prev.map((c) => (c.id === id ? (updatedCell as Cell) : c))
      );
      toast({
        title: "Sucesso",
        description: "Célula atualizada com sucesso!",
      });
      return { data: updatedCell as Cell, error: null };
    } catch (error: any) {
      console.error("Error updating cell:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a célula.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteCell = async (id: string) => {
    try {
      const { error } = await supabase.from("cells").delete().eq("id", id);
      
      if (error) throw error;
      
      setCells((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: "Sucesso",
        description: "Célula removida com sucesso!",
      });
      return { error: null };
    } catch (error: any) {
      console.error("Error deleting cell:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover a célula.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const createReport = async (data: CreateCellReportData) => {
    if (!churchId) {
      toast({ title: "Erro", description: "Igreja não identificada.", variant: "destructive" });
      return { data: null, error: new Error("church_id missing") };
    }
    try {
      const payload: Record<string, any> = {
        cell_id: data.cell_id,
        report_date: data.report_date,
        attendance: data.attendance,
        visitors: data.visitors,
        conversions: data.conversions,
        church_id: churchId,
      };
      if (data.offering !== undefined) payload.offering = data.offering;
      if (data.notes) payload.notes = data.notes;
      if (data.decided) payload.decided = data.decided;

      const { data: newReport, error } = await supabase
        .from("cell_reports")
        .insert([payload])
        .select()
        .single();
      
      if (error) {
        console.error("Supabase report insert error:", error.message, (error as any).details, (error as any).hint);
        throw error;
      }
      
      setReports((prev) => [newReport as CellReport, ...prev]);
      toast({ title: "Sucesso", description: "Relatório enviado com sucesso!" });
      return { data: newReport as CellReport, error: null };
    } catch (error: any) {
      console.error("Error creating report:", error);
      toast({
        title: "Erro ao enviar relatório",
        description: error.message || "Não foi possível enviar o relatório. Tente novamente.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateReport = async (id: string, data: Partial<CreateCellReportData>) => {
    try {
      const payload: Record<string, any> = {};
      if (data.attendance !== undefined) payload.attendance = data.attendance;
      if (data.visitors !== undefined) payload.visitors = data.visitors;
      if (data.conversions !== undefined) payload.conversions = data.conversions;
      if (data.offering !== undefined) payload.offering = data.offering;
      if (data.notes !== undefined) payload.notes = data.notes;
      if (data.decided !== undefined) payload.decided = data.decided;
      if (data.report_date) payload.report_date = data.report_date;

      const { data: updated, error } = await supabase
        .from("cell_reports")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setReports((prev) =>
        prev.map((r) => (r.id === id ? (updated as CellReport) : r))
      );
      toast({ title: "Sucesso", description: "Relatório atualizado com sucesso!" });
      return { data: updated as CellReport, error: null };
    } catch (error: any) {
      console.error("Error updating report:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o relatório.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  useEffect(() => {
    fetchCells();
    fetchReports();
  }, [churchId, leaderUserId]);

  return {
    cells,
    reports,
    isLoading,
    fetchCells,
    fetchReports,
    createCell,
    updateCell,
    deleteCell,
    createReport,
    updateReport,
  };
}
