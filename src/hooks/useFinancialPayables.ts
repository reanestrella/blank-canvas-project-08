import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PayableStatus = "pendente" | "pago";
export type PayableRecurrence = "nenhuma" | "semanal" | "mensal" | "anual";

export interface FinancialPayable {
  id: string;
  church_id: string;
  description: string;
  amount: number;
  due_date: string;
  category_id: string | null;
  account_id: string | null;
  status: PayableStatus;
  recurrence: PayableRecurrence;
  paid_at: string | null;
  paid_transaction_id: string | null;
  parent_payable_id: string | null;
  notes: string | null;
  created_at: string;
  installment_number: number | null;
  installment_total: number | null;
  installment_group_id: string | null;
}

export interface CreatePayableData {
  description: string;
  amount: number;
  due_date: string;
  category_id?: string | null;
  account_id?: string | null;
  recurrence?: PayableRecurrence;
  notes?: string | null;
  status?: PayableStatus;
  /** Quando informado (>1), gera N parcelas mensais com mesmo grupo. */
  installments?: number;
}

function addToDate(dateIso: string, recurrence: PayableRecurrence): string {
  const d = new Date(dateIso + "T12:00:00");
  if (recurrence === "semanal") d.setDate(d.getDate() + 7);
  else if (recurrence === "mensal") d.setMonth(d.getMonth() + 1);
  else if (recurrence === "anual") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function useFinancialPayables(churchId?: string) {
  const [payables, setPayables] = useState<FinancialPayable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPayables = useCallback(async () => {
    if (!churchId) { setPayables([]); setIsLoading(false); return; }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("financial_payables")
      .select("*")
      .eq("church_id", churchId)
      .order("due_date", { ascending: true });
    if (error) {
      toast({ title: "Erro ao carregar contas a pagar", description: error.message, variant: "destructive" });
    } else {
      setPayables((data as FinancialPayable[]) || []);
    }
    setIsLoading(false);
  }, [churchId, toast]);

  useEffect(() => { fetchPayables(); }, [fetchPayables]);

  const createPayable = async (data: CreatePayableData) => {
    if (!churchId) return { error: new Error("Igreja não identificada") };
    const { data: u } = await supabase.auth.getUser();
    const installments = Math.max(1, Math.floor(data.installments || 1));
    if (installments > 1) {
      const groupId = (crypto as any).randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const baseAmount = Math.round((data.amount / installments) * 100) / 100;
      const rows = Array.from({ length: installments }).map((_, i) => {
        const due = new Date(data.due_date + "T12:00:00");
        due.setMonth(due.getMonth() + i);
        return {
          church_id: churchId,
          description: `${data.description} (${i + 1}/${installments})`,
          amount: baseAmount,
          due_date: due.toISOString().slice(0, 10),
          category_id: data.category_id || null,
          account_id: data.account_id || null,
          recurrence: "nenhuma" as PayableRecurrence,
          notes: data.notes || null,
          status: data.status || "pendente",
          created_by: u.user?.id || null,
          installment_number: i + 1,
          installment_total: installments,
          installment_group_id: groupId,
        };
      });
      const { error } = await supabase.from("financial_payables").insert(rows);
      if (error) {
        toast({ title: "Erro ao criar parcelas", description: error.message, variant: "destructive" });
        return { error };
      }
      toast({ title: `${installments} parcelas criadas` });
      await fetchPayables();
      return { error: null };
    }

    const { error } = await supabase.from("financial_payables").insert({
      church_id: churchId,
      description: data.description,
      amount: data.amount,
      due_date: data.due_date,
      category_id: data.category_id || null,
      account_id: data.account_id || null,
      recurrence: data.recurrence || "nenhuma",
      notes: data.notes || null,
      status: data.status || "pendente",
      created_by: u.user?.id || null,
    });
    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      return { error };
    }
    toast({ title: "Conta criada" });
    await fetchPayables();
    return { error: null };
  };

  const updatePayable = async (id: string, data: Partial<CreatePayableData>) => {
    const { installments: _ignore, ...rest } = data as any;
    const { error } = await supabase.from("financial_payables").update(rest).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return { error };
    }
    await fetchPayables();
    return { error: null };
  };

  const deletePayable = async (id: string) => {
    const { error } = await supabase.from("financial_payables").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return { error };
    }
    toast({ title: "Conta excluída" });
    await fetchPayables();
    return { error: null };
  };

  /** Mark as paid: creates a despesa transaction in the linked account, then schedules next if recurring. */
  const markAsPaid = async (payable: FinancialPayable, paidDate: string, accountIdOverride?: string) => {
    if (!churchId) return { error: new Error("Igreja não identificada") };
    const accountId = accountIdOverride || payable.account_id;
    if (!accountId) {
      toast({ title: "Selecione uma conta", description: "Vincule uma conta para gerar a saída.", variant: "destructive" });
      return { error: new Error("no_account") };
    }
    const { data: u } = await supabase.auth.getUser();

    const { data: tx, error: txErr } = await supabase
      .from("financial_transactions")
      .insert({
        church_id: churchId,
        type: "despesa",
        amount: payable.amount,
        description: payable.description,
        transaction_date: paidDate,
        category_id: payable.category_id,
        account_id: accountId,
        notes: payable.notes,
        created_by: u.user?.id || null,
      })
      .select("id")
      .single();

    if (txErr) {
      toast({ title: "Erro ao gerar saída", description: txErr.message, variant: "destructive" });
      return { error: txErr };
    }

    const { error: upErr } = await supabase
      .from("financial_payables")
      .update({
        status: "pago",
        paid_at: paidDate,
        paid_transaction_id: tx!.id,
        account_id: accountId,
      })
      .eq("id", payable.id);

    if (upErr) {
      toast({ title: "Erro ao marcar como pago", description: upErr.message, variant: "destructive" });
      return { error: upErr };
    }

    // Generate next recurrence if applicable and not already chained
    if (payable.recurrence && payable.recurrence !== "nenhuma") {
      const nextDue = addToDate(payable.due_date, payable.recurrence);
      // Avoid duplicate: check if a child already exists with that due_date
      const { data: existing } = await supabase
        .from("financial_payables")
        .select("id")
        .eq("parent_payable_id", payable.id)
        .eq("due_date", nextDue)
        .maybeSingle();
      if (!existing) {
        await supabase.from("financial_payables").insert({
          church_id: churchId,
          description: payable.description,
          amount: payable.amount,
          due_date: nextDue,
          category_id: payable.category_id,
          account_id: payable.account_id,
          recurrence: payable.recurrence,
          notes: payable.notes,
          parent_payable_id: payable.id,
          status: "pendente",
          created_by: u.user?.id || null,
        });
      }
    }

    toast({ title: "Conta paga", description: "Saída registrada e saldo atualizado." });
    await fetchPayables();
    return { error: null };
  };

  return { payables, isLoading, fetchPayables, createPayable, updatePayable, deletePayable, markAsPaid };
}
