import { Link } from "react-router-dom";
import { APP_BRAND_LOGO, APP_BRAND_NAME } from "@/lib/brand";

export default function LandingFooter() {
  return (
    <footer className="border-t border-primary/20 bg-sidebar py-8 text-sidebar-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={APP_BRAND_LOGO}
              alt={APP_BRAND_NAME}
              className="h-9 w-auto max-w-[160px] object-contain"
            />
          </div>
          <p className="text-xs text-sidebar-foreground/60">
            © {new Date().getFullYear()} CHURCH ONEFY. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs text-sidebar-foreground/70 transition-colors hover:text-secondary">
              Entrar
            </Link>
            <Link to="/registro" className="text-xs text-sidebar-foreground/70 transition-colors hover:text-secondary">
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
