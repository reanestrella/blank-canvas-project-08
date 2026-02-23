import { useMemo } from "react";
import { Users, Heart, Grid3X3, TrendingUp, Eye, Loader2, DollarSign } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { SpiritualFunnel } from "@/components/dashboard/SpiritualFunnel";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { CellsOverview } from "@/components/dashboard/CellsOverview";
import { FinanceOverview } from "@/components/dashboard/FinanceOverview";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { BirthdayCard } from "@/components/dashboard/BirthdayCard";
import { WeddingAnniversaryCard } from "@/components/dashboard/WeddingAnniversaryCard";
import { NetworkOverview } from "@/components/dashboard/NetworkOverview";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import { AiAlertsCard } from "@/components/ai/AiAlertsCard";
import { AiReportCard } from "@/components/dashboard/AiReportCard";
import { CongregationSelector } from "@/components/layout/CongregationSelector";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useCongregations } from "@/hooks/useCongregations";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigate } from "react-router-dom";

// Dashboard for Pastor/Admin - full view
function PastorDashboard() {
  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { congregations, selectedCongregation, setSelectedCongregation } = useCongregations(churchId || undefined);
  const { stats, isLoading } = useDashboardStats(selectedCongregation);

  const statCards = [
    { title: "Total de Membros", value: stats.totalMembers.toString(), change: "Ativos na igreja", changeType: "positive" as const, icon: Users, iconColor: "bg-primary/10 text-primary" },
    { title: "Novos Convertidos", value: stats.totalDecididos.toString(), change: "Decididos", changeType: "positive" as const, icon: Heart, iconColor: "bg-success/10 text-success" },
    { title: "Visitantes", value: stats.totalVisitantes.toString(), change: "Em acompanhamento", changeType: "neutral" as const, icon: Eye, iconColor: "bg-secondary/10 text-secondary" },
    { title: "Batizados", value: stats.totalBaptized.toString(), change: "Total batizados", changeType: "positive" as const, icon: TrendingUp, iconColor: "bg-info/10 text-info" },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo de volta! Aqui está o resumo da sua igreja.</p>
        </div>
        <CongregationSelector congregations={congregations} selectedId={selectedCongregation} onSelect={setSelectedCongregation} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={stat.title} {...stat} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties} />
        ))}
      </div>

      {stats.recentAlerts.length > 0 && <AlertsCard alerts={stats.recentAlerts} />}

      <AiAlertsCard />
      <AiReportCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <NetworkOverview stats={stats.networkStats} totalMembers={stats.totalMembers + stats.totalDecididos + stats.totalVisitantes} />
          <CellsOverview />
          <UpcomingEvents />
        </div>
        <div className="space-y-6">
          <BirthdayCard birthdaysThisMonth={stats.birthdaysThisMonth} birthdaysThisWeek={stats.birthdaysThisWeek} />
          <WeddingAnniversaryCard anniversariesThisMonth={stats.weddingAnniversariesThisMonth} anniversariesThisWeek={stats.weddingAnniversariesThisWeek} />
          <SpiritualFunnel />
          <FinanceOverview />
        </div>
      </div>
      <RecentActivity />
    </>
  );
}

// Dashboard for Secretary
function SecretaryDashboard() {
  const { stats, isLoading } = useDashboardStats(null);
  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  return (
    <>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Secretaria - Dashboard</h1>
        <p className="text-muted-foreground">Visão geral de pessoas e acompanhamentos</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Membros" value={stats.totalMembers.toString()} change="Ativos" changeType="positive" icon={Users} iconColor="bg-primary/10 text-primary" />
        <StatCard title="Decididos" value={stats.totalDecididos.toString()} change="Novos convertidos" changeType="positive" icon={Heart} iconColor="bg-success/10 text-success" />
        <StatCard title="Visitantes" value={stats.totalVisitantes.toString()} change="Em acompanhamento" changeType="neutral" icon={Eye} iconColor="bg-secondary/10 text-secondary" />
        <StatCard title="Batizados" value={stats.totalBaptized.toString()} change="Total" changeType="positive" icon={TrendingUp} iconColor="bg-info/10 text-info" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BirthdayCard birthdaysThisMonth={stats.birthdaysThisMonth} birthdaysThisWeek={stats.birthdaysThisWeek} />
        <WeddingAnniversaryCard anniversariesThisMonth={stats.weddingAnniversariesThisMonth} anniversariesThisWeek={stats.weddingAnniversariesThisWeek} />
      </div>
      <UpcomingEvents />
    </>
  );
}

function TreasurerDashboard() {
  return (
    <>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Tesouraria - Dashboard</h1>
        <p className="text-muted-foreground">Visão geral financeira</p>
      </div>
      <FinanceOverview />
    </>
  );
}

function MinistryLeaderDashboard() {
  return (
    <>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Meu Ministério - Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu ministério</p>
      </div>
      <UpcomingEvents />
    </>
  );
}

function ConsolidationDashboard() {
  const { stats, isLoading } = useDashboardStats(null);
  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  return (
    <>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Consolidação - Dashboard</h1>
        <p className="text-muted-foreground">Acompanhamento de novos convertidos</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Decididos" value={stats.totalDecididos.toString()} change="Novos convertidos" changeType="positive" icon={Heart} iconColor="bg-success/10 text-success" />
        <StatCard title="Visitantes" value={stats.totalVisitantes.toString()} change="Em acompanhamento" changeType="neutral" icon={Eye} iconColor="bg-secondary/10 text-secondary" />
        <StatCard title="Membros" value={stats.totalMembers.toString()} change="Integrados" changeType="positive" icon={Users} iconColor="bg-primary/10 text-primary" />
      </div>
      <SpiritualFunnel />
    </>
  );
}

function MemberDashboard() {
  return (
    <>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Bem-vindo!</h1>
        <p className="text-muted-foreground">Acesse o "Meu App" no menu lateral para ver seus dados.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Meu App</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Use o menu "Meu App" para ver avisos, aniversariantes, sua escala e eventos da igreja.</p>
        </CardContent>
      </Card>
    </>
  );
}

export default function Dashboard() {
  const { roles, isAdmin, hasRole, hasAnyRole } = useAuth();

  const isOnlyCellLeader = hasRole("lider_celula") && !hasRole("pastor") && !hasRole("secretario") && !hasRole("tesoureiro") && !hasRole("consolidacao");

  const dashboardSections = useMemo(() => {
    if (isOnlyCellLeader) return []; // will redirect
    if (isAdmin() || hasRole("pastor")) return [PastorDashboard];
    const sections: React.FC[] = [];
    if (hasRole("secretario")) sections.push(SecretaryDashboard);
    if (hasRole("tesoureiro")) sections.push(TreasurerDashboard);
    if (hasRole("lider_ministerio")) sections.push(MinistryLeaderDashboard);
    if (hasRole("consolidacao")) sections.push(ConsolidationDashboard);
    if (sections.length === 0) sections.push(MemberDashboard);
    return sections;
  }, [roles, isAdmin, hasRole, isOnlyCellLeader]);

  if (isOnlyCellLeader) {
    return <Navigate to="/celulas" replace />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {dashboardSections.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Seus painéis:</span>
            {dashboardSections.map((Section, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {Section === SecretaryDashboard && "Secretaria"}
                {Section === TreasurerDashboard && "Tesouraria"}
                {Section === MinistryLeaderDashboard && "Ministério"}
                {Section === ConsolidationDashboard && "Consolidação"}
              </Badge>
            ))}
          </div>
        )}
        {dashboardSections.map((Section, index) => (
          <Section key={index} />
        ))}
      </div>
    </AppLayout>
  );
}
