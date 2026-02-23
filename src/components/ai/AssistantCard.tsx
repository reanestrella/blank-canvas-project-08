import { useState, useEffect } from "react";
import { Sparkles, MessageCircle, Users, FileText, Lightbulb, Heart, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAiFeatureAccess } from "@/hooks/useAiFeatureAccess";
import { useAiChat } from "@/hooks/useAiChat";

const quickActions = [
  { label: "Gerar dinâmica para hoje", icon: Lightbulb, prompt: "Sugira uma dinâmica criativa e rápida para iniciar o encontro da célula hoje. Algo que promova interação e quebra-gelo entre os membros." },
  { label: "Resumo da célula", icon: FileText, prompt: "Faça um resumo da situação geral da minha célula, considerando presença, engajamento e sugestões de melhoria." },
  { label: "Mensagens para faltosos", icon: Users, prompt: "Escreva 3 mensagens carinhosas e breves para enviar via WhatsApp a membros que estão faltando nos encontros da célula. Tom acolhedor e cristão." },
  { label: "Ideias de integração", icon: Heart, prompt: "Sugira 5 ideias práticas para integrar melhor os visitantes e novos membros na célula. Inclua ações simples que qualquer líder pode fazer." },
  { label: "Gerar relatório da reunião", icon: FileText, prompt: "Me ajude a montar o relatório do encontro da célula. Pergunte-me os dados e me ajude a organizar as informações." },
];

interface AssistantCardProps {
  onOpenChat?: (initialMessage?: string) => void;
}

export function AssistantCard({ onOpenChat }: AssistantCardProps) {
  const { hasAccess, isTrial, trialEnd, checkAccess } = useAiFeatureAccess();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAccess().then(() => setChecked(true));
  }, [checkAccess]);

  if (!checked || hasAccess === false) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          Assistente do Líder
          {isTrial && (
            <Badge variant="secondary" className="text-xs ml-auto">
              Trial {trialEnd ? `até ${new Date(trialEnd).toLocaleDateString("pt-BR")}` : ""}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sugestões e ajuda rápida para cuidar das pessoas e organizar sua semana.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="justify-start gap-2 h-auto py-3 px-3 text-left"
              onClick={() => onOpenChat?.(action.prompt)}
            >
              <action.icon className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          className="w-full mt-3 gap-2 text-primary"
          onClick={() => onOpenChat?.()}
        >
          <MessageCircle className="w-4 h-4" />
          Abrir conversa livre
        </Button>
      </CardContent>
    </Card>
  );
}
