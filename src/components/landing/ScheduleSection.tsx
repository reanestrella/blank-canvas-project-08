import { CalendarCheck, Bell, Users } from "lucide-react";

export default function ScheduleSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Organize escalas{" "}
            <span className="text-secondary">sem dor de cabeça</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            O líder monta a escala no sistema e o membro escalado visualiza
            direto no app. Tudo organizado, sem confusão de WhatsApp.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              icon: CalendarCheck,
              title: "Líder cria a escala",
              desc: "Monte escalas por ministério com poucos cliques",
            },
            {
              icon: Bell,
              title: "Membro é notificado",
              desc: "Cada voluntário recebe a escala automaticamente",
            },
            {
              icon: Users,
              title: "Tudo sincronizado",
              desc: "Sem duplicidade, sem esquecimentos, sem planilhas",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="text-center p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
