import { useMemo } from "react";
import { Users, Heart, Grid3X3, TrendingUp, Eye, Loader2, DollarSign, MapPin, Calendar, Clock, FileText } from "lucide-react";
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
import { CongregationSelector } from "@/components/layout/CongregationSelector";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useCongregations } from "@/hooks/useCongregations";
import { useAuth } from "@/contexts/AuthContext";
import { useCells } from "@/hooks/useCells";
import { useCellMembers } from "@/hooks/useCellMembers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Dashboard for Pastor/Admin - full view
function PastorDashboard() {
  const { congregations, selectedCongregation, setSelectedCongregation } = useCongregations();
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

// Dashboard for Treasurer
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

// Dashboard for Cell Leader - shows only their own cell(s)
function CellLeaderDashboard() {
  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const memberId = profile?.member_id;
  const { cells, reports, isLoading } = useCells(churchId || undefined);
  const navigate = useNavigate();

  // Filter only cells where this user is the leader
  const myCells = cells.filter((c) => c.leader_id === memberId);
  const myCell = myCells[0]; // Primary cell

  // Get reports for my cell(s)
  const myCellIds = myCells.map((c) => c.id);
  const myReports = reports.filter((r) => myCellIds.includes(r.cell_id));
  const recentReports = myReports.slice(0, 5);

  // Stats
  const lastReport = recentReports[0];
  const totalAttendance = recentReports.reduce((sum, r) => sum + r.attendance, 0);
  const avgAttendance = recentReports.length > 0 ? Math.round(totalAttendance / recentReports.length) : 0;
  const totalVisitors = myReports.reduce((sum, r) => sum + r.visitors, 0);
  const totalConversions = myReports.reduce((sum, r) => sum + r.conversions, 0);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!myCell) {
    return (
      <>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Minha Célula</h1>
          <p className="text-muted-foreground">Você ainda não está vinculado como líder de nenhuma célula.</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Grid3X3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Peça ao pastor ou administrador para vincular você como líder de uma célula.</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{myCell.name}</h1>
          <p className="text-muted-foreground">Dashboard da sua célula</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/app/celulas")}>
            <FileText className="w-4 h-4 mr-2" />
            Enviar Relatório
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Última Presença" value={lastReport?.attendance?.toString() || "0"} change="Último encontro" changeType="neutral" icon={Users} iconColor="bg-primary/10 text-primary" />
        <StatCard title="Média de Presença" value={avgAttendance.toString()} change={`Últimos ${recentReports.length} encontros`} changeType="positive" icon={TrendingUp} iconColor="bg-success/10 text-success" />
        <StatCard title="Visitantes" value={totalVisitors.toString()} change="Total acumulado" changeType="neutral" icon={Eye} iconColor="bg-secondary/10 text-secondary" />
        <StatCard title="Decisões" value={totalConversions.toString()} change="Total acumulado" changeType="positive" icon={Heart} iconColor="bg-info/10 text-info" />
      </div>

      {/* Cell Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-primary" />
            Informações da Célula
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{myCell.address || "Local não definido"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{myCell.day_of_week || "Dia não definido"}</span>
            </div>
            {myCell.time && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{myCell.time}</span>
              </div>
            )}
          </div>
          {myCell.network && (
            <Badge variant="secondary" className="mt-3">{myCell.network}</Badge>
          )}
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum relatório enviado ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{new Date(report.report_date).toLocaleDateString("pt-BR")}</p>
                    {report.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{report.notes}</p>}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-primary">{report.attendance}</p>
                      <p className="text-xs text-muted-foreground">Presença</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-secondary">{report.visitors}</p>
                      <p className="text-xs text-muted-foreground">Visitantes</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-success">{report.conversions}</p>
                      <p className="text-xs text-muted-foreground">Decisões</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// Dashboard for Ministry Leader
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

// Dashboard for Consolidation
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

// Dashboard for regular member (redirect to Meu App)
function MemberDashboard() {
  return (
    <>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Bem-vindo!</h1>
        <p className="text-muted-foreground">Acesse o "Meu App" no menu lateral para ver seus dados.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Meu App</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Use o menu "Meu App" para ver avisos, aniversariantes, sua escala e eventos da igreja.</p>
        </CardContent>
      </Card>
    </>
  );
}

export default function Dashboard() {
  const { roles, isAdmin, hasRole } = useAuth();

  // Determine which dashboard sections to show based on ALL roles (combined)
  const dashboardSections = useMemo(() => {
    // Pastor sees everything
    if (isAdmin() || hasRole("pastor")) return [PastorDashboard];
    
    const sections: React.FC[] = [];
    if (hasRole("secretario")) sections.push(SecretaryDashboard);
    if (hasRole("tesoureiro")) sections.push(TreasurerDashboard);
    if (hasRole("lider_celula")) sections.push(CellLeaderDashboard);
    if (hasRole("lider_ministerio")) sections.push(MinistryLeaderDashboard);
    if (hasRole("consolidacao")) sections.push(ConsolidationDashboard);
    
    if (sections.length === 0) sections.push(MemberDashboard);
    return sections;
  }, [roles, isAdmin, hasRole]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {dashboardSections.map((Section, index) => (
          <Section key={index} />
        ))}
      </div>
    </AppLayout>
  );
}
