import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { APP_BRAND_LOGO } from "@/lib/brand";

export default function Sucesso() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <img src={APP_BRAND_LOGO} alt="Church Onefy" className="h-12 w-auto mx-auto" />
        <div className="rounded-full bg-green-500/10 p-4 w-20 h-20 mx-auto flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Pagamento confirmado!</h1>
        <p className="text-muted-foreground">
          Sua assinatura foi ativada com sucesso. Todos os módulos premium já estão disponíveis.
        </p>
        <Link to="/meu-app">
          <Button size="lg" className="gradient-accent text-secondary-foreground font-bold rounded-xl w-full">
            Ir para o App
          </Button>
        </Link>
      </div>
    </div>
  );
}
