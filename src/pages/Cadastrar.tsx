import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Church, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const cadastroSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: z.string().optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  tipo: z.enum(["visitante", "membro"]),
  isBaptized: z.enum(["sim", "nao"]),
});

type CadastroFormData = z.infer<typeof cadastroSchema>;

export default function Cadastrar() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const churchId = searchParams.get("church");

  const form = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { fullName: "", email: "", password: "", phone: "", birthDate: "", tipo: "visitante", isBaptized: "nao" },
  });

  const handleSubmit = async (data: CadastroFormData) => {
    if (!churchId) {
      setErrorMsg("Link inválido. Peça um novo link à sua igreja.");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            church_id: churchId,
          },
        },
      });
      if (authError) throw authError;

      // 2. Update profile with church_id
      if (authData.user) {
        await supabase.from("profiles").update({
          church_id: churchId,
          full_name: data.fullName,
        } as any).eq("user_id", authData.user.id);

        // 3. Assign membro role
        await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          church_id: churchId,
          role: "membro",
        } as any).select();
      }

      // 4. Save to pending_users for admin approval/linking
      await supabase.from("pending_users" as any).insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone || null,
        birth_date: data.birthDate || null,
        church_id: churchId,
        tipo: data.tipo,
        status: "pendente",
      });

      setSuccess(true);
      toast({ title: "Cadastro realizado!" });
    } catch (error: any) {
      console.error("[Cadastrar] error:", error);
      setErrorMsg(error.message || "Erro ao enviar cadastro.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!churchId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Church className="w-10 h-10 text-primary mx-auto mb-2" />
            <CardTitle>Link Inválido</CardTitle>
            <CardDescription>
              Este link de cadastro não possui uma igreja vinculada. Peça um novo link ao líder da sua igreja.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <CardTitle>Cadastro Realizado!</CardTitle>
            <CardDescription>
              Sua conta foi criada com sucesso. Você já pode fazer login e acessar o app. A liderança da igreja irá finalizar seu vínculo.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/login">
              <Button className="w-full">Ir para o Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Church className="w-10 h-10 text-primary mx-auto mb-2" />
          <CardTitle className="text-2xl">Cadastro</CardTitle>
          <CardDescription>
            Preencha seus dados para se cadastrar na igreja
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{errorMsg}</div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl><Input placeholder="Seu nome completo" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha *</FormLabel>
                  <FormControl><Input type="password" placeholder="Mínimo 6 caracteres" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl><Input placeholder="(11) 99999-9999" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="birthDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="tipo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="visitante">Visitante</SelectItem>
                      <SelectItem value="membro">Membro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="isBaptized" render={({ field }) => (
                <FormItem>
                  <FormLabel>Batizado? *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Conta
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">Fazer login</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
