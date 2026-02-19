import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FinancialTransaction {
  id: string;
  church_id: string;
  category_id: string | null;
  type: "receita" | "despesa";
  amount: number;
  description: string;
  transaction_date: string;
  member_id: string | null;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface FinancialCategory {
  id: string;
  church_id: string;
  name: string;
  type: "receita" | "despesa";
  is_active: boolean;
  created_at: string;
}

export interface CreateTransactionData {
  type: "receita" | "despesa";
  amount: number;
  description: string;
  transaction_date: string;
  category_id?: string;
  member_id?: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
}

export function useFinancial(churchId?: string) {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("financial_transactions")
        .select("*")
        .order("transaction_date", { ascending: false });
      
      if (churchId) {
        query = query.eq("church_id", churchId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setTransactions((data as FinancialTransaction[]) || []);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      let query = supabase
        .from("financial_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (churchId) {
        query = query.eq("church_id", churchId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setCategories((data as FinancialCategory[]) || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    }
  };

  const createTransaction = async (data: CreateTransactionData & { church_id: string }) => {
    try {
      const { data: newTransaction, error } = await supabase
        .from("financial_transactions")
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      
      setTransactions((prev) => [newTransaction as FinancialTransaction, ...prev]);
      toast({
        title: "Sucesso",
        description: `${data.type === "receita" ? "Receita" : "Despesa"} registrada com sucesso!`,
      });
      return { data: newTransaction as FinancialTransaction, error: null };
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar a transação.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateTransaction = async (id: string, data: Partial<CreateTransactionData>) => {
    try {
      const { data: updatedTransaction, error } = await supabase
        .from("financial_transactions")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? (updatedTransaction as FinancialTransaction) : t))
      );
      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso!",
      });
      return { data: updatedTransaction as FinancialTransaction, error: null };
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a transação.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from("financial_transactions")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast({
        title: "Sucesso",
        description: "Transação removida com sucesso!",
      });
      return { error: null };
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover a transação.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const createCategory = async (data: { name: string; type: "receita" | "despesa"; church_id: string }) => {
    try {
      const { data: newCategory, error } = await supabase
        .from("financial_categories")
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      
      setCategories((prev) => [...prev, newCategory as FinancialCategory]);
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      });
      return { data: newCategory as FinancialCategory, error: null };
    } catch (error: any) {
      console.error("Error creating category:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a categoria.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [churchId]);

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "receita")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalExpense = transactions
    .filter((t) => t.type === "despesa")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const balance = totalIncome - totalExpense;

  return {
    transactions,
    categories,
    isLoading,
    totalIncome,
    totalExpense,
    balance,
    fetchTransactions,
    fetchCategories,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createCategory,
  };
}
