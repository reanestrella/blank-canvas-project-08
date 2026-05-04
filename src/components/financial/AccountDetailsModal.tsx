import { useState, useMemo, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Download, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { FinancialAccount } from "@/hooks/useFinancialAccounts";
import { exportToPdf, formatBRL } from "@/lib/pdfExport";

interface AccountDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: FinancialAccount | null;
  churchName?: string;
}

interface Tx {
  id: string;
  type: "receita" | "despesa";
  amount: number;
  description: string;
  transaction_date: string;
  is_transfer: boolean | null;
}

export function AccountDetailsModal({ open, onOpenChange, account, churchName }: AccountDetailsModalProps) {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "receita" | "despesa" | "transfer">("all");
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    if (!open || !account) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("id, type, amount, description, transaction_date, is_transfer")
        .eq("account_id", account.id)
        .order("transaction_date", { ascending: false });
      if (!error) setTxs((data as Tx[]) || []);
      setLoading(false);
    };
    load();
    setFrom(""); setTo(""); setTypeFilter("all"); setOrder("desc");
  }, [open, account]);

  const filtered = useMemo(() => {
    return txs
      .filter((t) => {
        if (from && t.transaction_date < from) return false;
        if (to && t.transaction_date > to) return false;
        if (typeFilter === "receita") return t.type === "receita" && !t.is_transfer;
        if (typeFilter === "despesa") return t.type === "despesa" && !t.is_transfer;
        if (typeFilter === "transfer") return !!t.is_transfer;
        return true;
      })
      .sort((a, b) =>
        order === "desc"
          ? b.transaction_date.localeCompare(a.transaction_date)
          : a.transaction_date.localeCompare(b.transaction_date),
      );
  }, [txs, from, to, typeFilter, order]);

  const totals = useMemo(() => {
    const inc = filtered.filter((t) => t.type === "receita").reduce((s, t) => s + Number(t.amount), 0);
    const exp = filtered.filter((t) => t.type === "despesa").reduce((s, t) => s + Number(t.amount), 0);
    return { inc, exp, net: inc - exp };
  }, [filtered]);

  const period = from || to ? `${from || "início"} → ${to || "hoje"}` : "Todo o período";

  const handleExport = () => {
    if (!account) return;
    exportToPdf({
      title: `Extrato — ${account.name}`,
      churchName,
      period,
      columns: [
        { header: "Data", dataKey: "date" },
        { header: "Descrição", dataKey: "desc" },
        { header: "Tipo", dataKey: "type" },
        { header: "Valor", dataKey: "amount", align: "right" },
      ],
      rows: filtered.map((t) => ({
        date: new Date(t.transaction_date + "T12:00:00").toLocaleDateString("pt-BR"),
        desc: t.description,
        type: t.is_transfer ? "Transferência" : t.type === "receita" ? "Entrada" : "Saída",
        amount: `${t.type === "receita" ? "+" : "-"} R$ ${formatBRL(Number(t.amount))}`,
      })),
      totals: [
        { label: "Entradas", value: `R$ ${formatBRL(totals.inc)}` },
        { label: "Saídas", value: `R$ ${formatBRL(totals.exp)}` },
        { label: "Saldo do período", value: `R$ ${formatBRL(totals.net)}` },
      ],
      filename: `extrato-${account.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{account?.name}</DialogTitle>
          <DialogDescription>
            Saldo atual: <strong>R$ {formatBRL(Number(account?.current_balance ?? 0))}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">De</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Até</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="receita">Entradas</SelectItem>
                  <SelectItem value="despesa">Saídas</SelectItem>
                  <SelectItem value="transfer">Transferências</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ordem</Label>
              <Select value={order} onValueChange={(v: any) => setOrder(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Mais recente</SelectItem>
                  <SelectItem value="asc">Mais antiga</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-success/10">
              <p className="text-xs text-muted-foreground">Entradas</p>
              <p className="font-semibold text-success">R$ {formatBRL(totals.inc)}</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10">
              <p className="text-xs text-muted-foreground">Saídas</p>
              <p className="font-semibold text-destructive">R$ {formatBRL(totals.exp)}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <p className="text-xs text-muted-foreground">Saldo período</p>
              <p className="font-semibold">R$ {formatBRL(totals.net)}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={handleExport} disabled={!filtered.length}>
              <Download className="w-4 h-4 mr-2" /> Exportar PDF
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">Sem movimentações.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{new Date(t.transaction_date + "T12:00:00").toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-medium">{t.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          t.is_transfer ? "bg-primary/15 text-primary"
                            : t.type === "receita" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                        }>
                          {t.is_transfer ? <><ArrowRightLeft className="w-3 h-3 mr-1 inline" />Transf.</>
                            : t.type === "receita" ? <><ArrowUpRight className="w-3 h-3 mr-1 inline" />Entrada</>
                            : <><ArrowDownRight className="w-3 h-3 mr-1 inline" />Saída</>}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${t.type === "receita" ? "text-success" : "text-destructive"}`}>
                        {t.type === "receita" ? "+" : "-"} R$ {formatBRL(Number(t.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
