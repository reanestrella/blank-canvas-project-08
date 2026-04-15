const testimonials = [
  {
    name: "Pr. Marcos Silva",
    church: "Igreja Vida Plena",
    text: "Antes do CHURCH ONEFY, nossas escalas eram um caos no WhatsApp. Agora cada voluntário sabe exatamente quando serve. Mudou tudo!",
  },
  {
    name: "Líder Ana Costa",
    church: "Comunidade Restaurar",
    text: "Os membros adoram ter o 'app da igreja'. Parece que temos um aplicativo próprio. A comunicação melhorou 100%.",
  },
  {
    name: "Pr. Ricardo Mendes",
    church: "Igreja Graça e Verdade",
    text: "O controle financeiro ficou transparente e profissional. Os relatórios me ajudam a tomar decisões muito mais rápido.",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">
            PROVA SOCIAL
          </p>
          <h2 className="text-3xl font-extrabold text-foreground lg:text-4xl">
            Igrejas que já{" "}
            <span className="text-secondary">transformaram sua gestão</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl border border-primary/15 bg-card p-6 shadow-[var(--shadow-sm)]">
              <div className="mb-4 flex items-center gap-1 text-secondary">
                {"★★★★★".split("").map((s, i) => (
                  <span key={i} className="text-lg">{s}</span>
                ))}
              </div>
              <p className="mb-6 text-sm italic leading-relaxed text-muted-foreground">
                "{t.text}"
              </p>
              <div>
                <p className="font-bold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.church}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
