import { X, CheckCircle } from "lucide-react";

export default function ComparisonSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Quanto custaria ter um app próprio{" "}
            <span className="text-secondary">para sua igreja?</span>
          </h2>
        </div>

        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Sem ChurchfyOne */}
          <div className="p-8 rounded-2xl border bg-destructive/5 border-destructive/20">
            <h3 className="font-bold text-lg mb-6 text-destructive">Sem ChurchfyOne</h3>
            <ul className="space-y-4">
              {[
                ["Desenvolvimento de app", "R$ 15.000 a R$ 50.000+"],
                ["Manutenção mensal", "R$ 500 a R$ 2.000"],
                ["Tempo de desenvolvimento", "3 a 12 meses"],
                ["Equipe técnica", "Necessária"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-start gap-3">
                  <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Com ChurchfyOne */}
          <div className="p-8 rounded-2xl border-2 border-secondary bg-secondary/5 shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
              RECOMENDADO
            </div>
            <h3 className="font-bold text-lg mb-6 text-secondary">Com ChurchfyOne</h3>
            <ul className="space-y-4">
              {[
                ["Sistema completo", "Pronto para usar"],
                ["Investimento", "Apenas R$ 79,90/mês"],
                ["Tempo para começar", "Imediato"],
                ["Equipe técnica", "Não precisa"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center mt-8 text-lg font-semibold">
          Tudo isso pronto por <span className="text-secondary">uma fração do custo</span> 💡
        </p>
      </div>
    </section>
  );
}
