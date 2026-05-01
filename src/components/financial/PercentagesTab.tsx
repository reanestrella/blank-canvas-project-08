import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Percent, Trash2, Edit, Loader2, Calculator } from "lucide-react";
import type { FinancialTransaction } from "@/hooks/useFinancial";

type Base = "receita" | "despesa" | "saldo";

interface PercentageRule {
  id: string;
  church_id: string;
  name: string;
  percentage: number;
  base: Base;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

interface Props {
  churchId: string;
  /** Transações já filtradas pelo período selecionado */
  transactions: FinancialTransaction[];
  periodLabel: string;
}

const BASE_LABEL: Record<Base, string> = {
  receita: "Total de Receitas",
  despesa: "Total de Despesas",
  saldo: "Saldo (Receitas - Despesas)",
};

const fmt = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function PercentagesTab({ churchId, transactions, periodLabel }: Props) {
  const { toast } = useToast();
  const [rules, setRules] = useState<PercentageRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PercentageRule | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState<string>("10");
  const [base, setBase] = useState<Base>("receita");
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState("");

  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("financial_percentages")
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: true });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setRules((data as PercentageRule[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (churchId) fetchRules();
  }, [churchId]);

  const totals = useMemo(() => {
    const receita = transactions
      .filter((t) => t.type === "receita")
      .reduce((s, t) => s + Number(t.amount), 0);
    const despesa = transactions
      .filter((t) => t.type === "despesa")
      .reduce((s, t) => s + Number(t.amount), 0);
    return { receita, despesa, saldo: receita - despesa };
  }, [transactions]);

  const baseValue = (b: Base) =>
    b === "receita" ? totals.receita : b === "despesa" ? totals.despesa : totals.saldo;

  const resetForm = () => {
    setEditing(null);
    setName("");
    setPercentage("10");
    setBase("receita");
    setIsActive(true);
    setNotes("");
  };

  const openNew = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (r: PercentageRule) => {
    setEditing(r);
    setName(r.name);
    setPercentage(String(r.percentage));
    setBase(r.base);
    setIsActive(r.is_active);
    setNotes(r.notes || "");
    setOpen(true);
  };

  const save = async () => {
    const pct = parseFloat(percentage.replace(",", "."));
    if (!name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      toast({ title: "Percentual inválido", description: "Use um valor entre 0 e 100.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      church_id: churchId,
      name: name.trim(),
      percentage: pct,
      base,
      is_active: isActive,
      notes: notes.trim() || null,
    };

    const { error } = editing
      ? await supabase.from("financial_percentages").update(payload).eq("id", editing.id)
      : await supabase.from("financial_percentages").insert([payload]);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Percentual atualizado" : "Percentual criado" });
    setOpen(false);
    resetForm();
    fetchRules();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este percentual?")) return;
    const { error } = await supabase.from("financial_percentages").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Percentual excluído" });
    fetchRules();
  };

  const toggleActive = async (r: PercentageRule) => {
    const { error } = await supabase
      .from("financial_percentages")
      .update({ is_active: !r.is_active })
      .eq("id", r.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    fetchRules();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Percentuais Financeiros
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Calcule automaticamente percentuais sobre receitas, despesas ou saldo. Ex.: 10% da receita = base administrativa.
            </p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Percentual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar Percentual" : "Novo Percentual"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Base Administrativa"
                    maxLength={80}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Percentual (%) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Calcular sobre</Label>
                    <Select value={base} onValueChange={(v) => setBase(v as Base)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receitas</SelectItem>
                        <SelectItem value="despesa">Despesas</SelectItem>
                        <SelectItem value="saldo">Saldo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Opcional"
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label>Ativo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Bases atuais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Receitas — {periodLabel}</p>
            <p className="text-xl font-bold text-success">{fmt(totals.receita)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Despesas — {periodLabel}</p>
            <p className="text-xl font-bold text-destructive">{fmt(totals.despesa)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Saldo — {periodLabel}</p>
            <p className={`text-xl font-bold ${totals.saldo >= 0 ? "text-primary" : "text-destructive"}`}>
              {fmt(totals.saldo)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de regras + cálculos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Cálculo do Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : rules.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhum percentual cadastrado. Clique em "Novo Percentual" para começar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Valor base</TableHead>
                  <TableHead className="text-right">Valor calculado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => {
                  const bv = baseValue(r.base);
                  const calc = (bv * Number(r.percentage)) / 100;
                  return (
                    <TableRow key={r.id} className={!r.is_active ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        {r.name}
                        {r.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">{r.notes}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {BASE_LABEL[r.base]}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(r.percentage).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {fmt(bv)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {fmt(calc)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={r.is_active ? "bg-success/20 text-success cursor-pointer" : "cursor-pointer"}
                          onClick={() => toggleActive(r)}
                        >
                          {r.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
