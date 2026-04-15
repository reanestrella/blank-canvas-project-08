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
    <section className="bg-muted/30 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual */}
          <div className="flex justify-center order-2 lg:order-1">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 scale-105 rotate-2 rounded-3xl bg-primary/10" />
              <div className="relative rounded-3xl border border-primary/15 bg-card p-6 shadow-[var(--shadow-lg)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-bold text-lg text-primary">
                    ⛪
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Igreja Vida Nova</p>
                    <p className="text-sm text-muted-foreground">App personalizado</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["📅 Escalas", "📖 Bíblia", "🙏 Oração", "📢 Avisos", "👥 Células", "🎓 Cursos"].map((item) => (
                    <div key={item} className="rounded-xl border border-primary/10 bg-background p-3 text-center">
                      <p className="text-xs font-medium text-foreground/80">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-secondary/20 bg-secondary/10 p-3">
                  <p className="text-xs font-bold text-secondary">⏰ Próxima escala</p>
                  <p className="mt-1 text-xs text-muted-foreground">Louvor · Domingo 19h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">
              EXPERIÊNCIA DO MEMBRO
            </p>

            <h2 className="mb-4 text-3xl font-extrabold text-foreground lg:text-4xl">
              Membros abrem o app e{" "}
              <span className="text-secondary">encontram tudo</span>
            </h2>

            <p className="mb-8 text-base text-muted-foreground md:text-lg">
              Tudo na palma da mão, com a cara da sua igreja.
            </p>

            <div className="space-y-4">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                  <span className="text-sm font-medium text-foreground/90 md:text-base">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
