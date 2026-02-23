import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentChurchId, session } = useAuth();
  const { toast } = useToast();

  const sendMessage = useCallback(async (input: string) => {
    if (!currentChurchId || !session?.access_token) return;

    const userMsg: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/ai-chat`;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ message: input, church_id: currentChurchId, context: undefined }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        if (resp.status === 403) {
          toast({ title: "Disponível no Plano Premium", description: errData.message || "Este recurso requer ativação. Fale com o suporte.", variant: "destructive" });
          setMessages((prev) => prev.slice(0, -1));
          setIsLoading(false);
          return;
        }
        if (resp.status === 429) {
          toast({ title: "Limite atingido", description: errData.message || "Limite diário atingido.", variant: "destructive" });
          setMessages((prev) => prev.slice(0, -1));
          setIsLoading(false);
          return;
        }
        throw new Error(errData.message || "Erro ao conectar com assistente");
      }

      if (!resp.body) throw new Error("Sem resposta do servidor");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save to history
      if (assistantSoFar) {
        await supabase.from("ai_chat_history").insert({
          church_id: currentChurchId,
          user_id: session.user.id,
          message: input,
          response: assistantSoFar,
        });
      }
    } catch (e: any) {
      console.error("AI chat error:", e);
      toast({ title: "Erro", description: "Não consegui gerar agora. Tente novamente em alguns segundos.", variant: "destructive" });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [currentChurchId, session, toast]);

  const clearMessages = () => setMessages([]);

  return { messages, isLoading, sendMessage, clearMessages };
}
