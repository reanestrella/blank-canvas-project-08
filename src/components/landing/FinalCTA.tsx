import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-20 md:py-28 bg-[hsl(222,47%,11%)] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 text-[hsl(40,33%,98%)] max-w-3xl mx-auto leading-tight">
          Sua igreja pode continuar como está…{" "}
          <span className="text-secondary">ou evoluir hoje</span>
        </h2>

        <p className="text-lg text-[hsl(40,20%,65%)] mb-10 max-w-2xl mx-auto">
          Centenas de igrejas já estão usando o ChurchfyOne para organizar,
          conectar e crescer. Falta só a sua.
        </p>

        <Link to="/registro">
          <Button
            size="lg"
            className="gradient-accent text-[hsl(222,47%,11%)] font-bold shadow-[0_0_30px_hsl(38,92%,50%,0.4)] hover:shadow-[0_0_40px_hsl(38,92%,50%,0.6)] transition-all text-base md:text-lg px-10 py-6 rounded-xl"
          >
            Quero usar o ChurchfyOne
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
