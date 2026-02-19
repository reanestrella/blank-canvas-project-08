import { useState, useEffect } from "react";
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
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";
import type { FinancialTransaction, FinancialCategory, CreateTransactionData } from "@/hooks/useFinancial";

const transactionSchema = z.object({
  type: z.enum(["receita", "despesa"]),
  amount: z.string().min(1, "Valor é obrigatório"),
  description: z.string().min(2, "Descrição deve ter pelo menos 2 caracteres").max(200),
  transaction_date: z.string().min(1, "Data é obrigatória"),
  category_id: z.string().optional().or(z.literal("")),
  member_id: z.string().optional().or(z.literal("")),
  payment_method: z.string().optional().or(z.literal("")),
  reference_number: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: FinancialTransaction;
  categories: FinancialCategory[];
  defaultType?: "receita" | "despesa";
  churchId: string;
  onSubmit: (data: CreateTransactionData) => Promise<{ data: FinancialTransaction | null; error: any }>;
}

export function TransactionModal({
  open,
  onOpenChange,
  transaction,
  categories,
  defaultType = "receita",
  churchId,
  onSubmit,
}: TransactionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType,
      amount: "",
      description: "",
      transaction_date: new Date().toISOString().split("T")[0],
      category_id: "",
      member_id: "",
      payment_method: "",
      reference_number: "",
      notes: "",
    },
  });

  // Reset form when modal opens with transaction data (for editing)
  useEffect(() => {
    if (open) {
      if (transaction) {
        form.reset({
          type: transaction.type,
          amount: transaction.amount?.toString() || "",
          description: transaction.description || "",
          transaction_date: transaction.transaction_date || new Date().toISOString().split("T")[0],
          category_id: transaction.category_id || "",
          member_id: transaction.member_id || "",
          payment_method: transaction.payment_method || "",
          reference_number: transaction.reference_number || "",
          notes: transaction.notes || "",
        });
      } else {
        form.reset({
          type: defaultType,
          amount: "",
          description: "",
          transaction_date: new Date().toISOString().split("T")[0],
          category_id: "",
          member_id: "",
          payment_method: "",
          reference_number: "",
          notes: "",
        });
      }
    }
  }, [open, transaction, defaultType]);

  const selectedType = form.watch("type");
  const filteredCategories = categories.filter((c) => c.type === selectedType);

  const handleSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    try {
      const cleanedData: CreateTransactionData = {
        type: data.type,
        amount: parseFloat(data.amount.replace(",", ".")),
        description: data.description,
        transaction_date: data.transaction_date,
        category_id: data.category_id || undefined,
        member_id: data.member_id || undefined,
        payment_method: data.payment_method || undefined,
        reference_number: data.reference_number || undefined,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar Transação" : defaultType === "receita" ? "Nova Receita" : "Nova Despesa"}
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? "Edite as informações da transação."
              : `Registre uma nova ${defaultType === "receita" ? "entrada" : "saída"}.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="receita">Receita (Entrada)</SelectItem>
                      <SelectItem value="despesa">Despesa (Saída)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
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
                name="transaction_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Dízimo, Oferta, Energia..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === "receita" && (
              <FormField
                control={form.control}
                name="member_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dizimista / Ofertante</FormLabel>
                    <FormControl>
                      <MemberAutocomplete
                        churchId={churchId}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Digite 3 letras para buscar..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
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
                      placeholder="Observações adicionais..."
                      className="resize-none"
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
                {transaction ? "Salvar" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
