import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { applyInvitationForUser } from "@/lib/authInvitation";
import { isValidUUID, getRoleBasedRedirect } from "@/lib/getRoleBasedRedirect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Church } from "lucide-react";

interface CadastroFormData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  birthDate?: string;
  tipo?: string;
}

export default function Cadastrar() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() || null;
  const validToken = !!token && isValidUUID(token);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState<CadastroFormData>({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    birthDate: "",
    tipo: "membro",
  });

  const update = (key: keyof CadastroFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = form;

    if (!validToken || !token) {
      setErrorMsg("Convite inválido. Solicite um novo link de convite.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      sessionStorage.setItem("pending_invite_token", token);

      // 1. CRIA USUÁRIO
      const { error: authError } = await supabase.auth.signUp({
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

      // 2. LOGIN FORÇADO
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        toast({ title: "Conta criada!", description: "Faça login para continuar." });
        navigate("/login");
        return;
      }

      // 3. ESPERA (evita race condition)
      await new Promise((r) => setTimeout(r, 1000));

      // 4. PEGA USUÁRIO REAL
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado após login.");

      console.log("USER OK:", user.id);

      // 5. GARANTE PROFILE
      await supabase.from("profiles").upsert({
        user_id: user.id,
        full_name: data.fullName,
        email: data.email,
      } as never);

      // 6. APLICA CONVITE
      const pendingToken = sessionStorage.getItem("pending_invite_token");
      let roles: string[] = [];

      if (pendingToken) {
        try {
          const result = await applyInvitationForUser(pendingToken, user);
          roles = result?.roles || [];
          sessionStorage.removeItem("pending_invite_token");
          toast({ title: "Bem-vindo!", description: "Convite aplicado com sucesso" });
        } catch (err: any) {
          console.error("ERRO CONVITE:", err);
          toast({
            title: "Erro ao aplicar convite",
            description: err.message,
            variant: "destructive",
          });
        }
      }

      // 7. FALLBACK
      if (!roles || roles.length === 0) {
        const { data: rolesFromDB } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (rolesFromDB && rolesFromDB.length > 0) {
          roles = rolesFromDB.map((r: any) => r.role);
        } else {
          roles = ["membro"];
        }
      }

      // 8. ATUALIZA SESSÃO
      await supabase.auth.refreshSession();
      await new Promise((r) => setTimeout(r, 500));

      // 9. REDIRECT SEGURO
      let redirectTo = getRoleBasedRedirect(roles);
      if (!redirectTo || typeof redirectTo !== "string") {
        redirectTo = "/dashboard";
      }

      window.location.href = redirectTo;
    } catch (error: any) {
      console.error("ERRO GERAL:", error);
      setErrorMsg(
        error.message === "User already registered"
          ? "Este email já está cadastrado."
          : error.message || "Erro ao cadastrar."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Convite inválido</CardTitle>
            <CardDescription>
              O link de cadastro requer um convite válido. Solicite um novo link.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate("/")}>Ir para página inicial</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 gradient-primary rounded-full flex items-center justify-center mb-4">
            <Church className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Preencha seus dados para aceitar o convite.</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo *</Label>
              <Input id="fullName" required value={form.fullName} onChange={update("fullName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" required value={form.email} onChange={update("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={update("password")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={form.phone} onChange={update("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={form.birthDate}
                onChange={update("birthDate")}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link
                to={`/login?redirect=${encodeURIComponent(`/accept-invite?token=${encodeURIComponent(token!)}`)}`}
                className="text-primary hover:underline"
              >
                Entrar
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
