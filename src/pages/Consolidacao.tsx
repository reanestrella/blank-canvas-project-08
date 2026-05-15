import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Users, UserCheck, Heart, MoreHorizontal,
  Phone, Mail, Eye, Droplets, ArrowDown, Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useConsolidation, ConsolidationRecord, ConsolidationStage } from "@/hooks/useConsolidation";
import { useMembers } from "@/hooks/useMembers";
import { useConsolidationAssignees } from "@/hooks/useConsolidationAssignees";
import { logAudit } from "@/lib/audit";
import { FinancialFilters, PeriodMode } from "@/components/financial/FinancialFilters";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisitorContactDashboard } from "@/components/consolidation/VisitorContactDashboard";
import { getConsolidationMetrics } from "@/lib/consolidationMetrics";

const stageConfig: Record<ConsolidationStage, { label: string; color: string }> = {
  visitante:       { label: "Visitante",        color: "bg-chart-visitante text-white" },
  decidido:        { label: "Decidido",         color: "bg-chart-decidido text-white" },
  em_consolidacao: { label: "Em Consolidação",  color: "bg-chart-consolidacao text-white" },
  consolidado:     { label: "Consolidado",      color: "bg-chart-discipulado text-white" },
  batizado:        { label: "Batizado",         color: "bg-chart-batizado text-white" },
};

const today = () => new Date().toISOString().split("T")[0];

type ActionKind = "decidiu" | "iniciar" | "finalizar" | "batizar";

const actionConfig: Record<ActionKind, {
  title: string;
  dateLabel: string;
  nextStage: ConsolidationStage;
  dateField: keyof ConsolidationRecord;
}> = {
  decidiu:    { title: "Registrar Decisão",        dateLabel: "Data da decisão",       nextStage: "decidido",        dateField: "decision_date" },
  iniciar:    { title: "Iniciar Consolidação",     dateLabel: "Data de início",        nextStage: "em_consolidacao", dateField: "consolidation_start_date" },
  finalizar:  { title: "Finalizar Consolidação",   dateLabel: "Data de finalização",   nextStage: "consolidado",     dateField: "consolidation_end_date" },
  batizar:    { title: "Registrar Batismo",        dateLabel: "Data do batismo",       nextStage: "batizado",        dateField: "baptism_date" },
};

