import { useState } from "react";
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
import type { Cell, CellReport, CreateCellReportData } from "@/hooks/useCells";

const reportSchema = z.object({
  cell_id: z.string().min(1, "Selecione uma célula"),
  report_date: z.string().min(1, "Data é obrigatória"),
  attendance: z.string().min(1, "Presença é obrigatória"),
  visitors: z.string().min(1, "Visitantes é obrigatório"),
  conversions: z.string().min(1, "Decisões é obrigatório"),
  offering: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface CellReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cells: Cell[];
  defaultCellId?: string;
  onSubmit: (data: CreateCellReportData) => Promise<{ data: CellReport | null; error: any }>;
}

export function CellReportModal({
  open,
  onOpenChange,
  cells,
  defaultCellId,
  onSubmit,
}: CellReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      cell_id: defaultCellId || "",
      report_date: new Date().toISOString().split("T")[0],
      attendance: "",
      visitors: "",
      conversions: "0",
      offering: "",
      notes: "",
    },
  });

  const handleSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    try {
      const cleanedData: CreateCellReportData = {
        cell_id: data.cell_id,
        report_date: data.report_date,
        attendance: parseInt(data.attendance, 10),
        visitors: parseInt(data.visitors, 10),
        conversions: parseInt(data.conversions, 10),
        offering: data.offering ? parseFloat(data.offering) : undefined,
        notes: data.notes || undefined,
      };
      
      const result = await onSubmit(cleanedData);
      if (!result.error) {
        form.reset();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCells = cells.filter((c) => c.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Relatório Semanal da Célula</DialogTitle>
          <DialogDescription>
            Preencha o relatório semanal da célula com as informações da reunião.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="attendance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presença *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visitors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visitantes *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                      />
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
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="offering"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oferta (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                    />
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
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar Relatório
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
