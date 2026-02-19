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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import type { Member, CreateMemberData } from "@/hooks/useMembers";

const memberSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(2).optional().or(z.literal("")),
  gender: z.enum(["M", "F"]).optional(),
  marital_status: z.string().optional().or(z.literal("")),
  spiritual_status: z.enum(["visitante", "novo_convertido", "membro", "lider", "discipulador"]).default("visitante"),
  baptism_date: z.string().optional().or(z.literal("")),
  baptism_location: z.string().max(200).optional().or(z.literal("")),
  conversion_date: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  network: z.string().optional().or(z.literal("")),
  age_group: z.string().optional().or(z.literal("")),
  wedding_date: z.string().optional().or(z.literal("")),
  pastoral_notes: z.string().max(1000).optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member;
  onSubmit: (data: CreateMemberData) => Promise<{ data: Member | null; error: any }>;
}

export function MemberModal({ open, onOpenChange, member, onSubmit }: MemberModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      birth_date: "",
      address: "",
      city: "",
      state: "",
      gender: undefined,
      marital_status: "",
      spiritual_status: "visitante",
      baptism_date: "",
      baptism_location: "",
      conversion_date: "",
      notes: "",
      network: "",
      age_group: "",
      wedding_date: "",
      pastoral_notes: "",
      is_active: true,
    },
  });

  // Reset form when member changes
  useEffect(() => {
    if (open) {
      form.reset({
        full_name: member?.full_name || "",
        email: member?.email || "",
        phone: member?.phone || "",
        birth_date: member?.birth_date || "",
        address: member?.address || "",
        city: member?.city || "",
        state: member?.state || "",
        gender: member?.gender as "M" | "F" | undefined,
        marital_status: member?.marital_status || "",
        spiritual_status: member?.spiritual_status || "visitante",
        baptism_date: member?.baptism_date || "",
        baptism_location: member?.baptism_location || "",
        conversion_date: member?.conversion_date || "",
        notes: member?.notes || "",
        network: member?.network || "",
        age_group: member?.age_group || "",
        wedding_date: member?.wedding_date || "",
        pastoral_notes: member?.pastoral_notes || "",
        is_active: member?.is_active ?? true,
      });
    }
  }, [open, member, form]);

  const handleSubmit = async (data: MemberFormData) => {
    setIsSubmitting(true);
    try {
      const cleanedData: CreateMemberData = {
        full_name: data.full_name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        birth_date: data.birth_date || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        gender: data.gender,
        marital_status: data.marital_status || undefined,
        spiritual_status: data.spiritual_status,
        baptism_date: data.baptism_date || undefined,
        baptism_location: data.baptism_location || undefined,
        conversion_date: data.conversion_date || undefined,
        notes: data.notes || undefined,
        network: data.network || undefined,
        age_group: data.age_group || undefined,
        wedding_date: data.wedding_date || undefined,
        pastoral_notes: data.pastoral_notes || undefined,
        is_active: data.is_active,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? "Editar Membro" : "Novo Cadastro"}</DialogTitle>
          <DialogDescription>
            {member
              ? "Edite as informações do membro abaixo."
              : "Preencha as informações para cadastrar um novo membro."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="spiritual">Espiritual</TabsTrigger>
                <TabsTrigger value="pastoral">Pastoral</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem className="col-span-full">
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sexo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marital_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado Civil</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                            <SelectItem value="casado">Casado(a)</SelectItem>
                            <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                            <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="wedding_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Casamento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age_group"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faixa Etária</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="crianca">Criança (0-11)</SelectItem>
                            <SelectItem value="adolescente">Adolescente (12-17)</SelectItem>
                            <SelectItem value="jovem">Jovem (18-29)</SelectItem>
                            <SelectItem value="adulto">Adulto (30-59)</SelectItem>
                            <SelectItem value="idoso">Terceira Idade (60+)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="col-span-full">
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, número, bairro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                          <Input placeholder="SP" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="spiritual" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="spiritual_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Espiritual *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="visitante">Visitante</SelectItem>
                            <SelectItem value="novo_convertido">Novo Convertido (Decidido)</SelectItem>
                            <SelectItem value="membro">Membro</SelectItem>
                            <SelectItem value="lider">Líder</SelectItem>
                            <SelectItem value="discipulador">Discipulador</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="network"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rede</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a rede" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="homens">Homens</SelectItem>
                            <SelectItem value="mulheres">Mulheres</SelectItem>
                            <SelectItem value="jovens">Jovens</SelectItem>
                            <SelectItem value="kids">Kids</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="conversion_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Conversão</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="baptism_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Batismo</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="baptism_location"
                    render={({ field }) => (
                      <FormItem className="col-span-full">
                        <FormLabel>Local do Batismo</FormLabel>
                        <FormControl>
                          <Input placeholder="Local do batismo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="col-span-full">
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Observações gerais..."
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
              </TabsContent>

              <TabsContent value="pastoral" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Status Ativo</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Marque se a pessoa está ativa na igreja
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pastoral_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Pastorais (Privado)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Anotações pastorais confidenciais sobre acompanhamento espiritual..."
                            className="resize-none"
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Estas anotações são visíveis apenas para liderança pastoral.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {member ? "Salvar Alterações" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
