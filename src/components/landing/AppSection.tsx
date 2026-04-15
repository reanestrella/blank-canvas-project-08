import { CheckCircle } from "lucide-react";

const features = [
  "Ver sua escala (louvor, kids, mídia…)",
  "Acompanhar eventos da igreja",
  "Ler o devocional do dia",
  "Acessar a Bíblia",
  "Receber avisos importantes",
  "Atualizar seus dados pessoais",
];

export default function AppSection() {
  return (
    <section className="py-20 md:py-28 bg-[hsl(40,33%,98%)]">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual */}
          <div className="flex justify-center order-2 lg:order-1">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 bg-secondary/10 rounded-3xl rotate-2 scale-105" />
              <div className="relative bg-[hsl(220,60%,8%)] rounded-3xl p-6 shadow-2xl border border-[hsl(220,80%,50%)]/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center text-[hsl(220,60%,8%)] font-bold text-lg">
                    ⛪
                  </div>
                  <div>
                    <p className="font-bold text-[hsl(40,33%,98%)]">Igreja Vida Nova</p>
                    <p className="text-sm text-[hsl(40,20%,55%)]">App personalizado</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["📅 Escalas", "📖 Bíblia", "🙏 Oração", "📢 Avisos", "👥 Células", "🎓 Cursos"].map(
                    (item) => (
                      <div
                        key={item}
                        className="bg-[hsl(220,60%,14%)] rounded-xl p-3 text-center border border-[hsl(220,60%,20%)]"
                      >
                        <p className="text-xs font-medium text-[hsl(40,33%,90%)]">{item}</p>
                      </div>
                    )
                  )}
                </div>
                <div className="mt-4 bg-secondary/10 rounded-xl p-3 border border-secondary/20">
                  <p className="text-xs font-bold text-secondary">⏰ Próxima escala</p>
                  <p className="text-xs text-[hsl(40,20%,65%)] mt-1">Louvor · Domingo 19h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <p className="text-secondary font-bold text-sm tracking-widest uppercase mb-4">
              EXPERIÊNCIA DO MEMBRO
            </p>

            <h2 className="text-3xl md:text-3xl lg:text-4xl font-extrabold mb-4 text-[hsl(220,60%,8%)]">
              Membros abrem o app e{" "}
              <span className="text-secondary">encontram tudo</span>
            </h2>

            <p className="text-base md:text-lg text-muted-foreground mb-8">
              Tudo na palma da mão, com a cara da sua igreja.
            </p>

            <div className="space-y-4">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span className="text-sm md:text-base font-medium text-[hsl(220,60%,12%)]">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
