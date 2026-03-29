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
  Phone, Mail, Eye, Droplets, Send, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useConsolidation, ConsolidationRecord } from "@/hooks/useConsolidation";
import { useMembers } from "@/hooks/useMembers";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";
import { FinancialFilters, PeriodMode } from "@/components/financial/FinancialFilters";

const statusConfig: Record<string, { label: string; color: string }> = {
  contato: { label: "Contato Realizado", color: "bg-info/20 text-info" },
  acompanhamento: { label: "Em Consolidação", color: "bg-secondary/20 text-secondary" },
  concluido: { label: "Consolidado", color: "bg-success/20 text-success" },
  desistente: { label: "Desistente", color: "bg-destructive/20 text-destructive" },
};

export default function Consolidacao() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedConsolidatorId, setSelectedConsolidatorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("visitantes");
  const [editingRecord, setEditingRecord] = useState<ConsolidationRecord | null>(null);
  const [editForm, setEditForm] = useState({ consolidator_id: "", notes: "", contact_date: "", status: "" });
  const [editingVisitor, setEditingVisitor] = useState<any>(null);
  const [newVisitorStatus, setNewVisitorStatus] = useState<string>("");

  const now = new Date();
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { records, isLoading, createRecord, updateRecord, updateStatus, deleteRecord } = useConsolidation(churchId || undefined);
  const { members, updateMember } = useMembers(churchId || undefined);

  // Filter records by time period
  const filteredRecords = useMemo(() => {
    if (periodMode === "all") return records;
    return records.filter((r) => {
      const d = new Date(r.contact_date || r.created_at || "");
      if (periodMode === "year") return d.getFullYear() === filterYear;
      return d.getFullYear() === filterYear && d.getMonth() === filterMonth;
    });
  }, [records, periodMode, filterMonth, filterYear]);

  // Visitors = members with spiritual_status "visitante" (tab 1)
  const visitors = useMemo(() => {
    const visitantes = members.filter(m => m.is_active && m.spiritual_status === "visitante");
    if (periodMode === "all") return visitantes;
    return visitantes.filter(m => {
      const d = new Date(m.created_at || "");
      if (periodMode === "year") return d.getFullYear() === filterYear;
      return d.getFullYear() === filterYear && d.getMonth() === filterMonth;
    });
  }, [members, periodMode, filterMonth, filterYear]);

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );

  // Em Consolidação = only new converts with status "acompanhamento" (tab 2)
  const emConsolidacao = useMemo(() =>
    filteredRecords.filter((record) => {
      const member = memberById.get(record.member_id);
      return record.status === "acompanhamento" && member?.spiritual_status === "novo_convertido";
    }),
  [filteredRecords, memberById]);

  // Consolidados = records with status "concluido" (tab 3)
  const consolidados = useMemo(() =>
    filteredRecords.filter(r => r.status === "concluido"),
  [filteredRecords]);

  // Check if visitor has a consolidation contact
  const getVisitorFollowUp = (member: typeof members[0]) => {
    const hasConsolidation = records.some(r => r.member_id === member.id);
    const createdAt = new Date(member.created_at || "");
    const diffDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return { diffDays, hasConsolidation };
  };

  // Iniciar contato para visitante
  const handleStartContact = async (memberId: string) => {
    await createRecord({
      member_id: memberId,
      status: "contato" as any,
      contact_date: new Date().toISOString().split("T")[0],
    });
    setActiveTab("visitantes");
  };

  // Converter visitante para novo convertido → vai para aba "Em Consolidação"
  const handleConvertToNewConvert = async (member: any) => {
    await updateMember(member.id, { spiritual_status: "novo_convertido" } as any);
    // Also create/update consolidation record with status "acompanhamento"
    const existingRecord = records.find(r => r.member_id === member.id);
    if (existingRecord) {
      await updateStatus(existingRecord.id, "acompanhamento" as any);
    } else {
      await createRecord({
        member_id: member.id,
        status: "acompanhamento" as any,
        contact_date: new Date().toISOString().split("T")[0],
      });
    }
    setEditingVisitor(null);
  };

  // Nova consolidação direta
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
      status: record.status,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    await updateRecord(editingRecord.id, {
      consolidator_id: editForm.consolidator_id || undefined,
      notes: editForm.notes || undefined,
      contact_date: editForm.contact_date || undefined,
    } as any);
    if (editForm.status !== editingRecord.status) {
      await updateStatus(editingRecord.id, editForm.status as any);
    }
    setEditingRecord(null);
  };

  if (!churchId) return null;

  // Stats
  const funnelSteps = [
    { label: "Visitantes", value: visitors.length, icon: Eye, color: "bg-muted text-muted-foreground" },
    { label: "Em Consolidação", value: emConsolidacao.length, icon: UserCheck, color: "bg-secondary/20 text-secondary" },
    { label: "Consolidados", value: consolidados.length, icon: Heart, color: "bg-success/20 text-success" },
    { label: "Batizados", value: members.filter(m => m.is_active && (m as any).is_baptized).length, icon: Droplets, color: "bg-info/20 text-info" },
  ];

  const renderRecordsTable = (recs: ConsolidationRecord[], showActions: boolean = true) => (
    <Card>
      <CardContent className="p-0">
        {recs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum registro</h3>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pessoa</TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead className="hidden md:table-cell">Consolidador</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                {showActions && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recs.map((record) => {
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
                        {record.member?.phone && <span className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" />{record.member.phone}</span>}
                        {record.member?.email && <span className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" />{record.member.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {record.consolidator?.full_name || "—"}
                    </TableCell>
                    <TableCell><Badge className={cfg.color}>{cfg.label}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {record.contact_date ? new Date(record.contact_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    {showActions && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditRecord(record)}>Editar</DropdownMenuItem>
                            {record.status === "acompanhamento" && (
                              <DropdownMenuItem onClick={() => updateStatus(record.id, "concluido" as any)}>
                                ✅ Marcar como Consolidado
                              </DropdownMenuItem>
                            )}
                            {record.status === "contato" && (
                              <DropdownMenuItem onClick={() => updateStatus(record.id, "acompanhamento" as any)}>
                                Mover para Consolidação
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => updateStatus(record.id, "desistente" as any)}>
                              Marcar Desistente
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteRecord(record.id)}>
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Central de Consolidação</h1>
            <p className="text-muted-foreground">Acompanhamento de visitantes e novos convertidos</p>
          </div>
          <FinancialFilters mode={periodMode} month={filterMonth} year={filterYear} onModeChange={setPeriodMode} onMonthChange={setFilterMonth} onYearChange={setFilterYear} />
        </div>

        {/* Funnel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {funnelSteps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.label}>
                <CardContent className="p-4 text-center">
                  <div className={`inline-flex p-2 rounded-lg mb-2 ${step.color}`}><Icon className="w-5 h-5" /></div>
                  <p className="text-2xl font-bold">{step.value}</p>
                  <p className="text-xs text-muted-foreground">{step.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs: 3 abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="visitantes">Visitantes ({visitors.length})</TabsTrigger>
            <TabsTrigger value="consolidacao">Em Consolidação ({emConsolidacao.length})</TabsTrigger>
            <TabsTrigger value="consolidados">Consolidados ({consolidados.length})</TabsTrigger>
          </TabsList>

          {/* Tab 1: Visitantes */}
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
                        <TableHead className="w-[200px]">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitors.map((visitor) => {
                        const { diffDays, hasConsolidation } = getVisitorFollowUp(visitor);
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
                                <Badge variant="default" className="text-[10px] py-0 h-4">Visita</Badge>
                                {hasConsolidation && <Badge variant="default" className="text-[10px] py-0 h-4 bg-info/80">Contatado</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {!hasConsolidation && (
                                  <Button size="sm" variant="outline" onClick={() => handleStartContact(visitor.id)}>
                                    <Send className="w-3 h-3 mr-1" /> Contato
                                  </Button>
                                )}
                                <Button size="sm" variant="default" onClick={() => { setEditingVisitor(visitor); setNewVisitorStatus("novo_convertido"); }}>
                                  <Heart className="w-3 h-3 mr-1" /> Novo Convertido
                                </Button>
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

          {/* Tab 2: Em Consolidação */}
          <TabsContent value="consolidacao" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" /> Nova Consolidação
              </Button>
            </div>

            {showAddForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nova Consolidação</CardTitle>
                  <p className="text-xs text-muted-foreground">Adicione um novo convertido ao acompanhamento</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Pessoa *</label>
                      <MemberAutocomplete churchId={churchId} value={selectedMemberId || undefined} onChange={setSelectedMemberId} placeholder="Selecione..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Consolidador</label>
                      <MemberAutocomplete churchId={churchId} value={selectedConsolidatorId || undefined} onChange={setSelectedConsolidatorId} placeholder="Quem vai acompanhar..." />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button onClick={handleStartConsolidation} disabled={!selectedMemberId}><UserPlus className="w-4 h-4 mr-2" /> Iniciar</Button>
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancelar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {renderRecordsTable(emConsolidacao)}
          </TabsContent>

          {/* Tab 3: Consolidados */}
          <TabsContent value="consolidados" className="space-y-4">
            {renderRecordsTable(consolidados, false)}
          </TabsContent>
        </Tabs>

        {/* Edit Record Modal */}
        <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Acompanhamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contato">Contato Realizado</SelectItem>
                    <SelectItem value="acompanhamento">Em Consolidação</SelectItem>
                    <SelectItem value="concluido">Consolidado</SelectItem>
                    <SelectItem value="desistente">Desistente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Consolidador</Label>
                <MemberAutocomplete churchId={churchId} value={editForm.consolidator_id || undefined} onChange={(id) => setEditForm(f => ({ ...f, consolidator_id: id || "" }))} placeholder="Selecione..." />
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

        {/* Convert visitor to new convert */}
        <Dialog open={!!editingVisitor} onOpenChange={(open) => !open && setEditingVisitor(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Converter para Novo Convertido</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              Ao confirmar, <strong>{editingVisitor?.full_name}</strong> será marcado como novo convertido e movido para a aba "Em Consolidação".
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingVisitor(null)}>Cancelar</Button>
              <Button onClick={() => handleConvertToNewConvert(editingVisitor)}>
                <Heart className="w-4 h-4 mr-2" /> Confirmar Decisão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
