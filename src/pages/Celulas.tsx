import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Grid3X3,
  Users,
  MapPin,
  Calendar,
  TrendingUp,
  Heart,
  Clock,
  MoreHorizontal,
  FileText,
  Loader2,
  UserPlus,
  BarChart3,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCells, CreateCellData, CreateCellReportData } from "@/hooks/useCells";
import { useMembers } from "@/hooks/useMembers";
import { CellModal } from "@/components/modals/CellModal";
import { CellReportWithAttendanceModal } from "@/components/modals/CellReportWithAttendanceModal";
import { CellMembersModal } from "@/components/modals/CellMembersModal";
import { CellReportsOverview } from "@/components/cells/CellReportsOverview";
import { CellLeaderPillars } from "@/components/cells/CellLeaderPillars";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { useAuth } from "@/contexts/AuthContext";
import type { Cell } from "@/hooks/useCells";

const statusConfig = {
  active: { label: "Ativa", color: "bg-success/20 text-success" },
  multiplying: { label: "Multiplicando", color: "bg-secondary/20 text-secondary" },
  new: { label: "Nova", color: "bg-info/20 text-info" },
  inactive: { label: "Inativa", color: "bg-muted text-muted-foreground" },
};

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

  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { cells, reports, isLoading, createCell, updateCell, deleteCell, createReport, fetchReports } = useCells(churchId || undefined);
  const { members } = useMembers(churchId || undefined);

  // Get member name by ID
  const getMemberName = (memberId: string | null) => {
    if (!memberId) return null;
    const member = members.find((m) => m.id === memberId);
    return member?.full_name || null;
  };

  // Calculate stats
  const activeCells = cells.filter((c) => c.is_active);
  const totalVisitors = reports.reduce((sum, r) => sum + r.visitors, 0);
  const totalConversions = reports.reduce((sum, r) => sum + r.conversions, 0);

  const stats = [
    { label: "Células Ativas", value: activeCells.length, icon: Grid3X3, color: "text-success" },
    { label: "Total de Células", value: cells.length, icon: Users, color: "text-primary" },
    { label: "Visitantes (Total)", value: totalVisitors, icon: Heart, color: "text-secondary" },
    { label: "Decisões (Total)", value: totalConversions, icon: TrendingUp, color: "text-info" },
  ];

  const handleOpenNewCell = () => {
    setEditingCell(undefined);
    setCellModalOpen(true);
  };

  const handleOpenEditCell = (cell: Cell) => {
    setEditingCell(cell);
    setCellModalOpen(true);
  };

  const handleOpenMembers = (cell: Cell) => {
    setSelectedCell(cell);
    setMembersModalOpen(true);
  };

  const handleCloseCellModal = (open: boolean) => {
    setCellModalOpen(open);
    if (!open) {
      setEditingCell(undefined);
    }
  };

  const handleOpenReport = (cellId?: string) => {
    setSelectedCellId(cellId);
    setReportModalOpen(true);
  };

  const handleCreateCell = async (data: CreateCellData) => {
    if (!churchId) return { data: null, error: new Error("Igreja não identificada") };
    return createCell({ ...data, church_id: churchId });
  };

  const handleUpdateCell = async (data: CreateCellData) => {
    if (!editingCell) return { data: null, error: new Error("No cell to edit") };
    return updateCell(editingCell.id, data);
  };

  const handleCreateReport = async (data: CreateCellReportData) => {
    const result = await createReport(data);
    if (!result.error) {
      fetchReports(); // Refresh reports after creating
    }
    return result;
  };

  // Get cell status based on members and activity
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
            <h1 className="text-2xl md:text-3xl font-bold">Células</h1>
            <p className="text-muted-foreground">
              Gerencie as células e grupos familiares da sua igreja
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleOpenReport()}>
              <FileText className="w-4 h-4 mr-2" />
              Enviar Relatório
            </Button>
            <Button 
              className="gradient-accent text-secondary-foreground shadow-lg hover:shadow-xl transition-all"
              onClick={handleOpenNewCell}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Célula
            </Button>
          </div>
        </div>

        {/* Stats */}
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

          {/* Cells Tab */}
          <TabsContent value="cells" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : cells.length === 0 ? (
              <div className="card-elevated flex flex-col items-center justify-center p-12 text-center">
                <Grid3X3 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma célula cadastrada</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando a primeira célula da sua igreja.
                </p>
                <Button onClick={handleOpenNewCell}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Célula
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cells.map((cell) => {
                  const status = getCellStatus(cell);
                  const leaderName = getMemberName(cell.leader_id);
                  const supervisorName = getMemberName(cell.supervisor_id);
                  
                  return (
                    <div
                      key={cell.id}
                      className="card-elevated p-5 hover:shadow-lg transition-all duration-300 animate-fade-in"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{cell.name}</h3>
                            <Badge
                              variant="secondary"
                              className={statusConfig[status]?.color}
                            >
                              {statusConfig[status]?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{cell.network || "Sem rede"}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setPillarsCell(cell);
                              setActiveTab("pillars");
                            }}>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Ferramentas do Líder
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenMembers(cell)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Gerenciar membros
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenReport(cell.id)}>
                              <FileText className="w-4 h-4 mr-2" />
                              Enviar relatório
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEditCell(cell)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeletingCell(cell)}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Leader */}
                      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {leaderName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{leaderName || "Sem líder"}</p>
                          <p className="text-xs text-muted-foreground">
                            Supervisor: {supervisorName || "Não definido"}
                          </p>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{cell.address || "Local não definido"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{cell.day_of_week || "Dia não definido"}</span>
                          {cell.time && (
                            <>
                              <Clock className="w-4 h-4 ml-2" />
                              <span>{cell.time}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Stats Row */}
                      {(() => {
                        const cellReports = reports.filter((r) => r.cell_id === cell.id);
                        const lastReport = cellReports[0];
                        
                        return (
                          <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                            <div className="text-center">
                              <p className="text-lg font-bold text-success">
                                {lastReport?.attendance || 0}
                              </p>
                              <p className="text-xs text-muted-foreground">Presença</p>
                            </div>
                            <div className="text-center border-x">
                              <p className="text-lg font-bold text-secondary">
                                {lastReport?.visitors || 0}
                              </p>
                              <p className="text-xs text-muted-foreground">Visitantes</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-info">
                                {lastReport?.conversions || 0}
                              </p>
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

          {/* Reports Overview Tab */}
          <TabsContent value="reports" className="mt-6">
            <CellReportsOverview
              cells={cells}
              reports={reports}
              getMemberName={getMemberName}
            />
          </TabsContent>

          {/* Leader Pillars Tab */}
          {pillarsCell && churchId && (
            <TabsContent value="pillars" className="mt-6">
              <CellLeaderPillars cell={pillarsCell} churchId={churchId} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Cell Modal */}
      <CellModal
        open={cellModalOpen}
        onOpenChange={handleCloseCellModal}
        cell={editingCell}
        members={members}
        onSubmit={editingCell ? handleUpdateCell : handleCreateCell}
      />

      {/* Cell Report Modal with Attendance */}
      <CellReportWithAttendanceModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        cells={cells}
        defaultCellId={selectedCellId}
        onSubmit={handleCreateReport}
      />

      {/* Cell Members Modal */}
      {selectedCell && (
        <CellMembersModal
          open={membersModalOpen}
          onOpenChange={setMembersModalOpen}
          cell={selectedCell}
          churchMembers={members}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        open={!!deletingCell}
        onOpenChange={(open) => !open && setDeletingCell(null)}
        title="Excluir Célula"
        description={`Tem certeza que deseja excluir "${deletingCell?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteCell(deletingCell!.id)}
      />
    </AppLayout>
  );
}
