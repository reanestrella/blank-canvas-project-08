import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Loader2 } from "lucide-react";

export function SpiritualFunnel() {
  const { profile } = useAuth();
  const { stats, isLoading } = useDashboardStats(null);

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

  const total = stats.totalVisitantes + stats.totalDecididos + stats.totalMembers;

  const funnelSteps = [
    { label: "Visitantes", value: stats.totalVisitantes, color: "bg-info" },
    { label: "Novos Convertidos", value: stats.totalDecididos, color: "bg-secondary" },
    { label: "Membros Ativos", value: stats.totalMembers, color: "bg-primary" },
    { label: "Batizados", value: stats.totalBaptized, color: "bg-success" },
  ];

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
      <h3 className="text-lg font-semibold mb-6">Funil Espiritual</h3>
      <div className="space-y-4">
        {funnelSteps.map((step, index) => {
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
        Pipeline: Ganho → Consolidação → Discipulado → Envio
      </p>
    </div>
  );
}
