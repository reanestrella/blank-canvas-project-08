import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { APP_BRAND_LOGO } from "@/lib/brand";
import { useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@/hooks/useSubscription";

export default function Sucesso() {
  const queryClient = useQueryClient();
  const { isSubscribed } = useSubscription();
  const [pollCount, setPollCount] = useState(0);

  // Poll subscription status every 3s for up to 30s (webhook may take a moment)
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["subscription"] });

    if (isSubscribed) return;

    const interval = setInterval(() => {
      setPollCount((c) => c + 1);
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    }, 3000);

    // Stop after 10 attempts (30s)
    const timeout = setTimeout(() => clearInterval(interval), 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [queryClient, isSubscribed]);

  const showSpinner = !isSubscribed && pollCount < 10;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <img src={APP_BRAND_LOGO} alt="Church Onefy" className="h-12 w-auto mx-auto" />
        <div className="rounded-full bg-green-500/10 p-4 w-20 h-20 mx-auto flex items-center justify-center">
          {showSpinner ? (
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          ) : (
            <CheckCircle className="h-10 w-10 text-green-500" />
          )}
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">
          {showSpinner ? "Ativando sua assinatura..." : "Pagamento confirmado!"}
        </h1>
        <p className="text-muted-foreground">
          {showSpinner
            ? "Aguarde enquanto confirmamos seu pagamento. Isso leva apenas alguns segundos."
            : "Sua assinatura foi ativada com sucesso. Todos os módulos premium já estão disponíveis."}
        </p>
        {!showSpinner && (
          <Link to="/meu-app">
            <Button size="lg" className="gradient-accent text-secondary-foreground font-bold rounded-xl w-full">
              Acessar o Sistema
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
