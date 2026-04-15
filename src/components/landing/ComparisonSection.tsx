import { X, CheckCircle } from "lucide-react";

export default function ComparisonSection() {
  return (
    <section className="gradient-primary py-20 text-sidebar-foreground md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-secondary">
            COMPARAÇÃO DE VALOR
          </p>
          <h2 className="text-3xl font-extrabold lg:text-4xl">
            Quanto custa ter um{" "}
            <span className="text-secondary">app próprio?</span>
          </h2>
        </div>

        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Without */}
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8">
            <h3 className="mb-6 text-lg font-extrabold text-destructive">
              Desenvolver um app próprio
            </h3>
            <ul className="space-y-5">
              {[
                ["Desenvolvimento", "R$ 15.000 a R$ 50.000+"],
                ["Manutenção mensal", "R$ 500 a R$ 2.000"],
                ["Tempo", "3 a 12 meses"],
                ["Equipe técnica", "Necessária"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-start gap-3">
                  <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                  <div>
                    <p className="font-bold text-sidebar-foreground">{label}</p>
                    <p className="text-sm text-sidebar-foreground/70">{value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* With */}
          <div className="relative rounded-2xl border-2 border-secondary/30 bg-secondary/5 p-8 shadow-[var(--shadow-glow)]">
            <div className="gradient-accent absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-5 py-1 text-xs font-extrabold tracking-wider text-secondary-foreground shadow-md">
              CHURCH ONEFY
            </div>
            <h3 className="mb-6 text-lg font-extrabold text-secondary">
              Com CHURCH ONEFY
            </h3>
            <ul className="space-y-5">
              {[
                ["Sistema completo", "Pronto para usar"],
                ["Investimento", "Apenas R$ 79,90/mês"],
                ["Tempo para começar", "Imediato"],
                ["Equipe técnica", "Não precisa"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" />
                  <div>
                    <p className="font-bold text-sidebar-foreground">{label}</p>
                    <p className="text-sm text-sidebar-foreground/70">{value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-12 text-center text-lg font-extrabold text-sidebar-foreground md:text-xl">
          Você tem tudo isso por{" "}
          <span className="text-secondary">menos que um jantar</span> 🍽️
        </p>
      </div>
    </section>
  );
}
