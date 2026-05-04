import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CreateTransferData {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  transfer_date: string;
  description?: string;
}

export function useFinancialTransfers(churchId?: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const createTransfer = async (data: CreateTransferData) => {
    if (!churchId) return { error: new Error("Igreja não identificada") };
    if (data.from_account_id === data.to_account_id) {
      toast({ title: "Erro", description: "As contas devem ser diferentes.", variant: "destructive" });
      return { error: new Error("same_account") };
    }
    setIsSubmitting(true);
    try {
      const { data: result, error } = await supabase.rpc("create_account_transfer", {
        p_church_id: churchId,
        p_from_account_id: data.from_account_id,
        p_to_account_id: data.to_account_id,
        p_amount: data.amount,
        p_date: data.transfer_date,
        p_description: data.description || null,
      });
      if (error) throw error;
      toast({ title: "Transferência registrada", description: "Os saldos foram atualizados." });
      return { data: result, error: null };
    } catch (e: any) {
      toast({
        title: "Erro ao transferir",
        description: e.message || "Não foi possível concluir.",
        variant: "destructive",
      });
      return { error: e };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createTransfer, isSubmitting };
}
