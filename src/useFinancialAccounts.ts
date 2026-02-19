import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FinancialAccount {
  id: string;
  church_id: string;
  name: string;
  account_type: "carteira" | "conta_bancaria" | "poupanca" | "outro";
  bank_name: string | null;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  network: string | null;
  ministry_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialCampaign {
  id: string;
  church_id: string;
  name: string;
  description: string | null;
  goal_amount: number | null;
  current_amount: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountData {
  name: string;
  account_type: FinancialAccount["account_type"];
  bank_name?: string;
  initial_balance?: number;
  network?: string;
  ministry_id?: string;
}

export interface CreateCampaignData {
  name: string;
  description?: string;
  goal_amount?: number;
  start_date?: string;
  end_date?: string;
}

export function useFinancialAccounts(churchId?: string) {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [campaigns, setCampaigns] = useState<FinancialCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAccounts = async () => {
    if (!churchId) return;
    try {
      const { data, error } = await supabase
        .from("financial_accounts")
        .select("*")
        .eq("church_id", churchId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      setAccounts((data as FinancialAccount[]) || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchCampaigns = async () => {
    if (!churchId) return;
    try {
      const { data, error } = await supabase
        .from("financial_campaigns")
        .select("*")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCampaigns((data as FinancialCampaign[]) || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const createAccount = async (data: CreateAccountData) => {
    if (!churchId) return { error: new Error("Igreja não identificada") };
    try {
      const { data: newAccount, error } = await supabase
        .from("financial_accounts")
        .insert([{ ...data, church_id: churchId, current_balance: data.initial_balance || 0 }])
        .select()
        .single();
      if (error) throw error;
      setAccounts((prev) => [...prev, newAccount as FinancialAccount]);
      toast({ title: "Conta criada com sucesso!" });
      return { data: newAccount, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  const updateAccount = async (id: string, data: Partial<CreateAccountData>) => {
    try {
      const { data: updated, error } = await supabase
        .from("financial_accounts")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      setAccounts((prev) => prev.map((a) => (a.id === id ? (updated as FinancialAccount) : a)));
      toast({ title: "Conta atualizada!" });
      return { data: updated, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase.from("financial_accounts").update({ is_active: false }).eq("id", id);
      if (error) throw error;
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Conta desativada!" });
      return { error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  const createCampaign = async (data: CreateCampaignData) => {
    if (!churchId) return { error: new Error("Igreja não identificada") };
    try {
      const { data: newCampaign, error } = await supabase
        .from("financial_campaigns")
        .insert([{ ...data, church_id: churchId }])
        .select()
        .single();
      if (error) throw error;
      setCampaigns((prev) => [newCampaign as FinancialCampaign, ...prev]);
      toast({ title: "Campanha criada com sucesso!" });
      return { data: newCampaign, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  const updateCampaign = async (id: string, data: Partial<CreateCampaignData & { is_active?: boolean }>) => {
    try {
      const { data: updated, error } = await supabase
        .from("financial_campaigns")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      setCampaigns((prev) => prev.map((c) => (c.id === id ? (updated as FinancialCampaign) : c)));
      toast({ title: "Campanha atualizada!" });
      return { data: updated, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase.from("financial_campaigns").delete().eq("id", id);
      if (error) throw error;
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Campanha removida!" });
      return { error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchAccounts(), fetchCampaigns()]).finally(() => setIsLoading(false));
  }, [churchId]);

  return {
    accounts,
    campaigns,
    isLoading,
    fetchAccounts,
    fetchCampaigns,
    createAccount,
    updateAccount,
    deleteAccount,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
}
