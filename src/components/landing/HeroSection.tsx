import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[hsl(222,47%,11%)] pt-16">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(222,47%,11%)_70%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <p className="text-secondary font-semibold text-sm md:text-base tracking-widest uppercase mb-6">
              ⚡ A solução que sua igreja precisa
            </p>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 text-[hsl(40,33%,98%)]">
              Sua igreja ainda está{" "}
              <span className="text-secondary underline decoration-secondary/30 underline-offset-4">
                desorganizada
              </span>
              , dependente de WhatsApp e planilhas?
            </h1>

            <p className="text-lg md:text-xl text-[hsl(40,20%,75%)] mb-6 max-w-xl mx-auto lg:mx-0">
              O ChurchfyOne conecta toda a sua igreja em um só lugar e transforma
              sua organização em um{" "}
              <strong className="text-[hsl(40,33%,98%)]">verdadeiro app da igreja</strong>.
            </p>

            <div className="space-y-3 mb-8 max-w-md mx-auto lg:mx-0">
              {[
                "Escalas organizadas automaticamente",
                "Membros acessam tudo pelo app",
                "Comunicação centralizada",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span className="text-[hsl(40,33%,95%)] font-medium">{item}</span>
                </div>
              ))}
            </div>

            <Link to="/registro">
              <Button
                size="lg"
                className="gradient-accent text-[hsl(222,47%,11%)] font-bold shadow-[0_0_30px_hsl(38,92%,50%,0.4)] hover:shadow-[0_0_40px_hsl(38,92%,50%,0.6)] transition-all text-base md:text-lg px-8 py-6 rounded-xl"
              >
                Quero organizar minha igreja agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <p className="text-sm text-[hsl(40,20%,55%)] mt-4">
              Apenas <strong className="text-secondary">R$ 79,90/mês</strong> · Cancele quando quiser
            </p>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-secondary/15 rounded-[3rem] blur-3xl scale-90" />
              <div className="relative w-[280px] md:w-[320px] bg-[hsl(222,47%,18%)] rounded-[2.5rem] p-3 shadow-2xl border border-secondary/10">
                <div className="bg-[hsl(222,47%,14%)] rounded-[2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="h-6 bg-secondary/10 flex items-center justify-center">
                    <div className="w-20 h-1.5 bg-secondary/30 rounded-full" />
                  </div>
                  {/* App header */}
                  <div className="px-4 py-3 gradient-accent">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[hsl(222,47%,11%)]/20 flex items-center justify-center text-xs font-bold text-[hsl(222,47%,11%)]">
                        ⛪
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[hsl(222,47%,11%)]">Minha Igreja</p>
                        <p className="text-[10px] text-[hsl(222,47%,11%)]/60">App da Igreja</p>
                      </div>
                    </div>
                  </div>
                  {/* App content */}
                  <div className="p-4 space-y-3">
                    <div className="text-xs font-bold text-secondary/70 uppercase tracking-wider">
                      Acesso rápido
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        "📅 Escalas",
                        "📖 Bíblia",
                        "🙏 Devocional",
                        "📢 Avisos",
                        "👥 Células",
                        "💰 Ofertar",
                      ].map((item) => (
                        <div
                          key={item}
                          className="bg-[hsl(222,47%,20%)] rounded-xl p-2.5 text-center border border-secondary/5"
                        >
                          <p className="text-[11px] font-medium text-[hsl(40,33%,90%)]">{item}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-secondary/10 rounded-xl p-3 border border-secondary/20">
                      <p className="text-xs font-bold text-secondary">Próxima escala</p>
                      <p className="text-[11px] text-[hsl(40,20%,65%)] mt-1">
                        Louvor · Domingo 19h
                      </p>
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
