import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0F2C]/95 backdrop-blur-md border-b border-[#2563EB]/10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center">
            <span className="text-[#0A0F2C] font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            CHURCH <span className="text-[#FACC15]">ONEFY</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-white hover:text-[#FACC15] hover:bg-[#0F1C4D]">
              Entrar
            </Button>
          </Link>
          <Link to="/registro">
            <Button size="sm" className="gradient-accent text-[#0A0F2C] font-bold shadow-lg hover:shadow-xl transition-all">
              Começar agora
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
