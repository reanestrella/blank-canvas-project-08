import { Link } from "react-router-dom";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

/**
 * Banner global de trial. Mostra contagem regressiva e CTA para assinar.
 * Não renderiza nada se o usuário não estiver em trial vigente.
 */
export function TrialBanner() {
  const { isTrial, trialDaysLeft, trialHoursLeft } = useSubscription();

  if (!isTrial) return null;

  // Define severidade visual
  const severity =
    trialDaysLeft <= 0 || trialHoursLeft <= 24
      ? "high"
      : trialDaysLeft === 1
      ? "medium"
      : "low";

  const message =
    trialDaysLeft <= 0
      ? `Seu teste expira em ${trialHoursLeft}h`
      : trialDaysLeft === 1
      ? "Último dia do seu teste grátis"
      : `Faltam ${trialDaysLeft} dias do seu teste grátis`;

  const Icon = severity === "high" ? AlertTriangle : severity === "medium" ? Clock : Sparkles;

  return (
    <div
      className={cn(
        "w-full px-4 py-2.5 flex items-center justify-between gap-3 border-b text-sm",
        severity === "high" && "bg-destructive/10 border-destructive/30 text-destructive-foreground",
        severity === "medium" && "bg-secondary/15 border-secondary/30 text-foreground",
        severity === "low" && "bg-primary/10 border-primary/20 text-foreground"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            severity === "high" && "text-destructive",
            severity === "medium" && "text-secondary",
            severity === "low" && "text-primary"
          )}
        />
        <span className="font-medium truncate">{message}</span>
      </div>
      <Link to="/planos" className="shrink-0">
        <Button
          size="sm"
          className={cn(
            "h-8 rounded-lg font-semibold",
            severity === "high"
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
          )}
        >
          Assinar agora
        </Button>
      </Link>
    </div>
  );
}
