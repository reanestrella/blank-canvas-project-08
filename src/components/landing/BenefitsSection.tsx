import { Users, DollarSign, MessageSquare, BarChart3, CalendarCheck, Heart } from "lucide-react";

const benefits = [
  { icon: Users, title: "Gestão de membros", desc: "Cadastro completo, fotos, histórico e acompanhamento pastoral" },
  { icon: DollarSign, title: "Controle financeiro", desc: "Dízimos, ofertas, despesas e relatórios automáticos" },
  { icon: Heart, title: "Células e discipulado", desc: "Relatórios de célula, presença e acompanhamento de visitantes" },
  { icon: MessageSquare, title: "Comunicação centralizada", desc: "Avisos, notificações e devocionais direto no app do membro" },
  { icon: BarChart3, title: "Relatórios inteligentes", desc: "Dashboards com visão completa da saúde da igreja" },
  { icon: CalendarCheck, title: "Escalas automatizadas", desc: "Monte, publique e notifique escalas de ministério" },
];

export default function BenefitsSection() {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">
            TUDO QUE VOCÊ PRECISA
          </p>
          <h2 className="text-3xl font-extrabold text-foreground lg:text-4xl">
            Um sistema completo para{" "}
            <span className="text-secondary">toda a igreja</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-primary/15 bg-card p-6 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <b.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-base font-bold text-foreground">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
