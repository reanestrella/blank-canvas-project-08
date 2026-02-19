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
}

export function useCells(churchId?: string) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [reports, setReports] = useState<CellReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCells = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("cells")
        .select("*")
        .order("name");
      
      if (churchId) {
        query = query.eq("church_id", churchId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setCells((data as Cell[]) || []);
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
    try {
      let query = supabase
        .from("cell_reports")
        .select("*")
        .order("report_date", { ascending: false });
      
      if (cellId) {
        query = query.eq("cell_id", cellId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setReports((data as CellReport[]) || []);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
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
    try {
      const { data: newReport, error } = await supabase
        .from("cell_reports")
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      
      setReports((prev) => [newReport as CellReport, ...prev]);
      toast({
        title: "Sucesso",
        description: "Relatório enviado com sucesso!",
      });
      return { data: newReport as CellReport, error: null };
    } catch (error: any) {
      console.error("Error creating report:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o relatório.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  useEffect(() => {
    fetchCells();
    fetchReports();
  }, [churchId]);

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
  };
}
