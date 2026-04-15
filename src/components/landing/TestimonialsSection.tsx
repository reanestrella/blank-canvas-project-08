const testimonials = [
  {
    name: "Pr. Marcos Silva",
    church: "Igreja Vida Plena",
    text: "Antes do Church Onefy, nossas escalas eram um caos no WhatsApp. Agora cada voluntário sabe exatamente quando serve. Mudou tudo!",
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
    <section className="py-20 md:py-28 bg-[#0F1C4D]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-[#FACC15] font-bold text-sm tracking-widest uppercase mb-4">
            PROVA SOCIAL
          </p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white">
            Igrejas que já{" "}
            <span className="text-[#FACC15]">transformaram sua gestão</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div key={t.name} className="p-6 rounded-2xl bg-[#0A0F2C] border border-[#1E3A8A]/20 shadow-md">
              <div className="flex items-center gap-1 text-[#FACC15] mb-4">
                {"★★★★★".split("").map((s, i) => (
                  <span key={i} className="text-lg">{s}</span>
                ))}
              </div>
              <p className="text-sm text-[#9CA3AF] mb-6 italic leading-relaxed">
                "{t.text}"
              </p>
              <div>
                <p className="font-bold text-white">{t.name}</p>
                <p className="text-xs text-[#9CA3AF]">{t.church}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
