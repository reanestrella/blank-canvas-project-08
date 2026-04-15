import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarCheck, Users, Bell } from "lucide-react";

export default function ScheduleSection() {
  return (
    <section className="py-20 md:py-28 bg-[#0A0F2C]">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <p className="text-[#FACC15] font-bold text-sm tracking-widest uppercase mb-4">
          DIFERENCIAL FORTE
        </p>

        <h2 className="text-3xl lg:text-4xl font-extrabold mb-6 text-white">
          Nunca mais perca o controle{" "}
          <span className="text-[#FACC15]">das escalas</span>
        </h2>

        <p className="text-base md:text-lg text-[#9CA3AF] mb-12 max-w-2xl mx-auto">
          O líder organiza no sistema. O membro vê direto no app. Sem confusão, sem esquecimento.
        </p>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {[
            { icon: CalendarCheck, title: "Líder organiza", desc: "Monte escalas no sistema com poucos cliques" },
            { icon: Bell, title: "Membro recebe", desc: "Notificação automática quando for escalado" },
            { icon: Users, title: "Tudo visível", desc: "Cada um vê sua escala direto no app" },
          ].map((item) => (
            <div key={item.title} className="p-6 rounded-2xl bg-[#0F1C4D] border border-[#2563EB]/10">
              <div className="w-12 h-12 rounded-xl bg-[#FACC15]/10 flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-6 h-6 text-[#FACC15]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-[#9CA3AF]">{item.desc}</p>
            </div>
          ))}
        </div>

        <Link to="/registro">
          <Button
            size="lg"
            className="gradient-accent text-[#0A0F2C] font-bold shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] hover:scale-[1.03] transition-all text-base px-8 py-5 rounded-xl"
          >
            Quero escalas organizadas
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
