import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Church, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const cadastroSchema = z
  .object({
    fullName: z.string().min(2, "Nome completo é obrigatório").max(100),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type CadastroFormData = z.infer<typeof cadastroSchema>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function Cadastrar() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const token =
    searchParams.get("token") || sessionStorage.getItem("pending_invite_token") || "";
  const validToken = !!token && UUID_RE.test(token);

  useEffect(() => {
    if (token && validToken) {
      sessionStorage.setItem("pending_invite_token", token);
    }
  }, [token, validToken]);

  const form = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (data: CadastroFormData) => {
    if (!validToken || !token) {
      setErrorMsg("Convite inválido.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Criar usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone || null,
          },
        },
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Erro ao criar usuário");

      // 2. Login automático
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      // 3. Buscar convite
      const { data: convite, error: conviteError } = await supabase
        .from("invitations" as any)
        .select("*")
        .eq("token", token)
        .single();

      if (conviteError || !convite) {
        throw new Error("Convite não encontrado");
      }

      const conviteData = convite as any;

      // 4. Criar profile manualmente
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          full_name: data.fullName,
          email: data.email,
          phone: data.phone || null,
          church_id: conviteData.church_id,
          registration_status: "ativo",
        } as any,
        { onConflict: "user_id" }
      );

      if (profileError) {
        console.error(profileError);
        throw new Error("Erro ao criar perfil");
      }

      // 5. Inserir role
      const roleToInsert = conviteData.role || "membro";
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        church_id: conviteData.church_id,
        role: roleToInsert,
      } as any);

      if (roleError) {
        console.error(roleError);
      }

      // 6. Marcar convite como usado
      await supabase
        .from("invitations" as any)
        .update({
          status: "accepted",
          used_at: new Date().toISOString(),
        })
        .eq("token", token);

      // 7. Limpar token
      sessionStorage.removeItem("pending_invite_token");

      toast({
        title: "Cadastro concluído!",
        description: "Bem-vindo à igreja!",
      });

      // 8. Redirecionar
      window.location.href = "/app";
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Erro ao cadastrar");
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <Church className="w-10 h-10 text-primary" />
          </Link>
          <CardTitle className="text-2xl">Aceitar Convite</CardTitle>
          <CardDescription>
            Crie sua conta para acessar a igreja
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!validToken && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Convite inválido ou ausente. Solicite um novo link.
              </AlertDescription>
            </Alert>
          )}

          {errorMsg && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
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
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !validToken}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Conta
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Já tem uma conta?{" "}
              <Link
                to={`/login${token ? `?token=${token}` : ""}`}
                className="text-primary hover:underline font-medium"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
