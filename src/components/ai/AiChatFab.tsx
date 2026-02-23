import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAiChat } from "@/hooks/useAiChat";
import { useAiFeatureAccess } from "@/hooks/useAiFeatureAccess";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function AiChatFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage, clearMessages } = useAiChat();
  const { hasAccess, checkAccess, showPremiumMessage } = useAiFeatureAccess();
  const { hasRole, hasAnyRole } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAccess().then(() => setChecked(true));
  }, [checkAccess]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Only show for leaders/pastors, not regular members
  const canSeeAssistant = hasAnyRole("pastor", "lider_celula", "lider_ministerio");
  
  const handleOpen = (initialMessage?: string) => {
    if (checked && hasAccess === false) {
      showPremiumMessage();
      return;
    }
    setIsOpen(true);
    if (initialMessage) {
      setTimeout(() => sendMessage(initialMessage), 100);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!checked || !canSeeAssistant) return null;

  // Expose openChat for external use via window
  (window as any).__openAiChat = handleOpen;

  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <button
          onClick={() => handleOpen()}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
          title="Assistente do Líder"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-4rem)] bg-background border rounded-xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Assistente do Líder</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={clearMessages} title="Limpar conversa" className="h-8 w-8">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Sparkles className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm">Olá! Sou seu assistente pastoral.</p>
                <p className="text-xs mt-1">Pergunte sobre liderança, discipulado, cuidado pastoral ou crescimento de células.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
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
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta..."
              disabled={isLoading}
              className="text-sm"
            />
            <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
