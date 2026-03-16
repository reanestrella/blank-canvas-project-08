import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Users, UserCheck, UserPlus, Heart, Loader2, MoreHorizontal,
  Phone, Mail, AlertTriangle, Eye, Droplets, MessageSquare, Clock,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useConsolidation, ConsolidationRecord } from "@/hooks/useConsolidation";
import { useMembers } from "@/hooks/useMembers";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";
import { FinancialFilters, PeriodMode } from "@/components/financial/FinancialFilters";

const statusConfig: Record<ConsolidationRecord["status"], { label: string; color: string }> = {
  contato: { label: "Contato Inicial", color: "bg-info/20 text-info" },
  acompanhamento: { label: "Em Acompanhamento", color: "bg-secondary/20 text-secondary" },
  integracao: { label: "Integração", color: "bg-accent/20 text-accent-foreground" },
  concluido: { label: "Concluído", color: "bg-success/20 text-success" },
  desistente: { label: "Desistente", color: "bg-destructive/20 text-destructive" },
};

export default function Consolidacao() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedConsolidatorId, setSelectedConsolidatorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("acompanhamentos");
  const [editingRecord, setEditingRecord] = useState<ConsolidationRecord | null>(null);
  const [editForm, setEditForm] = useState({ consolidator_id: "", notes: "", contact_date: "", first_visit_date: "", cell_integration_date: "" });

  const now = new Date();
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { records, isLoading, createRecord, updateRecord, updateStatus, deleteRecord } = useConsolidation(churchId || undefined);
  const { members } = useMembers(churchId || undefined);

  // Filter records by time period
  const filteredRecords = useMemo(() => {
    if (periodMode === "all") return records;
    return records.filter((r) => {
      const d = new Date(r.contact_date || r.created_at || "");
      if (periodMode === "year") return d.getFullYear() === filterYear;
      return d.getFullYear() === filterYear && d.getMonth() === filterMonth;
    });
  }, [records, periodMode, filterMonth, filterYear]);

  const filteredStats = useMemo(() => ({
    total: filteredRecords.length,
    contato: filteredRecords.filter((r) => r.status === "contato").length,
    acompanhamento: filteredRecords.filter((r) => r.status === "acompanhamento").length,
    integracao: filteredRecords.filter((r) => r.status === "integracao").length,
    concluido: filteredRecords.filter((r) => r.status === "concluido").length,
    desistente: filteredRecords.filter((r) => r.status === "desistente").length,
  }), [filteredRecords]);

  // Funnel: Visitantes → Decididos → Consolidados → Batizados (only)
  const funnelStats = useMemo(() => {
    const activeMembers = members.filter(m => m.is_active);
    return {
      visitantes: activeMembers.filter(m => m.spiritual_status === "visitante").length,
      decididos: activeMembers.filter(m => m.spiritual_status === "novo_convertido").length,
      consolidados: filteredStats.concluido,
      batizados: (() => {
        if (periodMode === "all") return activeMembers.filter(m => m.baptism_date).length;
        return activeMembers.filter(m => {
          if (!m.baptism_date) return false;
          const bd = new Date(m.baptism_date);
          if (periodMode === "year") return bd.getFullYear() === filterYear;
          return bd.getFullYear() === filterYear && bd.getMonth() === filterMonth;
        }).length;
      })(),
    };
  }, [members, filteredStats, periodMode, filterMonth, filterYear]);

  // Visitors registered in Secretaria (spiritual_status === "visitante")
  const visitors = useMemo(() => {
    const visitantes = members.filter(m => m.is_active && m.spiritual_status === "visitante");
    if (periodMode === "all") return visitantes;
    return visitantes.filter(m => {
      const d = new Date(m.created_at || "");
      if (periodMode === "year") return d.getFullYear() === filterYear;
      return d.getFullYear() === filterYear && d.getMonth() === filterMonth;
    });
  }, [members, periodMode, filterMonth, filterYear]);

  // Calculate follow-up status for each visitor
  const getVisitorFollowUp = (member: typeof members[0]) => {
    const createdAt = new Date(member.created_at || "");
    const nowMs = Date.now();
    const diffDays = Math.floor((nowMs - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if there's a consolidation record for this visitor
    const hasConsolidation = records.some(r => r.member_id === member.id);
    
    const steps = {
      visita: true, // always true, they were registered
      mensagem1dia: diffDays >= 1,
      followUp: hasConsolidation,
    };

    return { diffDays, steps, hasConsolidation };
  };

  const handleAddConsolidation = async () => {
    if (!selectedMemberId) return;
    await createRecord({
      member_id: selectedMemberId,
      consolidator_id: selectedConsolidatorId || undefined,
      status: "contato",
      contact_date: new Date().toISOString().split("T")[0],
    });
    setSelectedMemberId(null);
    setSelectedConsolidatorId(null);
    setShowAddForm(false);
  };

  const handleStartConsolidation = async (memberId: string) => {
    await createRecord({
      member_id: memberId,
      status: "contato",
      contact_date: new Date().toISOString().split("T")[0],
    });
  };

  const handleEditRecord = (record: ConsolidationRecord) => {
    setEditingRecord(record);
    setEditForm({
      consolidator_id: record.consolidator_id || "",
      notes: record.notes || "",
      contact_date: record.contact_date || "",
      first_visit_date: record.first_visit_date || "",
      cell_integration_date: record.cell_integration_date || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    await updateRecord(editingRecord.id, {
      consolidator_id: editForm.consolidator_id || undefined,
      notes: editForm.notes || undefined,
      contact_date: editForm.contact_date || undefined,
    } as any);
    setEditingRecord(null);
  };

  if (!churchId) return null;

  const funnelSteps = [
    { label: "Visitantes", value: funnelStats.visitantes, icon: Eye, color: "bg-muted text-muted-foreground" },
    { label: "Decididos", value: funnelStats.decididos, icon: Heart, color: "bg-success/20 text-success" },
    { label: "Consolidados", value: funnelStats.consolidados, icon: UserCheck, color: "bg-primary/20 text-primary" },
    { label: "Batizados", value: funnelStats.batizados, icon: Droplets, color: "bg-info/20 text-info" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Central de Consolidação</h1>
            <p className="text-muted-foreground">
              Acompanhamento de novos convertidos e visitantes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FinancialFilters
              mode={periodMode}
              month={filterMonth}
              year={filterYear}
              onModeChange={setPeriodMode}
              onMonthChange={setFilterMonth}
              onYearChange={setFilterYear}
            />
          </div>
        </div>

        {/* Funnel - 4 items only */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {funnelSteps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.label}>
                <CardContent className="p-4 text-center">
                  <div className={`inline-flex p-2 rounded-lg mb-2 ${step.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold">{step.value}</p>
                  <p className="text-xs text-muted-foreground">{step.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="acompanhamentos">
              Acompanhamentos ({filteredStats.total})
            </TabsTrigger>
            <TabsTrigger value="visitantes">
              Visitantes ({visitors.length})
            </TabsTrigger>
          </TabsList>

          {/* Acompanhamentos Tab */}
          <TabsContent value="acompanhamentos" className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{filteredStats.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-info/10">
                      <Phone className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{filteredStats.contato}</p>
                      <p className="text-xs text-muted-foreground">Contato</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Heart className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{filteredStats.acompanhamento}</p>
                      <p className="text-xs text-muted-foreground">Acompanhando</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <UserCheck className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{filteredStats.concluido}</p>
                      <p className="text-xs text-muted-foreground">Concluídos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{filteredStats.desistente}</p>
                      <p className="text-xs text-muted-foreground">Desistentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Add button */}
            <div className="flex justify-end">
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Consolidação
              </Button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nova Consolidação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Novo Convertido/Visitante *</label>
                      <MemberAutocomplete
                        churchId={churchId}
                        value={selectedMemberId || undefined}
                        onChange={setSelectedMemberId}
                        placeholder="Selecione a pessoa..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Consolidador</label>
                      <MemberAutocomplete
                        churchId={churchId}
                        value={selectedConsolidatorId || undefined}
                        onChange={setSelectedConsolidatorId}
                        placeholder="Quem vai acompanhar..."
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button onClick={handleAddConsolidation} disabled={!selectedMemberId}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Iniciar
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Records Table */}
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma consolidação neste período</h3>
                    <p className="text-muted-foreground mb-4">
                      Inicie o acompanhamento de novos convertidos.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pessoa</TableHead>
                        <TableHead className="hidden md:table-cell">Contato</TableHead>
                        <TableHead className="hidden md:table-cell">Consolidador</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Data Contato</TableHead>
                        <TableHead className="hidden md:table-cell">Visitas</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {record.member?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{record.member?.full_name || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-col gap-1">
                              {record.member?.phone && (
                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="w-3 h-3" /> {record.member.phone}
                                </span>
                              )}
                              {record.member?.email && (
                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Mail className="w-3 h-3" /> {record.member.email}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{record.consolidator?.full_name || "—"}</TableCell>
                          <TableCell>
                            <Select
                              value={record.status}
                              onValueChange={(value: ConsolidationRecord["status"]) => updateStatus(record.id, value)}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue>
                                  <Badge className={statusConfig[record.status].color}>
                                    {statusConfig[record.status].label}
                                  </Badge>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusConfig).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {record.contact_date ? new Date(record.contact_date).toLocaleDateString("pt-BR") : "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-sm font-medium">{(record as any).visit_count || 1}x</span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditRecord(record)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRegisterReturn(record)}>
                                  <Eye className="w-4 h-4 mr-2" /> Registrar Retorno
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteRecord(record.id)}>
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visitantes Tab */}
          <TabsContent value="visitantes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Visitantes Cadastrados na Secretaria
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : visitors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Eye className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum visitante neste período</h3>
                    <p className="text-muted-foreground">
                      Cadastre visitantes na Secretaria para acompanhá-los aqui.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitante</TableHead>
                        <TableHead className="hidden md:table-cell">Contato</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead>Fluxo</TableHead>
                        <TableHead className="w-[120px]">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitors.map((visitor) => {
                        const followUp = getVisitorFollowUp(visitor);
                        return (
                          <TableRow key={visitor.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                    {visitor.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{visitor.full_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex flex-col gap-1">
                                {visitor.phone && (
                                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Phone className="w-3 h-3" /> {visitor.phone}
                                  </span>
                                )}
                                {visitor.email && (
                                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Mail className="w-3 h-3" /> {visitor.email}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {new Date(visitor.created_at || "").toLocaleDateString("pt-BR")}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {followUp.diffDays === 0 ? "Hoje" : `Há ${followUp.diffDays} dia${followUp.diffDays > 1 ? "s" : ""}`}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {/* Step 1: Visita */}
                                <div className="flex items-center gap-1" title="Visita registrada">
                                  <CheckCircle2 className="w-4 h-4 text-success" />
                                  <span className="text-xs hidden lg:inline">Visita</span>
                                </div>
                                <span className="text-muted-foreground">→</span>
                                {/* Step 2: Mensagem 1 dia */}
                                <div className="flex items-center gap-1" title={followUp.steps.mensagem1dia ? "Pronto para contato (1+ dia)" : "Aguardando 1 dia"}>
                                  {followUp.steps.mensagem1dia ? (
                                    <MessageSquare className="w-4 h-4 text-info" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  <span className="text-xs hidden lg:inline">Msg 1d</span>
                                </div>
                                <span className="text-muted-foreground">→</span>
                                {/* Step 3: Follow-up / Consolidação */}
                                <div className="flex items-center gap-1" title={followUp.hasConsolidation ? "Em consolidação" : "Aguardando consolidação"}>
                                  {followUp.hasConsolidation ? (
                                    <UserCheck className="w-4 h-4 text-success" />
                                  ) : (
                                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  <span className="text-xs hidden lg:inline">Consolidação</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {!followUp.hasConsolidation ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStartConsolidation(visitor.id)}
                                >
                                  <UserPlus className="w-3 h-3 mr-1" />
                                  Iniciar
                                </Button>
                              ) : (
                                <Badge className="bg-success/20 text-success">
                                  Em andamento
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        <Dialog open={!!editingRecord} onOpenChange={open => !open && setEditingRecord(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Consolidação - {editingRecord?.member?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Consolidador</Label>
                <MemberAutocomplete
                  churchId={churchId}
                  value={editForm.consolidator_id || undefined}
                  onChange={v => setEditForm(f => ({ ...f, consolidator_id: v || "" }))}
                  placeholder="Quem vai acompanhar..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Contato</Label>
                  <Input type="date" value={editForm.contact_date} onChange={e => setEditForm(f => ({ ...f, contact_date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Primeira Visita</Label>
                  <Input type="date" value={editForm.first_visit_date} onChange={e => setEditForm(f => ({ ...f, first_visit_date: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRecord(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
