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
    <section className="bg-background py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">
            OFERTA DIRETA
          </p>
          <h2 className="text-3xl font-extrabold text-foreground lg:text-4xl">
            Tenha agora o sistema que{" "}
            <span className="text-secondary">sua igreja precisa</span>
          </h2>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="relative rounded-3xl border-2 border-primary/20 bg-card p-8 shadow-[var(--shadow-lg)] md:p-10">
            <div className="gradient-accent absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-6 py-2 text-sm font-extrabold tracking-wider text-secondary-foreground shadow-lg">
              CHURCH ONEFY
            </div>

            <div className="text-center mb-8 pt-4">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-extrabold text-foreground md:text-5xl">
                  R$ 79,90
                </span>
                <span className="text-lg text-muted-foreground">/mês</span>
              </div>
              <p className="mt-2 text-muted-foreground">
                Cancele quando quiser · Sem fidelidade
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                  <span className="text-sm font-medium text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>

            <Link to="/planos">
              <Button
                size="lg"
                className="gradient-accent w-full rounded-xl py-6 text-base font-bold text-secondary-foreground shadow-[var(--shadow-glow)] transition-all hover:scale-[1.03]"
              >
                Ver planos e assinar
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
