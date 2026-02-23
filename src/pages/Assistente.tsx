import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, Trash2, Lightbulb, Users, FileText, Heart, MessageCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAiChat } from "@/hooks/useAiChat";
import { useAiFeatureAccess } from "@/hooks/useAiFeatureAccess";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const quickActions = [
  { label: "Gerar dinâmica para hoje", icon: Lightbulb, prompt: "Sugira uma dinâmica criativa e rápida para iniciar o encontro da célula hoje. Algo que promova interação e quebra-gelo entre os membros.", color: "text-amber-500" },
  { label: "Mensagens para faltosos", icon: Users, prompt: "Escreva 3 mensagens carinhosas e breves para enviar via WhatsApp a membros que estão faltando nos encontros da célula. Tom acolhedor e cristão.", color: "text-blue-500" },
  { label: "Ideias para visitantes", icon: Heart, prompt: "Sugira 5 ideias práticas para acolher e integrar visitantes na célula. Inclua ações simples que qualquer líder pode fazer.", color: "text-rose-500" },
  { label: "Resumo da minha célula", icon: FileText, prompt: "Faça um resumo da situação geral da minha célula, considerando presença, engajamento e sugestões de melhoria.", color: "text-emerald-500" },
  { label: "Gerar relatório da reunião", icon: FileText, prompt: "Me ajude a montar o relatório do encontro da célula. Pergunte-me os dados e me ajude a organizar as informações.", color: "text-violet-500" },
];

export default function Assistente() {
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage, clearMessages } = useAiChat();
  const { hasAccess, isTrial, trialEnd, checkAccess, showPremiumMessage } = useAiFeatureAccess();
  const { hasAnyRole } = useAuth();
  const [checked, setChecked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAccess().then(() => setChecked(true));
  }, [checkAccess]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleQuickAction = (prompt: string) => {
    if (checked && hasAccess === false) {
      showPremiumMessage();
      return;
    }
    sendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!checked) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (hasAccess === false) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Assistente do Líder</h1>
              <p className="text-muted-foreground">Disponível no Plano Premium</p>
            </div>
          </div>
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Este recurso requer ativação. Fale com o suporte para liberar.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Assistente do Líder</h1>
            <p className="text-muted-foreground">Sugestões rápidas para cuidar das pessoas e organizar sua semana.</p>
          </div>
          {isTrial && (
            <Badge variant="secondary" className="ml-auto">
              Trial {trialEnd ? `até ${new Date(trialEnd).toLocaleDateString("pt-BR")}` : ""}
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Card
                key={action.label}
                className="cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => handleQuickAction(action.prompt)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Chat Area */}
        <Card className="min-h-[400px] flex flex-col">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Conversa
            </CardTitle>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearMessages} className="text-xs gap-1">
                <Trash2 className="w-3 h-3" />
                Limpar
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[50vh]">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Sparkles className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">Escolha um atalho acima ou pergunte livremente.</p>
                  <p className="text-xs mt-1">Ex: "Como motivar minha célula?" ou "Monte um plano de visitação"</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-4 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte algo ao assistente..."
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
