import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-20 md:py-28 bg-[#0A0F2C] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2563EB]/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl lg:text-4xl font-extrabold mb-6 text-white max-w-3xl mx-auto leading-tight">
          Sua igreja pode continuar como está…{" "}
          <span className="text-[#FACC15]">ou evoluir hoje</span>
        </h2>

        <p className="text-base md:text-lg text-[#9CA3AF] mb-10 max-w-2xl mx-auto">
          Centenas de igrejas já estão usando o Church Onefy para organizar,
          conectar e crescer. Falta só a sua.
        </p>

        <Link to="/registro">
          <Button
            size="lg"
            className="gradient-accent text-[#0A0F2C] font-bold shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:shadow-[0_0_40px_rgba(250,204,21,0.6)] hover:scale-[1.03] transition-all text-base md:text-lg px-10 py-6 rounded-xl"
          >
            Quero usar o Church Onefy
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
