const steps = [
  {
    num: "01",
    title: "Cadastre sua igreja",
    desc: "Crie sua conta em menos de 2 minutos",
  },
  {
    num: "02",
    title: "Configure sua identidade",
    desc: "Suba sua logo e personalize as cores",
  },
  {
    num: "03",
    title: "Comece a usar",
    desc: "Convide membros e organize tudo imediatamente",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 md:py-28 bg-[hsl(220,60%,8%)]">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <p className="text-secondary font-bold text-sm tracking-widest uppercase mb-4">
            SIMPLES ASSIM
          </p>
          <h2 className="text-3xl md:text-3xl lg:text-4xl font-extrabold text-[hsl(40,33%,98%)]">
            Comece em <span className="text-secondary">3 passos</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.num} className="text-center relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-secondary/20" />
              )}
              <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-4 relative z-10">
                <span className="text-xl font-extrabold text-[hsl(220,60%,8%)]">{step.num}</span>
              </div>
              <h3 className="text-lg font-bold text-[hsl(40,33%,98%)] mb-2">{step.title}</h3>
              <p className="text-sm text-[hsl(40,20%,65%)]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
