import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Loader2 } from "lucide-react";
import type { Congregation, CreateCongregationData } from "@/hooks/useCongregations";

const congregationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

type CongregationFormData = z.infer<typeof congregationSchema>;

interface CongregationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  congregation?: Congregation;
  onSubmit: (data: CreateCongregationData) => Promise<{ data: Congregation | null; error: any }>;
  churchId: string;
}

export function CongregationModal({
  open,
  onOpenChange,
  congregation,
  onSubmit,
  churchId,
}: CongregationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CongregationFormData>({
    resolver: zodResolver(congregationSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: congregation?.name || "",
        address: congregation?.address || "",
        city: congregation?.city || "",
        state: congregation?.state || "",
      });
    }
  }, [open, congregation, form]);

  const handleSubmit = async (data: CongregationFormData) => {
    setIsSubmitting(true);
    const cleanData: CreateCongregationData = {
      church_id: churchId,
      name: data.name,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
    };

    const result = await onSubmit(cleanData);
    setIsSubmitting(false);
    if (!result.error) {
      onOpenChange(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {congregation ? "Editar Filial" : "Nova Filial"}
          </DialogTitle>
          <DialogDescription>
            {congregation
              ? "Edite as informações da filial"
              : "Adicione uma nova filial/congregação"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Filial *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Congregação Norte" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="UF" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {congregation ? "Salvar" : "Criar Filial"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
