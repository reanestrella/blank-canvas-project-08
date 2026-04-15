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
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Um plano. Tudo incluso.
          </h2>
          <p className="text-lg text-muted-foreground">
            Sem surpresas, sem limitações artificiais
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="relative p-8 md:p-10 rounded-3xl border-2 border-secondary bg-card shadow-xl">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full gradient-accent text-secondary-foreground text-sm font-bold shadow-md">
              CHURCHFYONE
            </div>

            <div className="text-center mb-8 pt-2">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl md:text-6xl font-bold">R$ 79,90</span>
                <span className="text-muted-foreground text-lg">/mês</span>
              </div>
              <p className="text-muted-foreground mt-2">
                Cancele quando quiser · Sem fidelidade
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>

            <Link to="/registro">
              <Button
                size="lg"
                className="w-full gradient-accent text-secondary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all"
              >
                Assinar agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
