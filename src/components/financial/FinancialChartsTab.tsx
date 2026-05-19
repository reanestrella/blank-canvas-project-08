import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, DollarSign, Percent, PiggyBank } from "lucide-react";
import type { FinancialTransaction } from "@/hooks/useFinancial";

interface FinancialChartsTabProps {
  transactions: FinancialTransaction[];
  periodLabel?: string;
}

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export function FinancialChartsTab({ transactions, periodLabel }: FinancialChartsTabProps) {
  // Aggregate dynamically by YYYY-MM from whatever is passed in (already period-filtered upstream)
  const monthlyData = useMemo(() => {
    const buckets = new Map<string, { key: string; label: string; receita: number; despesa: number; saldo: number }>();
    transactions.forEach((tx) => {
      const parts = tx.transaction_date.split("-");
      const year = parseInt(parts[0]);
      const monthIdx = parseInt(parts[1]) - 1;
      if (Number.isNaN(year) || Number.isNaN(monthIdx)) return;
      const key = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
      const label = `${MONTHS[monthIdx]}/${String(year).slice(-2)}`;
      const cur = buckets.get(key) || { key, label, receita: 0, despesa: 0, saldo: 0 };
      const amount = Number(tx.amount);
      if (tx.type === "receita") cur.receita += amount;
      else cur.despesa += amount;
      cur.saldo = cur.receita - cur.despesa;
      buckets.set(key, cur);
    });
    return Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [transactions]);

  const growthData = useMemo(() => {
    return monthlyData.map((d, i) => {
      const prev = i > 0 ? monthlyData[i - 1].receita : 0;
      const growth = prev > 0 ? ((d.receita - prev) / prev) * 100 : 0;
      return { label: d.label, crescimento: Math.round(growth * 10) / 10 };
    });
  }, [monthlyData]);

  const totalReceita = monthlyData.reduce((s, d) => s + d.receita, 0);
  const totalDespesa = monthlyData.reduce((s, d) => s + d.despesa, 0);
  const mesesComReceita = monthlyData.filter(d => d.receita > 0).length;
  const mediamensal = mesesComReceita > 0 ? totalReceita / mesesComReceita : 0;

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Receita Total</p>
            <p className="text-lg font-bold text-success">{fmt(totalReceita)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <PiggyBank className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Média Mensal</p>
            <p className="text-lg font-bold">{fmt(mediamensal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-secondary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Meses c/ Receita</p>
            <p className="text-lg font-bold">{mesesComReceita}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Percent className="w-5 h-5 text-info mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Margem</p>
            <p className="text-lg font-bold">
              {totalReceita > 0 ? `${Math.round(((totalReceita - totalDespesa) / totalReceita) * 100)}%` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly revenue bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Receitas e Despesas por Mês{periodLabel ? ` (${periodLabel})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Sem dados no período selecionado.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="receita" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Receita" />
                <Bar dataKey="despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesa" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Growth line chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Crescimento Mensal (%)</CardTitle></CardHeader>
        <CardContent>
          {growthData.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Sem dados no período selecionado.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Line type="monotone" dataKey="crescimento" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Crescimento" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
