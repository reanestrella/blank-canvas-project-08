import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

const financeData = {
  balance: 15420.50,
  income: 8500.00,
  expenses: 3200.00,
  tithes: 6800.00,
  offerings: 1700.00,
};

const recentTransactions = [
  { id: 1, type: "income", description: "Dízimos Domingo", amount: 2500, date: "15/01" },
  { id: 2, type: "income", description: "Ofertas Culto", amount: 850, date: "15/01" },
  { id: 3, type: "expense", description: "Energia Elétrica", amount: -450, date: "14/01" },
  { id: 4, type: "income", description: "Campanha Missões", amount: 1200, date: "12/01" },
];

export function FinanceOverview() {
  return (
    <div className="card-elevated p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
        </div>
        <span className="text-sm text-muted-foreground">Janeiro 2024</span>
      </div>

      {/* Balance Card */}
      <div className="p-4 rounded-xl gradient-primary text-primary-foreground mb-4">
        <p className="text-sm opacity-80">Saldo Atual</p>
        <p className="text-3xl font-bold mt-1">
          R$ {financeData.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Income/Expense Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-success/10">
          <div className="flex items-center gap-2 text-success mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Entradas</span>
          </div>
          <p className="text-xl font-bold text-success">
            R$ {financeData.income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-medium">Saídas</span>
          </div>
          <p className="text-xl font-bold text-destructive">
            R$ {financeData.expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Últimas Movimentações
        </h4>
        <div className="space-y-2">
          {recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    tx.type === "income"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {tx.type === "income" ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
              </div>
              <span
                className={`font-semibold ${
                  tx.type === "income" ? "text-success" : "text-destructive"
                }`}
              >
                {tx.type === "income" ? "+" : ""}
                R$ {Math.abs(tx.amount).toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
