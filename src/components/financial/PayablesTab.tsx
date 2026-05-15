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
import { Plus, Loader2, Check, Trash2, Edit, Download, AlertCircle, Calendar } from "lucide-react";
import { useFinancialPayables, type FinancialPayable, type PayableRecurrence, type CreatePayableData, isOverdue, daysBetween } from "@/hooks/useFinancialPayables";
import type { FinancialAccount } from "@/hooks/useFinancialAccounts";
import type { FinancialCategory } from "@/hooks/useFinancial";
import { exportToPdf, formatBRL } from "@/lib/pdfExport";

interface PayablesTabProps {
  churchId: string;
  accounts: FinancialAccount[];
  categories: FinancialCategory[];
  churchName?: string;
}

type StatusFilter = "all" | "pendente" | "vencida" | "pago";
type PeriodMode = "month" | "year" | "all";
type CreationMode = "single" | "recurring_open" | "recurring_finite";

const recurrenceLabel: Record<PayableRecurrence, string> = {
  nenhuma: "Sem recorrência",
  semanal: "Semanal",
  mensal: "Mensal",
  anual: "Anual",
  personalizada: "Personalizada",
};

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

interface FormState extends CreatePayableData {
  mode: CreationMode;
}

const buildEmpty = (): FormState => ({
  mode: "single",
  description: "",
  amount: 0,
  due_date: new Date().toISOString().slice(0, 10),
  category_id: null,
  account_id: null,
  recurrence: "nenhuma",
  recurrence_interval_days: 30,
  notes: "",
  recurrence_end_date: null,
});

