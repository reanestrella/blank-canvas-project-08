import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CellReportErrorBoundary } from "@/components/cells/ErrorBoundary";
import { AttendanceList } from "@/components/cells/AttendanceList";
import { batchUpsertAttendance } from "@/services/attendance";
import type { Cell, CellReport, CreateCellReportData } from "@/hooks/useCells";

const reportSchema = z.object({
  cell_id: z.string().min(1, "Selecione uma célula"),
  report_date: z.string().min(1, "Data é obrigatória"),
  offering: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface MemberEntry {
  id: string;
  memberId: string;
  memberName: string;
}

interface CellReportWithAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cells: Cell[];
  defaultCellId?: string;
  onSubmit: (data: CreateCellReportData) => Promise<{ data: CellReport | null; error: any }>;
}

export function CellReportWithAttendanceModal({
  open,
  onOpenChange,
  cells,
  defaultCellId,
  onSubmit,
}: CellReportWithAttendanceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});
  const [visitorNames, setVisitorNames] = useState<string[]>([]);
  const [decidedNames, setDecidedNames] = useState<string[]>([]);
  const [newVisitor, setNewVisitor] = useState("");
  const [newDecided, setNewDecided] = useState("");
  const { toast } = useToast();

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      cell_id: defaultCellId || "",
      report_date: new Date().toISOString().split("T")[0],
      offering: "",
      notes: "",
    },
  });

  const selectedCellId = form.watch("cell_id");

  // Fetch members only when cell changes
  useEffect(() => {
    if (!selectedCellId) {
      setMembers([]);
      setPresencas({});
      return;
    }

    let cancelled = false;

    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        const { data, error } = await supabase
          .from("cell_members")
          .select("id, member_id, member:members(id, full_name)")
          .eq("cell_id", selectedCellId);

        if (cancelled) return;
        if (error) {
          console.error("Erro ao buscar membros da célula:", error);
          setMembers([]);
          return;
        }

        const safe: MemberEntry[] = [];
        if (Array.isArray(data)) {
          for (const row of data) {
            if (!row?.member_id) continue;
            const member = Array.isArray(row.member) ? row.member[0] : row.member;
            safe.push({
              id: row.id ?? row.member_id,
              memberId: row.member_id,
              memberName: member?.full_name ?? "Membro",
            });
          }
        }
        setMembers(safe);
        setPresencas({});
      } catch (err) {
        console.error("Erro ao buscar membros:", err);
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    };

    fetchMembers();
    return () => { cancelled = true; };
  }, [selectedCellId]);

  const togglePresenca = useCallback((memberId: string) => {
    setPresencas(prev => ({ ...prev, [memberId]: !prev[memberId] }));
  }, []);

  const saveAttendance = useCallback(async (reportId: string) => {
    const entries = members.map((m) => ({
      memberId: m.memberId,
      present: !!presencas[m.memberId],
    }));
    if (entries.length === 0) return;
    const result = await batchUpsertAttendance(reportId, entries);
    if (!result.success) {
      toast({
        title: "Aviso",
        description: `Relatório salvo, mas houve um erro ao registrar presenças: ${result.error}`,
        variant: "destructive",
      });
    }
  }, [members, presencas, toast]);

  const addVisitor = useCallback(() => {
    const name = newVisitor.trim();
    if (name) {
      setVisitorNames(prev => [...prev, name]);
      setNewVisitor("");
    }
  }, [newVisitor]);

  const removeVisitor = useCallback((index: number) => {
    setVisitorNames(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addDecided = useCallback(() => {
    const name = newDecided.trim();
    if (name) {
      setDecidedNames(prev => [...prev, name]);
      setNewDecided("");
    }
  }, [newDecided]);

  const removeDecided = useCallback((index: number) => {
    setDecidedNames(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async (data: ReportFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const presentCount = Object.values(presencas).filter(Boolean).length;

      const cleanedData: CreateCellReportData = {
        cell_id: data.cell_id,
        report_date: data.report_date,
        attendance: presentCount + visitorNames.length,
        visitors: visitorNames.length,
        conversions: decidedNames.length,
        offering: data.offering ? parseFloat(data.offering) : undefined,
        notes: data.notes || undefined,
        decided: decidedNames.length > 0 ? decidedNames : undefined,
        visitor_names: visitorNames.length > 0 ? visitorNames : undefined,
      };

      const result = await onSubmit(cleanedData);
      if (result.error) {
        console.error("Erro ao enviar relatório:", result.error);
        toast({
          title: "Erro",
          description: "Não foi possível enviar o relatório. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      if (result.data?.id) {
        await saveAttendance(result.data.id);
      }

      form.reset();
      setPresencas({});
      setMembers([]);
      setVisitorNames([]);
      setDecidedNames([]);
      onOpenChange(false);
    } catch (err) {
      console.error("Exceção ao enviar relatório:", err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. A tela foi preservada.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, presencas, visitorNames, decidedNames, onSubmit, saveAttendance, form, onOpenChange, toast]);

  const activeCells = useMemo(() => (cells ?? []).filter((c) => c.is_active), [cells]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Relatório Semanal da Célula</DialogTitle>
          <DialogDescription>
            Marque os membros presentes, adicione visitantes e decisões.
          </DialogDescription>
        </DialogHeader>

        <CellReportErrorBoundary>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="space-y-4 flex-shrink-0">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cell_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Célula *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a célula" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {activeCells.map((cell) => (
                              <SelectItem key={cell.id} value={cell.id}>
                                {cell.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="report_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da Reunião *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {selectedCellId && (
                <AttendanceList
                  members={members}
                  loading={loadingMembers}
                  presencas={presencas}
                  onToggle={togglePresenca}
                />
              )}

              <div className="space-y-4 mt-4 flex-shrink-0 overflow-y-auto max-h-[300px]">
                {/* Visitors */}
                <div className="border rounded-lg p-3 space-y-2">
                  <FormLabel>Visitantes</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome do visitante"
                      value={newVisitor}
                      onChange={(e) => setNewVisitor(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVisitor(); } }}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addVisitor}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {visitorNames.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {visitorNames.map((name, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {name}
                          <button type="button" onClick={() => removeVisitor(i)}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{visitorNames.length} visitante(s)</p>
                </div>

                {/* Decided */}
                <div className="border rounded-lg p-3 space-y-2">
                  <FormLabel>Decisões (Novos Convertidos)</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome do decidido"
                      value={newDecided}
                      onChange={(e) => setNewDecided(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDecided(); } }}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addDecided}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {decidedNames.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {decidedNames.map((name, i) => (
                        <Badge key={i} variant="secondary" className="gap-1 bg-success/10 text-success">
                          {name}
                          <button type="button" onClick={() => removeDecided(i)}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{decidedNames.length} decisão(ões)</p>
                </div>

                <FormField
                  control={form.control}
                  name="offering"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oferta (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações sobre a reunião, pedidos de oração, testemunhos..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="mt-4 flex-shrink-0">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Enviar Relatório
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </CellReportErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
