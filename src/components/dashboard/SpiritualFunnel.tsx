import { cn } from "@/lib/utils";

const funnelSteps = [
  { label: "Visitantes", value: 45, color: "bg-info", width: "100%" },
  { label: "Novos Convertidos", value: 28, color: "bg-secondary", width: "75%" },
  { label: "Em Discipulado", value: 18, color: "bg-success", width: "55%" },
  { label: "Líderes Ativos", value: 12, color: "bg-primary", width: "35%" },
];

export function SpiritualFunnel() {
  return (
    <div className="card-elevated p-6 animate-slide-up">
      <h3 className="text-lg font-semibold mb-6">Funil Espiritual</h3>
      <div className="space-y-4">
        {funnelSteps.map((step, index) => (
          <div key={step.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{step.label}</span>
              <span className="text-muted-foreground">{step.value} pessoas</span>
            </div>
            <div className="h-10 bg-muted rounded-lg overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-lg transition-all duration-700 flex items-center justify-center",
                  step.color
                )}
                style={{ 
                  width: step.width,
                  animationDelay: `${index * 100}ms`
                }}
              >
                <span className="text-sm font-bold text-white">{step.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4 text-center">
        Pipeline: Ganho → Consolidação → Discipulado → Envio
      </p>
    </div>
  );
}
