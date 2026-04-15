import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarCheck, Users, Bell } from "lucide-react";

export default function ScheduleSection() {
  return (
    <section className="bg-sidebar py-20 text-sidebar-foreground md:py-28">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <p className="mb-4 text-sm font-bold uppercase tracking-widest text-secondary">
          DIFERENCIAL FORTE
        </p>

        <h2 className="mb-6 text-3xl font-extrabold lg:text-4xl">
          Nunca mais perca o controle{" "}
          <span className="text-secondary">das escalas</span>
        </h2>

        <p className="mx-auto mb-12 max-w-2xl text-base text-sidebar-foreground/70 md:text-lg">
          O líder organiza no sistema. O membro vê direto no app. Sem confusão, sem esquecimento.
        </p>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {[
            { icon: CalendarCheck, title: "Líder organiza", desc: "Monte escalas no sistema com poucos cliques" },
            { icon: Bell, title: "Membro recebe", desc: "Notificação automática quando for escalado" },
            { icon: Users, title: "Tudo visível", desc: "Cada um vê sua escala direto no app" },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-primary/20 bg-sidebar-accent/90 p-6 shadow-[var(--shadow-sm)]">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <item.icon className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
              <p className="text-sm text-sidebar-foreground/70">{item.desc}</p>
            </div>
          ))}
        </div>

        <Link to="/registro">
          <Button
            size="lg"
            className="gradient-accent rounded-xl px-8 py-5 text-base font-bold text-secondary-foreground shadow-[var(--shadow-glow)] transition-all hover:scale-[1.03]"
          >
            Quero escalas organizadas
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
