import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowDown } from "lucide-react";
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
    const baptizedInPeriod = activeMembers.filter(m => {
      if (!(m as any).baptism_date) return false;
      if (periodMode === "all") return true;
      const bd = new Date((m as any).baptism_date);
      if (periodMode === "year") return bd.getFullYear() === filterYear;
      return bd.getFullYear() === filterYear && bd.getMonth() === filterMonth;
    }).length;

    return [
      { label: "Visitantes", value: stats.totalVisitantes, color: "bg-muted-foreground", gradient: "from-muted-foreground/20 to-muted-foreground/5" },
      { label: "Decididos", value: stats.totalDecididos, color: "bg-success", gradient: "from-success/20 to-success/5" },
      { label: "Batizados", value: baptizedInPeriod, color: "bg-info", gradient: "from-info/20 to-info/5" },
      { label: "Membros", value: stats.totalMembers, color: "bg-primary", gradient: "from-primary/20 to-primary/5" },
    ];
  }, [members, stats, periodMode, filterMonth, filterYear]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const total = funnelSteps.reduce((s, st) => s + st.value, 0);
  if (total === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">Sem dados ainda. Cadastre membros para ver o funil.</p>
        </CardContent>
      </Card>
    );
  }

  const maxVal = Math.max(...funnelSteps.map(s => s.value), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Funil Espiritual</CardTitle>
          <FinancialFilters
            mode={periodMode}
            month={filterMonth}
            year={filterYear}
            onModeChange={setPeriodMode}
            onMonthChange={setFilterMonth}
            onYearChange={setFilterYear}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {funnelSteps.map((step, i) => {
            const pct = (step.value / maxVal) * 100;
            return (
              <div key={step.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{step.label}</span>
                  <span className="tabular-nums font-semibold">{step.value}</span>
                </div>
                <div className={cn("h-9 overflow-hidden rounded-xl bg-gradient-to-r", step.gradient)}>
                  <div
                    className={cn("flex h-full items-center justify-center rounded-xl transition-all duration-700", step.color)}
                    style={{ width: `${Math.max(pct, 8)}%` }}
                  >
                    <span className="text-xs font-bold text-white drop-shadow-sm">{step.value}</span>
                  </div>
                </div>
                {i < funnelSteps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="h-3 w-3 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Visitantes → Decididos → Batizados → Membros
        </p>
      </CardContent>
    </Card>
  );
}
