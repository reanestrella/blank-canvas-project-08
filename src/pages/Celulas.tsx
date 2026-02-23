import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Grid3X3, Users, MapPin, Calendar, TrendingUp, Heart, Clock,
  MoreHorizontal, FileText, Loader2, UserPlus, BarChart3, Sparkles,
  DollarSign, Percent, Eye,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCells, CreateCellData, CreateCellReportData } from "@/hooks/useCells";
import { useMembers } from "@/hooks/useMembers";
import { useFinancialAccounts } from "@/hooks/useFinancialAccounts";
import { CellModal } from "@/components/modals/CellModal";
import { CellReportWithAttendanceModal } from "@/components/modals/CellReportWithAttendanceModal";
import { CellMembersModal } from "@/components/modals/CellMembersModal";
import { CellReportsOverview } from "@/components/cells/CellReportsOverview";
import { CellLeaderPillars } from "@/components/cells/CellLeaderPillars";
import { EditCellReportModal } from "@/components/modals/EditCellReportModal";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Cell, CellReport } from "@/hooks/useCells";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  active: { label: "Ativa", color: "bg-success/20 text-success" },
  multiplying: { label: "Multiplicando", color: "bg-secondary/20 text-secondary" },
  new: { label: "Nova", color: "bg-info/20 text-info" },
  inactive: { label: "Inativa", color: "bg-muted text-muted-foreground" },
};

function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = format(d, "MMMM yyyy", { locale: ptBR });
    options.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

