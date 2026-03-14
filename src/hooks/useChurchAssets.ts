import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ChurchAsset {
  id: string;
  church_id: string;
  name: string;
  category: string;
  quantity: number;
  condition: string | null;
  location: string | null;
  notes: string | null;
  acquired_at: string | null;
  estimated_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetData {
  name: string;
  category: string;
  quantity: number;
  condition?: string;
  location?: string;
  notes?: string;
  acquired_at?: string;
  estimated_value?: number;
}

export function useChurchAssets(churchId?: string) {
  const [assets, setAssets] = useState<ChurchAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssets = useCallback(async () => {
    if (!churchId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("church_assets" as any)
      .select("*")
      .eq("church_id", churchId)
      .order("category")
      .order("name");
    if (error) {
      console.error("[useChurchAssets]", error);
    } else {
      setAssets((data as any) || []);
    }
    setIsLoading(false);
  }, [churchId]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const createAsset = async (data: CreateAssetData) => {
    if (!churchId) return;
    const { error } = await supabase.from("church_assets" as any).insert({
      church_id: churchId,
      ...data,
    } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Patrimônio cadastrado!" });
      fetchAssets();
    }
  };

  const updateAsset = async (id: string, data: Partial<CreateAssetData>) => {
    const { error } = await supabase.from("church_assets" as any)
      .update({ ...data, updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Patrimônio atualizado!" });
      fetchAssets();
    }
  };

  const deleteAsset = async (id: string) => {
    const { error } = await supabase.from("church_assets" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Patrimônio removido!" });
      fetchAssets();
    }
  };

  return { assets, isLoading, createAsset, updateAsset, deleteAsset, refetch: fetchAssets };
}
