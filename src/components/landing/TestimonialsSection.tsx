import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "O sistema revolucionou nossa gestão de células. Agora temos visibilidade total do crescimento espiritual.",
    author: "Pr. Carlos Mendes",
    church: "Igreja Nova Aliança",
    avatar: "CM",
  },
  {
    quote: "A transparência financeira trouxe paz para toda a liderança. Recomendo para todas as igrejas.",
    author: "Pra. Ana Santos",
    church: "Comunidade Vida Plena",
    avatar: "AS",
  },
  {
    quote: "Finalmente um sistema feito por quem entende a realidade das igrejas brasileiras. As escalas mudaram tudo!",
    author: "Pr. Roberto Lima",
    church: "Igreja Batista Renovada",
    avatar: "RL",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            O que dizem nossos usuários
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div key={t.author} className="p-6 rounded-2xl border bg-card">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic leading-relaxed">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary text-sm">{t.avatar}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.church}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
