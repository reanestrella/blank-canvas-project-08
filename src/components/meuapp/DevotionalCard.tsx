import { useState, useEffect } from "react";
import { BookOpen, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function DevotionalCard() {
  const { profile } = useAuth();
  const [devotional, setDevotional] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // Check localStorage for cached devotional
  useEffect(() => {
    const cached = localStorage.getItem(`devotional_${today}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setDevotional(parsed.text);
        setLastGenerated(parsed.date);
      } catch {}
    }
  }, [today]);

  const generateDevotional = async () => {
    if (!profile?.church_id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          message: "Gere um devocional diário breve e inspirador para hoje. Inclua: 1) Um versículo bíblico relevante, 2) Uma reflexão de 3-4 frases sobre o versículo, 3) Uma oração curta de encerramento. Seja encorajador e prático.",
          churchId: profile.church_id,
        },
      });

      if (error) throw error;
      const text = data?.response || data?.message || "Não foi possível gerar o devocional.";
      setDevotional(text);
      setLastGenerated(today);
      localStorage.setItem(`devotional_${today}`, JSON.stringify({ text, date: today }));
    } catch (err) {
      console.error("Error generating devotional:", err);
      setDevotional("Não foi possível gerar o devocional no momento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Devocional do Dia
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateDevotional}
          disabled={isLoading}
          className="gap-1"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {devotional ? "Novo" : "Gerar"}
        </Button>
      </CardHeader>
      <CardContent>
        {devotional ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{devotional}</p>
            {lastGenerated && (
              <p className="text-xs text-muted-foreground mt-3">
                Gerado em {new Date(lastGenerated).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground mb-3">
              Receba uma palavra de encorajamento diária gerada por IA.
            </p>
            <Button onClick={generateDevotional} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
              Gerar Devocional
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
