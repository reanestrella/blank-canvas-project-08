import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useAiFeatureAccess } from "@/hooks/useAiFeatureAccess";

export function AiReportCard() {
  const { currentChurchId, session } = useAuth();
  const { hasAccess, checkAccess } = useAiFeatureAccess();
  const [checked, setChecked] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    checkAccess().then(() => setChecked(true));
  }, [checkAccess]);

  const fetchReport = async (forceNew = false) => {
    if (!currentChurchId || !session?.access_token) return;
    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/ai-dashboard-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ church_id: currentChurchId, period: "7d" }),
      });
      if (!resp.ok) throw new Error("Erro ao gerar relatório");
      const data = await resp.json();
      setReport(data.report);
      setGeneratedAt(data.generated_at);
      setIsCached(data.cached);
    } catch (e) {
      console.error("AI report error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (checked && hasAccess) fetchReport();
  }, [checked, hasAccess, currentChurchId]);

  if (!checked) return null;

  if (!hasAccess) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-muted-foreground" />
            Relatório Inteligente (IA)
            <Badge variant="outline" className="ml-auto text-xs">Premium</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tenha insights automáticos sobre sua igreja com IA. Disponível no plano premium.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isToday = generatedAt && new Date(generatedAt).toDateString() === new Date().toDateString();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          Relatório Inteligente (IA)
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            onClick={() => fetchReport(true)}
            disabled={loading || (isCached && isToday)}
            title={isCached && isToday ? "Já atualizado hoje" : "Atualizar relatório"}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
        {generatedAt && (
          <p className="text-xs text-muted-foreground">
            Gerado em {new Date(generatedAt).toLocaleString("pt-BR")}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {loading && !report ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Gerando relatório...</span>
          </div>
        ) : report ? (
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{report}</div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Clique em atualizar para gerar o relatório.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
