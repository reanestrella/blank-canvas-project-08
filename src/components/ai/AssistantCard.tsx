import { useState, useEffect } from "react";
import { Sparkles, MessageCircle, Users, FileText, Lightbulb, Heart, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAiFeatureAccess } from "@/hooks/useAiFeatureAccess";

const quickActions = [
  { label: "Gerar dinâmica personalizada", icon: Lightbulb, needsConfig: true },
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
  const [dynamicModalOpen, setDynamicModalOpen] = useState(false);
  const [dynamicConfig, setDynamicConfig] = useState({
    theme: "",
    audience: "celula",
    objective: "quebra_gelo",
  });

  useEffect(() => {
    checkAccess().then(() => setChecked(true));
  }, [checkAccess]);

  if (!checked || hasAccess === false) return null;

  const handleDynamicGenerate = () => {
    const themeText = dynamicConfig.theme ? `sobre o tema "${dynamicConfig.theme}"` : "";
    const audienceLabels: Record<string, string> = { celula: "célula", jovens: "grupo de jovens", igreja: "culto da igreja", kids: "crianças" };
    const objectiveLabels: Record<string, string> = { quebra_gelo: "quebra-gelo e interação", reflexao: "reflexão bíblica", integracao: "integração de visitantes", oracao: "momento de oração", louvor: "louvor e adoração" };
    
    const prompt = `Sugira uma dinâmica criativa ${themeText} para ${audienceLabels[dynamicConfig.audience] || "célula"} com objetivo de ${objectiveLabels[dynamicConfig.objective] || "quebra-gelo"}. Inclua: nome da dinâmica, materiais necessários, passo a passo, tempo estimado e versículo de apoio.`;
    setDynamicModalOpen(false);
    onOpenChat?.(prompt);
  };

  const handleAction = (action: typeof quickActions[0]) => {
    if (action.needsConfig) {
      setDynamicModalOpen(true);
    } else {
      onOpenChat?.(action.prompt);
    }
  };

  return (
    <>
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
                onClick={() => handleAction(action)}
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

      {/* Dynamic Configuration Modal */}
      <Dialog open={dynamicModalOpen} onOpenChange={setDynamicModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Configurar Dinâmica
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tema (opcional)</Label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={dynamicConfig.theme}
                onChange={e => setDynamicConfig(c => ({ ...c, theme: e.target.value }))}
                placeholder="Ex: Fé, Família, Gratidão..."
              />
            </div>
            <div className="space-y-2">
              <Label>Público</Label>
              <Select value={dynamicConfig.audience} onValueChange={v => setDynamicConfig(c => ({ ...c, audience: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="celula">Célula</SelectItem>
                  <SelectItem value="jovens">Jovens</SelectItem>
                  <SelectItem value="igreja">Igreja (culto)</SelectItem>
                  <SelectItem value="kids">Kids (crianças)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Select value={dynamicConfig.objective} onValueChange={v => setDynamicConfig(c => ({ ...c, objective: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quebra_gelo">Quebra-gelo / Interação</SelectItem>
                  <SelectItem value="reflexao">Reflexão bíblica</SelectItem>
                  <SelectItem value="integracao">Integração de visitantes</SelectItem>
                  <SelectItem value="oracao">Momento de oração</SelectItem>
                  <SelectItem value="louvor">Louvor e adoração</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDynamicModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleDynamicGenerate}>
              <Sparkles className="w-4 h-4 mr-1" /> Gerar Dinâmica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
