import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Loader2 } from "lucide-react";
import { FinancialFilters, PeriodMode } from "@/components/financial/FinancialFilters";

export function SpiritualFunnel() {
  const { profile } = useAuth();
  const { stats, isLoading, members } = useDashboardStats(null);

  const now = new Date();
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const funnelSteps = useMemo(() => {
    const activeMembers = members || [];

    // Batizados only in the selected period
    const baptizedInPeriod = activeMembers.filter(m => {
      if (!(m as any).baptism_date) return false;
      if (periodMode === "all") return true;
      const bd = new Date((m as any).baptism_date);
      if (periodMode === "year") return bd.getFullYear() === filterYear;
      return bd.getFullYear() === filterYear && bd.getMonth() === filterMonth;
    }).length;

    return [
      { label: "Visitantes", value: stats.totalVisitantes, color: "bg-muted-foreground" },
      { label: "Decididos", value: stats.totalDecididos, color: "bg-success" },
      { label: "Batizados", value: baptizedInPeriod, color: "bg-info" },
    ];
  }, [members, stats, periodMode, filterMonth, filterYear]);

  if (isLoading) {
    return (
      <div className="card-elevated p-6 animate-slide-up">
        <h3 className="text-lg font-semibold mb-6">Funil Espiritual</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const total = funnelSteps.reduce((s, st) => s + st.value, 0);

  if (total === 0) {
    return (
      <div className="card-elevated p-6 animate-slide-up">
        <h3 className="text-lg font-semibold mb-6">Funil Espiritual</h3>
        <p className="text-sm text-muted-foreground text-center py-4">Sem dados ainda. Cadastre membros para ver o funil.</p>
      </div>
    );
  }

  const maxVal = Math.max(...funnelSteps.map(s => s.value), 1);

  return (
    <div className="card-elevated p-6 animate-slide-up">
      <div className="flex flex-col gap-3 mb-6">
        <h3 className="text-lg font-semibold">Funil Espiritual</h3>
        <FinancialFilters
          mode={periodMode}
          month={filterMonth}
          year={filterYear}
          onModeChange={setPeriodMode}
          onMonthChange={setFilterMonth}
          onYearChange={setFilterYear}
        />
      </div>
      <div className="space-y-4">
        {funnelSteps.map((step) => {
          const pct = (step.value / maxVal) * 100;
          return (
            <div key={step.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{step.label}</span>
                <span className="text-muted-foreground">{step.value}</span>
              </div>
              <div className="h-10 bg-muted rounded-lg overflow-hidden">
                <div
                  className={cn("h-full rounded-lg transition-all duration-700 flex items-center justify-center", step.color)}
                  style={{ width: `${Math.max(pct, 5)}%` }}
                >
                  <span className="text-sm font-bold text-white">{step.value}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-4 text-center">
        Visitantes → Decididos → Batizados → Membros → Líderes
      </p>
    </div>
  );
}
