import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Wallet,
  PiggyBank, Search, User, CreditCard, Tag, FileText, Calendar,
  Heart, Gift, Megaphone, Wrench, Zap, Users as UsersIcon, Package,
  Receipt, ArrowRightLeft, Download,
} from "lucide-react";
import { exportToPdf, formatBRL } from "@/lib/pdfExport";
import type { FinancialTransaction, FinancialCategory } from "@/hooks/useFinancial";
import type { FinancialAccount } from "@/hooks/useFinancialAccounts";
import type { Member } from "@/hooks/useMembers";

interface ExtratoTabProps {
  transactions: FinancialTransaction[];
  allTransactions: FinancialTransaction[];
  categories: FinancialCategory[];
  accounts: FinancialAccount[];
  members?: Member[];
  year: number;
  month: number;
  mode: "month" | "year" | "all";
  churchName?: string;
}

const fmt = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao: "Cartão",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  transferencia: "Transferência",
  boleto: "Boleto",
  cheque: "Cheque",
};

function categoryIcon(name?: string) {
  const n = (name || "").toLowerCase();
  if (n.includes("dízimo") || n.includes("dizimo")) return Heart;
  if (n.includes("oferta")) return Gift;
  if (n.includes("campanha")) return Megaphone;
  if (n.includes("manuten") || n.includes("reforma") || n.includes("constru")) return Wrench;
  if (n.includes("água") || n.includes("agua") || n.includes("energia") || n.includes("luz")) return Zap;
  if (n.includes("célula") || n.includes("celula")) return UsersIcon;
  if (n.includes("transfer")) return ArrowRightLeft;
  if (n.includes("compra") || n.includes("material")) return Package;
  if (n.includes("salár") || n.includes("ajuda")) return Receipt;
  return Tag;
}

function categoryColorClass(name?: string) {
  const n = (name || "").toLowerCase();
  if (n.includes("dízimo") || n.includes("dizimo")) return "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20";
  if (n.includes("oferta")) return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
  if (n.includes("campanha")) return "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20";
  if (n.includes("célula") || n.includes("celula")) return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20";
  if (n.includes("manuten") || n.includes("reforma")) return "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20";
  if (n.includes("água") || n.includes("energia") || n.includes("luz")) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20";
  return "bg-muted text-muted-foreground border-border";
}

