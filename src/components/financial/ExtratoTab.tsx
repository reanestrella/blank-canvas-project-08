import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Wallet, PiggyBank,
} from "lucide-react";
import type { FinancialTransaction, FinancialCategory } from "@/hooks/useFinancial";
import type { FinancialAccount } from "@/hooks/useFinancialAccounts";

interface ExtratoTabProps {
  /** Already filtered by the current period */
  transactions: FinancialTransaction[];
  /** ALL transactions (unfiltered) for total balance */
  allTransactions: FinancialTransaction[];
  categories: FinancialCategory[];
  accounts: FinancialAccount[];
  /** Year/month for previous-month calc */
  year: number;
  month: number;
  mode: "month" | "year" | "all";
}

export function ExtratoTab({
  transactions,
  allTransactions,
  categories,
  accounts,
  year,
  month,
  mode,
}: ExtratoTabProps) {
  const periodIncome = transactions
    .filter((t) => t.type === "receita")
    .reduce((s, t) => s + Number(t.amount), 0);

  const periodExpense = transactions
    .filter((t) => t.type === "despesa")
    .reduce((s, t) => s + Number(t.amount), 0);

  const periodBalance = periodIncome - periodExpense;

  const totalBalance = allTransactions.reduce(
    (s, t) => s + (t.type === "receita" ? Number(t.amount) : -Number(t.amount)),
    0,
  );

  const previousMonthBalance = useMemo(() => {
    if (mode !== "month") return null;
    const prevDate = new Date(year, month, 0); // last day of previous month
    return allTransactions
      .filter((t) => new Date(t.transaction_date) <= prevDate)
      .reduce(
        (s, t) => s + (t.type === "receita" ? Number(t.amount) : -Number(t.amount)),
        0,
      );
  }, [allTransactions, year, month, mode]);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => (map[c.id] = c.name));
    return map;
  }, [categories]);

  const accountMap = useMemo(() => {
    const map: Record<string, string> = {};
    accounts.forEach((a) => (map[a.id] = a.name));
    return map;
  }, [accounts]);

  const fmt = (v: number) =>
    `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const cards = [
    { label: "Entradas", value: periodIncome, icon: ArrowUpRight, cls: "text-success" },
    { label: "Saídas", value: periodExpense, icon: ArrowDownRight, cls: "text-destructive" },
    { label: "Saldo do Período", value: periodBalance, icon: TrendingUp, cls: periodBalance >= 0 ? "text-success" : "text-destructive" },
    ...(previousMonthBalance !== null
      ? [{ label: "Saldo Mês Anterior", value: previousMonthBalance, icon: TrendingDown, cls: previousMonthBalance >= 0 ? "text-success" : "text-destructive" }]
      : []),
    { label: "Saldo Total", value: totalBalance, icon: PiggyBank, cls: totalBalance >= 0 ? "text-success" : "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
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

      {/* Statement table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Extrato Detalhado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma movimentação neste período.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(tx.transaction_date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.category_id ? categoryMap[tx.category_id] || "—" : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.account_id ? accountMap[tx.account_id] || "—" : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          tx.type === "receita"
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive"
                        }
                      >
                        {tx.type === "receita" ? "Entrada" : "Saída"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        tx.type === "receita" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {tx.type === "receita" ? "+" : "-"}
                      {fmt(Number(tx.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
