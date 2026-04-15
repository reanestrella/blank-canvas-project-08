import { useState } from "react";
import { CheckCircle, ArrowRight, Crown, Loader2, Shield, Sparkles, Zap, Users, Star, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { APP_BRAND_LOGO } from "@/lib/brand";
import { Link, Navigate } from "react-router-dom";

const PLANS = [
  {
    id: "mensal",
    name: "Mensal",
    price: "79",
    cents: ",90",
    period: "/mês",
    priceId: "price_1TMaZUG15I82n9DcGUn6ucA3",
    badge: null,
    highlight: false,
  },
  {
    id: "anual",
    name: "Anual",
    price: "790",
    cents: ",00",
    period: "/ano",
    priceId: "price_1TMadmG15I82n9DcfTxw7Jgm",
    badge: "MAIS VANTAJOSO",
    highlight: true,
    savings: "Economize R$ 168,80",
    monthlyEquiv: "R$ 65,83/mês",
  },
];

const features = [
  { icon: Users, text: "Membros e células ilimitados" },
  { icon: Shield, text: "Gestão financeira completa" },
  { icon: Zap, text: "Escalas de ministério" },
  { icon: Sparkles, text: "Ensino e discipulado" },
  { icon: Shield, text: "Relatórios inteligentes com IA" },
  { icon: Users, text: "App personalizado com logo da igreja" },
  { icon: Zap, text: "Suporte dedicado" },
  { icon: Sparkles, text: "Atualizações contínuas" },
];

export default function Planos() {
  const { user, church } = useAuth();
  const { isSubscribed, isLoading: subLoading } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  if (user && !subLoading && isSubscribed) {
    return <Navigate to="/meu-app" replace />;
  }

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
    <div className="min-h-screen bg-[hsl(var(--sidebar-background))]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[hsl(var(--sidebar-background))]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={APP_BRAND_LOGO} alt="Church Onefy" className="h-10 w-auto" />
          </Link>
          {user ? (
            <Link to="/meu-app">
              <Button variant="outline" size="sm" className="rounded-lg border-white/10 text-foreground hover:bg-white/5">
                Voltar ao App
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="rounded-lg border-white/10 text-foreground hover:bg-white/5">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Hero */}
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 border border-secondary/20 px-5 py-2 mb-6">
            <Crown className="h-4 w-4 text-secondary" />
            <span className="text-sm font-bold text-secondary tracking-wide">ESCOLHA SEU PLANO</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-4">
            O sistema completo para{" "}
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              sua igreja crescer
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Todos os módulos inclusos. Sem surpresas. Cancele quando quiser.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-8 transition-all duration-300 ${
                plan.highlight
                  ? "border-2 border-secondary bg-[hsl(var(--card))] shadow-[0_0_60px_rgba(234,179,8,0.15)] scale-[1.02]"
                  : "border border-white/10 bg-[hsl(var(--card))] hover:border-white/20"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="gradient-accent rounded-full px-5 py-1.5 text-xs font-extrabold tracking-wider text-secondary-foreground shadow-lg whitespace-nowrap flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className="text-center mb-8 pt-2">
                <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-widest mb-5">
                  Plano {plan.name}
                </h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-sm text-muted-foreground mr-1">R$</span>
                  <span className="text-6xl font-black text-foreground tracking-tight">{plan.price}</span>
                  <span className="text-2xl font-bold text-foreground">{plan.cents}</span>
                  <span className="text-base text-muted-foreground ml-1">{plan.period}</span>
                </div>
                {plan.monthlyEquiv && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    equivalente a <span className="font-semibold text-foreground">{plan.monthlyEquiv}</span>
                  </p>
                )}
                {plan.savings && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-4 py-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-sm font-bold text-green-500">{plan.savings}</span>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className={`w-full rounded-2xl py-6 text-base font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                  plan.highlight
                    ? "gradient-accent text-secondary-foreground shadow-[0_4px_20px_rgba(234,179,8,0.3)]"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
                onClick={() => handleCheckout(plan.priceId, plan.id)}
                disabled={!!loading}
              >
                {loading === plan.id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Começar agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-center text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8">
            Tudo incluso em ambos os planos
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-3 rounded-xl bg-[hsl(var(--card))] border border-white/5 px-5 py-4">
                <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <p className="text-xs">
              Pagamento seguro via Stripe · Cancele a qualquer momento · Sem taxa de cancelamento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
