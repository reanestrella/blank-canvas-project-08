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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Copy, Check } from "lucide-react";
import type { CreateInvitationData, Invitation } from "@/hooks/useInvitations";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string().optional(),
  role: z.enum(["tesoureiro", "secretario", "lider_celula", "lider_ministerio", "consolidacao", "membro"]),
  congregation_id: z.string().optional(),
  member_id: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const roleLabels: Record<string, string> = {
  tesoureiro: "Tesoureiro(a)",
  secretario: "Secretário(a)",
  lider_celula: "Líder de Célula",
  lider_ministerio: "Líder de Ministério",
  consolidacao: "Consolidação",
  membro: "Membro",
};

interface Congregation {
  id: string;
  name: string;
  is_main: boolean;
}

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateInvitationData) => Promise<{ data: Invitation | null; error: any }>;
  getInviteLink: (token: string) => string;
  congregations?: Congregation[];
  churchId?: string;
}

export function InviteUserModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  getInviteLink,
  congregations = [],
  churchId,
}: InviteUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      full_name: "",
      role: "membro",
      congregation_id: "",
      member_id: "",
    },
  });

  const selectedRole = form.watch("role");
  const needsMemberLink = selectedRole === "lider_celula" || selectedRole === "lider_ministerio";

  const handleSubmit = async (data: InviteFormData) => {
    setIsSubmitting(true);
    try {
      const submitData: CreateInvitationData = {
        email: data.email,
        role: data.role,
      };
      
      // Add optional fields
      if (data.full_name && data.full_name.trim()) {
        submitData.full_name = data.full_name.trim();
      }
      if (data.congregation_id && data.congregation_id !== "_all") {
        submitData.congregation_id = data.congregation_id;
      }
      if (data.member_id && needsMemberLink) {
        submitData.member_id = data.member_id;
      }
      
      const result = await onSubmit(submitData);
      if (!result.error && result.data) {
        setGeneratedLink(getInviteLink(result.data.token));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      form.reset();
      setGeneratedLink(null);
      setCopied(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Novo Usuário</DialogTitle>
          <DialogDescription>
            {generatedLink 
              ? "Copie o link e envie para o usuário. Ele só precisará criar uma senha."
              : "Gere um link de convite. O usuário só precisará criar uma senha para acessar."}
          </DialogDescription>
        </DialogHeader>

        {generatedLink ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input 
                value={generatedLink} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Este link expira em 7 dias e só pode ser usado uma vez. O usuário só precisará criar uma senha.
            </p>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email do convidado *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="email@exemplo.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nome do usuário" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Se preenchido, o nome será pré-preenchido no cadastro.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {needsMemberLink && churchId && (
                <FormField
                  control={form.control}
                  name="member_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vincular ao Membro *</FormLabel>
                      <FormControl>
                        <MemberAutocomplete
                          churchId={churchId}
                          value={field.value}
                          onChange={(id) => field.onChange(id || "")}
                          placeholder="Buscar membro cadastrado..."
                        />
                      </FormControl>
                      <FormDescription>
                        {selectedRole === "lider_celula" 
                          ? "O líder só terá acesso à célula que lidera."
                          : "O líder só terá acesso ao ministério que lidera."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {congregations.length > 1 && (
                <FormField
                  control={form.control}
                  name="congregation_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filial (opcional)</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === "_all" ? "" : val)} 
                        value={field.value || "_all"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Todas as filiais" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_all">Todas as filiais</SelectItem>
                          {congregations.map((congregation) => (
                            <SelectItem key={congregation.id} value={congregation.id}>
                              {congregation.name}
                              {congregation.is_main && " (Sede)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Se selecionado, o usuário só terá acesso aos dados desta filial.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Gerar Link
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
