function PastorDashboard() {
  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { congregations, selectedCongregation, setSelectedCongregation } = useCongregations(churchId || undefined);
  const { stats, isLoading, members } = useDashboardStats(selectedCongregation);
  const [aiOpen, setAiOpen] = useState(false);

  const statCards = [
    { title: "Membros", value: stats.totalMembers.toString(), change: "Membros ativos", changeType: "positive" as const, icon: Users, iconColor: "bg-primary/10 text-primary" },
    { title: "Decididos", value: stats.totalDecididos.toString(), change: "Novos convertidos", changeType: "positive" as const, icon: Heart, iconColor: "bg-success/10 text-success" },
    { title: "Visitantes", value: stats.totalVisitantes.toString(), change: "Cadastrados", changeType: "neutral" as const, icon: Eye, iconColor: "bg-secondary/10 text-secondary" },
    { title: "Em Consolidação", value: stats.totalConsolidacao.toString(), change: "Em acompanhamento", changeType: "positive" as const, icon: UserCheck, iconColor: "bg-accent/10 text-accent-foreground" },
    { title: "Consolidados", value: stats.totalConsolidados.toString(), change: "Processo concluído", changeType: "positive" as const, icon: CheckCircle2, iconColor: "bg-success/10 text-success" },
    { title: "Batizados", value: stats.totalBaptized.toString(), change: "Total batizados", changeType: "positive" as const, icon: Droplets, iconColor: "bg-info/10 text-info" },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      {/* 🔔 BOTÃO INTELIGENTE DE NOTIFICAÇÃO */}
      {Notification.permission !== "granted" && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-sm md:text-base">
              🔔 Ative as notificações
            </h2>
            <p className="text-xs text-muted-foreground">
              Receba avisos de eventos, escalas e comunicados importantes da igreja.
            </p>
          </div>
          <button
            onClick={pedirPermissao}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition"
          >
            Ativar agora
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo de volta! Aqui está o resumo da sua igreja.</p>
        </div>
        <CongregationSelector congregations={congregations} selectedId={selectedCongregation} onSelect={setSelectedCongregation} />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={stat.title} {...stat} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties} />
        ))}
      </div>

      {stats.recentAlerts.length > 0 && <AlertsCard alerts={stats.recentAlerts} />}

      {/* AI Section */}
      <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full flex items-center justify-between gap-2 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Inteligência Artificial</span>
              <Badge variant="secondary" className="text-xs">IA</Badge>
            </div>
            {aiOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
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
    </>
  );
}
