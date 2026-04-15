import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

const included = [
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

export default function PricingSection() {
  return (
    <section className="py-20 md:py-28 bg-[#0F1C4D]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-[#FACC15] font-bold text-sm tracking-widest uppercase mb-4">
            OFERTA DIRETA
          </p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white">
            Tenha agora o sistema que{" "}
            <span className="text-[#FACC15]">sua igreja precisa</span>
          </h2>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="relative p-8 md:p-10 rounded-3xl border-2 border-[#FACC15]/30 bg-[#0A0F2C] shadow-[0_0_60px_rgba(250,204,21,0.1)]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full gradient-accent text-[#0A0F2C] text-sm font-extrabold tracking-wider shadow-lg">
              CHURCH ONEFY
            </div>

            <div className="text-center mb-8 pt-4">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl md:text-5xl font-extrabold text-white">
                  R$ 79,90
                </span>
                <span className="text-[#9CA3AF] text-lg">/mês</span>
              </div>
              <p className="text-[#9CA3AF] mt-2">
                Cancele quando quiser · Sem fidelidade
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#FACC15] flex-shrink-0" />
                  <span className="text-sm font-medium text-white/90">{item}</span>
                </li>
              ))}
            </ul>

            <Link to="/registro">
              <Button
                size="lg"
                className="w-full gradient-accent text-[#0A0F2C] font-bold text-base shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] hover:scale-[1.03] transition-all py-6 rounded-xl"
              >
                Começar agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