export function PayablesTab({ churchId, accounts, categories, churchName }: PayablesTabProps) {
  const { payables, isLoading, createPayable, updatePayable, updateGroupFuture, deletePayable, markAsPaid } = useFinancialPayables(churchId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialPayable | null>(null);
  const [editScope, setEditScope] = useState<"single" | "future">("single");
  const [form, setForm] = useState<FormState>(buildEmpty());
  const [submitting, setSubmitting] = useState(false);

  const [payOpen, setPayOpen] = useState<FinancialPayable | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payAccount, setPayAccount] = useState<string>("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const expenseCategories = useMemo(() => categories.filter((c) => c.type === "despesa"), [categories]);
  const today = new Date().toISOString().slice(0, 10);

  // Period filter range
  const periodRange = useMemo(() => {
    if (periodMode === "all") return null;
    if (periodMode === "year") {
      return { start: `${filterYear}-01-01`, end: `${filterYear}-12-31` };
    }
    const m = String(filterMonth + 1).padStart(2, "0");
    const last = new Date(filterYear, filterMonth + 1, 0).getDate();
    return { start: `${filterYear}-${m}-01`, end: `${filterYear}-${m}-${String(last).padStart(2, "0")}` };
  }, [periodMode, filterMonth, filterYear]);

  const filtered = useMemo(() => {
    return payables.filter((p) => {
      // Period
      if (periodRange) {
        if (p.due_date < periodRange.start || p.due_date > periodRange.end) return false;
      }
      // Status
      if (statusFilter === "all") return true;
      if (statusFilter === "vencida") return isOverdue(p, today);
      if (statusFilter === "pendente") return p.status === "pendente" && !isOverdue(p, today);
      if (statusFilter === "pago") return p.status === "pago";
      return true;
    });
  }, [payables, periodRange, statusFilter, today]);

  // Metrics: based on full payables (church-wide), not filtered
  const metrics = useMemo(() => {
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthLast = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(monthLast).padStart(2, "0")}`;
    let monthDue = 0, overdue = 0, future = 0, overdueCount = 0;
    const groups = new Set<string>();
    let pendingInstallments = 0;
    payables.forEach((p) => {
      if (p.installment_group_id) groups.add(p.installment_group_id);
      if (p.status === "pendente") {
        if (p.installment_total && p.installment_total > 1) pendingInstallments++;
        if (isOverdue(p, today)) { overdue += Number(p.amount); overdueCount++; }
        else if (p.due_date >= monthStart && p.due_date <= monthEnd) monthDue += Number(p.amount);
        else if (p.due_date > monthEnd) future += Number(p.amount);
      }
    });
    return { monthDue, overdue, overdueCount, future, recurringGroups: groups.size, pendingInstallments };
  }, [payables, today]);

  // Sibling groups: count overdue siblings per group for warning indicator
  const overdueByGroup = useMemo(() => {
    const map = new Map<string, number>();
    payables.forEach((p) => {
      if (p.installment_group_id && isOverdue(p, today)) {
        map.set(p.installment_group_id, (map.get(p.installment_group_id) || 0) + 1);
      }
    });
    return map;
  }, [payables, today]);

  const periodLabel = useMemo(() => {
    if (periodMode === "all") return "Todos os períodos";
    if (periodMode === "year") return `Ano ${filterYear}`;
    return `${MONTHS[filterMonth]}/${filterYear}`;
  }, [periodMode, filterMonth, filterYear]);

  const statusLabel = useMemo(() => {
    if (statusFilter === "all") return "Todas";
    if (statusFilter === "pendente") return "Pendentes";
    if (statusFilter === "vencida") return "Vencidas";
    return "Pagas";
  }, [statusFilter]);

  const openNew = () => {
    setEditing(null);
    setForm(buildEmpty());
    setEditScope("single");
    setOpen(true);
  };
  const openEdit = (p: FinancialPayable) => {
    setEditing(p);
    setEditScope("single");
    setForm({
      mode: p.recurrence === "nenhuma" ? "single" : (p.installment_group_id ? "recurring_finite" : "recurring_open"),
      description: p.description.replace(/\s*\(\d+\/\d+\)\s*$/, ""),
      amount: Number(p.amount), due_date: p.due_date,
      category_id: p.category_id, account_id: p.account_id, recurrence: p.recurrence,
      recurrence_interval_days: p.recurrence_interval_days || 30,
      notes: p.notes || "", recurrence_end_date: null,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.description || !form.amount || form.amount <= 0) return;
    setSubmitting(true);
    let res;
    if (editing) {
      const payload: Partial<CreatePayableData> = {
        description: form.description,
        amount: form.amount,
        due_date: form.due_date,
        category_id: form.category_id,
        account_id: form.account_id,
        notes: form.notes,
      };
      res = editScope === "future" && editing.installment_group_id
        ? await updateGroupFuture(editing, payload)
        : await updatePayable(editing.id, payload);
    } else {
      const isRec = form.mode !== "single";
      const isFinite = form.mode === "recurring_finite";
      const payload: CreatePayableData = {
        description: form.description,
        amount: form.amount,
        due_date: form.due_date,
        category_id: form.category_id,
        account_id: form.account_id,
        notes: form.notes,
        recurrence: isRec ? (form.recurrence || "mensal") : "nenhuma",
        recurrence_interval_days: isRec && form.recurrence === "personalizada"
          ? Math.max(1, form.recurrence_interval_days || 30)
          : null,
        recurrence_end_date: isFinite ? (form.recurrence_end_date || null) : null,
      };
      res = await createPayable(payload);
    }
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
    const periodText = `${periodLabel} • ${statusLabel}`;
    const totalFiltered = filtered.reduce((s, p) => s + Number(p.amount), 0);
    exportToPdf({
      title: "Contas a Pagar",
      churchName,
      period: periodText,
      columns: [
        { header: "Vencimento", dataKey: "due" },
        { header: "Descrição", dataKey: "desc" },
        { header: "Parcela", dataKey: "parc" },
        { header: "Categoria", dataKey: "cat" },
        { header: "Conta", dataKey: "acc" },
        { header: "Status", dataKey: "status" },
        { header: "Valor", dataKey: "amount", align: "right" },
      ],
      rows: filtered.map((p) => {
        const overdueRow = isOverdue(p, today);
        return {
          due: new Date(p.due_date + "T12:00:00").toLocaleDateString("pt-BR"),
          desc: p.description.replace(/\s*\(\d+\/\d+\)\s*$/, ""),
          parc: p.installment_total ? `${p.installment_number}/${p.installment_total}` : "—",
          cat: categories.find((c) => c.id === p.category_id)?.name || "—",
          acc: accounts.find((a) => a.id === p.account_id)?.name || "—",
          status: p.status === "pago" ? "Pago" : overdueRow ? `Vencida (${daysBetween(p.due_date, today)}d)` : "Pendente",
          amount: `R$ ${formatBRL(Number(p.amount))}`,
        };
      }),
      totals: [
        { label: `Total (${filtered.length} contas)`, value: `R$ ${formatBRL(totalFiltered)}` },
      ],
      filename: `contas-a-pagar-${periodMode}-${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      {/* Dashboard metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Vence no mês</p>
          <p className="text-xl font-bold mt-1">R$ {formatBRL(metrics.monthDue)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Vencidas</p>
          <p className="text-xl font-bold mt-1 text-destructive flex items-center gap-2">
            {metrics.overdueCount > 0 && <AlertCircle className="w-4 h-4" />}
            R$ {formatBRL(metrics.overdue)}
          </p>
          <p className="text-[10px] text-muted-foreground">{metrics.overdueCount} contas</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Futuras</p>
          <p className="text-xl font-bold mt-1">R$ {formatBRL(metrics.future)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Recorrências</p>
          <p className="text-xl font-bold mt-1">{metrics.recurringGroups}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Parcelas pendentes</p>
          <p className="text-xl font-bold mt-1">{metrics.pendingInstallments}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg">Contas a Pagar</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
                <Download className="w-4 h-4 mr-2" /> PDF
              </Button>
              <Button size="sm" onClick={openNew}>
                <Plus className="w-4 h-4 mr-2" /> Nova Conta
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={periodMode} onValueChange={(v: PeriodMode) => setPeriodMode(v)}>
              <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
            {periodMode === "month" && (
              <Select value={String(filterMonth)} onValueChange={(v) => setFilterMonth(Number(v))}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (<SelectItem key={i} value={String(i)}>{m}</SelectItem>))}
                </SelectContent>
              </Select>
            )}
            {(periodMode === "month" || periodMode === "year") && (
              <Select value={String(filterYear)} onValueChange={(v) => setFilterYear(Number(v))}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="vencida">Vencidas</SelectItem>
                <SelectItem value="pago">Pagas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">Nenhuma conta neste filtro.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const overdueRow = isOverdue(p, today);
                    const dDays = daysBetween(today, p.due_date);
                    const cleanDesc = p.description.replace(/\s*\(\d+\/\d+\)\s*$/, "");
                    const groupOverdue = p.installment_group_id ? (overdueByGroup.get(p.installment_group_id) || 0) : 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className={overdueRow ? "text-destructive font-medium" : ""}>
                          <div>{new Date(p.due_date + "T12:00:00").toLocaleDateString("pt-BR")}</div>
                          {p.status === "pendente" && (
                            <div className="text-[10px] text-muted-foreground">
                              {overdueRow ? `${-dDays} dias atrasada` : dDays === 0 ? "vence hoje" : `em ${dDays} dias`}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{cleanDesc}</span>
                            {p.installment_total && p.installment_total > 1 && (
                              <Badge variant="outline" className="text-[10px]">
                                {p.installment_number}/{p.installment_total}
                              </Badge>
                            )}
                            {p.recurrence !== "nenhuma" && !p.installment_group_id && (
                              <Badge variant="outline" className="text-[10px]">{recurrenceLabel[p.recurrence]}</Badge>
                            )}
                          </div>
                          {groupOverdue > 0 && p.status === "pendente" && (
                            <div className="text-[10px] text-destructive mt-0.5">
                              {groupOverdue} parcela{groupOverdue > 1 ? "s" : ""} vencida{groupOverdue > 1 ? "s" : ""} deste compromisso
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {categories.find((c) => c.id === p.category_id)?.name || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={
                            p.status === "pago"
                              ? "bg-success/20 text-success"
                              : overdueRow ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-foreground"
                          }>
                            {p.status === "pago" ? "Pago" : overdueRow ? "Vencida" : "Pendente"}
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
            <DialogDescription>
              {editing
                ? "Edite esta parcela ou aplique a todas as futuras pendentes do compromisso."
                : "Crie uma conta única ou recorrente. Recorrência sem data fim gera próximas parcelas automaticamente."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div className="space-y-2">
                <Label>Tipo de lançamento</Label>
                <Select value={form.mode} onValueChange={(v: CreationMode) => setForm({ ...form, mode: v, recurrence_end_date: v === "recurring_finite" ? form.recurrence_end_date : null })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Conta única</SelectItem>
                    <SelectItem value="recurring_open">Recorrente sem fim (água, luz, aluguel...)</SelectItem>
                    <SelectItem value="recurring_finite">Recorrente com início e fim (parcelado)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {form.mode === "single" && "Pagamento único / avulso."}
                  {form.mode === "recurring_open" && "Próxima ocorrência é gerada automaticamente ao pagar."}
                  {form.mode === "recurring_finite" && "Todas as parcelas são pré-geradas (1/N, 2/N...) entre o início e o fim."}
                </p>
              </div>
            )}

            {editing && editing.installment_group_id && (
              <div className="space-y-2 p-3 bg-muted/40 rounded-lg">
                <Label className="text-xs">Aplicar alteração em</Label>
                <Select value={editScope} onValueChange={(v: "single" | "future") => setEditScope(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Apenas esta parcela</SelectItem>
                    <SelectItem value="future">Esta e todas as futuras pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

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
                <Label>{form.mode !== "single" && !editing ? "Data inicial *" : "Vencimento *"}</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} disabled={editScope === "future"} />
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

            {!editing && form.mode !== "single" && (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Frequência</Label>
                    <Select value={form.recurrence || "mensal"} onValueChange={(v: PayableRecurrence) => setForm({ ...form, recurrence: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                        <SelectItem value="personalizada">Personalizada (dias)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.recurrence === "personalizada" && (
                    <div className="space-y-2">
                      <Label>Intervalo (dias) *</Label>
                      <Input type="number" min="1" value={form.recurrence_interval_days || 30}
                        onChange={(e) => setForm({ ...form, recurrence_interval_days: Math.max(1, parseInt(e.target.value || "30")) })} />
                    </div>
                  )}
                  {form.mode === "recurring_finite" && (
                    <div className="space-y-2">
                      <Label>Data final *</Label>
                      <Input type="date" value={form.recurrence_end_date || ""}
                        onChange={(e) => setForm({ ...form, recurrence_end_date: e.target.value || null })} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {form.mode === "recurring_finite"
                    ? "Todas as parcelas serão geradas automaticamente entre as datas (1/N, 2/N...)."
                    : "Recorrência contínua: ao pagar, a próxima ocorrência é criada automaticamente."}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={
              submitting || !form.description || !form.amount ||
              (!editing && form.mode !== "single" && form.recurrence === "personalizada" && !(form.recurrence_interval_days && form.recurrence_interval_days > 0)) ||
              (!editing && form.mode === "recurring_finite" && !form.recurrence_end_date)
            }>
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