export default function Celulas() {
  const [activeTab, setActiveTab] = useState("cells");
  const [cellModalOpen, setCellModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [pillarsCell, setPillarsCell] = useState<Cell | null>(null);
  const [editingCell, setEditingCell] = useState<Cell | undefined>();
  const [deletingCell, setDeletingCell] = useState<Cell | null>(null);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | undefined>();
  const [cellMemberCounts, setCellMemberCounts] = useState<Record<string, number>>({});
  const [editingReport, setEditingReport] = useState<CellReport | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [offeringAccountId, setOfferingAccountId] = useState<string>("");

  const { profile, hasRole, user } = useAuth();
  const { toast } = useToast();
  const churchId = profile?.church_id;

  const isOnlyCellLeader = hasRole("lider_celula") && !hasRole("pastor");
  const leaderUserId = isOnlyCellLeader ? (user?.id ?? null) : undefined;

  const { cells, reports, isLoading, createCell, updateCell, deleteCell, createReport, updateReport, fetchReports } = useCells(churchId || undefined, leaderUserId);
  const { members } = useMembers(churchId || undefined);
  const { accounts } = useFinancialAccounts(churchId || undefined);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  // Fetch cell member counts
  useEffect(() => {
    if (cells.length === 0) return;
    const fetchCounts = async () => {
      const cellIds = cells.map(c => c.id);
      const { data } = await supabase
        .from("cell_members")
        .select("cell_id")
        .in("cell_id", cellIds);
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((row: any) => {
          counts[row.cell_id] = (counts[row.cell_id] || 0) + 1;
        });
        setCellMemberCounts(counts);
      }
    };
    fetchCounts();
  }, [cells]);

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return null;
    const member = members.find((m) => m.id === memberId);
    return member?.full_name || null;
  };

  const activeCells = cells.filter((c) => c.is_active);

  // Filter reports by selected month for dashboard stats
  const filteredReports = useMemo(() => {
    if (selectedMonth === "all") return reports;
    return reports.filter(r => r.report_date.startsWith(selectedMonth));
  }, [reports, selectedMonth]);

  const totalCellMembers = Object.values(cellMemberCounts).reduce((sum, c) => sum + c, 0);
  const totalVisitorsMonth = filteredReports.reduce((sum, r) => sum + r.visitors, 0);
  const totalConversionsMonth = filteredReports.reduce((sum, r) => sum + r.conversions, 0);
  const totalOfferingMonth = filteredReports.reduce((sum, r) => sum + (r.offering || 0), 0);
  const totalAttendanceMonth = filteredReports.reduce((sum, r) => sum + r.attendance, 0);
  const avgAttendance = filteredReports.length > 0 ? Math.round(totalAttendanceMonth / filteredReports.length) : 0;
  
  // % = total presences / (totalDisciples * meetings) * 100
  const maxPossible = totalCellMembers * filteredReports.length;
  const attendancePercent = maxPossible > 0 ? Math.round((totalAttendanceMonth / maxPossible) * 100) : 0;

  const leaderStats = [
    { label: "Discípulos", value: totalCellMembers, icon: Users, color: "text-primary" },
    { label: "Presentes (Média)", value: avgAttendance, icon: TrendingUp, color: "text-success" },
    { label: "% Presença", value: `${attendancePercent}%`, icon: Percent, color: "text-info" },
    { label: "Visitantes", value: totalVisitorsMonth, icon: Eye, color: "text-secondary" },
    { label: "Decisões", value: totalConversionsMonth, icon: Heart, color: "text-rose-500" },
    { label: "Oferta", value: `R$ ${totalOfferingMonth.toFixed(0)}`, icon: DollarSign, color: "text-amber-500" },
  ];

  const stats = [
    { label: "Células Ativas", value: activeCells.length, icon: Grid3X3, color: "text-success" },
    { label: "Total de Células", value: cells.length, icon: Users, color: "text-primary" },
    { label: "Visitantes", value: totalVisitorsMonth, icon: Heart, color: "text-secondary" },
    { label: "Decisões", value: totalConversionsMonth, icon: TrendingUp, color: "text-info" },
  ];

  const handleOpenNewCell = () => { setEditingCell(undefined); setCellModalOpen(true); };
  const handleOpenEditCell = (cell: Cell) => { setEditingCell(cell); setCellModalOpen(true); };
  const handleOpenMembers = (cell: Cell) => { setSelectedCell(cell); setMembersModalOpen(true); };
  const handleCloseCellModal = (open: boolean) => { setCellModalOpen(open); if (!open) setEditingCell(undefined); };
  const handleOpenReport = (cellId?: string) => { setSelectedCellId(cellId); setReportModalOpen(true); };

  const handleCreateCell = async (data: CreateCellData) => {
    if (!churchId) return { data: null, error: new Error("Igreja não identificada") };
    return createCell({ ...data, church_id: churchId });
  };

  const handleUpdateCell = async (data: CreateCellData) => {
    if (!editingCell) return { data: null, error: new Error("No cell to edit") };
    return updateCell(editingCell.id, data);
  };

  // Register offering as financial transaction
  const registerOfferingTransaction = async (cellId: string, amount: number, reportDate: string) => {
    if (!churchId || !offeringAccountId || offeringAccountId === "none" || amount <= 0) return;
    const cellName = cells.find(c => c.id === cellId)?.name || "Célula";
    try {
      const { error } = await supabase.from("financial_transactions").insert([{
        church_id: churchId,
        type: "receita",
        description: `Oferta da ${cellName}`,
        amount,
        transaction_date: reportDate,
        account_id: offeringAccountId,
        created_by: user?.id,
      }]);
      if (error) {
        console.error("Erro ao registrar oferta no financeiro:", error);
        toast({ title: "Aviso", description: "Oferta registrada no relatório mas houve erro ao registrar no financeiro.", variant: "destructive" });
      } else {
        toast({ title: "Oferta registrada", description: `R$ ${amount.toFixed(2)} registrado na conta financeira.` });
      }
    } catch (err) {
      console.error("Erro ao registrar oferta no financeiro:", err);
      toast({ title: "Aviso", description: "Oferta registrada no relatório mas houve erro ao registrar no financeiro.", variant: "destructive" });
    }
  };

  const handleCreateReport = async (data: CreateCellReportData) => {
    const result = await createReport(data);
    if (!result.error) {
      // Register offering as transaction if account is set
      if (data.offering && data.offering > 0 && offeringAccountId) {
        await registerOfferingTransaction(data.cell_id, data.offering, data.report_date);
      }
      fetchReports();
    }
    return result;
  };

  const handleUpdateReport = async (id: string, data: Partial<CreateCellReportData>) => {
    return updateReport(id, data);
  };

  const getCellStatus = (cell: Cell) => {
    if (!cell.is_active) return "inactive";
    const recentReports = reports.filter(
      (r) => r.cell_id === cell.id && new Date(r.report_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    if (recentReports.length === 0) return "new";
    return "active";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {isOnlyCellLeader ? "Minha Célula" : "Células"}
            </h1>
            <p className="text-muted-foreground">
              {isOnlyCellLeader ? "Dashboard e gestão da sua célula" : "Gerencie as células e grupos familiares da sua igreja"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleOpenReport()}>
              <FileText className="w-4 h-4 mr-2" />
              Enviar Relatório
            </Button>
            {!isOnlyCellLeader && (
              <Button className="gradient-accent text-secondary-foreground shadow-lg hover:shadow-xl transition-all" onClick={handleOpenNewCell}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Célula
              </Button>
            )}
          </div>
        </div>

        {/* Month Filter + Offering Account (for pastor) */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Mês:</span>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!isOnlyCellLeader && accounts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Conta p/ Ofertas:</span>
              <Select value={offeringAccountId} onValueChange={setOfferingAccountId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (não registrar)</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Cell Leader Dashboard */}
        {isOnlyCellLeader && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {leaderStats.map((stat) => (
              <Card key={stat.label} className="text-center">
                <CardContent className="p-4">
                  <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pastor/Admin Stats */}
        {!isOnlyCellLeader && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="cells" className="flex items-center gap-2">
              <Grid3X3 className="w-4 h-4" />
              Células
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            {pillarsCell && (
              <TabsTrigger value="pillars" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Ferramentas
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="cells" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : cells.length === 0 ? (
              <div className="card-elevated flex flex-col items-center justify-center p-12 text-center">
                <Grid3X3 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma célula cadastrada</h3>
                <p className="text-muted-foreground mb-4">Comece criando a primeira célula da sua igreja.</p>
                <Button onClick={handleOpenNewCell}><Plus className="w-4 h-4 mr-2" />Criar Célula</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cells.map((cell) => {
                  const status = getCellStatus(cell);
                  const leaderName = getMemberName(cell.leader_id);
                  const supervisorName = getMemberName(cell.supervisor_id);
                  const memberCount = cellMemberCounts[cell.id] || 0;
                  
                  return (
                    <div key={cell.id} className="card-elevated p-5 hover:shadow-lg transition-all duration-300 animate-fade-in">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{cell.name}</h3>
                            <Badge variant="secondary" className={statusConfig[status]?.color}>
                              {statusConfig[status]?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {cell.network || "Sem rede"} • {memberCount} discípulos
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setPillarsCell(cell); setActiveTab("pillars"); }}>
                              <Sparkles className="w-4 h-4 mr-2" />Ferramentas do Líder
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenMembers(cell)}>
                              <UserPlus className="w-4 h-4 mr-2" />Gerenciar membros
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenReport(cell.id)}>
                              <FileText className="w-4 h-4 mr-2" />Enviar relatório
                            </DropdownMenuItem>
                            {!isOnlyCellLeader && (
                              <>
                                <DropdownMenuItem onClick={() => handleOpenEditCell(cell)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingCell(cell)}>Excluir</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {leaderName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{leaderName || "Sem líder"}</p>
                          <p className="text-xs text-muted-foreground">Supervisor: {supervisorName || "Não definido"}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" /><span className="truncate">{cell.address || "Local não definido"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" /><span>{cell.day_of_week || "Dia não definido"}</span>
                          {cell.time && (<><Clock className="w-4 h-4 ml-2" /><span>{cell.time}</span></>)}
                        </div>
                      </div>

                      {(() => {
                        const cellReports = reports.filter((r) => r.cell_id === cell.id);
                        const lastReport = cellReports[0];
                        return (
                          <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                            <div className="text-center">
                              <p className="text-lg font-bold text-success">{lastReport?.attendance || 0}</p>
                              <p className="text-xs text-muted-foreground">Presença</p>
                            </div>
                            <div className="text-center border-x">
                              <p className="text-lg font-bold text-secondary">{lastReport?.visitors || 0}</p>
                              <p className="text-xs text-muted-foreground">Visitantes</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-info">{lastReport?.conversions || 0}</p>
                              <p className="text-xs text-muted-foreground">Decisões</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <CellReportsOverview
              cells={cells}
              reports={reports}
              getMemberName={getMemberName}
              cellMemberCounts={cellMemberCounts}
              onEditReport={(report) => setEditingReport(report)}
              isLeader={isOnlyCellLeader}
            />
          </TabsContent>

          {pillarsCell && churchId && (
            <TabsContent value="pillars" className="mt-6">
              <CellLeaderPillars cell={pillarsCell} churchId={churchId} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <CellModal open={cellModalOpen} onOpenChange={handleCloseCellModal} cell={editingCell} members={members} onSubmit={editingCell ? handleUpdateCell : handleCreateCell} />
      <CellReportWithAttendanceModal open={reportModalOpen} onOpenChange={setReportModalOpen} cells={cells} defaultCellId={selectedCellId} onSubmit={handleCreateReport} />
      {selectedCell && (<CellMembersModal open={membersModalOpen} onOpenChange={setMembersModalOpen} cell={selectedCell} churchMembers={members} />)}
      <EditCellReportModal
        open={!!editingReport}
        onOpenChange={(open) => { if (!open) setEditingReport(null); }}
        report={editingReport}
        onSubmit={handleUpdateReport}
      />
      <DeleteConfirmModal open={!!deletingCell} onOpenChange={(open) => !open && setDeletingCell(null)} title="Excluir Célula" description={`Tem certeza que deseja excluir "${deletingCell?.name}"? Esta ação não pode ser desfeita.`} onConfirm={() => deleteCell(deletingCell!.id)} />
    </AppLayout>
  );
}
