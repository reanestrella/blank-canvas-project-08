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

    if (!validToken || !token) {
      setErrorMsg("Convite inválido.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      sessionStorage.setItem("pending_invite_token", token);

      // 1. SIGN UP
      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: form.phone || null,
            birth_date: form.birthDate || null,
            tipo: form.tipo,
          },
        },
      });

      if (authError) throw authError;

      // 2. SIGN IN
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        toast({
          title: "Conta criada!",
          description: "Faça login para continuar.",
        });
        navigate("/login");
        return;
      }

      // 🔥 3. GARANTE USUÁRIO (ANTI BUG MASTER)
      let user = null;

      for (let i = 0; i < 10; i++) {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          user = currentUser;
          break;
        }

        await new Promise((r) => setTimeout(r, 300));
      }

      if (!user) throw new Error("Usuário não autenticado.");

      // 4. GARANTE PROFILE
      await supabase.from("profiles").upsert({
        user_id: user.id,
        full_name: form.fullName,
        email: form.email,
      } as never);

      // 5. APLICA CONVITE
      const pendingToken = sessionStorage.getItem("pending_invite_token");
      let roles: string[] = [];

      if (pendingToken) {
        try {
          const result = await applyInvitationForUser(pendingToken, user);

          roles = result?.roles || [];

          sessionStorage.removeItem("pending_invite_token");

          toast({
            title: "Bem-vindo!",
            description: "Convite aplicado com sucesso",
          });
        } catch (err: any) {
          console.error("Erro convite:", err);

          toast({
            title: "Erro ao aplicar convite",
            description: err.message,
            variant: "destructive",
          });
        }
      }

      // 6. FALLBACK DE ROLES
      if (!roles || roles.length === 0) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (data && data.length > 0) {
          roles = data.map((r: any) => r.role);
        } else {
          roles = ["membro"];
        }
      }

      // 7. REFRESH SESSION
      await supabase.auth.refreshSession();
      await new Promise((r) => setTimeout(r, 500));

      // 8. REDIRECT SEGURO
      let redirectTo = getRoleBasedRedirect(roles);

      if (!redirectTo || typeof redirectTo !== "string") {
        redirectTo = "/dashboard"; // fallback seguro
      }

      console.log("REDIRECT FINAL:", redirectTo);

      window.location.href = redirectTo;
    } catch (error: any) {
      console.error("ERRO:", error);

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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Convite inválido</CardTitle>
            <CardDescription>Solicite um novo link.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>Voltar</Button>
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
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Preencha para entrar na igreja</CardDescription>
        </CardHeader>

        <CardContent>
          {errorMsg && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Nome" value={form.fullName} onChange={update("fullName")} required />
            <Input type="email" placeholder="Email" value={form.email} onChange={update("email")} required />
            <Input type="password" placeholder="Senha" value={form.password} onChange={update("password")} required />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Criar conta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
