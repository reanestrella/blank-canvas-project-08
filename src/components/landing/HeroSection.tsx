import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0A0F2C] pt-24 md:pt-16">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#2563EB]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#1E3A8A]/15 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#0A0F2C_70%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left mt-8 md:mt-0">
            <p className="text-[#FACC15] font-semibold text-sm md:text-base tracking-widest uppercase mb-6">
              ⚡ A solução que sua igreja precisa
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold leading-[1.15] mb-6 text-white">
              Sua igreja ainda está{" "}
              <span className="text-[#FACC15] underline decoration-[#FACC15]/30 underline-offset-4">
                desorganizada
              </span>
              , dependente de WhatsApp e planilhas?
            </h1>

            <p className="text-base md:text-lg text-[#9CA3AF] mb-6 max-w-xl mx-auto lg:mx-0">
              O Church Onefy conecta toda a sua igreja em um só lugar e transforma
              sua organização em um{" "}
              <strong className="text-white">verdadeiro app da igreja</strong>.
            </p>

            <div className="space-y-3 mb-8 max-w-md mx-auto lg:mx-0">
              {[
                "Escalas organizadas automaticamente",
                "Membros acessam tudo pelo app",
                "Comunicação centralizada",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#FACC15] flex-shrink-0" />
                  <span className="text-white font-medium">{item}</span>
                </div>
              ))}
            </div>

            <Link to="/registro">
              <Button
                size="lg"
                className="gradient-accent text-[#0A0F2C] font-bold shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:shadow-[0_0_40px_rgba(250,204,21,0.6)] hover:scale-[1.03] transition-all text-base md:text-lg px-8 py-6 rounded-xl"
              >
                Quero organizar minha igreja agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <p className="text-sm text-[#9CA3AF]/70 mt-4">
              Apenas <strong className="text-[#FACC15]">R$ 79,90/mês</strong> · Cancele quando quiser
            </p>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-[#2563EB]/15 rounded-[3rem] blur-3xl scale-90" />
              <div className="relative w-[280px] md:w-[320px] bg-[#0F1C4D] rounded-[2.5rem] p-3 shadow-2xl border border-[#2563EB]/20">
                <div className="bg-[#0A0F2C] rounded-[2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="h-6 bg-[#2563EB]/10 flex items-center justify-center">
                    <div className="w-20 h-1.5 bg-[#2563EB]/30 rounded-full" />
                  </div>
                  {/* App header */}
                  <div className="px-4 py-3 gradient-accent">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#0A0F2C]/20 flex items-center justify-center text-xs font-bold text-[#0A0F2C]">
                        ⛪
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0A0F2C]">Minha Igreja</p>
                        <p className="text-[10px] text-[#0A0F2C]/60">App da Igreja</p>
                      </div>
                    </div>
                  </div>
                  {/* App content */}
                  <div className="p-4 space-y-3">
                    <div className="text-xs font-bold text-[#2563EB]/70 uppercase tracking-wider">
                      Acesso rápido
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {["📅 Escalas", "📖 Bíblia", "🙏 Devocional", "📢 Avisos", "👥 Células", "💰 Ofertar"].map((item) => (
                        <div key={item} className="bg-[#0F1C4D] rounded-xl p-2.5 text-center border border-[#1E3A8A]/20">
                          <p className="text-[11px] font-medium text-white/80">{item}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-[#FACC15]/10 rounded-xl p-3 border border-[#FACC15]/20">
                      <p className="text-xs font-bold text-[#FACC15]">Próxima escala</p>
                      <p className="text-[11px] text-[#9CA3AF] mt-1">Louvor · Domingo 19h</p>
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
