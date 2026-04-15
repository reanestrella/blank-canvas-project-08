import { X } from "lucide-react";

const pains = [
  "Escalas no WhatsApp que ninguém acha",
  "Membros esquecendo compromissos",
  "Informações espalhadas em 5 ferramentas diferentes",
  "Comunicação que não chega em quem precisa",
  "Relatórios feitos à mão, sempre atrasados",
];

export default function PainSection() {
  return (
    <section className="py-20 md:py-28 bg-[hsl(40,33%,98%)]">
      <div className="container mx-auto px-4 max-w-3xl">
        <p className="text-secondary font-bold text-sm tracking-widest uppercase text-center mb-4">
          A REALIDADE DE MUITAS IGREJAS
        </p>

        <h2 className="text-3xl md:text-3xl lg:text-4xl font-extrabold text-center mb-4 text-[hsl(220,60%,8%)]">
          Se você lidera uma igreja,{" "}
          <span className="text-destructive">sabe como é…</span>
        </h2>

        <p className="text-base md:text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          O trabalho é enorme, o tempo é curto e as ferramentas erradas só atrapalham.
        </p>

        <div className="space-y-4 mb-12">
          {pains.map((pain) => (
            <div
              key={pain}
              className="flex items-center gap-4 p-4 md:p-5 rounded-xl bg-destructive/5 border border-destructive/10"
            >
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-sm md:text-base font-medium text-[hsl(220,60%,12%)]">{pain}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-lg md:text-xl font-bold text-[hsl(220,60%,12%)]">
            Isso não é falta de dedicação.{" "}
            <span className="text-secondary">É falta de sistema.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
