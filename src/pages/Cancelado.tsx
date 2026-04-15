import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { APP_BRAND_LOGO } from "@/lib/brand";

export default function Cancelado() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <img src={APP_BRAND_LOGO} alt="Church Onefy" className="h-12 w-auto mx-auto" />
        <div className="rounded-full bg-destructive/10 p-4 w-20 h-20 mx-auto flex items-center justify-center">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Pagamento cancelado</h1>
        <p className="text-muted-foreground">
          O processo de pagamento foi cancelado. Nenhuma cobrança foi realizada.
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/planos">
            <Button size="lg" className="gradient-accent text-secondary-foreground font-bold rounded-xl w-full">
              Tentar novamente
            </Button>
          </Link>
          <Link to="/meu-app">
            <Button variant="outline" size="lg" className="w-full rounded-xl">
              Voltar ao App
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
