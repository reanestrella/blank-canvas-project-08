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
import { Bell, Users, Heart, Eye, UserCheck, CheckCircle2, Droplets, Loader2, Sparkles, ChevronUp, ChevronDown, CalendarDays } from "lucide-react";

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
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <section className="gradient-hero relative overflow-hidden rounded-[2rem] border text-primary-foreground shadow-lg">
        <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 p-6 md:p-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/10">
              Visão geral da igreja
            </Badge>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold md:text-4xl">Dashboard</h1>
              <p className="max-w-2xl text-sm text-primary-foreground/80 md:text-base">
                Bem-vindo de volta! Acompanhe pessoas, alertas e próximos movimentos da sua igreja em um painel mais claro e direto.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {quickHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-2xl border border-primary-foreground/15 bg-background/10 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-primary-foreground/80">
                      <Icon className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-[0.2em]">{item.label}</span>
                    </div>
                    <p className="mt-3 text-2xl font-semibold">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-full max-w-sm rounded-2xl border border-primary-foreground/15 bg-background/10 p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/70">Congregação</p>
            <div className="mt-3">
              <CongregationSelector congregations={congregations} selectedId={selectedCongregation} onSelect={setSelectedCongregation} />
            </div>
            <p className="mt-3 text-xs text-primary-foreground/70">
              Filtre rapidamente a visão geral para a unidade desejada.
            </p>
          </div>
        </div>
      </section>

      {notificationPermission !== "granted" && (
        <Card className="border-primary/15 bg-card/80 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Ative as notificações</h2>
                  <p className="text-sm text-muted-foreground">
                    Receba avisos de eventos, escalas e comunicados importantes da igreja.
                  </p>
                </div>
              </div>

              {notificationMessage && (
                <p className="text-sm text-muted-foreground">{notificationMessage}</p>
              )}
            </div>

            <Button
              onClick={handleNotificationPermission}
              size="lg"
              disabled={!canRequestNotification || isRequestingPermission}
              className="min-w-[12rem]"
            >
              {isRequestingPermission ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Solicitando...
                </>
              ) : notificationPermission === "denied" ? (
                "Permissão bloqueada"
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  Ativar agora
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((stat, index) => (
          <StatCard key={stat.title} {...stat} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` } as CSSProperties} />
        ))}
      </div>

      {stats.recentAlerts.length > 0 && <AlertsCard alerts={stats.recentAlerts} />}

      <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between gap-2 py-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Inteligência Artificial</span>
              <Badge variant="secondary" className="text-xs">IA</Badge>
            </div>
            {aiOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 grid gap-4 xl:grid-cols-2">
          <AiAlertsCard />
          <AiReportCard />
        </CollapsibleContent>
      </Collapsible>

      <NetworkOverview stats={stats.networkStats} totalMembers={stats.totalMembers + stats.totalDecididos + stats.totalVisitantes} />
      <SpiritualFunnel />
      <CellChartsCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BirthdayCard birthdaysThisMonth={stats.birthdaysThisMonth} birthdaysThisWeek={stats.birthdaysThisWeek} />
        <WeddingAnniversaryCard anniversariesThisMonth={stats.weddingAnniversariesThisMonth} anniversariesThisWeek={stats.weddingAnniversariesThisWeek} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      <PastorDashboard />
    </AppLayout>
  );
}

export default Dashboard;
