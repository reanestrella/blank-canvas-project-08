const steps = [
  { num: "01", title: "Cadastre sua igreja", desc: "Crie sua conta em menos de 2 minutos" },
  { num: "02", title: "Configure sua identidade", desc: "Suba sua logo e personalize as cores" },
  { num: "03", title: "Comece a usar", desc: "Convide membros e organize tudo imediatamente" },
];

export default function HowItWorksSection() {
  return (
    <section className="bg-sidebar py-20 text-sidebar-foreground md:py-28">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-secondary">
            SIMPLES ASSIM
          </p>
          <h2 className="text-3xl font-extrabold lg:text-4xl">
            Comece em <span className="text-secondary">3 passos</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.num} className="text-center relative">
              {i < steps.length - 1 && (
                <div className="absolute left-[60%] top-8 hidden h-px w-[80%] bg-secondary/20 md:block" />
              )}
              <div className="gradient-accent relative z-10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-[var(--shadow-glow)]">
                <span className="text-xl font-extrabold text-secondary-foreground">{step.num}</span>
              </div>
              <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
              <p className="text-sm text-sidebar-foreground/70">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
