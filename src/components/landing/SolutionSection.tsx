export default function SolutionSection() {
  return (
    <section className="py-20 md:py-28 bg-[#0A0F2C]">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <p className="text-[#FACC15] font-bold text-sm tracking-widest uppercase mb-4">
          A SOLUÇÃO
        </p>

        <h2 className="text-3xl lg:text-4xl font-extrabold mb-6 text-white">
          Agora imagine sua igreja{" "}
          <span className="text-[#FACC15]">funcionando assim:</span>
        </h2>

        <div className="grid sm:grid-cols-3 gap-6 mt-12">
          {[
            { icon: "📱", title: "App próprio da igreja", desc: "Cada membro acessa como se fosse o aplicativo exclusivo da sua igreja" },
            { icon: "🎨", title: "Sua identidade", desc: "Com logo, cores e nome da sua igreja. 100% personalizado" },
            { icon: "⚡", title: "Tudo em um lugar", desc: "Escalas, membros, financeiro, células, devocional e muito mais" },
          ].map((item) => (
            <div key={item.title} className="p-6 rounded-2xl bg-[#0F1C4D] border border-[#2563EB]/10 text-center">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-[#9CA3AF]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
