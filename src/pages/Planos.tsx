import { useState, useEffect } from "react";
import { CheckCircle, ArrowRight, Crown, Loader2, Shield, Sparkles, Zap, Users, Star, Lock, Church, BarChart3, BookOpen, Calendar, Tag, CreditCard, QrCode, FileText, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { APP_BRAND_LOGO } from "@/lib/brand";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const PLANS = [
  {
    id: "mensal",
    name: "Mensal",
    price: "79",
    cents: ",90",
    period: "/mês",
    priceId: "price_1TNAPIG15I82n9DcRbJgolli",
    badge: null,
    highlight: false,
    description: "Ideal para começar sem compromisso",
  },
  {
    id: "anual",
    name: "Anual",
    price: "790",
    cents: ",00",
    period: "/ano",
    priceId: "price_1TNAPmG15I82n9DcvXnRaGKu",
    badge: "MAIS VANTAJOSO",
    highlight: true,
    savings: "Economize R$ 168,80",
    monthlyEquiv: "R$ 65,83/mês",
    description: "Melhor custo-benefício para sua igreja",
  },
];

const features = [
  { icon: Users, text: "Membros e células ilimitados" },
  { icon: BarChart3, text: "Gestão financeira completa" },
  { icon: Calendar, text: "Escalas de ministério" },
  { icon: BookOpen, text: "Ensino e discipulado" },
  { icon: Sparkles, text: "Relatórios inteligentes com IA" },
  { icon: Church, text: "App personalizado com logo da igreja" },
  { icon: Shield, text: "Suporte dedicado" },
  { icon: Zap, text: "Atualizações contínuas" },
];

export default function Planos() {
  const { user, currentChurchId } = useAuth();
  const { isActive, isLoading: subLoading, refetch: refetchSub } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [coupon, setCoupon] = useState<string>("");
  const [pixModal, setPixModal] = useState<{
    open: boolean;
    plan?: string;
    qr?: string | null;
    payload?: string | null;
    invoiceUrl?: string;
  }>({ open: false });
  const [cpfCnpj, setCpfCnpj] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("asaas_cpf_cnpj") || "";
  });

  useEffect(() => {
    const fromUrl = searchParams.get("cupom") || searchParams.get("coupon");
    if (fromUrl) setCoupon(fromUrl.trim().toUpperCase());
  }, [searchParams]);

  if (user && !subLoading && isActive) {
    return <Navigate to="/meu-app" replace />;
  }

  const handleCheckout = async (priceId: string, planId: string) => {
    if (!user) {
      toast({ title: "Faça login primeiro", variant: "destructive" });
      return;
    }
    setLoading(`stripe-${planId}`);
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
          body: JSON.stringify({ price_id: priceId, coupon: coupon || undefined }),
        }
      );
      const data = await res.json();
      if (data.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      toast({ title: "Erro", description: "Não foi possível iniciar o checkout.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleAsaas = async (planId: "mensal" | "anual", billing: "PIX" | "BOLETO") => {
    if (!user) {
      toast({ title: "Faça login primeiro", variant: "destructive" });
      return;
    }
    if (!currentChurchId) {
      toast({ title: "Igreja não identificada", description: "Recarregue a página e tente novamente.", variant: "destructive" });
      return;
    }
    const cleaned = cpfCnpj.replace(/\D/g, "");
    if (!cleaned || (cleaned.length !== 11 && cleaned.length !== 14)) {
      toast({
        title: "CPF ou CNPJ obrigatório",
        description: "Informe seu CPF (11 dígitos) ou CNPJ (14 dígitos) para gerar a cobrança.",
        variant: "destructive",
      });
      return;
    }
    localStorage.setItem("asaas_cpf_cnpj", cleaned);
    setLoading(`${billing}-${planId}`);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-create-payment", {
        body: { plan: planId, billing_type: billing, church_id: currentChurchId, cpf_cnpj: cleaned },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao gerar cobrança");

      if (billing === "PIX") {
        setPixModal({
          open: true,
          plan: planId,
          qr: data.pix_qr_code,
          payload: data.pix_payload,
          invoiceUrl: data.invoice_url,
        });
      } else {
        const url = data.bank_slip_url || data.invoice_url;
        if (url) window.open(url, "_blank");
        toast({ title: "Boleto gerado!", description: "Abrimos o boleto em uma nova aba." });
      }
    } catch (err: any) {
      toast({
        title: "Erro ao gerar cobrança",
        description: err.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const copyPix = async () => {
    if (!pixModal.payload) return;
    await navigator.clipboard.writeText(pixModal.payload);
    toast({ title: "Código Pix copiado!" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={APP_BRAND_LOGO} alt="Church Onefy" className="h-10 w-auto" />
          </Link>
          {user ? (
            <Link to="/meu-app">
              <Button variant="outline" size="sm" className="rounded-lg">
                Voltar ao App
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="rounded-lg">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Hero */}
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/15 border border-secondary/30 px-5 py-2 mb-6">
            <Crown className="h-4 w-4 text-secondary" />
            <span className="text-sm font-bold text-secondary tracking-wide">ESCOLHA SEU PLANO</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-4">
            O sistema completo para{" "}
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              sua igreja crescer
            </span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Todos os módulos inclusos. Sem surpresas. Cancele quando quiser.
          </p>
        </div>

        {/* Coupon input */}
        <div className="max-w-md mx-auto mb-8">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Tag className="h-3.5 w-3.5" />
            Cupom de desconto (opcional)
          </label>
          <input
            type="text"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="Digite seu cupom"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {coupon && (
            <p className="mt-2 text-xs text-green-400 font-medium">
              ✓ Cupom <span className="font-bold">{coupon}</span> será aplicado no checkout
            </p>
          )}
        </div>

        {/* CPF/CNPJ input (Pix/Boleto) */}
        <div className="max-w-md mx-auto mb-8">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <FileText className="h-3.5 w-3.5" />
            CPF ou CNPJ (para Pix e Boleto)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={cpfCnpj}
            onChange={(e) => setCpfCnpj(e.target.value)}
            placeholder="Somente números"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Necessário para emissão da cobrança no Asaas. Não usado para cartão de crédito.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl md:rounded-3xl p-6 md:p-8 transition-all duration-300 ${
                plan.highlight
                  ? "border-2 border-secondary bg-card shadow-[0_0_40px_rgba(234,179,8,0.12)] md:scale-[1.03]"
                  : "border border-border bg-card hover:border-border/80 hover:shadow-lg"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div className="bg-secondary text-secondary-foreground rounded-full px-4 py-1 text-[11px] font-extrabold tracking-wider shadow-lg whitespace-nowrap flex items-center gap-1.5">
                    <Star className="h-3 w-3 fill-current" />
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className="text-center mb-6 pt-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  Plano {plan.name}
                </h3>
                <p className="text-xs text-muted-foreground/70 mb-4">{plan.description}</p>

                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-base text-muted-foreground font-medium">R$</span>
                  <span className="text-5xl md:text-6xl font-black text-foreground leading-none tracking-tight">{plan.price}</span>
                  <span className="text-xl md:text-2xl font-bold text-foreground">{plan.cents}</span>
                  <span className="text-sm text-muted-foreground ml-1 font-medium">{plan.period}</span>
                </div>

                {plan.monthlyEquiv && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    equivalente a <span className="font-semibold text-foreground">{plan.monthlyEquiv}</span>
                  </p>
                )}
                {plan.savings && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-4 py-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-sm font-bold text-green-400">{plan.savings}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  size="lg"
                  className={`w-full rounded-xl py-6 text-base font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    plan.highlight
                      ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-[0_4px_20px_rgba(234,179,8,0.25)]"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                  onClick={() => handleCheckout(plan.priceId, plan.id)}
                  disabled={!!loading}
                >
                  {loading === `stripe-${plan.id}` ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Cartão de crédito
                      <ArrowRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl py-5 text-sm font-semibold"
                    onClick={() => handleAsaas(plan.id as "mensal" | "anual", "PIX")}
                    disabled={!!loading}
                  >
                    {loading === `PIX-${plan.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        Pix
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl py-5 text-sm font-semibold"
                    onClick={() => handleAsaas(plan.id as "mensal" | "anual", "BOLETO")}
                    disabled={!!loading}
                  >
                    {loading === `BOLETO-${plan.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Boleto
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8">
            Tudo incluso em ambos os planos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-3 rounded-xl bg-card border border-border/50 px-4 py-3.5">
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
              Pagamento seguro via Stripe e Asaas · Cartão, Pix ou Boleto · Cancele quando quiser
            </p>
          </div>
        </div>
      </div>

      {/* Modal Pix */}
      <Dialog open={pixModal.open} onOpenChange={(o) => setPixModal((p) => ({ ...p, open: o }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Pague com Pix
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code abaixo ou copie o código Pix. A liberação é automática após a confirmação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {pixModal.qr && (
              <div className="flex justify-center bg-white p-4 rounded-xl border">
                <img src={pixModal.qr} alt="QR Code Pix" className="w-56 h-56 object-contain" />
              </div>
            )}
            {pixModal.payload && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Código Pix copia e cola</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={pixModal.payload}
                    className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-mono truncate"
                  />
                  <Button size="sm" variant="outline" onClick={copyPix}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => refetchSub()}
            >
              <RefreshCw className="h-4 w-4" />
              Já paguei — verificar
            </Button>
            {pixModal.invoiceUrl && (
              <a
                href={pixModal.invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-center text-xs text-muted-foreground underline"
              >
                Abrir fatura no Asaas
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
