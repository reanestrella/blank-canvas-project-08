import {
  Users,
  DollarSign,
  Grid3X3,
  MessageCircle,
  BarChart3,
  CalendarCheck,
} from "lucide-react";

const benefits = [
  { icon: Users, title: "Gestão de membros simplificada", desc: "Cadastro completo, visitantes, batismos e acompanhamento" },
  { icon: DollarSign, title: "Controle financeiro", desc: "Dízimos, ofertas, campanhas e relatórios detalhados" },
  { icon: Grid3X3, title: "Gestão de células e discipulado", desc: "Relatórios, multiplicação e pipeline espiritual" },
  { icon: MessageCircle, title: "Comunicação centralizada", desc: "Avisos, comunicados e pedidos de oração" },
  { icon: BarChart3, title: "Relatórios inteligentes", desc: "Indicadores para tomada de decisão pastoral" },
  { icon: CalendarCheck, title: "Escalas automatizadas", desc: "Organize ministérios sem planilhas nem WhatsApp" },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que sua igreja precisa,{" "}
            <span className="text-secondary">em uma só plataforma</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="group p-6 rounded-2xl border bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/10 transition-colors">
                <b.icon className="w-6 h-6 text-primary group-hover:text-secondary transition-colors" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
