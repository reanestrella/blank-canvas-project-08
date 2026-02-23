import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { CellReport } from "@/hooks/useCells";

const schema = z.object({
  report_date: z.string().min(1, "Data obrigatória"),
  attendance: z.coerce.number().min(0),
  visitors: z.coerce.number().min(0),
  conversions: z.coerce.number().min(0),
  offering: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface EditCellReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: CellReport | null;
  onSubmit: (id: string, data: Partial<any>) => Promise<{ data: any; error: any }>;
}

export function EditCellReportModal({ open, onOpenChange, report, onSubmit }: EditCellReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { report_date: "", attendance: 0, visitors: 0, conversions: 0, offering: "", notes: "" },
  });

  useEffect(() => {
    if (open && report) {
      form.reset({
        report_date: report.report_date,
        attendance: report.attendance,
        visitors: report.visitors,
        conversions: report.conversions,
        offering: report.offering ? String(report.offering) : "",
        notes: report.notes || "",
      });
    }
  }, [open, report, form]);

  const handleSubmit = async (data: FormData) => {
    if (!report) return;
    setIsSubmitting(true);
    try {
      const result = await onSubmit(report.id, {
        report_date: data.report_date,
        attendance: data.attendance,
        visitors: data.visitors,
        conversions: data.conversions,
        offering: data.offering ? parseFloat(data.offering) : 0,
        notes: data.notes || null,
      });
      if (!result.error) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Relatório</DialogTitle>
          <DialogDescription>Corrija os dados do relatório da célula.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="report_date" render={({ field }) => (
              <FormItem><FormLabel>Data *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-3 gap-3">
              <FormField control={form.control} name="attendance" render={({ field }) => (
                <FormItem><FormLabel>Presença</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="visitors" render={({ field }) => (
                <FormItem><FormLabel>Visitantes</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="conversions" render={({ field }) => (
                <FormItem><FormLabel>Decisões</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="offering" render={({ field }) => (
              <FormItem><FormLabel>Oferta (R$)</FormLabel><FormControl><Input type="number" step="0.01" min="0" placeholder="0,00" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea rows={3} className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
