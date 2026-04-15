import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { APP_BRAND_LOGO, APP_BRAND_NAME } from "@/lib/brand";

export default function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-primary/20 bg-sidebar/90 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center">
          <img
            src={APP_BRAND_LOGO}
            alt={APP_BRAND_NAME}
            className="h-11 w-auto max-w-[180px] object-contain"
          />
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-secondary"
            >
              Entrar
            </Button>
          </Link>
          <Link to="/registro">
            <Button
              size="sm"
              className="gradient-accent rounded-xl font-bold text-secondary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.03]"
            >
              Começar agora
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
