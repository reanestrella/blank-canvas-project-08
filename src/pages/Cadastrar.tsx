console.log("nova versão convite v2");
import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
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
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const form = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      birthDate: "",
      tipo: "visitante",
      isBaptized: "nao",
    },
  });

  const handleSubmit = async (data: CadastroFormData) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 🔥 TOKEN DO CONVITE
      const pendingToken = sessionStorage.getItem("pending_invite_token");
      console.log("Token antes do cadastro:", pendingToken);

      // 1. CRIAR USUÁRIO
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            church_id: null, // 🔥 IMPORTANTE
            congregation_id: null,
            phone: data.phone || null,
            birth_date: data.birthDate || null,
            tipo: data.tipo,
          },
        },
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      console.log("Usuário criado:", userId);

      // 2. LOGIN AUTOMÁTICO
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      // 3. GARANTIR PROFILE
      if (userId) {
        await supabase.from("profiles").upsert({
          user_id: userId,
          email: data.email,
          full_name: data.fullName,
        });
      }

      // 4. PEQUENO DELAY
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 5. APLICAR CONVITE
      if (pendingToken && userId) {
        console.log("Aplicando convite...");

        const { error: inviteError } = await supabase.rpc("aceitar_convite", {
          p_token: pendingToken,
          p_user_id: userId,
        });

        if (inviteError) {
          console.error(inviteError);
          toast({
            title: "Erro ao aplicar convite",
            description: inviteError.message,
            variant: "destructive",
          });
        } else {
          sessionStorage.removeItem("pending_invite_token");
          toast({ title: "Convite aceito com sucesso!" });
        }
      }

      navigate("/meu-app");

    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Erro ao cadastrar");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto mb-2" />
            <CardTitle>Cadastro realizado!</CardTitle>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full">Ir para login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Church className="mx-auto mb-2" />
          <CardTitle>Cadastro</CardTitle>
          <CardDescription>Crie sua conta</CardDescription>
        </CardHeader>

        <CardContent>
          {errorMsg && (
            <div className="text-red-500 text-sm mb-2">{errorMsg}</div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="animate-spin mr-2" />}
                Criar Conta
              </Button>

            </form>
          </Form>

          <div className="text-center mt-4 text-sm">
            Já tem conta? <Link to="/login" className="text-primary">Entrar</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
