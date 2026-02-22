import { useEffect, useState } from "react";
import { AlertCircle, Brain, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAiAlerts } from "@/hooks/useAiAlerts";
import { useAiFeatureAccess } from "@/hooks/useAiFeatureAccess";

const riskColors: Record<string, string> = {
  alto: "bg-destructive/10 text-destructive",
  medio: "bg-warning/10 text-warning",
  baixo: "bg-muted text-muted-foreground",
};

const riskLabels: Record<string, string> = {
  alto: "Alto",
  medio: "Médio",
  baixo: "Baixo",
};

export function AiAlertsCard() {
  const { alerts, isLoading, isDetecting, fetchAlerts, detectAbsent, resolveAlert } = useAiAlerts();
  const { hasAccess, checkAccess } = useAiFeatureAccess();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAccess().then(() => setChecked(true));
  }, []);

  useEffect(() => {
    if (checked && hasAccess) {
      fetchAlerts();
    }
  }, [checked, hasAccess]);

  if (!checked) return null;
  if (hasAccess === false) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Alertas Inteligentes
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-auto">{alerts.length}</Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={detectAbsent}
            disabled={isDetecting}
            className="ml-auto"
            title="Analisar membros afastados"
          >
            {isDetecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle className="w-8 h-8 text-success mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum alerta de afastamento detectado</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={detectAbsent} disabled={isDetecting}>
              {isDetecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
              Executar Análise
            </Button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className={`p-2 rounded-lg ${riskColors[alert.risk_level] || riskColors.baixo}`}>
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{(alert as any).member?.full_name || "Membro"}</p>
                    <Badge variant="outline" className="text-xs">
                      {riskLabels[alert.risk_level] || "Baixo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {alert.days_absent ? `${alert.days_absent} dias ausente` : "Sem registro de presença"}
                  </p>
                  {alert.message && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.message}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resolveAlert(alert.id)}
                  title="Marcar como resolvido"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
