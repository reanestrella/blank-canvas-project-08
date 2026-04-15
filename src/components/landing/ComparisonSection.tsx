import { X, CheckCircle } from "lucide-react";

export default function ComparisonSection() {
  return (
    <section className="py-20 md:py-28 bg-[hsl(220,60%,8%)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-secondary font-bold text-sm tracking-widest uppercase mb-4">
            COMPARAÇÃO DE VALOR
          </p>
          <h2 className="text-3xl md:text-3xl lg:text-4xl font-extrabold text-[hsl(40,33%,98%)]">
            Quanto custa ter um{" "}
            <span className="text-secondary">app próprio?</span>
          </h2>
        </div>

        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Without */}
          <div className="p-8 rounded-2xl bg-destructive/5 border border-destructive/20">
            <h3 className="font-extrabold text-lg mb-6 text-destructive">
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
                  <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[hsl(40,33%,98%)]">{label}</p>
                    <p className="text-sm text-[hsl(40,20%,55%)]">{value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* With */}
          <div className="p-8 rounded-2xl border-2 border-secondary bg-secondary/5 shadow-[0_0_40px_hsl(38,92%,50%,0.15)] relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full gradient-accent text-[hsl(220,60%,8%)] text-xs font-extrabold tracking-wider shadow-md">
              CHURCHFYONE
            </div>
            <h3 className="font-extrabold text-lg mb-6 text-secondary">
              Com ChurchfyOne
            </h3>
            <ul className="space-y-5">
              {[
                ["Sistema completo", "Pronto para usar"],
                ["Investimento", "Apenas R$ 79,90/mês"],
                ["Tempo para começar", "Imediato"],
                ["Equipe técnica", "Não precisa"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[hsl(40,33%,98%)]">{label}</p>
                    <p className="text-sm text-[hsl(40,20%,65%)]">{value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center mt-12 text-lg md:text-xl font-extrabold text-[hsl(40,33%,98%)]">
          Você tem tudo isso por{" "}
          <span className="text-secondary">menos que um jantar</span> 🍽️
        </p>
      </div>
    </section>
  );
}
