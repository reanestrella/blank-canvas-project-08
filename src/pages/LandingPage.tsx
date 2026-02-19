import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Church,
  Heart,
  BarChart3,
  Shield,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Grid3X3,
  BookOpen,
  DollarSign,
  Calendar,
  MessageCircle,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Secretaria Completa",
    description: "Cadastro de membros, visitantes, batismos e acompanhamento espiritual",
  },
  {
    icon: Grid3X3,
    title: "Gestão de Células",
    description: "Relatórios semanais, multiplicação, visitantes e decisões por Cristo",
  },
  {
    icon: DollarSign,
    title: "Financeiro Transparente",
    description: "Dízimos, ofertas, campanhas e relatórios detalhados para prestação de contas",
  },
  {
    icon: BookOpen,
    title: "Ensino & Discipulado",
    description: "Trilhas espirituais, EBD, cursos de liderança e acompanhamento de alunos",
  },
  {
    icon: Calendar,
    title: "Eventos & Agenda",
    description: "Calendário da igreja, inscrições e comunicados segmentados",
  },
  {
    icon: MessageCircle,
    title: "Meu App (Área do Membro)",
    description: "Perfil, avisos, escalas, pedidos de oração e devocional semanal",
  },
];

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Para igrejas que estão começando",
    features: [
      "Até 50 membros",
      "3 células",
      "Secretaria básica",
      "Meu App simples",
      "1 administrador",
    ],
    cta: "Começar Grátis",
    popular: false,
  },
  {
    name: "Essencial",
    price: "R$ 79,90",
    period: "/mês",
    description: "Para igrejas em crescimento",
    features: [
      "Membros ilimitados",
      "Células ilimitadas",
      "Financeiro completo",
      "Ensino & Discipulado",
      "Relatórios básicos",
      "5 administradores",
      "Suporte por email",
    ],
    cta: "Assinar Agora",
    popular: true,
  },
  {
    name: "Avançado",
    price: "R$ 99,90",
    period: "/mês",
    description: "Para igrejas em células",
    features: [
      "Tudo do plano Essencial",
      "Relatórios avançados",
      "Indicadores espirituais",
      "Histórico completo",
      "Administradores ilimitados",
      "Suporte prioritário",
      "Integrações (em breve)",
    ],
    cta: "Assinar Agora",
    popular: false,
  },
];

const testimonials = [
  {
    quote: "O sistema revolucionou nossa gestão de células. Agora temos visibilidade total do crescimento espiritual.",
    author: "Pr. Carlos Mendes",
    church: "Igreja Nova Aliança",
    avatar: "CM",
  },
  {
    quote: "A transparência financeira trouxe paz para toda a liderança. Recomendo para todas as igrejas.",
    author: "Pra. Ana Santos",
    church: "Comunidade Vida Plena",
    avatar: "AS",
  },
  {
    quote: "Finalmente um sistema feito por quem entende a realidade das igrejas brasileiras.",
    author: "Pr. Roberto Lima",
    church: "Igreja Batista Renovada",
    avatar: "RL",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Church className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">Igreja Gestão</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/registro">
              <Button className="gradient-accent text-secondary-foreground">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20">
            🙏 Sistema para Igrejas Evangélicas
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Gerencie sua Igreja com
            <span className="text-primary"> Excelência</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            O sistema completo para igrejas em células: secretaria, células, financeiro, 
            discipulado e muito mais. Simples, intuitivo e focado no que importa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/registro">
              <Button size="lg" className="gradient-accent text-secondary-foreground shadow-lg">
                Começar Gratuitamente
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Já tenho conta
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            ✓ Sem cartão de crédito &nbsp;&nbsp; ✓ 50 membros grátis &nbsp;&nbsp; ✓ Suporte em português
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              O Desafio das Igrejas Hoje
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Muitas igrejas ainda usam planilhas, papéis e sistemas genéricos que não entendem 
              a realidade do ministério pastoral. Isso gera:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-destructive/10 rounded-xl">
                <p className="font-semibold text-destructive">Falta de Visibilidade</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Não saber quem está crescendo espiritualmente
                </p>
              </div>
              <div className="p-6 bg-destructive/10 rounded-xl">
                <p className="font-semibold text-destructive">Desorganização</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Informações espalhadas em vários lugares
                </p>
              </div>
              <div className="p-6 bg-destructive/10 rounded-xl">
                <p className="font-semibold text-destructive">Falta de Transparência</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Dificuldade em prestar contas financeiras
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-secondary/10 text-secondary hover:bg-secondary/20">
              Módulos do Sistema
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que sua Igreja Precisa
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Um sistema completo, pensado especialmente para igrejas evangélicas brasileiras
              que trabalham com células e discipulado.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300"
              >
                <div className="p-3 w-fit rounded-xl bg-primary/10 mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentials */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              Diferenciais
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que Escolher Nossa Solução?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="p-4 rounded-full bg-success/10 w-fit mx-auto mb-4">
                <Heart className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-semibold mb-2">Foco em Células</h3>
              <p className="text-sm text-muted-foreground">
                Sistema pensado para o modelo de igrejas em células
              </p>
            </div>
            <div className="text-center p-6">
              <div className="p-4 rounded-full bg-secondary/10 w-fit mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Pipeline Espiritual</h3>
              <p className="text-sm text-muted-foreground">
                Ganho → Consolidação → Discipulado → Envio
              </p>
            </div>
            <div className="text-center p-6">
              <div className="p-4 rounded-full bg-info/10 w-fit mx-auto mb-4">
                <Shield className="w-8 h-8 text-info" />
              </div>
              <h3 className="font-semibold mb-2">Seguro & Confiável</h3>
              <p className="text-sm text-muted-foreground">
                Dados protegidos e backup automático
              </p>
            </div>
            <div className="text-center p-6">
              <div className="p-4 rounded-full bg-warning/10 w-fit mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-warning" />
              </div>
              <h3 className="font-semibold mb-2">Mobile Friendly</h3>
              <p className="text-sm text-muted-foreground">
                Acesse de qualquer lugar, celular ou computador
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-secondary/10 text-secondary hover:bg-secondary/20">
              Planos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha o Melhor Plano
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comece grátis e evolua conforme sua igreja cresce
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl border ${
                  plan.popular
                    ? "border-primary shadow-xl scale-105 bg-card"
                    : "bg-card"
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Mais Popular
                  </Badge>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/registro">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "gradient-accent text-secondary-foreground"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              Depoimentos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que Dizem Nossos Usuários
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author}
                className="p-6 rounded-xl border bg-card"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary text-sm">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.church}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para Transformar sua Gestão?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de igrejas que já estão usando nossa plataforma.
            Comece gratuitamente hoje mesmo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/registro">
              <Button size="lg" variant="secondary" className="shadow-lg">
                Criar Conta Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Church className="w-6 h-6 text-primary" />
              <span className="font-bold">Igreja Gestão</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Igreja Gestão. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary">Termos de Uso</a>
              <a href="#" className="hover:text-primary">Privacidade</a>
              <a href="#" className="hover:text-primary">Contato</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
