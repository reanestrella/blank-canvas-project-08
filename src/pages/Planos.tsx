import { useState } from "react";
import { CheckCircle, ArrowRight, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { APP_BRAND_LOGO } from "@/lib/brand";
import { Link } from "react-router-dom";

const PLANS = [
  {
    id: "mensal",
    name: "Plano Mensal",
    price: "R$ 79,90",
    period: "/mês",
    priceId: "price_1TMaZUG15I82n9DcGUn6ucA3",
    badge: null,
    highlight: false,
  },
  {
    id: "anual",
    name: "Plano Anual",
    price: "R$ 790,00",
    period: "/ano",
    priceId: "price_1TMadmG15I82n9DcfTxw7Jgm",
    badge: "MAIS VANTAJOSO",
    highlight: true,
    savings: "Economize R$ 168,80",
  },
];

const features = [
  "Sistema completo (todos os módulos)",
  "App personalizado com a logo da igreja",
  "Membros e células ilimitados",
  "Gestão financeira completa",
  "Escalas de ministério",
  "Ensino e discipulado",
  "Relatórios inteligentes",
  "Suporte dedicado",
  "Atualizações contínuas",
];

export default function Planos() {
  const { user, church } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, planId: string) => {
    if (!user) {
      toast({ title: "Faça login primeiro", variant: "destructive" });
      return;
    }

    setLoading(planId);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/stripe-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ price_id: priceId }),
        }
      );

      const data = await res.json();

      if (data.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: "Erro", description: "Não foi possível iniciar o checkout.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-sidebar/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={APP_BRAND_LOGO} alt="Church Onefy" className="h-10 w-auto" />
          </Link>
          {user ? (
            <Link to="/meu-app">
              <Button variant="outline" size="sm">Voltar ao App</Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 mb-4">
            <Crown className="h-4 w-4 text-secondary" />
            <span className="text-sm font-bold text-secondary">ESCOLHA SEU PLANO</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground lg:text-4xl mb-3">
            Tenha o sistema completo para{" "}
            <span className="text-secondary">sua igreja</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Todos os módulos inclusos. Sem surpresas. Cancele quando quiser.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-8 transition-all ${
                plan.highlight
                  ? "border-secondary bg-card shadow-[0_0_30px_rgba(234,179,8,0.15)]"
                  : "border-border/40 bg-card"
              }`}
            >
              {plan.badge && (
                <div className="gradient-accent absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-extrabold tracking-wider text-secondary-foreground shadow-lg">
                  {plan.badge}
                </div>
              )}

              <div className="text-center mb-6 pt-2">
                <h3 className="text-lg font-bold text-foreground mb-3">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                {plan.savings && (
                  <p className="mt-2 text-sm font-semibold text-green-400">{plan.savings}</p>
                )}
              </div>

              <Button
                size="lg"
                className={`w-full rounded-xl py-5 text-base font-bold transition-all hover:scale-[1.02] ${
                  plan.highlight
                    ? "gradient-accent text-secondary-foreground shadow-[var(--shadow-glow)]"
                    : "bg-primary text-primary-foreground"
                }`}
                onClick={() => handleCheckout(plan.priceId, plan.id)}
                disabled={!!loading}
              >
                {loading === plan.id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Assinar {plan.name.split(" ")[1]}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="max-w-lg mx-auto">
          <h3 className="text-center text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
            Tudo incluso em ambos os planos
          </h3>
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-sm font-medium text-foreground/90">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
