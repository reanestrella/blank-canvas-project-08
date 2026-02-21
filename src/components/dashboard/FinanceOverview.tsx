import { DollarSign, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function FinanceOverview() {
  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const [isLoading, setIsLoading] = useState(true);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);

  useEffect(() => {
    if (!churchId) { setIsLoading(false); return; }
    const fetch = async () => {
      setIsLoading(true);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      const { data } = await supabase
        .from("financial_transactions")
        .select("type, amount")
        .eq("church_id", churchId)
        .gte("transaction_date", startOfMonth)
        .lte("transaction_date", endOfMonth);

      let inc = 0, exp = 0;
      (data || []).forEach(t => {
        if (t.type === "receita") inc += Number(t.amount);
        else exp += Number(t.amount);
      });
      setIncome(inc);
      setExpenses(exp);
      setIsLoading(false);
    };
    fetch();
  }, [churchId]);

  if (isLoading) {
    return (
      <div className="card-elevated p-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const balance = income - expenses;
  const monthName = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  if (income === 0 && expenses === 0) {
    return (
      <div className="card-elevated p-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          Sem movimentações em {monthName}. Registre transações no módulo Financeiro.
        </p>
      </div>
    );
  }

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  return (
    <div className="card-elevated p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
        </div>
        <span className="text-sm text-muted-foreground capitalize">{monthName}</span>
      </div>

      <div className="p-4 rounded-xl gradient-primary text-primary-foreground mb-4">
        <p className="text-sm opacity-80">Saldo do Mês</p>
        <p className="text-3xl font-bold mt-1">R$ {fmt(balance)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-success/10">
          <div className="flex items-center gap-2 text-success mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Entradas</span>
          </div>
          <p className="text-xl font-bold text-success">R$ {fmt(income)}</p>
        </div>
        <div className="p-4 rounded-xl bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-medium">Saídas</span>
          </div>
          <p className="text-xl font-bold text-destructive">R$ {fmt(expenses)}</p>
        </div>
      </div>
    </div>
  );
}
