import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="gradient-primary relative flex min-h-screen items-center overflow-hidden pt-28 md:pt-20">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-secondary/10 blur-[100px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-sidebar/60" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left mt-8 md:mt-0">
            <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-secondary md:text-base">
              ⚡ A solução que sua igreja precisa
            </p>

            <h1 className="mb-6 text-3xl font-extrabold leading-[1.15] text-sidebar-foreground sm:text-4xl lg:text-[2.75rem]">
              Sua igreja ainda está{" "}
              <span className="text-secondary underline decoration-secondary/30 underline-offset-4">
                desorganizada
              </span>
              , dependente de WhatsApp e planilhas?
            </h1>

            <p className="mx-auto mb-6 max-w-xl text-base text-sidebar-foreground/80 md:text-lg lg:mx-0">
              O CHURCH ONEFY conecta toda a sua igreja em um só lugar e transforma
              sua organização em um{" "}
              <strong className="text-sidebar-foreground">verdadeiro app da igreja</strong>.
            </p>

            <div className="space-y-3 mb-8 max-w-md mx-auto lg:mx-0">
              {[
                "Escalas organizadas automaticamente",
                "Membros acessam tudo pelo app",
                "Comunicação centralizada",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-secondary" />
                  <span className="font-medium text-sidebar-foreground">{item}</span>
                </div>
              ))}
            </div>

            <Link to="/registro">
              <Button
                size="lg"
                className="gradient-accent rounded-xl px-8 py-6 text-base font-bold text-secondary-foreground shadow-[var(--shadow-glow)] transition-all hover:scale-[1.03] md:text-lg"
              >
                Quero organizar minha igreja agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <p className="mt-4 text-sm text-sidebar-foreground/70">
              Apenas <strong className="text-secondary">R$ 79,90/mês</strong> · Cancele quando quiser
            </p>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 scale-90 rounded-[3rem] bg-primary/20 blur-3xl" />
              <div className="relative w-[280px] rounded-[2.5rem] border border-primary/20 bg-sidebar-accent p-3 shadow-[var(--shadow-lg)] md:w-[320px]">
                <div className="overflow-hidden rounded-[2rem] bg-sidebar">
                  {/* Status bar */}
                  <div className="flex h-6 items-center justify-center bg-primary/10">
                    <div className="h-1.5 w-20 rounded-full bg-primary/30" />
                  </div>
                  {/* App header */}
                  <div className="px-4 py-3 gradient-accent">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-foreground/10 text-xs font-bold text-secondary-foreground">
                        C1
                      </div>
                      <div>
                        <p className="text-sm font-bold text-secondary-foreground">Minha Igreja</p>
                        <p className="text-[10px] text-secondary-foreground/60">App da Igreja</p>
                      </div>
                    </div>
                  </div>
                  {/* App content */}
                  <div className="p-4 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-primary/80">
                      Acesso rápido
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {["📅 Escalas", "📖 Bíblia", "🙏 Devocional", "📢 Avisos", "👥 Células", "💰 Ofertar"].map((item) => (
                        <div key={item} className="rounded-xl border border-primary/15 bg-sidebar-accent p-2.5 text-center">
                          <p className="text-[11px] font-medium text-sidebar-foreground/80">{item}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-secondary/20 bg-secondary/10 p-3">
                      <p className="text-xs font-bold text-secondary">Próxima escala</p>
                      <p className="mt-1 text-[11px] text-sidebar-foreground/70">Louvor · Domingo 19h</p>
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
