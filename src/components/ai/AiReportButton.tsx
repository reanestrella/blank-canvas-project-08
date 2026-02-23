import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAiFeatureAccess } from "@/hooks/useAiFeatureAccess";

interface AiReportButtonProps {
  reportId: string;
  onReportGenerated?: (report: string) => void;
}

export function AiReportButton({ reportId, onReportGenerated }: AiReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { currentChurchId, session } = useAuth();
  const { toast } = useToast();
  const { hasAccess, checkAccess, showPremiumMessage } = useAiFeatureAccess();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAccess().then(() => setChecked(true));
  }, [checkAccess]);

  const generateReport = async () => {
    if (!currentChurchId || !session?.access_token) return;
    
    if (checked && hasAccess === false) {
      showPremiumMessage();
      return;
    }

    setIsGenerating(true);

    try {
      const resp = await supabase.functions.invoke("ai-generate-report", {
        body: { report_id: reportId, church_id: currentChurchId },
      });

      if (resp.error) {
        const errBody = typeof resp.error === "object" ? resp.error : { message: String(resp.error) };
        if ((errBody as any).context?.status === 403) {
          showPremiumMessage();
          return;
        }
        if ((errBody as any).context?.status === 429) {
          toast({ title: "Limite atingido", description: "Limite diário de uso atingido.", variant: "destructive" });
          return;
        }
        throw resp.error;
      }

      const generatedReport = resp.data?.report;
      if (generatedReport) {
        toast({ title: "Relatório gerado", description: "O relatório foi gerado com sucesso pela IA." });
        onReportGenerated?.(generatedReport);
      }
    } catch (e) {
      console.error("Error generating AI report:", e);
      toast({ title: "Erro", description: "Não foi possível gerar sugestão no momento.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Don't render button if no access
  if (checked && hasAccess === false) return null;

  return (
    <Button variant="outline" size="sm" onClick={generateReport} disabled={isGenerating}>
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <Sparkles className="w-4 h-4 mr-2" />
      )}
      Sugerir relatório com IA
    </Button>
  );
}
