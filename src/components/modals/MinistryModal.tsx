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
import type { Member } from "@/hooks/useMembers";

const ministrySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  leader_id: z.string().optional(),
});

type MinistryFormData = z.infer<typeof ministrySchema>;

interface Ministry {
  id: string;
  name: string;
  description: string | null;
  leader_id: string | null;
  is_active: boolean;
}

interface MinistryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministry?: Ministry;
  members: Member[];
  onSubmit: (data: Partial<Ministry>) => Promise<{ data: Ministry | null; error: any }>;
}

export function MinistryModal({ open, onOpenChange, ministry, members, onSubmit }: MinistryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<MinistryFormData>({
    resolver: zodResolver(ministrySchema),
    defaultValues: {
      name: "",
      description: "",
      leader_id: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: ministry?.name || "",
        description: ministry?.description || "",
        leader_id: ministry?.leader_id || "",
      });
    }
  }, [open, ministry, form]);

  const handleSubmit = async (data: MinistryFormData) => {
    setIsSubmitting(true);
    try {
      const cleanedData = {
        name: data.name,
        description: data.description || null,
        leader_id: data.leader_id || null,
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

  const leaderCandidates = members.filter(m => 
    m.spiritual_status === "lider" || m.spiritual_status === "discipulador"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{ministry ? "Editar Ministério" : "Novo Ministério"}</DialogTitle>
          <DialogDescription>
            {ministry
              ? "Edite as informações do ministério."
              : "Preencha os dados para criar um novo ministério."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Ministério *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Louvor e Adoração" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o propósito do ministério" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leader_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Líder</FormLabel>
                  <Select onValueChange={(val) => field.onChange(val === "_none" ? "" : val)} value={field.value || "_none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o líder" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="_none">Sem líder definido</SelectItem>
                      {leaderCandidates.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {ministry ? "Salvar" : "Criar Ministério"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
