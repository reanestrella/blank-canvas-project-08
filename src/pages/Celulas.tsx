import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

interface StatusConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

const statusConfig: StatusConfig = {
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

// Offering Account Selector with persist + "Alterar" pattern
function OfferingAccountSelector({
  accounts,
  offeringAccountId,
  settingsLoaded,
  onAccountChange,
}: {
  accounts: { id: string; name: string }[];
  offeringAccountId: string;
  settingsLoaded: boolean;
  onAccountChange: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const selectedAccount = accounts.find(a => a.id === offeringAccountId);
  const hasSaved = !!selectedAccount && settingsLoaded;

  if (!settingsLoaded) return null;

  if (hasSaved && !editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Conta p/ Ofertas:</span>
        <Badge variant="outline" className="text-sm py-1 px-3">{selectedAccount.name}</Badge>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Alterar</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Conta p/ Ofertas:</span>
      <Select value={offeringAccountId} onValueChange={(v) => { onAccountChange(v); setEditing(false); }}>
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
      {hasSaved && <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>}
    </div>
  );
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
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { profile, hasRole, user } = useAuth();
  const { toast } = useToast();
  const churchId = profile?.church_id;

  const isOnlyCellLeader = hasRole("lider_celula") && !hasRole("pastor");
  const leaderUserId = isOnlyCellLeader ? (user?.id ?? null) : undefined;

  const { cells, reports, isLoading, createCell, updateCell, deleteCell, createReport, updateReport, fetchReports } = useCells(churchId || undefined, leaderUserId);
  const { members } = useMembers(churchId || undefined);
  const { accounts } = useFinancialAccounts(churchId || undefined);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  // ======= BUG #4 FIX: Load persisted offering account from church_settings =======
  useEffect(() => {
    if (!churchId) return;
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from("church_settings" as any)
        .select("cell_offering_account_id")
        .eq("church_id", churchId)
        .maybeSingle();
      
      if (data && (data as any).cell_offering_account_id) {
        setOfferingAccountId((data as any).cell_offering_account_id);
        console.log("[Celulas] Loaded persisted offering account:", (data as any).cell_offering_account_id);
      }
      setSettingsLoaded(true);
    };
    loadSettings();
  }, [churchId]);

  // Persist offering account selection
  const handleOfferingAccountChange = async (value: string) => {
    setOfferingAccountId(value);
    if (!churchId) return;

    try {
      const accountIdValue = value === "none" ? null : value;
      const { error } = await supabase
        .from("church_settings" as any)
        .upsert(
          { church_id: churchId, cell_offering_account_id: accountIdValue, updated_at: new Date().toISOString() } as any,
          { onConflict: "church_id" }
        );
      
      if (error) {
        console.error("[Celulas] Error saving offering account:", error);
        toast({ title: "Erro", description: "Não foi possível salvar a conta de ofertas.", variant: "destructive" });
      } else {
        console.log("[Celulas] Offering account persisted:", accountIdValue);
        toast({ title: "Salvo", description: "Conta de ofertas atualizada." });
      }
    } catch (err) {
      console.error("[Celulas] Error persisting offering account:", err);
    }
  };

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
    if (!memberId) return "Sem líder";
    const member = members.find(m => m.id === memberId);
    return member?.full_name || "Desconhecido";
  };

  const filteredReports = useMemo(() => {
    if (selectedMonth === "all") return reports;
    return reports.filter(r => r.report_date.startsWith(selectedMonth));
  }, [reports, selectedMonth]);

  const totalAttendance = filteredReports.reduce((sum, r) => sum + r.attendance, 0);
  const totalVisitors = filteredReports.reduce((sum, r) => sum + r.visitors, 0);
  const totalConversions = filteredReports.reduce((sum, r) => sum + r.conversions, 0);
  const totalOffering = filteredReports.reduce((sum, r) => sum + (r.offering || 0), 0);
  const avgAttendance = filteredReports.length > 0 ? Math.round(totalAttendance / filteredReports.length) : 0;

  // For cell leader stats
  const leaderCells = cells;
  const leaderReports = filteredReports;
  const leaderStats = [
    { label: "Células", value: leaderCells.length, icon: Grid3X3, color: "text-primary" },
    { label: "Relatórios", value: leaderReports.length, icon: FileText, color: "text-info" },
    { label: "Presença Média", value: avgAttendance, icon: Users, color: "text-success" },
    { label: "Visitantes", value: totalVisitors, icon: UserPlus, color: "text-secondary" },
    { label: "Conversões", value: totalConversions, icon: Heart, color: "text-destructive" },
  ];

  const handleCreateCell = async (data: Partial<Cell>) => {
    if (!churchId) return { data: null, error: new Error("Igreja não identificada") };
    const createData: CreateCellData & { church_id: string } = {
      name: data.name || "",
      leader_id: data.leader_id || undefined,
      address: data.address || undefined,
      day_of_week: data.day_of_week || undefined,
      time: data.time || undefined,
      network: data.network || undefined,
      church_id: churchId,
    };
    return createCell(createData);
  };

  const handleUpdateCell = async (data: Partial<Cell>) => {
    if (!editingCell) return { data: null, error: new Error("No cell to edit") };
    return updateCell(editingCell.id, data);
  };

  // Register offering as financial transaction
  const registerOfferingTransaction = async (cellId: string, amount: number, reportDate: string) => {
    if (!churchId || !offeringAccountId || offeringAccountId === "none" || amount <= 0) return;
    const cellName = cells.find(c => c.id === cellId)?.name || "Célula";
    try {
      console.log("[Celulas] Registering offering transaction:", { cellId, amount, accountId: offeringAccountId });
      const { data: txResult, error: txError } = await supabase.from("financial_transactions").insert([{
        church_id: churchId,
        type: "receita",
        description: `Oferta - ${cellName}`,
        amount,
        transaction_date: reportDate,
        account_id: offeringAccountId,
        created_by: user?.id,
      }]).select("id, account_id").single();
      
      if (txError) {
        console.error("[Celulas] Error inserting offering transaction:", txError);
        toast({ title: "Erro", description: "Oferta não foi registrada na conta: " + txError.message, variant: "destructive" });
      } else {
        console.log("[Celulas] Offering registered OK — id:", txResult?.id, "account_id:", txResult?.account_id);
        toast({ title: "Oferta registrada", description: `R$ ${amount.toFixed(2)} → ${cellName} (account: ${txResult?.account_id})` });
      }
    } catch (err) {
      console.error("[Celulas] Error registering offering:", err);
    }
  };

  const handleCreateReport = async (data: CreateCellReportData) => {
    const result = await createReport(data);
    if (!result.error) {
      // Register offering as transaction if account is set
      if (data.offering && data.offering > 0 && offeringAccountId && offeringAccountId !== "none") {
        await registerOfferingTransaction(data.cell_id, data.offering, data.report_date);
      }
      fetchReports();
    }
    return result;
  };

  const handleOpenEdit = (cell: Cell) => {
    setEditingCell(cell);
    setCellModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setCellModalOpen(open);
    if (!open) setEditingCell(undefined);
  };

  const stats = [
    { label: "Células Ativas", value: cells.filter(c => c.is_active).length, icon: Grid3X3, color: "text-primary" },
    { label: "Total de Células", value: cells.length, icon: BarChart3, color: "text-info" },
    { label: "Relatórios", value: filteredReports.length, icon: FileText, color: "text-success" },
    { label: "Presença Média", value: avgAttendance, icon: Users, color: "text-secondary" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Células</h1>
            <p className="text-muted-foreground">Gerencie suas células e relatórios</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isOnlyCellLeader && (
              <Button className="gradient-accent text-secondary-foreground" onClick={() => { setEditingCell(undefined); setCellModalOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />Nova Célula
              </Button>
            )}
            <Button variant="outline" onClick={() => { setReportModalOpen(true); }}>
              <FileText className="w-4 h-4 mr-2" />Novo Relatório
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Mês:</span>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os meses" />
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
            <OfferingAccountSelector
              accounts={accounts}
              offeringAccountId={offeringAccountId}
              settingsLoaded={settingsLoaded}
              onAccountChange={handleOfferingAccountChange}
            />
          )}
        </div>

        {/* Cell Leader Dashboard */}
        {isOnlyCellLeader && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {leaderStats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="flex items-center gap-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Stats for admin */}
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

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="cells">Células</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            {isOnlyCellLeader && cells.length > 0 && (
              <TabsTrigger value="tools">Ferramentas do Líder</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="cells" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : cells.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <Grid3X3 className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma célula</h3>
                  <p className="text-muted-foreground mb-4">Comece criando a primeira célula.</p>
                  <Button onClick={() => setCellModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />Criar Célula
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cells.map((cell) => (
                  <Card key={cell.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{cell.name}</h3>
                          {cell.network && <Badge variant="outline" className="mt-1">{cell.network}</Badge>}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(cell)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedCell(cell); setSelectedCellId(cell.id); setMembersModalOpen(true); }}>Membros</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPillarsCell(cell)}>Ferramentas do Líder</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeletingCell(cell)}>Remover</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"><Users className="w-4 h-4" />{getMemberName(cell.leader_id)}</div>
                        {cell.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span className="truncate">{cell.address}</span></div>}
                        {cell.day_of_week && <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{cell.day_of_week}{cell.time ? ` às ${cell.time}` : ""}</div>}
                        <div className="flex items-center gap-2"><Users className="w-4 h-4" />{cellMemberCounts[cell.id] || 0} membros</div>
                      </div>
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <Badge variant={cell.is_active ? "default" : "secondary"}>{cell.is_active ? "Ativa" : "Inativa"}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <CellReportsOverview
              reports={filteredReports}
              cells={cells}
              getMemberName={getMemberName}
              cellMemberCounts={cellMemberCounts}
              onEditReport={setEditingReport}
              isLeader={isOnlyCellLeader}
            />
          </TabsContent>

          {isOnlyCellLeader && cells.length > 0 && (
            <TabsContent value="tools" className="mt-4">
              <div className="space-y-6">
                {cells.map((cell) => (
                  <CellLeaderPillars key={cell.id} cell={cell} churchId={churchId!} />
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <CellModal
        open={cellModalOpen}
        onOpenChange={handleCloseModal}
        cell={editingCell}
        members={members}
        onSubmit={editingCell ? handleUpdateCell : handleCreateCell}
      />

      <CellReportWithAttendanceModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        cells={cells}
        onSubmit={handleCreateReport}
      />

      {selectedCell && (
        <CellMembersModal
          open={membersModalOpen}
          onOpenChange={(open) => { setMembersModalOpen(open); if (!open) { setSelectedCell(null); setSelectedCellId(undefined); } }}
          cell={selectedCell}
          churchMembers={members}
        />
      )}

      {pillarsCell && churchId && (
        <Dialog open={!!pillarsCell} onOpenChange={(open) => !open && setPillarsCell(null)}>
          <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
            <CellLeaderPillars
              cell={pillarsCell}
              churchId={churchId}
            />
          </DialogContent>
        </Dialog>
      )}

      <EditCellReportModal
        open={!!editingReport}
        onOpenChange={(open) => !open && setEditingReport(null)}
        report={editingReport}
        onSubmit={async (id, data) => {
          const result = await updateReport(id, data);
          if (!result.error) fetchReports();
          return result;
        }}
      />

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
