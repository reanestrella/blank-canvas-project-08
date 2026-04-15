export default function SolutionSection() {
  return (
    <section className="gradient-primary py-20 text-sidebar-foreground md:py-28">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <p className="mb-4 text-sm font-bold uppercase tracking-widest text-secondary">
          A SOLUÇÃO
        </p>

        <h2 className="mb-6 text-3xl font-extrabold lg:text-4xl">
          Agora imagine sua igreja{" "}
          <span className="text-secondary">funcionando assim:</span>
        </h2>

        <div className="grid sm:grid-cols-3 gap-6 mt-12">
          {[
            { icon: "📱", title: "App próprio da igreja", desc: "Cada membro acessa como se fosse o aplicativo exclusivo da sua igreja" },
            { icon: "🎨", title: "Sua identidade", desc: "Com logo, cores e nome da sua igreja. 100% personalizado" },
            { icon: "⚡", title: "Tudo em um lugar", desc: "Escalas, membros, financeiro, células, devocional e muito mais" },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-primary/20 bg-sidebar-accent/90 p-6 text-center shadow-[var(--shadow-sm)]">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
              <p className="text-sm text-sidebar-foreground/70">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
