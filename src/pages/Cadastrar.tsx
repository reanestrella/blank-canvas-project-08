import { useState, useEffect } from "react";
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
import { Church, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isValidUUID, getRoleBasedRedirect } from "@/lib/getRoleBasedRedirect";
import { applyInvitationForUser } from "@/lib/authInvitation";
import { clearAuthBrowserCache } from "@/lib/authProfile";

const cadastroSchema = z.object({
  fullName: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  phone: z.string().optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  tipo: z.enum(["visitante", "membro"]),
  isBaptized: z.enum(["sim", "nao"]),
});

type CadastroFormData = z.infer<typeof cadastroSchema>;

export default function Cadastrar() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 🔥 TOKEN como fonte única de verdade (URL → sessionStorage)
  const urlToken = searchParams.get("token")?.trim() || null;
  const storedToken = typeof window !== "undefined"
    ? sessionStorage.getItem("pending_invite_token")
    : null;
  const token = urlToken || storedToken;
  const validToken = !!token && isValidUUID(token);

  // Persistir token assim que a página carrega
  useEffect(() => {
    if (urlToken && isValidUUID(urlToken)) {
      sessionStorage.setItem("pending_invite_token", urlToken);
    }
  }, [urlToken]);

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
    if (!validToken || !token) {
      setErrorMsg("Convite inválido. Solicite um novo link de convite.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Garante que o token esteja salvo antes do signUp
      sessionStorage.setItem("pending_invite_token", token);

      // 1. CRIAR USUÁRIO (sem church_id — vínculo virá pelo convite)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone || null,
            birth_date: data.birthDate || null,
            tipo: data.tipo,
          },
        },
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Falha ao criar conta.");

      // 2. LOGIN AUTOMÁTICO para obter sessão válida
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        toast({
          title: "Conta criada!",
          description: "Confirme seu email e faça login para aceitar o convite.",
        });
        navigate("/login");
        return;
      }

      // 3. Pequeno delay para garantir trigger handle_new_user
      await new Promise((resolve) => setTimeout(resolve, 400));

      // 4. APLICAR CONVITE via RPC (token é a fonte de vínculo com igreja)
      const pendingToken = sessionStorage.getItem("pending_invite_token");
      let roles: string[] = [];

      if (pendingToken) {
        try {
          const currentUser = (await supabase.auth.getUser()).data.user ?? authData.user;
          const result = await applyInvitationForUser(pendingToken, currentUser!);
          sessionStorage.removeItem("pending_invite_token");
          roles = result.roles || [];
          toast({ title: "Bem-vindo(a)!", description: "Convite aceito com sucesso." });
        } catch (inviteError: any) {
          console.error("[Cadastrar] applyInvitationForUser error:", inviteError);
          toast({
            title: "Conta criada, mas houve erro ao aplicar convite.",
            description: inviteError.message,
            variant: "destructive",
          });
        }
      }

      // 5. REDIRECIONAR baseado no role
      const redirectTo = getRoleBasedRedirect(roles);
      // Hard reload garante que AuthContext carregue church_id e roles atualizados
      await clearAuthBrowserCache();
      window.location.href = redirectTo;
    } catch (error: any) {
      console.error("[Cadastrar] error:", error);
      setErrorMsg(
        error.message === "User already registered"
          ? "Este email já está cadastrado. Faça login para aceitar o convite."
          : error.message || "Erro ao cadastrar."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 🚫 Token ausente ou inválido → bloqueia o cadastro
  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Convite necessário</CardTitle>
            <CardDescription>
              O cadastro só pode ser feito a partir de um link de convite válido.
              <br />
              Solicite um link ao administrador da sua igreja.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link to="/">Ir para a página inicial</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 gradient-primary rounded-full flex items-center justify-center mb-4">
            <Church className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle>Criar Conta</CardTitle>
          <CardDescription>
            Você foi convidado(a) para uma igreja.
            <br />
            Preencha seus dados para entrar.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {errorMsg && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 mb-3">
              {errorMsg}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo *</FormLabel>
                  <FormControl><Input placeholder="Seu nome" {...field} /></FormControl>
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
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="birthDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de nascimento</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormLabel>Batizado(a)?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="animate-spin mr-2 w-4 h-4" />}
                Criar conta e entrar
              </Button>
            </form>
          </Form>

          <div className="text-center mt-4 text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link
              to={`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
              className="text-primary hover:underline font-medium"
            >
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
