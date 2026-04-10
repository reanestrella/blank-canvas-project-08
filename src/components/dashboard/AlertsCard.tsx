import { Bell, UserPlus, Heart, AlertCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum alerta pendente</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Tudo tranquilo por aqui ✨</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <Bell className="h-4 w-4" />
          </div>
          Alertas
          <Badge variant="destructive" className="ml-auto text-xs">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[260px] pr-3">
          <div className="space-y-2">
            {alerts.map((alert) => {
              const config = alertConfig[alert.alert_type] || alertConfig.aniversario;
              const Icon = config.icon;
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/40"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{config.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {alert.message || "Novo registro"}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(alert.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
