export default function LandingFooter() {
  return (
    <footer className="py-10 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md gradient-accent flex items-center justify-center">
              <span className="text-secondary-foreground font-bold text-sm">C</span>
            </div>
            <span className="font-bold tracking-tight">CHURCHFYONE</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ChurchfyOne. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Contato</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
