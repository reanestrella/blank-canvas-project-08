import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function FinalCTA() {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <section className="gradient-primary relative overflow-hidden py-20 text-sidebar-foreground md:py-28">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[150px] animate-pulse-soft" />
      </div>

      <div ref={ref} className="reveal container mx-auto px-4 text-center relative z-10">
        <h2 className="mx-auto mb-6 max-w-3xl text-3xl font-extrabold leading-tight lg:text-4xl">
          Sua igreja pode continuar como está…{" "}
          <span className="text-secondary">ou evoluir hoje</span>
        </h2>

        <p className="mx-auto mb-10 max-w-2xl text-base text-sidebar-foreground/75 md:text-lg">
          Centenas de igrejas já estão usando o CHURCH ONEFY para organizar,
          conectar e crescer. Falta só a sua.
        </p>

        <Link to="/registro" className="inline-block w-full sm:w-auto">
          <Button
            size="lg"
            className="gradient-accent btn-press w-full sm:w-auto rounded-xl px-10 py-7 text-base font-bold text-secondary-foreground shadow-[var(--shadow-glow)] md:text-lg"
          >
            Quero usar o CHURCH ONEFY
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
