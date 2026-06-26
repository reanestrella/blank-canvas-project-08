import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PayableStatus = "pendente" | "pago";
export type PayableRecurrence = "nenhuma" | "semanal" | "mensal" | "anual" | "personalizada";
export type PayableEntryType = "pagar" | "receber";

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
  recurrence_interval_days: number | null;
  paid_at: string | null;
  paid_transaction_id: string | null;
  parent_payable_id: string | null;
  notes: string | null;
  created_at: string;
  installment_number: number | null;
  installment_total: number | null;
  installment_group_id: string | null;
  entry_type: PayableEntryType;
}

export interface CreatePayableData {
  description: string;
  amount: number;
  due_date: string;
  category_id?: string | null;
  account_id?: string | null;
  recurrence?: PayableRecurrence;
  /** Para recorrência personalizada (em dias). */
  recurrence_interval_days?: number | null;
  notes?: string | null;
  status?: PayableStatus;
  /**
   * OPCIONAL — quando informado em recorrência, gera todas as ocorrências
   * pré-agendadas até essa data. Quando ausente, a recorrência é contínua e
   * a próxima parcela é gerada automaticamente quando esta for paga.
   */
  recurrence_end_date?: string | null;
  entry_type?: PayableEntryType;
}

export function addToDate(
  dateIso: string,
  recurrence: PayableRecurrence,
  intervalDays?: number | null,
): string {
  const d = new Date(dateIso + "T12:00:00");
  if (recurrence === "semanal") d.setDate(d.getDate() + 7);
  else if (recurrence === "mensal") d.setMonth(d.getMonth() + 1);
  else if (recurrence === "anual") d.setFullYear(d.getFullYear() + 1);
  else if (recurrence === "personalizada") d.setDate(d.getDate() + Math.max(1, intervalDays || 30));
  return d.toISOString().slice(0, 10);
}

/** Returns true if payable is overdue based on today (date string YYYY-MM-DD). */
export function isOverdue(p: { status: PayableStatus; due_date: string }, today?: string): boolean {
  const t = today || new Date().toISOString().slice(0, 10);
  return p.status === "pendente" && p.due_date < t;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + "T12:00:00").getTime();
  const b = new Date(toIso + "T12:00:00").getTime();
  return Math.round((b - a) / 86400000);
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
    const rec = data.recurrence || "nenhuma";
    const intervalDays = rec === "personalizada" ? Math.max(1, data.recurrence_interval_days || 30) : null;

    // Recorrência com data fim → gera todas as ocorrências como grupo (finita)
    if (rec !== "nenhuma" && data.recurrence_end_date) {
      const groupId = (crypto as any).randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const occurrences: { due: string }[] = [];
      let cursor = data.due_date;
      const limit = data.recurrence_end_date;
      let safety = 0;
      while (cursor <= limit && safety < 600) {
        occurrences.push({ due: cursor });
        cursor = addToDate(cursor, rec, intervalDays);
        safety++;
      }
      const total = occurrences.length;
      const rows = occurrences.map((o, i) => ({
        church_id: churchId,
        description: `${data.description} (${i + 1}/${total})`,
        amount: data.amount,
        due_date: o.due,
        category_id: data.category_id || null,
        account_id: data.account_id || null,
        recurrence: rec,
        recurrence_interval_days: intervalDays,
        notes: data.notes || null,
        status: data.status || "pendente",
        created_by: u.user?.id || null,
        installment_number: i + 1,
        installment_total: total,
        installment_group_id: groupId,
        entry_type: data.entry_type || "pagar",
      }));
      const { error } = await supabase.from("financial_payables").insert(rows);
      if (error) {
        toast({ title: "Erro ao criar recorrência", description: error.message, variant: "destructive" });
        return { error };
      }
      toast({ title: `${total} ocorrências criadas` });
      await fetchPayables();
      return { error: null };
    }

    // Recorrência contínua (sem data fim) → cria 1 conta; próximas geradas ao pagar.
    // Conta única → idem (recurrence='nenhuma')
    const { error } = await supabase.from("financial_payables").insert({
      church_id: churchId,
      description: data.description,
      amount: data.amount,
      due_date: data.due_date,
      category_id: data.category_id || null,
      account_id: data.account_id || null,
      recurrence: rec,
      recurrence_interval_days: intervalDays,
      notes: data.notes || null,
      status: data.status || "pendente",
      created_by: u.user?.id || null,
      entry_type: data.entry_type || "pagar",
    });
    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      return { error };
    }
    toast({ title: rec === "nenhuma" ? "Conta criada" : "Conta recorrente criada" });
    await fetchPayables();
    return { error: null };
  };

  const updatePayable = async (id: string, data: Partial<CreatePayableData>) => {
    const { recurrence_end_date: _r, ...rest } = data as any;
    const { error } = await supabase.from("financial_payables").update(rest).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return { error };
    }
    await fetchPayables();
    return { error: null };
  };

  /** Edita esta parcela e todas as futuras pendentes do mesmo grupo. */
  const updateGroupFuture = async (base: FinancialPayable, data: Partial<CreatePayableData>) => {
    if (!base.installment_group_id) return updatePayable(base.id, data);
    const { recurrence_end_date: _r, due_date: _d, ...rest } = data as any;
    const { error } = await supabase
      .from("financial_payables")
      .update(rest)
      .eq("installment_group_id", base.installment_group_id)
      .gte("due_date", base.due_date)
      .eq("status", "pendente");
    if (error) {
      toast({ title: "Erro ao atualizar grupo", description: error.message, variant: "destructive" });
      return { error };
    }
    toast({ title: "Parcelas futuras atualizadas" });
    await fetchPayables();
    return { error: null };
  };

  const deletePayable = async (id: string) => {
    // If the payable was already paid, remove the linked transaction first
    const { data: payable } = await supabase
      .from("financial_payables")
      .select("status, paid_transaction_id")
      .eq("id", id)
      .single();

    if (payable?.status === "pago" && payable?.paid_transaction_id) {
      await supabase
        .from("financial_transactions")
        .delete()
        .eq("id", payable.paid_transaction_id);
    }

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

    const txType = payable.entry_type === "receber" ? "receita" : "despesa";
    const { data: tx, error: txErr } = await supabase
      .from("financial_transactions")
      .insert({
        church_id: churchId,
        type: txType,
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

    // Recorrência contínua (sem grupo finito): gera próxima ocorrência se ainda
    // não houver uma pendente filha. Recorrência finita pré-gera tudo no create.
    if (
      payable.recurrence &&
      payable.recurrence !== "nenhuma" &&
      !payable.installment_group_id
    ) {
      const nextDue = addToDate(payable.due_date, payable.recurrence, payable.recurrence_interval_days);
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
          recurrence_interval_days: payable.recurrence_interval_days,
          notes: payable.notes,
          parent_payable_id: payable.id,
          status: "pendente",
          created_by: u.user?.id || null,
        });
      }
    }

    toast({ title: "Conta paga", description: txType === "receita" ? "Receita registrada e saldo atualizado." : "Saída registrada e saldo atualizado." });
    await fetchPayables();
    return { error: null };
  };

  return {
    payables,
    isLoading,
    fetchPayables,
    createPayable,
    updatePayable,
    updateGroupFuture,
    deletePayable,
    markAsPaid,
  };
}
