import { Bell, UserPlus, Heart, AlertCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Alert {
  id: string;
  alert_type: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

interface AlertsCardProps {
  alerts: Alert[];
}

const alertConfig: Record<string, { icon: any; color: string; label: string }> = {
  novo_visitante: { icon: UserPlus, color: "bg-info/10 text-info", label: "Novo Visitante" },
  novo_convertido: { icon: Heart, color: "bg-success/10 text-success", label: "Novo Convertido" },
  ausencia_prolongada: { icon: AlertCircle, color: "bg-warning/10 text-warning", label: "Ausência" },
  aniversario: { icon: Calendar, color: "bg-secondary/10 text-secondary", label: "Aniversário" },
};

export function AlertsCard({ alerts }: AlertsCardProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Bell className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum alerta pendente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Alertas
          <Badge variant="secondary" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[250px] overflow-y-auto">
          {alerts.map((alert) => {
            const config = alertConfig[alert.alert_type] || alertConfig.aniversario;
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {alert.message || "Novo registro"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(alert.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
