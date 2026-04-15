import { CheckCircle, Smartphone } from "lucide-react";

const appFeatures = [
  "Visualizar escalas de ministério (louvor, kids, mídia…)",
  "Acompanhar eventos da igreja",
  "Acessar devocionais",
  "Ler a Bíblia",
  "Receber comunicações",
  "Atualizar dados pessoais",
];

export default function AppSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
              <Smartphone className="w-4 h-4" />
              Área do Membro
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sua igreja com seu{" "}
              <span className="text-secondary">próprio app</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Cada igreja usa o ChurchfyOne como seu próprio aplicativo, com logo
              personalizada e identidade visual exclusiva. Membros acessam como
              se fosse o app oficial da igreja.
            </p>
            <ul className="space-y-3">
              {appFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-primary/5 rounded-3xl rotate-3" />
              <div className="relative bg-card rounded-3xl border shadow-xl p-8 space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">⛪</div>
                  <div>
                    <p className="font-semibold">Igreja Vida Nova</p>
                    <p className="text-sm text-muted-foreground">App personalizado</p>
                  </div>
                </div>
                {appFeatures.slice(0, 4).map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary text-sm">
                      {["📅", "📢", "🙏", "📖"][i]}
                    </div>
                    <span className="text-sm font-medium">{f.split("(")[0].trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
