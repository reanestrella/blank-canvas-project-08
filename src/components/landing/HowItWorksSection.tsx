export default function HowItWorksSection() {
  const steps = [
    { num: "1", title: "Cadastre sua igreja", desc: "Crie sua conta e registre os dados da sua igreja em minutos" },
    { num: "2", title: "Configure sua identidade", desc: "Suba a logo da igreja e personalize o app com suas cores" },
    { num: "3", title: "Comece a usar", desc: "Convide líderes e membros. Tudo pronto para funcionar!" },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Como funciona?
          </h2>
          <p className="text-muted-foreground text-lg">Simples como deve ser</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="w-16 h-16 rounded-2xl gradient-accent text-secondary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-md">
                {s.num}
              </div>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
