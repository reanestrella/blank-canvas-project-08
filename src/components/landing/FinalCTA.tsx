import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-20 gradient-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Leve sua igreja para um novo nível de{" "}
          <span className="text-secondary">organização e conexão</span>
        </h2>
        <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
          Junte-se a centenas de igrejas que já estão transformando sua gestão
          com o ChurchfyOne.
        </p>
        <Link to="/registro">
          <Button
            size="lg"
            className="gradient-accent text-secondary-foreground font-semibold shadow-lg hover:shadow-xl text-base px-8"
          >
            Começar agora
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
