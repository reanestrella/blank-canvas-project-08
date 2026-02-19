import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CellReportErrorBoundary } from "@/components/cells/ErrorBoundary";
import { AttendanceList } from "@/components/cells/AttendanceList";
import type { Cell, CellReport, CreateCellReportData } from "@/hooks/useCells";

const reportSchema = z.object({
  cell_id: z.string().min(1, "Selecione uma célula"),
  report_date: z.string().min(1, "Data é obrigatória"),
  visitors: z.string().min(1, "Visitantes é obrigatório"),
  conversions: z.string().min(1, "Decisões é obrigatório"),
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
  // Simple Record-based state — no Set, no complex structures
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      cell_id: defaultCellId || "",
      report_date: new Date().toISOString().split("T")[0],
      visitors: "0",
      conversions: "0",
      offering: "",
      notes: "",
    },
  });

  const selectedCellId = form.watch("cell_id");

  // Fetch members only when cell changes — no dependency on presencas
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
          console.error("Erro ao buscar membros:", error);
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

  // Ultra-simple toggle — no side effects, no async
  const togglePresenca = (memberId: string) => {
    setPresencas(prev => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const handleSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    try {
      const visitors = parseInt(data.visitors, 10) || 0;
      const presentCount = Object.values(presencas).filter(Boolean).length;

      const cleanedData: CreateCellReportData = {
        cell_id: data.cell_id,
        report_date: data.report_date,
        attendance: presentCount + visitors,
        visitors,
        conversions: parseInt(data.conversions, 10) || 0,
        offering: data.offering ? parseFloat(data.offering) : undefined,
        notes: data.notes || undefined,
      };

      const result = await onSubmit(cleanedData);
      if (!result.error) {
        form.reset();
        setPresencas({});
        setMembers([]);
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Erro ao enviar relatório:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCells = useMemo(() => (cells ?? []).filter((c) => c.is_active), [cells]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Relatório Semanal da Célula</DialogTitle>
          <DialogDescription>
            Marque os membros presentes e preencha as informações da reunião.
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

              <div className="space-y-4 mt-4 flex-shrink-0">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="visitors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visitantes *</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="conversions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Decisões *</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                </div>

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
