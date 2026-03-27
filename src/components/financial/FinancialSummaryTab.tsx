import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Heart, Gift, Target, Package } from "lucide-react";
import type { FinancialTransaction } from "@/hooks/useFinancial";

interface FinancialSummaryTabProps {
  transactions: FinancialTransaction[];
  categories: { id: string; name: string; type: string }[];
}

export function FinancialSummaryTab({ transactions, categories }: FinancialSummaryTabProps) {
  const summary = useMemo(() => {
    const catMap = new Map(categories.map(c => [c.id, c.name]));
    let dizimos = 0, ofertas = 0, campanhas = 0, outrasReceitas = 0, totalDespesas = 0;
    const byCategory: Record<string, number> = {};

    transactions.forEach(tx => {
      const amount = Number(tx.amount);
      const catName = (tx.category_id ? catMap.get(tx.category_id) : tx.description) || tx.description;
      const catLower = catName.toLowerCase();

      if (tx.type === "receita") {
        if (catLower.includes("dízimo") || catLower.includes("dizimo")) dizimos += amount;
        else if (catLower.includes("oferta")) ofertas += amount;
        else if (catLower.includes("campanha")) campanhas += amount;
        else outrasReceitas += amount;
      } else {
        totalDespesas += amount;
      }

      const key = tx.type === "receita" ? catName : `[Despesa] ${catName}`;
      byCategory[key] = (byCategory[key] || 0) + amount;
    });

    const totalReceitas = dizimos + ofertas + campanhas + outrasReceitas;
    return { dizimos, ofertas, campanhas, outrasReceitas, totalReceitas, totalDespesas, byCategory };
  }, [transactions, categories]);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const saldo = summary.totalReceitas - summary.totalDespesas;

  const items = [
    { label: "Dízimos", value: summary.dizimos, icon: Heart, color: "text-success" },
    { label: "Ofertas", value: summary.ofertas, icon: Gift, color: "text-primary" },
    { label: "Campanhas", value: summary.campanhas, icon: Target, color: "text-secondary" },
    { label: "Outras Receitas", value: summary.outrasReceitas, icon: Package, color: "text-muted-foreground" },
  ];

  const sortedCategories = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Main totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-success/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm text-muted-foreground">Total Receitas</span>
            </div>
            <p className="text-2xl font-bold text-success">{fmt(summary.totalReceitas)}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Total Despesas</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{fmt(summary.totalDespesas)}</p>
          </CardContent>
        </Card>
        <Card className={saldo >= 0 ? "border-primary/30" : "border-destructive/30"}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">Saldo</span>
            </div>
            <p className={`text-2xl font-bold ${saldo >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(saldo)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base">Detalhamento de Receitas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <span className="font-semibold">{fmt(item.value)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* By category */}
      {sortedCategories.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Por Categoria</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {sortedCategories.slice(0, 15).map(([cat, val]) => (
              <div key={cat} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground">{cat}</span>
                <span className="font-medium">{fmt(val)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
