import { Link } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_BRAND_LOGO, APP_BRAND_NAME } from "@/lib/brand";

/**
 * Tela de bloqueio exibida quando o trial expira e ainda não há assinatura ativa.
 */
export function TrialExpiredScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <div className="max-w-md w-full">
        <div className="mx-auto mb-6 inline-flex rounded-2xl bg-sidebar p-3 shadow-[var(--shadow-lg)]">
          <img
            src={APP_BRAND_LOGO}
            alt={APP_BRAND_NAME}
            className="h-12 w-auto max-w-[200px] object-contain"
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Lock className="h-8 w-8 text-destructive" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Acesso expirado
          </h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Seu período de teste finalizou. Para continuar usando o sistema,
            ative sua assinatura.
          </p>

          <Link to="/planos" className="block">
            <Button
              size="lg"
              className="w-full rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold"
            >
              Assinar agora
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>

          <p className="mt-4 text-xs text-muted-foreground">
            Pagamento seguro via Stripe • Cancele a qualquer momento
          </p>
        </div>
      </div>
    </div>
  );
}
