import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { useFinancialTransfers } from "@/hooks/useFinancialTransfers";
import type { FinancialAccount } from "@/hooks/useFinancialAccounts";
import { todayISO } from "@/lib/dateUtils";

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinancialAccount[];
  churchId: string;
  onDone?: () => void;
}

export function TransferModal({ open, onOpenChange, accounts, churchId, onDone }: TransferModalProps) {
  const { createTransfer, isSubmitting } = useFinancialTransfers(churchId);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (open) {
      setFrom(""); setTo(""); setAmount(""); setDesc("");
      setDate(todayISO());
    }
  }, [open]);

  const handleSubmit = async () => {
    const num = parseFloat(amount.replace(",", "."));
    if (!from || !to || !num || num <= 0) return;
    const { error } = await createTransfer({
      from_account_id: from,
      to_account_id: to,
      amount: num,
      transfer_date: date,
      description: desc || undefined,
    });
    if (!error) {
      onDone?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" /> Transferência entre contas
          </DialogTitle>
          <DialogDescription>
            O valor será debitado da conta de origem e creditado na conta de destino.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Conta de origem *</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id} disabled={a.id === to}>
                    {a.name} — saldo R$ {Number(a.current_balance ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Conta de destino *</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id} disabled={a.id === from}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0" placeholder="0,00"
                value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea placeholder="Opcional" value={desc} onChange={(e) => setDesc(e.target.value)} className="resize-none" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !from || !to || !amount}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
