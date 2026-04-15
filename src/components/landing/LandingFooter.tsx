import { Link } from "react-router-dom";

export default function LandingFooter() {
  return (
    <footer className="py-8 bg-[#0A0F2C] border-t border-[#1E3A8A]/20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md gradient-accent flex items-center justify-center">
              <span className="text-[#0A0F2C] font-bold text-sm">C</span>
            </div>
            <span className="text-sm font-bold text-white">
              CHURCH <span className="text-[#FACC15]">ONEFY</span>
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF]/60">
            © {new Date().getFullYear()} Church Onefy. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs text-[#9CA3AF] hover:text-[#FACC15] transition-colors">
              Entrar
            </Link>
            <Link to="/registro" className="text-xs text-[#9CA3AF] hover:text-[#FACC15] transition-colors">
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
