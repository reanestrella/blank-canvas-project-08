import InstallButton from "@/components/InstallButton";
import { useState, type CSSProperties } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCongregations } from "@/hooks/useCongregations";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { pedirPermissao, type NotificationPermissionStatus } from "@/lib/onesignal";
import { AppLayout } from "@/components/layout/AppLayout";
import { CongregationSelector } from "@/components/layout/CongregationSelector";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import { AiAlertsCard } from "@/components/ai/AiAlertsCard";
import { AiReportCard } from "@/components/dashboard/AiReportCard";
import { NetworkOverview } from "@/components/dashboard/NetworkOverview";
import { SpiritualFunnel } from "@/components/dashboard/SpiritualFunnel";
import { CellChartsCard } from "@/components/dashboard/CellChartsCard";
import { BirthdayCard } from "@/components/dashboard/BirthdayCard";
import { WeddingAnniversaryCard } from "@/components/dashboard/WeddingAnniversaryCard";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { FinanceOverview } from "@/components/dashboard/FinanceOverview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Bell, Users, Heart, Eye, UserCheck, CheckCircle2, Droplets,
  Loader2, Sparkles, ChevronUp, ChevronDown, CalendarDays,
} from "lucide-react";

function PastorDashboard() {
  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { congregations, selectedCongregation, setSelectedCongregation } = useCongregations(churchId || undefined);
  const { stats, isLoading, members } = useDashboardStats(selectedCongregation);
  const [aiOpen, setAiOpen] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [notificationResult, setNotificationResult] = useState<NotificationPermissionStatus | null>(null);

  const notificationPermission: NotificationPermissionStatus =
    typeof Notification === "undefined" ? "unsupported" : Notification.permission;

  const canRequestNotification = notificationPermission !== "granted" && notificationPermission !== "denied" && notificationPermission !== "unsupported";

  const handleNotificationPermission = async () => {
    setIsRequestingPermission(true);
    const result = await pedirPermissao();
    setNotificationResult(result);
    setIsRequestingPermission(false);
  };

  const statCards = [
    { title: "Membros", value: stats.totalMembers.toString(), change: "Membros ativos", changeType: "positive" as const, icon: Users, iconColor: "bg-primary/10 text-primary" },
    { title: "Decididos", value: stats.totalDecididos.toString(), change: "Novos convertidos", changeType: "positive" as const, icon: Heart, iconColor: "bg-success/10 text-success" },
    { title: "Visitantes", value: stats.totalVisitantes.toString(), change: "Cadastrados", changeType: "neutral" as const, icon: Eye, iconColor: "bg-secondary/10 text-secondary" },
    { title: "Em Consolidação", value: stats.totalConsolidacao.toString(), change: "Em acompanhamento", changeType: "positive" as const, icon: UserCheck, iconColor: "bg-accent/10 text-accent-foreground" },
    { title: "Consolidados", value: stats.totalConsolidados.toString(), change: "Processo concluído", changeType: "positive" as const, icon: CheckCircle2, iconColor: "bg-success/10 text-success" },
    { title: "Batizados", value: stats.totalBaptized.toString(), change: "Total batizados", changeType: "positive" as const, icon: Droplets, iconColor: "bg-info/10 text-info" },
  ];

  const quickHighlights = [
    { label: "Membros visíveis", value: members.length.toString(), icon: Users },
    { label: "Alertas recentes", value: stats.recentAlerts.length.toString(), icon: Sparkles },
    { label: "Aniversários na semana", value: (Array.isArray(stats.birthdaysThisWeek) ? stats.birthdaysThisWeek.length : 0).toString(), icon: CalendarDays },
  ];

  const notificationMessage =
    notificationResult === "granted"
      ? "Notificações ativadas com sucesso."
      : notificationPermission === "denied" || notificationResult === "denied"
        ? "As notificações foram bloqueadas no navegador. Libere o site nas configurações do navegador para tentar novamente."
        : notificationResult === "unsupported" || notificationPermission === "unsupported"
          ? "Seu navegador não oferece suporte a notificações push."
          : notificationResult === "unavailable"
            ? "O OneSignal ainda está carregando. Aguarde alguns segundos e tente novamente."
            : notificationResult === "error"
              ? "Não foi possível abrir o pedido de permissão agora."
              : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* restante do seu dashboard permanece igual */}
      <NetworkOverview stats={stats.networkStats} totalMembers={stats.totalMembers} />
      <SpiritualFunnel />
      <CellChartsCard />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BirthdayCard birthdaysThisMonth={stats.birthdaysThisMonth} birthdaysThisWeek={stats.birthdaysThisWeek} />
        <WeddingAnniversaryCard anniversariesThisMonth={stats.weddingAnniversariesThisMonth} anniversariesThisWeek={stats.weddingAnniversariesThisWeek} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UpcomingEvents />
        <FinanceOverview />
      </div>
      <RecentActivity />
    </div>
  );
}

function Dashboard() {
  return (
    <AppLayout requireChurch>

      {/* 🔥 BOTÃO DE INSTALAÇÃO (AGORA FUNCIONA) */}
      <div className="p-4">
        <InstallButton />
      </div>

      <PastorDashboard />
    </AppLayout>
  );
}

export default Dashboard;