export function ExtratoTab({
  transactions,
  allTransactions,
  categories,
  accounts,
  members = [],
  year,
  month,
  mode,
}: ExtratoTabProps) {
  const [typeFilter, setTypeFilter] = useState<"all" | "receita" | "despesa">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const categoryMap = useMemo(() => {
    const map: Record<string, FinancialCategory> = {};
    categories.forEach((c) => (map[c.id] = c));
    return map;
  }, [categories]);

  const accountMap = useMemo(() => {
    const map: Record<string, string> = {};
    accounts.forEach((a) => (map[a.id] = a.name));
    return map;
  }, [accounts]);

  const memberMap = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m) => (map[m.id] = m.full_name));
    return map;
  }, [members]);

  const paymentMethods = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => t.payment_method && set.add(t.payment_method));
    return Array.from(set);
  }, [transactions]);

  const buildLabel = (tx: FinancialTransaction) => {
    const catName = tx.category_id ? categoryMap[tx.category_id]?.name : null;
    const memberName = tx.member_id ? memberMap[tx.member_id] : null;
    if (memberName && catName) return `${catName} — ${memberName}`;
    if (memberName) return `${tx.type === "receita" ? "Contribuição" : "Pagamento"} — ${memberName}`;
    if (catName && (!tx.description || tx.description.toLowerCase() === catName.toLowerCase()))
      return catName;
    return tx.description || catName || (tx.type === "receita" ? "Entrada" : "Saída");
  };

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (categoryFilter !== "all" && tx.category_id !== categoryFilter) return false;
      if (paymentFilter !== "all" && tx.payment_method !== paymentFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [
          tx.description,
          tx.notes,
          tx.reference_number,
          tx.category_id ? categoryMap[tx.category_id]?.name : "",
          tx.member_id ? memberMap[tx.member_id] : "",
          tx.account_id ? accountMap[tx.account_id] : "",
          tx.payment_method,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, paymentFilter, search, categoryMap, memberMap, accountMap]);

  const periodIncome = filtered.filter((t) => t.type === "receita").reduce((s, t) => s + Number(t.amount), 0);
  const periodExpense = filtered.filter((t) => t.type === "despesa").reduce((s, t) => s + Number(t.amount), 0);
  const periodBalance = periodIncome - periodExpense;

  const totalBalance = allTransactions.reduce(
    (s, t) => s + (t.type === "receita" ? Number(t.amount) : -Number(t.amount)),
    0,
  );

  const previousMonthBalance = useMemo(() => {
    if (mode !== "month") return null;
    const prevDate = new Date(year, month, 0);
    return allTransactions
      .filter((t) => new Date(t.transaction_date) <= prevDate)
      .reduce((s, t) => s + (t.type === "receita" ? Number(t.amount) : -Number(t.amount)), 0);
  }, [allTransactions, year, month, mode]);

  const cards = [
    { label: "Entradas", value: periodIncome, icon: ArrowUpRight, cls: "text-success", bg: "bg-success/5 border-success/20" },
    { label: "Saídas", value: periodExpense, icon: ArrowDownRight, cls: "text-destructive", bg: "bg-destructive/5 border-destructive/20" },
    { label: "Saldo do Período", value: periodBalance, icon: TrendingUp, cls: periodBalance >= 0 ? "text-success" : "text-destructive", bg: "bg-card" },
    ...(previousMonthBalance !== null
      ? [{ label: "Saldo Mês Anterior", value: previousMonthBalance, icon: TrendingDown, cls: previousMonthBalance >= 0 ? "text-success" : "text-destructive", bg: "bg-card" }]
      : []),
    { label: "Saldo Total", value: totalBalance, icon: PiggyBank, cls: totalBalance >= 0 ? "text-success" : "text-destructive", bg: "bg-card" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className={c.bg}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <c.icon className={`w-4 h-4 ${c.cls}`} />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <p className={`text-lg font-bold ${c.cls}`}>{fmt(c.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por pessoa, descrição, observação..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="receita">Entradas</SelectItem>
                <SelectItem value="despesa">Saídas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {paymentMethods.length > 0 && (
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as formas</SelectItem>
                  {paymentMethods.map((p) => (
                    <SelectItem key={p} value={p!}>{PAYMENT_LABELS[p!] || p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statement table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Extrato Detalhado
            <Badge variant="secondary" className="ml-2">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma movimentação encontrada com esses filtros.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]"><Calendar className="w-3.5 h-3.5 inline mr-1" />Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="hidden lg:table-cell">Conta</TableHead>
                    <TableHead className="hidden lg:table-cell">Forma</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tx) => {
                    const cat = tx.category_id ? categoryMap[tx.category_id] : null;
                    const Icon = categoryIcon(cat?.name);
                    const memberName = tx.member_id ? memberMap[tx.member_id] : null;
                    const isReceita = tx.type === "receita";
                    return (
                      <TableRow key={tx.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(tx.transaction_date + (tx.transaction_date.length === 10 ? "T12:00:00" : "")).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2.5">
                            <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isReceita ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm leading-tight">{buildLabel(tx)}</div>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                                {memberName && (
                                  <span className="inline-flex items-center gap-1">
                                    <User className="w-3 h-3" />{memberName}
                                  </span>
                                )}
                                {tx.reference_number && (
                                  <span className="inline-flex items-center gap-1">
                                    <FileText className="w-3 h-3" />Ref: {tx.reference_number}
                                  </span>
                                )}
                                {tx.notes && (
                                  <span className="truncate max-w-[260px]" title={tx.notes}>
                                    {tx.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {cat ? (
                            <Badge variant="outline" className={categoryColorClass(cat.name)}>
                              {cat.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {tx.account_id ? accountMap[tx.account_id] || "—" : "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {tx.payment_method ? (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <CreditCard className="w-3 h-3" />
                              {PAYMENT_LABELS[tx.payment_method] || tx.payment_method}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-semibold whitespace-nowrap ${
                          isReceita ? "text-success" : "text-destructive"
                        }`}>
                          {isReceita ? "+" : "-"}{fmt(Number(tx.amount))}
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
    </div>
  );
}