export default function Consolidacao() {
  const [activeTab, setActiveTab] = useState("visitantes");
  const [editingRecord, setEditingRecord] = useState<ConsolidationRecord | null>(null);
  const [editVisitor, setEditVisitor] = useState<any>(null);
  const [actionModal, setActiveAction] = useState<{ kind: ActionKind; member: any; record?: ConsolidationRecord; date: string } | null>(null);




  const now = new Date();
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { records, isLoading, createRecord, updateRecord, deleteRecord } = useConsolidation(churchId || undefined);
  const { members, updateMember } = useMembers(churchId || undefined);
  const { byRecord: assigneesByRecord, setAssignees } = useConsolidationAssignees(churchId || undefined);
  const [editAssignees, setEditAssignees] = useState<string[]>([]);

  // Most recent record per member (drives "current stage" of a person)
  const recordByMember = useMemo(() => {
    const map = new Map<string, ConsolidationRecord>();
    for (const r of records) {
      const prev = map.get(r.member_id);
      if (!prev || new Date(r.updated_at) > new Date(prev.updated_at)) map.set(r.member_id, r);
    }
    return map;
  }, [records]);

  const memberById = useMemo(() => new Map(members.map(m => [m.id, m])), [members]);

  // ----- LISTS BY STAGE (não some por mês) -----
  // Visitantes = members.spiritual_status='visitante' E (sem record OU record.stage='visitante')
  const visitorsList = useMemo(() => {
    return members.filter(m => {
      if (!m.is_active || m.spiritual_status !== "visitante") return false;
      const r = recordByMember.get(m.id);
      return !r || r.stage === "visitante";
    });
  }, [members, recordByMember]);

  const recordsByStage = (stage: ConsolidationStage) =>
    Array.from(recordByMember.values()).filter(r => r.stage === stage);

  const decididosList = useMemo(() => recordsByStage("decidido"), [recordByMember]);
  const emConsolidacaoList = useMemo(() => recordsByStage("em_consolidacao"), [recordByMember]);
  const consolidadosList = useMemo(() => recordsByStage("consolidado"), [recordByMember]);
  const batizadosList = useMemo(() => recordsByStage("batizado"), [recordByMember]);

  // Helper local — usado pelo VisitorContactDashboard
  const inPeriod = (dateStr?: string | null) => {
    if (!dateStr) return false;
    if (periodMode === "all") return true;
    const d = new Date(dateStr + "T12:00:00");
    if (periodMode === "year") return d.getFullYear() === filterYear;
    return d.getFullYear() === filterYear && d.getMonth() === filterMonth;
  };

  // ----- DASHBOARD: filter by DATE — usa fonte única -----
  const dashPeople = useMemo(() => {
    const metrics = getConsolidationMetrics(records as any, members as any, {
      periodMode,
      filterMonth,
      filterYear,
    });
    const toPerson = (memberId: string) => {
      const m = memberById.get(memberId) as any;
      const r = records.find(x => x.member_id === memberId);
      return {
        id: memberId,
        full_name: r?.member?.full_name || m?.full_name,
        phone: r?.member?.phone || m?.phone,
        email: r?.member?.email || m?.email,
      };
    };
    return {
      visitantes: Array.from(metrics.visitanteIds).map(toPerson),
      decididos: Array.from(metrics.decididoIds).map(toPerson),
      emConsol: Array.from(metrics.emConsolidacaoIds).map(toPerson),
      consolidados: Array.from(metrics.consolidadoIds).map(toPerson),
      batizados: Array.from(metrics.batizadoIds).map(toPerson),
    };
  }, [members, records, memberById, periodMode, filterMonth, filterYear]);

  const dashCounts = {
    visitantes: dashPeople.visitantes.length,
    decididos: dashPeople.decididos.length,
    emConsol: dashPeople.emConsol.length,
    consolidados: dashPeople.consolidados.length,
    batizados: dashPeople.batizados.length,
  };

  type FunnelKey = "visitantes" | "decididos" | "emConsol" | "consolidados" | "batizados";
  const funnelSteps: Array<{ key: FunnelKey; label: string; value: number; color: string; gradient: string }> = [
    { key: "visitantes",   label: "Visitantes",      value: dashCounts.visitantes,   color: "bg-chart-visitante",    gradient: "from-chart-visitante/20 to-chart-visitante/5" },
    { key: "decididos",    label: "Decidiram",       value: dashCounts.decididos,    color: "bg-chart-decidido",     gradient: "from-chart-decidido/20 to-chart-decidido/5" },
    { key: "emConsol",     label: "Em Consolidação", value: dashCounts.emConsol,     color: "bg-chart-consolidacao", gradient: "from-chart-consolidacao/20 to-chart-consolidacao/5" },
    { key: "consolidados", label: "Consolidados",    value: dashCounts.consolidados, color: "bg-chart-discipulado",  gradient: "from-chart-discipulado/20 to-chart-discipulado/5" },
    { key: "batizados",    label: "Batizados",       value: dashCounts.batizados,    color: "bg-chart-batizado",     gradient: "from-chart-batizado/20 to-chart-batizado/5" },
  ];
  const maxFunnel = Math.max(...funnelSteps.map(s => s.value), 1);
  const [openStage, setOpenStage] = useState<FunnelKey | null>(null);

  // ----- ACTIONS -----
  const openAction = (kind: ActionKind, member: any, record?: ConsolidationRecord) => {
    const cfg = actionConfig[kind];
    const existingDate = record ? (record[cfg.dateField] as string | null) : null;
    setActiveAction({ kind, member, record, date: existingDate || today() });
  };

  const confirmAction = async () => {
    if (!actionModal) return;
    const { kind, member, record, date } = actionModal;
    if (!date) return;
    const cfg = actionConfig[kind];

    const payload: any = {
      stage: cfg.nextStage,
      [cfg.dateField]: date,
    };

    if (record) {
      await updateRecord(record.id, payload);
    } else {
      // Create record. Always carry visit_date (member created_at fallback)
      const memberRow = memberById.get(member.id);
      const visit_date = (memberRow as any)?.created_at?.split("T")[0] || today();
      await createRecord({
        member_id: member.id,
        visit_date,
        ...payload,
      } as any);
    }

    // Sync spiritual_status when relevant
    if (cfg.nextStage === "em_consolidacao" || cfg.nextStage === "consolidado") {
      await updateMember(member.id, { spiritual_status: "novo_convertido" } as any);
    } else if (cfg.nextStage === "batizado") {
      await updateMember(member.id, { spiritual_status: "membro", is_baptized: true, baptism_date: date } as any);
    }

    setActiveAction(null);
  };

  // ----- EDIT FULL RECORD -----
  const openEdit = (r: ConsolidationRecord) => {
    setEditingRecord({ ...r });
    const cur = (assigneesByRecord[r.id] || []).map((a) => a.consolidator_member_id);
    setEditAssignees(cur);
    logAudit({ action: "view", entity_type: "consolidation_record", entity_id: r.id });
  };
  const saveEdit = async () => {
    if (!editingRecord) return;
    const r = editingRecord;
    await updateRecord(r.id, {
      stage: r.stage,
      visit_date: r.visit_date || undefined,
      decision_date: r.decision_date || undefined,
      consolidation_start_date: r.consolidation_start_date || undefined,
      consolidation_end_date: r.consolidation_end_date || undefined,
      baptism_date: r.baptism_date || undefined,
      contact_made: r.contact_made,
      contact_evaluation: r.contact_evaluation || undefined,
      contact_date: r.contact_date || undefined,
      notes: r.notes || undefined,
    } as any);
    const prev = (assigneesByRecord[r.id] || []).map((a) => a.consolidator_member_id).sort().join(",");
    const next = [...editAssignees].sort().join(",");
    if (prev !== next) {
      await setAssignees(r.id, editAssignees);
      logAudit({
        action: "assign_consolidator",
        entity_type: "consolidation_record",
        entity_id: r.id,
        details: { before: prev.split(",").filter(Boolean), after: editAssignees },
      });
    }
    logAudit({ action: "update", entity_type: "consolidation_record", entity_id: r.id });
    setEditingRecord(null);
  };

  // ----- VISITOR EDIT (visit_date + contato) -----
  const saveVisitorEdit = async () => {
    if (!editVisitor) return;
    const r = recordByMember.get(editVisitor.id);
    const payload: any = {
      visit_date: editVisitor.visit_date || today(),
      contact_made: !!editVisitor.contact_made,
      contact_date: editVisitor.contact_date || null,
      contact_evaluation: editVisitor.contact_evaluation || null,
      stage: "visitante",
    };
    if (r) {
      await updateRecord(r.id, payload);
    } else {
      await createRecord({ member_id: editVisitor.id, ...payload } as any);
    }
    setEditVisitor(null);
  };

  if (!churchId) return null;

  const personCell = (name?: string | null, sub?: string | null) => (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {(name || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{name || "—"}</p>
        {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
      </div>
    </div>
  );

  const renderStageTable = (
    list: ConsolidationRecord[],
    stage: ConsolidationStage,
    nextActions: Array<{ kind: ActionKind; label: React.ReactNode }>,
  ) => (
    <Card>
      <CardContent className="p-0">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="text-base font-medium">Nenhum registro nesta etapa</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pessoa</TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead className="hidden sm:table-cell">Data</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map(r => {
                const m = memberById.get(r.member_id);
                const dateField = stage === "visitante" ? r.visit_date
                  : stage === "decidido" ? r.decision_date
                  : stage === "em_consolidacao" ? r.consolidation_start_date
                  : stage === "consolidado" ? r.consolidation_end_date
                  : r.baptism_date;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      {personCell(r.member?.full_name || m?.full_name)}
                      {(assigneesByRecord[r.id]?.length || 0) > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1 pl-11">
                          {assigneesByRecord[r.id].map((a) => (
                            <Badge key={a.id} variant="outline" className="text-[10px] px-1.5 py-0">
                              {a.consolidator?.full_name || "—"}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {(r.member?.phone || m?.phone) && <span className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" />{r.member?.phone || m?.phone}</span>}
                        {(r.member?.email || m?.email) && <span className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" />{r.member?.email || m?.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {dateField ? new Date(dateField + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell><Badge className={stageConfig[r.stage].color}>{stageConfig[r.stage].label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        {nextActions.map(a => (
                          <Button key={a.kind} size="sm" variant="default" className="text-xs" onClick={() => openAction(a.kind, m, r)}>
                            {a.label}
                          </Button>
                        ))}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(r)}>Editar tudo</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={async () => {
                                await deleteRecord(r.id);
                                logAudit({ action: "delete", entity_type: "consolidation_record", entity_id: r.id });
                              }}
                            >Excluir registro</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Central de Consolidação</h1>
            <p className="text-muted-foreground">Funil: visitante → decidido → em consolidação → consolidado → batizado</p>
          </div>
          <FinancialFilters mode={periodMode} month={filterMonth} year={filterYear} onModeChange={setPeriodMode} onMonthChange={setFilterMonth} onYearChange={setFilterYear} />
        </div>

        {/* FUNIL DASHBOARD (filtrado por data) */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold">Funil do Período</h2>
            </div>
            <div className="space-y-2">
              {funnelSteps.map((step, i) => {
                const pct = (step.value / maxFunnel) * 100;
                return (
                  <div key={step.label}>
                    <button
                      type="button"
                      onClick={() => setOpenStage(step.key)}
                      className="w-full text-left cursor-pointer transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring rounded-xl"
                      aria-label={`Ver ${step.label}`}
                    >
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{step.label}</span>
                        <span className="tabular-nums font-semibold">{step.value}</span>
                      </div>
                      <div className={`h-9 overflow-hidden rounded-xl bg-gradient-to-r ${step.gradient}`}>
                        <div className={`flex h-full items-center justify-center rounded-xl transition-all duration-700 ${step.color}`} style={{ width: `${Math.max(pct, 8)}%` }}>
                          <span className="text-xs font-bold text-white drop-shadow">{step.value}</span>
                        </div>
                      </div>
                    </button>
                    {i < funnelSteps.length - 1 && (
                      <div className="flex justify-center py-0.5"><ArrowDown className="h-3 w-3 text-muted-foreground/40" /></div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">Clique em uma etapa para ver as pessoas</p>
          </CardContent>
        </Card>

        {/* DASHBOARD DE AVALIAÇÃO DE CONTATO DOS VISITANTES */}
        <VisitorContactDashboard
          records={records}
          membersById={memberById as any}
          visitors={members.filter(m => m.is_active && m.spiritual_status === "visitante") as any}
          inPeriod={inPeriod}
        />

        {/* TABS POR STAGE */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="!grid h-auto w-full grid-cols-5">
            <TabsTrigger value="visitantes"      className="min-w-0 whitespace-normal px-2 py-2 text-[10px] leading-tight sm:text-sm">Visitantes ({visitorsList.length})</TabsTrigger>
            <TabsTrigger value="decididos"       className="min-w-0 whitespace-normal px-2 py-2 text-[10px] leading-tight sm:text-sm">Decididos ({decididosList.length})</TabsTrigger>
            <TabsTrigger value="em_consolidacao" className="min-w-0 whitespace-normal px-2 py-2 text-[10px] leading-tight sm:text-sm">Em Consol. ({emConsolidacaoList.length})</TabsTrigger>
            <TabsTrigger value="consolidados"    className="min-w-0 whitespace-normal px-2 py-2 text-[10px] leading-tight sm:text-sm">Consolidados ({consolidadosList.length})</TabsTrigger>
            <TabsTrigger value="batizados"       className="min-w-0 whitespace-normal px-2 py-2 text-[10px] leading-tight sm:text-sm">Batizados ({batizadosList.length})</TabsTrigger>
          </TabsList>

          {/* VISITANTES (vem de members) */}
          <TabsContent value="visitantes" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {visitorsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Eye className="w-12 h-12 text-muted-foreground mb-3" />
                    <h3 className="text-base font-medium">Nenhum visitante</h3>
                    <p className="text-sm text-muted-foreground">Cadastre visitantes em Secretaria → Visitantes.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitante</TableHead>
                        <TableHead className="hidden md:table-cell">Contato</TableHead>
                        <TableHead className="hidden sm:table-cell">Data Visita</TableHead>
                        <TableHead className="hidden sm:table-cell">Contato feito</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitorsList.map(v => {
                        const r = recordByMember.get(v.id);
                        const visitDate = r?.visit_date || (v as any).created_at?.split("T")[0];
                        return (
                          <TableRow key={v.id}>
                            <TableCell>{personCell(v.full_name)}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex flex-col gap-0.5">
                                {v.phone && <span className="text-xs">{v.phone}</span>}
                                {v.email && <span className="text-xs text-muted-foreground">{v.email}</span>}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">
                              {visitDate ? new Date(visitDate + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {r?.contact_made ? <Badge className="bg-success/20 text-success">Sim</Badge> : <Badge variant="outline">Não</Badge>}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1 flex-wrap">
                                <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditVisitor({
                                  ...v,
                                  visit_date: r?.visit_date || "",
                                  contact_made: r?.contact_made || false,
                                  contact_date: r?.contact_date || "",
                                  contact_evaluation: r?.contact_evaluation || "",
                                })}>Editar</Button>
                                <Button size="sm" variant="default" className="text-xs" onClick={() => openAction("decidiu", v, r)}>
                                  <Heart className="w-3 h-3 sm:mr-1" /><span className="hidden sm:inline">Decidiu</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="decididos" className="space-y-4">
            {renderStageTable(decididosList, "decidido", [{ kind: "iniciar", label: "Iniciar consolidação" }])}
          </TabsContent>

          <TabsContent value="em_consolidacao" className="space-y-4">
            {renderStageTable(emConsolidacaoList, "em_consolidacao", [{ kind: "finalizar", label: "Finalizar" }])}
          </TabsContent>

          <TabsContent value="consolidados" className="space-y-4">
            {renderStageTable(consolidadosList, "consolidado", [{ kind: "batizar", label: <><Droplets className="w-3 h-3 mr-1" />Batizar</> as any }])}
          </TabsContent>

          <TabsContent value="batizados" className="space-y-4">
            {renderStageTable(batizadosList, "batizado", [])}
          </TabsContent>
        </Tabs>

        {/* ACTION MODAL (data obrigatória) */}
        <Dialog open={!!actionModal} onOpenChange={open => !open && setActiveAction(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{actionModal && actionConfig[actionModal.kind].title}</DialogTitle></DialogHeader>
            {actionModal && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pessoa: <strong>{actionModal.member?.full_name}</strong>
                </p>
                <div className="space-y-2">
                  <Label>{actionConfig[actionModal.kind].dateLabel} *</Label>
                  <Input type="date" value={actionModal.date} onChange={e => setActiveAction({ ...actionModal, date: e.target.value })} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveAction(null)}>Cancelar</Button>
              <Button onClick={confirmAction} disabled={!actionModal?.date}>Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* VISITOR EDIT */}
        <Dialog open={!!editVisitor} onOpenChange={open => !open && setEditVisitor(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Visitante</DialogTitle></DialogHeader>
            {editVisitor && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Data da visita *</Label>
                  <Input type="date" value={editVisitor.visit_date || ""} onChange={e => setEditVisitor({ ...editVisitor, visit_date: e.target.value })} />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="cmade" checked={!!editVisitor.contact_made} onChange={e => setEditVisitor({ ...editVisitor, contact_made: e.target.checked })} />
                  <Label htmlFor="cmade">Contato feito</Label>
                </div>
                <div className="space-y-2">
                  <Label>Data do contato</Label>
                  <Input type="date" value={editVisitor.contact_date || ""} onChange={e => setEditVisitor({ ...editVisitor, contact_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Avaliação do contato</Label>
                  <Select value={editVisitor.contact_evaluation || ""} onValueChange={v => setEditVisitor({ ...editVisitor, contact_evaluation: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positiva">Positiva — interessado(a)</SelectItem>
                      <SelectItem value="neutra">Neutra</SelectItem>
                      <SelectItem value="negativa">Negativa — sem interesse</SelectItem>
                      <SelectItem value="sem_resposta">Sem resposta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditVisitor(null)}>Cancelar</Button>
              <Button onClick={saveVisitorEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* FULL EDIT MODAL */}
        <Dialog open={!!editingRecord} onOpenChange={open => !open && setEditingRecord(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Editar Registro Completo</DialogTitle></DialogHeader>
            {editingRecord && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Etapa</Label>
                  <Select value={editingRecord.stage} onValueChange={(v) => setEditingRecord({ ...editingRecord, stage: v as ConsolidationStage })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(stageConfig) as ConsolidationStage[]).map(s => (
                        <SelectItem key={s} value={s}>{stageConfig[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Consolidadores responsáveis</Label>
                  <div className="rounded-md border p-2 max-h-40 overflow-y-auto space-y-1">
                    {members
                      .filter((m) => m.is_active && (["membro","lider","discipulador"] as any[]).includes(m.spiritual_status))
                      .map((m) => {
                        const checked = editAssignees.includes(m.id);
                        return (
                          <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/30 rounded px-2 py-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setEditAssignees((prev) =>
                                  e.target.checked ? [...prev, m.id] : prev.filter((x) => x !== m.id),
                                );
                              }}
                            />
                            <span className="truncate">{m.full_name}</span>
                          </label>
                        );
                      })}
                  </div>
                  {editAssignees.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {editAssignees.map((id) => {
                        const m = memberById.get(id);
                        return (
                          <Badge key={id} variant="secondary" className="text-xs">
                            {m?.full_name || "—"}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Data Visita</Label>
                    <Input type="date" value={editingRecord.visit_date || ""} onChange={e => setEditingRecord({ ...editingRecord, visit_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Decisão</Label>
                    <Input type="date" value={editingRecord.decision_date || ""} onChange={e => setEditingRecord({ ...editingRecord, decision_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Início Consolidação</Label>
                    <Input type="date" value={editingRecord.consolidation_start_date || ""} onChange={e => setEditingRecord({ ...editingRecord, consolidation_start_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim Consolidação</Label>
                    <Input type="date" value={editingRecord.consolidation_end_date || ""} onChange={e => setEditingRecord({ ...editingRecord, consolidation_end_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Batismo</Label>
                    <Input type="date" value={editingRecord.baptism_date || ""} onChange={e => setEditingRecord({ ...editingRecord, baptism_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Contato</Label>
                    <Input type="date" value={editingRecord.contact_date || ""} onChange={e => setEditingRecord({ ...editingRecord, contact_date: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="ercmade" checked={!!editingRecord.contact_made} onChange={e => setEditingRecord({ ...editingRecord, contact_made: e.target.checked })} />
                  <Label htmlFor="ercmade">Contato feito</Label>
                </div>
                <div className="space-y-2">
                  <Label>Avaliação do contato</Label>
                  <Select value={editingRecord.contact_evaluation || ""} onValueChange={v => setEditingRecord({ ...editingRecord, contact_evaluation: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positiva">Positiva</SelectItem>
                      <SelectItem value="neutra">Neutra</SelectItem>
                      <SelectItem value="negativa">Negativa</SelectItem>
                      <SelectItem value="sem_resposta">Sem resposta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={editingRecord.notes || ""} onChange={e => setEditingRecord({ ...editingRecord, notes: e.target.value })} rows={3} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRecord(null)}>Cancelar</Button>
              <Button onClick={saveEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet open={!!openStage} onOpenChange={(o) => !o && setOpenStage(null)}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            {openStage && (() => {
              const labelMap: Record<typeof openStage, string> = {
                visitantes: "Visitantes",
                decididos: "Decididos",
                emConsol: "Em Consolidação",
                consolidados: "Consolidados",
                batizados: "Batizados",
              } as any;
              const list = (dashPeople as any)[openStage] as Array<any>;
              return (
                <>
                  <SheetHeader>
                    <SheetTitle>{labelMap[openStage]}</SheetTitle>
                    <SheetDescription>{list.length} pessoa(s) no período</SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 space-y-2">
                    {list.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <Users className="w-10 h-10 mb-2 opacity-40" />
                        <p className="text-sm">Ninguém nesta etapa</p>
                      </div>
                    ) : list.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {(p.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{p.full_name || "—"}</p>
                          {(p.phone || p.email) && (
                            <p className="text-xs text-muted-foreground truncate">{p.phone || p.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
