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
  CheckCircle2, Send,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useConsolidation, ConsolidationRecord } from "@/hooks/useConsolidation";
import { useMembers } from "@/hooks/useMembers";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";
import { FinancialFilters, PeriodMode } from "@/components/financial/FinancialFilters";

// Status config agora com separação clara:
// contato_inicial = apenas mensagem enviada (NÃO é consolidação)
// em_consolidacao = após decisão por Jesus
const statusConfig: Record<string, { label: string; color: string }> = {
  contato_inicial: { label: "Contato Inicial", color: "bg-muted text-muted-foreground" },
  contato: { label: "Contato Inicial", color: "bg-info/20 text-info" },
  acompanhamento: { label: "Em Consolidação", color: "bg-secondary/20 text-secondary" },
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

  // Separate: contato_inicial/contato = NOT consolidation, acompanhamento+ = consolidation
  const contatosRealizados = useMemo(() => 
    filteredRecords.filter(r => r.status === "contato" || (r.status as string) === "contato_inicial").length,
  [filteredRecords]);

  const emConsolidacao = useMemo(() =>
    filteredRecords.filter(r => r.status === "acompanhamento").length,
  [filteredRecords]);

  const filteredStats = useMemo(() => ({
    total: filteredRecords.length,
    contatos: contatosRealizados,
    emConsolidacao,
    integracao: filteredRecords.filter((r) => r.status === "integracao").length,
    concluido: filteredRecords.filter((r) => r.status === "concluido").length,
    desistente: filteredRecords.filter((r) => r.status === "desistente").length,
  }), [filteredRecords, contatosRealizados, emConsolidacao]);

  // Funnel: Visitantes → Decididos → Consolidados → Batizados
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
    const hasConsolidation = records.some(r => r.member_id === member.id);
    const steps = {
      visita: true,
      mensagem1dia: diffDays >= 1,
      followUp: hasConsolidation,
    };
    return { diffDays, steps, hasConsolidation };
  };

  // Iniciar contato = status "contato" (NÃO é consolidação)
  const handleStartContact = async (memberId: string) => {
    await createRecord({
      member_id: memberId,
      status: "contato" as any,
      contact_date: new Date().toISOString().split("T")[0],
    });
  };

  // Iniciar consolidação = após decisão, status "acompanhamento"
  const handleStartConsolidation = async () => {
    if (!selectedMemberId) return;
    await createRecord({
      member_id: selectedMemberId,
      consolidator_id: selectedConsolidatorId || undefined,
      status: "acompanhamento" as any,
      contact_date: new Date().toISOString().split("T")[0],
    });
    setSelectedMemberId(null);
    setSelectedConsolidatorId(null);
    setShowAddForm(false);
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

  const handleRegisterReturn = async (record: ConsolidationRecord) => {
    const currentCount = (record as any).visit_count || 1;
    const today = new Date().toISOString().split("T")[0];
    await updateRecord(record.id, {
      visit_count: currentCount + 1,
      last_visit_date: today,
      notes: `${record.notes || ""}\n[${today}] Retorno registrado (visita #${currentCount + 1})`.trim(),
    } as any);
  };

  if (!churchId) return null;

  const funnelSteps = [
    { label: "Visitantes", value: funnelStats.visitantes, icon: Eye, color: "bg-muted text-muted-foreground" },
    { label: "Contatos", value: contatosRealizados, icon: Send, color: "bg-info/20 text-info" },
    { label: "Decididos", value: funnelStats.decididos, icon: Heart, color: "bg-success/20 text-success" },
    { label: "Em Consolidação", value: emConsolidacao, icon: UserCheck, color: "bg-secondary/20 text-secondary" },
    { label: "Consolidados", value: filteredStats.concluido, icon: UserCheck, color: "bg-primary/20 text-primary" },
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

        {/* Funnel - 6 items */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
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
            {/* Add button */}
            <div className="flex justify-end">
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Consolidação (após decisão)
              </Button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nova Consolidação</CardTitle>
                  <p className="text-xs text-muted-foreground">⚠️ Só inicie consolidação após decisão por Jesus (novo convertido)</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Novo Convertido *</label>
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
                      <Button onClick={handleStartConsolidation} disabled={!selectedMemberId}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Iniciar Consolidação
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
                    <h3 className="text-lg font-medium">Nenhum registro neste período</h3>
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
                      {filteredRecords.map((record) => {
                        const cfg = statusConfig[record.status] || { label: record.status, color: "" };
                        return (
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
                                  <span className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" />{record.member.phone}</span>
                                )}
                                {record.member?.email && (
                                  <span className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" />{record.member.email}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm">
                              {record.consolidator?.full_name || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge className={cfg.color}>{cfg.label}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm">
                              {record.contact_date ? new Date(record.contact_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm">
                              {(record as any).visit_count || 1}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {(record.status === "contato" || (record.status as string) === "contato_inicial") && (
                                    <DropdownMenuItem onClick={() => updateStatus(record.id, "acompanhamento" as any)}>
                                      ✅ Iniciar Consolidação (decisão)
                                    </DropdownMenuItem>
                                  )}
                                  {record.status === "acompanhamento" && (
                                    <DropdownMenuItem onClick={() => updateStatus(record.id, "integracao" as any)}>
                                      Promover para Integração
                                    </DropdownMenuItem>
                                  )}
                                  {record.status === "integracao" && (
                                    <DropdownMenuItem onClick={() => updateStatus(record.id, "concluido" as any)}>
                                      Marcar como Concluído
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleRegisterReturn(record)}>
                                    🔄 Registrar Retorno
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditRecord(record)}>
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStatus(record.id, "desistente" as any)}>
                                    Marcar Desistente
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => deleteRecord(record.id)}>
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

          {/* Visitantes Tab */}
          <TabsContent value="visitantes" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {visitors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Eye className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum visitante neste período</h3>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitante</TableHead>
                        <TableHead className="hidden md:table-cell">Contato</TableHead>
                        <TableHead>Acompanhamento</TableHead>
                        <TableHead className="w-[150px]">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitors.map((visitor) => {
                        const { diffDays, steps, hasConsolidation } = getVisitorFollowUp(visitor);
                        return (
                          <TableRow key={visitor.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                    {visitor.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="font-medium text-sm">{visitor.full_name}</span>
                                  <p className="text-xs text-muted-foreground">{diffDays}d atrás</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex flex-col gap-0.5">
                                {visitor.phone && <span className="text-xs">{visitor.phone}</span>}
                                {visitor.email && <span className="text-xs text-muted-foreground">{visitor.email}</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Badge variant={steps.visita ? "default" : "outline"} className="text-[10px] py-0 h-4">Visita</Badge>
                                {hasConsolidation && <Badge variant="default" className="text-[10px] py-0 h-4 bg-info/80">Contatado</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {!hasConsolidation && (
                                  <Button size="sm" variant="outline" onClick={() => handleStartContact(visitor.id)}>
                                    <Send className="w-3 h-3 mr-1" /> Iniciar Contato
                                  </Button>
                                )}
                                {hasConsolidation && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Contato realizado
                                  </Badge>
                                )}
                              </div>
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
        <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Acompanhamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Consolidador</Label>
                <MemberAutocomplete
                  churchId={churchId}
                  value={editForm.consolidator_id || undefined}
                  onChange={(id) => setEditForm(f => ({ ...f, consolidator_id: id || "" }))}
                  placeholder="Selecione..."
                />
              </div>
              <div className="space-y-2">
                <Label>Data do Contato</Label>
                <Input type="date" value={editForm.contact_date} onChange={e => setEditForm(f => ({ ...f, contact_date: e.target.value }))} />
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
