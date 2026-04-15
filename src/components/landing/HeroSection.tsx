import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-hero opacity-[0.07]" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-6">
              <Smartphone className="w-4 h-4" />
              Como um app exclusivo da sua igreja
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6">
              O ChurchfyOne conecta toda a sua igreja{" "}
              <span className="text-secondary">em um só lugar</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-xl mx-auto lg:mx-0">
              Tenha um sistema completo que funciona como um app exclusivo da sua
              igreja, com sua identidade, organização e comunicação centralizadas.
            </p>

            <p className="text-base font-semibold text-foreground/80 mb-8">
              ✨ Como se sua igreja tivesse seu próprio aplicativo
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link to="/registro">
                <Button size="lg" className="gradient-accent text-secondary-foreground font-semibold shadow-lg hover:shadow-xl transition-all text-base px-8">
                  Começar agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Apenas <strong className="text-foreground">R$ 79,90/mês</strong> · Cancele quando quiser
            </p>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-secondary/20 rounded-[3rem] blur-2xl scale-90" />
              {/* Phone frame */}
              <div className="relative w-[280px] md:w-[320px] bg-foreground rounded-[2.5rem] p-3 shadow-2xl">
                <div className="bg-background rounded-[2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="h-6 bg-primary flex items-center justify-center">
                    <div className="w-20 h-1.5 bg-primary-foreground/30 rounded-full" />
                  </div>
                  {/* App header */}
                  <div className="px-4 py-3 bg-primary text-primary-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-bold">⛪</div>
                      <div>
                        <p className="text-sm font-semibold">Minha Igreja</p>
                        <p className="text-[10px] opacity-70">App da Igreja</p>
                      </div>
                    </div>
                  </div>
                  {/* App content */}
                  <div className="p-4 space-y-3">
                    <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Acesso rápido</div>
                    <div className="grid grid-cols-3 gap-2">
                      {["📅 Escalas", "📖 Bíblia", "🙏 Devocional", "📢 Avisos", "👥 Células", "💰 Ofertar"].map((item) => (
                        <div key={item} className="bg-muted rounded-xl p-2.5 text-center">
                          <p className="text-[11px] font-medium">{item}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-secondary/10 rounded-xl p-3 border border-secondary/20">
                      <p className="text-xs font-semibold text-secondary">Próxima escala</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Louvor · Domingo 19h</p>
                    </div>
                    <div className="bg-muted rounded-xl p-3">
                      <p className="text-xs font-semibold">Devocional de hoje</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Salmo 23 — O Senhor é meu pastor</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
