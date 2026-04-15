import { Users, DollarSign, MessageSquare, BarChart3, CalendarCheck, Heart } from "lucide-react";

const benefits = [
  {
    icon: Users,
    title: "Gestão de membros",
    desc: "Cadastro completo, fotos, histórico e acompanhamento pastoral",
  },
  {
    icon: DollarSign,
    title: "Controle financeiro",
    desc: "Dízimos, ofertas, despesas e relatórios automáticos",
  },
  {
    icon: Heart,
    title: "Células e discipulado",
    desc: "Relatórios de célula, presença e acompanhamento de visitantes",
  },
  {
    icon: MessageSquare,
    title: "Comunicação centralizada",
    desc: "Avisos, notificações e devocionais direto no app do membro",
  },
  {
    icon: BarChart3,
    title: "Relatórios inteligentes",
    desc: "Dashboards com visão completa da saúde da igreja",
  },
  {
    icon: CalendarCheck,
    title: "Escalas automatizadas",
    desc: "Monte, publique e notifique escalas de ministério",
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 md:py-28 bg-[hsl(40,33%,98%)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-secondary font-bold text-sm tracking-widest uppercase mb-4">
            TUDO QUE VOCÊ PRECISA
          </p>
          <h2 className="text-3xl md:text-3xl lg:text-4xl font-extrabold text-[hsl(220,60%,8%)]">
            Um sistema completo para{" "}
            <span className="text-secondary">toda a igreja</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="p-6 rounded-2xl bg-[hsl(0,0%,100%)] border border-[hsl(40,20%,88%)] shadow-md hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                <b.icon className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-base font-bold text-[hsl(220,60%,8%)] mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
