import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center">
            <span className="text-secondary-foreground font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            CHURCHY<span className="text-secondary">ONE</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link to="/registro">
            <Button size="sm" className="gradient-accent text-secondary-foreground font-semibold shadow-md hover:shadow-lg transition-shadow">
              Começar agora
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
