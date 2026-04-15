import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[hsl(222,47%,11%)]/95 backdrop-blur-md border-b border-[hsl(38,92%,50%)]/10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center">
            <span className="text-[hsl(222,47%,11%)] font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-[hsl(40,33%,98%)]">
            CHURCHFY<span className="text-secondary">ONE</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-[hsl(40,33%,95%)] hover:text-secondary hover:bg-[hsl(222,47%,20%)]">
              Entrar
            </Button>
          </Link>
          <Link to="/registro">
            <Button size="sm" className="gradient-accent text-[hsl(222,47%,11%)] font-bold shadow-lg hover:shadow-xl transition-all">
              Começar agora
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
