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
    <section className="bg-background py-20 md:py-28">
      <div className="container mx-auto px-4 max-w-3xl">
        <p className="mb-4 text-center text-sm font-bold uppercase tracking-widest text-primary">
          A REALIDADE DE MUITAS IGREJAS
        </p>

        <h2 className="mb-4 text-center text-3xl font-extrabold text-foreground lg:text-4xl">
          Se você lidera uma igreja,{" "}
          <span className="text-primary">sabe como é…</span>
        </h2>

        <p className="mx-auto mb-12 max-w-2xl text-center text-base text-muted-foreground md:text-lg">
          O trabalho é enorme, o tempo é curto e as ferramentas erradas só atrapalham.
        </p>

        <div className="space-y-4 mb-12">
          {pains.map((pain) => (
            <div
              key={pain}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm md:p-5"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <X className="h-4 w-4 text-destructive" />
              </div>
              <span className="text-sm font-medium text-foreground/90 md:text-base">{pain}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-lg font-bold text-foreground md:text-xl">
            Isso não é falta de dedicação.{" "}
            <span className="text-secondary">É falta de sistema.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
