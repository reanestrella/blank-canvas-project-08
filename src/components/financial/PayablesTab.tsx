import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, Check, Trash2, Edit, Download, AlertCircle } from "lucide-react";
import { useFinancialPayables, type FinancialPayable, type PayableRecurrence, type CreatePayableData } from "@/hooks/useFinancialPayables";
import type { FinancialAccount } from "@/hooks/useFinancialAccounts";
import type { FinancialCategory } from "@/hooks/useFinancial";
import { exportToPdf, formatBRL } from "@/lib/pdfExport";

interface PayablesTabProps {
  churchId: string;
  accounts: FinancialAccount[];
  categories: FinancialCategory[];
  churchName?: string;
}

const recurrenceLabel: Record<PayableRecurrence, string> = {
  nenhuma: "Sem recorrência",
  semanal: "Semanal",
  mensal: "Mensal",
  anual: "Anual",
};

const empty: CreatePayableData = {
  description: "",
  amount: 0,
  due_date: new Date().toISOString().slice(0, 10),
  category_id: null,
  account_id: null,
  recurrence: "nenhuma",
  notes: "",
};

export function PayablesTab({ churchId, accounts, categories, churchName }: PayablesTabProps) {
  const { payables, isLoading, createPayable, updatePayable, deletePayable, markAsPaid } = useFinancialPayables(churchId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialPayable | null>(null);
  const [form, setForm] = useState<CreatePayableData>(empty);
  const [submitting, setSubmitting] = useState(false);

  const [payOpen, setPayOpen] = useState<FinancialPayable | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payAccount, setPayAccount] = useState<string>("");

  const [statusFilter, setStatusFilter] = useState<"all" | "pendente" | "pago">("all");

  const expenseCategories = useMemo(() => categories.filter((c) => c.type === "despesa"), [categories]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return payables;
    return payables.filter((p) => p.status === statusFilter);
  }, [payables, statusFilter]);

  const totals = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      pending: payables.filter((p) => p.status === "pendente").reduce((s, p) => s + Number(p.amount), 0),
      paid: payables.filter((p) => p.status === "pago").reduce((s, p) => s + Number(p.amount), 0),
      overdue: payables.filter((p) => p.status === "pendente" && p.due_date < today).length,
    };
  }, [payables]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: FinancialPayable) => {
    setEditing(p);
    setForm({
      description: p.description, amount: Number(p.amount), due_date: p.due_date,
      category_id: p.category_id, account_id: p.account_id, recurrence: p.recurrence,
      notes: p.notes || "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.description || !form.amount || form.amount <= 0) return;
    setSubmitting(true);
    const res = editing
      ? await updatePayable(editing.id, form)
      : await createPayable(form);
    setSubmitting(false);
    if (!res.error) setOpen(false);
  };

  const openPay = (p: FinancialPayable) => {
    setPayOpen(p);
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayAccount(p.account_id || (accounts[0]?.id ?? ""));
  };

  const handleConfirmPay = async () => {
    if (!payOpen) return;
    const res = await markAsPaid(payOpen, payDate, payAccount);
    if (!res.error) setPayOpen(null);
  };

  const handleExportPdf = () => {
    exportToPdf({
      title: "Contas a Pagar",
      churchName,
      period: statusFilter === "all" ? "Todas" : statusFilter === "pendente" ? "Pendentes" : "Pagas",
      columns: [
        { header: "Vencimento", dataKey: "due" },
        { header: "Descrição", dataKey: "desc" },
        { header: "Categoria", dataKey: "cat" },
        { header: "Conta", dataKey: "acc" },
        { header: "Status", dataKey: "status" },
        { header: "Recorrência", dataKey: "rec" },
        { header: "Valor", dataKey: "amount", align: "right" },
      ],
      rows: filtered.map((p) => ({
        due: new Date(p.due_date + "T12:00:00").toLocaleDateString("pt-BR"),
        desc: p.description,
        cat: categories.find((c) => c.id === p.category_id)?.name || "—",
        acc: accounts.find((a) => a.id === p.account_id)?.name || "—",
        status: p.status === "pago" ? "Pago" : "Pendente",
        rec: recurrenceLabel[p.recurrence],
        amount: `R$ ${formatBRL(Number(p.amount))}`,
      })),
      totals: [
        { label: "Total pendente", value: `R$ ${formatBRL(totals.pending)}` },
        { label: "Total pago", value: `R$ ${formatBRL(totals.paid)}` },
      ],
      filename: `contas-a-pagar-${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Pendente</p>
          <p className="text-2xl font-bold mt-1 text-destructive">R$ {formatBRL(totals.pending)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Pago</p>
          <p className="text-2xl font-bold mt-1 text-success">R$ {formatBRL(totals.paid)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Vencidas</p>
          <p className="text-2xl font-bold mt-1 flex items-center gap-2">
            {totals.overdue > 0 && <AlertCircle className="w-5 h-5 text-destructive" />}
            {totals.overdue}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">Contas a Pagar</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="pago">Pagas</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportPdf}>
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" /> Nova Conta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">Nenhuma conta {statusFilter !== "all" ? statusFilter : ""}.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="hidden md:table-cell">Recorrência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const overdue = p.status === "pendente" && p.due_date < today;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className={overdue ? "text-destructive font-medium" : ""}>
                          {new Date(p.due_date + "T12:00:00").toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="font-medium">{p.description}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {categories.find((c) => c.id === p.category_id)?.name || "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs">
                          {recurrenceLabel[p.recurrence]}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={
                            p.status === "pago"
                              ? "bg-success/20 text-success"
                              : overdue ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-foreground"
                          }>
                            {p.status === "pago" ? "Pago" : overdue ? "Vencida" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {formatBRL(Number(p.amount))}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            {p.status === "pendente" && (
                              <Button size="icon" variant="ghost" title="Marcar como pago" onClick={() => openPay(p)}>
                                <Check className="w-4 h-4 text-success" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" title="Editar" onClick={() => openEdit(p)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Excluir"
                              onClick={() => { if (confirm("Excluir esta conta?")) deletePayable(p.id); }}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Conta" : "Nova Conta a Pagar"}</DialogTitle>
            <DialogDescription>Cadastre vencimentos e marque como pago para gerar a saída automaticamente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0" value={form.amount || ""}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value || "0") })} />
              </div>
              <div className="space-y-2">
                <Label>Vencimento *</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Nenhuma —</SelectItem>
                    {expenseCategories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conta vinculada</Label>
                <Select value={form.account_id || "none"} onValueChange={(v) => setForm({ ...form, account_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Nenhuma —</SelectItem>
                    {accounts.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Recorrência</Label>
              <Select value={form.recurrence || "nenhuma"} onValueChange={(v: PayableRecurrence) => setForm({ ...form, recurrence: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Sem recorrência</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Ao marcar como pago, a próxima ocorrência será gerada automaticamente.</p>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={submitting || !form.description || !form.amount}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay dialog */}
      <Dialog open={!!payOpen} onOpenChange={(o) => !o && setPayOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar como pago</DialogTitle>
            <DialogDescription>Será gerada uma despesa na conta selecionada.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data do pagamento</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Conta de saída</Label>
              <Select value={payAccount} onValueChange={setPayAccount}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            {payOpen && (
              <div className="text-sm text-muted-foreground p-3 bg-muted/40 rounded-lg">
                <p><strong>{payOpen.description}</strong></p>
                <p>Valor: R$ {formatBRL(Number(payOpen.amount))}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPayOpen(null)}>Cancelar</Button>
            <Button onClick={handleConfirmPay} disabled={!payAccount}>Confirmar pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
