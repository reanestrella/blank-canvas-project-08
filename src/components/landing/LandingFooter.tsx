import { Link } from "react-router-dom";

export default function LandingFooter() {
  return (
    <footer className="py-8 bg-[hsl(222,47%,8%)] border-t border-[hsl(222,47%,18%)]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md gradient-accent flex items-center justify-center">
              <span className="text-[hsl(222,47%,11%)] font-bold text-sm">C</span>
            </div>
            <span className="text-sm font-bold text-[hsl(40,33%,95%)]">
              CHURCHY<span className="text-secondary">ONE</span>
            </span>
          </div>
          <p className="text-xs text-[hsl(40,20%,45%)]">
            © {new Date().getFullYear()} ChurchfyOne. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs text-[hsl(40,20%,55%)] hover:text-secondary transition-colors">
              Entrar
            </Link>
            <Link to="/registro" className="text-xs text-[hsl(40,20%,55%)] hover:text-secondary transition-colors">
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
